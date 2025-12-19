'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function ClubOwnerDashboard() {
  const router = useRouter()
  const [userData, setUserData] = useState<any>(null)
  const [club, setClub] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()

    const loadData = async () => {
      try {
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

        // Fetch user's club (only one club per owner)
        const { data: clubData, error: clubError } = await supabase
          .from('clubs')
          .select('*')
          .eq('owner_id', user.id)
          .single()

        if (clubError) {
          if (clubError.code !== 'PGRST116') { // Not found error is okay
            console.error('Error loading club:', clubError)
          }
        } else {
          setClub(clubData)
        }
      } catch (error) {
        console.error('Error loading user:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
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

  // If no club exists, show onboarding
  if (!loading && !club) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
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

        <main className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-slate-900 mb-4">
              Welcome to PCL! 🏆
            </h1>
            <p className="text-lg text-slate-600">
              Create your club profile to get started
            </p>
          </div>

          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Create Your Club Profile</CardTitle>
              <CardDescription>
                Set up your club to manage teams, scout players, and participate in tournaments
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-900">
                  <strong>Note:</strong> Each account can create one club profile. Make sure to provide accurate information.
                </p>
              </div>
              <Button
                className="w-full"
                size="lg"
                onClick={() => router.push('/club/create')}
              >
                Create Club Profile
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
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

      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Club Profile Header */}
        <div className="mb-8">
          <div className="flex items-start gap-6">
            {/* Club Logo */}
            <div className="flex-shrink-0">
              {club?.logo_url ? (
                <img
                  src={club.logo_url}
                  alt={`${club.club_name} logo`}
                  className="h-24 w-24 rounded-lg object-cover border-2 border-slate-300 shadow-md"
                />
              ) : (
                <div className="h-24 w-24 rounded-lg bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center border-2 border-slate-300 shadow-md">
                  <span className="text-4xl">🏆</span>
                </div>
              )}
            </div>

            {/* Club Info */}
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-slate-900 mb-2">
                {club?.club_name}
              </h1>
              <div className="flex flex-wrap gap-2 mb-3">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                  {club?.club_type}
                </span>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                  {club?.category}
                </span>
                {club?.is_active && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-emerald-100 text-emerald-800">
                    Active
                  </span>
                )}
              </div>
              <p className="text-slate-600 mb-2">
                📍 {club?.city}, {club?.state}, {club?.country}
              </p>
              <p className="text-slate-600">
                📧 {club?.email} • 📞 {club?.phone}
              </p>
            </div>

            {/* Edit Button */}
            <div>
              <Button
                variant="outline"
                onClick={() => router.push(`/club/${club?.id}/edit`)}
              >
                Edit Profile
              </Button>
            </div>
          </div>

          {club?.description && (
            <div className="mt-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
              <p className="text-slate-700">{club.description}</p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-slate-600">
                Founded
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{club?.founded_year}</div>
              <p className="text-xs text-slate-500 mt-1">Est. year</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-slate-600">
                Teams
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">0</div>
              <p className="text-xs text-slate-500 mt-1">Create teams</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-slate-600">
                Players
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">0</div>
              <p className="text-xs text-slate-500 mt-1">Scout players</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-slate-600">
                Matches
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">0</div>
              <p className="text-xs text-slate-500 mt-1">No matches yet</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle>👥 Manage Teams</CardTitle>
              <CardDescription>
                Create and organize your club teams
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" disabled>
                Coming Soon
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle>🔍 Scout Players</CardTitle>
              <CardDescription>
                Find and invite verified players
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" variant="outline" disabled>
                Coming Soon
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle>⚽ Matches</CardTitle>
              <CardDescription>
                Schedule and manage club matches
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" variant="outline" disabled>
                Coming Soon
              </Button>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest updates and notifications</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-slate-500">
              <p>No recent activity</p>
              <p className="text-sm mt-2">Activity will appear here once you start managing your club</p>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
