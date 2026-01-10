'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { TrendingUp, TrendingDown, Minus, Trophy, Target, Zap, Award } from 'lucide-react'

export default function PlayerStatistics() {
  const router = useRouter()
  const [userData, setUserData] = useState<any>(null)
  const [playerData, setPlayerData] = useState<any>(null)
  const [matchStats, setMatchStats] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadPlayerData()
  }, [])

  const loadPlayerData = async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/auth/login')
        return
      }

      const { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single()

      setUserData(profile)

      // Get player profile
      const { data: player } = await supabase
        .from('players')
        .select('*')
        .eq('user_id', user.id)
        .single()

      setPlayerData(player)

      // Get match statistics
      const { data: matches } = await supabase
        .from('match_players')
        .select(`
          *,
          match:matches (
            id,
            match_date,
            status,
            home_team:clubs!matches_home_team_id_fkey(club_name),
            away_team:clubs!matches_away_team_id_fkey(club_name)
          )
        `)
        .eq('player_id', player?.id)
        .order('created_at', { ascending: false })
        .limit(20)

      setMatchStats(matches || [])
    } catch (error) {
      console.error('Error loading player data:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculateOverallStats = () => {
    const totalMatches = matchStats.length
    const totalGoals = matchStats.reduce((sum, m) => sum + (m.goals || 0), 0)
    const totalAssists = matchStats.reduce((sum, m) => sum + (m.assists || 0), 0)
    const totalYellowCards = matchStats.reduce((sum, m) => sum + (m.yellow_cards || 0), 0)
    const totalRedCards = matchStats.reduce((sum, m) => sum + (m.red_cards || 0), 0)
    const avgRating = matchStats.length > 0
      ? (matchStats.reduce((sum, m) => sum + (m.rating || 0), 0) / matchStats.length).toFixed(1)
      : '0.0'

    return {
      totalMatches,
      totalGoals,
      totalAssists,
      totalYellowCards,
      totalRedCards,
      avgRating
    }
  }

  const stats = calculateOverallStats()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin"></div>
          <p className="mt-2 text-slate-600">Loading statistics...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Player Statistics</h1>
        <p className="text-slate-600 mt-1">Track your performance and progress</p>
      </div>

      {/* Overall Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 mb-6">
        <Card className="border-2 border-orange-200 bg-gradient-to-br from-orange-50 to-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-1">
              <Trophy className="w-5 h-5 text-orange-500" />
            </div>
            <p className="text-2xl font-bold text-slate-900">{stats.totalMatches}</p>
            <p className="text-xs text-slate-600 font-medium">Matches</p>
          </CardContent>
        </Card>

        <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-1">
              <Target className="w-5 h-5 text-green-500" />
            </div>
            <p className="text-2xl font-bold text-slate-900">{stats.totalGoals}</p>
            <p className="text-xs text-slate-600 font-medium">Goals</p>
          </CardContent>
        </Card>

        <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-1">
              <Zap className="w-5 h-5 text-blue-500" />
            </div>
            <p className="text-2xl font-bold text-slate-900">{stats.totalAssists}</p>
            <p className="text-xs text-slate-600 font-medium">Assists</p>
          </CardContent>
        </Card>

        <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-1">
              <Award className="w-5 h-5 text-purple-500" />
            </div>
            <p className="text-2xl font-bold text-slate-900">{stats.avgRating}</p>
            <p className="text-xs text-slate-600 font-medium">Avg Rating</p>
          </CardContent>
        </Card>

        <Card className="border-2 border-yellow-200 bg-gradient-to-br from-yellow-50 to-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-1">
              <div className="w-5 h-5 bg-yellow-400 rounded-sm"></div>
            </div>
            <p className="text-2xl font-bold text-slate-900">{stats.totalYellowCards}</p>
            <p className="text-xs text-slate-600 font-medium">Yellow Cards</p>
          </CardContent>
        </Card>

        <Card className="border-2 border-red-200 bg-gradient-to-br from-red-50 to-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-1">
              <div className="w-5 h-5 bg-red-500 rounded-sm"></div>
            </div>
            <p className="text-2xl font-bold text-slate-900">{stats.totalRedCards}</p>
            <p className="text-xs text-slate-600 font-medium">Red Cards</p>
          </CardContent>
        </Card>
      </div>

      {/* Player Profile Card */}
      <Card className="mb-6 border-2 border-orange-200">
        <CardHeader>
          <CardTitle>Player Profile</CardTitle>
          <CardDescription>Your current stats and attributes</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-slate-600 mb-1">Position</p>
              <Badge variant="secondary" className="bg-orange-100 text-orange-700 border-orange-300">
                {playerData?.position?.toUpperCase() || 'N/A'}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-slate-600 mb-1">Overall Rating</p>
              <p className="text-xl font-bold text-slate-900">{playerData?.overall_rating || 0}</p>
            </div>
            <div>
              <p className="text-sm text-slate-600 mb-1">Triblings</p>
              <p className="text-xl font-bold text-orange-600">{playerData?.triblings || 0}</p>
            </div>
            <div>
              <p className="text-sm text-slate-600 mb-1">Market Value</p>
              <p className="text-xl font-bold text-green-600">
                ₹{playerData?.market_value?.toLocaleString() || 0}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Match Performance */}
      <Card className="border-2 border-slate-200">
        <CardHeader>
          <CardTitle>Recent Match Performance</CardTitle>
          <CardDescription>Your last {matchStats.length} matches</CardDescription>
        </CardHeader>
        <CardContent>
          {matchStats.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <Trophy className="w-12 h-12 mx-auto mb-2 opacity-20" />
              <p>No match history yet</p>
              <p className="text-sm mt-1">Your stats will appear here after playing matches</p>
            </div>
          ) : (
            <div className="space-y-3">
              {matchStats.map((match, index) => (
                <div
                  key={match.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-200 hover:bg-slate-100 transition-colors"
                >
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-900">
                      {match.match?.home_team?.club_name || 'Home'} vs {match.match?.away_team?.club_name || 'Away'}
                    </p>
                    <p className="text-xs text-slate-500">
                      {new Date(match.match?.match_date).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <div className="text-center">
                      <p className="font-bold text-green-600">{match.goals || 0}</p>
                      <p className="text-[10px] text-slate-500">Goals</p>
                    </div>
                    <div className="text-center">
                      <p className="font-bold text-blue-600">{match.assists || 0}</p>
                      <p className="text-[10px] text-slate-500">Assists</p>
                    </div>
                    <div className="text-center">
                      <p className="font-bold text-purple-600">{match.rating || 0}</p>
                      <p className="text-[10px] text-slate-500">Rating</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
