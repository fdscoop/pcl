'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import TournamentStatistics from '@/components/TournamentStatistics'

export default function Home() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [supabase, setSupabase] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Initialize Supabase client only on client side
    const initializeSupabase = async () => {
      try {
        // Check if environment variables are available
        if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
          setError('Supabase configuration is missing. Please check environment variables.')
          setLoading(false)
          return
        }

        const { createClient } = await import('@/lib/supabase/client')
        const client = createClient()
        setSupabase(client)

        const getUser = async () => {
          try {
            const {
              data: { user },
            } = await client.auth.getUser()
            setUser(user)
          } catch (error) {
            console.error('Error fetching user:', error)
          }
          setLoading(false)
        }

        await getUser()
      } catch (error) {
        console.error('Error initializing Supabase:', error)
        setError('Failed to initialize Supabase client')
        setLoading(false)
      }
    }

    initializeSupabase()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="text-slate-600">Loading...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600">Configuration Error</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-slate-600">{error}</p>
            <p className="text-sm text-slate-500">
              If you're the site owner, please ensure Supabase environment variables are set in your deployment settings.
            </p>
            <Button onClick={() => window.location.reload()}>
              Try Again
            </Button>
          </CardContent>
        </Card>
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
              <span className="text-sm text-slate-600 hidden sm:inline">
                Professional Club League
              </span>
            </div>
            <div className="flex items-center gap-4">
              {user ? (
                <>
                  <span className="text-sm text-slate-600 hidden sm:inline">{user.email}</span>
                  <Button
                    onClick={async () => {
                      if (supabase) {
                        try {
                          await supabase.auth.signOut()
                          setUser(null)
                          // Force a full page reload to clear all state
                          window.location.href = '/'
                        } catch (error) {
                          console.error('Error signing out:', error)
                          // Still try to redirect even if sign out fails
                          window.location.href = '/'
                        }
                      }
                    }}
                    variant="outline"
                    size="sm"
                  >
                    Sign Out
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="ghost" size="sm" asChild>
                    <a href="/auth/login">Sign In</a>
                  </Button>
                  <Button size="sm" asChild>
                    <a href="/auth/signup">Sign Up</a>
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-slate-900 mb-4">
            Professional Club League
          </h1>
          <p className="text-xl text-slate-600 mb-8 max-w-2xl mx-auto">
            The complete sports management platform for clubs, players, referees, staff, and stadium owners
          </p>

          {user ? (
            <Card className="max-w-md mx-auto">
              <CardHeader>
                <CardTitle>Welcome Back!</CardTitle>
                <CardDescription>{user.email}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-slate-600">You are logged in and ready to go!</p>
                <Button className="w-full" asChild>
                  <a href="/dashboard">Go to Dashboard</a>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild>
                <a href="/auth/signup">Get Started</a>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <a href="/auth/login">Sign In</a>
              </Button>
            </div>
          )}
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-16">
          {/* Players */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="text-4xl mb-2">⚽</div>
              <CardTitle>For Players</CardTitle>
              <CardDescription>Build your profile and get scouted</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-slate-600 space-y-2">
                <li>✓ Create detailed player profile</li>
                <li>✓ KYC verification for scouting</li>
                <li>✓ Manage contracts with clubs</li>
                <li>✓ Track performance statistics</li>
              </ul>
            </CardContent>
          </Card>

          {/* Club Owners */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="text-4xl mb-2">🏆</div>
              <CardTitle>For Club Owners</CardTitle>
              <CardDescription>Manage your clubs and teams</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-slate-600 space-y-2">
                <li>✓ Create and manage clubs</li>
                <li>✓ Scout and sign players</li>
                <li>✓ Organize matches and tournaments</li>
                <li>✓ Book stadiums for games</li>
              </ul>
            </CardContent>
          </Card>

          {/* Referees */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="text-4xl mb-2">🎯</div>
              <CardTitle>For Referees</CardTitle>
              <CardDescription>Officiate matches professionally</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-slate-600 space-y-2">
                <li>✓ Create referee profile</li>
                <li>✓ Get assigned to matches</li>
                <li>✓ Track officiating history</li>
                <li>✓ Manage availability</li>
              </ul>
            </CardContent>
          </Card>

          {/* Staff */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="text-4xl mb-2">👥</div>
              <CardTitle>For Staff/Volunteers</CardTitle>
              <CardDescription>Support match operations</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-slate-600 space-y-2">
                <li>✓ Register as staff member</li>
                <li>✓ Get assigned to matches</li>
                <li>✓ Support tournament organization</li>
                <li>✓ Track experience and roles</li>
              </ul>
            </CardContent>
          </Card>

          {/* Stadium Owners */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="text-4xl mb-2">🏟️</div>
              <CardTitle>For Stadium Owners</CardTitle>
              <CardDescription>List and manage your venues</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-slate-600 space-y-2">
                <li>✓ List your stadiums</li>
                <li>✓ Manage availability slots</li>
                <li>✓ Set pricing and amenities</li>
                <li>✓ Accept bookings from clubs</li>
              </ul>
            </CardContent>
          </Card>

          {/* Tournaments */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="text-4xl mb-2">🎖️</div>
              <CardTitle>Tournament System</CardTitle>
              <CardDescription>Organize and compete</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-slate-600 space-y-2">
                <li>✓ Friendly and official matches</li>
                <li>✓ 5-a-side, 7-a-side, 11-a-side</li>
                <li>✓ League structures</li>
                <li>✓ Real-time match tracking</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Tournament Statistics Section */}
        <div className="mt-20">
          <TournamentStatistics />
        </div>

        {/* CTA Section */}
        <div className="mt-16 text-center bg-white rounded-lg shadow-lg p-12">
          <h2 className="text-3xl font-bold text-slate-900 mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-lg text-slate-600 mb-8 max-w-2xl mx-auto">
            Join thousands of players, clubs, and sports professionals on the PCL platform
          </p>
          {!user && (
            <Button size="lg" asChild>
              <a href="/auth/signup">Create Your Account</a>
            </Button>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 mt-16">
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="text-center text-sm text-slate-600">
            <p>&copy; 2025 Professional Club League. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
