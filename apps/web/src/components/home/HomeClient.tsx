'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import TournamentStatistics from '@/components/TournamentStatistics'
import BetaBanner from '@/components/BetaBanner'
import ContactModal from '@/components/ContactModal'
import type { Club, Player, Stadium } from '@/types/database'
import {
 Menu, X, Users, Trophy, Target, Building2,
 ChevronDown, CheckCircle, Star, Award,
 TrendingUp, Shield, Zap, ArrowDown
} from 'lucide-react'

export default function HomeClient() {
 const router = useRouter()
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

 // Match Details Modal State
 const [selectedMatch, setSelectedMatch] = useState<any>(null)
 const [showMatchDetails, setShowMatchDetails] = useState(false)
 const [liveMatchTimes, setLiveMatchTimes] = useState<{[key: number]: {minutes: number, seconds: number}}>({})

 // Contact Modal State
 const [isContactModalOpen, setIsContactModalOpen] = useState(false)

 // Navigation Menu State
 const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

 // Initialize live match times
 useEffect(() => {
 const initialTimes: {[key: number]: {minutes: number, seconds: number}} = {}
 sampleMatches.forEach(match => {
 if (match.status === 'live' && match.time) {
 // Parse initial time (e.g., "68' 2nd Half" -> 68 minutes)
 const timeMatch = match.time.match(/(\d+)/)
 const initialMinutes = timeMatch ? parseInt(timeMatch[1]) : 45
 initialTimes[match.id] = { minutes: initialMinutes, seconds: 0 }
 }
 })
 setLiveMatchTimes(initialTimes)
 }, [])

 // Update live match times every second
 useEffect(() => {
 const interval = setInterval(() => {
 setLiveMatchTimes(prev => {
 const updated = { ...prev }
 Object.keys(updated).forEach(matchId => {
 const matchIdNum = parseInt(matchId)
 let { minutes, seconds } = updated[matchIdNum]
 
 seconds += 1
 if (seconds >= 60) {
 seconds = 0
 minutes += 1
 }
 
 updated[matchIdNum] = { minutes, seconds }
 })
 return updated
 })
 }, 1000)
 
 return () => clearInterval(interval)
 }, [])

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
 .limit(100) // Fetch more for pagination
 
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

 // Sample match data (replace with actual API data later)
 const sampleMatches = [
 {
 id: 1,
 status: 'live',
 homeTeam: 'FC Warriors',
 awayTeam: 'Thunder XI',
 homeScore: 2,
 awayScore: 1,
 time: "68' 2nd Half",
 tournament: 'Tier 3 - Amateur',
 location: 'Ernakulam',
 stadium: 'Municipal Stadium, Kochi',
 date: 'Today',
 homeLineup: ['John Doe', 'Mike Smith', 'Alex Johnson', 'Chris Brown', 'David Lee', 'Tom Wilson', 'Jake Davis', 'Sam Anderson', 'Ryan Taylor', 'Ben Moore', 'Luke White'],
 awayLineup: ['James Clark', 'Robert Hall', 'William King', 'Daniel Wright', 'Joseph Scott', 'Andrew Green', 'Matthew Adams', 'Brian Nelson', 'Kevin Carter', 'Gary Mitchell', 'Eric Roberts'],
 homeGoals: [{ player: 'John Doe', time: "23'" }, { player: 'Mike Smith', time: "56'" }],
 awayGoals: [{ player: 'James Clark', time: "45'" }],
 referee: 'Rajesh Kumar',
 },
 {
 id: 2,
 status: 'upcoming',
 homeTeam: 'City Strikers',
 awayTeam: 'Coastal FC',
 time: 'Today, 6:00 PM',
 tournament: 'District Qualifiers',
 location: 'Thiruvananthapuram',
 stadium: 'Central Stadium, Trivandrum',
 date: 'Today',
 referee: 'Suresh Nair',
 },
 {
 id: 3,
 status: 'completed',
 homeTeam: 'United FC',
 awayTeam: 'Elite Sports',
 homeScore: 3,
 awayScore: 2,
 tournament: 'Tier 2 - Intermediate',
 location: 'Kozhikode',
 stadium: 'Regional Stadium, Calicut',
 date: 'Yesterday',
 homeLineup: ['Player 1', 'Player 2', 'Player 3', 'Player 4', 'Player 5', 'Player 6', 'Player 7', 'Player 8', 'Player 9', 'Player 10', 'Player 11'],
 awayLineup: ['Player A', 'Player B', 'Player C', 'Player D', 'Player E', 'Player F', 'Player G', 'Player H', 'Player I', 'Player J', 'Player K'],
 homeGoals: [{ player: 'Player 1', time: "12'" }, { player: 'Player 3', time: "34'" }, { player: 'Player 2', time: "78'" }],
 awayGoals: [{ player: 'Player A', time: "29'" }, { player: 'Player D', time: "67'" }],
 referee: 'Vinod Kumar',
 }
 ]

 const handleViewMatchDetails = (match: any) => {
 setSelectedMatch(match)
 setShowMatchDetails(true)
 }

 const statsCards = [
 { label: 'Registered Players', value: playerCount, Icon: Users, borderColor: 'border-t-blue-400' },
 { label: 'Registered Clubs', value: clubCount, Icon: Trophy, borderColor: 'border-t-green-400' },
 { label: 'Registered Stadiums', value: stadiumCount, Icon: Building2, borderColor: 'border-t-purple-400' },
 { label: 'Tournaments', value: tournamentCount, Icon: Target, borderColor: 'border-t-orange-400' },
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
 description: 'Elite teams compete at the national level with full professional standards.',
 cardClass: 'border-l-4 border-l-accent',
 badgeClass: 'bg-amber-500 text-white font-bold',
 dotClass: 'bg-black',
 },
 ]

 return (
 <div className="min-h-screen bg-background">
 {/* Enhanced Navigation with Menu */}
 <nav className="sticky-nav-mobile-safe bg-card border-b border-border shadow-sm sticky top-0 z-50 backdrop-blur-sm bg-card/95">
 <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
 <div className="flex justify-between items-center h-16">
 <div className="flex items-center gap-8">
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

 {/* Desktop Navigation Links */}
 <div className="hidden md:flex items-center gap-6">
 <a href="#features" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
 Features
 </a>
 <a href="#pricing" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
 Pricing
 </a>
 <a href="#path-to-pro" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
 Path to Pro
 </a>
 <a href="#faq" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
 FAQs
 </a>
 <button
 onClick={() => setIsContactModalOpen(true)}
 className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
 >
 Contact
 </button>
 </div>
 </div>

 <div className="flex items-center gap-4">
 {user ? (
 <>
 <span className="text-sm text-muted-foreground hidden lg:inline">{user.email}</span>
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
 className="btn-lift hidden sm:flex"
 >
 Sign Out
 </Button>
 </>
 ) : (
 <>
 <Button
 variant="outline"
 size="sm"
 className="btn-lift hidden sm:flex"
 onClick={() => router.push('/auth/login')}
 >
 Sign In
 </Button>
 <Button
 variant="gradient"
 size="sm"
 className="btn-lift hidden sm:flex"
 onClick={() => router.push('/auth/signup')}
 >
 Sign Up
 </Button>
 </>
 )}

 {/* Mobile Menu Button */}
 <button
 className="md:hidden p-2 text-foreground"
 onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
 >
 {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
 </button>
 </div>
 </div>

 {/* Mobile Menu */}
 {mobileMenuOpen && (
 <div className="md:hidden py-4 border-t border-border">
 <div className="flex flex-col gap-4">
 <a
 href="#features"
 className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
 onClick={() => setMobileMenuOpen(false)}
 >
 Features
 </a>
 <a
 href="#pricing"
 className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
 onClick={() => setMobileMenuOpen(false)}
 >
 Pricing
 </a>
 <a
 href="#path-to-pro"
 className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
 onClick={() => setMobileMenuOpen(false)}
 >
 Path to Pro
 </a>
 <a
 href="#faq"
 className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
 onClick={() => setMobileMenuOpen(false)}
 >
 FAQs
 </a>
 <button
 onClick={() => {
 setIsContactModalOpen(true)
 setMobileMenuOpen(false)
 }}
 className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors text-left"
 >
 Contact
 </button>

 {user ? (
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
 className="btn-lift w-full"
 >
 Sign Out
 </Button>
 ) : (
 <div className="flex flex-col gap-2 pt-2 border-t border-border">
 <Button
 variant="outline"
 size="sm"
 className="btn-lift w-full"
 onClick={() => router.push('/auth/login')}
 >
 Sign In
 </Button>
 <Button
 variant="gradient"
 size="sm"
 className="btn-lift w-full"
 onClick={() => router.push('/auth/signup')}
 >
 Sign Up
 </Button>
 </div>
 )}
 </div>
 </div>
 )}
 </div>
 </nav>

 {/* Beta Banner - Prominent for Payment Gateway Verification */}
 <BetaBanner />

 {/* Hero Section - Optimized Height */}
 <main>
 {/* Modern Banner */}
 <div className="relative mt-0 mb-12 overflow-hidden shadow-2xl">
 <div
 className="relative overflow-hidden bg-cover bg-center min-h-[400px] sm:min-h-[550px] lg:min-h-[650px]"
 style={{ backgroundImage: "url('/banner.jpg')" }}
 >
 <div className="absolute inset-0 bg-black/50"></div>
 <div className="absolute inset-0 opacity-10 bg-grid-pattern"></div>
 <div className="relative z-10 px-6 py-12 sm:px-12 sm:py-16 lg:py-20 min-h-[400px] sm:min-h-[550px] lg:min-h-[650px] flex items-center justify-center text-center">
 <div className="w-full max-w-5xl flex flex-col items-center">
 {/* Trust Badges - Moved to Hero */}
 <div className="flex flex-wrap gap-3 justify-center mb-6">
 <div className="flex items-center gap-2 bg-white/90 backdrop-blur-sm rounded-full px-3 py-1.5 shadow-lg">
 <Shield size={16} className="text-primary" />
 <span className="text-xs font-semibold text-primary">StartupIndia Recognized</span>
 </div>
 <div className="flex items-center gap-2 bg-white/90 backdrop-blur-sm rounded-full px-3 py-1.5 shadow-lg">
 <Award size={16} className="text-primary" />
 <span className="text-xs font-semibold text-primary">KSUM Supported</span>
 </div>
 </div>

 <h1 className="text-center text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white mb-4 tracking-tight">
 India's First Professional Club League
 </h1>
 <p className="text-center text-lg sm:text-xl lg:text-2xl text-white/95 mb-8 max-w-3xl mx-auto leading-relaxed font-medium">
 From Local Tournaments to National Glory – Build Your Football Legacy
 </p>

 {/* Prominent CTAs */}
 {!user && (
 <div className="flex flex-col sm:flex-row gap-4 mb-8">
 <Button
 size="lg"
 className="btn-lift bg-accent hover:bg-accent-hover text-white border-0 text-lg px-8 py-6 shadow-xl"
 onClick={() => router.push('/auth/signup')}
 >
 Get Started Free
 </Button>
 <Button
 size="lg"
 variant="outline"
 className="btn-lift text-white border-white hover:bg-white/10 text-lg px-8 py-6 shadow-xl"
 onClick={() => {
 document.querySelector('#features')?.scrollIntoView({ behavior: 'smooth' })
 }}
 >
 Learn More
 </Button>
 </div>
 )}

 <div className="flex flex-wrap gap-3 justify-center items-center text-center mx-auto">
 <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 text-white">
 <Users size={20} />
 <span className="font-semibold text-sm">Players</span>
 </div>
 <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 text-white">
 <Trophy size={20} />
 <span className="font-semibold text-sm">Clubs</span>
 </div>
 <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 text-white">
 <Target size={20} />
 <span className="font-semibold text-sm">Referees</span>
 </div>
 <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 text-white">
 <Building2 size={20} />
 <span className="font-semibold text-sm">Stadiums</span>
 </div>
 </div>

 {/* Scroll Indicator */}
 <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
 <ArrowDown size={32} className="text-white/70" />
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
 {statsCards.map((stat) => {
 const Icon = stat.Icon
 return (
 <div
 key={stat.label}
 className={`bg-card/50 backdrop-blur-sm rounded-xl p-5 shadow-md hover:shadow-lg transition-all duration-300 card-hover border-t-4 ${stat.borderColor}`}
 >
 <div className="flex items-center justify-between mb-3">
 <div className="p-3 rounded-lg bg-primary/5">
 <Icon className="h-6 w-6 text-primary" />
 </div>
 </div>
 <div className="space-y-1">
 <div className="text-2xl md:text-3xl font-bold text-foreground">
 {loadingData ? <Skeleton className="h-8 w-16" /> : stat.value.toLocaleString()}
 </div>
 <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
 {stat.label}
 </div>
 <div className="flex items-center gap-1 text-xs text-green-600 pt-1">
 <TrendingUp size={12} />
 <span>Live</span>
 </div>
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

 {/* Live Matches & Results Section */}
 <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-20 mb-16">
 <div className="text-center mb-12">
 <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
 Live Matches & Results
 </h2>
 <p className="text-muted-foreground max-w-2xl mx-auto">
 Follow live matches and recent results from across the league
 </p>
 </div>

 {/* Demo Data Notice */}
 <div className="mb-8 p-3 bg-blue-50 border border-blue-200 rounded-lg max-w-3xl mx-auto">
 <p className="text-sm text-blue-900 text-center">
 <strong>Demo Data:</strong> All matches, clubs, and players shown are sample data for demonstration purposes only.
 </p>
 </div>

 {/* Match Filters */}
 <div className="bg-card border border-border rounded-lg p-6 mb-8">
 <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
 <div>
 <label className="block text-sm font-medium text-muted-foreground mb-2">
 Match Status
 </label>
 <select className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent">
 <option value="">All Matches</option>
 <option value="live">Live Now</option>
 <option value="upcoming">Upcoming</option>
 <option value="completed">Completed</option>
 </select>
 </div>
 <div>
 <label className="block text-sm font-medium text-muted-foreground mb-2">
 State
 </label>
 <select className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent">
 <option value="">All States</option>
 <option value="kerala">Kerala</option>
 <option value="karnataka">Karnataka</option>
 <option value="tamil-nadu">Tamil Nadu</option>
 </select>
 </div>
 <div>
 <label className="block text-sm font-medium text-muted-foreground mb-2">
 District
 </label>
 <select className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent">
 <option value="">All Districts</option>
 <option value="ernakulam">Ernakulam</option>
 <option value="thiruvananthapuram">Thiruvananthapuram</option>
 <option value="kozhikode">Kozhikode</option>
 </select>
 </div>
 <div>
 <label className="block text-sm font-medium text-muted-foreground mb-2">
 Tournament Type
 </label>
 <select className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent">
 <option value="">All Types</option>
 <option value="dql">District Qualifiers</option>
 <option value="tier-3">Tier 3 - Amateur</option>
 <option value="tier-2">Tier 2 - Intermediate</option>
 <option value="tier-1">Tier 1 - Professional</option>
 <option value="friendly">Friendly Match</option>
 </select>
 </div>
 </div>
 </div>

 {/* Matches Grid */}
 <div className="space-y-4">
 {sampleMatches.map((match) => (
 <Card
 key={match.id}
 className={`border-l-4 ${
 match.status === 'live' ? 'border-l-red-500' :
 match.status === 'upcoming' ? 'border-l-blue-500' :
 'border-l-green-500'
 } overflow-hidden`}
 >
 <CardContent className="p-6">
 <div className="flex items-center justify-between mb-4">
 <div className="flex items-center gap-2">
 {match.status === 'live' && (
 <>
 <span className="relative flex h-3 w-3">
 <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
 <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
 </span>
 <span className="text-sm font-bold text-red-500 uppercase tracking-wide">Live</span>
 </>
 )}
 {match.status === 'upcoming' && (
 <span className="text-sm font-semibold text-blue-500 uppercase tracking-wide">Upcoming</span>
 )}
 {match.status === 'completed' && (
 <span className="text-sm font-semibold text-green-500 uppercase tracking-wide">Full Time</span>
 )}
 </div>
 <div className="text-sm text-muted-foreground">{match.tournament} • {match.location} • {match.date}</div>
 </div>
 <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4">
 <div className="text-right">
 <div className={`font-bold text-lg ${
 match.status !== 'upcoming' && match.homeScore !== undefined && match.awayScore !== undefined && match.homeScore > match.awayScore
 ? 'text-green-600'
 : match.status !== 'upcoming' && match.homeScore !== undefined && match.awayScore !== undefined && match.homeScore < match.awayScore
 ? 'text-red-600'
 : 'text-foreground'
 }`}>
 {match.homeTeam}
 </div>
 <div className="text-xs text-muted-foreground">Home</div>
 </div>
 <div className="text-center px-6">
 {match.status === 'upcoming' ? (
 <>
 <div className="text-xl font-bold text-muted-foreground">vs</div>
 <div className="text-xs text-muted-foreground mt-1">{match.time}</div>
 </>
 ) : (
 <>
 <div className="flex items-center justify-center gap-2">
 <div className={`text-3xl font-bold px-2 rounded ${
 match.homeScore !== undefined && match.awayScore !== undefined && match.homeScore > match.awayScore
 ? 'bg-green-50 text-green-600'
 : match.homeScore !== undefined && match.awayScore !== undefined && match.homeScore < match.awayScore
 ? 'bg-red-50 text-red-600'
 : 'text-foreground'
 }`}>
 {match.homeScore}
 </div>
 <div className="text-2xl font-bold text-muted-foreground">-</div>
 <div className={`text-3xl font-bold px-2 rounded ${
 match.awayScore !== undefined && match.homeScore !== undefined && match.awayScore > match.homeScore
 ? 'bg-green-50 text-green-600'
 : match.awayScore !== undefined && match.homeScore !== undefined && match.awayScore < match.homeScore
 ? 'bg-red-50 text-red-600'
 : 'text-foreground'
 }`}>
 {match.awayScore}
 </div>
 </div>
 <div className={`text-xs mt-1 font-semibold ${
 match.status === 'live' ? 'text-red-500 animate-pulse' : 'text-muted-foreground'
 }`}>
 {match.status === 'live' ? (
 <span className="text-sm font-bold">
 {String(liveMatchTimes[match.id]?.minutes || 0).padStart(2, '0')}:{String(liveMatchTimes[match.id]?.seconds || 0).padStart(2, '0')}
 </span>
 ) : match.time}
 </div>
 </>
 )}
 <div className="mt-3 pt-3 border-t border-accent/20">
 <div className="bg-accent/10 rounded-lg px-2 py-1.5 inline-block">
 <div className="text-xs font-semibold text-accent">📅 {match.date}</div>
 </div>
 </div>
 </div>
 <div className="text-left">
 <div className={`font-bold text-lg ${
 match.status !== 'upcoming' && match.awayScore !== undefined && match.homeScore !== undefined && match.awayScore > match.homeScore
 ? 'text-green-600'
 : match.status !== 'upcoming' && match.awayScore !== undefined && match.homeScore !== undefined && match.awayScore < match.homeScore
 ? 'text-red-600'
 : 'text-foreground'
 }`}>
 {match.awayTeam}
 </div>
 <div className="text-xs text-muted-foreground">Away</div>
 </div>
 </div>
 <div className="mt-4 pt-4 border-t border-border">
 <div className="flex justify-between items-center">
 <div className="text-xs text-muted-foreground">{match.stadium}</div>
 <Button
 size="sm"
 variant="outline"
 onClick={() => handleViewMatchDetails(match)}
 >
 {match.status === 'live' && 'View Details'}
 {match.status === 'upcoming' && 'Set Reminder'}
 {match.status === 'completed' && 'Match Report'}
 </Button>
 </div>
 </div>
 </CardContent>
 </Card>
 ))}
 </div>

 <div className="text-center mt-8">
 <Button variant="outline" size="lg" className="btn-lift">
 View All Matches
 </Button>
 </div>
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
 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
 {[...Array(6)].map((_, i) => (
 <Card key={i} className="overflow-hidden">
 <CardHeader className="pb-3">
 <Skeleton className="h-12 w-12 rounded-lg mb-3" />
 <Skeleton className="h-6 w-3/4 mb-2" />
 <Skeleton className="h-4 w-1/2" />
 </CardHeader>
 <CardContent className="space-y-3">
 <Skeleton className="h-10 w-full" />
 <Skeleton className="h-4 w-full" />
 <Skeleton className="h-4 w-2/3" />
 <Skeleton className="h-9 w-full mt-4" />
 </CardContent>
 </Card>
 ))}
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
 <Button
 size="sm"
 variant="outline"
 className="w-full"
 onClick={() => {
 const href = `/club/${club.id}`
 try {
 router.push(href)
 } finally {
 // If client-side navigation is prevented (e.g., overlay intercept), force a hard navigation.
 setTimeout(() => {
 if (typeof window !== 'undefined' && window.location.pathname !== href) {
 window.location.assign(href)
 }
 }, 50)
 }
 }}
 >
 View Club
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
 <Button
 size="sm"
 variant="outline"
 className="w-full"
 onClick={() => {
 const href = `/player/${player.id}`
 try {
 router.push(href)
 } finally {
 setTimeout(() => {
 if (typeof window !== 'undefined' && window.location.pathname !== href) {
 window.location.assign(href)
 }
 }, 50)
 }
 }}
 >
 View Profile
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
 <div id="features" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-20 mb-20">
 <div className="text-center mb-12">
 <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
 Built For Everyone in Football
 </h2>
 <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
 From players to club owners, referees to stadium managers – PCL has the tools you need
 </p>
 </div>

 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
 {/* Players */}
 <Card className="card-hover border-l-4 border-l-accent group">
 <CardHeader>
 <div className="mb-3 p-3 bg-accent/10 rounded-lg inline-block group-hover:scale-110 transition-transform">
 <Users className="h-8 w-8 text-accent" />
 </div>
 <CardTitle className="text-primary">For Players</CardTitle>
 <CardDescription>Build your profile and get scouted</CardDescription>
 </CardHeader>
 <CardContent>
 <ul className="text-sm text-muted-foreground space-y-2">
 <li className="flex items-start gap-2">
 <CheckCircle size={16} className="text-accent mt-0.5 flex-shrink-0" />
 <span>Create detailed player profile</span>
 </li>
 <li className="flex items-start gap-2">
 <CheckCircle size={16} className="text-accent mt-0.5 flex-shrink-0" />
 <span>KYC verification for scouting</span>
 </li>
 <li className="flex items-start gap-2">
 <CheckCircle size={16} className="text-accent mt-0.5 flex-shrink-0" />
 <span>Manage contracts with clubs</span>
 </li>
 <li className="flex items-start gap-2">
 <CheckCircle size={16} className="text-accent mt-0.5 flex-shrink-0" />
 <span>Track performance statistics</span>
 </li>
 </ul>
 </CardContent>
 </Card>

 {/* Club Owners */}
 <Card className="card-hover border-l-4 border-l-primary group">
 <CardHeader>
 <div className="mb-3 p-3 bg-primary/10 rounded-lg inline-block group-hover:scale-110 transition-transform">
 <Trophy className="h-8 w-8 text-primary" />
 </div>
 <CardTitle className="text-primary">For Club Owners</CardTitle>
 <CardDescription>Manage your clubs and teams</CardDescription>
 </CardHeader>
 <CardContent>
 <ul className="text-sm text-muted-foreground space-y-2">
 <li className="flex items-start gap-2">
 <CheckCircle size={16} className="text-accent mt-0.5 flex-shrink-0" />
 <span>Create and manage clubs</span>
 </li>
 <li className="flex items-start gap-2">
 <CheckCircle size={16} className="text-accent mt-0.5 flex-shrink-0" />
 <span>Scout and sign players</span>
 </li>
 <li className="flex items-start gap-2">
 <CheckCircle size={16} className="text-accent mt-0.5 flex-shrink-0" />
 <span>Organize matches and tournaments</span>
 </li>
 <li className="flex items-start gap-2">
 <CheckCircle size={16} className="text-accent mt-0.5 flex-shrink-0" />
 <span>Book stadiums for games</span>
 </li>
 </ul>
 </CardContent>
 </Card>

 {/* Referees */}
 <Card className="card-hover border-l-4 border-l-accent group">
 <CardHeader>
 <div className="mb-3 p-3 bg-accent/10 rounded-lg inline-block group-hover:scale-110 transition-transform">
 <Target className="h-8 w-8 text-accent" />
 </div>
 <CardTitle className="text-primary">For Referees</CardTitle>
 <CardDescription>Officiate matches professionally</CardDescription>
 </CardHeader>
 <CardContent>
 <ul className="text-sm text-muted-foreground space-y-2">
 <li className="flex items-start gap-2">
 <CheckCircle size={16} className="text-accent mt-0.5 flex-shrink-0" />
 <span>Create referee profile</span>
 </li>
 <li className="flex items-start gap-2">
 <CheckCircle size={16} className="text-accent mt-0.5 flex-shrink-0" />
 <span>Get assigned to matches</span>
 </li>
 <li className="flex items-start gap-2">
 <CheckCircle size={16} className="text-accent mt-0.5 flex-shrink-0" />
 <span>Track officiating history</span>
 </li>
 <li className="flex items-start gap-2">
 <CheckCircle size={16} className="text-accent mt-0.5 flex-shrink-0" />
 <span>Manage availability</span>
 </li>
 </ul>
 </CardContent>
 </Card>

 {/* Staff */}
 <Card className="card-hover border-l-4 border-l-primary group">
 <CardHeader>
 <div className="mb-3 p-3 bg-primary/10 rounded-lg inline-block group-hover:scale-110 transition-transform">
 <Users className="h-8 w-8 text-primary" />
 </div>
 <CardTitle className="text-primary">For Staff/Volunteers</CardTitle>
 <CardDescription>Support match operations</CardDescription>
 </CardHeader>
 <CardContent>
 <ul className="text-sm text-muted-foreground space-y-2">
 <li className="flex items-start gap-2">
 <CheckCircle size={16} className="text-accent mt-0.5 flex-shrink-0" />
 <span>Register as staff member</span>
 </li>
 <li className="flex items-start gap-2">
 <CheckCircle size={16} className="text-accent mt-0.5 flex-shrink-0" />
 <span>Get assigned to matches</span>
 </li>
 <li className="flex items-start gap-2">
 <CheckCircle size={16} className="text-accent mt-0.5 flex-shrink-0" />
 <span>Support tournament organization</span>
 </li>
 <li className="flex items-start gap-2">
 <CheckCircle size={16} className="text-accent mt-0.5 flex-shrink-0" />
 <span>Track experience and roles</span>
 </li>
 </ul>
 </CardContent>
 </Card>

 {/* Stadium Owners */}
 <Card className="card-hover border-l-4 border-l-accent group">
 <CardHeader>
 <div className="mb-3 p-3 bg-accent/10 rounded-lg inline-block group-hover:scale-110 transition-transform">
 <Building2 className="h-8 w-8 text-accent" />
 </div>
 <CardTitle className="text-primary">For Stadium Owners</CardTitle>
 <CardDescription>List and manage your venues</CardDescription>
 </CardHeader>
 <CardContent>
 <ul className="text-sm text-muted-foreground space-y-2">
 <li className="flex items-start gap-2">
 <CheckCircle size={16} className="text-accent mt-0.5 flex-shrink-0" />
 <span>List your stadiums</span>
 </li>
 <li className="flex items-start gap-2">
 <CheckCircle size={16} className="text-accent mt-0.5 flex-shrink-0" />
 <span>Manage availability slots</span>
 </li>
 <li className="flex items-start gap-2">
 <CheckCircle size={16} className="text-accent mt-0.5 flex-shrink-0" />
 <span>Set pricing and amenities</span>
 </li>
 <li className="flex items-start gap-2">
 <CheckCircle size={16} className="text-accent mt-0.5 flex-shrink-0" />
 <span>Accept bookings from clubs</span>
 </li>
 </ul>
 </CardContent>
 </Card>

 {/* Tournaments */}
 <Card className="card-hover border-l-4 border-l-primary group">
 <CardHeader>
 <div className="mb-3 p-3 bg-primary/10 rounded-lg inline-block group-hover:scale-110 transition-transform">
 <Award className="h-8 w-8 text-primary" />
 </div>
 <CardTitle className="text-primary">Tournament System</CardTitle>
 <CardDescription>Organize and compete</CardDescription>
 </CardHeader>
 <CardContent>
 <ul className="text-sm text-muted-foreground space-y-2">
 <li className="flex items-start gap-2">
 <CheckCircle size={16} className="text-accent mt-0.5 flex-shrink-0" />
 <span>Friendly and official matches</span>
 </li>
 <li className="flex items-start gap-2">
 <CheckCircle size={16} className="text-accent mt-0.5 flex-shrink-0" />
 <span>5-a-side, 7-a-side, 11-a-side</span>
 </li>
 <li className="flex items-start gap-2">
 <CheckCircle size={16} className="text-accent mt-0.5 flex-shrink-0" />
 <span>League structures</span>
 </li>
 <li className="flex items-start gap-2">
 <CheckCircle size={16} className="text-accent mt-0.5 flex-shrink-0" />
 <span>Real-time match tracking</span>
 </li>
 </ul>
 </CardContent>
 </Card>
 </div>
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
 <div id="path-to-pro" className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-24 mb-20">
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
 <div id="pricing" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-20 mb-20">
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
 <div id="faq" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-20 mb-20">
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

 {/* FAQ 3 - Detailed Tier System */}
 <Card className="card-hover border-l-4 border-l-accent">
 <CardHeader>
 <CardTitle className="text-lg">How does the tier system work?</CardTitle>
 </CardHeader>
 <CardContent className="space-y-4">
 <div>
 <p className="text-muted-foreground mb-4">
 PCL has a structured progression system for clubs to advance from grassroots to professional level:
 </p>

 <div className="space-y-3">
 <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
 <div className="font-semibold text-foreground mb-1">District Qualifiers (DQL)</div>
 <p className="text-sm text-muted-foreground">
 Entry point for all new clubs. Participate in local district-level tournaments to establish your club and gain experience. Performance here determines eligibility for tier advancement.
 </p>
 </div>

 <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
 <div className="font-semibold text-foreground mb-1">Tier 3 - Amateur Division</div>
 <p className="text-sm text-muted-foreground">
 Top DQL performers advance to the regional Amateur Division league. Clubs compete in official league matches and tournaments within this structured tier.
 </p>
 </div>

 <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
 <div className="font-semibold text-foreground mb-1">Tier 2 - Intermediate Division</div>
 <p className="text-sm text-muted-foreground">
 State-level league for the best Amateur teams. Clubs compete in the Intermediate Division league structure with higher stakes and improved facilities.
 </p>
 </div>

 <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
 <div className="font-semibold text-foreground mb-1">Tier 1 - Professional Division</div>
 <p className="text-sm text-muted-foreground">
 Elite national-level league with full professional standards. The pinnacle of PCL's league structure.
 </p>
 </div>
 </div>
 </div>

 <div className="pt-3 border-t border-border">
 <p className="text-sm font-semibold text-foreground mb-2">Important Notes:</p>
 <ul className="space-y-1 text-sm text-muted-foreground">
 <li className="flex items-start gap-2">
 <span className="text-accent mt-0.5">•</span>
 <span><strong>Friendly Matches:</strong> Can be played at any tier level without affecting tier standings</span>
 </li>
 <li className="flex items-start gap-2">
 <span className="text-accent mt-0.5">•</span>
 <span><strong>Official Tournaments:</strong> Only count towards tier progression when played within your tier</span>
 </li>
 <li className="flex items-start gap-2">
 <span className="text-accent mt-0.5">•</span>
 <span><strong>Promotion:</strong> Based on win rate, points, and league position at season end</span>
 </li>
 </ul>
 </div>
 </CardContent>
 </Card>

 {/* FAQ 4 */}
 <Card className="card-hover">
 <CardHeader>
 <CardTitle className="text-lg">What's the difference between DQL and Tier tournaments?</CardTitle>
 </CardHeader>
 <CardContent className="space-y-3">
 <div>
 <p className="font-semibold text-foreground mb-2">District Qualifiers (DQL)</p>
 <p className="text-sm text-muted-foreground">
 DQL is a separate qualification system for new clubs to prove their capability. It's district-based, with matches organized locally. Success in DQL tournaments earns entry into Tier 3.
 </p>
 </div>
 <div>
 <p className="font-semibold text-foreground mb-2">Tier System (Tier 3, 2, 1)</p>
 <p className="text-sm text-muted-foreground">
 Once in the tier system, clubs compete in official league matches and tournaments. Performance determines promotion/relegation between tiers. Tier 1 is the pinnacle of PCL competition.
 </p>
 </div>
 <div className="bg-muted/50 rounded-lg p-3 mt-3">
 <p className="text-sm text-muted-foreground">
 <strong>Friendly matches</strong> can be scheduled at any time and don't affect tier standings - they're perfect for practice and team building.
 </p>
 </div>
 </CardContent>
 </Card>

 {/* FAQ 5 */}
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

 {/* FAQ 6 */}
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

 {/* FAQ 7 */}
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

 {/* Match Details Modal */}
 {showMatchDetails && selectedMatch && (
 <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={() => setShowMatchDetails(false)}>
 <div className="bg-white rounded-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
 {/* Modal Header */}
 <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center z-10">
 <div>
 <h2 className="text-2xl font-bold text-foreground">Match Details</h2>
 <p className="text-sm text-muted-foreground">{selectedMatch.tournament} • {selectedMatch.location}</p>
 </div>
 <button
 onClick={() => setShowMatchDetails(false)}
 className="text-muted-foreground hover:text-foreground transition-colors p-2 rounded-lg hover:bg-muted"
 >
 <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
 </svg>
 </button>
 </div>

 {/* Modal Content */}
 <div className="p-6 space-y-6">
 {/* Match Status Banner */}
 <div className={`rounded-lg p-4 ${
 selectedMatch.status === 'live' ? 'bg-red-50 border-2 border-red-500' :
 selectedMatch.status === 'upcoming' ? 'bg-blue-50 border-2 border-blue-500' :
 'bg-green-50 border-2 border-green-500'
 }`}>
 <div className="flex items-center justify-between">
 <div className="flex items-center gap-3">
 {selectedMatch.status === 'live' && (
 <>
 <span className="relative flex h-4 w-4">
 <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
 <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500"></span>
 </span>
 <span className="text-lg font-bold text-red-600 ">LIVE MATCH</span>
 </>
 )}
 {selectedMatch.status === 'upcoming' && (
 <span className="text-lg font-bold text-blue-600 ">UPCOMING MATCH</span>
 )}
 {selectedMatch.status === 'completed' && (
 <span className="text-lg font-bold text-green-600 ">MATCH COMPLETED</span>
 )}
 </div>
 <div className="text-sm font-medium text-foreground">{selectedMatch.date}</div>
 </div>
 </div>

 {/* Score Display */}
 <div className="bg-muted/50 rounded-lg p-8">
 <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-8">
 <div className="text-center">
 <h3 className="text-3xl font-bold text-foreground mb-2">{selectedMatch.homeTeam}</h3>
 <span className="text-sm text-muted-foreground">Home</span>
 </div>
 <div className="text-center">
 {selectedMatch.status === 'upcoming' ? (
 <div>
 <div className="text-4xl font-bold text-muted-foreground mb-2">VS</div>
 <div className="text-sm text-muted-foreground">{selectedMatch.time}</div>
 </div>
 ) : (
 <div>
 <div className="text-5xl font-bold text-foreground mb-2">
 {selectedMatch.homeScore} - {selectedMatch.awayScore}
 </div>
 <div className="text-sm text-muted-foreground">{selectedMatch.time}</div>
 </div>
 )}
 </div>
 <div className="text-center">
 <h3 className="text-3xl font-bold text-foreground mb-2">{selectedMatch.awayTeam}</h3>
 <span className="text-sm text-muted-foreground">Away</span>
 </div>
 </div>
 </div>

 {/* Match Information */}
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 <Card>
 <CardHeader>
 <CardTitle className="text-sm flex items-center gap-2">
 <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
 </svg>
 Stadium
 </CardTitle>
 </CardHeader>
 <CardContent>
 <p className="text-foreground font-medium">{selectedMatch.stadium}</p>
 </CardContent>
 </Card>

 <Card>
 <CardHeader>
 <CardTitle className="text-sm flex items-center gap-2">
 <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
 </svg>
 Referee
 </CardTitle>
 </CardHeader>
 <CardContent>
 <p className="text-foreground font-medium">{selectedMatch.referee}</p>
 </CardContent>
 </Card>
 </div>

 {/* Goals & Lineups (only for live/completed matches) */}
 {selectedMatch.status !== 'upcoming' && (
 <>
 {/* Goals */}
 {(selectedMatch.homeGoals?.length > 0 || selectedMatch.awayGoals?.length > 0) && (
 <Card>
 <CardHeader>
 <CardTitle className="flex items-center gap-2">
 <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
 </svg>
 Goals
 </CardTitle>
 </CardHeader>
 <CardContent>
 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
 <div>
 <h4 className="font-semibold text-foreground mb-3">{selectedMatch.homeTeam}</h4>
 <div className="space-y-2">
 {selectedMatch.homeGoals?.map((goal: any, idx: number) => (
 <div key={idx} className="flex items-center gap-2 text-sm">
 <span className="text-accent font-bold">⚽</span>
 <span className="text-foreground">{goal.player}</span>
 <span className="text-muted-foreground">{goal.time}</span>
 </div>
 ))}
 </div>
 </div>
 <div>
 <h4 className="font-semibold text-foreground mb-3">{selectedMatch.awayTeam}</h4>
 <div className="space-y-2">
 {selectedMatch.awayGoals?.map((goal: any, idx: number) => (
 <div key={idx} className="flex items-center gap-2 text-sm">
 <span className="text-accent font-bold">⚽</span>
 <span className="text-foreground">{goal.player}</span>
 <span className="text-muted-foreground">{goal.time}</span>
 </div>
 ))}
 </div>
 </div>
 </div>
 </CardContent>
 </Card>
 )}

 {/* Lineups - Football Field Visualization */}
 {(selectedMatch.homeLineup?.length > 0 || selectedMatch.awayLineup?.length > 0) && (
 <Card className="overflow-hidden">
 <CardHeader>
 <CardTitle className="flex items-center gap-2">
 <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
 </svg>
 Formation & Lineups
 </CardTitle>
 </CardHeader>
 <CardContent className="p-6">
 {/* Football Field */}
 <div className="relative bg-gradient-to-b from-green-600 to-green-700 rounded-lg p-6 md:p-10 min-h-[800px] overflow-hidden">
 {/* Field Lines */}
 <div className="absolute inset-0">
 {/* Horizontal stripes */}
 <div className="absolute inset-0 bg-[repeating-linear-gradient(0deg,transparent,transparent_40px,rgba(255,255,255,0.03)_40px,rgba(255,255,255,0.03)_80px)]"></div>

 {/* Outer boundary */}
 <div className="absolute inset-4 border-2 border-white/40 rounded-sm"></div>

 {/* Center line */}
 <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-white/40 transform -translate-y-1/2"></div>

 {/* Center circle */}
 <div className="absolute left-1/2 top-1/2 w-32 h-32 border-2 border-white/40 rounded-full transform -translate-x-1/2 -translate-y-1/2"></div>
 <div className="absolute left-1/2 top-1/2 w-3 h-3 bg-white/60 rounded-full transform -translate-x-1/2 -translate-y-1/2"></div>

 {/* Penalty boxes */}
 <div className="absolute left-1/2 top-4 w-64 h-24 border-2 border-white/40 border-t-0 transform -translate-x-1/2"></div>
 <div className="absolute left-1/2 bottom-4 w-64 h-24 border-2 border-white/40 border-b-0 transform -translate-x-1/2"></div>

 {/* Goal areas */}
 <div className="absolute left-1/2 top-4 w-32 h-12 border-2 border-white/40 border-t-0 transform -translate-x-1/2"></div>
 <div className="absolute left-1/2 bottom-4 w-32 h-12 border-2 border-white/40 border-b-0 transform -translate-x-1/2"></div>

 {/* Penalty spots */}
 <div className="absolute left-1/2 top-20 w-2 h-2 bg-white/60 rounded-full transform -translate-x-1/2"></div>
 <div className="absolute left-1/2 bottom-20 w-2 h-2 bg-white/60 rounded-full transform -translate-x-1/2"></div>
 </div>

 {/* Away Team (Top) - 4-3-3 Formation */}
 <div className="relative z-10 h-[380px] flex flex-col justify-between py-6">
 {/* Team Label */}
 <div className="text-center -mt-2">
 <div className="inline-block bg-blue-600 text-white px-4 py-2 rounded-lg font-bold text-sm shadow-lg">
 {selectedMatch.awayTeam} (4-3-3)
 </div>
 </div>

 {/* Goalkeeper - 5% from top */}
 <div className="flex justify-center mt-4">
 <div className="flex flex-col items-center">
 <div className="w-12 h-12 bg-blue-600 border-2 border-white rounded-full flex items-center justify-center text-white font-bold text-xs shadow-lg">
 1
 </div>
 <span className="text-white text-xs mt-1 bg-black/50 px-2 py-0.5 rounded max-w-[90px] truncate">
 {selectedMatch.awayLineup?.[0]?.split(' ').slice(-1)[0] || 'Goalkeeper'}
 </span>
 </div>
 </div>

 {/* Defenders - 20% from top */}
 <div className="flex justify-around px-8 md:px-20">
 {[1, 2, 3, 4].map((i) => (
 <div key={i} className="flex flex-col items-center">
 <div className="w-11 h-11 bg-blue-600 border-2 border-white rounded-full flex items-center justify-center text-white font-bold text-xs shadow-lg">
 {i + 1}
 </div>
 <span className="text-white text-xs mt-1 bg-black/50 px-2 py-0.5 rounded max-w-[70px] truncate">
 {selectedMatch.awayLineup?.[i]?.split(' ').slice(-1)[0] || `D${i}`}
 </span>
 </div>
 ))}
 </div>

 {/* Midfielders - 35% from top */}
 <div className="flex justify-around px-16 md:px-32">
 {[5, 6, 7].map((i) => (
 <div key={i} className="flex flex-col items-center">
 <div className="w-11 h-11 bg-blue-600 border-2 border-white rounded-full flex items-center justify-center text-white font-bold text-xs shadow-lg">
 {i + 1}
 </div>
 <span className="text-white text-xs mt-1 bg-black/50 px-2 py-0.5 rounded max-w-[70px] truncate">
 {selectedMatch.awayLineup?.[i]?.split(' ').slice(-1)[0] || `M${i}`}
 </span>
 </div>
 ))}
 </div>

 {/* Forwards - 47% from top */}
 <div className="flex justify-around px-16 md:px-32 mb-2">
 {[8, 9, 10].map((i) => (
 <div key={i} className="flex flex-col items-center">
 <div className="w-11 h-11 bg-blue-600 border-2 border-white rounded-full flex items-center justify-center text-white font-bold text-xs shadow-lg">
 {i + 1}
 </div>
 <span className="text-white text-xs mt-1 bg-black/50 px-2 py-0.5 rounded max-w-[70px] truncate">
 {selectedMatch.awayLineup?.[i]?.split(' ').slice(-1)[0] || `F${i}`}
 </span>
 </div>
 ))}
 </div>
 </div>

 {/* Home Team (Bottom) - 4-4-2 Formation */}
 <div className="relative z-10 h-[380px] flex flex-col-reverse justify-between py-6">
 {/* Team Label */}
 <div className="text-center -mb-2">
 <div className="inline-block bg-red-600 text-white px-4 py-2 rounded-lg font-bold text-sm shadow-lg">
 {selectedMatch.homeTeam} (4-4-2)
 </div>
 </div>

 {/* Goalkeeper - 5% from bottom */}
 <div className="flex justify-center mb-4">
 <div className="flex flex-col-reverse items-center">
 <div className="w-12 h-12 bg-red-600 border-2 border-white rounded-full flex items-center justify-center text-white font-bold text-xs shadow-lg">
 1
 </div>
 <span className="text-white text-xs mb-1 bg-black/50 px-2 py-0.5 rounded max-w-[90px] truncate">
 {selectedMatch.homeLineup?.[0]?.split(' ').slice(-1)[0] || 'Goalkeeper'}
 </span>
 </div>
 </div>

 {/* Defenders - 20% from bottom */}
 <div className="flex justify-around px-8 md:px-20">
 {[1, 2, 3, 4].map((i) => (
 <div key={i} className="flex flex-col-reverse items-center">
 <div className="w-11 h-11 bg-red-600 border-2 border-white rounded-full flex items-center justify-center text-white font-bold text-xs shadow-lg">
 {i + 1}
 </div>
 <span className="text-white text-xs mb-1 bg-black/50 px-2 py-0.5 rounded max-w-[70px] truncate">
 {selectedMatch.homeLineup?.[i]?.split(' ').slice(-1)[0] || `D${i}`}
 </span>
 </div>
 ))}
 </div>

 {/* Midfielders - 35% from bottom */}
 <div className="flex justify-around px-10 md:px-24">
 {[5, 6, 7, 8].map((i) => (
 <div key={i} className="flex flex-col-reverse items-center">
 <div className="w-11 h-11 bg-red-600 border-2 border-white rounded-full flex items-center justify-center text-white font-bold text-xs shadow-lg">
 {i + 1}
 </div>
 <span className="text-white text-xs mb-1 bg-black/50 px-2 py-0.5 rounded max-w-[70px] truncate">
 {selectedMatch.homeLineup?.[i]?.split(' ').slice(-1)[0] || `M${i}`}
 </span>
 </div>
 ))}
 </div>

 {/* Forwards - 47% from bottom */}
 <div className="flex justify-around px-24 md:px-40 mt-2">
 {[9, 10].map((i) => (
 <div key={i} className="flex flex-col-reverse items-center">
 <div className="w-11 h-11 bg-red-600 border-2 border-white rounded-full flex items-center justify-center text-white font-bold text-xs shadow-lg">
 {i + 1}
 </div>
 <span className="text-white text-xs mb-1 bg-black/50 px-2 py-0.5 rounded max-w-[70px] truncate">
 {selectedMatch.homeLineup?.[i]?.split(' ').slice(-1)[0] || `F${i}`}
 </span>
 </div>
 ))}
 </div>
 </div>
 </div>
 </CardContent>
 </Card>
 )}
 </>
 )}

 {/* Upcoming Match Info */}
 {selectedMatch.status === 'upcoming' && (
 <Card className="border-blue-200 ">
 <CardHeader>
 <CardTitle className="text-blue-600 ">Match Preview</CardTitle>
 </CardHeader>
 <CardContent className="space-y-3">
 <p className="text-muted-foreground">
 This match is scheduled to start at <strong>{selectedMatch.time}</strong> at {selectedMatch.stadium}.
 </p>
 <div className="flex gap-3">
 <Button variant="default" size="sm">
 Set Reminder
 </Button>
 <Button variant="outline" size="sm">
 Add to Calendar
 </Button>
 </div>
 </CardContent>
 </Card>
 )}
 </div>

 {/* Modal Footer */}
 <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 flex justify-end gap-3 z-10">
 <Button variant="outline" onClick={() => setShowMatchDetails(false)}>
 Close
 </Button>
 {selectedMatch.status === 'live' && (
 <Button variant="default">
 Watch Live
 </Button>
 )}
 </div>
 </div>
 </div>
 )}

 {/* Footer */}
 <footer className="bg-card/50 backdrop-blur-sm border-t border-border mt-24">
 <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
 {/* Top Footer - Brand & CTA */}
 <div className="py-12 border-b border-border">
 <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
 {/* Brand & Description */}
 <div>
 <div className="flex items-center gap-3 mb-4">
 <img
 src="/logo.png"
 alt="PCL Logo"
 className="h-12 w-12"
 onError={(e) => {
 (e.target as HTMLImageElement).style.display = 'none'
 }}
 />
 <div>
 <h3 className="text-2xl font-bold text-foreground">Professional Club League</h3>
 <p className="text-sm text-muted-foreground">Addicted to football</p>
 </div>
 </div>
 <p className="text-muted-foreground max-w-lg leading-relaxed">
 Join thousands of players, clubs, and sports professionals on India's leading sports management platform. From grassroots to professional leagues.
 </p>
 </div>

 {/* Social Links */}
 <div className="lg:text-right">
 <p className="text-sm font-semibold text-foreground mb-4">Connect With Us</p>
 <div className="flex gap-3 lg:justify-end">
 <a
 href="#"
 className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-background border border-border hover:border-primary hover:bg-primary/10 transition-all duration-200 group"
 title="Twitter"
 aria-label="Follow us on Twitter"
 >
 <svg className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" fill="currentColor" viewBox="0 0 24 24">
 <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
 </svg>
 </a>
 <a
 href="#"
 className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-background border border-border hover:border-primary hover:bg-primary/10 transition-all duration-200 group"
 title="Facebook"
 aria-label="Follow us on Facebook"
 >
 <svg className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" fill="currentColor" viewBox="0 0 24 24">
 <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
 </svg>
 </a>
 <a
 href="#"
 className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-background border border-border hover:border-primary hover:bg-primary/10 transition-all duration-200 group"
 title="LinkedIn"
 aria-label="Follow us on LinkedIn"
 >
 <svg className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" fill="currentColor" viewBox="0 0 24 24">
 <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
 </svg>
 </a>
 <a
 href="#"
 className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-background border border-border hover:border-primary hover:bg-primary/10 transition-all duration-200 group"
 title="Instagram"
 aria-label="Follow us on Instagram"
 >
 <svg className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" fill="currentColor" viewBox="0 0 24 24">
 <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
 </svg>
 </a>
 </div>
 </div>
 </div>
 </div>

 {/* Main Footer Links */}
 <div className="py-12">
 <div className="grid grid-cols-2 md:grid-cols-4 gap-8 lg:gap-12">
 {/* Platform Links */}
 <div>
 <h4 className="text-sm font-bold text-foreground mb-4 tracking-wide">Platform</h4>
 <ul className="space-y-2.5">
 <li>
 <a href="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
 Home
 </a>
 </li>
 <li>
 <a href="/about" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
 About Us
 </a>
 </li>
 <li>
 <a href="/clubs" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
 Clubs
 </a>
 </li>
 <li>
 <a href="/players" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
 Players
 </a>
 </li>
 <li>
 <a href="/tournaments" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
 Tournaments
 </a>
 </li>
 <li>
 <a href="/stadiums" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
 Stadiums
 </a>
 </li>
 </ul>
 </div>

 {/* Resources */}
 <div>
 <h4 className="text-sm font-bold text-foreground mb-4 tracking-wide">Resources</h4>
 <ul className="space-y-2.5">
 <li>
 <a href="/pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
 Pricing
 </a>
 </li>
 <li>
 <a href="/faq" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
 FAQs
 </a>
 </li>
 <li>
 <a href="/guide" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
 Getting Started
 </a>
 </li>
 <li>
 <button
 onClick={() => setIsContactModalOpen(true)}
 className="text-sm text-muted-foreground hover:text-foreground transition-colors text-left"
 >
 Contact Support
 </button>
 </li>
 </ul>
 </div>

 {/* Legal Links */}
 <div>
 <h4 className="text-sm font-bold text-foreground mb-4 tracking-wide">Legal</h4>
 <ul className="space-y-2.5">
 <li>
 <a href="/legal" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
 Legal Hub
 </a>
 </li>
 <li>
 <a href="/legal/privacy-policy" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
 Privacy Policy
 </a>
 </li>
 <li>
 <a href="/legal/terms-and-conditions" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
 Terms & Conditions
 </a>
 </li>
 <li>
 <a href="/legal/code-of-conduct" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
 Code of Conduct
 </a>
 </li>
 </ul>
 </div>

 {/* Company Info */}
 <div>
 <h4 className="text-sm font-bold text-foreground mb-4 tracking-wide">Company</h4>
 <div className="space-y-3 text-sm text-muted-foreground">
 <div>
 <p className="font-semibold text-foreground">FDS COOP LLP</p>
 <p className="text-xs mt-0.5">CIN: AAU-1337</p>
 </div>
 <div>
 <p className="font-semibold text-foreground">StartupIndia</p>
 <p className="text-xs mt-0.5">DIPP69878</p>
 </div>
 <div>
 <p className="font-semibold text-foreground">KSUM</p>
 <p className="text-xs mt-0.5 font-mono">DIPP69878/2020/KSUM1031</p>
 </div>
 </div>
 </div>
 </div>
 </div>

 {/* Bottom Footer */}
 <div className="border-t border-border py-6">
 <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
 <p className="text-center sm:text-left">
 &copy; 2025 Professional Club League by FDS COOP LLP. All rights reserved.
 </p>
 <p className="flex items-center gap-1.5">
 Made with <span className="text-red-500 animate-pulse">❤</span> in India
 </p>
 </div>
 </div>
 </div>
 </footer>

 {/* Contact Support Modal */}
 <ContactModal
 isOpen={isContactModalOpen}
 onClose={() => setIsContactModalOpen(false)}
 defaultSubject="General Inquiry"
 />
 </div>
 )
}
