/**
 * Match & Lineup Notification Service
 * Handles push notifications for match creation, lineup announcements, and related events
 */

import { createClient } from '@/lib/supabase/client'
import { sendPushToUsers, sendPushToUser } from '@/services/sendPushNotification'

export interface MatchNotificationData {
  matchId: string
  clubId: string
  teamId?: string
  opponentName: string
  matchDate: string
  matchTime?: string
  venue?: string
  matchFormat?: string
}

export interface LineupNotificationData {
  matchId?: string
  clubId: string
  teamId: string
  opponentName?: string
  matchDate?: string
  selectedPlayerIds: string[]  // Player table IDs (not user IDs)
  substitutePlayerIds?: string[]  // Player table IDs (not user IDs)
}

/**
 * Get all player user IDs from a team/club
 */
export async function getTeamPlayerUserIds(clubId: string, teamId?: string): Promise<string[]> {
  const supabase = createClient()
  
  try {
    // Get players from team_squads with their user_id
    let query = supabase
      .from('team_squads')
      .select(`
        player_id,
        players!inner(
          id,
          user_id
        )
      `)
    
    if (teamId) {
      query = query.eq('team_id', teamId)
    }
    
    // Filter by club if no team specified
    if (!teamId && clubId) {
      // Get teams for this club first
      const { data: teams } = await supabase
        .from('teams')
        .select('id')
        .eq('club_id', clubId)
      
      if (teams && teams.length > 0) {
        const teamIds = teams.map(t => t.id)
        query = query.in('team_id', teamIds)
      }
    }
    
    const { data, error } = await query
    
    if (error) {
      console.error('Error fetching team players:', error)
      return []
    }
    
    // Extract user IDs from nested player data
    const userIds = data
      ?.map(item => {
        const player = Array.isArray(item.players) ? item.players[0] : item.players
        return player?.user_id
      })
      .filter((id): id is string => !!id) || []
    
    return [...new Set(userIds)] // Remove duplicates
  } catch (error) {
    console.error('Error in getTeamPlayerUserIds:', error)
    return []
  }
}

/**
 * Convert player IDs to user IDs
 */
export async function playerIdsToUserIds(playerIds: string[]): Promise<string[]> {
  if (!playerIds || playerIds.length === 0) return []
  
  const supabase = createClient()
  
  try {
    const { data, error } = await supabase
      .from('players')
      .select('id, user_id')
      .in('id', playerIds)
    
    if (error) {
      console.error('Error converting player IDs to user IDs:', error)
      return []
    }
    
    return data?.map(p => p.user_id).filter((id): id is string => !!id) || []
  } catch (error) {
    console.error('Error in playerIdsToUserIds:', error)
    return []
  }
}

/**
 * Notify all team players about a new match
 */
export async function notifyMatchCreated(data: MatchNotificationData): Promise<void> {
  try {
    const playerUserIds = await getTeamPlayerUserIds(data.clubId, data.teamId)
    
    if (playerUserIds.length === 0) {
      console.log('No players to notify for match creation')
      return
    }
    
    const formattedDate = new Date(data.matchDate).toLocaleDateString('en-IN', {
      weekday: 'short',
      day: 'numeric',
      month: 'short'
    })
    
    const timeStr = data.matchTime ? ` at ${data.matchTime}` : ''
    const formatStr = data.matchFormat ? ` (${data.matchFormat})` : ''
    
    await sendPushToUsers(
      playerUserIds,
      '🏆 New Match Scheduled',
      `vs ${data.opponentName} on ${formattedDate}${timeStr}${formatStr}`,
      `/dashboard/player/matches`
    )
    
    console.log(`✅ Match creation notification sent to ${playerUserIds.length} players`)
  } catch (error) {
    console.error('Error sending match creation notifications:', error)
  }
}

/**
 * Notify opponent club about a match request/creation
 */
export async function notifyOpponentClub(
  opponentClubId: string,
  challengerClubName: string,
  matchDate: string,
  matchFormat?: string
): Promise<void> {
  try {
    const supabase = createClient()
    
    // Get opponent club owner
    const { data: club } = await supabase
      .from('clubs')
      .select('owner_id')
      .eq('id', opponentClubId)
      .single()
    
    if (!club?.owner_id) {
      console.log('No opponent club owner found')
      return
    }
    
    const formattedDate = new Date(matchDate).toLocaleDateString('en-IN', {
      weekday: 'short',
      day: 'numeric',
      month: 'short'
    })
    
    const formatStr = matchFormat ? ` (${matchFormat})` : ''
    
    await sendPushToUser(
      club.owner_id,
      '⚽ Match Challenge Received',
      `${challengerClubName} wants to play on ${formattedDate}${formatStr}`,
      `/dashboard/club-owner/matches`
    )
    
    console.log('✅ Match challenge notification sent to opponent club owner')
  } catch (error) {
    console.error('Error notifying opponent club:', error)
  }
}

/**
 * Notify stadium owner when their venue is booked for a match
 */
export async function notifyStadiumOwner(
  stadiumId: string,
  challengerClubName: string,
  opponentClubName: string,
  matchDate: string,
  matchTime: string,
  matchFormat?: string
): Promise<void> {
  try {
    const supabase = createClient()
    
    // Get stadium owner
    const { data: stadium } = await supabase
      .from('stadiums')
      .select('owner_id, stadium_name')
      .eq('id', stadiumId)
      .single()
    
    if (!stadium?.owner_id) {
      console.log('No stadium owner found')
      return
    }
    
    const formattedDate = new Date(matchDate).toLocaleDateString('en-IN', {
      weekday: 'short',
      day: 'numeric',
      month: 'short'
    })
    
    const formatStr = matchFormat ? ` (${matchFormat})` : ''
    
    await sendPushToUser(
      stadium.owner_id,
      '🏟️ Stadium Booking Confirmed',
      `${challengerClubName} vs ${opponentClubName}${formatStr} on ${formattedDate} at ${matchTime}`,
      `/dashboard/stadium-owner/bookings`
    )
    
    console.log('✅ Stadium booking notification sent to stadium owner')
  } catch (error) {
    console.error('Error notifying stadium owner:', error)
  }
}

/**
 * Notify own club players about a new match created
 */
export async function notifyOwnClubPlayers(
  clubId: string,
  teamId: string,
  opponentClubName: string,
  matchDate: string,
  matchTime: string,
  matchId: string,
  matchFormat?: string
): Promise<void> {
  try {
    // Get all team player user IDs
    const userIds = await getTeamPlayerUserIds(clubId, teamId)
    
    if (userIds.length === 0) {
      console.log('No players found in the team to notify')
      return
    }
    
    const formattedDate = new Date(matchDate).toLocaleDateString('en-IN', {
      weekday: 'short',
      day: 'numeric',
      month: 'short'
    })
    
    const formatStr = matchFormat ? ` (${matchFormat})` : ''
    
    await sendPushToUsers(
      userIds,
      '⚽ New Match Scheduled!',
      `Match vs ${opponentClubName}${formatStr} on ${formattedDate} at ${matchTime}`,
      `/dashboard/player/matches/${matchId}`
    )
    
    console.log(`✅ Match notification sent to ${userIds.length} players`)
  } catch (error) {
    console.error('Error notifying own club players:', error)
  }
}

/**
 * Notify players selected for starting XI
 */
export async function notifyStartingXI(data: LineupNotificationData): Promise<void> {
  try {
    if (!data.selectedPlayerIds || data.selectedPlayerIds.length === 0) {
      console.log('No starting players to notify')
      return
    }
    
    // Convert player IDs to user IDs
    const userIds = await playerIdsToUserIds(data.selectedPlayerIds)
    
    if (userIds.length === 0) {
      console.log('No user IDs found for starting players')
      return
    }
    
    const opponentStr = data.opponentName ? ` against ${data.opponentName}` : ''
    const dateStr = data.matchDate 
      ? ` on ${new Date(data.matchDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`
      : ''
    
    await sendPushToUsers(
      userIds,
      '⚽ You\'re in the Starting XI!',
      `You've been selected to start${opponentStr}${dateStr}`,
      data.matchId ? `/dashboard/player/matches/${data.matchId}` : '/dashboard/player/matches'
    )
    
    console.log(`✅ Starting XI notification sent to ${userIds.length} players`)
  } catch (error) {
    console.error('Error sending starting XI notifications:', error)
  }
}

/**
 * Notify substitute players
 */
export async function notifySubstitutes(data: LineupNotificationData): Promise<void> {
  try {
    if (!data.substitutePlayerIds || data.substitutePlayerIds.length === 0) {
      console.log('No substitute players to notify')
      return
    }
    
    // Convert player IDs to user IDs
    const userIds = await playerIdsToUserIds(data.substitutePlayerIds)
    
    if (userIds.length === 0) {
      console.log('No user IDs found for substitute players')
      return
    }
    
    const opponentStr = data.opponentName ? ` against ${data.opponentName}` : ''
    const dateStr = data.matchDate 
      ? ` on ${new Date(data.matchDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`
      : ''
    
    await sendPushToUsers(
      userIds,
      '🔄 You\'re on the Bench',
      `You're a substitute${opponentStr}${dateStr}`,
      data.matchId ? `/dashboard/player/matches/${data.matchId}` : '/dashboard/player/matches'
    )
    
    console.log(`✅ Substitute notification sent to ${userIds.length} players`)
  } catch (error) {
    console.error('Error sending substitute notifications:', error)
  }
}

/**
 * Notify players NOT selected for the match (optional)
 */
export async function notifyNotSelected(
  clubId: string,
  teamId: string,
  selectedPlayerIds: string[],
  substitutePlayerIds: string[],
  opponentName?: string,
  matchDate?: string
): Promise<void> {
  try {
    // Get all team players
    const allUserIds = await getTeamPlayerUserIds(clubId, teamId)
    
    // Get user IDs for selected and substitute players
    const selectedUserIds = await playerIdsToUserIds(selectedPlayerIds)
    const substituteUserIds = await playerIdsToUserIds(substitutePlayerIds)
    
    // Find players not in either list
    const selectedSet = new Set([...selectedUserIds, ...substituteUserIds])
    const notSelectedUserIds = allUserIds.filter(id => !selectedSet.has(id))
    
    if (notSelectedUserIds.length === 0) {
      console.log('All players are selected or substitutes')
      return
    }
    
    const opponentStr = opponentName ? ` against ${opponentName}` : ''
    
    await sendPushToUsers(
      notSelectedUserIds,
      '📋 Team Selection Update',
      `Lineup announced for the upcoming match${opponentStr}`,
      '/dashboard/player/matches'
    )
    
    console.log(`✅ Not selected notification sent to ${notSelectedUserIds.length} players`)
  } catch (error) {
    console.error('Error sending not selected notifications:', error)
  }
}

/**
 * Complete lineup announcement - notifies all relevant players
 */
export async function notifyLineupAnnounced(data: LineupNotificationData): Promise<void> {
  try {
    // Notify starting XI
    await notifyStartingXI(data)
    
    // Notify substitutes
    if (data.substitutePlayerIds && data.substitutePlayerIds.length > 0) {
      await notifySubstitutes(data)
    }
    
    console.log('✅ All lineup notifications sent')
  } catch (error) {
    console.error('Error in notifyLineupAnnounced:', error)
  }
}

/**
 * Notify club owner when a contract is signed (push notification)
 * Note: Database notification is already created in contractService.ts
 */
export async function notifyContractSigned(
  clubId: string,
  playerName: string,
  contractId: string
): Promise<void> {
  try {
    const supabase = createClient()
    
    // Get club owner
    const { data: club } = await supabase
      .from('clubs')
      .select('owner_id, club_name')
      .eq('id', clubId)
      .single()
    
    if (!club?.owner_id) {
      console.log('No club owner found for contract notification')
      return
    }
    
    await sendPushToUser(
      club.owner_id,
      '✅ Contract Signed',
      `${playerName} has signed the contract`,
      `/dashboard/club-owner/contracts/${contractId}/view`
    )
    
    console.log('✅ Contract signed push notification sent to club owner')
  } catch (error) {
    console.error('Error sending contract signed push notification:', error)
  }
}

/**
 * Notify player about a new contract offer (push notification)
 */
export async function notifyNewContractOffer(
  playerUserId: string,
  clubName: string,
  contractId: string
): Promise<void> {
  try {
    await sendPushToUser(
      playerUserId,
      '📝 New Contract Offer',
      `${clubName} has sent you a contract offer`,
      `/dashboard/player/contracts/${contractId}/view`
    )
    
    console.log('✅ New contract offer push notification sent to player')
  } catch (error) {
    console.error('Error sending new contract offer push notification:', error)
  }
}
