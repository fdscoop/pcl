'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import StatCard from '@/components/ui/stat-card'
import SkeletonLoader from '@/components/ui/skeleton-loader'
import EmptyState from '@/components/ui/empty-state'
import { 
 User, 
 MapPin, 
 Calendar, 
 Ruler, 
 Weight, 
 Trophy, 
 Target, 
 Users, 
 Shield, 
 Heart, 
 ArrowLeft,
 Star,
 Medal,
 Activity,
 Flag
} from 'lucide-react'
import type { Player } from '@/types/database'

interface PlayerWithUser extends Player {
 first_name?: string
 last_name?: string
 email?: string
 phone?: string
 profile_photo_url?: string
 photo_url?: string
 bio?: string
}

interface PlayerContract {
 id: string
 club_id: string
 club_name: string
 status: string
 contract_start_date: string
 contract_end_date: string
 salary_monthly?: number
 position_assigned?: string
 jersey_number?: number
}

export default function PlayerDetailPage() {
 const params = useParams()
 const router = useRouter()
 const playerId = params.id as string

 const [player, setPlayer] = useState<PlayerWithUser | null>(null)
 const [contracts, setContracts] = useState<PlayerContract[]>([])
 const [loading, setLoading] = useState(true)
 const [error, setError] = useState<string | null>(null)
 const [activeTab, setActiveTab] = useState('overview')

 useEffect(() => {
 if (!playerId) {
 setError('Invalid player ID')
 setLoading(false)
 return
 }

 const fetchPlayerData = async () => {
 try {
 const client = createClient()

 // Fetch player data first
 const { data: playerData, error: playerError } = await client
 .from('players')
 .select('*')
 .eq('id', playerId)
 .single()

 if (playerError) {
 console.error('Error fetching player:', playerError)
 setError('Player not found')
 setLoading(false)
 return
 }

 if (!playerData) {
 setError('Player not found')
 setLoading(false)
 return
 }

 // Fetch user data separately if user_id exists
 let userData = null
 if (playerData.user_id) {
 const { data: uData } = await client
 .from('users')
 .select('first_name, last_name, email, phone, profile_photo_url, bio')
 .eq('id', playerData.user_id)
 .single()
 userData = uData
 }

 const formattedPlayer: PlayerWithUser = {
 ...playerData,
 first_name: userData?.first_name || playerData.first_name,
 last_name: userData?.last_name || playerData.last_name,
 email: userData?.email,
 phone: userData?.phone,
 profile_photo_url: userData?.profile_photo_url || playerData.photo_url,
 bio: userData?.bio,
 }

 setPlayer(formattedPlayer)
 setError(null)

 // Fetch contracts
 const { data: contractsData, error: contractsError } = await client
 .from('contracts')
 .select(`
 id,
 club_id,
 status,
 contract_start_date,
 contract_end_date,
 salary_monthly,
 position_assigned,
 jersey_number,
 clubs (
 club_name
 )
 `)
 .eq('player_id', playerId)
 .order('contract_start_date', { ascending: false })

 if (!contractsError && contractsData) {
 const formattedContracts = contractsData.map((c: any) => ({
 id: c.id,
 club_id: c.club_id,
 club_name: c.clubs?.club_name || 'Unknown Club',
 status: c.status,
 contract_start_date: c.contract_start_date,
 contract_end_date: c.contract_end_date,
 salary_monthly: c.salary_monthly,
 position_assigned: c.position_assigned,
 jersey_number: c.jersey_number,
 }))
 setContracts(formattedContracts)
 } else if (contractsError) {
 console.warn('Error fetching contracts:', contractsError)
 }

 setLoading(false)
 } catch (err) {
 console.error('Error loading player profile:', err)
 setError('An error occurred while loading player data')
 setLoading(false)
 }
 }

 fetchPlayerData()
 }, [playerId, router])

 if (loading) {
 return (
 <div className="min-h-screen bg-background">
 <nav className="bg-card border-b border-border shadow-sm">
 <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
 <div className="flex justify-between items-center h-16">
 <div className="flex items-center gap-3">
 <div className="h-10 w-10 bg-muted rounded-full animate-pulse"></div>
 <div className="h-6 w-32 bg-muted rounded animate-pulse"></div>
 </div>
 <div className="h-9 w-32 bg-muted rounded animate-pulse"></div>
 </div>
 </div>
 </nav>
 <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
 <SkeletonLoader type="profile" />
 </div>
 </div>
 )
 }

 if (error || !player) {
 return (
 <div className="min-h-screen bg-background">
 <nav className="bg-card border-b border-border shadow-sm">
 <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
 <div className="flex justify-between items-center h-16">
 <h1 className="text-lg font-semibold text-foreground">Player Not Found</h1>
 <Button variant="outline" size="sm" asChild>
 <a href="/clubs">
 <ArrowLeft className="h-4 w-4 mr-2" />
 Back to Clubs
 </a>
 </Button>
 </div>
 </div>
 </nav>
 <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
 <EmptyState
 type="error"
 title="Player Not Found"
 description={error || 'The player you are looking for does not exist or has been removed.'}
 action={{
 label: "Go to Clubs",
 onClick: () => window.location.href = "/clubs"
 }}
 />
 </div>
 </div>
 )
 }

 const playerName = `${player.first_name || ''} ${player.last_name || ''}`.trim()
 const playerAge = player.date_of_birth 
 ? Math.floor((new Date().getTime() - new Date(player.date_of_birth).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
 : null

 return (
 <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
 {/* Navigation */}
 <nav className="sticky-nav-mobile-safe bg-card/95 backdrop-blur-sm border-b border-border shadow-sm sticky top-0 z-50">
 <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
 <div className="flex justify-between items-center h-16">
 <div className="flex items-center gap-4">
 {(player.profile_photo_url || player.photo_url) && (
 <img
 src={player.profile_photo_url || player.photo_url || ''}
 alt={playerName}
 className="h-10 w-10 object-cover rounded-full border-2 border-accent/20"
 onError={(e) => {
 (e.target as HTMLImageElement).style.display = 'none'
 }}
 />
 )}
 <div>
 <h1 className="text-lg font-semibold text-foreground">{playerName}</h1>
 <p className="text-sm text-muted-foreground">
 {player.position} {player.nationality && `• ${player.nationality}`}
 </p>
 </div>
 </div>
 <Button variant="outline" size="sm" asChild>
 <a href="/clubs">
 <ArrowLeft className="h-4 w-4 mr-2" />
 Back to Clubs
 </a>
 </Button>
 </div>
 </div>
 </nav>

 <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
 {/* Player Hero Section */}
 <div className="mb-8">
 <Card className="relative overflow-hidden">
 <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-accent/5 to-primary/10"></div>
 <CardContent className="relative p-8">
 <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
 {/* Player Photo */}
 <div className="flex justify-center lg:justify-start">
 <div className="relative">
 {player.profile_photo_url || player.photo_url ? (
 <img
 src={player.profile_photo_url || player.photo_url || ''}
 alt={playerName}
 className="w-48 h-48 object-cover rounded-2xl shadow-2xl border-4 border-white/50"
 />
 ) : (
 <div className="w-48 h-48 bg-muted rounded-2xl shadow-2xl border-4 border-white/50 flex items-center justify-center">
 <User className="h-24 w-24 text-muted-foreground" />
 </div>
 )}
 {player.is_available_for_scout && (
 <div className="absolute -top-2 -right-2">
 <div className="bg-success text-success-foreground px-3 py-1 rounded-full text-xs font-semibold shadow-lg">
 Available for Scout
 </div>
 </div>
 )}
 </div>
 </div>

 {/* Player Info */}
 <div className="lg:col-span-2 space-y-6">
 <div>
 <h1 className="text-4xl font-bold text-foreground mb-2">{playerName}</h1>
 <div className="flex flex-wrap items-center gap-4 text-muted-foreground">
 {player.position && (
 <div className="flex items-center gap-1">
 <Shield className="h-4 w-4" />
 <span>{player.position}</span>
 </div>
 )}
 {playerAge && (
 <div className="flex items-center gap-1">
 <Calendar className="h-4 w-4" />
 <span>{playerAge} years old</span>
 </div>
 )}
 {player.nationality && (
 <div className="flex items-center gap-1">
 <Flag className="h-4 w-4" />
 <span>{player.nationality}</span>
 </div>
 )}
 {player.state && (
 <div className="flex items-center gap-1">
 <MapPin className="h-4 w-4" />
 <span>
 {player.district && `${player.district}, `}{player.state}
 </span>
 </div>
 )}
 </div>
 </div>

 {player.bio && (
 <div>
 <h3 className="font-semibold text-foreground mb-2">About</h3>
 <p className="text-muted-foreground leading-relaxed">{player.bio}</p>
 </div>
 )}

 {/* Key Stats */}
 <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
 <div className="text-center p-4 bg-card/50 rounded-lg border">
 <div className="text-2xl font-bold text-accent">{player.total_matches_played}</div>
 <div className="text-sm text-muted-foreground">Matches</div>
 </div>
 <div className="text-center p-4 bg-card/50 rounded-lg border">
 <div className="text-2xl font-bold text-primary">{player.total_goals_scored}</div>
 <div className="text-sm text-muted-foreground">Goals</div>
 </div>
 <div className="text-center p-4 bg-card/50 rounded-lg border">
 <div className="text-2xl font-bold text-success">{player.total_assists}</div>
 <div className="text-sm text-muted-foreground">Assists</div>
 </div>
 <div className="text-center p-4 bg-card/50 rounded-lg border">
 <div className="text-2xl font-bold text-warning">{(player.player_rating || 0).toFixed(1)}</div>
 <div className="text-sm text-muted-foreground">Rating</div>
 </div>
 </div>
 </div>
 </div>
 </CardContent>
 </Card>
 </div>

 {/* Tabs */}
 <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
 <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-flex">
 <TabsTrigger value="overview">Overview</TabsTrigger>
 <TabsTrigger value="stats">Statistics</TabsTrigger>
 <TabsTrigger value="performance">Performance</TabsTrigger>
 <TabsTrigger value="contracts">Contracts</TabsTrigger>
 </TabsList>

 {/* Overview Tab */}
 <TabsContent value="overview" className="space-y-6 mt-6">
 <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
 {/* Physical Attributes */}
 <Card>
 <CardHeader>
 <CardTitle className="flex items-center gap-2">
 <Activity className="h-5 w-5" />
 Physical Profile
 </CardTitle>
 </CardHeader>
 <CardContent className="space-y-4">
 <div className="grid grid-cols-2 gap-4">
 {player.height_cm && (
 <div className="flex items-center gap-3">
 <Ruler className="h-4 w-4 text-muted-foreground" />
 <div>
 <div className="text-sm text-muted-foreground">Height</div>
 <div className="font-semibold">{player.height_cm} cm</div>
 </div>
 </div>
 )}
 {player.weight_kg && (
 <div className="flex items-center gap-3">
 <Weight className="h-4 w-4 text-muted-foreground" />
 <div>
 <div className="text-sm text-muted-foreground">Weight</div>
 <div className="font-semibold">{player.weight_kg} kg</div>
 </div>
 </div>
 )}
 </div>
 {player.preferred_foot && (
 <div className="flex items-center gap-3 pt-2 border-t border-border">
 <Target className="h-4 w-4 text-muted-foreground" />
 <div>
 <div className="text-sm text-muted-foreground">Preferred Foot</div>
 <div className="font-semibold capitalize">{player.preferred_foot}</div>
 </div>
 </div>
 )}
 </CardContent>
 </Card>

 {/* Contact Information */}
 <Card>
 <CardHeader>
 <CardTitle className="flex items-center gap-2">
 <User className="h-5 w-5" />
 Contact Details
 </CardTitle>
 </CardHeader>
 <CardContent className="space-y-4">
 {player.email && (
 <div>
 <div className="text-sm text-muted-foreground">Email</div>
 <a 
 href={`mailto:${player.email}`} 
 className="text-accent hover:underline font-medium"
 >
 {player.email}
 </a>
 </div>
 )}
 {player.phone && (
 <div>
 <div className="text-sm text-muted-foreground">Phone</div>
 <a 
 href={`tel:${player.phone}`} 
 className="text-accent hover:underline font-medium"
 >
 {player.phone}
 </a>
 </div>
 )}
 </CardContent>
 </Card>

 {/* Achievements */}
 <Card>
 <CardHeader>
 <CardTitle className="flex items-center gap-2">
 <Trophy className="h-5 w-5" />
 Achievements
 </CardTitle>
 </CardHeader>
 <CardContent className="space-y-4">
 <div className="grid grid-cols-2 gap-4">
 <div className="text-center">
 <div className="text-2xl font-bold text-amber-600">{player.trophies_won || 0}</div>
 <div className="text-xs text-muted-foreground">Trophies</div>
 </div>
 <div className="text-center">
 <div className="text-2xl font-bold text-orange-500">{player.man_of_match_awards || 0}</div>
 <div className="text-xs text-muted-foreground">MOTM</div>
 </div>
 <div className="text-center">
 <div className="text-2xl font-bold text-blue-600">{player.international_caps || 0}</div>
 <div className="text-xs text-muted-foreground">Int'l Caps</div>
 </div>
 <div className="text-center">
 <div className="text-2xl font-bold text-yellow-500">{player.yellow_cards || 0}</div>
 <div className="text-xs text-muted-foreground">Yellow Cards</div>
 </div>
 </div>
 </CardContent>
 </Card>
 </div>
 </TabsContent>

 {/* Statistics Tab */}
 <TabsContent value="stats" className="space-y-6 mt-6">
 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
 <StatCard
 title="Total Matches"
 value={player.total_matches_played}
 description="Professional career matches"
 icon={Users}
 />
 <StatCard
 title="Goals Scored"
 value={player.total_goals_scored}
 description={player.total_matches_played > 0 
 ? `${(player.total_goals_scored / player.total_matches_played).toFixed(2)} per match`
 : undefined}
 icon={Target}
 />
 <StatCard
 title="Assists"
 value={player.total_assists}
 description={player.total_matches_played > 0 
 ? `${(player.total_assists / player.total_matches_played).toFixed(2)} per match`
 : undefined}
 icon={Heart}
 />
 <StatCard
 title="Player Rating"
 value={`${(player.player_rating || 0).toFixed(1)}/100`}
 description="Overall performance rating"
 icon={Star}
 />
 </div>
 </TabsContent>

 {/* Performance Tab */}
 <TabsContent value="performance" className="space-y-6 mt-6">
 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
 {/* Awards & Recognition */}
 <Card>
 <CardHeader>
 <CardTitle className="flex items-center gap-2">
 <Medal className="h-5 w-5" />
 Awards & Recognition
 </CardTitle>
 </CardHeader>
 <CardContent className="space-y-4">
 <div className="space-y-3">
 <div className="flex justify-between items-center">
 <span className="text-muted-foreground">🏆 Trophies Won</span>
 <span className="font-bold text-amber-600">{player.trophies_won || 0}</span>
 </div>
 <div className="flex justify-between items-center">
 <span className="text-muted-foreground">⭐ MOTM Awards</span>
 <span className="font-bold text-orange-500">{player.man_of_match_awards || 0}</span>
 </div>
 <div className="flex justify-between items-center">
 <span className="text-muted-foreground">🌍 International Caps</span>
 <span className="font-bold text-blue-600">{player.international_caps || 0}</span>
 </div>
 </div>
 </CardContent>
 </Card>

 {/* Disciplinary Record */}
 <Card>
 <CardHeader>
 <CardTitle className="flex items-center gap-2">
 <Shield className="h-5 w-5" />
 Disciplinary Record
 </CardTitle>
 </CardHeader>
 <CardContent className="space-y-4">
 <div className="space-y-3">
 <div className="flex justify-between items-center">
 <span className="text-muted-foreground">🟨 Yellow Cards</span>
 <span className="font-bold text-yellow-500">{player.yellow_cards || 0}</span>
 </div>
 <div className="flex justify-between items-center">
 <span className="text-muted-foreground">🟥 Red Cards</span>
 <span className="font-bold text-red-500">{player.red_cards || 0}</span>
 </div>
 <div className="flex justify-between items-center">
 <span className="text-muted-foreground">⚕️ Injuries</span>
 <span className="font-bold text-red-500">{player.injuries || 0}</span>
 </div>
 </div>
 </CardContent>
 </Card>

 {/* Performance Metrics */}
 <Card>
 <CardHeader>
 <CardTitle className="flex items-center gap-2">
 <Activity className="h-5 w-5" />
 Performance Metrics
 </CardTitle>
 </CardHeader>
 <CardContent className="space-y-4">
 <div className="space-y-3">
 {player.total_matches_played > 0 && (
 <>
 <div className="flex justify-between items-center">
 <span className="text-muted-foreground">Goals/Match</span>
 <span className="font-bold">{(player.total_goals_scored / player.total_matches_played).toFixed(2)}</span>
 </div>
 <div className="flex justify-between items-center">
 <span className="text-muted-foreground">Assists/Match</span>
 <span className="font-bold">{(player.total_assists / player.total_matches_played).toFixed(2)}</span>
 </div>
 </>
 )}
 <div className="flex justify-between items-center">
 <span className="text-muted-foreground">Overall Rating</span>
 <div className="flex items-center gap-2">
 <div className="w-20 h-2 bg-muted rounded-full overflow-hidden">
 <div 
 className="h-full bg-gradient-to-r from-yellow-400 to-yellow-500 transition-all"
 style={{ width: `${Math.min(player.player_rating || 0, 100)}%` }}
 />
 </div>
 <span className="font-bold text-yellow-500">{(player.player_rating || 0).toFixed(1)}</span>
 </div>
 </div>
 </div>
 </CardContent>
 </Card>
 </div>
 </TabsContent>

 {/* Contracts Tab */}
 <TabsContent value="contracts" className="space-y-6 mt-6">
 {contracts.length > 0 ? (
 <div className="space-y-4">
 {contracts.map((contract) => (
 <Card key={contract.id} className="card-hover">
 <CardHeader>
 <div className="flex justify-between items-start">
 <div>
 <CardTitle className="text-lg">{contract.club_name}</CardTitle>
 <CardDescription>
 {contract.contract_start_date} to {contract.contract_end_date}
 </CardDescription>
 </div>
 <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
 contract.status === 'active' 
 ? 'bg-success/10 text-success' 
 : contract.status === 'expired'
 ? 'bg-muted text-muted-foreground'
 : 'bg-warning/10 text-warning'
 }`}>
 {contract.status.toUpperCase()}
 </div>
 </div>
 </CardHeader>
 <CardContent>
 <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
 {contract.jersey_number && (
 <div>
 <div className="text-sm text-muted-foreground">Jersey Number</div>
 <div className="font-bold text-lg text-accent">#{contract.jersey_number}</div>
 </div>
 )}
 {contract.position_assigned && (
 <div>
 <div className="text-sm text-muted-foreground">Position</div>
 <div className="font-semibold">{contract.position_assigned}</div>
 </div>
 )}
 {contract.salary_monthly && (
 <div>
 <div className="text-sm text-muted-foreground">Monthly Salary</div>
 <div className="font-bold text-success">₹{contract.salary_monthly.toLocaleString()}</div>
 </div>
 )}
 <div>
 <div className="text-sm text-muted-foreground">Duration</div>
 <div className="font-semibold">
 {Math.ceil(
 (new Date(contract.contract_end_date).getTime() - new Date(contract.contract_start_date).getTime()) 
 / (1000 * 60 * 60 * 24 * 30)
 )} months
 </div>
 </div>
 </div>
 </CardContent>
 </Card>
 ))}
 </div>
 ) : (
 <EmptyState
 type="no-results"
 title="No Contract History"
 description="This player has no contract history available in our records."
 />
 )}
 </TabsContent>
 </Tabs>
 </main>
 </div>
 )
}