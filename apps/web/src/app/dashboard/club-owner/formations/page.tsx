'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { FormationBuilder } from '@/components/FormationBuilder'
import { MobileFormationBuilder } from '@/components/MobileFormationBuilder'
import { useMobileDetection } from '@/hooks/useMobileDetection'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Calendar, MapPin, Clock, CheckCircle2, Info } from 'lucide-react'
import { notifyLineupAnnounced } from '@/services/matchNotificationService'
import { useToast } from '@/context/ToastContext'

interface Player {
 id: string
 player_id: string
 jersey_number: number
 position_assigned: string
 players: {
 id: string
 position: string
 photo_url: string
 unique_player_id: string
 users: {
 first_name: string
 last_name: string
 }
 }
}

interface Match {
 id: string
 match_format: string
 match_date: string
 match_time: string
 status: string
 home_team_id: string
 away_team_id: string
 home_team: {
 team_name: string
 }
 away_team: {
 team_name: string
 }
 stadium?: {
 stadium_name: string
 }
 home_club_name?: string
 away_club_name?: string
 home_club_logo?: string
 away_club_logo?: string
 has_lineup?: boolean
}

export default function FormationsPage() {
 const router = useRouter()
 const searchParams = useSearchParams()
 const { isMobile } = useMobileDetection()
 const { addToast } = useToast()
 const [loading, setLoading] = useState(true)
 const [club, setClub] = useState<any>(null)
 const [team, setTeam] = useState<any>(null)
 const [players, setPlayers] = useState<Player[]>([])
 const [matches, setMatches] = useState<Match[]>([])
 const [selectedMatch, setSelectedMatch] = useState<Match | null>(null)
 const [lastLineupUpdate, setLastLineupUpdate] = useState<number>(0)

 useEffect(() => {
 loadData()
 }, [searchParams])

 useEffect(() => {
 // Check for lineup updates from localStorage
 const checkLineupUpdate = () => {
 const lineupUpdateStr = localStorage.getItem('lineupUpdated')
 if (lineupUpdateStr) {
 try {
 const update = JSON.parse(lineupUpdateStr)
 if (update.timestamp > lastLineupUpdate) {
 setLastLineupUpdate(update.timestamp)
 refreshLineupStatus()
 }
 } catch (e) {
 console.error('Error parsing lineup update:', e)
 }
 }
 }

 // Check immediately on mount
 checkLineupUpdate()

 // Set up interval to check periodically when page is active
 const interval = setInterval(checkLineupUpdate, 1000)

 return () => {
 clearInterval(interval)
 }
 }, [lastLineupUpdate, matches, team])

 const loadData = async () => {
 try {
 const supabase = createClient()
 const { data: { user } } = await supabase.auth.getUser()

 if (!user) {
 router.push('/auth/login')
 return
 }

 // Get club
 const { data: clubData } = await supabase
 .from('clubs')
 .select('*')
 .eq('owner_id', user.id)
 .single()

 if (!clubData) {
 router.push('/dashboard/club-owner')
 return
 }

 setClub(clubData)

 // Check KYC verification status
 if (!clubData.kyc_verified) {
 router.replace('/dashboard/club-owner/kyc')
 return
 }

 // Get team
 const { data: teamData } = await supabase
 .from('teams')
 .select('*')
 .eq('club_id', clubData.id)
 .maybeSingle()

 setTeam(teamData)

 if (teamData) {
 // Fetch squad players
 const { data: squadData } = await supabase
 .from('team_squads')
 .select('*')
 .eq('team_id', teamData.id)

 const squadPlayerIds = [...new Set(squadData?.map(s => s.player_id) || [])]

 if (squadPlayerIds.length > 0) {
 const { data: playersData } = await supabase
 .from('players')
 .select(`
 id,
 position,
 photo_url,
 unique_player_id,
 users (
 first_name,
 last_name
 )
 `)
 .in('id', squadPlayerIds)

 if (playersData && squadData) {
 const playersMap = new Map(playersData.map(p => [p.id, p]))
 const squadPlayers = squadData.map(squad => ({
 ...squad,
 players: playersMap.get(squad.player_id)
 }))
 setPlayers(squadPlayers as Player[])
 }
 }

 // Fetch upcoming matches for this team (only scheduled and ongoing)
 const { data: matchesData } = await supabase
 .from('matches')
 .select(`
 *,
 home_team:teams!matches_home_team_id_fkey(id, team_name),
 away_team:teams!matches_away_team_id_fkey(id, team_name),
 stadium:stadiums(stadium_name)
 `)
 .or(`home_team_id.eq.${teamData.id},away_team_id.eq.${teamData.id}`)
 .in('status', ['scheduled', 'ongoing'])
 .gte('match_date', new Date().toISOString().split('T')[0])
 .order('match_date')
 .order('match_time')
 .limit(10)

 if (matchesData && matchesData.length > 0) {
 // Create a map of team_id to club_id
 const teamToClubMap = new Map()
 teamToClubMap.set(teamData.id, teamData.club_id)

 // Get all unique team IDs from the matches
 const allTeamIds = new Set<string>()
 matchesData.forEach((match) => {
 allTeamIds.add(match.home_team_id)
 allTeamIds.add(match.away_team_id)
 })

 // Fetch club_id for opponent teams
 const missingTeamIds = Array.from(allTeamIds).filter(teamId => !teamToClubMap.has(teamId))

 if (missingTeamIds.length > 0) {
 const { data: missingTeams } = await supabase
 .from('teams')
 .select('id, club_id')
 .in('id', missingTeamIds)

 if (missingTeams) {
 missingTeams.forEach((team) => {
 teamToClubMap.set(team.id, team.club_id)
 })
 }
 }

 // Get all unique club IDs from the matches
 const clubIds = new Set<string>()
 matchesData.forEach((match) => {
 const homeClubId = teamToClubMap.get(match.home_team_id)
 const awayClubId = teamToClubMap.get(match.away_team_id)
 if (homeClubId) clubIds.add(homeClubId)
 if (awayClubId) clubIds.add(awayClubId)
 })

 // Fetch club names and logos for these IDs
 if (clubIds.size > 0) {
 const clubIdArray = Array.from(clubIds)
 let clubsQuery = supabase
 .from('clubs')
 .select('id, club_name, logo_url')

 // Use eq for single value, in for multiple
 if (clubIdArray.length === 1) {
 clubsQuery = clubsQuery.eq('id', clubIdArray[0])
 } else {
 clubsQuery = clubsQuery.in('id', clubIdArray)
 }

 const { data: clubsData } = await clubsQuery

 // Create a map of club_id to club info
 const clubMap = new Map()
 if (clubsData) {
 // Handle both single object and array responses
 const clubsArray = Array.isArray(clubsData) ? clubsData : [clubsData]
 clubsArray.forEach((club) => {
 clubMap.set(club.id, { name: club.club_name, logo: club.logo_url })
 })
 }

 // Enrich matches with club names and logos
 let enrichedMatches = matchesData.map((match) => ({
 ...match,
 home_club_name: clubMap.get(teamToClubMap.get(match.home_team_id))?.name || 'Unknown',
 home_club_logo: clubMap.get(teamToClubMap.get(match.home_team_id))?.logo || null,
 away_club_name: clubMap.get(teamToClubMap.get(match.away_team_id))?.name || 'Unknown',
 away_club_logo: clubMap.get(teamToClubMap.get(match.away_team_id))?.logo || null
 }))

 // Check lineup status for each match
 if (enrichedMatches.length > 0) {
 const lineupChecks = await Promise.all(
 enrichedMatches.map(async (match) => {
 // Check if lineup exists for this specific match with valid data
 const { data: matchSpecificLineup } = await supabase
 .from('team_lineups')
 .select('id, lineup_data')
 .eq('team_id', teamData.id)
 .eq('match_id', match.id)
 .eq('format', match.match_format)
 .limit(1)
 .maybeSingle()

 // Verify lineup has actual player data
 let hasValidLineup = false
 if (matchSpecificLineup) {
 // Check if lineup_data has players
 const hasJsonData = matchSpecificLineup.lineup_data && 
 Array.isArray(matchSpecificLineup.lineup_data) && 
 matchSpecificLineup.lineup_data.length > 0

 if (hasJsonData) {
 hasValidLineup = true
 } else {
 // Fallback: check relational data in team_lineup_players
 const { data: relationPlayers } = await supabase
 .from('team_lineup_players')
 .select('id')
 .eq('lineup_id', matchSpecificLineup.id)
 .limit(1)
 
 hasValidLineup = !!relationPlayers && relationPlayers.length > 0
 }
 }

 return {
 ...match,
 has_lineup: hasValidLineup
 }
 })
 )
 enrichedMatches = lineupChecks
 }

 setMatches(enrichedMatches)

 // If match parameter is provided in URL, auto-select that match
 const matchParam = searchParams.get('match')
 if (matchParam) {
 const matchToSelect = enrichedMatches.find(m => m.id === matchParam)
 if (matchToSelect) {
 setSelectedMatch(matchToSelect)
 }
 }
 } else {
 setMatches(matchesData)

 // If match parameter is provided in URL, auto-select that match
 const matchParam = searchParams.get('match')
 if (matchParam) {
 const matchToSelect = matchesData.find(m => m.id === matchParam)
 if (matchToSelect) {
 setSelectedMatch(matchToSelect)
 }
 }
 }
 }
 }
 } catch (error) {
 console.error('Error:', error)
 } finally {
 setLoading(false)
 }
 }

 const refreshLineupStatus = async () => {
 // Only refresh lineup status if we have matches and team data
 if (matches.length === 0 || !team) return

 try {
 const supabase = createClient()

 const lineupChecks = await Promise.all(
 matches.map(async (match) => {
 // Check if lineup exists for this specific match with valid data
 const { data: matchSpecificLineup } = await supabase
 .from('team_lineups')
 .select('id, lineup_data')
 .eq('team_id', team.id)
 .eq('match_id', match.id)
 .eq('format', match.match_format)
 .limit(1)
 .maybeSingle()

 // Verify lineup has actual player data
 let hasValidLineup = false
 if (matchSpecificLineup) {
 // Check if lineup_data has players
 const hasJsonData = matchSpecificLineup.lineup_data && 
 Array.isArray(matchSpecificLineup.lineup_data) && 
 matchSpecificLineup.lineup_data.length > 0

 if (hasJsonData) {
 hasValidLineup = true
 } else {
 // Fallback: check relational data in team_lineup_players
 const { data: relationPlayers } = await supabase
 .from('team_lineup_players')
 .select('id')
 .eq('lineup_id', matchSpecificLineup.id)
 .limit(1)
 
 hasValidLineup = !!relationPlayers && relationPlayers.length > 0
 }
 }

 return {
 ...match,
 has_lineup: hasValidLineup
 }
 })
 )

 setMatches(lineupChecks)
 } catch (error) {
 console.error('Error refreshing lineup status:', error)
 }
 }

 if (loading) {
 return (
 <div className="min-h-[60vh] flex items-center justify-center">
 <div className="text-center">
 <div className="relative mx-auto w-12 h-12">
 <div className="w-12 h-12 rounded-full border-4 border-teal-200"></div>
 <div className="absolute inset-0 w-12 h-12 rounded-full border-4 border-teal-500 border-t-transparent animate-spin"></div>
 </div>
 <p className="mt-4 text-slate-500 text-sm">Loading formations...</p>
 </div>
 </div>
 )
 }

 if (!team) {
 return (
 <div className="min-h-[60vh] p-4 sm:p-6">
 <Card className="max-w-2xl mx-auto border-2 border-dashed bg-white/90 backdrop-blur-sm shadow-xl rounded-2xl">
 <CardContent className="py-8 sm:py-12">
 <div className="text-center">
 <div className="text-5xl sm:text-6xl mb-4">🏆</div>
 <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
 No Team Created
 </h3>
 <p className="text-gray-600 mb-6 text-sm sm:text-base">
 Create a team first to build formations
 </p>
 <button
 onClick={() => router.push('/dashboard/club-owner/team-management')}
 className="px-5 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-teal-500 to-teal-600 text-white rounded-lg font-semibold hover:from-teal-600 hover:to-teal-700 transition-all shadow-lg text-sm sm:text-base"
 >
 Go to Squad
 </button>
 </div>
 </CardContent>
 </Card>
 </div>
 )
 }

 if (players.length === 0) {
 return (
 <div className="min-h-[60vh] p-4 sm:p-6">
 <Card className="max-w-2xl mx-auto border-2 border-dashed border-amber-300 bg-white/90 backdrop-blur-sm shadow-xl rounded-2xl">
 <CardContent className="py-8 sm:py-12">
 <div className="text-center">
 <div className="text-5xl sm:text-6xl mb-4">⚽</div>
 <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
 No Squad Players
 </h3>
 <p className="text-gray-600 mb-6 text-sm sm:text-base">
 Add players to your squad to create formations
 </p>
 <button
 onClick={() => router.push('/dashboard/club-owner/team-management')}
 className="px-5 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-teal-500 to-teal-600 text-white rounded-lg font-semibold hover:from-teal-600 hover:to-teal-700 transition-all shadow-lg text-sm sm:text-base"
 >
 Go to Squad
 </button>
 </div>
 </CardContent>
 </Card>
 </div>
 )
 }

 // Mobile save lineup handler
 const handleMobileSaveLineup = async (lineupName: string, data: {
   matchId?: string
   format: string
   formation: string
   assignments: Record<string, Player | null>
   selectedPlayers: Set<string>
   substitutePlayers: Player[]
 }) => {
   try {
     const supabase = createClient()

     // Convert format key to match format
     const formatMap: Record<string, string> = {
       '5s': '5-a-side',
       '7s': '7-a-side',
       '11s': '11-a-side'
     }
     const matchFormat = formatMap[data.format] || data.format

   // Build lineup data
   const assignedPlayers = Object.entries(data.assignments)
     .filter(([, player]) => player !== null)
     .map(([positionKey, player]) => ({
       player_id: player!.id,
       position_key: positionKey,
       is_starter: true
     }))

   const substituteData = data.substitutePlayers.map((player, index) => ({
     player_id: player.id,
     position_key: `SUB_${index + 1}`,
     is_starter: false
   }))

   const allPlayers = [...assignedPlayers, ...substituteData]

   // Check if lineup exists for this match/format
   const query = supabase
     .from('team_lineups')
     .select('id')
     .eq('team_id', team?.id)
     .eq('format', matchFormat)

   if (data.matchId) {
     query.eq('match_id', data.matchId)
   } else {
     query.is('match_id', null)
   }

   const { data: existingLineup } = await query.maybeSingle()

   let lineupId: string

   if (existingLineup) {
     // Update existing lineup
     await supabase
       .from('team_lineups')
       .update({
         lineup_name: lineupName,
         formation: data.formation,
         lineup_data: allPlayers,
         updated_at: new Date().toISOString()
       })
       .eq('id', existingLineup.id)
     
     lineupId = existingLineup.id
   } else {
     // Insert new lineup
     const { data: newLineup } = await supabase
       .from('team_lineups')
       .insert({
         team_id: team?.id,
         match_id: data.matchId || null,
         format: matchFormat,
         lineup_name: lineupName,
         formation: data.formation,
         lineup_data: allPlayers
       })
       .select('id')
       .single()
     
     lineupId = newLineup?.id
   }

   // Update team_lineup_players table for relational data and validation
   if (lineupId) {
     // First, delete existing players for this lineup
     await supabase
       .from('team_lineup_players')
       .delete()
       .eq('lineup_id', lineupId)

     // Insert all players into team_lineup_players
     const playersToInsert = allPlayers.map((player, index) => ({
       lineup_id: lineupId,
       player_id: player.player_id,
       position_on_field: player.position_key,
       position_x: null, // Position coordinates not stored in current format
       position_y: null, // Position coordinates not stored in current format
       jersey_number: null, // Jersey numbers not stored in current format
       is_starter: player.is_starter,
       substitute_order: !player.is_starter ? (index + 1) : null
     }))

     if (playersToInsert.length > 0) {
       const { error: playersError } = await supabase
         .from('team_lineup_players')
         .insert(playersToInsert)
       
       if (playersError) {
         console.error('Error inserting team_lineup_players:', playersError)
         throw new Error('Failed to save player lineup data')
       }
     }
   }

   // Send push notifications to players (only for match-specific lineups)
   if (data.matchId && club?.id && team?.id) {
     try {
       // Get match details for notification
       const { data: matchData } = await supabase
         .from('matches')
         .select(`
           id,
           match_date,
           home_team_id,
           away_team_id,
           home_team:teams!matches_home_team_id_fkey(team_name),
           away_team:teams!matches_away_team_id_fkey(team_name)
         `)
         .eq('id', data.matchId)
         .single()

       const isHomeTeam = matchData?.home_team_id === team.id
       const opponentName = isHomeTeam 
         ? (matchData?.away_team as any)?.team_name 
         : (matchData?.home_team as any)?.team_name

       // Get player IDs for notifications
       const starterPlayerIds = Object.values(data.assignments)
         .filter((player): player is Player => player !== null)
         .map(player => player.players.id)

       const substitutePlayerIds = data.substitutePlayers.map(player => player.players.id)

       // Send notifications
       await notifyLineupAnnounced({
         matchId: data.matchId,
         clubId: club.id,
         teamId: team.id,
         opponentName,
         matchDate: matchData?.match_date,
         selectedPlayerIds: starterPlayerIds,
         substitutePlayerIds
       })

       console.log('✅ Mobile lineup notifications sent to players')
     } catch (notifyError) {
       console.error('Error sending mobile lineup notifications:', notifyError)
       // Don't fail the save if notifications fail
     }
   }

   // Trigger lineup update for other components
   localStorage.setItem('lineupUpdated', JSON.stringify({
     timestamp: Date.now(),
     matchId: data.matchId
   }))

     // Show success message
     const matchText = data.matchId ? 'for the selected match' : 'as template'
     addToast({
       title: 'Formation Declared Successfully! 🎉',
       description: `Club has successfully declared formation ${matchText}. Players have been notified.`,
       type: 'success',
       duration: 4000
     })

     // Refresh lineup status
     refreshLineupStatus()
   } catch (error: any) {
     console.error('Error saving mobile lineup:', error)
     addToast({
       title: 'Save Failed',
       description: error.message || 'Failed to save formation. Please try again.',
       type: 'error',
       duration: 4000
     })
   }
 }

 // Mobile load lineup handler
 const handleMobileLoadLineup = async (matchId?: string, format?: string): Promise<{
   assignments: Record<string, Player | null>
   selectedPlayers: Set<string>
   substitutePlayers: Player[]
   formation: string
 } | null> => {
   if (!team?.id || !format) return null

   const supabase = createClient()

   // Convert format key to match format
   const formatMap: Record<string, string> = {
     '5s': '5-a-side',
     '7s': '7-a-side',
     '11s': '11-a-side'
   }
   const matchFormat = formatMap[format] || format

   // Try to load match-specific lineup first
   let query = supabase
     .from('team_lineups')
     .select('*')
     .eq('team_id', team.id)
     .eq('format', matchFormat)

   if (matchId) {
     query = query.eq('match_id', matchId)
   } else {
     query = query.is('match_id', null)
   }

   const { data: lineup } = await query.maybeSingle()

   // If no match-specific lineup, try template
   if (!lineup && matchId) {
     const { data: templateLineup } = await supabase
       .from('team_lineups')
       .select('*')
       .eq('team_id', team.id)
       .eq('format', matchFormat)
       .is('match_id', null)
       .maybeSingle()

     if (!templateLineup) return null

     // Use template lineup
     return processLineupData(templateLineup)
   }

   if (!lineup) return null

   return processLineupData(lineup)
 }

 // Helper to process lineup data
 const processLineupData = (lineup: any) => {
   const lineupData = lineup.lineup_data || []
   const assignments: Record<string, Player | null> = {}
   const selectedPlayerIds = new Set<string>()
   const subs: Player[] = []

   lineupData.forEach((item: any) => {
     const player = players.find(p => p.id === item.player_id)
     if (player) {
       selectedPlayerIds.add(player.id)
       if (item.is_starter && item.position_key) {
         assignments[item.position_key] = player
       } else {
         subs.push(player)
       }
     }
   })

   return {
     assignments,
     selectedPlayers: selectedPlayerIds,
     substitutePlayers: subs,
     formation: lineup.formation || '2-2'
   }
 }

 // Render mobile-optimized wizard for mobile devices
 if (isMobile) {
   return (
     <MobileFormationBuilder
       players={players}
       matches={matches}
       teamId={team?.id}
       clubId={club?.id}
       onSaveLineup={handleMobileSaveLineup}
       onLoadLineup={handleMobileLoadLineup}
     />
   )
 }

 return (
 <div className="min-h-screen">
 <main className="p-4 sm:p-6 lg:p-8">
 {/* Header Section */}
 <div className="mb-4 sm:mb-6">
 <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
 <div>
 <p className="text-teal-600 font-medium mb-1 text-sm">welcome back 👋</p>
 <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900">Formation & Playing XI</h1>
 <p className="text-gray-600 mt-1 sm:mt-2 text-xs sm:text-sm">
 Build your tactical formation and declare your starting lineup
 </p>
 </div>
 </div>
 </div>

 {/* Upcoming Matches Section */}
 {matches.length > 0 && (
 <div className="mb-6 sm:mb-8">
 <div className="mb-4 sm:mb-5">
 <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">Your Upcoming Matches</h2>
 <p className="text-xs sm:text-sm text-gray-600">Click on a match card to build your formation and declare Playing XI</p>
 </div>
 <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5">
 {matches.map((match) => {
 const isHomeTeam = match.home_team_id === team?.id
 const opponentName = isHomeTeam ? match.away_club_name : match.home_club_name
 const opponentLogo = isHomeTeam ? match.away_club_logo : match.home_club_logo
 const yourLogo = isHomeTeam ? match.home_club_logo : match.away_club_logo
 const isSelected = selectedMatch?.id === match.id

 return (
 <Card
 key={match.id}
 className={`group cursor-pointer transition-all duration-300 border-2 overflow-hidden rounded-xl sm:rounded-2xl ${
 isSelected
 ? 'border-teal-500 shadow-xl shadow-teal-100 scale-[1.02]'
 : 'border-transparent hover:border-teal-200 hover:shadow-lg'
 }`}
 onClick={() => setSelectedMatch(isSelected ? null : match)}
 >
 {/* Top Accent Bar */}
 <div className={`h-1 sm:h-1.5 ${
 match.match_format === '5-a-side' ? 'bg-gradient-to-r from-orange-400 to-orange-600' :
 match.match_format === '7-a-side' ? 'bg-gradient-to-r from-emerald-400 to-emerald-600' :
 'bg-gradient-to-r from-blue-400 to-blue-600'
 }`} />

 <CardContent className="p-3 sm:p-5">
 {/* Status Badges */}
 <div className="flex items-center justify-between mb-3 sm:mb-4">
 <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
 <Badge
 variant="outline"
 className={`${
 match.match_format === '5-a-side' ? 'border-orange-300 bg-orange-50 text-orange-700' :
 match.match_format === '7-a-side' ? 'border-emerald-300 bg-emerald-50 text-emerald-700' :
 'border-blue-300 bg-blue-50 text-blue-700'
 } font-semibold text-[10px] sm:text-xs`}
 >
 {match.match_format}
 </Badge>
 <Badge
 variant="outline"
 className={`${
 isHomeTeam
 ? 'border-teal-300 bg-teal-50 text-teal-700'
 : 'border-gray-300 bg-gray-50 text-gray-700'
 } text-[10px] sm:text-xs`}
 >
 {isHomeTeam ? 'HOME' : 'AWAY'}
 </Badge>
 </div>
 {isSelected && (
 <div className="flex items-center gap-1 sm:gap-1.5 bg-teal-500 text-white px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-semibold animate-pulse">
 <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-white rounded-full" />
 Active
 </div>
 )}
 </div>

 {/* Match-up Display */}
 <div className="mb-3 sm:mb-5 bg-gradient-to-br from-gray-50 to-white p-3 sm:p-4 rounded-xl border border-gray-100">
 <div className="flex items-center justify-between gap-2 sm:gap-3">
 {/* Your Club */}
 <div className="flex flex-col items-center flex-1 group-hover:scale-105 transition-transform">
 <div className="relative mb-1.5 sm:mb-2">
 {yourLogo ? (
 <img
 src={yourLogo}
 alt="Your Club"
 className="w-10 h-10 sm:w-14 sm:h-14 rounded-full object-cover shadow-md ring-2 ring-teal-400"
 />
 ) : (
 <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center shadow-md ring-2 ring-teal-300">
 <span className="text-white font-bold text-xs sm:text-base">YOU</span>
 </div>
 )}
 </div>
 <span className="text-[10px] sm:text-xs font-bold text-gray-800 text-center line-clamp-2 px-1">
 {club?.club_name}
 </span>
 </div>

 {/* VS Badge */}
 <div className="flex-shrink-0">
 <div className="bg-gradient-to-br from-gray-700 to-gray-900 text-white font-black text-[10px] sm:text-xs px-2 py-1 sm:px-3 sm:py-1.5 rounded-lg shadow-md">
 VS
 </div>
 </div>

 {/* Opponent Club */}
 <div className="flex flex-col items-center flex-1 group-hover:scale-105 transition-transform">
 <div className="relative mb-1.5 sm:mb-2">
 {opponentLogo ? (
 <img
 src={opponentLogo}
 alt={opponentName}
 className="w-10 h-10 sm:w-14 sm:h-14 rounded-full object-cover shadow-md ring-2 ring-gray-300"
 />
 ) : (
 <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center shadow-md ring-2 ring-gray-200">
 <span className="text-gray-700 font-bold text-sm sm:text-xl">
 {opponentName?.charAt(0) || '?'}
 </span>
 </div>
 )}
 </div>
 <span className="text-[10px] sm:text-xs font-bold text-gray-800 text-center line-clamp-2 px-1">
 {opponentName}
 </span>
 </div>
 </div>
 </div>

 {/* Match Info */}
 <div className="space-y-2 sm:space-y-2.5 mb-3 sm:mb-4">
 <div className="flex items-center gap-2 sm:gap-2.5 text-sm">
 <div className="flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-blue-50">
 <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-600" />
 </div>
 <div className="flex-1">
 <p className="text-[10px] sm:text-xs text-gray-500 font-medium">Match Date</p>
 <p className="text-xs sm:text-sm font-semibold text-gray-900">
 {new Date(match.match_date).toLocaleDateString('en-US', {
 weekday: 'short',
 month: 'short',
 day: 'numeric',
 year: 'numeric'
 })}
 </p>
 </div>
 </div>
 <div className="flex items-center gap-2 sm:gap-2.5 text-sm">
 <div className="flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-purple-50">
 <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-purple-600" />
 </div>
 <div className="flex-1">
 <p className="text-[10px] sm:text-xs text-gray-500 font-medium">Kick-off Time</p>
 <p className="text-xs sm:text-sm font-semibold text-gray-900">{match.match_time}</p>
 </div>
 </div>
 {match.stadium && (
 <div className="flex items-center gap-2 sm:gap-2.5 text-sm">
 <div className="flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-green-50">
 <MapPin className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-600" />
 </div>
 <div className="flex-1">
 <p className="text-[10px] sm:text-xs text-gray-500 font-medium">Venue</p>
 <p className="text-xs sm:text-sm font-semibold text-gray-900 line-clamp-1">{match.stadium.stadium_name}</p>
 </div>
 </div>
 )}
 </div>

 {/* Lineup Status */}
 {typeof match.has_lineup !== 'undefined' && (
 <div className={`mt-3 sm:mt-4 pt-3 sm:pt-4 border-t ${
 match.has_lineup ? 'border-emerald-100' : 'border-amber-100'
 }`}>
 {match.has_lineup ? (
 <div className="space-y-3">
 <div className="flex items-center gap-2 text-emerald-700 bg-gradient-to-r from-emerald-50 to-teal-50 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg border border-emerald-200">
 <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
 <span className="text-[10px] sm:text-xs font-semibold">Playing XI Ready</span>
 </div>
 <Button
 onClick={(e) => {
 e.stopPropagation()
 setSelectedMatch(match)
 }}
 variant="outline"
 size="sm"
 className="w-full h-8 text-xs border-emerald-300 hover:border-emerald-400 hover:bg-emerald-50 text-emerald-700 font-medium"
 >
 ✏️ Update This Lineup
 </Button>
 </div>
 ) : (
 <div className="space-y-3">
 <div className="flex items-center gap-2 text-amber-700 bg-gradient-to-r from-amber-50 to-orange-50 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg border border-amber-200">
 <Info className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
 <span className="text-[10px] sm:text-xs font-semibold">Playing XI Pending</span>
 </div>
 <Button
 onClick={(e) => {
 e.stopPropagation()
 setSelectedMatch(match)
 }}
 className="w-full h-9 text-sm bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white font-semibold shadow-md hover:shadow-lg transition-all"
 >
 ⚡ Declare Playing XI
 </Button>
 </div>
 )}
 </div>
 )}
 </CardContent>
 </Card>
 )
 })}
 </div>

 {selectedMatch && (
 <div className="mt-4 sm:mt-6 p-3 sm:p-5 bg-gradient-to-r from-teal-50 via-teal-50 to-blue-50 border-2 border-teal-200 rounded-xl shadow-sm">
 <div className="flex items-center gap-2 sm:gap-3">
 <div className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 bg-teal-500 rounded-full shadow-md">
 <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
 </div>
 <div className="flex-1 min-w-0">
 <p className="text-[10px] sm:text-xs font-semibold text-teal-600 uppercase tracking-wide mb-0.5">
 Building Formation For
 </p>
 <p className="text-xs sm:text-sm font-bold text-gray-900 truncate">
 {selectedMatch.match_format} match vs{' '}
 {selectedMatch.home_team_id === team?.id
 ? selectedMatch.away_club_name
 : selectedMatch.home_club_name}
 </p>
 </div>
 <Badge className="bg-teal-500 text-white text-[10px] sm:text-xs">Selected</Badge>
 </div>
 </div>
 )}
 </div>
 )}

 {/* Main Content - Full Width */}
 <div className="bg-white rounded-2xl sm:rounded-3xl shadow-xl overflow-hidden border border-slate-200">
 <div className="p-4 sm:p-6">
 <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 sm:mb-4 gap-2">
 <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
 {selectedMatch ? 'Match Formation' : 'Formation Templates'}
 </h2>
 <div className="text-xs sm:text-sm text-gray-500">
 {players.length} players available
 </div>
 </div>

 {/* Formation Builder Component */}
 <FormationBuilder
 players={players}
 clubId={club?.id}
 teamId={team?.id}
 matchId={selectedMatch?.id}
 matchFormat={selectedMatch?.match_format}
 />
 </div>
 </div>
 </main>
 </div>
 )
}
