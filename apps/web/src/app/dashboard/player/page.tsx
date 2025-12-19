'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

export default function PlayerDashboard() {
  const router = useRouter()
  const [userData, setUserData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()

    const loadUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
          router.push('/auth/login')
          return
        }

        // Get user profile data with player data
        const { data: profile} = await supabase
          .from('users')
          .select(`
            *,
            players (
              id,
              unique_player_id,
              photo_url,
              position,
              jersey_number,
              height_cm,
              weight_kg,
              date_of_birth,
              nationality,
              preferred_foot,
              is_available_for_scout,
              total_matches_played,
              total_goals_scored,
              total_assists
            )
          `)
          .eq('id', user.id)
          .single()

        setUserData(profile)
      } catch (error) {
        console.error('Error loading user:', error)
      } finally {
        setLoading(false)
      }
    }

    loadUser()
  }, [router])

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
          {userData?.players?.[0]?.photo_url && (
            <img
              src={userData.players[0].photo_url}
              alt={`${userData.first_name} ${userData.last_name}`}
              className="w-24 h-24 rounded-full object-cover border-4 border-blue-200 shadow-lg"
            />
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

        {/* KYC Pending Alert */}
        {userData?.players?.[0] && userData?.kyc_status !== 'verified' && (
          <Alert className="mb-8 border-yellow-200 bg-yellow-50">
            <div className="flex items-start gap-4">
              <div className="text-4xl">⏳</div>
              <div className="flex-1">
                <AlertTitle className="text-lg font-semibold text-yellow-900 mb-2">
                  {userData?.kyc_status === 'pending'
                    ? 'KYC Verification in Progress'
                    : 'Complete KYC Verification to Become Searchable'}
                </AlertTitle>
                <AlertDescription className="text-yellow-800 space-y-2">
                  {userData?.kyc_status === 'pending' ? (
                    <>
                      <p>
                        Your KYC documents are under review. Once approved, you'll be visible in club scout searches.
                      </p>
                      <p className="text-sm">
                        <strong>Note:</strong> Verification usually takes 24-48 hours.
                      </p>
                    </>
                  ) : (
                    <>
                      <p>
                        Complete Aadhaar verification to appear in scout searches and receive contract offers from clubs.
                      </p>
                      <div className="pt-2">
                        <Button
                          onClick={() => router.push('/kyc/verify')}
                          variant="outline"
                          className="border-yellow-600 text-yellow-900 hover:bg-yellow-100"
                        >
                          Verify with Aadhaar →
                        </Button>
                      </div>
                      <p className="text-sm mt-2">
                        ⚡ Instant verification via Aadhaar OTP
                      </p>
                    </>
                  )}
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
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
                      <img
                        src={userData.players[0].photo_url}
                        alt="Profile"
                        className="w-16 h-16 rounded-full object-cover border-2 border-slate-200"
                      />
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-2 text-sm text-slate-600">
                    <div>
                      <span className="font-medium">Position:</span> {userData.players[0].position}
                    </div>
                    <div>
                      <span className="font-medium">Nationality:</span> {userData.players[0].nationality}
                    </div>
                    <div>
                      <span className="font-medium">Height:</span> {userData.players[0].height_cm} cm
                    </div>
                    <div>
                      <span className="font-medium">Weight:</span> {userData.players[0].weight_kg} kg
                    </div>
                  </div>
                  <Button
                    className="w-full"
                    variant="outline"
                    onClick={() => router.push('/profile/player/complete')}
                  >
                    Edit Profile
                  </Button>
                </div>
              ) : (
                <Button
                  className="w-full"
                  onClick={() => router.push('/profile/player/complete')}
                >
                  Complete Profile
                </Button>
              )}
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle>✅ Verify Your Identity</CardTitle>
              <CardDescription>
                Complete Aadhaar verification to appear in scout searches
              </CardDescription>
            </CardHeader>
            <CardContent>
              {userData?.kyc_status === 'verified' ? (
                <div className="space-y-2">
                  <Button className="w-full" variant="outline" disabled>
                    ✓ Verified
                  </Button>
                  {userData?.kyc_verified_at && (
                    <p className="text-xs text-center text-slate-500">
                      Verified on {new Date(userData.kyc_verified_at).toLocaleDateString()}
                    </p>
                  )}
                </div>
              ) : userData?.kyc_status === 'pending' ? (
                <Button className="w-full" variant="outline" disabled>
                  ⏳ Under Review
                </Button>
              ) : (
                <div className="space-y-2">
                  <Button
                    className="w-full"
                    onClick={() => router.push('/kyc/verify')}
                  >
                    Verify with Aadhaar
                  </Button>
                  <p className="text-xs text-center text-slate-500">
                    Instant verification via Aadhaar OTP
                  </p>
                </div>
              )}
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
