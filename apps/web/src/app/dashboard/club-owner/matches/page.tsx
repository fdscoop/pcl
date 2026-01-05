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
    stadium_name: string
  }
}

export default function MatchesPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [club, setClub] = useState<any>(null)
  const [teams, setTeams] = useState<Team[]>([])
  const [matches, setMatches] = useState<Match[]>([])
  const [activeView, setActiveView] = useState<'overview' | 'create-friendly'>('overview')
  const [contractedPlayersCount, setContractedPlayersCount] = useState(0)
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
            stadium:stadiums(stadium_name)
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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Book a Match</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Create friendly matches with other clubs
          </p>
        </div>
        <Badge variant="outline" className="text-sm">
          {contractedPlayersCount} Players
        </Badge>
      </div>

      {/* Available Formats */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Available Match Formats
          </CardTitle>
          <CardDescription>
            Based on your current squad size of {contractedPlayersCount} players
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {getAvailableFormats().map((format) => (
              <div
                key={format}
                className="flex items-center gap-3 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
              >
                <div className={`w-10 h-10 rounded-full ${getFormatColor(format)} flex items-center justify-center text-white text-xl`}>
                  {getFormatIcon(format)}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">{format}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {format === '5-a-side' && 'Quick & Fast'}
                    {format === '7-a-side' && 'Semi-Professional'}
                    {format === '11-a-side' && 'Professional'}
                  </p>
                </div>
                <CheckCircle2 className="h-5 w-5 text-green-500 ml-auto" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Create Match Card - Prominent */}
      <Card className="bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 dark:from-green-900/20 dark:via-emerald-900/20 dark:to-teal-900/20 border-2 border-green-200 dark:border-green-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-400 text-xl">
            <Plus className="h-6 w-6" />
            Create Friendly Match
          </CardTitle>
          <CardDescription className="text-base">
            Organize a comprehensive friendly match with automatic budget planning
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="flex items-start gap-3 p-3 bg-white/60 dark:bg-gray-800/60 rounded-lg">
              <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center flex-shrink-0">
                <Users className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-1">Search & Select Opponents</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">Browse verified clubs and send match requests</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3 p-3 bg-white/60 dark:bg-gray-800/60 rounded-lg">
              <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center flex-shrink-0">
                <MapPin className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-1">Choose Stadium</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">Select venue with automatic pricing calculation</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3 p-3 bg-white/60 dark:bg-gray-800/60 rounded-lg">
              <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center flex-shrink-0">
                <Calculator className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-1">Budget Calculator</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">Automatic cost splitting between both clubs</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3 p-3 bg-white/60 dark:bg-gray-800/60 rounded-lg">
              <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900 flex items-center justify-center flex-shrink-0">
                <UserCheck className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-1">Professional Staff</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">Book referees & PCL staff for your match</p>
              </div>
            </div>
          </div>
          
          <Button 
            onClick={() => setActiveView('create-friendly')}
            className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold py-6 text-lg"
            size="lg"
          >
            <Plus className="h-5 w-5 mr-2" />
            Create New Match
          </Button>
        </CardContent>
      </Card>

      {/* Upcoming Matches */}
      {matches.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Upcoming Matches
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {matches.map((match) => (
                <div
                  key={match.id}
                  className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-8 h-8 rounded-full ${getFormatColor(match.match_format)} flex items-center justify-center text-white text-sm`}>
                      {getFormatIcon(match.match_format)}
                    </div>
                    <div>
                      <h4 className="font-semibold flex items-center gap-2">
                        <div className="flex items-center gap-1">
                          {match.home_club_logo ? (
                            <img
                              src={match.home_club_logo}
                              alt={match.home_club_name}
                              className="w-5 h-5 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-5 h-5 rounded-full bg-gray-300 dark:bg-gray-600" />
                          )}
                          <span>{match.home_club_name}</span>
                        </div>
                        <span className="text-gray-400">vs</span>
                        <div className="flex items-center gap-1">
                          {match.away_club_logo ? (
                            <img
                              src={match.away_club_logo}
                              alt={match.away_club_name}
                              className="w-5 h-5 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-5 h-5 rounded-full bg-gray-300 dark:bg-gray-600" />
                          )}
                          <span>{match.away_club_name}</span>
                        </div>
                      </h4>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span>{match.match_date}</span>
                        <span>{match.match_time}</span>
                        {match.stadium && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {match.stadium.stadium_name}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant={match.status === 'scheduled' ? 'default' : 'secondary'}>
                      {match.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
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
    </div>
  )
}
