'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { UnreadContractBadge } from '@/components/UnreadContractBadge'
import { NotificationCenter } from '@/components/NotificationCenter'
import { usePlayerNotifications } from '@/hooks/usePlayerNotifications'

export default function PlayerDashboard() {
  const router = useRouter()
  const [userData, setUserData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [pendingContractsCount, setPendingContractsCount] = useState(0)
  const [playerId, setPlayerId] = useState<string | null>(null)
  const {
    notifications,
    unreadCount,
    loading: notificationsLoading,
    markAsRead,
    markAllAsRead
  } = usePlayerNotifications(playerId)

  const loadUser = async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/auth/login')
        return
      }

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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-slate-600">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Navigation */}
      <nav className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <img src="/logo.png" alt="PCL Logo" className="h-10 w-10" />
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">
                PCL
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <NotificationCenter
                notifications={notifications}
                unreadCount={unreadCount}
                onMarkAsRead={markAsRead}
                onMarkAllAsRead={markAllAsRead}
                loading={notificationsLoading}
              />
              <span className="text-sm text-slate-600">
                {userData?.first_name} {userData?.last_name}
              </span>
              <Button onClick={handleSignOut} variant="outline" size="sm">
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
                className="rounded-full object-cover border-4 border-blue-200 shadow-lg"
                priority
                sizes="96px"
              />
            </div>
          ) : (
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-200 to-blue-300 flex items-center justify-center border-4 border-blue-200 shadow-lg">
              <span className="text-4xl">⚽</span>
            </div>
          )}
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-slate-900 mb-2">
              Welcome back, {userData?.first_name}! ⚽
            </h1>
            <p className="text-slate-600">
              Manage your player profile, contracts, and performance statistics
            </p>
          </div>
        </div>

        {/* Profile Incomplete Alert */}
        {!userData?.players?.[0] && (
          <Alert className="mb-8 border-blue-200 bg-blue-50">
            <div className="flex items-start gap-4">
              <div className="text-4xl">🎯</div>
              <div className="flex-1">
                <AlertTitle className="text-lg font-semibold text-blue-900 mb-2">
                  Complete Your Player Profile to Get Discovered!
                </AlertTitle>
                <AlertDescription className="text-blue-800 space-y-3">
                  <p className="font-medium">
                    Your profile is incomplete. Complete it now to unlock these opportunities:
                  </p>
                  <ul className="space-y-2 ml-4">
                    <li className="flex items-start gap-2">
                      <span className="text-green-600 font-bold">✓</span>
                      <span><strong>Get Scouted:</strong> After KYC verification, clubs can discover you in their player search</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-600 font-bold">✓</span>
                      <span><strong>Receive Contract Offers:</strong> Clubs can contact you directly with professional opportunities</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-600 font-bold">✓</span>
                      <span><strong>Join Teams:</strong> Get recruited to play in matches and tournaments</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-600 font-bold">✓</span>
                      <span><strong>Track Your Career:</strong> Monitor your stats, goals, assists, and match history</span>
                    </li>
                  </ul>
                  <div className="pt-2">
                    <Button
                      onClick={() => router.push('/profile/player/complete')}
                      className="bg-blue-600 hover:bg-blue-700"
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
          <Alert className="mb-8 border-green-200 bg-green-50">
            <div className="flex items-start gap-4">
              <div className="text-4xl">✅</div>
              <div className="flex-1">
                <AlertTitle className="text-lg font-semibold text-green-900 mb-2">
                  You're All Set! Clubs Can Now Find You
                </AlertTitle>
                <AlertDescription className="text-green-800 space-y-2">
                  <p>
                    <strong>Congratulations!</strong> Your profile is complete and verified. You're now visible in club scout searches.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm mt-3">
                    <div className="flex items-center gap-2">
                      <span className="text-green-600">●</span>
                      <span>Profile: <strong>Complete</strong></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-green-600">●</span>
                      <span>KYC: <strong>Verified</strong></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-green-600">●</span>
                      <span>Scout Status: <strong>Searchable</strong></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-green-600">●</span>
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
          <Alert className={`mb-8 border-red-200 bg-red-50`}>
            <div className="flex items-start gap-4">
              <div className="text-4xl">🚨</div>
              <div className="flex-1">
                <AlertTitle className="text-lg font-semibold text-red-900 mb-2">
                  ⚠️ KYC VERIFICATION REQUIRED (Mandatory)
                </AlertTitle>
                <AlertDescription className="text-red-800 space-y-3">
                  {userData?.kyc_status === 'rejected' ? (
                    <>
                      <p className="font-semibold text-red-900 mb-2">
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
                          className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold"
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
                      <p className="font-semibold text-sm mt-3 text-red-900">
                        ✅ Complete it now to unlock all features!
                      </p>
                      <div className="pt-3 flex gap-2">
                        <Button
                          onClick={() => router.push('/kyc/verify')}
                          className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold"
                        >
                          Start KYC Now
                        </Button>
                      </div>
                      <div className="bg-white bg-opacity-50 rounded p-2 mt-2 text-xs">
                        <p className="font-semibold text-red-900 mb-1">⚡ INSTANT VERIFICATION:</p>
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
          <Alert className="mb-8 border-blue-300 bg-blue-50 animate-pulse">
            <div className="flex items-start gap-4">
              <div className="text-4xl">📋</div>
              <div className="flex-1">
                <AlertTitle className="text-lg font-semibold text-blue-900 mb-2">
                  🎉 You Have {pendingContractsCount} New Contract Offer{pendingContractsCount > 1 ? 's' : ''}!
                </AlertTitle>
                <AlertDescription className="text-blue-800 space-y-2">
                  <p>
                    Great news! Club{pendingContractsCount > 1 ? 's' : ''} ha{pendingContractsCount > 1 ? 've' : 's'} sent you contract offer{pendingContractsCount > 1 ? 's' : ''}. 
                    Review the details and decide whether to accept or reject.
                  </p>
                  <div className="pt-3">
                    <Button
                      onClick={() => router.push('/dashboard/player/contracts')}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-semibold"
                    >
                      View Contract Offers ({pendingContractsCount}) →
                    </Button>
                  </div>
                </AlertDescription>
              </div>
            </div>
          </Alert>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-slate-600">
                KYC Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  userData?.kyc_status === 'verified'
                    ? 'bg-green-100 text-green-800'
                    : userData?.kyc_status === 'pending'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-red-100 text-red-800'
                }`}>
                  {userData?.kyc_status || 'pending'}
                </span>
              </div>
              {userData?.players?.[0]?.unique_player_id && (
                <p className="text-xs text-slate-500 mt-2">
                  ID: {userData.players[0].unique_player_id}
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-slate-600">
                Goals / Assists
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {userData?.players?.[0]?.total_goals_scored || 0} / {userData?.players?.[0]?.total_assists || 0}
              </div>
              <p className="text-xs text-slate-500 mt-1">Career statistics</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-slate-600">
                Matches Played
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{userData?.players?.[0]?.total_matches_played || 0}</div>
              <p className="text-xs text-slate-500 mt-1">
                {userData?.players?.[0]?.position || 'Complete profile to show position'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer border-2 hover:border-blue-200">
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
                          className="rounded-full object-cover border-2 border-slate-200"
                          sizes="64px"
                        />
                      </div>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-2 text-sm text-slate-600">
                    <div>
                      <span className="font-medium">Position:</span> {userData.players[0].position || 'N/A'}
                    </div>
                    <div>
                      <span className="font-medium">Nationality:</span> {userData.players[0].nationality || 'N/A'}
                    </div>
                    <div>
                      <span className="font-medium">Height:</span> {userData.players[0].height_cm ? `${userData.players[0].height_cm} cm` : 'N/A'}
                    </div>
                    <div>
                      <span className="font-medium">Weight:</span> {userData.players[0].weight_kg ? `${userData.players[0].weight_kg} kg` : 'N/A'}
                    </div>
                  </div>
                  <Button
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                    onClick={() => router.push('/profile/player/complete')}
                  >
                    Edit Profile
                  </Button>
                </div>
              ) : (
                <Button
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold shadow-lg"
                  onClick={() => router.push('/profile/player/complete')}
                >
                  Complete Profile
                </Button>
              )}
            </CardContent>
          </Card>

          <Card className={`hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer ${userData?.kyc_status !== 'verified' ? 'border-2 border-red-400 bg-red-50 hover:border-red-500' : 'border-2 hover:border-blue-200'}`}>
            <CardHeader>
              <CardTitle className={userData?.kyc_status !== 'verified' ? 'text-red-900' : ''}>
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
                  <Button className="w-full bg-green-600 hover:bg-green-700" disabled>
                    ✓ Verified
                  </Button>
                  {userData?.kyc_verified_at && (
                    <p className="text-xs text-center text-slate-500">
                      Verified on {new Date(userData.kyc_verified_at).toLocaleDateString()}
                    </p>
                  )}
                </div>
              ) : userData?.kyc_status === 'pending' ? (
                <div className="space-y-2">
                  <Button className="w-full" variant="outline" disabled>
                    ⏳ Under Review
                  </Button>
                  <p className="text-xs text-center text-slate-600 font-medium">
                    Verification in progress...
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <Button
                    className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold"
                    onClick={() => router.push('/kyc/info')}
                  >
                    🚀 Learn About KYC
                  </Button>
                  <Button
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold"
                    onClick={() => router.push('/kyc/verify')}
                  >
                    � Start KYC Now
                  </Button>
                  <div className="bg-white rounded p-2 text-xs text-slate-700 space-y-1">
                    <p className="font-semibold text-blue-700">⚡ Quick Process:</p>
                    <p>• 2-3 minutes</p>
                    <p>• Aadhaar OTP</p>
                    <p>• Instant approval</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer relative border-2 hover:border-blue-200">
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
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold shadow-lg"
                onClick={() => router.push('/dashboard/player/contracts')}
              >
                View Contracts
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Your latest updates and notifications</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-slate-500">
              <p>No recent activity</p>
              <p className="text-sm mt-2">Complete your profile to get started!</p>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
