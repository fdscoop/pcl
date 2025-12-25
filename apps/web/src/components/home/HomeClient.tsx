'use client'

import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import TournamentStatistics from '@/components/TournamentStatistics'
import type { Club, Player, Stadium } from '@/types/database'

export default function HomeClient() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [supabase, setSupabase] = useState<any>(null)
  const [clubs, setClubs] = useState<Club[]>([])
  const [players, setPlayers] = useState<any[]>([])
  const [stadiums, setStadiums] = useState<Stadium[]>([])
  const [loadingData, setLoadingData] = useState(true)
  const [displayedPlayers, setDisplayedPlayers] = useState<any[]>([])
  const [playersPage, setPlayersPage] = useState(0)
  const playersPerPage = 6
  
  // Filters
  const [selectedNationality, setSelectedNationality] = useState<string>('')
  const [selectedState, setSelectedState] = useState<string>('')
  const [selectedDistrict, setSelectedDistrict] = useState<string>('')
  
  // Available filter options
  const [nationalities, setNationalities] = useState<string[]>([])
  const [states, setStates] = useState<string[]>([])
  const [districts, setDistricts] = useState<string[]>([])
  const [playerCount, setPlayerCount] = useState(0)
  const [clubCount, setClubCount] = useState(0)
  const [stadiumCount, setStadiumCount] = useState(0)
  const [tournamentCount, setTournamentCount] = useState(0)

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
        
        // Fetch clubs, players, and stadiums
        await fetchData(client)
      } catch (error) {
        console.error('Error initializing Supabase:', error)
        setLoading(false)
      }
    }

    initializeSupabase()
  }, [])

  const fetchData = async (client: any) => {
    try {
      // Fetch clubs
      const { data: clubsData, error: clubsError } = await client
        .from('clubs')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(6)
      
      if (clubsError) {
        console.error('Error fetching clubs:', clubsError)
      } else if (clubsData) {
        console.log('Clubs fetched successfully:', clubsData)
        setClubs(clubsData)
      } else {
        console.log('No clubs data returned')
      }

      // Fetch players with their user info (all players)
      const { data: playersData, error: playersError } = await client
        .from('players')
        .select(`
          id,
          user_id,
          unique_player_id,
          position,
          jersey_number,
          nationality,
          state,
          district,
          photo_url,
          total_matches_played,
          total_goals_scored,
          total_assists,
          users (
            first_name,
            last_name
          )
        `)
        .order('total_matches_played', { ascending: false })
        .limit(100)  // Fetch more for pagination
      
      if (playersError) {
        console.error('Error fetching players:', playersError)
      } else if (playersData) {
        console.log('Players fetched successfully:', playersData)
        setPlayers(playersData)
        
        // Extract unique nationalities, states, and districts
        const uniqueNationalities = [...new Set(playersData.map((p: any) => p.nationality).filter(Boolean))] as string[]
        const uniqueStates = [...new Set(playersData.map((p: any) => p.state).filter(Boolean))] as string[]
        const uniqueDistricts = [...new Set(playersData.map((p: any) => p.district).filter(Boolean))] as string[]
        
        setNationalities(uniqueNationalities.sort())
        setStates(uniqueStates.sort())
        setDistricts(uniqueDistricts.sort())
        
        // Show first 6 players
        setDisplayedPlayers(playersData.slice(0, playersPerPage))
      } else {
        console.log('No players data returned')
      }

      // Fetch stadiums
      const { data: stadiumsData, error: stadiumsError } = await client
        .from('stadiums')
        .select('*')
        .eq('is_active', true)
        .limit(6)
      
      if (stadiumsError) {
        console.error('Error fetching stadiums:', stadiumsError)
      } else if (stadiumsData) {
        console.log('Stadiums fetched successfully:', stadiumsData)
        setStadiums(stadiumsData)
      } else {
        console.log('No stadiums data returned')
      }

      const [
        { count: clubsTotal, error: clubsCountError },
        { count: playersTotal, error: playersCountError },
        { count: stadiumsTotal, error: stadiumsCountError },
        { count: tournamentsTotal, error: tournamentsCountError },
      ] = await Promise.all([
        client.from('clubs').select('id', { count: 'exact', head: true }).eq('is_active', true),
        client.from('players').select('id', { count: 'exact', head: true }),
        client.from('stadiums').select('id', { count: 'exact', head: true }).eq('is_active', true),
        client.from('tournaments').select('id', { count: 'exact', head: true }),
      ])

      if (clubsCountError) {
        console.error('Error fetching clubs count:', clubsCountError)
      } else if (typeof clubsTotal === 'number') {
        setClubCount(clubsTotal)
      }

      if (playersCountError) {
        console.error('Error fetching players count:', playersCountError)
      } else if (typeof playersTotal === 'number') {
        setPlayerCount(playersTotal)
      }

      if (stadiumsCountError) {
        console.error('Error fetching stadiums count:', stadiumsCountError)
      } else if (typeof stadiumsTotal === 'number') {
        setStadiumCount(stadiumsTotal)
      }

      if (tournamentsCountError) {
        console.error('Error fetching tournaments count:', tournamentsCountError)
      } else if (typeof tournamentsTotal === 'number') {
        setTournamentCount(tournamentsTotal)
      }

      setLoadingData(false)
    } catch (error) {
      console.error('Error fetching data:', error)
      setLoadingData(false)
    }
  }

  const handleLoadMorePlayers = () => {
    const nextPage = playersPage + 1
    const startIndex = nextPage * playersPerPage
    const endIndex = startIndex + playersPerPage
    const newPlayers = filteredPlayers.slice(0, endIndex)
    setDisplayedPlayers(newPlayers)
    setPlayersPage(nextPage)
  }

  // Filter players based on selected filters
  const filteredPlayers = useMemo(() => {
    return players.filter((player: any) => {
      const matchNationality = !selectedNationality || player.nationality === selectedNationality
      const matchState = !selectedState || player.state === selectedState
      const matchDistrict = !selectedDistrict || player.district === selectedDistrict
      return matchNationality && matchState && matchDistrict
    })
  }, [players, selectedNationality, selectedState, selectedDistrict])

  // Reset pagination when filters change
  useEffect(() => {
    setPlayersPage(0)
    setDisplayedPlayers(filteredPlayers.slice(0, playersPerPage))
  }, [filteredPlayers])

  const hasMorePlayers = displayedPlayers.length < filteredPlayers.length
  const statsCards = [
    { label: 'Registered Players', value: playerCount, icon: '⚽' },
    { label: 'Registered Clubs', value: clubCount, icon: '🏆' },
    { label: 'Registered Stadiums', value: stadiumCount, icon: '🏟️' },
    { label: 'Tournaments', value: tournamentCount, icon: '🎯' },
  ]
  const leaguePath = [
    {
      key: 'start',
      title: 'District Qualifiers',
      badge: 'START',
      icon: '🗺️',
      description: 'New teams start here. Participate in local tournaments to establish your club.',
      cardClass: 'border-l-4 border-l-blue-500',
      badgeClass: 'bg-blue-100 text-blue-700',
      dotClass: 'bg-black',
    },
    {
      key: 'tier-3',
      title: 'Amateur Division',
      badge: 'TIER 3',
      icon: '🥉',
      description: 'Top performers enter regional Amateur Division competitions.',
      cardClass: 'border-l-4 border-l-amber-500',
      badgeClass: 'bg-amber-100 text-amber-700',
      dotClass: 'bg-black',
    },
    {
      key: 'tier-2',
      title: 'Intermediate Division',
      badge: 'TIER 2',
      icon: '🥈',
      description: 'State-level Intermediate Division for the best Amateur teams.',
      cardClass: 'border-l-4 border-l-purple-500',
      badgeClass: 'bg-purple-100 text-purple-700',
      dotClass: 'bg-black',
    },
    {
      key: 'tier-1',
      title: 'Professional Division',
      badge: 'TIER 1',
      icon: '🥇',
      description: 'Elite teams compete nationally with full media coverage.',
      cardClass: 'border-l-4 border-l-accent',
      badgeClass: 'bg-amber-500 text-white font-bold',
      dotClass: 'bg-black',
    },
  ]

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
              <Button 
                size="lg" 
                className="btn-lift bg-emerald-600 hover:bg-emerald-700 text-white border-0"
                asChild
              >
                <a href="/auth/signup">Get Started</a>
              </Button>
              <Button 
                size="lg" 
                className="btn-lift bg-blue-600 hover:bg-blue-700 text-white border-0"
                asChild
              >
                <a href="/auth/login">Sign In</a>
              </Button>
            </div>
          )}
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              The Home of Organized Football
            </h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              PCL connects players with clubs, manages competitive matches, and builds pathways 
              from grassroots to professional football. Join our growing community of verified players 
              and clubs building the future of organized sports.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {statsCards.map((stat, index) => {
              const borderColors = [
                'border-t-blue-400', // Players
                'border-t-green-400', // Clubs
                'border-t-purple-400', // Stadiums
                'border-t-orange-400', // Tournaments
              ]
              return (
                <div
                  key={stat.label}
                  className={`bg-card/50 backdrop-blur-sm rounded-xl p-5 shadow-md hover:shadow-lg transition-shadow duration-300 border-t-2 ${borderColors[index]}`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-3xl">{stat.icon}</span>
                  </div>
                  <div className="space-y-1">
                    <div className="text-3xl font-bold text-foreground">
                      {stat.value.toLocaleString()}
                    </div>
                    <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      {stat.label}
                    </div>
                    <div className="text-xs text-muted-foreground pt-1">Live from registrations</div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Statistics Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-20">
          <TournamentStatistics />
        </div>

        {/* Clubs List Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-20 mb-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              Featured Clubs
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Join one of our active clubs and start your competitive journey
            </p>
          </div>

          {loadingData ? (
            <div className="flex justify-center items-center py-12">
              <div className="text-muted-foreground">Loading clubs...</div>
            </div>
          ) : clubs.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {clubs.map((club) => (
                <Card key={club.id} className="card-hover overflow-hidden">
                  <CardHeader className="pb-3">
                    {club.logo_url && (
                      <div className="mb-3">
                        <img
                          src={club.logo_url}
                          alt={club.club_name}
                          className="h-12 w-12 object-cover rounded-lg"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none'
                          }}
                        />
                      </div>
                    )}
                    <CardTitle className="text-lg">{club.club_name}</CardTitle>
                    {club.city && (
                      <CardDescription>
                        📍 {club.city}, {club.state}
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {club.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {club.description}
                      </p>
                    )}
                    <div className="flex flex-col gap-2 text-sm text-muted-foreground">
                      {club.club_type && (
                        <div>Type: <span className="font-semibold text-foreground capitalize">{club.club_type}</span></div>
                      )}
                      {club.category && (
                        <div>Category: <span className="font-semibold text-foreground capitalize">{club.category}</span></div>
                      )}
                      {club.founded_year && (
                        <div>Founded: <span className="font-semibold text-foreground">{club.founded_year}</span></div>
                      )}
                    </div>
                    <Button size="sm" variant="outline" className="w-full" asChild>
                      <a href={`/club/${club.id}`}>View Club</a>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              No clubs available yet
            </div>
          )}

          <div className="text-center mt-8">
            <Button variant="outline" size="lg" className="btn-lift" asChild>
              <a href="/clubs">View All Clubs</a>
            </Button>
          </div>
        </div>

        {/* Players List Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-20 mb-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              Featured Players
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Discover talented players looking for opportunities
            </p>
          </div>

          {/* Filters */}
          {!loadingData && players.length > 0 && (
            <div className="bg-card border border-border rounded-lg p-6 mb-8">
              <h3 className="font-semibold text-foreground mb-4">Filter Players</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Nationality Filter */}
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">
                    Nationality
                  </label>
                  <select
                    value={selectedNationality}
                    onChange={(e) => setSelectedNationality(e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                  >
                    <option value="">All Nationalities</option>
                    {nationalities.map((nat) => (
                      <option key={nat} value={nat}>
                        {nat}
                      </option>
                    ))}
                  </select>
                </div>

                {/* State Filter */}
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">
                    State
                  </label>
                  <select
                    value={selectedState}
                    onChange={(e) => setSelectedState(e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                  >
                    <option value="">All States</option>
                    {states.map((state) => (
                      <option key={state} value={state}>
                        {state}
                      </option>
                    ))}
                  </select>
                </div>

                {/* District Filter */}
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">
                    District
                  </label>
                  <select
                    value={selectedDistrict}
                    onChange={(e) => setSelectedDistrict(e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                  >
                    <option value="">All Districts</option>
                    {districts.map((dist) => (
                      <option key={dist} value={dist}>
                        {dist}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {loadingData ? (
            <div className="flex justify-center items-center py-12">
              <div className="text-muted-foreground">Loading players...</div>
            </div>
          ) : displayedPlayers.length > 0 ? (
            <>
              <div className="text-sm text-muted-foreground mb-4">
                Showing {displayedPlayers.length} of {filteredPlayers.length} players
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {displayedPlayers.map((player) => (
                  <Card key={player.id} className="card-hover overflow-hidden">
                    <CardHeader className="pb-3">
                      <div className="flex items-start gap-3">
                        {player.photo_url && (
                          <img
                            src={player.photo_url}
                            alt={`${player.users?.first_name} ${player.users?.last_name}`}
                            className="h-12 w-12 object-cover rounded-lg"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none'
                            }}
                          />
                        )}
                        <div className="flex-grow">
                          <CardTitle className="text-lg">
                            {player.users?.first_name} {player.users?.last_name}
                          </CardTitle>
                          {player.position && <CardDescription>{player.position}</CardDescription>}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-3 gap-2 text-sm">
                        <div className="text-center">
                          <div className="font-bold text-accent">{player.total_matches_played}</div>
                          <div className="text-xs text-muted-foreground">Matches</div>
                        </div>
                        <div className="text-center">
                          <div className="font-bold text-accent">{player.total_goals_scored}</div>
                          <div className="text-xs text-muted-foreground">Goals</div>
                        </div>
                        <div className="text-center">
                          <div className="font-bold text-accent">{player.total_assists}</div>
                          <div className="text-xs text-muted-foreground">Assists</div>
                        </div>
                      </div>
                      {player.state && (
                        <div className="text-xs text-muted-foreground">
                          📍 {player.district}, {player.state}
                        </div>
                      )}
                      <Button size="sm" variant="outline" className="w-full" asChild>
                        <a href={`/player/${player.id}`}>View Profile</a>
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Load More Button */}
              {hasMorePlayers && (
                <div className="flex justify-center mt-8">
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={handleLoadMorePlayers}
                    className="btn-lift"
                  >
                    Load More Players ({displayedPlayers.length} of {filteredPlayers.length})
                  </Button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              No players found matching your filters
            </div>
          )}
        </div>

        {/* Stadiums List Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-20 mb-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              Available Stadiums
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Book world-class venues for your matches and tournaments
            </p>
          </div>

          {loadingData ? (
            <div className="flex justify-center items-center py-12">
              <div className="text-muted-foreground">Loading stadiums...</div>
            </div>
          ) : stadiums.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {stadiums.map((stadium) => (
                <Card key={stadium.id} className="card-hover overflow-hidden">
                  <CardHeader className="pb-3">
                    {stadium.photo_urls && stadium.photo_urls.length > 0 && (
                      <div className="mb-3 -mx-6 -mt-6">
                        <img
                          src={stadium.photo_urls[0]}
                          alt={stadium.stadium_name}
                          className="h-40 w-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none'
                          }}
                        />
                      </div>
                    )}
                    <CardTitle className="text-lg">{stadium.stadium_name}</CardTitle>
                    {stadium.city && (
                      <CardDescription className="flex items-center gap-1">
                        📍 {stadium.city}
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      {stadium.capacity && (
                        <div>
                          <div className="font-semibold text-foreground">Capacity</div>
                          <div className="text-muted-foreground">{stadium.capacity} seats</div>
                        </div>
                      )}
                      {stadium.hourly_rate && (
                        <div>
                          <div className="font-semibold text-foreground">Rate</div>
                          <div className="text-muted-foreground">₹{stadium.hourly_rate}/hr</div>
                        </div>
                      )}
                    </div>
                    {stadium.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {stadium.description}
                      </p>
                    )}
                    <Button size="sm" variant="outline" className="w-full" asChild>
                      <a href={`/stadiums`}>View Details</a>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              No stadiums available yet
            </div>
          )}

          <div className="text-center mt-8">
            <Button variant="outline" size="lg" className="btn-lift" asChild>
              <a href="/stadiums">View All Stadiums</a>
            </Button>
          </div>
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

        {/* Match Formats & Squad Sizes */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-20 mb-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              Match Formats & Squad Sizes
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Professional standards for different game formats and squad requirements
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* 5-a-side */}
            <Card className="card-hover border-l-4 border-l-green-500 overflow-hidden">
              <CardHeader>
                <CardTitle className="text-xl text-foreground flex items-center gap-2">
                  <span className="text-2xl">⚽</span>
                  5-a-side Football
                </CardTitle>
                <CardDescription>Fast-paced indoor/outdoor games</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold text-foreground mb-2">Squad Requirements:</h4>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <div className="font-bold text-green-800">Minimum: 8 players</div>
                    <div className="text-sm text-green-700">5 on field + 3 substitutes</div>
                  </div>
                </div>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <div>• Match duration: 2 x 20 minutes</div>
                  <div>• Rolling substitutions allowed</div>
                  <div>• Smaller pitch (30-50m x 20-30m)</div>
                  <div>• No offside rule</div>
                </div>
              </CardContent>
            </Card>

            {/* 7-a-side */}
            <Card className="card-hover border-l-4 border-l-blue-500 overflow-hidden">
              <CardHeader>
                <CardTitle className="text-xl text-foreground flex items-center gap-2">
                  <span className="text-2xl">⚽</span>
                  7-a-side Football
                </CardTitle>
                <CardDescription>Semi-professional format</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold text-foreground mb-2">Squad Requirements:</h4>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <div className="font-bold text-blue-800">Minimum: 11 players</div>
                    <div className="text-sm text-blue-700">7 on field + 4 substitutes</div>
                  </div>
                </div>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <div>• Match duration: 2 x 30 minutes</div>
                  <div>• 3 substitutions per team</div>
                  <div>• Medium pitch (50-65m x 30-45m)</div>
                  <div>• Modified offside rule</div>
                </div>
              </CardContent>
            </Card>

            {/* 11-a-side */}
            <Card className="card-hover border-l-4 border-l-purple-500 overflow-hidden">
              <CardHeader>
                <CardTitle className="text-xl text-foreground flex items-center gap-2">
                  <span className="text-2xl">⚽</span>
                  11-a-side Football
                </CardTitle>
                <CardDescription>Professional standard format</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold text-foreground mb-2">Squad Requirements:</h4>
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                    <div className="font-bold text-purple-800">Minimum: 14 players</div>
                    <div className="text-sm text-purple-700">11 on field + 3 substitutes</div>
                  </div>
                </div>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <div>• Match duration: 2 x 45 minutes</div>
                  <div>• 5 substitutions per team</div>
                  <div>• Full pitch (90-120m x 45-90m)</div>
                  <div>• Standard FIFA rules apply</div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Path to Professional Division - Modern Timeline Design */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-24 mb-20">
          {/* Header */}
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold text-foreground mb-6">
              Path to Professional Division
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Your team's journey through competitive tiers to reach the professional level
            </p>
          </div>

          {/* Timeline Container */}
          <div className="relative">
            {/* Desktop Timeline Line */}
            <div className="hidden lg:block absolute left-1/2 top-20 bottom-0 w-1 bg-black"></div>

            {/* Timeline Items */}
            <div className="space-y-8 lg:space-y-12">
              {leaguePath.map((step, index) => (
                <div key={step.key} className="relative">
                  {/* Timeline Dot - Desktop */}
                  <div className="hidden lg:block absolute left-1/2 top-8 -translate-x-1/2 z-20">
                    <div className={`h-5 w-5 rounded-full ring-4 ring-background ${step.dotClass}`}></div>
                  </div>

                  {/* Alternating Layout */}
                  <div className={`flex flex-col lg:flex-row gap-8 lg:gap-12 items-stretch ${index % 2 === 0 ? 'lg:flex-row' : 'lg:flex-row-reverse'}`}>
                    {/* Content Side */}
                    <div className="flex-1 flex items-center">
                      <Card className={`${step.cardClass} w-full relative overflow-hidden group transition-all duration-300 hover:shadow-2xl hover:-translate-y-2`}>
                        {/* Badge */}
                        <div className="absolute top-4 left-4 z-20">
                          <div className={`${step.badgeClass} px-3 py-1 rounded-lg text-xs font-bold`}>
                            {step.badge}
                          </div>
                        </div>

                        {/* Content */}
                        <div className="p-8 pt-12">
                          <div className="flex items-start gap-4 mb-4">
                            <span className="text-5xl flex-shrink-0 group-hover:scale-110 transition-transform">{step.icon}</span>
                          </div>
                          <h3 className="text-2xl font-bold text-foreground mb-3">
                            {step.title}
                          </h3>
                          <p className="text-muted-foreground leading-relaxed mb-6">
                            {step.description}
                          </p>
                          <div className="flex items-center justify-between pt-4 border-t border-border">
                            <span className="text-sm font-semibold text-muted-foreground">
                              Step {index + 1} of {leaguePath.length}
                            </span>
                            <span className="text-xs font-bold text-accent uppercase tracking-widest">
                              {step.badge}
                            </span>
                          </div>
                        </div>
                      </Card>
                    </div>

                    {/* Spacer for Desktop */}
                    <div className="hidden lg:flex flex-1"></div>
                  </div>

                  {/* Arrow Between Items - Mobile */}
                  {index < leaguePath.length - 1 && (
                    <div className="lg:hidden flex justify-center mt-4">
                      <div className="text-3xl text-muted-foreground/40 animate-bounce">↓</div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* CTA Section */}
          <div className="mt-20 text-center">
            <div className="inline-block bg-accent/10 border border-accent/30 rounded-2xl p-10 sm:p-16 w-full max-w-2xl mx-auto">
              <h3 className="text-3xl font-bold text-foreground mb-4">
                Ready to Start Your Journey?
              </h3>
              <p className="text-muted-foreground mb-8 text-lg">
                Register your club today and begin climbing the tiers. Every elite team started at District Qualifiers.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                {!user && (
                  <>
                    <Button size="lg" variant="gradient" asChild>
                      <a href="/auth/signup">Register Your Club</a>
                    </Button>
                    <Button size="lg" variant="outline" asChild>
                      <a href="/tournaments">View Tournaments</a>
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Membership Pricing Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-20 mb-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              Membership Pricing
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Memberships do not include booking fees, referee fees, PCL staff fees, or tournament entry fees.
            </p>
          </div>

          {/* Pricing Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
            {/* For Player */}
            <Card className="card-hover border-l-4 border-l-accent relative">
              <CardHeader>
                <CardTitle className="text-foreground">For Player</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <div className="text-4xl font-bold text-accent">₹75</div>
                  <div className="text-muted-foreground">/month</div>
                </div>
                <ul className="space-y-3">
                  <li className="flex items-start gap-2">
                    <span className="text-accent font-bold mt-1">✓</span>
                    <span className="text-muted-foreground">Verified PCL ID & KYC</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-accent font-bold mt-1">✓</span>
                    <span className="text-muted-foreground">Appear in recruitment list</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-accent font-bold mt-1">✓</span>
                    <span className="text-muted-foreground">Eligibility for official matches</span>
                  </li>
                </ul>
                <Button className="w-full" variant="gradient" asChild>
                  <a href="/auth/signup">Get started</a>
                </Button>
              </CardContent>
            </Card>

            {/* For Club */}
            <Card className="card-hover border-l-4 border-l-primary relative shadow-lg">
              <CardHeader>
                <CardTitle className="text-foreground">For Club</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <div className="text-4xl font-bold text-primary">₹250</div>
                  <div className="text-muted-foreground">/month</div>
                </div>
                <ul className="space-y-3">
                  <li className="flex items-start gap-2">
                    <span className="text-primary font-bold mt-1">✓</span>
                    <span className="text-muted-foreground">Create club, recruit players</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary font-bold mt-1">✓</span>
                    <span className="text-muted-foreground">Organize matches & book venues</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary font-bold mt-1">✓</span>
                    <span className="text-muted-foreground">Enter PCL tournaments</span>
                  </li>
                </ul>
                <Button className="w-full" variant="gradient" asChild>
                  <a href="/auth/signup">Get started</a>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* FAQs Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-20 mb-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Everything you need to know about Professional Club League
            </p>
          </div>

          <div className="max-w-4xl mx-auto space-y-4">
            {/* FAQ 1 */}
            <Card className="card-hover">
              <CardHeader>
                <CardTitle className="text-lg">How do I join a club?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  First, create your player profile with verified KYC. Once verified, you'll appear in the recruitment list where club owners can scout and invite you. You can also apply directly to clubs through their profiles.
                </p>
              </CardContent>
            </Card>

            {/* FAQ 2 */}
            <Card className="card-hover">
              <CardHeader>
                <CardTitle className="text-lg">What are the membership fees?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Player membership costs ₹75/month and Club membership costs ₹250/month. These fees don't include match booking, referee, or tournament entry fees.
                </p>
              </CardContent>
            </Card>

            {/* FAQ 3 */}
            <Card className="card-hover">
              <CardHeader>
                <CardTitle className="text-lg">How does the tier system work?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Teams start in District Qualifiers, then progress through Tier 3 (Amateur), Tier 2 (Intermediate), and finally Tier 1 (Professional) based on performance in tournaments and league matches.
                </p>
              </CardContent>
            </Card>

            {/* FAQ 4 */}
            <Card className="card-hover">
              <CardHeader>
                <CardTitle className="text-lg">What match formats are available?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  We support 5-a-side (8 min squad), 7-a-side (11 min squad), and 11-a-side (14 min squad) formats. Each format has specific pitch sizes, rules, and duration requirements.
                </p>
              </CardContent>
            </Card>

            {/* FAQ 5 */}
            <Card className="card-hover">
              <CardHeader>
                <CardTitle className="text-lg">Can I book stadiums for practice?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Yes! Club owners can book registered stadiums for matches, practice sessions, and tournaments. Hourly rates and availability vary by venue.
                </p>
              </CardContent>
            </Card>

            {/* FAQ 6 */}
            <Card className="card-hover">
              <CardHeader>
                <CardTitle className="text-lg">Do I need KYC verification?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Yes, KYC verification is mandatory for all users to participate in official matches and tournaments. This ensures player authenticity and eligibility tracking.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Company Information Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-20 mb-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              About FDS COOP LLP
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Professional Club League is powered by FDS COOP LLP - a recognized startup in sports technology
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {/* Company Registration */}
            <Card className="card-hover border-l-4 border-l-blue-500">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <span className="text-2xl">🏢</span>
                  Company Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <div className="font-semibold text-foreground">FDS COOP LLP</div>
                  <div className="text-sm text-muted-foreground">Limited Liability Partnership</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">CIN</div>
                  <div className="font-mono text-sm text-foreground">AAU-1337</div>
                </div>
              </CardContent>
            </Card>

            {/* StartupIndia Recognition */}
            <Card className="card-hover border-l-4 border-l-green-500">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <span className="text-2xl">🚀</span>
                  StartupIndia
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <div className="font-semibold text-foreground">Recognized Startup</div>
                  <div className="text-sm text-muted-foreground">Department for Promotion of Industry and Internal Trade</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Startup ID</div>
                  <div className="font-mono text-sm text-foreground">DIPP69878</div>
                </div>
              </CardContent>
            </Card>

            {/* KSUM Support */}
            <Card className="card-hover border-l-4 border-l-purple-500">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <span className="text-2xl">🌟</span>
                  KSUM
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <div className="font-semibold text-foreground">Kerala Startup Mission</div>
                  <div className="text-sm text-muted-foreground">Government of Kerala</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">KSUM ID</div>
                  <div className="font-mono text-sm text-foreground">DIPP69878/2020/KSUM1031</div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="text-center mt-8">
            <Card className="card-hover max-w-2xl mx-auto">
              <CardContent className="pt-6">
                <p className="text-muted-foreground">
                  <strong>FDS COOP LLP</strong> is committed to transforming sports management in India through innovative technology solutions. Our platform connects players, clubs, referees, and stadium owners in one comprehensive ecosystem.
                </p>
              </CardContent>
            </Card>
          </div>
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
      <footer className="bg-gradient-to-b from-background to-card border-t border-border mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Main Footer Content */}
          <div className="py-12">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8 mb-12">
              {/* Brand Section */}
              <div className="lg:col-span-1">
                <h3 className="text-lg font-bold text-foreground mb-4">PCL</h3>
                <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                  Professional Club League - transforming sports management in India.
                </p>
                <div className="flex gap-3">
                  <a href="#" className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-muted hover:bg-primary hover:text-primary-foreground transition-colors" title="Twitter">
                    <span className="text-xs">𝕏</span>
                  </a>
                  <a href="#" className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-muted hover:bg-primary hover:text-primary-foreground transition-colors" title="Facebook">
                    <span className="text-sm">f</span>
                  </a>
                  <a href="#" className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-muted hover:bg-primary hover:text-primary-foreground transition-colors" title="LinkedIn">
                    <span className="text-xs">in</span>
                  </a>
                  <a href="#" className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-muted hover:bg-primary hover:text-primary-foreground transition-colors" title="Instagram">
                    <span className="text-xs">📷</span>
                  </a>
                </div>
              </div>

              {/* Quick Links */}
              <div>
                <h4 className="text-sm font-semibold text-foreground mb-4 uppercase tracking-wide">Platform</h4>
                <ul className="space-y-3">
                  <li>
                    <a href="/" className="text-sm text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-1 group">
                      <span className="group-hover:translate-x-1 transition-transform">→</span>
                      Home
                    </a>
                  </li>
                  <li>
                    <a href="/about" className="text-sm text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-1 group">
                      <span className="group-hover:translate-x-1 transition-transform">→</span>
                      About Us
                    </a>
                  </li>
                  <li>
                    <a href="/auth/signup" className="text-sm text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-1 group">
                      <span className="group-hover:translate-x-1 transition-transform">→</span>
                      Get Started
                    </a>
                  </li>
                  <li>
                    <a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-1 group">
                      <span className="group-hover:translate-x-1 transition-transform">→</span>
                      Features
                    </a>
                  </li>
                </ul>
              </div>

              {/* Legal */}
              <div>
                <h4 className="text-sm font-semibold text-foreground mb-4 uppercase tracking-wide">Legal</h4>
                <ul className="space-y-3">
                  <li>
                    <a href="/legal/privacy-policy" className="text-sm text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-1 group">
                      <span className="group-hover:translate-x-1 transition-transform">→</span>
                      Privacy Policy
                    </a>
                  </li>
                  <li>
                    <a href="/legal/terms-and-conditions" className="text-sm text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-1 group">
                      <span className="group-hover:translate-x-1 transition-transform">→</span>
                      Terms & Conditions
                    </a>
                  </li>
                  <li>
                    <a href="/legal/refund-policy" className="text-sm text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-1 group">
                      <span className="group-hover:translate-x-1 transition-transform">→</span>
                      Refund Policy
                    </a>
                  </li>
                  <li>
                    <a href="/legal/membership-policies" className="text-sm text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-1 group">
                      <span className="group-hover:translate-x-1 transition-transform">→</span>
                      Membership
                    </a>
                  </li>
                  <li>
                    <a href="/legal/code-of-conduct" className="text-sm text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-1 group">
                      <span className="group-hover:translate-x-1 transition-transform">→</span>
                      Code of Conduct
                    </a>
                  </li>
                </ul>
              </div>

              {/* Support */}
              <div>
                <h4 className="text-sm font-semibold text-foreground mb-4 uppercase tracking-wide">Support</h4>
                <ul className="space-y-3">
                  <li>
                    <a href="mailto:support@professionalclubleague.com" className="text-sm text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-1 group">
                      <span className="group-hover:translate-x-1 transition-transform">→</span>
                      Email Support
                    </a>
                  </li>
                  <li>
                    <a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-1 group">
                      <span className="group-hover:translate-x-1 transition-transform">→</span>
                      Help Center
                    </a>
                  </li>
                  <li>
                    <a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-1 group">
                      <span className="group-hover:translate-x-1 transition-transform">→</span>
                      Contact Us
                    </a>
                  </li>
                  <li>
                    <a href="/legal" className="text-sm text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-1 group">
                      <span className="group-hover:translate-x-1 transition-transform">→</span>
                      Legal Hub
                    </a>
                  </li>
                </ul>
              </div>

              {/* Company Info */}
              <div>
                <h4 className="text-sm font-semibold text-foreground mb-4 uppercase tracking-wide">Company</h4>
                <div className="space-y-4 text-xs text-muted-foreground">
                  <div>
                    <p className="font-semibold text-foreground text-sm">FDS COOP LLP</p>
                    <p className="mt-1">CIN: AAU-1337</p>
                  </div>
                  <div>
                    <p className="font-semibold text-foreground text-sm">StartupIndia</p>
                    <p className="mt-1">DIPP69878</p>
                  </div>
                  <div>
                    <p className="font-semibold text-foreground text-sm">KSUM</p>
                    <p className="mt-1 font-mono text-xs">DIPP69878/2020/KSUM1031</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-border"></div>
          </div>

          {/* Bottom Footer */}
          <div className="py-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-muted-foreground">
            <div>
              <p>&copy; 2025 Professional Club League by FDS COOP LLP. All rights reserved.</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1">
                <span>Made with</span>
                <span className="text-red-500">❤</span>
                <span>in India</span>
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
