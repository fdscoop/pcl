import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { notifyMatchCanceled, notifyStadiumMatchCanceled, notifyPlayersMatchCanceled } from '@/services/matchNotificationService'

export async function POST(request: NextRequest) {
  try {
    const { matchId, reason } = await request.json()

    if (!matchId) {
      return NextResponse.json({ error: 'Match ID is required' }, { status: 400 })
    }

    const supabase = await createClient()

    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get match details before canceling
    const { data: match, error: matchError } = await supabase
      .from('matches')
      .select(`
        *,
        home_team:teams!matches_home_team_id_fkey(
          id,
          team_name,
          club_id
        ),
        away_team:teams!matches_away_team_id_fkey(
          id,
          team_name,
          club_id
        ),
        stadium:stadiums(
          id,
          stadium_name,
          owner_id
        )
      `)
      .eq('id', matchId)
      .single()

    if (matchError || !match) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 })
    }

    // Check if user is authorized to cancel this match (must be club owner)
    const { data: userProfile } = await supabase
      .from('users')
      .select('id, role')
      .eq('id', user.id)
      .single()

    if (!userProfile || userProfile.role !== 'club_owner') {
      return NextResponse.json({ error: 'Only club owners can cancel matches' }, { status: 403 })
    }

    // Get user's club
    const { data: userClub } = await supabase
      .from('clubs')
      .select('id')
      .eq('owner_id', user.id)
      .single()

    if (!userClub) {
      return NextResponse.json({ error: 'Club not found' }, { status: 404 })
    }

    // Verify user owns either home or away club
    const isHomeClub = match.home_team?.club_id === userClub.id
    const isAwayClub = match.away_team?.club_id === userClub.id

    if (!isHomeClub && !isAwayClub) {
      return NextResponse.json({ error: 'You can only cancel matches involving your club' }, { status: 403 })
    }

    // Check if match can be canceled (only pending/scheduled matches)
    if (match.status !== 'pending' && match.status !== 'scheduled') {
      return NextResponse.json({ error: 'Cannot cancel completed or ongoing matches' }, { status: 400 })
    }

    // Update match with cancellation details AND status
    const { error: updateError } = await supabase
      .from('matches')
      .update({
        status: 'cancelled',
        canceled_at: new Date().toISOString(),
        canceled_by: user.id,
        cancellation_reason: reason || 'No reason provided'
      })
      .eq('id', matchId)

    if (updateError) {
      console.error('Error updating match:', updateError)
      return NextResponse.json({ error: 'Failed to cancel match' }, { status: 500 })
    }

    // Send notifications to all stakeholders
    const notificationPromises: Promise<void>[] = []

    // Get club details for notifications
    const { data: cancelingClub } = await supabase
      .from('clubs')
      .select('name')
      .eq('id', userClub.id)
      .single()

    const cancelingClubName = cancelingClub?.name || 'Unknown Club'

    // 1. Notify opponent club owner
    const opponentClubId = isHomeClub ? match.away_team?.club_id : match.home_team?.club_id
    if (opponentClubId) {
      notificationPromises.push(
        notifyMatchCanceled(
          opponentClubId,
          cancelingClubName,
          match.match_date,
          match.match_time,
          match.match_format,
          reason
        )
      )
    }

    // 2. Notify stadium owner
    if (match.stadium?.id) {
      const opponentClubName = isHomeClub ? match.away_team?.team_name : match.home_team?.team_name
      notificationPromises.push(
        notifyStadiumMatchCanceled(
          match.stadium.id,
          cancelingClubName,
          opponentClubName || 'Unknown Club',
          match.match_date,
          match.match_time,
          match.match_format
        )
      )
    }

    // 3. Notify own club players (both home and away team players)
    if (match.home_team?.id) {
      const opponentName = match.away_team?.team_name || 'Unknown Team'
      notificationPromises.push(
        notifyPlayersMatchCanceled(
          match.home_team.club_id,
          match.home_team.id,
          opponentName,
          match.match_date,
          match.match_time,
          match.match_format,
          reason
        )
      )
    }

    if (match.away_team?.id) {
      const opponentName = match.home_team?.team_name || 'Unknown Team'
      notificationPromises.push(
        notifyPlayersMatchCanceled(
          match.away_team.club_id,
          match.away_team.id,
          opponentName,
          match.match_date,
          match.match_time,
          match.match_format,
          reason
        )
      )
    }

    // Execute all notifications
    await Promise.allSettled(notificationPromises)

    return NextResponse.json({ 
      message: 'Match canceled successfully',
      match: {
        id: matchId,
        status: 'cancelled',
        home_team: match.home_team,
        away_team: match.away_team,
        stadium: match.stadium,
        match_date: match.match_date,
        match_time: match.match_time,
        match_format: match.match_format
      }
    })

  } catch (error) {
    console.error('Error in cancel match API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}