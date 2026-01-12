'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { filterValidImages } from '@/lib/image-compression'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { NotificationCenter } from '@/components/NotificationCenter'
import { useClubNotifications } from '@/hooks/useClubNotifications'
import { useToast } from '@/context/ToastContext'
import { CreateFriendlyMatch } from './create-friendly-enhanced'
import { 
 Users, 
 Calendar, 
 MapPin, 
 Clock, 
 Plus, 
 Target,
 CheckCircle2,
 Info,
 Calculator,
 UserCheck,
 Shield,
 AlertTriangle,
 ChevronLeft,
 ChevronRight
} from 'lucide-react'

interface Team {
 id: string
 team_name: string
 format: string
 total_players: number
 is_active: boolean
}

interface Match {
 id: string
 match_format: string
 match_date: string
 match_time: string
 status: string
 home_team_id: string
 away_team_id: string
 home_team_score?: number
 away_team_score?: number
 home_team: {
 team_name: string
 }
 away_team: {
 team_name: string
 }
 home_club_name?: string
 away_club_name?: string
 home_club_logo?: string
 away_club_logo?: string
 stadium?: {
 id?: string
 stadium_name: string
 photos?: string[]
 }
 has_lineup?: boolean
}

export default function MatchesPage() {
 const router = useRouter()
 const [loading, setLoading] = useState(true)
 const [club, setClub] = useState<any>(null)
 const [teams, setTeams] = useState<Team[]>([])
 const [matches, setMatches] = useState<Match[]>([])
 const [activeView, setActiveView] = useState<'overview' | 'create-friendly'>('overview')
 const [contractedPlayersCount, setContractedPlayersCount] = useState(0)
 const [selectedMatch, setSelectedMatch] = useState<Match | null>(null)
 const [showMatchDetails, setShowMatchDetails] = useState(false)
 const [homeTeamLineup, setHomeTeamLineup] = useState<any>(null)
 const [awayTeamLineup, setAwayTeamLineup] = useState<any>(null)
 const [selectedTeam, setSelectedTeam] = useState<Team | null>(null)
 const [lastLineupUpdate, setLastLineupUpdate] = useState<number>(0)
 const [cancelingMatch, setCancelingMatch] = useState<string | null>(null)
 const [showCancelDialog, setShowCancelDialog] = useState(false)
 const [matchToCancel, setMatchToCancel] = useState<Match | null>(null)
 const [cancelReason, setCancelReason] = useState('')
 const [currentImageIndex, setCurrentImageIndex] = useState<Record<string, number>>({})
 const { addToast } = useToast()
 const {
 notifications,
 unreadCount,
 loading: notificationsLoading,
 markAsRead,
 markAllAsRead
 } = useClubNotifications(club?.id || null)

 useEffect(() => {
 loadData()
 }, [])

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
 }, [lastLineupUpdate, matches, teams, contractedPlayersCount])

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
 console.log('❌ No club found for user')
 addToast({
 title: 'Club Not Found',
 description: 'Unable to find your club information',
 type: 'error'
 })
 router.push('/dashboard/club-owner')
 return
 }

 console.log('🔍 Club data:', clubData)
 setClub(clubData)

 // Check KYC verification status
 if (!clubData.kyc_verified) {
 router.replace('/dashboard/club-owner/kyc')
 return
 }

 // Get contracted players count
 const { data: contractsData, count } = await supabase
 .from('contracts')
 .select('id', { count: 'exact' })
 .eq('club_id', clubData.id)
 .eq('status', 'active')

 const localContractedPlayersCount = count || 0
 setContractedPlayersCount(localContractedPlayersCount)
 console.log('🔍 Contracted players count:', localContractedPlayersCount)

 // Get teams
 const { data: teamsData } = await supabase
 .from('teams')
 .select('*')
 .eq('club_id', clubData.id)
 .eq('is_active', true)

 console.log('🔍 Teams data:', teamsData)
 setTeams(teamsData || [])

 // Test database schema - check what columns exist in team_lineups
 console.log('🔍 Testing team_lineups table structure...')
 const { data: schemaTest, error: schemaError } = await supabase
 .from('team_lineups')
 .select('*')
 .limit(1)
 
 console.log('🔍 team_lineups table sample:', { schemaTest, schemaError })

 // Get upcoming matches
 let matchesData: any[] = []
 if (teamsData && teamsData.length > 0) {
 const teamIds = teamsData.map(t => t.id).join(',')
 
 console.log('🔍 Querying matches for team IDs:', teamIds)
 
 const { data: matches, error: matchesError } = await supabase
 .from('matches')
 .select(`
 *,
 home_team:teams!matches_home_team_id_fkey(id, team_name),
 away_team:teams!matches_away_team_id_fkey(id, team_name),
 stadium:stadiums(
 id,
 stadium_name
 )
 `)
 .or(`home_team_id.in.(${teamIds}),away_team_id.in.(${teamIds})`)
 .gte('match_date', new Date().toISOString().split('T')[0])
 .is('canceled_at', null) // Only show non-canceled matches
 .order('match_date')
 .limit(10)
 
 console.log('🔍 Raw matches query result:', { matches, matchesError })
 
 if (matchesError) {
 console.error('❌ Error querying matches:', matchesError)
 }
 
 if (matches && matches.length > 0) {
 // Create a map of team_id to club_id from teamsData we already fetched (only our club's teams)
 const teamToClubMap = new Map()
 teamsData.forEach(team => {
 teamToClubMap.set(team.id, team.club_id)
 })

 // Get all unique team IDs from the matches
 const allTeamIds = new Set<string>()
 matches.forEach(match => {
 allTeamIds.add(match.home_team_id)
 allTeamIds.add(match.away_team_id)
 })

 // Fetch club_id for teams that are not in our teamsData (opponent teams)
 const missingTeamIds = Array.from(allTeamIds).filter(teamId => !teamToClubMap.has(teamId))
 
 if (missingTeamIds.length > 0) {
 const { data: missingTeams } = await supabase
 .from('teams')
 .select('id, club_id')
 .in('id', missingTeamIds)

 if (missingTeams) {
 missingTeams.forEach(team => {
 teamToClubMap.set(team.id, team.club_id)
 })
 }
 }
 
 // Get all unique club IDs from the matches
 const clubIds = new Set<string>()
 matches.forEach(match => {
 const homeClubId = teamToClubMap.get(match.home_team_id)
 const awayClubId = teamToClubMap.get(match.away_team_id)
 if (homeClubId) clubIds.add(homeClubId)
 if (awayClubId) clubIds.add(awayClubId)
 })

 // Fetch club names for these IDs
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

 const { data: clubsData, error: clubsError } = await clubsQuery

 // Create a map of club_id to club_name and logo_url
 const clubMap = new Map()
 if (clubsData) {
 // Handle both single object and array responses
 const clubsArray = Array.isArray(clubsData) ? clubsData : [clubsData]
 clubsArray.forEach(club => {
 clubMap.set(club.id, { name: club.club_name, logo: club.logo_url })
 })
 }

 // Enrich matches with club names and logos
 matchesData = matches.map(match => {
 const enriched = {
 ...match,
 home_club_name: clubMap.get(teamToClubMap.get(match.home_team_id))?.name || 'Unknown',
 home_club_logo: clubMap.get(teamToClubMap.get(match.home_team_id))?.logo || null,
 away_club_name: clubMap.get(teamToClubMap.get(match.away_team_id))?.name || 'Unknown',
 away_club_logo: clubMap.get(teamToClubMap.get(match.away_team_id))?.logo || null
 }
 return enriched
 })
 } else {
 matchesData = matches
 }

 // Check lineup status for each match where user's team is playing
 if (matchesData.length > 0) {
 // Get minimum player requirements for each format
 const getMinPlayers = (format: string) => {
 switch (format) {
 case '5-a-side': return 8
 case '7-a-side': return 11
 case '11-a-side': return 14
 default: return 11
 }
 }

 const lineupChecks = await Promise.all(
 matchesData.map(async (match) => {
 // Find which team is the user's team
 const userTeamId = teamsData.find(t =>
 t.id === match.home_team_id || t.id === match.away_team_id
 )?.id

 if (!userTeamId) return { ...match, has_lineup: undefined }

 // Check if club has enough players for this format
 const minPlayersRequired = getMinPlayers(match.match_format)
 const hasEnoughPlayers = localContractedPlayersCount >= minPlayersRequired

 // If not enough players, don't show lineup status at all
 if (!hasEnoughPlayers) {
 return { ...match, has_lineup: undefined }
 }

                // Check if lineup exists for this specific match
                // First check the main team_lineups table
                const { data: matchSpecificLineup, error: lineupError } = await supabase
                  .from('team_lineups')
                  .select('id, lineup_data')
                  .eq('team_id', userTeamId)
                  .eq('match_id', match.id)
                  .eq('format', match.match_format)
                  .limit(1)
                  .maybeSingle()

                // If we have a lineup record, also verify it has players
                let hasValidLineup = false
                if (matchSpecificLineup) {
                  // Check if lineup_data has players OR if relational data exists
                  const hasJsonData = matchSpecificLineup.lineup_data && 
                    Array.isArray(matchSpecificLineup.lineup_data) && 
                    matchSpecificLineup.lineup_data.length > 0

                  if (hasJsonData) {
                    hasValidLineup = true
                  } else {
                    // Fallback: check relational data
                    const { data: relationPlayers } = await supabase
                      .from('team_lineup_players')
                      .select('id')
                      .eq('lineup_id', matchSpecificLineup.id)
                      .limit(1)
                    
                    hasValidLineup = !!relationPlayers && relationPlayers.length > 0
                  }
                }

                // Debug logging
                console.log(`🔍 Lineup check for match ${match.id}:`, {
                  userTeamId,
                  matchId: match.id,
                  format: match.match_format,
                  contractedPlayers: localContractedPlayersCount,
                  minPlayersRequired: getMinPlayers(match.match_format),
                  hasEnoughPlayers: localContractedPlayersCount >= getMinPlayers(match.match_format),
                  lineupRecord: !!matchSpecificLineup,
                  hasValidLineup,
                  jsonDataLength: matchSpecificLineup?.lineup_data?.length || 0,
                  error: lineupError
                })

                return {
 ...match,
 has_lineup: hasValidLineup
 }
 })
 )
 console.log('🔍 Lineup checks completed, final results:', lineupChecks)
 matchesData = lineupChecks
 }
 }

 // Fetch stadium photos for all matches
 if (matchesData.length > 0) {
 const stadiumIds = matchesData
 .filter(m => m.stadium?.id)
 .map(m => m.stadium.id)
 .filter((id, idx, arr) => arr.indexOf(id) === idx) // Remove duplicates

 if (stadiumIds.length > 0) {
 const { data: stadiumPhotos } = await supabase
 .from('stadium_photos')
 .select('stadium_id, photo_data')
 .in('stadium_id', stadiumIds)
 .limit(100)

 // Create a map of stadium_id to photos array
 const photosMap = new Map<string, string[]>()
 if (stadiumPhotos) {
 stadiumPhotos.forEach(photo => {
 if (!photosMap.has(photo.stadium_id)) {
 photosMap.set(photo.stadium_id, [])
 }
 // Validate base64 image before adding to prevent ERR_INVALID_URL errors
 const photoData = photo.photo_data
 if (photoData && 
 photoData.startsWith('data:image/') && 
 photoData.includes(';base64,') &&
 photoData.split(',')[1] && 
 photoData.split(',')[1] !== '=' && 
 photoData.split(',')[1] !== '==') {
 photosMap.get(photo.stadium_id)!.push(photoData)
 }
 })
 }

 // Attach photos to matches
 matchesData = matchesData.map(match => ({
 ...match,
 stadium: match.stadium ? {
 ...match.stadium,
 photos: photosMap.get(match.stadium.id) || []
 } : match.stadium
 }))
 }
 }
 }

 console.log('🔍 Final matchesData before setting state:', matchesData)
 setMatches(matchesData)

 } catch (error) {
 console.error('Error loading data:', error)
 addToast({
 title: 'Error',
 description: 'Failed to load data',
 type: 'error'
 })
 } finally {
 setLoading(false)
 }
 }

 const handleCancelMatch = (match: Match, event: React.MouseEvent) => {
   event.stopPropagation() // Prevent card click event
   setMatchToCancel(match)
   setCancelReason('')
   setShowCancelDialog(true)
 }

 const handleImageNavigation = (matchId: string, direction: 'prev' | 'next', totalImages: number, event: React.MouseEvent) => {
   event.stopPropagation() // Prevent card click event
   
   setCurrentImageIndex(prev => {
     const currentIndex = prev[matchId] || 0
     let newIndex: number
     
     if (direction === 'prev') {
       newIndex = currentIndex === 0 ? totalImages - 1 : currentIndex - 1
     } else {
       newIndex = currentIndex === totalImages - 1 ? 0 : currentIndex + 1
     }
     
     return { ...prev, [matchId]: newIndex }
   })
 }

 const confirmCancelMatch = async () => {
   if (!matchToCancel) return

   setCancelingMatch(matchToCancel.id)
   
   try {
     const response = await fetch('/api/matches/cancel', {
       method: 'POST',
       headers: {
         'Content-Type': 'application/json'
       },
       body: JSON.stringify({
         matchId: matchToCancel.id,
         reason: cancelReason.trim() || 'No reason provided'
       })
     })

     if (!response.ok) {
       const errorData = await response.json()
       throw new Error(errorData.error || 'Failed to cancel match')
     }

     addToast({
       title: 'Match Canceled',
       description: 'Match has been successfully canceled and all stakeholders have been notified',
       type: 'success'
     })

     // Refresh matches to remove the canceled match
     await loadData()
     
   } catch (error: any) {
     console.error('Error canceling match:', error)
     addToast({
       title: 'Error',
       description: error.message || 'Failed to cancel match',
       type: 'error'
     })
   } finally {
     setCancelingMatch(null)
     setShowCancelDialog(false)
     setMatchToCancel(null)
   }
 }

 const refreshLineupStatus = async () => {
 // Only refresh lineup status if we have matches and teams data
 if (matches.length === 0 || teams.length === 0) return

 try {
 const supabase = createClient()

 // Get minimum player requirements for each format
 const getMinPlayers = (format: string) => {
 switch (format) {
 case '5-a-side': return 8
 case '7-a-side': return 11
 case '11-a-side': return 14
 default: return 11
 }
 }

 const lineupChecks = await Promise.all(
 matches.map(async (match) => {
 // Find which team is the user's team
 const userTeamId = teams.find(t =>
 t.id === match.home_team_id || t.id === match.away_team_id
 )?.id

 if (!userTeamId) return { ...match, has_lineup: undefined }

 // Check if club has enough players for this format
 const minPlayersRequired = getMinPlayers(match.match_format)
 const hasEnoughPlayers = contractedPlayersCount >= minPlayersRequired

 // If not enough players, don't show lineup status at all
 if (!hasEnoughPlayers) {
 return { ...match, has_lineup: undefined }
 }

        // Check if lineup exists for this specific match
        // First check the main team_lineups table  
        const { data: matchSpecificLineup, error: lineupError } = await supabase
          .from('team_lineups')
          .select('id, lineup_data')
          .eq('team_id', userTeamId)
          .eq('match_id', match.id)
          .eq('format', match.match_format)
          .limit(1)
          .maybeSingle()

        // If we have a lineup record, also verify it has players
        let hasValidLineup = false
        if (matchSpecificLineup) {
          // Check if lineup_data has players OR if relational data exists
          const hasJsonData = matchSpecificLineup.lineup_data && 
            Array.isArray(matchSpecificLineup.lineup_data) && 
            matchSpecificLineup.lineup_data.length > 0

          if (hasJsonData) {
            hasValidLineup = true
          } else {
            // Fallback: check relational data
            const { data: relationPlayers } = await supabase
              .from('team_lineup_players')
              .select('id')
              .eq('lineup_id', matchSpecificLineup.id)
              .limit(1)
            
            hasValidLineup = !!relationPlayers && relationPlayers.length > 0
          }
        }

        // Debug logging
        console.log(`🔄 Refresh lineup check for match ${match.id}:`, {
          userTeamId,
          matchId: match.id,
          format: match.match_format,
          lineupRecord: !!matchSpecificLineup,
          hasValidLineup,
          jsonDataLength: matchSpecificLineup?.lineup_data?.length || 0,
          error: lineupError
        })

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

 const loadMatchDetails = async (match: Match) => {
 try {
 const supabase = createClient()

 // Determine which team is the user's team
 const userTeamId = teams.find(t =>
 t.id === match.home_team_id || t.id === match.away_team_id
 )?.id

 if (!userTeamId) {
 addToast({
 title: 'Error',
 description: 'Unable to identify your team for this match',
 type: 'error'
 })
 return
 }

    // Only check if lineup exists for this specific match
    // Do not fall back to template lineups - this matches our new card display logic
    const { data: matchSpecificLineup } = await supabase
      .from('team_lineups')
      .select(`
        *,
        team_lineup_players (
          *,
          players (
            id,
            unique_player_id,
            position,
            photo_url,
            users (
              first_name,
              last_name
            )
          )
        )
      `)
      .eq('team_id', userTeamId)
      .eq('match_id', match.id)
      .eq('format', match.match_format)
      .limit(1)
      .maybeSingle()

    // Only use match-specific lineup - no template fallback
    // This ensures modal shows accurate status and encourages specific lineup declaration
    const userLineup = matchSpecificLineup // Set the user's lineup as homeTeamLineup for the modal
 // (The modal variable name is misleading but we're using it to show the user's lineup)
 setHomeTeamLineup(userLineup)
 setAwayTeamLineup(null) // We don't need opponent's lineup for this feature
 setSelectedMatch(match)
 setShowMatchDetails(true)
 } catch (error) {
 console.error('Error loading match details:', error)
 addToast({
 title: 'Error',
 description: 'Failed to load match details',
 type: 'error'
 })
 }
 }

 const getAvailableFormats = () => {
 const formats = []
 if (contractedPlayersCount >= 8) formats.push('5-a-side')
 if (contractedPlayersCount >= 11) formats.push('7-a-side')
 if (contractedPlayersCount >= 14) formats.push('11-a-side')
 return formats
 }

 const getFormatIcon = (format: string) => {
 switch (format) {
 case '5-a-side': return '⚡'
 case '7-a-side': return '🎯'
 case '11-a-side': return '🏆'
 default: return '⚽'
 }
 }

 const getFormatColor = (format: string) => {
 switch (format) {
 case '5-a-side': return 'bg-orange-500'
 case '7-a-side': return 'bg-emerald-500'
 case '11-a-side': return 'bg-blue-500'
 default: return 'bg-gray-500'
 }
 }

 if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="relative mx-auto w-12 h-12">
          <div className="w-12 h-12 rounded-full border-4 border-teal-200"></div>
          <div className="absolute inset-0 w-12 h-12 rounded-full border-4 border-teal-500 border-t-transparent animate-spin"></div>
        </div>
        <p className="mt-4 text-slate-500 text-sm">Loading matches...</p>
      </div>
    )
  }

  if (contractedPlayersCount < 8) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 w-full max-w-full overflow-x-hidden">
        <Alert className="bg-gradient-to-br from-orange-50 via-orange-100 to-orange-50 border-orange-300 shadow-lg rounded-xl">
          <Info className="h-4 w-4" />
          <AlertTitle className="text-orange-800 text-sm sm:text-base">Not Enough Players</AlertTitle>
          <AlertDescription className="text-orange-700 text-sm">
            You need at least 8 players to participate in matches. You currently have {contractedPlayersCount} contracted players. 
            <br />
            <Button 
              onClick={() => router.push('/scout/players')}
              className="mt-3 bg-orange-600 hover:bg-orange-700 text-white text-sm"
              size="sm"
            >
              Scout More Players
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  if (activeView === 'create-friendly') {
    return (
      <div className="p-4 sm:p-6 lg:p-8 w-full max-w-full overflow-x-hidden">
        <div className="mb-4 sm:mb-6">
          <Button
            onClick={() => setActiveView('overview')}
            variant="outline"
            className="mb-4 text-sm"
            size="sm"
          >
            ← Back to Matches
          </Button>
        </div>
        <CreateFriendlyMatch 
          club={club} 
          teams={teams}
          availableFormats={getAvailableFormats()}
          onSuccess={() => {
            setActiveView('overview')
            loadData()
            addToast({
              title: 'Success',
              description: 'Friendly match request sent!',
              type: 'success'
            })
          }}
        />
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6 w-full max-w-full overflow-x-hidden">
      {/* Header - Mobile optimized */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Matches & Fixtures</h1>
          <p className="text-slate-600 text-sm sm:text-base mt-1">
            Create matches and manage your Playing XI
          </p>
        </div>
        <Badge variant="outline" className="text-xs sm:text-sm w-fit bg-teal-50 border-teal-200 text-teal-700">
          {contractedPlayersCount} Players
        </Badge>
      </div>

      {/* Available Formats - Mobile friendly */}
      <Card className="bg-gradient-to-r from-teal-50 via-cyan-50 to-blue-50 border-0 shadow-lg rounded-2xl">
        <CardHeader className="pb-2 sm:pb-4">
          <CardTitle className="flex items-center gap-2 sm:gap-3 text-teal-700 text-base sm:text-lg">
            <div className="p-1.5 sm:p-2 bg-teal-600 rounded-lg shadow-md">
              <Target className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
            </div>
            Available Match Formats
          </CardTitle>
          <CardDescription className="text-slate-700 text-xs sm:text-sm">
            Based on your squad size of <strong>{contractedPlayersCount} players</strong>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            {getAvailableFormats().map((format) => (
              <div
                key={format}
                className="group relative overflow-hidden flex items-center gap-3 p-3 sm:p-5 bg-white rounded-xl border-2 border-slate-100 hover:border-teal-300 hover:shadow-lg transition-all"
              >
                <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl ${getFormatColor(format)} flex items-center justify-center text-white text-xl sm:text-2xl shadow-md group-hover:scale-110 transition-transform`}>
                  {getFormatIcon(format)}
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-slate-900 text-sm sm:text-lg">{format}</h3>
                  <p className="text-[10px] sm:text-xs text-slate-600 font-medium">
                    {format === '5-a-side' && 'Quick & Fast Paced'}
                    {format === '7-a-side' && 'Semi-Professional'}
 {format === '11-a-side' && 'Full Professional'}
 </p>
 </div>
 <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-100 ">
 <CheckCircle2 className="h-5 w-5 text-green-600 " />
 </div>
 </div>
 ))}
 </div>
 </CardContent>
 </Card>

 {/* Create Match Card - Prominent */}
 <Card className="relative overflow-hidden bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 border-2 border-emerald-200 shadow-lg hover:shadow-xl transition-shadow">
 {/* Decorative Elements */}
 <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-emerald-200/30 to-teal-200/30 rounded-full blur-3xl -mr-32 -mt-32" />
 <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-cyan-200/30 to-emerald-200/30 rounded-full blur-3xl -ml-24 -mb-24" />

 <CardHeader className="relative">
 <div className="flex items-center justify-between mb-2">
 <CardTitle className="flex items-center gap-3 text-emerald-700 text-2xl">
 <div className="p-2 bg-emerald-600 rounded-xl shadow-lg">
 <Plus className="h-6 w-6 text-white" />
 </div>
 Create Friendly Match
 </CardTitle>
 <Badge className="bg-emerald-600 text-white px-3 py-1">New</Badge>
 </div>
 <CardDescription className="text-base text-gray-700 ">
 Organize a comprehensive friendly match with complete budget planning and professional staff booking
 </CardDescription>
 </CardHeader>
 <CardContent className="relative">
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
 <div className="group flex items-start gap-3 p-4 bg-white/80 backdrop-blur-sm rounded-xl border border-emerald-100 hover:border-emerald-300 hover:shadow-md transition-all">
 <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-100 to-emerald-100 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
 <Users className="h-6 w-6 text-green-600 " />
 </div>
 <div>
 <h4 className="font-bold text-gray-900 mb-1">Search & Select Opponents</h4>
 <p className="text-xs text-gray-600 ">Browse verified clubs and send match requests</p>
 </div>
 </div>

 <div className="group flex items-start gap-3 p-4 bg-white/80 backdrop-blur-sm rounded-xl border border-blue-100 hover:border-blue-300 hover:shadow-md transition-all">
 <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-100 to-cyan-100 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
 <MapPin className="h-6 w-6 text-blue-600 " />
 </div>
 <div>
 <h4 className="font-bold text-gray-900 mb-1">Choose Stadium</h4>
 <p className="text-xs text-gray-600 ">Select venue with automatic pricing calculation</p>
 </div>
 </div>

 <div className="group flex items-start gap-3 p-4 bg-white/80 backdrop-blur-sm rounded-xl border border-purple-100 hover:border-purple-300 hover:shadow-md transition-all">
 <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-100 to-fuchsia-100 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
 <Calculator className="h-6 w-6 text-purple-600 " />
 </div>
 <div>
 <h4 className="font-bold text-gray-900 mb-1">Budget Calculator</h4>
 <p className="text-xs text-gray-600 ">Automatic cost splitting between both clubs</p>
 </div>
 </div>

 <div className="group flex items-start gap-2 sm:gap-3 p-3 sm:p-4 bg-white/80 backdrop-blur-sm rounded-xl border border-orange-100 hover:border-orange-300 hover:shadow-md transition-all">
 <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-orange-100 to-amber-100 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
 <UserCheck className="h-5 w-5 sm:h-6 sm:w-6 text-orange-600" />
 </div>
 <div>
 <h4 className="font-bold text-slate-900 mb-1 text-sm sm:text-base">Professional Staff</h4>
 <p className="text-[10px] sm:text-xs text-slate-600">Book referees & PCL staff for your match</p>
 </div>
 </div>
 </div>

 <Button
 onClick={() => setActiveView('create-friendly')}
 className="w-full bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-700 hover:via-teal-700 hover:to-cyan-700 text-white font-bold py-5 sm:py-7 text-base sm:text-lg shadow-lg hover:shadow-xl transition-all group"
 size="lg"
 >
 <Plus className="h-5 w-5 sm:h-6 sm:w-6 mr-2 group-hover:rotate-90 transition-transform" />
 Create New Match
 </Button>
 </CardContent>
 </Card>

 {/* Upcoming Matches */}
 {matches.length > 0 && (
 <div>
 <div className="mb-4 sm:mb-5">
 <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-1">Your Upcoming Matches</h2>
 <p className="text-xs sm:text-sm text-slate-600">Click on a match card to view details and declare your Playing XI for that specific match</p>
 </div>
 <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5">
 {matches.map((match) => {
 const isHomeMatch = teams.some(t => t.id === match.home_team_id)
 const opponentName = isHomeMatch ? match.away_club_name : match.home_club_name
 const opponentLogo = isHomeMatch ? match.away_club_logo : match.home_club_logo
 const yourLogo = isHomeMatch ? match.home_club_logo : match.away_club_logo

 return (
 <Card
 key={match.id}
 onClick={() => loadMatchDetails(match)}
 className="group cursor-pointer transition-all duration-300 overflow-hidden rounded-2xl border border-gray-200 sm:border-transparent hover:border-teal-200 hover:shadow-xl"
 >
 {/* Top Accent Bar */}
 <div className={`h-1 sm:h-1.5 ${
 match.match_format === '5-a-side' ? 'bg-gradient-to-r from-orange-400 to-orange-600' :
 match.match_format === '7-a-side' ? 'bg-gradient-to-r from-emerald-400 to-emerald-600' :
 'bg-gradient-to-r from-blue-400 to-blue-600'
 }`} />

 <CardContent className="p-4 sm:p-5">
 {/* Status Badges */}
 <div className="flex items-center justify-between mb-3 sm:mb-4 flex-wrap gap-2">
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
 isHomeMatch
 ? 'border-teal-300 bg-teal-50 text-teal-700'
 : 'border-gray-300 bg-gray-50 text-gray-700'
 } text-[10px] sm:text-xs`}
 >
 {isHomeMatch ? 'HOME' : 'AWAY'}
 </Badge>
 </div>
 <div className="flex items-center gap-2">
 <Badge
 variant="outline"
 className={`${
 match.status === 'scheduled'
 ? 'bg-blue-50 text-blue-700 border-blue-200'
 : 'bg-gray-50 text-gray-700 border-gray-200'
 } text-[10px] sm:text-xs font-semibold`}
 >
 {match.status}
 </Badge>
 </div>
 </div>

 {/* Match-up Display */}
 <div className="mb-4 sm:mb-5 bg-gradient-to-br from-slate-50 to-white p-3 sm:p-4 rounded-xl border border-slate-100">
 <div className="flex items-center justify-between gap-2 sm:gap-3">
 {/* Home Club */}
 <div className="flex flex-col items-center flex-1 group-hover:scale-105 transition-transform">
 <div className="relative mb-1.5 sm:mb-2">
 {match.home_club_logo ? (
 <img
 src={match.home_club_logo}
 alt={match.home_club_name}
 className={`w-10 h-10 sm:w-14 sm:h-14 rounded-full object-cover shadow-md ring-2 ${
 isHomeMatch ? 'ring-teal-400' : 'ring-gray-300'
 }`}
 />
 ) : (
 <div className={`w-10 h-10 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br ${
 isHomeMatch
 ? 'from-teal-400 to-teal-600 ring-teal-300'
 : 'from-gray-200 to-gray-300 ring-gray-200'
 } flex items-center justify-center shadow-md ring-2`}>
 <span className={`${isHomeMatch ? 'text-white' : 'text-gray-700'} font-bold text-sm sm:text-lg`}>
 {match.home_club_name?.charAt(0) || 'H'}
 </span>
 </div>
 )}
 </div>
 <span className="text-[10px] sm:text-xs font-bold text-slate-800 text-center line-clamp-2 px-1">
 {match.home_club_name}
 </span>
 </div>

 {/* VS Badge */}
 <div className="flex-shrink-0">
 <div className="bg-gradient-to-br from-slate-700 to-slate-900 text-white font-black text-[10px] sm:text-xs px-2 py-1 sm:px-3 sm:py-1.5 rounded-lg shadow-md">
 VS
 </div>
 </div>

 {/* Away Club */}
 <div className="flex flex-col items-center flex-1 group-hover:scale-105 transition-transform">
 <div className="relative mb-1.5 sm:mb-2">
 {match.away_club_logo ? (
 <img
 src={match.away_club_logo}
 alt={match.away_club_name}
 className={`w-10 h-10 sm:w-14 sm:h-14 rounded-full object-cover shadow-md ring-2 ${
 !isHomeMatch ? 'ring-teal-400' : 'ring-gray-300'
 }`}
 />
 ) : (
 <div className={`w-10 h-10 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br ${
 !isHomeMatch
 ? 'from-teal-400 to-teal-600 ring-teal-300'
 : 'from-gray-200 to-gray-300 ring-gray-200'
 } flex items-center justify-center shadow-md ring-2`}>
 <span className={`${!isHomeMatch ? 'text-white' : 'text-gray-700'} font-bold text-sm sm:text-lg`}>
 {match.away_club_name?.charAt(0) || 'A'}
 </span>
 </div>
 )}
 </div>
 <span className="text-[10px] sm:text-xs font-bold text-slate-800 text-center line-clamp-2 px-1">
 {match.away_club_name}
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
 <p className="text-[10px] sm:text-xs text-slate-500 font-medium">Match Date</p>
 <p className="text-xs sm:text-sm font-semibold text-slate-900">
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
 <p className="text-[10px] sm:text-xs text-slate-500 font-medium">Kick-off Time</p>
 <p className="text-xs sm:text-sm font-semibold text-slate-900">{match.match_time}</p>
 </div>
 </div>
 {match.stadium && (
 <div className="space-y-2">
 <div className="flex items-center gap-2 sm:gap-2.5 text-sm">
 <div className="flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-green-50">
 <MapPin className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-600" />
 </div>
 <div className="flex-1">
 <p className="text-[10px] sm:text-xs text-slate-500 font-medium">Venue</p>
 <p className="text-xs sm:text-sm font-semibold text-slate-900 line-clamp-1">{match.stadium.stadium_name}</p>
 </div>
 </div>
 
 {/* Stadium Photos */}
 {match.stadium.photos && match.stadium.photos.length > 0 && (
 <div className="mt-2 pl-9 sm:pl-10">
 <div className="relative h-20 sm:h-24 rounded-lg overflow-hidden bg-slate-200 border border-slate-300 shadow-sm">
 {/* Current Image */}
 <img
 src={match.stadium.photos[currentImageIndex[match.id] || 0]}
 alt={`${match.stadium?.stadium_name || 'Stadium'} - Photo ${(currentImageIndex[match.id] || 0) + 1}`}
 className="w-full h-full object-cover"
 onError={(e) => {
 e.currentTarget.style.display = 'none'
 }}
 />
 
 {/* Navigation Arrows */}
 {match.stadium?.photos && match.stadium.photos.length > 1 && (
 <>
 <button
 onClick={(e) => handleImageNavigation(match.id, 'prev', match.stadium?.photos?.length || 0, e)}
 className="absolute left-1 top-1/2 -translate-y-1/2 w-6 h-6 bg-black bg-opacity-50 hover:bg-opacity-70 rounded-full flex items-center justify-center transition-all"
 >
 <ChevronLeft className="h-3 w-3 text-white" />
 </button>
 <button
 onClick={(e) => handleImageNavigation(match.id, 'next', match.stadium?.photos?.length || 0, e)}
 className="absolute right-1 top-1/2 -translate-y-1/2 w-6 h-6 bg-black bg-opacity-50 hover:bg-opacity-70 rounded-full flex items-center justify-center transition-all"
 >
 <ChevronRight className="h-3 w-3 text-white" />
 </button>
 </>
 )}
 
 {/* Image Counter */}
 {match.stadium?.photos && match.stadium.photos.length > 1 && (
 <div className="absolute bottom-1 right-1 bg-black bg-opacity-60 text-white px-2 py-0.5 rounded text-[10px] font-medium">
 {(currentImageIndex[match.id] || 0) + 1} / {match.stadium.photos.length}
 </div>
 )}
 </div>
 
 {/* Cancel Match Button */}
 {(match.status === 'scheduled' || match.status === 'pending') && (
 <div className="mt-3">
 <Button
 onClick={(e) => handleCancelMatch(match, e)}
 variant="outline"
 size="sm"
 disabled={cancelingMatch === match.id}
 className="w-full h-8 text-xs border-red-200 hover:border-red-400 hover:bg-red-50 hover:text-red-700 transition-colors font-medium"
 >
 {cancelingMatch === match.id ? (
 <div className="flex items-center gap-2">
 <div className="w-3 h-3 border border-red-400 border-t-transparent rounded-full animate-spin" />
 <span>Canceling...</span>
 </div>
 ) : (
 <>
 <AlertTriangle className="h-3 w-3 text-red-500 mr-1.5" />
 Cancel Match
 </>
 )}
 </Button>
 </div>
 )}
 </div>
 )}
 
 {/* Cancel Match Button - Show for matches without stadium photos */}
 {(match.status === 'scheduled' || match.status === 'pending') && 
  match.stadium && (!match.stadium.photos || match.stadium.photos.length === 0) && (
 <div className="mt-2 pl-9 sm:pl-10">
 <Button
 onClick={(e) => handleCancelMatch(match, e)}
 variant="outline"
 size="sm"
 disabled={cancelingMatch === match.id}
 className="w-full h-8 text-xs border-red-200 hover:border-red-400 hover:bg-red-50 hover:text-red-700 transition-colors font-medium"
 >
 {cancelingMatch === match.id ? (
 <div className="flex items-center gap-2">
 <div className="w-3 h-3 border border-red-400 border-t-transparent rounded-full animate-spin" />
 <span>Canceling...</span>
 </div>
 ) : (
 <>
 <AlertTriangle className="h-3 w-3 text-red-500 mr-1.5" />
 Cancel Match
 </>
 )}
 </Button>
 </div>
 )}
 
 {/* Cancel Match Button - Show for matches without stadium */}
 {(match.status === 'scheduled' || match.status === 'pending') && !match.stadium && (
 <div className="mt-2">
 <Button
 onClick={(e) => handleCancelMatch(match, e)}
 variant="outline"
 size="sm"
 disabled={cancelingMatch === match.id}
 className="w-full h-8 text-xs border-red-200 hover:border-red-400 hover:bg-red-50 hover:text-red-700 transition-colors font-medium"
 >
 {cancelingMatch === match.id ? (
 <div className="flex items-center gap-2">
 <div className="w-3 h-3 border border-red-400 border-t-transparent rounded-full animate-spin" />
 <span>Canceling...</span>
 </div>
 ) : (
 <>
 <AlertTriangle className="h-3 w-3 text-red-500 mr-1.5" />
 Cancel Match
 </>
 )}
 </Button>
 </div>
 )}
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
 <div className="flex gap-2">
 <Button
 onClick={(e) => {
 e.stopPropagation()
 router.push(`/dashboard/club-owner/formations?match=${match.id}`)
 }}
 variant="outline"
 size="sm"
 className="flex-1 h-8 text-xs border-emerald-300 hover:border-emerald-400 hover:bg-emerald-50 text-emerald-700 font-medium"
 >
 ✏️ Update Lineup
 </Button>
 <Button
 onClick={(e) => {
 e.stopPropagation()
 router.push(`/match/${match.id}`)
 }}
 variant="outline"
 size="sm"
 className="flex-1 h-8 text-xs border-slate-300 hover:border-slate-400 hover:bg-slate-50 text-slate-600 font-medium"
 >
 📋 View Details
 </Button>
 </div>
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
 router.push(`/dashboard/club-owner/formations?match=${match.id}`)
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
 </div>
 )}

 {/* Empty State */}
 {matches.length === 0 && (
 <Card className="rounded-2xl">
 <CardContent className="text-center py-8 sm:py-12">
 <Shield className="h-10 w-10 sm:h-12 sm:w-12 text-slate-400 mx-auto mb-3 sm:mb-4" />
 <h3 className="text-base sm:text-lg font-semibold text-slate-900 mb-2">
 No Upcoming Matches
 </h3>
 <p className="text-slate-600 text-sm mb-4">
 Create your first friendly match to get started
 </p>
 <Button onClick={() => setActiveView('create-friendly')} className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white">
 <Plus className="h-4 w-4 mr-2" />
 Create Your First Match
 </Button>
 </CardContent>
 </Card>
 )}

 {/* Match Details Modal */}
 {showMatchDetails && selectedMatch && (
 <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4">
 <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 rounded-2xl bg-white">
 <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 sm:pb-4 bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200">
 <div>
 <CardTitle className="text-base sm:text-lg text-slate-800">Match Details</CardTitle>
 <CardDescription className="text-xs sm:text-sm text-slate-600">
 {selectedMatch.home_club_name} vs {selectedMatch.away_club_name}
 </CardDescription>
 </div>
 <button
 onClick={() => setShowMatchDetails(false)}
 className="text-slate-400 hover:text-slate-600 hover:bg-slate-200 p-2 rounded-full transition-colors"
 >
 ✕
 </button>
 </CardHeader>

 <CardContent className="space-y-4 sm:space-y-6 pt-4 sm:pt-6">
 {/* Match Info */}
 <div className="grid grid-cols-2 gap-3 sm:gap-4">
 <div className="bg-slate-50 rounded-xl p-3">
 <p className="text-xs sm:text-sm text-slate-500 font-medium">Date</p>
 <p className="font-semibold text-sm sm:text-base text-slate-800">{selectedMatch.match_date}</p>
 </div>
 <div className="bg-slate-50 rounded-xl p-3">
 <p className="text-xs sm:text-sm text-slate-500 font-medium">Time</p>
 <p className="font-semibold text-sm sm:text-base text-slate-800">{selectedMatch.match_time}</p>
 </div>
 <div className="bg-slate-50 rounded-xl p-3">
 <p className="text-xs sm:text-sm text-slate-500 font-medium">Format</p>
 <p className="font-semibold text-sm sm:text-base text-slate-800">{selectedMatch.match_format}</p>
 </div>
 <div className="bg-slate-50 rounded-xl p-3">
 <p className="text-xs sm:text-sm text-slate-500 font-medium">Stadium</p>
 <p className="font-semibold text-sm sm:text-base text-slate-800">{selectedMatch.stadium?.stadium_name || 'N/A'}</p>
 </div>
 </div>

 {/* Formation Tab */}
 <div className="border-t border-slate-200 pt-4 sm:pt-6">
 <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 flex items-center gap-2 text-slate-800">
 Playing XI Status
 {!homeTeamLineup && (
 <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-300 text-[10px] sm:text-xs font-semibold">
 Pending
 </Badge>
 )}
 {homeTeamLineup && (
 <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-300 text-[10px] sm:text-xs font-semibold">
 ✓ Ready
 </Badge>
 )}
 </h3>

 {!homeTeamLineup ? (
 <Alert className="mb-3 sm:mb-4 border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl">
 <Info className="h-4 w-4 text-amber-600" />
 <AlertTitle className="text-amber-800 text-sm font-semibold">Playing XI Not Declared</AlertTitle>
 <AlertDescription className="text-amber-700 text-xs sm:text-sm">
 You need to declare your Playing XI specifically for this match. Each match requires its own lineup declaration - template formations are not automatically applied.
 </AlertDescription>
 </Alert>
 ) : (
 <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 p-3 sm:p-4 rounded-xl mb-3 sm:mb-4">
 <div className="flex items-start gap-2 sm:gap-3">
 <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0">
 <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
 </div>
 <div className="flex-1">
 <p className="text-xs sm:text-sm font-semibold text-emerald-800 mb-1">Playing XI Ready</p>
 <p className="text-xs sm:text-sm text-emerald-700 mb-1">
 <span className="font-medium">Formation:</span> {homeTeamLineup.formation}
 </p>
 <p className="text-xs sm:text-sm text-emerald-700 mb-2">
 <span className="font-medium">Players:</span> {homeTeamLineup.team_lineup_players?.length || 0} selected
 </p>
 <p className="text-[10px] sm:text-xs text-emerald-600">
 Declared on: {new Date(homeTeamLineup.created_at).toLocaleDateString()}
 </p>
 </div>
 </div>
 </div>
 )}

 <div className="mt-3 sm:mt-4">
 <Button
 className={`w-full text-sm font-semibold py-3 rounded-xl transition-all shadow-md hover:shadow-lg ${
 homeTeamLineup 
 ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300' 
 : 'bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white border-0'
 }`}
 variant={homeTeamLineup ? 'outline' : 'default'}
 onClick={() => {
 setShowMatchDetails(false)
 router.push(`/dashboard/club-owner/formations?match=${selectedMatch.id}`)
 }}
 >
 {homeTeamLineup ? '✏️ Update Playing XI' : '⚡ Declare Playing XI Now'}
 </Button>
 </div>
 </div>
 </CardContent>
 </Card>
 </div>
 )}

 {/* Cancel Match Dialog */}
 {showCancelDialog && matchToCancel && (
 <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
 <Card className="w-full max-w-md bg-white">
 <CardHeader>
 <CardTitle className="flex items-center gap-2 text-red-700">
 <AlertTriangle className="h-5 w-5" />
 Cancel Match
 </CardTitle>
 <CardDescription>
 Are you sure you want to cancel this match? This action cannot be undone and all participants will be notified.
 </CardDescription>
 </CardHeader>
 <CardContent className="space-y-4">
 <div className="bg-slate-50 p-3 rounded-lg">
 <p className="text-sm font-medium text-slate-900 mb-1">
 {matchToCancel?.home_club_name} vs {matchToCancel?.away_club_name}
 </p>
 <p className="text-xs text-slate-600">
 {new Date(matchToCancel!.match_date).toLocaleDateString('en-US', {
   weekday: 'long',
   month: 'long',
   day: 'numeric',
   year: 'numeric'
 })} at {matchToCancel!.match_time}
 </p>
 <p className="text-xs text-slate-600">
 Format: {matchToCancel?.match_format}
 </p>
 </div>
 
 <div>
 <Label htmlFor="cancelReason" className="text-sm font-medium">
 Reason for cancellation (optional)
 </Label>
 <Textarea
 id="cancelReason"
 placeholder="e.g., Weather conditions, player unavailability, venue issues..."
 value={cancelReason}
 onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setCancelReason(e.target.value)}
 className="mt-1"
 rows={3}
 />
 </div>
 
 <div className="flex gap-3 justify-end">
 <Button
 variant="outline"
 onClick={() => {
 setShowCancelDialog(false)
 setMatchToCancel(null)
 setCancelReason('')
 }}
 disabled={cancelingMatch === matchToCancel?.id}
 >
 Keep Match
 </Button>
 <Button
 variant="destructive"
 onClick={confirmCancelMatch}
 disabled={cancelingMatch === matchToCancel?.id}
 className="min-w-24"
 >
 {cancelingMatch === matchToCancel?.id ? (
 <div className="flex items-center gap-2">
 <div className="w-4 h-4 border border-white border-t-transparent rounded-full animate-spin" />
 Canceling...
 </div>
 ) : (
 'Cancel Match'
 )}
 </Button>
 </div>
 </CardContent>
 </Card>
 </div>
 )}
 </div>
 )
}
