'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
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
            .select('*, home_team:clubs!matches_home_team_id_fkey(club_name, logo_url), away_team:clubs!matches_away_team_id_fkey(club_name, logo_url)')
            .or(`home_team_id.eq.${club.id},away_team_id.eq.${club.id}`)
            .eq('status', 'scheduled')
            .gte('match_date', new Date().toISOString().split('T')[0])
            .order('match_date', { ascending: true })
            .limit(5)

          setUpcomingMatches(upcomingData || [])

          // Fetch recent completed matches
          const { data: recentData } = await supabase
            .from('matches')
            .select('*, home_team:clubs!matches_home_team_id_fkey(club_name, logo_url), away_team:clubs!matches_away_team_id_fkey(club_name, logo_url)')
            .or(`home_team_id.eq.${club.id},away_team_id.eq.${club.id}`)
            .eq('status', 'completed')
            .order('match_date', { ascending: false })
            .limit(5)

          setRecentMatches(recentData || [])
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

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="bg-card border-b border-border shadow-sm sticky top-0 z-50 backdrop-blur-sm bg-card/95">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <img src="/logo.png" alt="PCL Logo" className="h-10 w-10" />
              <span className="text-lg font-semibold text-foreground hidden sm:inline">
                Professional Club League
              </span>
            </div>
            <div className="flex items-center gap-4">
              <NotificationCenter
                notifications={notifications}
                unreadCount={unreadCount}
                onMarkAsRead={markAsRead}
                onMarkAllAsRead={markAllAsRead}
                loading={notificationsLoading}
              />
              <span className="text-sm text-muted-foreground">
                {userData?.first_name} {userData?.last_name}
              </span>
              <Button onClick={handleSignOut} variant="outline" size="sm" className="btn-lift">
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Welcome Section with Photo */}
        <div className="mb-8 flex items-center gap-6">
          {/* Player Photo */}
          {userData?.players?.[0]?.photo_url ? (
            <div className="relative w-24 h-24">
              <Image
                src={userData.players[0].photo_url}
                alt={`${userData.first_name} ${userData.last_name}`}
                fill
                className="rounded-full object-cover border-4 border-accent/30 shadow-lg"
                priority
                sizes="96px"
              />
            </div>
          ) : (
            <div className="w-24 h-24 rounded-full gradient-orange flex items-center justify-center border-4 border-accent/30 shadow-lg">
              <span className="text-4xl">⚽</span>
            </div>
          )}
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Welcome back, {userData?.first_name}! ⚽
            </h1>
            <p className="text-muted-foreground">
              Manage your player profile, contracts, and performance statistics
            </p>
          </div>
        </div>

        {/* Profile Incomplete Alert */}
        {!userData?.players?.[0] && (
          <Alert variant="info" className="mb-8">
            <div className="flex items-start gap-4">
              <div className="text-4xl">🎯</div>
              <div className="flex-1">
                <AlertTitle className="text-lg font-semibold mb-2">
                  Complete Your Player Profile to Get Discovered!
                </AlertTitle>
                <AlertDescription className="space-y-3">
                  <p className="font-medium">
                    Your profile is incomplete. Complete it now to unlock these opportunities:
                  </p>
                  <ul className="space-y-2 ml-4">
                    <li className="flex items-start gap-2">
                      <span className="text-accent font-bold">✓</span>
                      <span><strong>Get Scouted:</strong> After KYC verification, clubs can discover you in their player search</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-accent font-bold">✓</span>
                      <span><strong>Receive Contract Offers:</strong> Clubs can contact you directly with professional opportunities</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-accent font-bold">✓</span>
                      <span><strong>Join Teams:</strong> Get recruited to play in matches and tournaments</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-accent font-bold">✓</span>
                      <span><strong>Track Your Career:</strong> Monitor your stats, goals, assists, and match history</span>
                    </li>
                  </ul>
                  <div className="pt-2">
                    <Button
                      onClick={() => router.push('/profile/player/complete')}
                      variant="gradient"
                      className="btn-lift"
                    >
                      Complete Profile Now →
                    </Button>
                  </div>
                </AlertDescription>
              </div>
            </div>
          </Alert>
        )}

        {/* Verified Success Alert */}
        {userData?.players?.[0] && userData?.kyc_status === 'verified' && (
          <Alert variant="success" className="mb-8">
            <div className="flex items-start gap-4">
              <div className="text-4xl">✅</div>
              <div className="flex-1">
                <AlertTitle className="text-lg font-semibold mb-2">
                  You're All Set! Clubs Can Now Find You
                </AlertTitle>
                <AlertDescription className="space-y-2">
                  <p>
                    <strong>Congratulations!</strong> Your profile is complete and verified. You're now visible in club scout searches.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm mt-3">
                    <div className="flex items-center gap-2">
                      <span className="text-accent">●</span>
                      <span>Profile: <strong>Complete</strong></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-accent">●</span>
                      <span>KYC: <strong>Verified</strong></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-accent">●</span>
                      <span>Scout Status: <strong>Searchable</strong></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-accent">●</span>
                      <span>Player ID: <strong>{userData.players[0].unique_player_id}</strong></span>
                    </div>
                  </div>
                </AlertDescription>
              </div>
            </div>
          </Alert>
        )}

        {/* KYC Verification Status Alert */}
        {userData?.players?.[0] && userData?.kyc_status !== 'verified' && (
          <Alert variant="warning" className="mb-8">
            <div className="flex items-start gap-4">
              <div className="text-4xl">🚨</div>
              <div className="flex-1">
                <AlertTitle className="text-lg font-semibold mb-2">
                  ⚠️ KYC VERIFICATION REQUIRED (Mandatory)
                </AlertTitle>
                <AlertDescription className="space-y-3">
                  {userData?.kyc_status === 'rejected' ? (
                    <>
                      <p className="font-semibold mb-2">
                        Your KYC verification was rejected.
                      </p>
                      <p>
                        You can retry the verification process. Please ensure you provide valid Aadhaar details.
                      </p>
                      <p className="font-semibold text-sm mt-3">
                        ✅ Retry verification now:
                      </p>
                      <div className="pt-2">
                        <Button
                          onClick={() => router.push('/kyc/verify')}
                          variant="gradient"
                          className="w-full btn-lift"
                        >
                          Retry KYC Verification
                        </Button>
                      </div>
                    </>
                  ) : (
                    <>
                      <p className="font-semibold">
                        WITHOUT KYC verification, you CANNOT:
                      </p>
                      <ul className="space-y-1 ml-4 text-sm">
                        <li>❌ Be discovered by clubs in scout searches</li>
                        <li>❌ Receive contract offers</li>
                        <li>❌ Participate in tournaments</li>
                        <li>❌ Get scouted for professional opportunities</li>
                      </ul>
                      <p className="font-semibold text-sm mt-3">
                        ✅ Complete it now to unlock all features!
                      </p>
                      <div className="pt-3 flex gap-2">
                        <Button
                          onClick={() => router.push('/kyc/verify')}
                          variant="gradient"
                          className="flex-1 btn-lift"
                        >
                          Start KYC Now
                        </Button>
                      </div>
                      <div className="bg-card/50 rounded p-2 mt-2 text-xs">
                        <p className="font-semibold mb-1">⚡ INSTANT VERIFICATION:</p>
                        <ul className="space-y-1">
                          <li>• Takes only 2-3 minutes</li>
                          <li>• Verify with Aadhaar OTP</li>
                          <li>• Instant approval (no waiting)</li>
                        </ul>
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
          <Alert variant="orange" className="mb-8 animate-pulse">
            <div className="flex items-start gap-4">
              <div className="text-4xl">📋</div>
              <div className="flex-1">
                <AlertTitle className="text-lg font-semibold mb-2">
                  🎉 You Have {pendingContractsCount} New Contract Offer{pendingContractsCount > 1 ? 's' : ''}!
                </AlertTitle>
                <AlertDescription className="space-y-2">
                  <p>
                    Great news! Club{pendingContractsCount > 1 ? 's' : ''} ha{pendingContractsCount > 1 ? 've' : 's'} sent you contract offer{pendingContractsCount > 1 ? 's' : ''}.
                    Review the details and decide whether to accept or reject.
                  </p>
                  <div className="pt-3">
                    <Button
                      onClick={() => router.push('/dashboard/player/contracts')}
                      variant="gradient"
                      className="btn-lift"
                    >
                      View Contract Offers ({pendingContractsCount}) →
                    </Button>
                  </div>
                </AlertDescription>
              </div>
            </div>
          </Alert>
        )}

        {/* New Messages Alert */}
        {userData?.players?.[0] && unreadMessagesCount > 0 && (
          <Alert className="mb-8 border-2 border-destructive bg-gradient-to-r from-destructive/20 via-destructive/15 to-destructive/10 shadow-xl shadow-destructive/30 animate-pulse">
            <div className="flex items-start gap-4">
              <div className="text-4xl">💬</div>
              <div className="flex-1">
                <AlertTitle className="text-xl font-bold mb-2 text-destructive">
                  📬 You Have {unreadMessagesCount} New Message{unreadMessagesCount > 1 ? 's' : ''}!
                </AlertTitle>
                <AlertDescription className="space-y-2">
                  <p className="text-foreground font-medium">
                    Club{unreadMessagesCount > 1 ? 's have' : ' has'} sent you new message{unreadMessagesCount > 1 ? 's' : ''}.
                    Check your inbox to read and respond to communications.
                  </p>
                  <div className="pt-3">
                    <Button
                      onClick={() => router.push('/dashboard/player/messages')}
                      variant="destructive"
                      size="lg"
                      className="btn-lift shadow-lg font-bold"
                    >
                      📬 Read Messages ({unreadMessagesCount}) →
                    </Button>
                  </div>
                </AlertDescription>
              </div>
            </div>
          </Alert>
        )}

        {/* Position-Specific Stats Grid */}
        {userData?.players?.[0] && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
              <span>{getPositionDisplay(userData.players[0].position).split(' ')[0]}</span>
              {getPositionDisplay(userData.players[0].position).split(' ').slice(1).join(' ')} Statistics
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {getPositionStats(userData.players[0].position).map((stat) => {
                const value = stat.getValue(userData.players[0])
                return (
                  <Card key={stat.key} className="card-hover border-l-4 border-l-accent">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                        <span>{stat.icon}</span> {stat.label}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-foreground">
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <Card className="card-hover border-l-4 border-l-primary">
              <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Player Rating
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <div className="text-4xl font-bold text-foreground">
                    {calculatePlayerRating(userData.players[0], userData.players[0].position).toFixed(1)}
                  </div>
                  <div className="flex-1">
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-accent to-primary transition-all"
                        style={{ width: `${(calculatePlayerRating(userData.players[0], userData.players[0].position) / 10) * 100}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Based on {userData.players[0].total_matches_played || 0} matches
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="card-hover border-l-4 border-l-success">
              <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Current Form
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <div className="text-4xl">
                    {getFormEmoji(getFormTrend(userData.players[0]))}
                  </div>
                  <div className="flex-1">
                    <p className="text-lg font-semibold text-foreground capitalize">
                      {getFormTrend(userData.players[0])}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Last 5 matches performance
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Active Contract Section */}
        {userData?.players?.[0] && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
              <span>📄</span> Current Contract
            </h2>

            {activeContract && activeContractClub ? (
              <Card className="card-hover border-l-4 border-l-success">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      {activeContractClub.logo_url ? (
                        <div className="relative w-16 h-16 flex-shrink-0">
                          <Image
                            src={activeContractClub.logo_url}
                            alt={activeContractClub.club_name}
                            fill
                            className="rounded-lg object-contain border-2 border-accent/30"
                            sizes="64px"
                          />
                        </div>
                      ) : (
                        <div className="w-16 h-16 rounded-lg gradient-orange flex items-center justify-center border-2 border-accent/30 flex-shrink-0">
                          <span className="text-3xl">⚽</span>
                        </div>
                      )}
                      <div>
                        <CardTitle className="text-2xl">{activeContractClub.club_name}</CardTitle>
                        <CardDescription className="text-sm mt-1">
                          {activeContractClub.city && activeContractClub.state
                            ? `${activeContractClub.city}, ${activeContractClub.state}`
                            : activeContractClub.city || activeContractClub.state || 'Location not specified'}
                        </CardDescription>
                      </div>
                    </div>
                    <Badge variant="success" className="text-xs">
                      Active Contract
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div className="bg-card/50 p-3 rounded-lg border border-border">
                      <p className="text-xs text-muted-foreground mb-1">Position</p>
                      <p className="font-semibold text-foreground">
                        {activeContract.position_assigned || 'Not specified'}
                      </p>
                    </div>
                    <div className="bg-card/50 p-3 rounded-lg border border-border">
                      <p className="text-xs text-muted-foreground mb-1">Jersey Number</p>
                      <p className="font-semibold text-foreground text-xl">
                        #{activeContract.jersey_number || 'TBD'}
                      </p>
                    </div>
                    <div className="bg-card/50 p-3 rounded-lg border border-border">
                      <p className="text-xs text-muted-foreground mb-1">Contract Start</p>
                      <p className="font-semibold text-foreground text-sm">
                        {new Date(activeContract.contract_start_date).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </p>
                    </div>
                    <div className="bg-card/50 p-3 rounded-lg border border-border">
                      <p className="text-xs text-muted-foreground mb-1">Contract End</p>
                      <p className="font-semibold text-foreground text-sm">
                        {new Date(activeContract.contract_end_date).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-3 pt-2">
                    <Button
                      variant="gradient"
                      className="flex-1 btn-lift"
                      onClick={() => router.push(`/dashboard/player/contracts/${activeContract.id}/view`)}
                    >
                      View Full Contract →
                    </Button>
                    <Button
                      variant="outline"
                      className="btn-lift"
                      onClick={() => router.push(`/dashboard/player/contracts`)}
                    >
                      All Contracts
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="card-hover border-l-4 border-l-muted-foreground/30">
                <CardContent className="py-8">
                  <div className="text-center text-muted-foreground">
                    <div className="text-6xl mb-4">📋</div>
                    <p className="text-lg font-medium mb-2">No Active Contract</p>
                    <p className="text-sm mb-4">
                      {pendingContractsCount > 0
                        ? `You have ${pendingContractsCount} pending contract offer${pendingContractsCount > 1 ? 's' : ''} waiting for your review`
                        : 'Complete your profile and KYC verification to receive contract offers from clubs'}
                    </p>
                    <div className="flex gap-3 justify-center mt-6">
                      {pendingContractsCount > 0 ? (
                        <Button
                          variant="gradient"
                          className="btn-lift"
                          onClick={() => router.push('/dashboard/player/contracts')}
                        >
                          View Pending Offers ({pendingContractsCount})
                        </Button>
                      ) : (
                        <>
                          <Button
                            variant="outline"
                            className="btn-lift"
                            onClick={() => router.push('/profile/player/complete')}
                          >
                            Complete Profile
                          </Button>
                          {userData?.kyc_status !== 'verified' && (
                            <Button
                              variant="gradient"
                              className="btn-lift"
                              onClick={() => router.push('/kyc/verify')}
                            >
                              Start KYC Verification
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="card-hover border-l-4 border-l-accent cursor-pointer">
            <CardHeader>
              <CardTitle>📝 {userData?.players?.[0] ? 'Update Your Profile' : 'Complete Your Profile'}</CardTitle>
              <CardDescription>
                {userData?.players?.[0]
                  ? 'Update your playing position, stats, and preferences'
                  : 'Add your playing position, stats, and preferences'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {userData?.players?.[0] ? (
                <div className="space-y-3">
                  {/* Photo Preview */}
                  {userData.players[0].photo_url && (
                    <div className="flex justify-center">
                      <div className="relative w-16 h-16">
                        <Image
                          src={userData.players[0].photo_url}
                          alt="Profile"
                          fill
                          className="rounded-full object-cover border-2 border-accent/30"
                          sizes="64px"
                        />
                      </div>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                    <div>
                      <span className="font-medium">Position:</span> {userData.players[0].position || 'N/A'}
                    </div>
                    <div>
                      <span className="font-medium">Nationality:</span> {userData.players[0].nationality || 'N/A'}
                    </div>
                    <div>
                      <span className="font-medium">Age:</span> {calculateAge(userData.players[0].date_of_birth) || calculateAge(userData.date_of_birth) ? `${calculateAge(userData.players[0].date_of_birth || userData.date_of_birth)} years` : 'N/A'}
                    </div>
                    <div>
                      <span className="font-medium">DOB:</span> {formatDate(userData.players[0].date_of_birth || userData.date_of_birth, 'short')}
                    </div>
                    <div>
                      <span className="font-medium">Height:</span> {userData.players[0].height_cm ? `${userData.players[0].height_cm} cm` : 'N/A'}
                    </div>
                    <div>
                      <span className="font-medium">Weight:</span> {userData.players[0].weight_kg ? `${userData.players[0].weight_kg} kg` : 'N/A'}
                    </div>
                    {(userData.players[0].state || userData.players[0].district) && (
                      <>
                        <div className="col-span-2">
                          <span className="font-medium">📍 Location:</span>{' '}
                          {[userData.players[0].district, userData.players[0].state].filter(Boolean).join(', ') || 'N/A'}
                        </div>
                      </>
                    )}
                  </div>
                  <Button
                    variant="gradient"
                    className="w-full btn-lift"
                    onClick={() => router.push('/profile/player/complete')}
                  >
                    Edit Profile
                  </Button>
                </div>
              ) : (
                <Button
                  variant="gradient"
                  className="w-full btn-lift"
                  onClick={() => router.push('/profile/player/complete')}
                >
                  Complete Profile
                </Button>
              )}
            </CardContent>
          </Card>

          <Card className={`card-hover cursor-pointer ${userData?.kyc_status !== 'verified' ? 'border-l-4 border-l-warning' : 'border-l-4 border-l-success'}`}>
            <CardHeader>
              <CardTitle>
                🔐 Verify Your Identity {userData?.kyc_status !== 'verified' ? '(REQUIRED)' : ''}
              </CardTitle>
              <CardDescription>
                {userData?.kyc_status === 'verified'
                  ? 'Your identity is verified'
                  : 'MANDATORY: Complete Aadhaar verification to get discovered'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {userData?.kyc_status === 'verified' ? (
                <div className="space-y-2">
                  <Button variant="outline" className="w-full border-success text-success" disabled>
                    ✓ Verified
                  </Button>
                  {userData?.kyc_verified_at && (
                    <p className="text-xs text-center text-muted-foreground">
                      Verified on {new Date(userData.kyc_verified_at).toLocaleDateString()}
                    </p>
                  )}
                </div>
              ) : userData?.kyc_status === 'pending' ? (
                <div className="space-y-2">
                  <Button className="w-full" variant="outline" disabled>
                    ⏳ Under Review
                  </Button>
                  <p className="text-xs text-center text-muted-foreground font-medium">
                    Verification in progress...
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <Button
                    variant="outline"
                    className="w-full btn-lift"
                    onClick={() => router.push('/kyc/info')}
                  >
                    🚀 Learn About KYC
                  </Button>
                  <Button
                    variant="gradient"
                    className="w-full btn-lift"
                    onClick={() => router.push('/kyc/verify')}
                  >
                    � Start KYC Now
                  </Button>
                  <div className="bg-accent/10 rounded p-2 text-xs space-y-1">
                    <p className="font-semibold text-accent">⚡ Quick Process:</p>
                    <p>• 2-3 minutes</p>
                    <p>• Aadhaar OTP</p>
                    <p>• Instant approval</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="card-hover cursor-pointer relative border-l-4 border-l-primary">
            <CardHeader>
              <CardTitle className="relative inline-block">
                📋 My Contracts
                <UnreadContractBadge userType="player" />
              </CardTitle>
              <CardDescription>
                View and manage your contract offers
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                variant="gradient"
                className="w-full btn-lift"
                onClick={() => router.push('/dashboard/player/contracts')}
              >
                View Contracts
              </Button>
            </CardContent>
          </Card>

          <Card
            className={`card-hover cursor-pointer ${
              unreadMessagesCount > 0
                ? 'border-2 border-destructive bg-gradient-to-br from-destructive/20 via-destructive/10 to-destructive/5 shadow-xl shadow-destructive/30 animate-pulse'
                : 'border-l-4 border-l-accent'
            }`}
            onClick={() => router.push('/dashboard/player/messages')}
          >
            <CardHeader>
              <CardTitle className={`flex items-center gap-2 ${
                unreadMessagesCount > 0 ? 'text-destructive' : ''
              }`}>
                💬 Messages
                {unreadMessagesCount > 0 && (
                  <Badge variant="destructive" className="animate-pulse text-sm">
                    {unreadMessagesCount} new
                  </Badge>
                )}
              </CardTitle>
              <CardDescription className={
                unreadMessagesCount > 0 ? 'text-foreground font-medium' : ''
              }>
                {unreadMessagesCount > 0
                  ? `You have ${unreadMessagesCount} unread message${unreadMessagesCount > 1 ? 's' : ''} from clubs`
                  : 'Review club communications and respond quickly'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                variant={unreadMessagesCount > 0 ? "destructive" : "outline"}
                size={unreadMessagesCount > 0 ? "lg" : "default"}
                className={`w-full btn-lift ${
                  unreadMessagesCount > 0 ? 'font-bold shadow-lg text-base' : ''
                }`}
                onClick={() => router.push('/dashboard/player/messages')}
              >
                {unreadMessagesCount > 0 ? `📬 View ${unreadMessagesCount} New Message${unreadMessagesCount > 1 ? 's' : ''}` : 'Open Inbox'}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Upcoming Matches & Recent Performance */}
        {userData?.players?.[0] && activeContract && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Upcoming Matches */}
            <Card className="border-l-4 border-l-primary">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span>📅</span> Upcoming Matches
                </CardTitle>
                <CardDescription>Next {upcomingMatches.length} scheduled fixtures</CardDescription>
              </CardHeader>
              <CardContent>
                {upcomingMatches.length > 0 ? (
                  <div className="space-y-3">
                    {upcomingMatches.slice(0, 3).map((match) => (
                      <div key={match.id} className="flex items-center justify-between p-3 bg-card/50 rounded-lg border border-border">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 text-sm font-semibold">
                            <span>{match.home_team?.club_name || 'Home'}</span>
                            <span className="text-muted-foreground">vs</span>
                            <span>{match.away_team?.club_name || 'Away'}</span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(match.match_date).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric'
                            })}
                            {match.match_time && ` • ${match.match_time}`}
                          </p>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {match.match_format || '11-a-side'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <div className="text-4xl mb-2">📅</div>
                    <p className="text-sm">No upcoming matches scheduled</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Performance */}
            <Card className="border-l-4 border-l-accent">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span>📊</span> Recent Performance
                </CardTitle>
                <CardDescription>Last {recentMatches.length} completed matches</CardDescription>
              </CardHeader>
              <CardContent>
                {recentMatches.length > 0 ? (
                  <div className="space-y-3">
                    {recentMatches.slice(0, 3).map((match) => {
                      const isHome = match.home_team_id === activeContractClub?.id
                      const ourScore = isHome ? match.home_team_score : match.away_team_score
                      const theirScore = isHome ? match.away_team_score : match.home_team_score
                      const result = ourScore > theirScore ? 'W' : ourScore < theirScore ? 'L' : 'D'
                      const resultColor = result === 'W' ? 'success' : result === 'L' ? 'destructive' : 'warning'

                      return (
                        <div key={match.id} className="flex items-center justify-between p-3 bg-card/50 rounded-lg border border-border">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 text-sm font-semibold">
                              <Badge variant={resultColor as any} className="w-6 h-6 flex items-center justify-center p-0 text-xs">
                                {result}
                              </Badge>
                              <span>{match.home_team?.club_name || 'Home'}</span>
                              <span className="text-muted-foreground font-normal">
                                {match.home_team_score ?? 0} - {match.away_team_score ?? 0}
                              </span>
                              <span>{match.away_team?.club_name || 'Away'}</span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              {new Date(match.match_date).toLocaleDateString('en-IN', {
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
                  <div className="text-center py-8 text-muted-foreground">
                    <div className="text-4xl mb-2">📊</div>
                    <p className="text-sm">No match history available</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Recent Activity */}
        <Card className="border-l-4 border-l-accent">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Your latest updates and notifications</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              <p>No recent activity</p>
              <p className="text-sm mt-2">Complete your profile to get started!</p>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
