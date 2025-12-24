'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import TournamentStatistics from '@/components/TournamentStatistics'

export default function HomeClient() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [supabase, setSupabase] = useState<any>(null)

  useEffect(() => {
    const initializeSupabase = async () => {
      try {
        if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
          console.warn('Supabase environment variables not configured')
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
        setLoading(false)
      }
    }

    initializeSupabase()
  }, [])

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="bg-card border-b border-border shadow-sm sticky top-0 z-50 backdrop-blur-sm bg-card/95">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <img
                src="/logo.png"
                alt="PCL Logo"
                className="h-10 w-10"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none'
                }}
              />
              <span className="text-lg font-semibold text-foreground hidden sm:inline">
                Professional Club League
              </span>
            </div>
            <div className="flex items-center gap-4">
              {user ? (
                <>
                  <span className="text-sm text-muted-foreground hidden sm:inline">{user.email}</span>
                  <Button
                    onClick={async () => {
                      if (supabase) {
                        try {
                          await supabase.auth.signOut()
                          setUser(null)
                          window.location.href = '/'
                        } catch (error) {
                          console.error('Error signing out:', error)
                          window.location.href = '/'
                        }
                      }
                    }}
                    variant="outline"
                    size="sm"
                    className="btn-lift"
                  >
                    Sign Out
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="outline" size="sm" className="btn-lift" asChild>
                    <a href="/auth/login">Sign In</a>
                  </Button>
                  <Button variant="gradient" size="sm" className="btn-lift" asChild>
                    <a href="/auth/signup">Sign Up</a>
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main>
        {/* Modern Banner */}
        <div className="relative mt-0 mb-16 overflow-hidden shadow-2xl">
          <div
            className="relative overflow-hidden bg-cover bg-center min-h-[520px] sm:min-h-[600px]"
            style={{ backgroundImage: "url('/banner.jpg')" }}
          >
            <div className="absolute inset-0 bg-black/40"></div>
            <div className="absolute inset-0 opacity-10 bg-grid-pattern"></div>
            <div className="relative z-10 px-6 py-16 sm:px-12 sm:py-20 lg:py-24 min-h-[520px] sm:min-h-[600px] flex items-center justify-center text-center">
              <div className="w-full max-w-4xl flex flex-col items-center">
                <h1 className="text-center text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white mb-6 tracking-tight">
                  Professional Club League
                </h1>
                <p className="text-center text-lg sm:text-xl lg:text-2xl text-white/90 mb-8 max-w-3xl mx-auto leading-relaxed">
                  The complete sports management platform for clubs, players, referees, staff, and stadium owners
                </p>
                <div className="flex flex-wrap gap-4 justify-center items-center text-center mx-auto">
                  <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 text-white">
                    <span className="text-2xl">⚽</span>
                    <span className="font-semibold">Players</span>
                  </div>
                  <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 text-white">
                    <span className="text-2xl">🏆</span>
                    <span className="font-semibold">Clubs</span>
                  </div>
                  <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 text-white">
                    <span className="text-2xl">🎯</span>
                    <span className="font-semibold">Referees</span>
                  </div>
                  <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 text-white">
                    <span className="text-2xl">🏟️</span>
                    <span className="font-semibold">Stadiums</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center mb-16">
          {user ? (
            <Card className="max-w-md mx-auto border-accent/20 shadow-lg">
              <CardHeader>
                <CardTitle className="text-primary">Welcome Back!</CardTitle>
                <CardDescription>{user.email}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-muted-foreground">You are logged in and ready to go!</p>
                <Button className="w-full" variant="gradient" asChild>
                  <a href="/dashboard">Go to Dashboard</a>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" variant="gradient" className="btn-lift" asChild>
                <a href="/auth/signup">Get Started</a>
              </Button>
              <Button size="lg" variant="outline" className="btn-lift" asChild>
                <a href="/auth/login">Sign In</a>
              </Button>
            </div>
          )}
        </div>

        {/* Features Grid */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-16">
          {/* Players */}
          <Card className="card-hover border-l-4 border-l-accent group">
            <CardHeader>
              <div className="text-4xl mb-2 group-hover:scale-110 transition-transform">⚽</div>
              <CardTitle className="text-primary">For Players</CardTitle>
              <CardDescription>Build your profile and get scouted</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li className="flex items-start gap-2"><span className="text-accent font-bold">✓</span> Create detailed player profile</li>
                <li className="flex items-start gap-2"><span className="text-accent font-bold">✓</span> KYC verification for scouting</li>
                <li className="flex items-start gap-2"><span className="text-accent font-bold">✓</span> Manage contracts with clubs</li>
                <li className="flex items-start gap-2"><span className="text-accent font-bold">✓</span> Track performance statistics</li>
              </ul>
            </CardContent>
          </Card>

          {/* Club Owners */}
          <Card className="card-hover border-l-4 border-l-primary group">
            <CardHeader>
              <div className="text-4xl mb-2 group-hover:scale-110 transition-transform">🏆</div>
              <CardTitle className="text-primary">For Club Owners</CardTitle>
              <CardDescription>Manage your clubs and teams</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li className="flex items-start gap-2"><span className="text-accent font-bold">✓</span> Create and manage clubs</li>
                <li className="flex items-start gap-2"><span className="text-accent font-bold">✓</span> Scout and sign players</li>
                <li className="flex items-start gap-2"><span className="text-accent font-bold">✓</span> Organize matches and tournaments</li>
                <li className="flex items-start gap-2"><span className="text-accent font-bold">✓</span> Book stadiums for games</li>
              </ul>
            </CardContent>
          </Card>

          {/* Referees */}
          <Card className="card-hover border-l-4 border-l-accent group">
            <CardHeader>
              <div className="text-4xl mb-2 group-hover:scale-110 transition-transform">🎯</div>
              <CardTitle className="text-primary">For Referees</CardTitle>
              <CardDescription>Officiate matches professionally</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li className="flex items-start gap-2"><span className="text-accent font-bold">✓</span> Create referee profile</li>
                <li className="flex items-start gap-2"><span className="text-accent font-bold">✓</span> Get assigned to matches</li>
                <li className="flex items-start gap-2"><span className="text-accent font-bold">✓</span> Track officiating history</li>
                <li className="flex items-start gap-2"><span className="text-accent font-bold">✓</span> Manage availability</li>
              </ul>
            </CardContent>
          </Card>

          {/* Staff */}
          <Card className="card-hover border-l-4 border-l-primary group">
            <CardHeader>
              <div className="text-4xl mb-2 group-hover:scale-110 transition-transform">👥</div>
              <CardTitle className="text-primary">For Staff/Volunteers</CardTitle>
              <CardDescription>Support match operations</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li className="flex items-start gap-2"><span className="text-accent font-bold">✓</span> Register as staff member</li>
                <li className="flex items-start gap-2"><span className="text-accent font-bold">✓</span> Get assigned to matches</li>
                <li className="flex items-start gap-2"><span className="text-accent font-bold">✓</span> Support tournament organization</li>
                <li className="flex items-start gap-2"><span className="text-accent font-bold">✓</span> Track experience and roles</li>
              </ul>
            </CardContent>
          </Card>

          {/* Stadium Owners */}
          <Card className="card-hover border-l-4 border-l-accent group">
            <CardHeader>
              <div className="text-4xl mb-2 group-hover:scale-110 transition-transform">🏟️</div>
              <CardTitle className="text-primary">For Stadium Owners</CardTitle>
              <CardDescription>List and manage your venues</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li className="flex items-start gap-2"><span className="text-accent font-bold">✓</span> List your stadiums</li>
                <li className="flex items-start gap-2"><span className="text-accent font-bold">✓</span> Manage availability slots</li>
                <li className="flex items-start gap-2"><span className="text-accent font-bold">✓</span> Set pricing and amenities</li>
                <li className="flex items-start gap-2"><span className="text-accent font-bold">✓</span> Accept bookings from clubs</li>
              </ul>
            </CardContent>
          </Card>

          {/* Tournaments */}
          <Card className="card-hover border-l-4 border-l-primary group">
            <CardHeader>
              <div className="text-4xl mb-2 group-hover:scale-110 transition-transform">🎖️</div>
              <CardTitle className="text-primary">Tournament System</CardTitle>
              <CardDescription>Organize and compete</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li className="flex items-start gap-2"><span className="text-accent font-bold">✓</span> Friendly and official matches</li>
                <li className="flex items-start gap-2"><span className="text-accent font-bold">✓</span> 5-a-side, 7-a-side, 11-a-side</li>
                <li className="flex items-start gap-2"><span className="text-accent font-bold">✓</span> League structures</li>
                <li className="flex items-start gap-2"><span className="text-accent font-bold">✓</span> Real-time match tracking</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Tournament Statistics Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-20">
          <TournamentStatistics />
        </div>

        {/* CTA Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16 text-center bg-card border border-border rounded-lg shadow-xl p-12 gradient-brand relative overflow-hidden">
          <div className="absolute inset-0 opacity-10 bg-grid-pattern"></div>
          <div className="relative z-10">
            <h2 className="text-3xl font-bold text-white mb-4">
              Ready to Get Started?
            </h2>
            <p className="text-lg text-white/90 mb-8 max-w-2xl mx-auto">
              Join thousands of players, clubs, and sports professionals on the PCL platform
            </p>
            {!user && (
              <Button size="lg" variant="accent" className="btn-lift bg-white text-primary hover:bg-white/90" asChild>
                <a href="/auth/signup">Create Your Account</a>
              </Button>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-card border-t border-border mt-16">
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="text-center text-sm text-muted-foreground">
            <p>&copy; 2025 Professional Club League. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
