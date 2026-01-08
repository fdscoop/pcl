'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import StatCard from '@/components/ui/stat-card'
import SkeletonLoader from '@/components/ui/skeleton-loader'
import EmptyState from '@/components/ui/empty-state'
import { 
 ArrowLeft,
 MapPin,
 Calendar,
 Globe,
 Mail,
 Phone,
 Users,
 Trophy,
 Target,
 Shield,
 Activity,
 Star,
 Award,
 TrendingUp
} from 'lucide-react'
import type { Club } from '@/types/database'

interface Team {
 id: string
 team_name: string
 total_players: number
 formation?: string
}

interface ClubPlayer {
 id: string
 user_id: string
 first_name: string
 last_name: string
 position: string
 jersey_number?: number
 nationality?: string
 photo_url?: string
 total_matches_played: number
 total_goals_scored: number
 total_assists: number
}

export default function ClubDetailPage() {
 const params = useParams()
 const clubId = params.id as string

 const [club, setClub] = useState<Club | null>(null)
 const [teams, setTeams] = useState<Team[]>([])
 const [players, setPlayers] = useState<ClubPlayer[]>([])
 const [loading, setLoading] = useState(true)
 const [error, setError] = useState<string | null>(null)
 const [activeTab, setActiveTab] = useState('overview')

 useEffect(() => {
 const fetchClubData = async () => {
 try {
 const { createClient: createSupabaseClient } = await import('@/lib/supabase/client')
 const client = createSupabaseClient()

 // Fetch club details
 const { data: clubData, error: clubError } = await client
 .from('clubs')
 .select('*')
 .eq('id', clubId)
 .single()

 if (clubError) {
 console.error('Error fetching club:', clubError)
 setError('Club not found')
 setLoading(false)
 return
 }

 setClub(clubData)

 // Fetch teams
 const { data: teamsData, error: teamsError } = await client
 .from('teams')
 .select('id, team_name, total_players, formation')
 .eq('club_id', clubId)
 .eq('is_active', true)

 if (!teamsError) {
 setTeams(teamsData || [])
 }

 // Fetch players through active contracts
 const { data: contractsData, error: contractsError } = await client
 .from('contracts')
 .select(`
 id,
 player_id,
 club_id,
 position_assigned,
 jersey_number,
 status,
 players (
 id,
 user_id,
 position,
 jersey_number,
 nationality,
 photo_url,
 total_matches_played,
 total_goals_scored,
 total_assists,
 users (
 first_name,
 last_name
 )
 )
 `)
 .eq('club_id', clubId)
 .eq('status', 'active')
 .order('jersey_number', { ascending: true })

 if (!contractsError && contractsData) {
 const formattedPlayers = contractsData.map((c: any) => {
 const player = c.players
 return {
 id: player.id,
 user_id: player.user_id,
 first_name: player.users?.first_name || '',
 last_name: player.users?.last_name || '',
 position: c.position_assigned || player.position,
 jersey_number: c.jersey_number || player.jersey_number,
 nationality: player.nationality,
 photo_url: player.photo_url,
 total_matches_played: player.total_matches_played,
 total_goals_scored: player.total_goals_scored,
 total_assists: player.total_assists,
 }
 })
 setPlayers(formattedPlayers)
 }

 setLoading(false)
 } catch (err) {
 console.error('Error:', err)
 setError('An error occurred while loading club data')
 setLoading(false)
 }
 }

 fetchClubData()
 }, [clubId])

 if (loading) {
 return (
 <div className="min-h-screen bg-background">
 <nav className="bg-card border-b border-border shadow-sm">
 <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
 <div className="flex justify-between items-center h-16">
 <div className="flex items-center gap-3">
 <div className="h-10 w-10 bg-muted rounded-lg animate-pulse"></div>
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

 if (error || !club) {
 return (
 <div className="min-h-screen bg-background">
 <nav className="bg-card border-b border-border shadow-sm">
 <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
 <div className="flex justify-between items-center h-16">
 <h1 className="text-lg font-semibold text-foreground">Club Not Found</h1>
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
 title="Club Not Found"
 description={error || 'The club you are looking for does not exist or has been removed.'}
 action={{
 label: "Go to Clubs",
 onClick: () => window.location.href = "/clubs"
 }}
 />
 </div>
 </div>
 )
 }

 return (
 <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
 {/* Navigation */}
 <nav className="bg-card/95 backdrop-blur-sm border-b border-border shadow-sm sticky top-0 z-50">
 <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
 <div className="flex justify-between items-center h-16">
 <div className="flex items-center gap-4">
 {club.logo_url ? (
 <img
 src={club.logo_url}
 alt={club.club_name}
 className="h-10 w-10 object-cover rounded-lg border-2 border-accent/20"
 onError={(e) => {
 (e.target as HTMLImageElement).style.display = 'none'
 }}
 />
 ) : (
 <div className="h-10 w-10 bg-muted rounded-lg flex items-center justify-center">
 <Trophy className="h-5 w-5 text-muted-foreground" />
 </div>
 )}
 <div>
 <h1 className="text-lg font-semibold text-foreground">{club.club_name}</h1>
 <p className="text-sm text-muted-foreground">
 {club.city && club.state && (
 <span className="flex items-center gap-1">
 <MapPin className="h-3 w-3" />
 {club.city}, {club.state}
 </span>
 )}
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
 {/* Club Hero Section */}
 <div className="mb-12">
 <Card className="relative overflow-hidden shadow-xl hover:shadow-2xl transition-shadow border-t-2 border-t-primary/30">
 {/* Banner */}
 <div 
 className="relative h-48 sm:h-64 bg-cover bg-center bg-gradient-to-r from-primary/20 to-accent/20"
 style={club.banner_url ? { 
 backgroundImage: `url(${club.banner_url})`,
 backgroundSize: 'cover',
 backgroundPosition: 'center'
 } : {}}
 >
 <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-black/10"></div>
 <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
 <h1 className="text-3xl sm:text-4xl font-bold mb-2">{club.club_name}</h1>
 <div className="flex flex-wrap items-center gap-4 text-white/90">
 {club.city && club.state && (
 <div className="flex items-center gap-1">
 <MapPin className="h-4 w-4" />
 <span>{club.city}, {club.state}</span>
 </div>
 )}
 {club.founded_year && (
 <div className="flex items-center gap-1">
 <Calendar className="h-4 w-4" />
 <span>Founded {club.founded_year}</span>
 </div>
 )}
 {club.club_type && (
 <div className="px-3 py-1 bg-white/20 rounded-full text-sm">
 {club.club_type.replace('_', ' ').toUpperCase()}
 </div>
 )}
 {club.kyc_verified && (
 <div className="flex items-center gap-1 px-3 py-1 bg-blue-500/30 rounded-full text-sm">
 <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
 <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
 </svg>
 Verified
 </div>
 )}
 </div>
 </div>
 </div>

 <CardContent className="p-8">
 <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
 {/* Club Logo */}
 <div className="flex justify-center lg:justify-start">
 <div className="relative -mt-16">
 {club.logo_url ? (
 <img
 src={club.logo_url}
 alt={club.club_name}
 className="w-32 h-32 object-cover rounded-2xl shadow-2xl border-4 border-white bg-white"
 />
 ) : (
 <div className="w-32 h-32 bg-muted rounded-2xl shadow-2xl border-4 border-white flex items-center justify-center">
 <Trophy className="h-16 w-16 text-muted-foreground" />
 </div>
 )}
 </div>
 </div>

 {/* Club Information */}
 <div className="lg:col-span-2 space-y-6">
 {club.description && (
 <div>
 <h3 className="font-semibold text-foreground mb-2">About the Club</h3>
 <p className="text-muted-foreground leading-relaxed">{club.description}</p>
 </div>
 )}

 {/* Contact & Links */}
 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
 <div>
 <h4 className="font-semibold text-foreground mb-3">Contact Information</h4>
 <div className="space-y-2">
 {club.email && (
 <div className="flex items-center gap-2">
 <Mail className="h-4 w-4 text-muted-foreground" />
 <a 
 href={`mailto:${club.email}`} 
 className="text-accent hover:underline"
 >
 {club.email}
 </a>
 </div>
 )}
 {club.phone && (
 <div className="flex items-center gap-2">
 <Phone className="h-4 w-4 text-muted-foreground" />
 <a 
 href={`tel:${club.phone}`} 
 className="text-accent hover:underline"
 >
 {club.phone}
 </a>
 </div>
 )}
 {club.website && (
 <div className="flex items-center gap-2">
 <Globe className="h-4 w-4 text-muted-foreground" />
 <a 
 href={club.website} 
 target="_blank" 
 rel="noopener noreferrer"
 className="text-accent hover:underline"
 >
 Official Website
 </a>
 </div>
 )}
 </div>
 </div>

 <div>
 <h4 className="font-semibold text-foreground mb-3">Club Details</h4>
 <div className="space-y-2 text-sm">
 {club.category && (
 <div className="flex justify-between">
 <span className="text-muted-foreground">Category:</span>
 <span className="font-medium capitalize">{club.category}</span>
 </div>
 )}
 <div className="flex justify-between">
 <span className="text-muted-foreground">Active Players:</span>
 <span className="font-medium">{players.length}</span>
 </div>
 <div className="flex justify-between">
 <span className="text-muted-foreground">Teams:</span>
 <span className="font-medium">{teams.length}</span>
 </div>
 </div>
 </div>
 </div>
 </div>
 </div>
 </CardContent>
 </Card>
 </div>

 {/* Quick Stats */}
 <div className="mb-8">
 <h2 className="text-2xl font-bold text-foreground mb-6">Performance Overview</h2>
 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
 <StatCard
 title="Total Players"
 value={players.length}
 description="Active squad members"
 icon={Users}
 />
 <StatCard
 title="Total Matches"
 value={club.total_matches || 0}
 description="Games played"
 icon={Activity}
 />
 <StatCard
 title="Trophies Won"
 value={club.trophies_won || 0}
 description="Championships earned"
 icon={Trophy}
 />
 <StatCard
 title="Club Rating"
 value={`${(club.club_rating || 0).toFixed(1)}/100`}
 description="Overall performance"
 icon={Star}
 />
 </div>
 </div>

 {/* Tabs */}
 <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
 <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-flex">
 <TabsTrigger value="overview">Overview</TabsTrigger>
 <TabsTrigger value="players">Players</TabsTrigger>
 <TabsTrigger value="teams">Teams</TabsTrigger>
 <TabsTrigger value="stats">Statistics</TabsTrigger>
 </TabsList>

 {/* Overview Tab */}
 <TabsContent value="overview" className="space-y-6 mt-6">
 <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
 {/* Match Statistics */}
 <Card>
 <CardHeader>
 <CardTitle className="flex items-center gap-2">
 <TrendingUp className="h-5 w-5" />
 Match Statistics
 </CardTitle>
 </CardHeader>
 <CardContent className="space-y-4">
 <div className="grid grid-cols-3 gap-4 text-center">
 <div>
 <div className="text-2xl font-bold text-success">{club.total_wins || 0}</div>
 <div className="text-sm text-muted-foreground">Wins</div>
 </div>
 <div>
 <div className="text-2xl font-bold text-muted-foreground">{club.total_draws || 0}</div>
 <div className="text-sm text-muted-foreground">Draws</div>
 </div>
 <div>
 <div className="text-2xl font-bold text-destructive">{club.total_losses || 0}</div>
 <div className="text-sm text-muted-foreground">Losses</div>
 </div>
 </div>
 {club.total_matches && club.total_matches > 0 && (
 <div className="pt-4 border-t border-border">
 <div className="text-center">
 <div className="text-lg font-semibold">
 {((club.total_wins || 0) / club.total_matches * 100).toFixed(1)}%
 </div>
 <div className="text-sm text-muted-foreground">Win Rate</div>
 </div>
 </div>
 )}
 </CardContent>
 </Card>

 {/* Goal Statistics */}
 <Card>
 <CardHeader>
 <CardTitle className="flex items-center gap-2">
 <Target className="h-5 w-5" />
 Goal Statistics
 </CardTitle>
 </CardHeader>
 <CardContent className="space-y-4">
 <div className="grid grid-cols-2 gap-4">
 <div className="text-center">
 <div className="text-2xl font-bold text-primary">{club.total_goals_scored || 0}</div>
 <div className="text-sm text-muted-foreground">Goals Scored</div>
 </div>
 <div className="text-center">
 <div className="text-2xl font-bold text-orange-500">{club.total_goals_conceded || 0}</div>
 <div className="text-sm text-muted-foreground">Goals Conceded</div>
 </div>
 </div>
 <div className="pt-4 border-t border-border text-center">
 <div className="text-lg font-semibold text-accent">
 {((club.total_goals_scored || 0) - (club.total_goals_conceded || 0)) > 0 ? '+' : ''}
 {(club.total_goals_scored || 0) - (club.total_goals_conceded || 0)}
 </div>
 <div className="text-sm text-muted-foreground">Goal Difference</div>
 </div>
 </CardContent>
 </Card>
 </div>
 </TabsContent>

 {/* Players Tab */}
 <TabsContent value="players" className="space-y-6 mt-6">
 {players.length > 0 ? (
 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
 {players.map((player) => {
 const playerName = `${player.first_name} ${player.last_name}`.trim()
 return (
 <Card key={player.id} className="card-hover">
 <CardContent className="p-6">
 <div className="flex items-center gap-4">
 {player.photo_url ? (
 <img
 src={player.photo_url}
 alt={playerName}
 className="w-12 h-12 object-cover rounded-full"
 />
 ) : (
 <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center">
 <span className="font-semibold text-muted-foreground">
 {player.first_name?.charAt(0) || 'P'}
 </span>
 </div>
 )}
 <div className="flex-1 min-w-0">
 <div className="flex items-center gap-2">
 <h3 className="font-semibold text-foreground truncate">{playerName}</h3>
 {player.jersey_number && (
 <span className="text-sm font-bold text-accent">#{player.jersey_number}</span>
 )}
 </div>
 <p className="text-sm text-muted-foreground">{player.position}</p>
 <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
 <span>{player.total_matches_played} matches</span>
 <span>{player.total_goals_scored} goals</span>
 <span>{player.total_assists} assists</span>
 </div>
 </div>
 </div>
 </CardContent>
 </Card>
 )
 })}
 </div>
 ) : (
 <EmptyState
 type="no-results"
 title="No Players Found"
 description="This club currently has no active players in our records."
 />
 )}
 </TabsContent>

 {/* Teams Tab */}
 <TabsContent value="teams" className="space-y-6 mt-6">
 {teams.length > 0 ? (
 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
 {teams.map((team) => (
 <Card key={team.id} className="card-hover">
 <CardHeader>
 <CardTitle className="text-lg">{team.team_name}</CardTitle>
 </CardHeader>
 <CardContent className="space-y-4">
 <div className="flex justify-between items-center">
 <span className="text-muted-foreground">Players:</span>
 <span className="font-semibold">{team.total_players}</span>
 </div>
 {team.formation && (
 <div className="flex justify-between items-center">
 <span className="text-muted-foreground">Formation:</span>
 <span className="font-semibold">{team.formation}</span>
 </div>
 )}
 </CardContent>
 </Card>
 ))}
 </div>
 ) : (
 <EmptyState
 type="no-results"
 title="No Teams Found"
 description="This club currently has no active teams configured."
 />
 )}
 </TabsContent>

 {/* Statistics Tab */}
 <TabsContent value="stats" className="space-y-6 mt-6">
 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
 <StatCard
 title="Win Percentage"
 value={`${club.total_matches && club.total_matches > 0 
 ? ((club.total_wins || 0) / club.total_matches * 100).toFixed(1) 
 : '0.0'}%`}
 description="Match success rate"
 icon={Award}
 />
 <StatCard
 title="Goals Per Match"
 value={club.total_matches && club.total_matches > 0 
 ? ((club.total_goals_scored || 0) / club.total_matches).toFixed(1)
 : '0.0'}
 description="Average scoring rate"
 icon={Target}
 />
 <StatCard
 title="Clean Sheets"
 value={club.clean_sheets || 0}
 description="Matches without conceding"
 icon={Shield}
 />
 <StatCard
 title="Stadium Capacity"
 value={club.stadium_capacity || 'N/A'}
 description="Maximum attendance"
 icon={Users}
 />
 </div>
 </TabsContent>
 </Tabs>
 </main>
 </div>
 )
}