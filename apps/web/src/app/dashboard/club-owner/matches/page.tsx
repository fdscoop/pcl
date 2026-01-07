'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
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
  Shield
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
        addToast({
          title: 'Club Not Found',
          description: 'Unable to find your club information',
          type: 'error'
        })
        router.push('/dashboard/club-owner')
        return
      }

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

      setContractedPlayersCount(count || 0)

      // Get teams
      const { data: teamsData } = await supabase
        .from('teams')
        .select('*')
        .eq('club_id', clubData.id)
        .eq('is_active', true)

      setTeams(teamsData || [])

      // Get upcoming matches
      let matchesData: any[] = []
      if (teamsData && teamsData.length > 0) {
        const teamIds = teamsData.map(t => t.id).join(',')
        const { data: matches } = await supabase
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
          .order('match_date')
          .limit(10)
        
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
                const hasEnoughPlayers = contractedPlayersCount >= minPlayersRequired

                // If not enough players, don't show lineup status at all
                if (!hasEnoughPlayers) {
                  return { ...match, has_lineup: undefined }
                }

                // First, check if lineup exists for this specific match
                const { data: matchSpecificLineup } = await supabase
                  .from('team_lineups')
                  .select('id')
                  .eq('team_id', userTeamId)
                  .eq('match_id', match.id)
                  .eq('format', match.match_format)
                  .limit(1)
                  .maybeSingle()

                // If no match-specific lineup, check for template lineup (match_id = null)
                let hasLineup = !!matchSpecificLineup

                if (!matchSpecificLineup) {
                  const { data: templateLineup } = await supabase
                    .from('team_lineups')
                    .select('id')
                    .eq('team_id', userTeamId)
                    .is('match_id', null)
                    .eq('format', match.match_format)
                    .limit(1)
                    .maybeSingle()

                  // If template exists, we'll consider it as "has lineup"
                  // (it will be assigned to the match when user accesses formations page)
                  hasLineup = !!templateLineup
                }

                return {
                  ...match,
                  has_lineup: hasLineup
                }
              })
            )
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
              .select('stadium_id, photo_url')
              .in('stadium_id', stadiumIds)
              .limit(100)

            // Create a map of stadium_id to photos array
            const photosMap = new Map<string, string[]>()
            if (stadiumPhotos) {
              stadiumPhotos.forEach(photo => {
                if (!photosMap.has(photo.stadium_id)) {
                  photosMap.set(photo.stadium_id, [])
                }
                photosMap.get(photo.stadium_id)!.push(photo.photo_url)
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

          // First, check if lineup exists for this specific match
          const { data: matchSpecificLineup } = await supabase
            .from('team_lineups')
            .select('id')
            .eq('team_id', userTeamId)
            .eq('match_id', match.id)
            .eq('format', match.match_format)
            .limit(1)
            .maybeSingle()

          // If no match-specific lineup, check for template lineup (match_id = null)
          let hasLineup = !!matchSpecificLineup

          if (!matchSpecificLineup) {
            const { data: templateLineup } = await supabase
              .from('team_lineups')
              .select('id')
              .eq('team_id', userTeamId)
              .is('match_id', null)
              .eq('format', match.match_format)
              .limit(1)
              .maybeSingle()

            hasLineup = !!templateLineup
          }

          return {
            ...match,
            has_lineup: hasLineup
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

      // First, check if lineup exists for this specific match
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

      // If no match-specific lineup, check for template lineup (match_id = null)
      let userLineup = matchSpecificLineup

      if (!matchSpecificLineup) {
        const { data: templateLineup } = await supabase
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
          .is('match_id', null)
          .eq('format', match.match_format)
          .limit(1)
          .maybeSingle()

        userLineup = templateLineup
      }

      // Set the user's lineup as homeTeamLineup for the modal
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
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
        <p className="mt-4 text-gray-600">Loading matches...</p>
      </div>
    )
  }

  if (contractedPlayersCount < 8) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <NotificationCenter
          notifications={notifications}
          unreadCount={unreadCount}
          loading={notificationsLoading}
          onMarkAsRead={markAsRead}
          onMarkAllAsRead={markAllAsRead}
        />

        <Alert className="bg-gradient-to-br from-orange-50 via-orange-100 to-orange-50 border-orange-300 shadow-lg">
          <Info className="h-4 w-4" />
          <AlertTitle className="text-orange-800">Not Enough Players</AlertTitle>
          <AlertDescription className="text-orange-700">
            You need at least 8 players to participate in matches. You currently have {contractedPlayersCount} contracted players. 
            <br />
            <Button 
              onClick={() => router.push('/scout/players')}
              className="mt-3 bg-orange-600 hover:bg-orange-700 text-white"
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
      <div className="max-w-4xl mx-auto p-6">
        <div className="mb-6">
          <Button
            onClick={() => setActiveView('overview')}
            variant="outline"
            className="mb-4"
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
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <NotificationCenter
        notifications={notifications}
        unreadCount={unreadCount}
        loading={notificationsLoading}
        onMarkAsRead={markAsRead}
        onMarkAllAsRead={markAllAsRead}
      />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Matches & Fixtures</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Create friendly matches, manage fixtures, and declare your Playing XI for each game
          </p>
        </div>
        <Badge variant="outline" className="text-sm">
          {contractedPlayersCount} Players
        </Badge>
      </div>

      {/* Available Formats */}
      <Card className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-900/20 dark:via-indigo-900/20 dark:to-purple-900/20 border border-blue-100 dark:border-blue-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-blue-700 dark:text-blue-400">
            <div className="p-2 bg-blue-600 rounded-lg shadow-md">
              <Target className="h-5 w-5 text-white" />
            </div>
            Available Match Formats
          </CardTitle>
          <CardDescription className="text-gray-700 dark:text-gray-300">
            Based on your current squad size of <strong>{contractedPlayersCount} players</strong>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {getAvailableFormats().map((format) => (
              <div
                key={format}
                className="group relative overflow-hidden flex items-center gap-3 p-5 bg-white dark:bg-gray-800 rounded-xl border-2 border-gray-100 dark:border-gray-700 hover:border-blue-300 hover:shadow-lg transition-all"
              >
                <div className={`w-12 h-12 rounded-xl ${getFormatColor(format)} flex items-center justify-center text-white text-2xl shadow-md group-hover:scale-110 transition-transform`}>
                  {getFormatIcon(format)}
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900 dark:text-white text-lg">{format}</h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">
                    {format === '5-a-side' && 'Quick & Fast Paced'}
                    {format === '7-a-side' && 'Semi-Professional'}
                    {format === '11-a-side' && 'Full Professional'}
                  </p>
                </div>
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-100 dark:bg-green-900">
                  <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Create Match Card - Prominent */}
      <Card className="relative overflow-hidden bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 dark:from-emerald-900/20 dark:via-teal-900/20 dark:to-cyan-900/20 border-2 border-emerald-200 dark:border-emerald-700 shadow-lg hover:shadow-xl transition-shadow">
        {/* Decorative Elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-emerald-200/30 to-teal-200/30 rounded-full blur-3xl -mr-32 -mt-32" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-cyan-200/30 to-emerald-200/30 rounded-full blur-3xl -ml-24 -mb-24" />

        <CardHeader className="relative">
          <div className="flex items-center justify-between mb-2">
            <CardTitle className="flex items-center gap-3 text-emerald-700 dark:text-emerald-400 text-2xl">
              <div className="p-2 bg-emerald-600 rounded-xl shadow-lg">
                <Plus className="h-6 w-6 text-white" />
              </div>
              Create Friendly Match
            </CardTitle>
            <Badge className="bg-emerald-600 text-white px-3 py-1">New</Badge>
          </div>
          <CardDescription className="text-base text-gray-700 dark:text-gray-300">
            Organize a comprehensive friendly match with complete budget planning and professional staff booking
          </CardDescription>
        </CardHeader>
        <CardContent className="relative">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="group flex items-start gap-3 p-4 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl border border-emerald-100 dark:border-emerald-800 hover:border-emerald-300 hover:shadow-md transition-all">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900 dark:to-emerald-900 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                <Users className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h4 className="font-bold text-gray-900 dark:text-white mb-1">Search & Select Opponents</h4>
                <p className="text-xs text-gray-600 dark:text-gray-400">Browse verified clubs and send match requests</p>
              </div>
            </div>

            <div className="group flex items-start gap-3 p-4 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl border border-blue-100 dark:border-blue-800 hover:border-blue-300 hover:shadow-md transition-all">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-900 dark:to-cyan-900 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                <MapPin className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h4 className="font-bold text-gray-900 dark:text-white mb-1">Choose Stadium</h4>
                <p className="text-xs text-gray-600 dark:text-gray-400">Select venue with automatic pricing calculation</p>
              </div>
            </div>

            <div className="group flex items-start gap-3 p-4 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl border border-purple-100 dark:border-purple-800 hover:border-purple-300 hover:shadow-md transition-all">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-100 to-fuchsia-100 dark:from-purple-900 dark:to-fuchsia-900 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                <Calculator className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <h4 className="font-bold text-gray-900 dark:text-white mb-1">Budget Calculator</h4>
                <p className="text-xs text-gray-600 dark:text-gray-400">Automatic cost splitting between both clubs</p>
              </div>
            </div>

            <div className="group flex items-start gap-3 p-4 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl border border-orange-100 dark:border-orange-800 hover:border-orange-300 hover:shadow-md transition-all">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-100 to-amber-100 dark:from-orange-900 dark:to-amber-900 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                <UserCheck className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <h4 className="font-bold text-gray-900 dark:text-white mb-1">Professional Staff</h4>
                <p className="text-xs text-gray-600 dark:text-gray-400">Book referees & PCL staff for your match</p>
              </div>
            </div>
          </div>

          <Button
            onClick={() => setActiveView('create-friendly')}
            className="w-full bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-700 hover:via-teal-700 hover:to-cyan-700 text-white font-bold py-7 text-lg shadow-lg hover:shadow-xl transition-all group"
            size="lg"
          >
            <Plus className="h-6 w-6 mr-2 group-hover:rotate-90 transition-transform" />
            Create New Match
          </Button>
        </CardContent>
      </Card>

      {/* Upcoming Matches */}
      {matches.length > 0 && (
        <div>
          <div className="mb-5">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Your Upcoming Matches</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">Click on a match card to view details and declare your Playing XI</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {matches.map((match) => {
              const isHomeMatch = teams.some(t => t.id === match.home_team_id)
              const opponentName = isHomeMatch ? match.away_club_name : match.home_club_name
              const opponentLogo = isHomeMatch ? match.away_club_logo : match.home_club_logo
              const yourLogo = isHomeMatch ? match.home_club_logo : match.away_club_logo

              return (
                <Card
                  key={match.id}
                  onClick={() => loadMatchDetails(match)}
                  className="group cursor-pointer transition-all duration-300 border-2 border-transparent hover:border-teal-200 hover:shadow-xl overflow-hidden"
                >
                  {/* Top Accent Bar */}
                  <div className={`h-1.5 ${
                    match.match_format === '5-a-side' ? 'bg-gradient-to-r from-orange-400 to-orange-600' :
                    match.match_format === '7-a-side' ? 'bg-gradient-to-r from-emerald-400 to-emerald-600' :
                    'bg-gradient-to-r from-blue-400 to-blue-600'
                  }`} />

                  <CardContent className="p-5">
                    {/* Status Badges */}
                    <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge
                          variant="outline"
                          className={`${
                            match.match_format === '5-a-side' ? 'border-orange-300 bg-orange-50 text-orange-700' :
                            match.match_format === '7-a-side' ? 'border-emerald-300 bg-emerald-50 text-emerald-700' :
                            'border-blue-300 bg-blue-50 text-blue-700'
                          } font-semibold`}
                        >
                          {match.match_format}
                        </Badge>
                        <Badge
                          variant="outline"
                          className={`${
                            isHomeMatch
                              ? 'border-teal-300 bg-teal-50 text-teal-700'
                              : 'border-gray-300 bg-gray-50 text-gray-700'
                          } text-xs`}
                        >
                          {isHomeMatch ? 'HOME' : 'AWAY'}
                        </Badge>
                      </div>
                      <Badge
                        variant="outline"
                        className={`${
                          match.status === 'scheduled'
                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                            : 'bg-gray-50 text-gray-700 border-gray-200'
                        } text-xs font-semibold`}
                      >
                        {match.status}
                      </Badge>
                    </div>

                    {/* Match-up Display */}
                    <div className="mb-5 bg-gradient-to-br from-gray-50 to-white p-4 rounded-xl border border-gray-100">
                      <div className="flex items-center justify-between gap-3">
                        {/* Home Club */}
                        <div className="flex flex-col items-center flex-1 group-hover:scale-105 transition-transform">
                          <div className="relative mb-2">
                            {match.home_club_logo ? (
                              <img
                                src={match.home_club_logo}
                                alt={match.home_club_name}
                                className={`w-14 h-14 rounded-full object-cover shadow-md ring-2 ${
                                  isHomeMatch ? 'ring-teal-400' : 'ring-gray-300'
                                }`}
                              />
                            ) : (
                              <div className={`w-14 h-14 rounded-full bg-gradient-to-br ${
                                isHomeMatch
                                  ? 'from-teal-400 to-teal-600 ring-teal-300'
                                  : 'from-gray-200 to-gray-300 ring-gray-200'
                              } flex items-center justify-center shadow-md ring-2`}>
                                <span className={`${isHomeMatch ? 'text-white' : 'text-gray-700'} font-bold text-lg`}>
                                  {match.home_club_name?.charAt(0) || 'H'}
                                </span>
                              </div>
                            )}
                          </div>
                          <span className="text-xs font-bold text-gray-800 text-center line-clamp-2 px-1">
                            {match.home_club_name}
                          </span>
                        </div>

                        {/* VS Badge */}
                        <div className="flex-shrink-0">
                          <div className="bg-gradient-to-br from-gray-700 to-gray-900 text-white font-black text-xs px-3 py-1.5 rounded-lg shadow-md">
                            VS
                          </div>
                        </div>

                        {/* Away Club */}
                        <div className="flex flex-col items-center flex-1 group-hover:scale-105 transition-transform">
                          <div className="relative mb-2">
                            {match.away_club_logo ? (
                              <img
                                src={match.away_club_logo}
                                alt={match.away_club_name}
                                className={`w-14 h-14 rounded-full object-cover shadow-md ring-2 ${
                                  !isHomeMatch ? 'ring-teal-400' : 'ring-gray-300'
                                }`}
                              />
                            ) : (
                              <div className={`w-14 h-14 rounded-full bg-gradient-to-br ${
                                !isHomeMatch
                                  ? 'from-teal-400 to-teal-600 ring-teal-300'
                                  : 'from-gray-200 to-gray-300 ring-gray-200'
                              } flex items-center justify-center shadow-md ring-2`}>
                                <span className={`${!isHomeMatch ? 'text-white' : 'text-gray-700'} font-bold text-lg`}>
                                  {match.away_club_name?.charAt(0) || 'A'}
                                </span>
                              </div>
                            )}
                          </div>
                          <span className="text-xs font-bold text-gray-800 text-center line-clamp-2 px-1">
                            {match.away_club_name}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Match Info */}
                    <div className="space-y-2.5 mb-4">
                      <div className="flex items-center gap-2.5 text-sm">
                        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-50">
                          <Calendar className="h-4 w-4 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-xs text-gray-500 font-medium">Match Date</p>
                          <p className="text-sm font-semibold text-gray-900">
                            {new Date(match.match_date).toLocaleDateString('en-US', {
                              weekday: 'short',
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2.5 text-sm">
                        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-purple-50">
                          <Clock className="h-4 w-4 text-purple-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-xs text-gray-500 font-medium">Kick-off Time</p>
                          <p className="text-sm font-semibold text-gray-900">{match.match_time}</p>
                        </div>
                      </div>
                      {match.stadium && (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2.5 text-sm">
                            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-green-50">
                              <MapPin className="h-4 w-4 text-green-600" />
                            </div>
                            <div className="flex-1">
                              <p className="text-xs text-gray-500 font-medium">Venue</p>
                              <p className="text-sm font-semibold text-gray-900 line-clamp-1">{match.stadium.stadium_name}</p>
                            </div>
                          </div>
                          
                          {/* Stadium Photos */}
                          {match.stadium.photos && match.stadium.photos.length > 0 && (
                            <div className="mt-2 pl-10">
                              <div className="grid grid-cols-2 gap-2">
                                {match.stadium.photos.slice(0, 2).map((photo, idx) => (
                                  <div
                                    key={idx}
                                    className="h-20 rounded-lg overflow-hidden bg-gray-200 border border-gray-300 shadow-sm hover:shadow-md transition-shadow"
                                  >
                                    <img
                                      src={photo}
                                      alt={`${match.stadium?.stadium_name || 'Stadium'} - Photo ${idx + 1}`}
                                      className="w-full h-full object-cover"
                                      onError={(e) => {
                                        e.currentTarget.style.display = 'none'
                                      }}
                                    />
                                  </div>
                                ))}
                              </div>
                              {match.stadium.photos.length > 2 && (
                                <p className="text-xs text-gray-500 mt-1">+{match.stadium.photos.length - 2} more photos</p>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Lineup Status */}
                    {typeof match.has_lineup !== 'undefined' && (
                      <div className={`mt-4 pt-4 border-t ${
                        match.has_lineup ? 'border-green-100' : 'border-red-100'
                      }`}>
                        {match.has_lineup ? (
                          <div className="flex items-center gap-2 text-green-700 bg-green-50 px-3 py-2 rounded-lg">
                            <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
                            <span className="text-xs font-semibold">Playing XI Ready</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-red-700 bg-red-50 px-3 py-2 rounded-lg">
                            <Info className="h-4 w-4 flex-shrink-0" />
                            <span className="text-xs font-semibold">Playing XI Not Declared</span>
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
        <Card>
          <CardContent className="text-center py-12">
            <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              No Upcoming Matches
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Create your first friendly match to get started
            </p>
            <Button onClick={() => setActiveView('create-friendly')}>
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Match
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Match Details Modal */}
      {showMatchDetails && selectedMatch && (
        <div className="fixed inset-0 bg-white/95 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl border-2 border-gray-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <div>
                <CardTitle>Match Details</CardTitle>
                <CardDescription>
                  {selectedMatch.home_club_name} vs {selectedMatch.away_club_name}
                </CardDescription>
              </div>
              <button
                onClick={() => setShowMatchDetails(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Match Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Date</p>
                  <p className="font-semibold">{selectedMatch.match_date}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Time</p>
                  <p className="font-semibold">{selectedMatch.match_time}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Format</p>
                  <p className="font-semibold">{selectedMatch.match_format}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Stadium</p>
                  <p className="font-semibold">{selectedMatch.stadium?.stadium_name || 'N/A'}</p>
                </div>
              </div>

              {/* Formation Tab */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  Playing XI Status
                  {!homeTeamLineup && (
                    <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                      Not Ready
                    </Badge>
                  )}
                  {homeTeamLineup && (
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      Ready
                    </Badge>
                  )}
                </h3>

                {!homeTeamLineup ? (
                  <Alert className="mb-4 border-red-300 bg-red-50 dark:bg-red-900/20">
                    <Info className="h-4 w-4 text-red-800 dark:text-red-200" />
                    <AlertTitle className="text-red-800 dark:text-red-200">Playing XI Not Ready</AlertTitle>
                    <AlertDescription className="text-red-700 dark:text-red-300">
                      You haven't declared your playing XI for this match yet. Please set up your formation and select your starting lineup before the match begins.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 p-4 rounded-lg mb-4">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-green-800 dark:text-green-200 mb-1">Playing XI Ready</p>
                        <p className="text-sm text-green-700 dark:text-green-300 mb-2">Formation: {homeTeamLineup.formation}</p>
                        <p className="text-xs text-green-600 dark:text-green-400">Declared on: {new Date(homeTeamLineup.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="mt-4">
                  <Button
                    className="w-full"
                    variant={homeTeamLineup ? 'outline' : 'default'}
                    onClick={() => {
                      setShowMatchDetails(false)
                      router.push(`/dashboard/club-owner/formations?match=${selectedMatch.id}`)
                    }}
                  >
                    {homeTeamLineup ? 'Update Playing XI' : 'Declare Playing XI Now'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
