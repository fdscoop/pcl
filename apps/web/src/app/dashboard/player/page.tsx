'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { UnreadContractBadge } from '@/components/UnreadContractBadge'
import { NotificationCenter } from '@/components/NotificationCenter'
import { usePlayerNotifications } from '@/hooks/usePlayerNotifications'
import { useUnreadMessages } from '@/hooks/useUnreadMessages'
import { getActiveContractForPlayer } from '@/services/contractService'
import { getPositionStats, getPositionDisplay, calculatePlayerRating, getFormTrend, getFormEmoji } from '@/utils/positionStats'
import { calculateAge, formatDate } from '@/utils/dateUtils'

export default function PlayerDashboard() {
  const router = useRouter()
  const [userData, setUserData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [pendingContractsCount, setPendingContractsCount] = useState(0)
  const [playerId, setPlayerId] = useState<string | null>(null)
  const [activeContract, setActiveContract] = useState<any>(null)
  const [activeContractClub, setActiveContractClub] = useState<any>(null)
  const [upcomingMatches, setUpcomingMatches] = useState<any[]>([])
  const [recentMatches, setRecentMatches] = useState<any[]>([])
  const [matchLineups, setMatchLineups] = useState<any[]>([]) // Track player's lineup status
  const [userId, setUserId] = useState<string | null>(null)
  const {
    notifications,
    unreadCount,
    loading: notificationsLoading,
    markAsRead,
    markAllAsRead
  } = usePlayerNotifications(playerId)
  const { unreadCount: unreadMessagesCount } = useUnreadMessages(userId)

  const loadUser = async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/auth/login')
        return
      }

      setUserId(user.id)

      // Get user profile data
      const { data: profile, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single()

      if (userError) {
        console.error('Error loading user profile:', userError)
        setUserData(null)
        return
      }

      // Get player data separately
      // Note: We can't use .eq('user_id') with specific columns - Supabase API limitation
      // So we fetch all players first, then filter in code
      const { data: allPlayers, error: playersError } = await supabase
        .from('players')
        .select('id, user_id, position, photo_url, unique_player_id, jersey_number, height_cm, weight_kg, date_of_birth, nationality, preferred_foot, current_club_id, is_available_for_scout')
        .order('created_at', { ascending: false })
      
      // Filter to only this user's players
      const players = allPlayers?.filter(p => p.user_id === user.id) || []

      if (playersError) {
        console.error('Error loading players:', playersError)
      }

      // Combine user and player data
      const combinedData = {
        ...profile,
        players: players || []
      }

      setUserData(combinedData)

      // Load pending contracts count for notification
      if (players && players.length > 0) {
        setPlayerId(players[0].id)
        const { count } = await supabase
          .from('contracts')
          .select('*', { count: 'exact', head: true })
          .eq('player_id', players[0].id)
          .eq('status', 'pending')

        setPendingContractsCount(count || 0)

        // Load active contract information
        const { contract, club } = await getActiveContractForPlayer(players[0].id)
        setActiveContract(contract)
        setActiveContractClub(club)

        // Load upcoming and recent matches if player has active contract
        if (contract && club) {
          // Fetch upcoming matches
          const { data: upcomingData } = await supabase
            .from('matches')
            .select('*, home_team:clubs!home_team_id(club_name, logo_url), away_team:clubs!away_team_id(club_name, logo_url)')
            .or(`home_team_id.eq.${club.id},away_team_id.eq.${club.id}`)
            .eq('status', 'scheduled')
            .gte('match_date', new Date().toISOString().split('T')[0])
            .order('match_date', { ascending: true })
            .limit(5)

          setUpcomingMatches(upcomingData || [])

          // Fetch recent completed matches
          const { data: recentData } = await supabase
            .from('matches')
            .select('*, home_team:clubs!home_team_id(club_name, logo_url), away_team:clubs!away_team_id(club_name, logo_url)')
            .or(`home_team_id.eq.${club.id},away_team_id.eq.${club.id}`)
            .eq('status', 'completed')
            .order('match_date', { ascending: false })
            .limit(5)

          setRecentMatches(recentData || [])

          // Check if player is in lineup for upcoming matches
          // Query team_lineup_players where player_id matches
          const upcomingMatchIds = upcomingData?.map(m => m.id) || []
          if (upcomingMatchIds.length > 0 && players[0].id) {
            const { data: lineupData } = await supabase
              .from('team_lineup_players')
              .select(`
                *,
                lineup:team_lineups(
                  id,
                  lineup_name,
                  match_id,
                  team_id
                )
              `)
              .eq('player_id', players[0].id)
            
            // Filter to only lineups for upcoming matches
            const matchLineupData = lineupData?.filter(lp => 
              lp.lineup?.match_id && upcomingMatchIds.includes(lp.lineup.match_id)
            ) || []
            
            setMatchLineups(matchLineupData)
          }
        }
      }
    } catch (error) {
      console.error('Error loading user:', error)
      setUserData(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadUser()
  }, [router])

  // Refetch data when page comes back into focus
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        loadUser()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [])

  // Refetch when returning from KYC verification
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('verified') === 'true') {
      setLoading(true)
      loadUser()
      // Clean up the query param
      window.history.replaceState({}, document.title, '/dashboard/player')
    }
  }, [])

  // Subscribe to real-time contract updates
  useEffect(() => {
    if (!userData?.players?.[0]) return

    const supabase = createClient()
    const channel = supabase
      .channel('player_contracts_realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'contracts',
          filter: `player_id=eq.${userData.players[0].id}`
        },
        () => {
          // Reload pending contracts count when new contract is added
          loadUser()
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'contracts',
          filter: `player_id=eq.${userData.players[0].id}`
        },
        () => {
          // Reload when contract status changes (e.g., becomes active)
          loadUser()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userData?.players?.[0]?.id])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-full border-4 border-orange-200 dark:border-orange-900"></div>
            <div className="w-16 h-16 rounded-full border-4 border-orange-500 border-t-transparent animate-spin absolute top-0 left-0"></div>
          </div>
          <p className="text-slate-600 dark:text-slate-400 text-base font-medium">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  // Check if player is in lineup for any upcoming match
  const getPlayerLineupStatus = (matchId: string) => {
    const lineup = matchLineups.find(lp => lp.lineup?.match_id === matchId)
    if (!lineup) return null
    return {
      isStarter: lineup.is_starter,
      position: lineup.position_on_field,
      jerseyNumber: lineup.jersey_number
    }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Main Content */}
      <div className="max-w-7xl mx-auto">
        {/* Welcome Section with Photo */}
        <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
          {/* Player Photo */}
          {userData?.players?.[0]?.photo_url ? (
            <div className="relative w-20 h-20 sm:w-24 sm:h-24 flex-shrink-0">
              <Image
                src={userData.players[0].photo_url}
                alt={`${userData.first_name} ${userData.last_name}`}
                fill
                className="rounded-2xl object-cover ring-4 ring-orange-300 dark:ring-orange-700 shadow-xl shadow-orange-500/30"
                priority
                sizes="96px"
              />
            </div>
          ) : (
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center ring-4 ring-orange-300 dark:ring-orange-700 shadow-xl shadow-orange-500/30 flex-shrink-0">
              <span className="text-4xl">⚽</span>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-slate-100">
              Welcome back, {userData?.first_name}! ⚽
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm sm:text-base mt-1">
              Manage your profile, contracts, and track your performance
            </p>
            {userData?.players?.[0]?.unique_player_id && (
              <div className="flex items-center gap-2 mt-2">
                <Badge className="bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300 border-0 text-xs">
                  ID: {userData.players[0].unique_player_id}
                </Badge>
                {activeContract && (
                  <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 border-0 text-xs">
                    ✓ Under Contract
                  </Badge>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Profile Incomplete Alert */}
        {!userData?.players?.[0] && (
          <Alert variant="info" className="mb-6 border-2 border-blue-200 dark:border-blue-900 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/50 dark:to-indigo-950/50 rounded-2xl shadow-lg">
            <div className="flex items-start gap-4">
              <div className="text-3xl">🎯</div>
              <div className="flex-1">
                <AlertTitle className="text-base font-bold mb-2 text-slate-800 dark:text-slate-100">
                  Complete Your Player Profile to Get Discovered!
                </AlertTitle>
                <AlertDescription className="space-y-3">
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
                    Your profile is incomplete. Complete it now to unlock:
                  </p>
                  <ul className="space-y-1.5 ml-4 text-sm text-slate-600 dark:text-slate-400">
                    <li className="flex items-start gap-2">
                      <span className="text-orange-500 font-bold">✓</span>
                      <span><strong>Get Scouted:</strong> Clubs can discover you</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-orange-500 font-bold">✓</span>
                      <span><strong>Contract Offers:</strong> Receive opportunities</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-orange-500 font-bold">✓</span>
                      <span><strong>Join Teams:</strong> Play in matches</span>
                    </li>
                  </ul>
                  <div className="pt-3">
                    <Button
                      onClick={() => router.push('/profile/player/complete')}
                      size="lg"
                      className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-lg shadow-orange-500/30 text-sm h-10 px-6"
                    >
                      Complete Profile Now →
                    </Button>
                  </div>
                </AlertDescription>
              </div>
            </div>
          </Alert>
        )}

        {/* 🔥 PLAYING XI LINEUP ALERT - Dynamic match lineup notification */}
        {userData?.players?.[0] && matchLineups.length > 0 && (
          <Alert className="mb-6 border-2 border-emerald-400 dark:border-emerald-700 bg-gradient-to-r from-emerald-50 via-green-50 to-teal-50 dark:from-emerald-950/50 dark:via-green-950/50 dark:to-teal-950/50 rounded-2xl shadow-xl animate-pulse">
            <div className="flex items-start gap-4">
              <div className="text-4xl">🏆</div>
              <div className="flex-1">
                <AlertTitle className="text-lg font-bold mb-2 text-emerald-800 dark:text-emerald-200">
                  🎉 You're in the Playing XI!
                </AlertTitle>
                <AlertDescription className="space-y-3">
                  <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">
                    You have been selected for {matchLineups.length} upcoming match{matchLineups.length > 1 ? 'es' : ''}!
                  </p>
                  <div className="space-y-2">
                    {matchLineups.slice(0, 2).map((lineup, idx) => {
                      const match = upcomingMatches.find(m => m.id === lineup.lineup?.match_id)
                      return match ? (
                        <div key={idx} className="flex items-center gap-3 bg-white/70 dark:bg-slate-800/50 p-3 rounded-xl border border-emerald-200 dark:border-emerald-700">
                          <Badge className={`${lineup.is_starter ? 'bg-emerald-500' : 'bg-amber-500'} text-white border-0 text-xs px-2`}>
                            {lineup.is_starter ? '⭐ Starter' : '🔄 Sub'}
                          </Badge>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">
                              {match.home_team?.club_name} vs {match.away_team?.club_name}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              {new Date(match.match_date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
                              {lineup.position_on_field && ` • ${lineup.position_on_field}`}
                              {lineup.jersey_number && ` • #${lineup.jersey_number}`}
                            </p>
                          </div>
                        </div>
                      ) : null
                    })}
                  </div>
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                    🔔 Make sure you're prepared and arrive on time for your matches!
                  </p>
                </AlertDescription>
              </div>
            </div>
          </Alert>
        )}

        {/* NOT IN LINEUP ALERT - When player has contract but not selected */}
        {userData?.players?.[0] && activeContract && upcomingMatches.length > 0 && matchLineups.length === 0 && (
          <Alert className="mb-6 border-2 border-slate-300 dark:border-slate-700 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-900/50 dark:to-slate-800/50 rounded-2xl shadow-lg">
            <div className="flex items-start gap-4">
              <div className="text-3xl">📋</div>
              <div className="flex-1">
                <AlertTitle className="text-base font-bold mb-1 text-slate-700 dark:text-slate-300">
                  Lineup Not Yet Announced
                </AlertTitle>
                <AlertDescription>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Your team has {upcomingMatches.length} upcoming match{upcomingMatches.length > 1 ? 'es' : ''}, but the lineup hasn't been finalized yet. Keep training and stay ready!
                  </p>
                </AlertDescription>
              </div>
            </div>
          </Alert>
        )}

        {/* Verified Success Alert */}
        {userData?.players?.[0] && userData?.kyc_status === 'verified' && (
          <Alert variant="success" className="mb-6 border-2 border-emerald-200 dark:border-emerald-900 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/50 dark:to-teal-950/50 rounded-2xl shadow-lg">
            <div className="flex items-start gap-4">
              <div className="text-3xl">✅</div>
              <div className="flex-1">
                <AlertTitle className="text-base font-bold mb-2 text-slate-800 dark:text-slate-100">
                  You're All Set! Clubs Can Now Find You
                </AlertTitle>
                <AlertDescription className="space-y-2">
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Your profile is complete and verified. You're visible in scout searches.
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3">
                    <div className="flex items-center gap-2 bg-white/50 dark:bg-slate-800/30 px-3 py-2 rounded-lg">
                      <span className="text-emerald-500">●</span>
                      <span className="text-xs text-slate-600 dark:text-slate-400">Profile: <strong className="text-slate-800 dark:text-slate-200">Complete</strong></span>
                    </div>
                    <div className="flex items-center gap-2 bg-white/50 dark:bg-slate-800/30 px-3 py-2 rounded-lg">
                      <span className="text-emerald-500">●</span>
                      <span className="text-xs text-slate-600 dark:text-slate-400">KYC: <strong className="text-slate-800 dark:text-slate-200">Verified</strong></span>
                    </div>
                    <div className="flex items-center gap-2 bg-white/50 dark:bg-slate-800/30 px-3 py-2 rounded-lg">
                      <span className="text-emerald-500">●</span>
                      <span className="text-xs text-slate-600 dark:text-slate-400">Scout: <strong className="text-slate-800 dark:text-slate-200">Searchable</strong></span>
                    </div>
                    <div className="flex items-center gap-2 bg-white/50 dark:bg-slate-800/30 px-3 py-2 rounded-lg">
                      <span className="text-emerald-500">●</span>
                      <span className="text-xs text-slate-600 dark:text-slate-400">ID: <strong className="text-slate-800 dark:text-slate-200">{userData.players[0].unique_player_id}</strong></span>
                    </div>
                  </div>
                </AlertDescription>
              </div>
            </div>
          </Alert>
        )}

        {/* KYC Verification Status Alert */}
        {userData?.players?.[0] && userData?.kyc_status !== 'verified' && (
          <Alert variant="warning" className="mb-6 border-2 border-amber-300 dark:border-amber-800 bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-950/50 dark:to-yellow-950/50 rounded-2xl shadow-lg">
            <div className="flex items-start gap-4">
              <div className="text-3xl">🚨</div>
              <div className="flex-1">
                <AlertTitle className="text-base font-bold mb-2 text-amber-800 dark:text-amber-200">
                  ⚠️ KYC VERIFICATION REQUIRED
                </AlertTitle>
                <AlertDescription className="space-y-3">
                  {userData?.kyc_status === 'rejected' ? (
                    <>
                      <p className="text-sm font-semibold text-amber-700 dark:text-amber-300">
                        Your KYC was rejected. Retry with valid details.
                      </p>
                      <Button
                        onClick={() => router.push('/kyc/verify')}
                        size="lg"
                        className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-lg shadow-orange-500/30 text-sm h-10 px-6 mt-2"
                      >
                        Retry KYC Verification
                      </Button>
                    </>
                  ) : (
                    <>
                      <p className="text-sm font-semibold text-amber-700 dark:text-amber-300">
                        WITHOUT KYC you CANNOT:
                      </p>
                      <ul className="space-y-1 ml-4 text-sm text-amber-600 dark:text-amber-400">
                        <li>❌ Be discovered by clubs</li>
                        <li>❌ Receive contract offers</li>
                        <li>❌ Participate in tournaments</li>
                      </ul>
                      <div className="pt-3">
                        <Button
                          onClick={() => router.push('/kyc/verify')}
                          size="lg"
                          className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-lg shadow-orange-500/30 text-sm h-10 px-6"
                        >
                          Start KYC Now
                        </Button>
                      </div>
                      <div className="bg-amber-100 dark:bg-amber-900/30 rounded-xl p-3 mt-3 text-xs text-amber-700 dark:text-amber-300">
                        <p className="font-semibold">⚡ INSTANT: 2-3 mins • Aadhaar OTP verification</p>
                      </div>
                    </>
                  )}
                </AlertDescription>
              </div>
            </div>
          </Alert>
        )}

        {/* New Contract Notification Alert */}
        {userData?.players?.[0] && pendingContractsCount > 0 && (
          <Alert className="mb-6 border-2 border-orange-400 dark:border-orange-700 bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950/50 dark:to-amber-950/50 shadow-xl shadow-orange-500/20 rounded-2xl animate-pulse">
            <div className="flex items-start gap-4">
              <div className="text-3xl">📋</div>
              <div className="flex-1">
                <AlertTitle className="text-base font-bold mb-2 text-orange-800 dark:text-orange-200">
                  🎉 {pendingContractsCount} New Contract Offer{pendingContractsCount > 1 ? 's' : ''}!
                </AlertTitle>
                <AlertDescription className="space-y-3">
                  <p className="text-sm text-orange-700 dark:text-orange-300">
                    You have received contract offers from clubs! Review the details and decide to accept or reject.
                  </p>
                  <Button
                    onClick={() => router.push('/dashboard/player/contracts')}
                    size="lg"
                    className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-lg shadow-orange-500/30 text-sm h-10 px-6"
                  >
                    View Offers ({pendingContractsCount}) →
                  </Button>
                </AlertDescription>
              </div>
            </div>
          </Alert>
        )}

        {/* New Messages Alert */}
        {userData?.players?.[0] && unreadMessagesCount > 0 && (
          <Alert className="mb-6 border-2 border-rose-400 dark:border-rose-800 bg-gradient-to-r from-rose-50 to-pink-50 dark:from-rose-950/50 dark:to-pink-950/50 shadow-xl shadow-rose-500/20 rounded-2xl animate-pulse">
            <div className="flex items-start gap-4">
              <div className="text-3xl">💬</div>
              <div className="flex-1">
                <AlertTitle className="text-base font-bold mb-2 text-rose-700 dark:text-rose-300">
                  📬 {unreadMessagesCount} New Message{unreadMessagesCount > 1 ? 's' : ''}!
                </AlertTitle>
                <AlertDescription className="space-y-3">
                  <p className="text-sm text-rose-600 dark:text-rose-400">
                    Check your inbox for club communications and respond promptly.
                  </p>
                  <Button
                    onClick={() => router.push('/dashboard/player/messages')}
                    size="lg"
                    className="bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white shadow-lg shadow-rose-500/30 text-sm h-10 px-6"
                  >
                    📬 Read Messages ({unreadMessagesCount}) →
                  </Button>
                </AlertDescription>
              </div>
            </div>
          </Alert>
        )}

        {/* Position-Specific Stats Grid */}
        {userData?.players?.[0] && (
          <div className="mb-6">
            <h2 className="text-lg sm:text-xl font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
              <span className="text-2xl">{getPositionDisplay(userData.players[0].position).split(' ')[0]}</span>
              <span className="text-slate-500 dark:text-slate-400 font-normal text-base">{getPositionDisplay(userData.players[0].position).split(' ').slice(1).join(' ')} Stats</span>
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {getPositionStats(userData.players[0].position).map((stat) => {
                const value = stat.getValue(userData.players[0])
                return (
                  <Card key={stat.key} className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:shadow-lg hover:-translate-y-0.5 transition-all border-t-4 border-t-orange-500 rounded-2xl">
                    <CardHeader className="pb-2 pt-5 px-5">
                      <CardTitle className="text-xs font-medium text-slate-500 dark:text-slate-400 flex items-center gap-2">
                        <span className="text-lg">{stat.icon}</span> {stat.label}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="px-5 pb-5">
                      <div className="text-3xl font-bold text-slate-800 dark:text-slate-100">
                        {value}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        )}

        {/* Player Rating & Form */}
        {userData?.players?.[0] && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:shadow-lg hover:-translate-y-0.5 transition-all border-t-4 border-t-blue-500 rounded-2xl">
              <CardHeader className="pb-2 pt-5 px-5">
                <CardTitle className="text-sm font-medium text-slate-500 dark:text-slate-400">
                  ⭐ Player Rating
                </CardTitle>
              </CardHeader>
              <CardContent className="px-5 pb-5">
                <div className="flex items-center gap-4">
                  <div className="text-4xl sm:text-5xl font-bold text-slate-800 dark:text-slate-100">
                    {calculatePlayerRating(userData.players[0], userData.players[0].position).toFixed(1)}
                  </div>
                  <div className="flex-1">
                    <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-orange-500 to-amber-500 transition-all"
                        style={{ width: `${(calculatePlayerRating(userData.players[0], userData.players[0].position) / 10) * 100}%` }}
                      />
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                      Based on {userData.players[0].total_matches_played || 0} matches
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:shadow-lg hover:-translate-y-0.5 transition-all border-t-4 border-t-emerald-500 rounded-2xl">
              <CardHeader className="pb-2 pt-5 px-5">
                <CardTitle className="text-sm font-medium text-slate-500 dark:text-slate-400">
                  📈 Current Form
                </CardTitle>
              </CardHeader>
              <CardContent className="px-5 pb-5">
                <div className="flex items-center gap-4">
                  <div className="text-4xl sm:text-5xl">
                    {getFormEmoji(getFormTrend(userData.players[0]))}
                  </div>
                  <div className="flex-1">
                    <p className="text-xl font-bold text-slate-800 dark:text-slate-100 capitalize">
                      {getFormTrend(userData.players[0])}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Based on last 5 matches
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Active Contract Section */}
        {userData?.players?.[0] && (
          <div className="mb-6">
            <h2 className="text-lg sm:text-xl font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
              <span className="text-2xl">📄</span> Current Contract
            </h2>

            {activeContract && activeContractClub ? (
              <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:shadow-lg hover:-translate-y-0.5 transition-all border-t-4 border-t-emerald-500 rounded-2xl">
                <CardHeader className="pb-3 pt-6 px-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-4">
                      {activeContractClub.logo_url ? (
                        <div className="relative w-16 h-16 flex-shrink-0">
                          <Image
                            src={activeContractClub.logo_url}
                            alt={activeContractClub.club_name}
                            fill
                            className="rounded-xl object-contain border-2 border-orange-200 dark:border-orange-800"
                            sizes="64px"
                          />
                        </div>
                      ) : (
                        <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center border-2 border-orange-200 dark:border-orange-800 flex-shrink-0">
                          <span className="text-2xl">⚽</span>
                        </div>
                      )}
                      <div className="min-w-0">
                        <CardTitle className="text-xl sm:text-2xl truncate">{activeContractClub.club_name}</CardTitle>
                        <CardDescription className="text-sm mt-1">
                          {activeContractClub.city && activeContractClub.state
                            ? `📍 ${activeContractClub.city}, ${activeContractClub.state}`
                            : activeContractClub.city || activeContractClub.state || 'Location not specified'}
                        </CardDescription>
                      </div>
                    </div>
                    <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 border-0 text-sm px-3 py-1 flex-shrink-0">
                      ✓ Active
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="px-6 pb-6">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                    <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                      <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Position</p>
                      <p className="font-bold text-base text-slate-800 dark:text-slate-100">
                        {activeContract.position_assigned || 'N/A'}
                      </p>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                      <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Jersey</p>
                      <p className="font-bold text-lg text-slate-800 dark:text-slate-100">
                        #{activeContract.jersey_number || 'TBD'}
                      </p>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                      <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Start</p>
                      <p className="font-bold text-sm text-slate-800 dark:text-slate-100">
                        {new Date(activeContract.contract_start_date).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: '2-digit'
                        })}
                      </p>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                      <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">End</p>
                      <p className="font-bold text-sm text-slate-800 dark:text-slate-100">
                        {new Date(activeContract.contract_end_date).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-3 pt-2">
                    <Button
                      size="lg"
                      className="flex-1 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-lg shadow-orange-500/30 text-sm h-11"
                      onClick={() => router.push(`/dashboard/player/contracts/${activeContract.id}/view`)}
                    >
                      View Contract →
                    </Button>
                    <Button
                      variant="outline"
                      size="lg"
                      className="text-sm h-11 border-slate-200 dark:border-slate-700"
                      onClick={() => router.push(`/dashboard/player/contracts`)}
                    >
                      All Contracts
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 border-t-4 border-t-slate-300 dark:border-t-slate-600 rounded-2xl">
                <CardContent className="py-12 px-6">
                  <div className="text-center text-slate-500 dark:text-slate-400">
                    <div className="text-5xl mb-4">📋</div>
                    <p className="text-lg font-medium mb-2 text-slate-700 dark:text-slate-300">No Active Contract</p>
                    <p className="text-sm mb-5 text-slate-500 dark:text-slate-400">
                      {pendingContractsCount > 0
                        ? `You have ${pendingContractsCount} pending offer${pendingContractsCount > 1 ? 's' : ''}`
                        : 'Complete profile & KYC to receive offers'}
                    </p>
                    <div className="flex gap-3 justify-center">
                      {pendingContractsCount > 0 ? (
                        <Button
                          size="lg"
                          className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-lg shadow-orange-500/30 text-sm h-11"
                          onClick={() => router.push('/dashboard/player/contracts')}
                        >
                          View Offers ({pendingContractsCount})
                        </Button>
                      ) : (
                        <>
                          <Button
                            variant="outline"
                            size="lg"
                            className="text-sm h-11 border-slate-200 dark:border-slate-700"
                            onClick={() => router.push('/profile/player/complete')}
                          >
                            Complete Profile
                          </Button>
                          {userData?.kyc_status !== 'verified' && (
                            <Button
                              size="lg"
                              className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-lg shadow-orange-500/30 text-sm h-11"
                              onClick={() => router.push('/kyc/verify')}
                            >
                              Start KYC
                            </Button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Quick Actions */}
        <div className="mb-6">
          <h2 className="text-lg sm:text-xl font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
            <span className="text-2xl">⚡</span> Quick Actions
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:shadow-lg hover:-translate-y-0.5 transition-all cursor-pointer border-t-4 border-t-orange-500 rounded-2xl">
              <CardHeader className="pb-2 pt-5 px-5">
                <CardTitle className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  <span className="text-xl">📝</span> {userData?.players?.[0] ? 'Profile' : 'Complete Profile'}
                </CardTitle>
                <CardDescription className="text-xs text-slate-500 dark:text-slate-400">
                  {userData?.players?.[0]
                    ? 'Update your position & stats'
                    : 'Add position and stats'}
                </CardDescription>
              </CardHeader>
              <CardContent className="px-5 pb-5">
                {userData?.players?.[0] ? (
                  <div className="space-y-3">
                    {/* Photo Preview */}
                    {userData.players[0].photo_url && (
                      <div className="flex justify-center">
                        <div className="relative w-14 h-14">
                          <Image
                            src={userData.players[0].photo_url}
                            alt="Profile"
                            fill
                            className="rounded-full object-cover ring-2 ring-orange-200 dark:ring-orange-800"
                            sizes="56px"
                          />
                        </div>
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-2 text-xs text-slate-500 dark:text-slate-400">
                      <div className="bg-slate-50 dark:bg-slate-800/50 p-2 rounded-lg">
                        <span className="font-medium text-slate-700 dark:text-slate-300 block">Position</span>
                        <span>{userData.players[0].position || 'N/A'}</span>
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-800/50 p-2 rounded-lg">
                        <span className="font-medium text-slate-700 dark:text-slate-300 block">Age</span>
                        <span>{calculateAge(userData.players[0].date_of_birth) || calculateAge(userData.date_of_birth) ? `${calculateAge(userData.players[0].date_of_birth || userData.date_of_birth)}y` : 'N/A'}</span>
                      </div>
                    </div>
                    <Button
                      size="lg"
                      className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-sm h-10"
                      onClick={() => router.push('/profile/player/complete')}
                    >
                      Edit Profile
                    </Button>
                  </div>
                ) : (
                  <Button
                    size="lg"
                    className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-sm h-10"
                    onClick={() => router.push('/profile/player/complete')}
                  >
                    Complete Profile
                  </Button>
                )}
              </CardContent>
            </Card>

            <Card className={`border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:shadow-lg hover:-translate-y-0.5 transition-all cursor-pointer rounded-2xl ${userData?.kyc_status !== 'verified' ? 'border-t-4 border-t-amber-500' : 'border-t-4 border-t-emerald-500'}`}>
              <CardHeader className="pb-2 pt-5 px-5">
                <CardTitle className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  <span className="text-xl">🔐</span> KYC {userData?.kyc_status !== 'verified' ? <Badge className="bg-amber-500 text-white border-0 text-[10px]">Required</Badge> : ''}
                </CardTitle>
                <CardDescription className="text-xs text-slate-500 dark:text-slate-400">
                  {userData?.kyc_status === 'verified'
                    ? 'Your identity is verified'
                    : 'Mandatory for scouting'}
                </CardDescription>
              </CardHeader>
              <CardContent className="px-5 pb-5">
                {userData?.kyc_status === 'verified' ? (
                  <div className="space-y-2">
                    <Button variant="outline" size="lg" className="w-full border-emerald-300 dark:border-emerald-700 text-emerald-600 dark:text-emerald-400 text-sm h-10" disabled>
                      ✓ Verified
                    </Button>
                    {userData?.kyc_verified_at && (
                      <p className="text-xs text-center text-slate-400 dark:text-slate-500">
                        Verified on {new Date(userData.kyc_verified_at).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                ) : userData?.kyc_status === 'pending' ? (
                  <Button variant="outline" size="lg" className="w-full text-sm h-10" disabled>
                    ⏳ Under Review
                  </Button>
                ) : (
                  <div className="space-y-2">
                    <Button
                      size="lg"
                      className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-sm h-10"
                      onClick={() => router.push('/kyc/verify')}
                  >
                    Start KYC
                  </Button>
                  <p className="text-xs text-center text-slate-400 dark:text-slate-500">⚡ 2-3 mins • Instant</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:shadow-lg hover:-translate-y-0.5 transition-all cursor-pointer border-t-4 border-t-blue-500 rounded-2xl">
            <CardHeader className="pb-2 pt-5 px-5">
              <CardTitle className="relative inline-block text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <span className="text-xl">📋</span> Contracts
                <UnreadContractBadge userType="player" />
              </CardTitle>
              <CardDescription className="text-xs text-slate-500 dark:text-slate-400">
                View contract offers & agreements
              </CardDescription>
            </CardHeader>
            <CardContent className="px-5 pb-5">
              <Button
                size="lg"
                className="w-full bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white text-sm h-10"
                onClick={() => router.push('/dashboard/player/contracts')}
              >
                View Contracts
              </Button>
            </CardContent>
          </Card>

          <Card
            className={`border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:shadow-lg hover:-translate-y-0.5 transition-all cursor-pointer rounded-2xl ${
              unreadMessagesCount > 0
                ? 'border-2 border-rose-400 dark:border-rose-700 bg-gradient-to-br from-rose-50 to-pink-50 dark:from-rose-950/30 dark:to-pink-950/30 shadow-lg shadow-rose-500/20'
                : 'border-t-4 border-t-rose-500'
            }`}
            onClick={() => router.push('/dashboard/player/messages')}
          >
            <CardHeader className="pb-2 pt-5 px-5">
              <CardTitle className={`flex items-center gap-2 text-sm font-bold ${
                unreadMessagesCount > 0 ? 'text-rose-700 dark:text-rose-300' : 'text-slate-800 dark:text-slate-100'
              }`}>
                <span className="text-xl">💬</span> Messages
                {unreadMessagesCount > 0 && (
                  <Badge className="bg-rose-500 text-white border-0 text-xs px-2 py-0.5 animate-pulse">
                    {unreadMessagesCount} new
                  </Badge>
                )}
              </CardTitle>
              <CardDescription className={`text-xs ${
                unreadMessagesCount > 0 ? 'text-rose-600 dark:text-rose-400 font-medium' : 'text-slate-500 dark:text-slate-400'
              }`}>
                {unreadMessagesCount > 0
                  ? `${unreadMessagesCount} unread messages`
                  : 'Club communications'}
              </CardDescription>
            </CardHeader>
            <CardContent className="px-5 pb-5">
              <Button
                size="lg"
                className={`w-full text-sm h-10 ${
                  unreadMessagesCount > 0 
                    ? 'bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white font-semibold' 
                    : 'bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white'
                }`}
                onClick={() => router.push('/dashboard/player/messages')}
              >
                {unreadMessagesCount > 0 ? `📬 View ${unreadMessagesCount} New` : 'Open Inbox'}
              </Button>
            </CardContent>
          </Card>
          </div>
        </div>

        {/* Upcoming Matches & Recent Performance */}
        {userData?.players?.[0] && activeContract && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {/* Upcoming Matches */}
            <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:shadow-lg hover:-translate-y-0.5 transition-all border-t-4 border-t-blue-500 rounded-2xl">
              <CardHeader className="pb-3 pt-5 px-5">
                <CardTitle className="flex items-center gap-2 text-base font-bold text-slate-800 dark:text-slate-100">
                  <span className="text-xl">📅</span> Upcoming Matches
                </CardTitle>
                <CardDescription className="text-xs text-slate-500 dark:text-slate-400">Next {upcomingMatches.length} fixtures for your team</CardDescription>
              </CardHeader>
              <CardContent className="px-5 pb-5">
                {upcomingMatches.length > 0 ? (
                  <div className="space-y-3">
                    {upcomingMatches.slice(0, 3).map((match) => {
                      const lineupStatus = getPlayerLineupStatus(match.id)
                      return (
                        <div key={match.id} className={`flex items-center justify-between p-4 rounded-xl border ${
                          lineupStatus 
                            ? lineupStatus.isStarter 
                              ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800' 
                              : 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800'
                            : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700'
                        }`}>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 text-sm font-semibold text-slate-800 dark:text-slate-100">
                              <span className="truncate">{match.home_team?.club_name || 'Home'}</span>
                              <span className="text-slate-400 dark:text-slate-500">vs</span>
                              <span className="truncate">{match.away_team?.club_name || 'Away'}</span>
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                              {new Date(match.match_date).toLocaleDateString('en-IN', {
                                weekday: 'short',
                                day: 'numeric',
                                month: 'short'
                              })}
                              {match.match_time && ` • ${match.match_time}`}
                            </p>
                            {lineupStatus && (
                              <div className="mt-2">
                                <Badge className={`${lineupStatus.isStarter ? 'bg-emerald-500' : 'bg-amber-500'} text-white border-0 text-[10px]`}>
                                  {lineupStatus.isStarter ? '⭐ Starting XI' : '🔄 Substitute'}
                                  {lineupStatus.position && ` • ${lineupStatus.position}`}
                                </Badge>
                              </div>
                            )}
                          </div>
                          <Badge className="bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300 border-0 text-xs ml-3">
                            {match.match_format || '11v11'}
                          </Badge>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-400 dark:text-slate-500">
                    <div className="text-4xl mb-2">📅</div>
                    <p className="text-sm font-medium">No upcoming matches</p>
                    <p className="text-xs mt-1">Check back later for fixtures</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Performance */}
            <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:shadow-lg hover:-translate-y-0.5 transition-all border-t-4 border-t-orange-500 rounded-2xl">
              <CardHeader className="pb-3 pt-5 px-5">
                <CardTitle className="flex items-center gap-2 text-base font-bold text-slate-800 dark:text-slate-100">
                  <span className="text-xl">📊</span> Recent Performance
                </CardTitle>
                <CardDescription className="text-xs text-slate-500 dark:text-slate-400">Last {recentMatches.length} completed matches</CardDescription>
              </CardHeader>
              <CardContent className="px-5 pb-5">
                {recentMatches.length > 0 ? (
                  <div className="space-y-3">
                    {recentMatches.slice(0, 3).map((match) => {
                      const isHome = match.home_team_id === activeContractClub?.id
                      const ourScore = isHome ? match.home_team_score : match.away_team_score
                      const theirScore = isHome ? match.away_team_score : match.home_team_score
                      const result = ourScore > theirScore ? 'W' : ourScore < theirScore ? 'L' : 'D'
                      const resultColor = result === 'W' ? 'bg-emerald-500' : result === 'L' ? 'bg-rose-500' : 'bg-amber-500'

                      return (
                        <div key={match.id} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 text-sm font-semibold text-slate-800 dark:text-slate-100">
                              <Badge className={`${resultColor} text-white border-0 text-xs px-2 py-0.5`}>
                                {result}
                              </Badge>
                              <span className="truncate">{match.home_team?.club_name || 'Home'}</span>
                              <span className="text-slate-500 dark:text-slate-400 font-medium text-sm">
                                {match.home_team_score ?? 0}-{match.away_team_score ?? 0}
                              </span>
                              <span className="truncate">{match.away_team?.club_name || 'Away'}</span>
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                              {new Date(match.match_date).toLocaleDateString('en-IN', {
                                weekday: 'short',
                                day: 'numeric',
                                month: 'short'
                              })}
                            </p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-400 dark:text-slate-500">
                    <div className="text-4xl mb-2">📊</div>
                    <p className="text-sm font-medium">No match history</p>
                    <p className="text-xs mt-1">Your match results will appear here</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Recent Activity */}
        <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:shadow-lg hover:-translate-y-0.5 transition-all border-t-4 border-t-purple-500 rounded-2xl">
          <CardHeader className="pb-3 pt-5 px-5">
            <CardTitle className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <span className="text-xl">🔔</span> Recent Activity
            </CardTitle>
            <CardDescription className="text-xs text-slate-500 dark:text-slate-400">Latest updates and notifications</CardDescription>
          </CardHeader>
          <CardContent className="px-5 pb-5">
            <div className="text-center py-10 text-slate-400 dark:text-slate-500">
              <div className="text-4xl mb-2">🔔</div>
              <p className="text-sm font-medium">No recent activity</p>
              <p className="text-xs mt-1">Complete your profile to get started!</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
