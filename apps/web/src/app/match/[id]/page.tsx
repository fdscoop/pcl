'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
 ArrowLeft, 
 Calendar, 
 Clock, 
 MapPin, 
 Users, 
 Trophy, 
 Target,
 TrendingUp,
 Shield,
 Star,
 Activity,
 ChevronRight,
 Award,
 BarChart3,
 Zap,
 User,
 AlertCircle
} from 'lucide-react'

// Types
interface Team {
 id: string
 team_name: string
 club_id: string
 formation?: string
}

interface Club {
 id: string
 club_name: string
 logo_url?: string
 city?: string
 state?: string
 founded_year?: number
 description?: string
}

interface Stadium {
 id: string
 stadium_name: string
 city?: string
 state?: string
 capacity?: number
 photo_url?: string
}

interface Match {
 id: string
 match_date: string
 match_time: string
 match_format: string
 status: string
 home_team_id: string
 away_team_id: string
 home_team_score?: number
 away_team_score?: number
 stadium_id?: string
 tournament_id?: string
 match_type?: string
 league_structure?: string
 match_summary?: string
 home_team?: Team & { club?: Club }
 away_team?: Team & { club?: Club }
 stadium?: Stadium
}

interface Player {
 id: string
 unique_player_id: string
 position?: string
 photo_url?: string
 total_matches_played?: number
 total_goals_scored?: number
 total_assists?: number
 jersey_number?: number
 user?: {
 first_name?: string
 last_name?: string
 }
}

interface LineupPlayer {
 id: string
 player_id: string
 is_starter: boolean
 position_on_field?: string
 jersey_number?: number
 player?: Player
}

interface TeamLineup {
 id: string
 team_id: string
 match_id?: string
 formation?: string
 lineup_name?: string
 players?: LineupPlayer[]
}

interface HeadToHead {
 total_matches: number
 home_wins: number
 away_wins: number
 draws: number
 home_goals: number
 away_goals: number
}

export default function MatchDetailsPage() {
 const params = useParams()
 const router = useRouter()
 const matchId = params.id as string

 const [match, setMatch] = useState<Match | null>(null)
 const [homeClub, setHomeClub] = useState<Club | null>(null)
 const [awayClub, setAwayClub] = useState<Club | null>(null)
 const [homeLineup, setHomeLineup] = useState<TeamLineup | null>(null)
 const [awayLineup, setAwayLineup] = useState<TeamLineup | null>(null)
 const [headToHead, setHeadToHead] = useState<HeadToHead | null>(null)
 const [pastMatches, setPastMatches] = useState<Match[]>([])
 const [loading, setLoading] = useState(true)
 const [error, setError] = useState<string | null>(null)
 const [activeTab, setActiveTab] = useState('overview')

 useEffect(() => {
 console.log('Match details page loaded with ID:', matchId)
 if (!matchId) {
 setError('Invalid match ID')
 setLoading(false)
 return
 }

 loadMatchData()
 }, [matchId])

 const loadMatchData = async () => {
 try {
 const supabase = createClient()

 // Fetch match with teams
 const { data: matchData, error: matchError } = await supabase
 .from('matches')
 .select(`
 *,
 home_team:teams!matches_home_team_id_fkey(id, team_name, club_id, formation),
 away_team:teams!matches_away_team_id_fkey(id, team_name, club_id, formation),
 stadium:stadiums(id, stadium_name, city, state, capacity)
 `)
 .eq('id', matchId)
 .single()

 if (matchError || !matchData) {
 console.error('Error fetching match:', matchError)
 setError('Match not found')
 setLoading(false)
 return
 }

 setMatch(matchData)

 // Fetch club details for both teams
 const clubIds = [matchData.home_team?.club_id, matchData.away_team?.club_id].filter(Boolean)
 if (clubIds.length > 0) {
 const { data: clubsData } = await supabase
 .from('clubs')
 .select('id, club_name, logo_url, city, state, founded_year, description')
 .in('id', clubIds)

 if (clubsData) {
 const homeClubData = clubsData.find(c => c.id === matchData.home_team?.club_id)
 const awayClubData = clubsData.find(c => c.id === matchData.away_team?.club_id)
 setHomeClub(homeClubData || null)
 setAwayClub(awayClubData || null)
 }
 }

 // Fetch lineups for this match
 const { data: lineupsData } = await supabase
 .from('team_lineups')
 .select(`
 id,
 team_id,
 match_id,
 formation,
 lineup_name
 `)
 .eq('match_id', matchId)

 if (lineupsData && lineupsData.length > 0) {
 // Get lineup players
 const lineupIds = lineupsData.map(l => l.id)
 const { data: lineupPlayersData } = await supabase
 .from('team_lineup_players')
 .select(`
 id,
 lineup_id,
 player_id,
 is_starter,
 position_on_field,
 jersey_number
 `)
 .in('lineup_id', lineupIds)

 // Get player details
 if (lineupPlayersData && lineupPlayersData.length > 0) {
 // Use RPC function to get player names (works for public access)
 const { data: playersData, error: playersError } = await supabase
 .rpc('get_match_players_public', { match_uuid: matchId })

 console.log('Players data from RPC:', playersData)
 console.log('Players error:', playersError)

 if (playersData && !playersError) {
 // Map players data to the format expected by the component
 const playerMap = new Map(playersData.map((p: any) => [
 p.player_id,
 {
 id: p.player_id,
 unique_player_id: p.unique_player_id,
 position: p.player_position,
 photo_url: p.photo_url,
 total_matches_played: p.total_matches_played,
 total_goals_scored: p.total_goals_scored,
 total_assists: p.total_assists,
 jersey_number: p.jersey_number,
 user: {
 first_name: p.first_name,
 last_name: p.last_name
 }
 }
 ]))

 // Attach players to lineup players
 const enrichedLineupPlayers: LineupPlayer[] = lineupPlayersData.map(lp => ({
 id: lp.id,
 player_id: lp.player_id,
 is_starter: lp.is_starter,
 position_on_field: lp.position_on_field,
 jersey_number: lp.jersey_number,
 player: playerMap.get(lp.player_id) as Player | undefined
 }))

 // Create a map of lineup_id to lineup players
 const lineupPlayersMap = new Map<string, LineupPlayer[]>()
 lineupPlayersData.forEach(lp => {
 if (!lineupPlayersMap.has(lp.lineup_id)) {
 lineupPlayersMap.set(lp.lineup_id, [])
 }
 lineupPlayersMap.get(lp.lineup_id)?.push({
 id: lp.id,
 player_id: lp.player_id,
 is_starter: lp.is_starter,
 position_on_field: lp.position_on_field,
 jersey_number: lp.jersey_number,
 player: playerMap.get(lp.player_id) as Player | undefined
 })
 })

 // Organize by lineup
 const homeLineupData = lineupsData.find(l => l.team_id === matchData.home_team_id)
 const awayLineupData = lineupsData.find(l => l.team_id === matchData.away_team_id)

 if (homeLineupData) {
 setHomeLineup({
 ...homeLineupData,
 players: lineupPlayersMap.get(homeLineupData.id) || []
 })
 }

 if (awayLineupData) {
 setAwayLineup({
 ...awayLineupData,
 players: lineupPlayersMap.get(awayLineupData.id) || []
 })
 }
 } else {
 console.error('Failed to load player data:', playersError)
 // Set empty lineups if player data fails to load
 const homeLineupData = lineupsData.find(l => l.team_id === matchData.home_team_id)
 const awayLineupData = lineupsData.find(l => l.team_id === matchData.away_team_id)
 
 if (homeLineupData) {
 setHomeLineup({ ...homeLineupData, players: [] })
 }
 if (awayLineupData) {
 setAwayLineup({ ...awayLineupData, players: [] })
 }
 }
 }
 }

 // Fetch head-to-head history
 if (matchData.home_team_id && matchData.away_team_id) {
 // Get all teams from both clubs to find all past meetings
 const homeTeamClubId = matchData.home_team?.club_id
 const awayTeamClubId = matchData.away_team?.club_id

 if (homeTeamClubId && awayTeamClubId) {
 // Get all teams from both clubs
 const { data: allTeams } = await supabase
 .from('teams')
 .select('id, club_id')
 .in('club_id', [homeTeamClubId, awayTeamClubId])

 if (allTeams) {
 const homeTeamIds = allTeams.filter(t => t.club_id === homeTeamClubId).map(t => t.id)
 const awayTeamIds = allTeams.filter(t => t.club_id === awayTeamClubId).map(t => t.id)

 // Fetch past matches between these clubs
 const { data: pastMatchesData } = await supabase
 .from('matches')
 .select(`
 *,
 home_team:teams!matches_home_team_id_fkey(id, team_name, club_id),
 away_team:teams!matches_away_team_id_fkey(id, team_name, club_id)
 `)
 .eq('status', 'completed')
 .neq('id', matchId)
 .or(`and(home_team_id.in.(${homeTeamIds.join(',')}),away_team_id.in.(${awayTeamIds.join(',')})),and(home_team_id.in.(${awayTeamIds.join(',')}),away_team_id.in.(${homeTeamIds.join(',')}))`)
 .order('match_date', { ascending: false })
 .limit(10)

 if (pastMatchesData && pastMatchesData.length > 0) {
 setPastMatches(pastMatchesData)

 // Calculate head-to-head stats
 let h2h: HeadToHead = {
 total_matches: pastMatchesData.length,
 home_wins: 0,
 away_wins: 0,
 draws: 0,
 home_goals: 0,
 away_goals: 0
 }

 pastMatchesData.forEach(pm => {
 const isHomeTeamHome = homeTeamIds.includes(pm.home_team_id)
 const homeScore = isHomeTeamHome ? pm.home_team_score : pm.away_team_score
 const awayScore = isHomeTeamHome ? pm.away_team_score : pm.home_team_score

 h2h.home_goals += homeScore || 0
 h2h.away_goals += awayScore || 0

 if ((homeScore || 0) > (awayScore || 0)) {
 h2h.home_wins++
 } else if ((awayScore || 0) > (homeScore || 0)) {
 h2h.away_wins++
 } else {
 h2h.draws++
 }
 })

 setHeadToHead(h2h)
 }
 }
 }
 }

 setLoading(false)
 } catch (err) {
 console.error('Error loading match data:', err)
 setError('Failed to load match data')
 setLoading(false)
 }
 }

 // Calculate win probability based on head-to-head and team stats
 const calculateWinProbability = () => {
 if (!headToHead || headToHead.total_matches === 0) {
 return { home: 33, draw: 34, away: 33 } // Default when no history
 }

 const total = headToHead.total_matches
 const homeWinRate = (headToHead.home_wins / total) * 100
 const awayWinRate = (headToHead.away_wins / total) * 100
 const drawRate = (headToHead.draws / total) * 100

 // Add some baseline probability to prevent 0%
 const minProb = 10
 const adjustedHome = Math.max(minProb, homeWinRate)
 const adjustedAway = Math.max(minProb, awayWinRate)
 const adjustedDraw = Math.max(minProb, drawRate)

 const totalAdjusted = adjustedHome + adjustedAway + adjustedDraw
 
 return {
 home: Math.round((adjustedHome / totalAdjusted) * 100),
 draw: Math.round((adjustedDraw / totalAdjusted) * 100),
 away: Math.round((adjustedAway / totalAdjusted) * 100)
 }
 }

 const formatDate = (date: string) => {
 return new Date(date).toLocaleDateString('en-IN', {
 weekday: 'long',
 day: 'numeric',
 month: 'long',
 year: 'numeric'
 })
 }

 const formatTime = (time: string) => {
 const [hours, minutes] = time.split(':')
 const h = parseInt(hours)
 const ampm = h >= 12 ? 'PM' : 'AM'
 const hour12 = h % 12 || 12
 return `${hour12}:${minutes} ${ampm}`
 }

 const getStatusColor = (status: string) => {
 switch (status) {
 case 'scheduled':
 return 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg border-0'
 case 'ongoing':
 case 'in-progress':
 return 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg border-0 animate-pulse'
 case 'completed':
 return 'bg-gradient-to-r from-slate-500 to-slate-600 text-white shadow-lg border-0'
 case 'cancelled':
 return 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg border-0'
 default:
 return 'bg-gradient-to-r from-slate-400 to-slate-500 text-white shadow-lg border-0'
 }
 }

 if (loading) {
 return (
 <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 ">
 <div className="max-w-6xl mx-auto px-4 py-8">
 <div className="animate-pulse space-y-6">
 <div className="h-8 w-32 bg-slate-200 rounded"></div>
 <div className="h-64 bg-slate-200 rounded-2xl"></div>
 <div className="grid grid-cols-3 gap-4">
 <div className="h-32 bg-slate-200 rounded-xl"></div>
 <div className="h-32 bg-slate-200 rounded-xl"></div>
 <div className="h-32 bg-slate-200 rounded-xl"></div>
 </div>
 </div>
 </div>
 </div>
 )
 }

 if (error || !match) {
 return (
 <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
 <Card className="max-w-md mx-auto text-center p-8">
 <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
 <h1 className="text-2xl font-bold text-slate-900 mb-2">Match Not Found</h1>
 <p className="text-slate-600 mb-6">{error || 'The match you are looking for does not exist.'}</p>
 <Button onClick={() => router.back()} variant="outline">
 <ArrowLeft className="w-4 h-4 mr-2" />
 Go Back
 </Button>
 </Card>
 </div>
 )
 }

 const winProb = calculateWinProbability()

 return (
 <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 ">
 {/* Navigation */}
 <nav className="sticky-nav-mobile-safe bg-white/90 backdrop-blur-xl border-b border-slate-200 sticky top-0 z-50 shadow-sm">
 <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
 <Button 
 variant="ghost" 
 size="sm" 
 onClick={() => router.back()}
 className="hover:bg-slate-100 transition-colors"
 >
 <ArrowLeft className="w-4 h-4 mr-2" />
 Back
 </Button>
 <Badge className={getStatusColor(match.status)}>
 {match.status.charAt(0).toUpperCase() + match.status.slice(1)}
 </Badge>
 </div>
 </nav>

 <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
 {/* Match Header Card */}
 <Card className="overflow-hidden border-0 shadow-xl bg-gradient-to-br from-white to-slate-50 ">
 <CardContent className="p-6 md:p-8">
 {/* Date & Venue */}
 <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600 mb-6">
 <div className="flex items-center gap-2">
 <Calendar className="w-4 h-4" />
 <span>{formatDate(match.match_date)}</span>
 </div>
 <div className="flex items-center gap-2">
 <Clock className="w-4 h-4" />
 <span>{formatTime(match.match_time)}</span>
 </div>
 {match.stadium && (
 <div className="flex items-center gap-2">
 <MapPin className="w-4 h-4" />
 <span>{match.stadium.stadium_name}</span>
 </div>
 )}
 <Badge variant="outline" className="text-xs">
 {match.match_format}
 </Badge>
 </div>

 {/* Teams Display */}
 <div className="flex items-center justify-center gap-4 md:gap-8">
 {/* Home Team */}
 <div className="flex-1 text-center">
 <div className="w-20 h-20 md:w-28 md:h-28 mx-auto mb-3 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 p-1 shadow-lg">
 {homeClub?.logo_url ? (
 <img 
 src={homeClub.logo_url} 
 alt={homeClub.club_name} 
 className="w-full h-full rounded-full object-cover"
 onError={(e) => {
 (e.target as HTMLImageElement).style.display = 'none'
 }}
 />
 ) : (
 <div className="w-full h-full rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-2xl md:text-4xl font-bold">
 {(homeClub?.club_name || 'H').charAt(0)}
 </div>
 )}
 </div>
 <h2 className="text-lg md:text-xl font-bold text-slate-900 mb-1">
 {homeClub?.club_name || 'Home Team'}
 </h2>
 <p className="text-xs text-slate-500 ">
 {homeClub?.city && homeClub?.state ? `${homeClub.city}, ${homeClub.state}` : 'Home'}
 </p>
 {match.status === 'completed' && (
 <div className="mt-3 text-4xl md:text-5xl font-extrabold text-slate-900 ">
 {match.home_team_score ?? '-'}
 </div>
 )}
 </div>

 {/* VS Divider */}
 <div className="flex flex-col items-center px-4">
 <div className="text-2xl md:text-3xl font-bold text-slate-300 ">VS</div>
 {match.status === 'scheduled' && (
 <div className="mt-2 px-4 py-1 bg-blue-500 text-white text-xs font-semibold rounded-full">
 UPCOMING
 </div>
 )}
 </div>

 {/* Away Team */}
 <div className="flex-1 text-center">
 <div className="w-20 h-20 md:w-28 md:h-28 mx-auto mb-3 rounded-full bg-gradient-to-br from-red-100 to-red-200 p-1 shadow-lg">
 {awayClub?.logo_url ? (
 <img 
 src={awayClub.logo_url} 
 alt={awayClub.club_name} 
 className="w-full h-full rounded-full object-cover"
 onError={(e) => {
 (e.target as HTMLImageElement).style.display = 'none'
 }}
 />
 ) : (
 <div className="w-full h-full rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center text-white text-2xl md:text-4xl font-bold">
 {(awayClub?.club_name || 'A').charAt(0)}
 </div>
 )}
 </div>
 <h2 className="text-lg md:text-xl font-bold text-slate-900 mb-1">
 {awayClub?.club_name || 'Away Team'}
 </h2>
 <p className="text-xs text-slate-500 ">
 {awayClub?.city && awayClub?.state ? `${awayClub.city}, ${awayClub.state}` : 'Away'}
 </p>
 {match.status === 'completed' && (
 <div className="mt-3 text-4xl md:text-5xl font-extrabold text-slate-900 ">
 {match.away_team_score ?? '-'}
 </div>
 )}
 </div>
 </div>

 {/* Win Probability Bar */}
 {match.status === 'scheduled' && (
 <div className="mt-8">
 <h3 className="text-sm font-semibold text-slate-700 mb-3 text-center">
 Win Probability
 </h3>
 <div className="flex items-center gap-2">
 <span className="text-sm font-bold text-blue-600 w-12 text-right">{winProb.home}%</span>
 <div className="flex-1 h-4 rounded-full overflow-hidden bg-slate-200 flex">
 <div 
 className="bg-blue-500 transition-all duration-500" 
 style={{ width: `${winProb.home}%` }}
 />
 <div 
 className="bg-slate-400 transition-all duration-500" 
 style={{ width: `${winProb.draw}%` }}
 />
 <div 
 className="bg-red-500 transition-all duration-500" 
 style={{ width: `${winProb.away}%` }}
 />
 </div>
 <span className="text-sm font-bold text-red-600 w-12">{winProb.away}%</span>
 </div>
 <div className="flex justify-center gap-6 mt-2 text-xs text-slate-500">
 <span>🔵 {homeClub?.club_name || 'Home'}</span>
 <span>⚫ Draw ({winProb.draw}%)</span>
 <span>🔴 {awayClub?.club_name || 'Away'}</span>
 </div>
 </div>
 )}
 </CardContent>
 </Card>

 {/* Tabs Section */}
 <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
 <TabsList className="grid w-full grid-cols-4 bg-gradient-to-r from-slate-50 to-slate-100 rounded-xl p-1.5 shadow-lg border border-slate-200">
 <TabsTrigger 
 value="overview" 
 className="rounded-lg data-[state=active]:bg-blue-500 data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-200 hover:bg-blue-50"
 >
 <Trophy className="w-4 h-4 mr-2" />
 <span className="hidden sm:inline">Overview</span>
 <span className="sm:hidden">Info</span>
 </TabsTrigger>
 <TabsTrigger 
 value="lineups" 
 className="rounded-lg data-[state=active]:bg-green-500 data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-200 hover:bg-green-50"
 >
 <Users className="w-4 h-4 mr-2" />
 <span className="hidden sm:inline">Lineups</span>
 <span className="sm:hidden">Teams</span>
 </TabsTrigger>
 <TabsTrigger 
 value="stats" 
 className="rounded-lg data-[state=active]:bg-purple-500 data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-200 hover:bg-purple-50"
 >
 <BarChart3 className="w-4 h-4 mr-2" />
 <span className="hidden sm:inline">Stats</span>
 <span className="sm:hidden">Data</span>
 </TabsTrigger>
 <TabsTrigger 
 value="h2h" 
 className="rounded-lg data-[state=active]:bg-orange-500 data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-200 hover:bg-orange-50"
 >
 <Activity className="w-4 h-4 mr-2" />
 <span className="hidden sm:inline">H2H</span>
 <span className="sm:hidden">vs</span>
 </TabsTrigger>
 </TabsList>

 {/* Overview Tab */}
 <TabsContent value="overview" className="space-y-4 mt-4">
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 {/* Match Info */}
 <Card className="border-0 shadow-lg">
 <CardHeader>
 <CardTitle className="text-base flex items-center gap-2">
 <Shield className="w-5 h-5 text-blue-500" />
 Match Information
 </CardTitle>
 </CardHeader>
 <CardContent className="space-y-4">
 <div className="flex justify-between items-center py-2 border-b border-slate-100">
 <span className="text-slate-600">Format</span>
 <Badge className="bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0 shadow-sm">
 {match.match_format}
 </Badge>
 </div>
 <div className="flex justify-between items-center py-2 border-b border-slate-100">
 <span className="text-slate-600">Match Type</span>
 <span className="font-semibold capitalize text-slate-900">{match.match_type || 'Official'}</span>
 </div>
 {match.league_structure && (
 <div className="flex justify-between items-center py-2 border-b border-slate-100">
 <span className="text-slate-600">League</span>
 <Badge className="bg-gradient-to-r from-green-500 to-green-600 text-white border-0 shadow-sm">
 {match.league_structure}
 </Badge>
 </div>
 )}
 {match.stadium && (
 <div className="flex justify-between items-center py-2">
 <span className="text-slate-600 ">Venue</span>
 <span className="font-semibold">{match.stadium.stadium_name}</span>
 </div>
 )}
 </CardContent>
 </Card>

 {/* Team Formations */}
 <Card className="border-0 shadow-lg">
 <CardHeader>
 <CardTitle className="text-base flex items-center gap-2">
 <Target className="w-5 h-5 text-green-500" />
 Team Formations
 </CardTitle>
 </CardHeader>
 <CardContent>
 <div className="grid grid-cols-2 gap-4">
 <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200">
 <p className="text-sm text-slate-600 mb-1">
 {homeClub?.club_name || 'Home'}
 </p>
 <p className="text-2xl font-bold text-blue-600">
 {homeLineup?.formation || match.home_team?.formation || '4-3-3'}
 </p>
 </div>
 <div className="text-center p-4 bg-gradient-to-br from-red-50 to-red-100 rounded-xl border border-red-200">
 <p className="text-sm text-slate-600 mb-1">
 {awayClub?.club_name || 'Away'}
 </p>
 <p className="text-2xl font-bold text-red-600">
 {awayLineup?.formation || match.away_team?.formation || '4-3-3'}
 </p>
 </div>
 </div>
 </CardContent>
 </Card>
 </div>

 {/* Quick Stats */}
 {headToHead && (
 <Card className="border-0 shadow-lg">
 <CardHeader>
 <CardTitle className="text-base flex items-center gap-2">
 <Zap className="w-5 h-5 text-amber-500" />
 Quick Stats
 </CardTitle>
 </CardHeader>
 <CardContent>
 <div className="grid grid-cols-3 gap-4 text-center">
 <div className="p-4 bg-blue-50 rounded-xl">
 <p className="text-3xl font-bold text-blue-600">{headToHead.home_wins}</p>
 <p className="text-xs text-slate-600 mt-1">
 {homeClub?.club_name || 'Home'} Wins
 </p>
 </div>
 <div className="p-4 bg-slate-100 rounded-xl">
 <p className="text-3xl font-bold text-slate-600 ">{headToHead.draws}</p>
 <p className="text-xs text-slate-600 mt-1">Draws</p>
 </div>
 <div className="p-4 bg-red-50 rounded-xl">
 <p className="text-3xl font-bold text-red-600">{headToHead.away_wins}</p>
 <p className="text-xs text-slate-600 mt-1">
 {awayClub?.club_name || 'Away'} Wins
 </p>
 </div>
 </div>
 </CardContent>
 </Card>
 )}
 </TabsContent>

 {/* Lineups Tab */}
 <TabsContent value="lineups" className="mt-4">
 <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
 {/* Home Team Lineup */}
 <Card className="border-0 shadow-lg">
 <CardHeader className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-t-xl">
 <CardTitle className="flex items-center gap-3">
 {homeClub?.logo_url ? (
 <img src={homeClub.logo_url} alt="" className="w-8 h-8 rounded-full bg-white p-0.5" />
 ) : (
 <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center font-bold">
 {(homeClub?.club_name || 'H').charAt(0)}
 </div>
 )}
 {homeClub?.club_name || 'Home Team'}
 </CardTitle>
 <CardDescription className="text-blue-100">
 Formation: {homeLineup?.formation || '4-3-3'}
 </CardDescription>
 </CardHeader>
 <CardContent className="p-4">
 {homeLineup?.players && homeLineup.players.length > 0 ? (
 <div className="space-y-2">
 <h4 className="font-semibold text-sm text-slate-700 mb-3">Starting XI</h4>
 {homeLineup.players.filter(p => p.is_starter).map((lp, idx) => (
 <div key={lp.id} className="flex items-center gap-3 p-2 bg-slate-50 rounded-lg">
 <div className="relative w-10 h-10 flex-shrink-0">
 {lp.player?.photo_url ? (
 <img 
 src={lp.player.photo_url} 
 alt={`${lp.player?.user?.first_name} ${lp.player?.user?.last_name}`}
 className="w-10 h-10 rounded-full object-cover border-2 border-blue-200 "
 />
 ) : (
 <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm border-2 border-blue-200 ">
 {lp.player?.user?.first_name?.[0] || 'P'}
 </div>
 )}
 <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
 {lp.jersey_number || idx + 1}
 </div>
 </div>
 <div className="flex-1">
 <p className="font-medium text-sm text-slate-900 ">
 {lp.player?.user?.first_name} {lp.player?.user?.last_name}
 </p>
 <p className="text-xs text-slate-500">{lp.position_on_field || lp.player?.position}</p>
 </div>
 {lp.player?.total_goals_scored && lp.player.total_goals_scored > 0 && (
 <Badge variant="secondary" className="text-xs">
 ⚽ {lp.player.total_goals_scored}
 </Badge>
 )}
 </div>
 ))}
 
 {homeLineup.players.filter(p => !p.is_starter).length > 0 && (
 <>
 <h4 className="font-semibold text-sm text-slate-700 mt-4 mb-3">Substitutes</h4>
 {homeLineup.players.filter(p => !p.is_starter).map((lp, idx) => (
 <div key={lp.id} className="flex items-center gap-3 p-2 bg-slate-50/50 rounded-lg opacity-75">
 <div className="relative w-8 h-8 flex-shrink-0">
 {lp.player?.photo_url ? (
 <img 
 src={lp.player.photo_url} 
 alt={`${lp.player?.user?.first_name} ${lp.player?.user?.last_name}`}
 className="w-8 h-8 rounded-full object-cover border-2 border-slate-300 "
 />
 ) : (
 <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold text-sm border-2 border-slate-300 ">
 {lp.player?.user?.first_name?.[0] || 'P'}
 </div>
 )}
 <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-slate-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
 {lp.jersey_number || '-'}
 </div>
 </div>
 <div className="flex-1">
 <p className="font-medium text-sm text-slate-900 ">
 {lp.player?.user?.first_name} {lp.player?.user?.last_name}
 </p>
 <p className="text-xs text-slate-500">{lp.position_on_field || lp.player?.position}</p>
 </div>
 </div>
 ))}
 </>
 )}
 </div>
 ) : (
 <div className="text-center py-8 text-slate-500">
 <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
 <p className="font-medium">Lineup not announced</p>
 <p className="text-sm">Check back closer to match time</p>
 </div>
 )}
 </CardContent>
 </Card>

 {/* Away Team Lineup */}
 <Card className="border-0 shadow-lg">
 <CardHeader className="bg-gradient-to-r from-red-500 to-red-600 text-white rounded-t-xl">
 <CardTitle className="flex items-center gap-3">
 {awayClub?.logo_url ? (
 <img src={awayClub.logo_url} alt="" className="w-8 h-8 rounded-full bg-white p-0.5" />
 ) : (
 <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center font-bold">
 {(awayClub?.club_name || 'A').charAt(0)}
 </div>
 )}
 {awayClub?.club_name || 'Away Team'}
 </CardTitle>
 <CardDescription className="text-red-100">
 Formation: {awayLineup?.formation || '4-3-3'}
 </CardDescription>
 </CardHeader>
 <CardContent className="p-4">
 {awayLineup?.players && awayLineup.players.length > 0 ? (
 <div className="space-y-2">
 <h4 className="font-semibold text-sm text-slate-700 mb-3">Starting XI</h4>
 {awayLineup.players.filter(p => p.is_starter).map((lp, idx) => (
 <div key={lp.id} className="flex items-center gap-3 p-2 bg-slate-50 rounded-lg">
 <div className="relative w-10 h-10 flex-shrink-0">
 {lp.player?.photo_url ? (
 <img 
 src={lp.player.photo_url} 
 alt={`${lp.player?.user?.first_name} ${lp.player?.user?.last_name}`}
 className="w-10 h-10 rounded-full object-cover border-2 border-red-200 "
 />
 ) : (
 <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600 font-bold text-sm border-2 border-red-200 ">
 {lp.player?.user?.first_name?.[0] || 'P'}
 </div>
 )}
 <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-red-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
 {lp.jersey_number || idx + 1}
 </div>
 </div>
 <div className="flex-1">
 <p className="font-medium text-sm text-slate-900 ">
 {lp.player?.user?.first_name} {lp.player?.user?.last_name}
 </p>
 <p className="text-xs text-slate-500">{lp.position_on_field || lp.player?.position}</p>
 </div>
 {lp.player?.total_goals_scored && lp.player.total_goals_scored > 0 && (
 <Badge variant="secondary" className="text-xs">
 ⚽ {lp.player.total_goals_scored}
 </Badge>
 )}
 </div>
 ))}
 
 {awayLineup.players.filter(p => !p.is_starter).length > 0 && (
 <>
 <h4 className="font-semibold text-sm text-slate-700 mt-4 mb-3">Substitutes</h4>
 {awayLineup.players.filter(p => !p.is_starter).map((lp, idx) => (
 <div key={lp.id} className="flex items-center gap-3 p-2 bg-slate-50/50 rounded-lg opacity-75">
 <div className="relative w-8 h-8 flex-shrink-0">
 {lp.player?.photo_url ? (
 <img 
 src={lp.player.photo_url} 
 alt={`${lp.player?.user?.first_name} ${lp.player?.user?.last_name}`}
 className="w-8 h-8 rounded-full object-cover border-2 border-slate-300 "
 />
 ) : (
 <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold text-sm border-2 border-slate-300 ">
 {lp.player?.user?.first_name?.[0] || 'P'}
 </div>
 )}
 <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-slate-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
 {lp.jersey_number || '-'}
 </div>
 </div>
 <div className="flex-1">
 <p className="font-medium text-sm text-slate-900 ">
 {lp.player?.user?.first_name} {lp.player?.user?.last_name}
 </p>
 <p className="text-xs text-slate-500">{lp.position_on_field || lp.player?.position}</p>
 </div>
 </div>
 ))}
 </>
 )}
 </div>
 ) : (
 <div className="text-center py-8 text-slate-500">
 <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
 <p className="font-medium">Lineup not announced</p>
 <p className="text-sm">Check back closer to match time</p>
 </div>
 )}
 </CardContent>
 </Card>
 </div>

 {/* Formation Visualization */}
 <Card className="border-0 shadow-lg mt-4">
 <CardHeader>
 <CardTitle className="text-base flex items-center gap-2">
 <Target className="w-5 h-5 text-green-500" />
 Formation View
 </CardTitle>
 </CardHeader>
 <CardContent>
 <FormationVisualization 
 homeLineup={homeLineup}
 awayLineup={awayLineup}
 homeClub={homeClub}
 awayClub={awayClub}
 />
 </CardContent>
 </Card>
 </TabsContent>

 {/* Stats Tab */}
 <TabsContent value="stats" className="mt-4">
 <Card className="border-0 shadow-lg">
 <CardHeader>
 <CardTitle className="text-base flex items-center gap-2">
 <BarChart3 className="w-5 h-5 text-purple-500" />
 Team Statistics Comparison
 </CardTitle>
 </CardHeader>
 <CardContent className="space-y-6">
 {headToHead ? (
 <>
 <StatComparisonRow 
 label="Goals Scored (H2H)" 
 homeValue={headToHead.home_goals} 
 awayValue={headToHead.away_goals}
 homeClub={homeClub?.club_name || 'Home'}
 awayClub={awayClub?.club_name || 'Away'}
 />
 <StatComparisonRow 
 label="Wins (H2H)" 
 homeValue={headToHead.home_wins} 
 awayValue={headToHead.away_wins}
 homeClub={homeClub?.club_name || 'Home'}
 awayClub={awayClub?.club_name || 'Away'}
 />
 <StatComparisonRow 
 label="Win Rate %" 
 homeValue={Math.round((headToHead.home_wins / headToHead.total_matches) * 100)} 
 awayValue={Math.round((headToHead.away_wins / headToHead.total_matches) * 100)}
 homeClub={homeClub?.club_name || 'Home'}
 awayClub={awayClub?.club_name || 'Away'}
 isPercentage
 />
 </>
 ) : (
 <div className="text-center py-8 text-slate-500">
 <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-30" />
 <p className="font-medium">No statistics available</p>
 <p className="text-sm">These teams haven't played against each other yet</p>
 </div>
 )}
 </CardContent>
 </Card>
 </TabsContent>

 {/* Head-to-Head Tab */}
 <TabsContent value="h2h" className="mt-4">
 <Card className="border-0 shadow-lg">
 <CardHeader>
 <CardTitle className="text-base flex items-center gap-2">
 <Activity className="w-5 h-5 text-orange-500" />
 Head-to-Head History
 </CardTitle>
 <CardDescription>
 Previous matches between {homeClub?.club_name || 'Home'} and {awayClub?.club_name || 'Away'}
 </CardDescription>
 </CardHeader>
 <CardContent>
 {pastMatches.length > 0 ? (
 <div className="space-y-3">
 {pastMatches.map((pm) => {
 const homeTeamIsHome = pm.home_team?.club_id === homeClub?.id
 return (
 <div 
 key={pm.id}
 className="flex items-center justify-between p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
 onClick={() => router.push(`/match/${pm.id}`)}
 >
 <div className="flex items-center gap-3">
 <div className="text-center">
 <p className="text-xs text-slate-500">
 {new Date(pm.match_date).toLocaleDateString('en-IN', { 
 day: 'numeric', 
 month: 'short',
 year: '2-digit'
 })}
 </p>
 </div>
 </div>
 <div className="flex items-center gap-4">
 <span className={`font-semibold ${homeTeamIsHome ? 'text-blue-600' : 'text-red-600'}`}>
 {homeClub?.club_name?.split(' ')[0] || 'Home'}
 </span>
 <div className="flex items-center gap-2 bg-white px-3 py-1 rounded-lg shadow-sm">
 <span className="text-xl font-bold">
 {homeTeamIsHome ? pm.home_team_score : pm.away_team_score}
 </span>
 <span className="text-slate-400">-</span>
 <span className="text-xl font-bold">
 {homeTeamIsHome ? pm.away_team_score : pm.home_team_score}
 </span>
 </div>
 <span className={`font-semibold ${!homeTeamIsHome ? 'text-blue-600' : 'text-red-600'}`}>
 {awayClub?.club_name?.split(' ')[0] || 'Away'}
 </span>
 </div>
 <ChevronRight className="w-5 h-5 text-slate-400" />
 </div>
 )
 })}
 </div>
 ) : (
 <div className="text-center py-8 text-slate-500">
 <Activity className="w-12 h-12 mx-auto mb-3 opacity-30" />
 <p className="font-medium">No previous meetings</p>
 <p className="text-sm">This will be the first match between these teams</p>
 </div>
 )}
 </CardContent>
 </Card>
 </TabsContent>
 </Tabs>
 </div>
 </div>
 )
}

// Stat Comparison Row Component
function StatComparisonRow({ 
 label, 
 homeValue, 
 awayValue, 
 homeClub, 
 awayClub,
 isPercentage = false
}: { 
 label: string
 homeValue: number
 awayValue: number
 homeClub: string
 awayClub: string
 isPercentage?: boolean
}) {
 const total = homeValue + awayValue || 1
 const homePercent = (homeValue / total) * 100
 const awayPercent = (awayValue / total) * 100

 return (
 <div className="space-y-2">
 <div className="flex justify-between text-sm">
 <span className="font-semibold text-blue-600">{homeValue}{isPercentage ? '%' : ''}</span>
 <span className="text-slate-600 ">{label}</span>
 <span className="font-semibold text-red-600">{awayValue}{isPercentage ? '%' : ''}</span>
 </div>
 <div className="flex h-2 rounded-full overflow-hidden bg-slate-200 ">
 <div 
 className="bg-blue-500 transition-all duration-500" 
 style={{ width: `${homePercent}%` }}
 />
 <div 
 className="bg-red-500 transition-all duration-500" 
 style={{ width: `${awayPercent}%` }}
 />
 </div>
 </div>
 )
}

// Formation Visualization Component
function FormationVisualization({ 
 homeLineup, 
 awayLineup, 
 homeClub, 
 awayClub 
}: { 
 homeLineup: TeamLineup | null
 awayLineup: TeamLineup | null
 homeClub: Club | null
 awayClub: Club | null
}) {
 // Parse formation string like "4-3-3" or "4-4-2"
 const parseFormation = (formation: string): number[] => {
 if (!formation) return [4, 3, 3]
 const parts = formation.split('-').map(Number).filter(n => !isNaN(n))
 return parts.length > 0 ? parts : [4, 3, 3]
 }

 const getPositionCoordinates = (formation: number[], playerIndex: number, isStarter: boolean, isHome: boolean): { x: number, y: number } => {
 if (!isStarter) return { x: 0, y: 0 } // Substitutes not shown on pitch
 
 const formationArray = formation
 let currentIndex = 0
 
 // GK is always index 0
 if (playerIndex === 0) {
 return { x: 50, y: isHome ? 92 : 8 }
 }
 
 // Calculate position based on formation
 let row = 0
 let posInRow = 0
 let accumulated = 1 // Start after GK
 
 for (let i = 0; i < formationArray.length; i++) {
 if (playerIndex < accumulated + formationArray[i]) {
 row = i
 posInRow = playerIndex - accumulated
 break
 }
 accumulated += formationArray[i]
 }
 
 const rowCount = formationArray[row] || 4
 const yBase = isHome ? 75 - (row * 20) : 25 + (row * 20)
 const xSpacing = 80 / (rowCount + 1)
 const xPos = 10 + xSpacing * (posInRow + 1)
 
 return { x: xPos, y: yBase }
 }

 const homeFormation = parseFormation(homeLineup?.formation || '4-3-3')
 const awayFormation = parseFormation(awayLineup?.formation || '4-3-3')

 const homeStarters = homeLineup?.players?.filter(p => p.is_starter) || []
 const awayStarters = awayLineup?.players?.filter(p => p.is_starter) || []

 return (
 <div className="relative w-full aspect-[3/4] max-w-2xl mx-auto bg-gradient-to-b from-green-600 to-green-700 rounded-xl overflow-hidden shadow-lg">
 {/* Pitch markings */}
 <div className="absolute inset-0">
 {/* Center line */}
 <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-white/40 " />
 {/* Center circle */}
 <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 border-2 border-white/40 rounded-full" />
 {/* Penalty areas */}
 <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-16 border-2 border-t-0 border-white/40 " />
 <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-40 h-16 border-2 border-b-0 border-white/40 " />
 {/* Goal areas */}
 <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-6 border-2 border-t-0 border-white/40 " />
 <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-20 h-6 border-2 border-b-0 border-white/40 " />
 </div>

 {/* Team Labels */}
 <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-red-500/90 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
 {awayClub?.club_name || 'Away'}
 </div>
 <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-blue-500/90 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
 {homeClub?.club_name || 'Home'}
 </div>

 {/* Home Team Players (bottom half) */}
 {homeStarters.length > 0 ? (
 homeStarters.map((player, idx) => {
 const pos = getPositionCoordinates(homeFormation, idx, true, true)
 return (
 <div 
 key={player.id}
 className="absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center"
 style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
 >
 <div className="relative w-10 h-10 flex-shrink-0">
 {player.player?.photo_url ? (
 <img 
 src={player.player.photo_url} 
 alt={`${player.player?.user?.first_name} ${player.player?.user?.last_name}`}
 className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-lg"
 />
 ) : (
 <div className="w-10 h-10 rounded-full bg-blue-500 border-2 border-white flex items-center justify-center text-white text-xs font-bold shadow-lg">
 {player.player?.user?.first_name?.[0] || 'P'}
 </div>
 )}
 <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold shadow-md">
 {player.jersey_number || idx + 1}
 </div>
 </div>
 <span className="text-[10px] text-white font-medium mt-1 text-center max-w-16 truncate bg-black/50 px-1 rounded shadow-sm">
 {player.player?.user?.last_name || `P${idx + 1}`}
 </span>
 </div>
 )
 })
 ) : (
 <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 text-white/70 text-sm font-medium">
 Lineup not set
 </div>
 )}

 {/* Away Team Players (top half) */}
 {awayStarters.length > 0 ? (
 awayStarters.map((player, idx) => {
 const pos = getPositionCoordinates(awayFormation, idx, true, false)
 return (
 <div 
 key={player.id}
 className="absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center"
 style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
 >
 <div className="relative w-10 h-10 flex-shrink-0">
 {player.player?.photo_url ? (
 <img 
 src={player.player.photo_url} 
 alt={`${player.player?.user?.first_name} ${player.player?.user?.last_name}`}
 className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-lg"
 />
 ) : (
 <div className="w-10 h-10 rounded-full bg-red-500 border-2 border-white flex items-center justify-center text-white text-xs font-bold shadow-lg">
 {player.player?.user?.first_name?.[0] || 'P'}
 </div>
 )}
 <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-red-600 text-white rounded-full flex items-center justify-center text-xs font-bold shadow-md">
 {player.jersey_number || idx + 1}
 </div>
 </div>
 <span className="text-[10px] text-white font-medium mt-1 text-center max-w-16 truncate bg-black/50 px-1 rounded shadow-sm">
 {player.player?.user?.last_name || `P${idx + 1}`}
 </span>
 </div>
 )
 })
 ) : (
 <div className="absolute top-1/4 left-1/2 -translate-x-1/2 text-white/70 text-sm font-medium">
 Lineup not set
 </div>
 )}
 </div>
 )
}
