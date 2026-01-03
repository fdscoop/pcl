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
import { RegisterTournament } from './register-tournament'
import { 
  Trophy, 
  Users, 
  Calendar, 
  MapPin, 
  Clock, 
  Plus, 
  Target,
  Zap,
  CheckCircle2,
  Info,
  X,
  Calculator,
  UserCheck
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
  tournament?: {
    tournament_name: string
  }
  home_team: {
    team_name: string
  }
  away_team: {
    team_name: string
  }
  stadium?: {
    stadium_name: string
  }
}

interface Tournament {
  id: string
  tournament_name: string
  match_format: string
  start_date: string
  end_date: string
  registration_deadline: string
  max_teams: number
  current_teams: number
  status: string
}

export default function MatchesPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [club, setClub] = useState<any>(null)
  const [teams, setTeams] = useState<Team[]>([])
  const [matches, setMatches] = useState<Match[]>([])
  const [tournaments, setTournaments] = useState<Tournament[]>([])
  const [activeView, setActiveView] = useState<'overview' | 'create-friendly' | 'register-tournament'>('overview')
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
      const { data: matchesData } = await supabase
        .from('matches')
        .select(`
          *,
          tournament:tournaments(tournament_name),
          home_team:teams!matches_home_team_id_fkey(team_name),
          away_team:teams!matches_away_team_id_fkey(team_name),
          stadium:stadiums(stadium_name)
        `)
        .or(`home_team_id.in.(${teamsData?.map(t => t.id).join(',') || ''}),away_team_id.in.(${teamsData?.map(t => t.id).join(',') || ''})`)
        .gte('match_date', new Date().toISOString().split('T')[0])
        .order('match_date')
        .limit(10)

      setMatches(matchesData || [])

      // Get available tournaments for registration
      const { data: tournamentsData } = await supabase
        .from('tournaments')
        .select('*')
        .gte('registration_deadline', new Date().toISOString().split('T')[0])
        .eq('status', 'open')
        .order('start_date')
        .limit(10)

      setTournaments(tournamentsData || [])

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
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-brand-orange"></div>
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

  if (activeView === 'register-tournament') {
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
        <RegisterTournament 
          club={club} 
          teams={teams}
          tournaments={tournaments}
          availableFormats={getAvailableFormats()}
          onSuccess={() => {
            setActiveView('overview')
            loadData()
            addToast({
              title: 'Success',
              description: 'Tournament registration submitted!',
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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Matches & Tournaments</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Manage your team's matches and tournament registrations
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

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setActiveView('create-friendly')}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-600">
              <Plus className="h-5 w-5" />
              Create Enhanced Friendly Match
            </CardTitle>
            <CardDescription>
              Organize comprehensive friendly matches with budget planning
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Users className="h-4 w-4" />
                Search verified clubs and select opponents
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <MapPin className="h-4 w-4" />
                Choose stadium with automatic pricing
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Calculator className="h-4 w-4" />
                Automatic budget calculator & cost splitting
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <UserCheck className="h-4 w-4" />
                Professional referees & PCL staff booking
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setActiveView('register-tournament')}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-600">
              <Trophy className="h-5 w-5" />
              Register for Tournament
            </CardTitle>
            <CardDescription>
              Join official tournaments and competitions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Trophy className="h-4 w-4" />
                Browse available tournaments
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Users className="h-4 w-4" />
                Match your squad to format requirements
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Clock className="h-4 w-4" />
                Register before deadlines
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

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
                      <h4 className="font-semibold">
                        {match.home_team.team_name} vs {match.away_team.team_name}
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
                    {match.tournament && (
                      <p className="text-xs text-gray-500 mt-1">
                        {match.tournament.tournament_name}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Available Tournaments */}
      {tournaments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5" />
              Available Tournaments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {tournaments.map((tournament) => (
                <div
                  key={tournament.id}
                  className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border hover:border-blue-300 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white">
                        {tournament.tournament_name}
                      </h4>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline">
                          {tournament.match_format}
                        </Badge>
                        {getAvailableFormats().includes(tournament.match_format) ? (
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        ) : (
                          <X className="h-4 w-4 text-red-500" />
                        )}
                      </div>
                    </div>
                    <Badge variant="secondary">
                      {tournament.current_teams}/{tournament.max_teams}
                    </Badge>
                  </div>
                  
                  <div className="space-y-1 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3 w-3" />
                      {tournament.start_date} - {tournament.end_date}
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-3 w-3" />
                      Registration until: {tournament.registration_deadline}
                    </div>
                  </div>
                  
                  <Button 
                    size="sm" 
                    className="w-full mt-3"
                    disabled={!getAvailableFormats().includes(tournament.match_format)}
                    onClick={() => setActiveView('register-tournament')}
                  >
                    {getAvailableFormats().includes(tournament.match_format) 
                      ? 'Register Team' 
                      : 'Need More Players'
                    }
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty States */}
      {matches.length === 0 && tournaments.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Trophy className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              No Matches or Tournaments Yet
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Start by creating a friendly match or check for available tournaments
            </p>
            <div className="flex gap-3 justify-center">
              <Button onClick={() => setActiveView('create-friendly')}>
                Create Friendly Match
              </Button>
              <Button variant="outline" onClick={() => setActiveView('register-tournament')}>
                Browse Tournaments
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
