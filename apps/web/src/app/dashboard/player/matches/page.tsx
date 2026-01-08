'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { ModernCard } from '@/components/ui/modern-card'
import { ModernButton } from '@/components/ui/modern-button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/context/ToastContext'
import { 
  Trophy, 
  Calendar, 
  MapPin, 
  Clock, 
  Users, 
  Target,
  Star,
  Award,
  TrendingUp,
  Activity,
  Timer,
  Zap,
  Shield,
  ChevronRight
} from 'lucide-react'

interface Match {
  id: string
  match_date: string
  match_time: string
  home_team: string
  away_team: string
  home_team_id: string
  away_team_id: string
  home_club_logo?: string
  away_club_logo?: string
  home_club_name?: string
  away_club_name?: string
  venue: string
  status: 'upcoming' | 'live' | 'completed' | 'scheduled' | 'in_progress' | 'postponed' | 'cancelled'
  home_score?: number
  away_score?: number
  tournament?: string
  isUpcoming: boolean  // Based on date, not status
  player_stats?: {
    goals: number
    assists: number
    minutes_played: number
    yellow_cards: number
    red_cards: number
    rating?: number
  }
}

interface PlayerStats {
  total_matches: number
  total_goals: number
  total_assists: number
  avg_rating: number
  man_of_match: number
  yellow_cards: number
  red_cards: number
  total_minutes: number
}

export default function PlayerMatches() {
  const router = useRouter()
  const { addToast } = useToast()
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [navigating, setNavigating] = useState<string | null>(null)
  const [matches, setMatches] = useState<Match[]>([])
  const [stats, setStats] = useState<PlayerStats>({
    total_matches: 0,
    total_goals: 0,
    total_assists: 0,
    avg_rating: 0,
    man_of_match: 0,
    yellow_cards: 0,
    red_cards: 0,
    total_minutes: 0
  })
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    loadMatchesAndStats()
  }, [])

  const loadMatchesAndStats = async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      
      if (!authUser) {
        router.push('/auth/login')
        return
      }

      setUser(authUser)

      // Get player data
      const { data: playerData } = await supabase
        .from('players')
        .select('id, total_matches_played, total_goals_scored, total_assists, player_rating, man_of_match_awards, yellow_cards, red_cards')
        .eq('user_id', authUser.id)
        .single()

      if (playerData) {
        setStats({
          total_matches: playerData.total_matches_played || 0,
          total_goals: playerData.total_goals_scored || 0,
          total_assists: playerData.total_assists || 0,
          avg_rating: playerData.player_rating || 0,
          man_of_match: playerData.man_of_match_awards || 0,
          yellow_cards: playerData.yellow_cards || 0,
          red_cards: playerData.red_cards || 0,
          total_minutes: (playerData.total_matches_played || 0) * 90, // Estimate
        })

        // Get player's active contract to find their club
        const { data: activeContract } = await supabase
          .from('contracts')
          .select('*, clubs(*)')
          .eq('player_id', playerData.id)
          .eq('status', 'active')
          .single()

        let allMatches: Match[] = []

        if (activeContract && activeContract.clubs) {
          const playerClubId = activeContract.clubs.id
          
          // Get all teams belonging to the player's club
          const { data: clubTeams, error: teamsError } = await supabase
            .from('teams')
            .select('id, team_name, club_id, logo_url')
            .eq('club_id', playerClubId)
            .eq('is_active', true)

          if (teamsError) {
            console.error('Teams fetch error:', teamsError)
          }

          if (clubTeams && clubTeams.length > 0) {
            const teamIds = clubTeams.map(t => t.id)

            // Fetch ALL matches for the club's teams with proper joins to get club logos
            const { data: matchesData, error: matchesError } = await supabase
              .from('matches')
              .select(`
                *,
                home_team:teams!matches_home_team_id_fkey(
                  id, 
                  team_name, 
                  club_id, 
                  logo_url,
                  clubs(id, club_name, logo_url)
                ),
                away_team:teams!matches_away_team_id_fkey(
                  id, 
                  team_name, 
                  club_id, 
                  logo_url,
                  clubs(id, club_name, logo_url)
                ),
                stadiums(stadium_name)
              `)
              .or(`home_team_id.in.(${teamIds.join(',')}),away_team_id.in.(${teamIds.join(',')})`)
              .order('match_date', { ascending: true })

            if (matchesError) {
              console.error('Matches fetch error:', matchesError)
            }

            if (matchesData && matchesData.length > 0) {
              // Get current date for comparison (set to start of day)
              const today = new Date()
              today.setHours(0, 0, 0, 0)

              // Get player stats for completed matches where they were in lineup
              const completedMatchIds = matchesData
                .filter(m => m.status === 'completed')
                .map(m => m.id)

              let playerStatsMap = new Map()

              if (completedMatchIds.length > 0) {
                const { data: lineupStats } = await supabase
                  .from('team_lineup_players')
                  .select(`
                    goals,
                    assists,
                    minutes_played,
                    yellow_cards,
                    red_cards,
                    rating,
                    lineup:team_lineups!inner(match_id)
                  `)
                  .eq('player_id', playerData.id)

                if (lineupStats) {
                  lineupStats.forEach(stat => {
                    const lineup = Array.isArray(stat.lineup) ? stat.lineup[0] : stat.lineup
                    if (lineup?.match_id) {
                      playerStatsMap.set(lineup.match_id, {
                        goals: stat.goals || 0,
                        assists: stat.assists || 0,
                        minutes_played: stat.minutes_played || 0,
                        yellow_cards: stat.yellow_cards || 0,
                        red_cards: stat.red_cards || 0,
                        rating: stat.rating || undefined,
                      })
                    }
                  })
                }
              }

              // Transform matches data
              allMatches = matchesData.map(match => {
                const stadium = Array.isArray(match.stadiums) ? match.stadiums[0] : match.stadiums
                const homeTeam = match.home_team
                const awayTeam = match.away_team
                
                // Get club data from nested teams
                const homeClub = homeTeam?.clubs
                const awayClub = awayTeam?.clubs
                
                // Determine if match is upcoming based on date
                const matchDate = new Date(match.match_date)
                matchDate.setHours(0, 0, 0, 0)
                const isUpcoming = matchDate >= today
                
                return {
                  id: match.id,
                  match_date: match.match_date,
                  match_time: match.match_time || '00:00',
                  home_team: homeTeam?.team_name || 'Home Team',
                  away_team: awayTeam?.team_name || 'Away Team',
                  home_team_id: match.home_team_id,
                  away_team_id: match.away_team_id,
                  home_club_logo: homeClub?.logo_url || homeTeam?.logo_url || null,
                  away_club_logo: awayClub?.logo_url || awayTeam?.logo_url || null,
                  home_club_name: homeClub?.club_name || homeTeam?.team_name || 'Home',
                  away_club_name: awayClub?.club_name || awayTeam?.team_name || 'Away',
                  venue: stadium?.stadium_name || 'TBD',
                  status: match.status || 'scheduled',
                  home_score: match.home_score ?? match.home_team_score ?? undefined,
                  away_score: match.away_score ?? match.away_team_score ?? undefined,
                  tournament: match.league_name || undefined,
                  isUpcoming,
                  player_stats: playerStatsMap.get(match.id)
                }
              })
            }
          }
        }

        setMatches(allMatches)
      }

      setLoading(false)
    } catch (error) {
      console.error('Error loading matches:', error)
      addToast({
        title: 'Error',
        description: 'Failed to load matches. Please try again.',
        type: 'error'
      })
      setLoading(false)
    }
  }

  const handleMatchNavigation = (matchId: string, homeTeam: string, awayTeam: string, matchDate: string) => {
    setNavigating(matchId)
    const formattedDate = formatDate(matchDate)
    addToast({
      title: 'Opening Match Details',
      description: `${homeTeam} vs ${awayTeam} - ${formattedDate}`,
      type: 'info'
    })
    
    setTimeout(() => {
      router.push(`/match/${matchId}`)
    }, 500)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'upcoming':
      case 'scheduled':
        return 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/50'
      case 'live':
      case 'in_progress':
        return 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg shadow-green-500/50 animate-pulse'
      case 'completed':
        return 'bg-gradient-to-r from-gray-600 to-gray-700 text-white shadow-lg shadow-gray-500/50'
      case 'postponed':
        return 'bg-gradient-to-r from-yellow-500 to-orange-600 text-white shadow-lg shadow-yellow-500/50'
      case 'cancelled':
        return 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg shadow-red-500/50'
      default:
        return 'bg-gradient-to-r from-gray-400 to-gray-500 text-white'
    }
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="text-center py-12">
          <div className="relative mx-auto w-16 h-16">
            <div className="w-16 h-16 rounded-full border-4 border-orange-200"></div>
            <div className="absolute inset-0 w-16 h-16 rounded-full border-4 border-orange-500 border-t-transparent animate-spin"></div>
          </div>
          <p className="mt-4 text-slate-600 font-medium">Loading matches...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
              <Trophy className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">My Matches</h1>
              <p className="text-gray-500 text-sm">Track your match schedule, performance, and statistics</p>
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-8">
          <ModernCard className="p-4 bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0 shadow-lg shadow-blue-500/20">
            <div className="flex items-center justify-between mb-2">
              <Trophy className="h-5 w-5 text-white/80" />
              <span className="text-xs text-white/70 font-medium">Total</span>
            </div>
            <div className="text-2xl sm:text-3xl font-bold">{stats.total_matches}</div>
            <div className="text-sm text-white/80">Matches Played</div>
          </ModernCard>

          <ModernCard className="p-4 bg-gradient-to-br from-green-500 to-emerald-600 text-white border-0 shadow-lg shadow-green-500/20">
            <div className="flex items-center justify-between mb-2">
              <Target className="h-5 w-5 text-white/80" />
              <span className="text-xs text-white/70 font-medium">Scored</span>
            </div>
            <div className="text-2xl sm:text-3xl font-bold">{stats.total_goals}</div>
            <div className="text-sm text-white/80">Goals</div>
          </ModernCard>

          <ModernCard className="p-4 bg-gradient-to-br from-purple-500 to-violet-600 text-white border-0 shadow-lg shadow-purple-500/20">
            <div className="flex items-center justify-between mb-2">
              <Zap className="h-5 w-5 text-white/80" />
              <span className="text-xs text-white/70 font-medium">Created</span>
            </div>
            <div className="text-2xl sm:text-3xl font-bold">{stats.total_assists}</div>
            <div className="text-sm text-white/80">Assists</div>
          </ModernCard>

          <ModernCard className="p-4 bg-gradient-to-br from-amber-500 to-orange-600 text-white border-0 shadow-lg shadow-amber-500/20">
            <div className="flex items-center justify-between mb-2">
              <Star className="h-5 w-5 text-white/80" />
              <span className="text-xs text-white/70 font-medium">Average</span>
            </div>
            <div className="text-2xl sm:text-3xl font-bold">
              {stats.avg_rating > 0 ? stats.avg_rating.toFixed(1) : '--'}
            </div>
            <div className="text-sm text-white/80">Rating</div>
          </ModernCard>
        </div>

      {/* Match Tabs */}
      <Tabs defaultValue="upcoming" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="upcoming" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span className="hidden sm:inline">Upcoming</span>
            <Badge variant="secondary" className="ml-1 text-xs">
              {matches.filter(m => m.isUpcoming && m.status !== 'completed' && m.status !== 'cancelled').length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="completed" className="flex items-center gap-2">
            <Trophy className="h-4 w-4" />
            <span className="hidden sm:inline">Completed</span>
            <Badge variant="secondary" className="ml-1 text-xs">
              {matches.filter(m => !m.isUpcoming || m.status === 'completed').length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="stats" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            <span className="hidden sm:inline">Statistics</span>
          </TabsTrigger>
        </TabsList>

        {/* Upcoming Matches */}
        <TabsContent value="upcoming">
          <div className="space-y-4">
            {matches.filter(m => m.isUpcoming && m.status !== 'completed' && m.status !== 'cancelled').length === 0 ? (
              <ModernCard className="p-8 text-center bg-gradient-to-br from-blue-50 to-indigo-50">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Calendar className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Upcoming Matches</h3>
                <p className="text-gray-500 max-w-md mx-auto">
                  You don't have any scheduled matches coming up. Contact your club manager for match assignments.
                </p>
              </ModernCard>
            ) : (
              matches
                .filter(m => m.isUpcoming && m.status !== 'completed' && m.status !== 'cancelled')
                .sort((a, b) => new Date(a.match_date).getTime() - new Date(b.match_date).getTime())
                .map((match) => (
                <ModernCard 
                  key={match.id} 
                  className="overflow-hidden hover:shadow-lg transition-all duration-300 border-l-4 border-l-blue-500"
                >
                  {/* Match Header */}
                  <div className="bg-gradient-to-r from-blue-500 to-indigo-600 px-4 py-2 sm:px-5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge className="bg-white/20 text-white border-0 text-xs">
                          {match.status === 'live' || match.status === 'in_progress' ? '🔴 LIVE' : 
                           match.status.charAt(0).toUpperCase() + match.status.slice(1)}
                        </Badge>
                        {match.tournament && (
                          <Badge variant="outline" className="border-white/30 text-white text-xs">
                            {match.tournament}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-white/80 text-sm">
                        <Calendar className="h-3.5 w-3.5" />
                        {formatDate(match.match_date)}
                        <Clock className="h-3.5 w-3.5 ml-2" />
                        {match.match_time}
                      </div>
                    </div>
                  </div>
                  
                  {/* Match Content - VS Display */}
                  <div className="p-4 sm:p-6">
                    <div className="flex items-center justify-between gap-4">
                      {/* Home Team */}
                      <div className="flex-1 text-center">
                        <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-2 rounded-full bg-gray-100 overflow-hidden flex items-center justify-center shadow-md">
                          {match.home_club_logo ? (
                            <Image
                              src={match.home_club_logo}
                              alt={match.home_club_name || match.home_team}
                              width={80}
                              height={80}
                              className="object-cover w-full h-full"
                            />
                          ) : (
                            <Shield className="h-8 w-8 sm:h-10 sm:w-10 text-gray-400" />
                          )}
                        </div>
                        <h3 className="font-semibold text-gray-900 text-sm sm:text-base truncate max-w-[100px] sm:max-w-[140px] mx-auto">
                          {match.home_club_name || match.home_team}
                        </h3>
                        <p className="text-xs text-gray-500">{match.home_team}</p>
                      </div>
                      
                      {/* VS Divider */}
                      <div className="flex flex-col items-center px-2 sm:px-4">
                        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
                          <span className="text-white font-bold text-sm sm:text-base">VS</span>
                        </div>
                      </div>
                      
                      {/* Away Team */}
                      <div className="flex-1 text-center">
                        <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-2 rounded-full bg-gray-100 overflow-hidden flex items-center justify-center shadow-md">
                          {match.away_club_logo ? (
                            <Image
                              src={match.away_club_logo}
                              alt={match.away_club_name || match.away_team}
                              width={80}
                              height={80}
                              className="object-cover w-full h-full"
                            />
                          ) : (
                            <Shield className="h-8 w-8 sm:h-10 sm:w-10 text-gray-400" />
                          )}
                        </div>
                        <h3 className="font-semibold text-gray-900 text-sm sm:text-base truncate max-w-[100px] sm:max-w-[140px] mx-auto">
                          {match.away_club_name || match.away_team}
                        </h3>
                        <p className="text-xs text-gray-500">{match.away_team}</p>
                      </div>
                    </div>
                    
                    {/* Match Info Footer */}
                    <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <MapPin className="h-4 w-4 text-gray-400" />
                        <span className="truncate max-w-[150px] sm:max-w-none">{match.venue}</span>
                      </div>
                      <ModernButton 
                        variant="primary" 
                        size="sm"
                        onClick={() => handleMatchNavigation(match.id, match.home_team, match.away_team, match.match_date)}
                        disabled={navigating === match.id}
                        className="flex items-center gap-1"
                      >
                        {navigating === match.id ? 'Opening...' : 'View Details'}
                        <ChevronRight className="h-4 w-4" />
                      </ModernButton>
                    </div>
                  </div>
                </ModernCard>
              ))
            )}
          </div>
        </TabsContent>

        {/* Completed Matches */}
        <TabsContent value="completed">
          <div className="space-y-4">
            {matches.filter(m => !m.isUpcoming || m.status === 'completed').length === 0 ? (
              <ModernCard className="p-8 text-center bg-gradient-to-br from-gray-50 to-slate-50">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Trophy className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Completed Matches</h3>
                <p className="text-gray-500 max-w-md mx-auto">
                  Your completed match history will appear here once you've played some games.
                </p>
              </ModernCard>
            ) : (
              matches
                .filter(m => !m.isUpcoming || m.status === 'completed')
                .sort((a, b) => new Date(b.match_date).getTime() - new Date(a.match_date).getTime())
                .map((match) => (
                <ModernCard 
                  key={match.id} 
                  className="overflow-hidden hover:shadow-lg transition-all duration-300 border-l-4 border-l-gray-400"
                >
                  {/* Match Header */}
                  <div className="bg-gradient-to-r from-gray-600 to-gray-700 px-4 py-2 sm:px-5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge className="bg-white/20 text-white border-0 text-xs">
                          Completed
                        </Badge>
                        {match.tournament && (
                          <Badge variant="outline" className="border-white/30 text-white text-xs">
                            {match.tournament}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-white/80 text-sm">
                        <Calendar className="h-3.5 w-3.5" />
                        {formatDate(match.match_date)}
                      </div>
                    </div>
                  </div>
                  
                  {/* Match Content - Score Display */}
                  <div className="p-4 sm:p-6">
                    <div className="flex items-center justify-between gap-4">
                      {/* Home Team */}
                      <div className="flex-1 text-center">
                        <div className="w-14 h-14 sm:w-16 sm:h-16 mx-auto mb-2 rounded-full bg-gray-100 overflow-hidden flex items-center justify-center shadow-md">
                          {match.home_club_logo ? (
                            <Image
                              src={match.home_club_logo}
                              alt={match.home_club_name || match.home_team}
                              width={64}
                              height={64}
                              className="object-cover w-full h-full"
                            />
                          ) : (
                            <Shield className="h-7 w-7 sm:h-8 sm:w-8 text-gray-400" />
                          )}
                        </div>
                        <h3 className="font-semibold text-gray-900 text-sm truncate max-w-[90px] sm:max-w-[120px] mx-auto">
                          {match.home_club_name || match.home_team}
                        </h3>
                      </div>
                      
                      {/* Score */}
                      <div className="flex items-center gap-2 sm:gap-4 px-2">
                        <span className="text-2xl sm:text-3xl font-bold text-gray-900">{match.home_score ?? '-'}</span>
                        <span className="text-gray-400 text-lg">:</span>
                        <span className="text-2xl sm:text-3xl font-bold text-gray-900">{match.away_score ?? '-'}</span>
                      </div>
                      
                      {/* Away Team */}
                      <div className="flex-1 text-center">
                        <div className="w-14 h-14 sm:w-16 sm:h-16 mx-auto mb-2 rounded-full bg-gray-100 overflow-hidden flex items-center justify-center shadow-md">
                          {match.away_club_logo ? (
                            <Image
                              src={match.away_club_logo}
                              alt={match.away_club_name || match.away_team}
                              width={64}
                              height={64}
                              className="object-cover w-full h-full"
                            />
                          ) : (
                            <Shield className="h-7 w-7 sm:h-8 sm:w-8 text-gray-400" />
                          )}
                        </div>
                        <h3 className="font-semibold text-gray-900 text-sm truncate max-w-[90px] sm:max-w-[120px] mx-auto">
                          {match.away_club_name || match.away_team}
                        </h3>
                      </div>
                    </div>
                    
                    {/* Player Performance Stats */}
                    {match.player_stats && (
                      <div className="mt-4 p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-100">
                        <p className="text-xs text-green-700 font-medium mb-2">Your Performance</p>
                        <div className="flex items-center justify-center gap-4 sm:gap-6 flex-wrap">
                          <div className="flex items-center gap-1.5">
                            <div className="w-7 h-7 bg-green-100 rounded-full flex items-center justify-center">
                              <Target className="h-3.5 w-3.5 text-green-600" />
                            </div>
                            <span className="text-sm font-semibold text-green-700">{match.player_stats.goals}</span>
                            <span className="text-xs text-green-600">Goals</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <div className="w-7 h-7 bg-blue-100 rounded-full flex items-center justify-center">
                              <Zap className="h-3.5 w-3.5 text-blue-600" />
                            </div>
                            <span className="text-sm font-semibold text-blue-700">{match.player_stats.assists}</span>
                            <span className="text-xs text-blue-600">Assists</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <div className="w-7 h-7 bg-purple-100 rounded-full flex items-center justify-center">
                              <Timer className="h-3.5 w-3.5 text-purple-600" />
                            </div>
                            <span className="text-sm font-semibold text-purple-700">{match.player_stats.minutes_played}</span>
                            <span className="text-xs text-purple-600">min</span>
                          </div>
                          {match.player_stats.rating && (
                            <div className="flex items-center gap-1.5">
                              <div className="w-7 h-7 bg-amber-100 rounded-full flex items-center justify-center">
                                <Star className="h-3.5 w-3.5 text-amber-600" />
                              </div>
                              <span className="text-sm font-semibold text-amber-700">{match.player_stats.rating}</span>
                              <span className="text-xs text-amber-600">/10</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {/* Match Info Footer */}
                    <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <MapPin className="h-4 w-4 text-gray-400" />
                        <span className="truncate max-w-[150px] sm:max-w-none">{match.venue}</span>
                      </div>
                      <ModernButton 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleMatchNavigation(match.id, match.home_team, match.away_team, match.match_date)}
                        disabled={navigating === match.id}
                        className="flex items-center gap-1"
                      >
                        {navigating === match.id ? 'Opening...' : 'Match Report'}
                        <ChevronRight className="h-4 w-4" />
                      </ModernButton>
                    </div>
                  </div>
                </ModernCard>
              ))
            )}
          </div>
        </TabsContent>

        {/* Statistics */}
        <TabsContent value="stats">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Performance Stats */}
            <ModernCard className="p-4 sm:p-5">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Activity className="h-5 w-5 text-orange-600" />
                Performance Statistics
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-600">Total Matches</span>
                  <span className="font-semibold text-gray-900">{stats.total_matches}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-600">Goals Scored</span>
                  <span className="font-semibold text-gray-900">{stats.total_goals}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-600">Assists</span>
                  <span className="font-semibold text-gray-900">{stats.total_assists}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-600">Average Rating</span>
                  <span className="font-semibold text-gray-900">
                    {stats.avg_rating > 0 ? `${stats.avg_rating.toFixed(1)}/10` : 'N/A'}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-gray-600">Minutes Played</span>
                  <span className="font-semibold text-gray-900">{stats.total_minutes}</span>
                </div>
              </div>
            </ModernCard>

            {/* Achievements */}
            <ModernCard className="p-4 sm:p-5">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Award className="h-5 w-5 text-amber-600" />
                Achievements & Records
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-600">Man of the Match</span>
                  <span className="font-semibold text-gray-900">{stats.man_of_match}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-600">Yellow Cards</span>
                  <span className="font-semibold text-gray-900">{stats.yellow_cards}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-600">Red Cards</span>
                  <span className="font-semibold text-gray-900">{stats.red_cards}</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-gray-600">Goals per Match</span>
                  <span className="font-semibold text-gray-900">
                    {stats.total_matches > 0 ? (stats.total_goals / stats.total_matches).toFixed(2) : '0.00'}
                  </span>
                </div>
              </div>
            </ModernCard>
          </div>
        </TabsContent>
      </Tabs>
      </div>
    </div>
  )
}