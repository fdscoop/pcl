'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'

export default function TournamentsPage() {
 // Demo tournaments data - replace with real data when available
 const tournaments = [
 {
 id: 1,
 name: 'PCL Summer Championship 2025',
 type: '11-a-side',
 format: 'League',
 status: 'ongoing',
 participants: 16,
 startDate: '2025-01-15',
 endDate: '2025-03-30',
 prizePool: '₹5,00,000',
 location: 'Multiple Cities',
 description: 'The premier championship featuring the best clubs from across the country.'
 },
 {
 id: 2,
 name: 'Youth Development Cup',
 type: '7-a-side',
 format: 'Knockout',
 status: 'upcoming',
 participants: 32,
 startDate: '2025-02-01',
 endDate: '2025-02-28',
 prizePool: '₹2,00,000',
 location: 'Mumbai, Maharashtra',
 description: 'Showcasing the next generation of football talent in fast-paced 7-a-side action.'
 },
 {
 id: 3,
 name: 'Corporate League',
 type: '5-a-side',
 format: 'League',
 status: 'ongoing',
 participants: 24,
 startDate: '2025-01-10',
 endDate: '2025-04-15',
 prizePool: '₹1,50,000',
 location: 'Bangalore, Karnataka',
 description: 'Inter-company tournament promoting corporate wellness and team building.'
 },
 {
 id: 4,
 name: 'Regional Championship - North',
 type: '11-a-side',
 format: 'League + Playoffs',
 status: 'registration',
 participants: 20,
 startDate: '2025-03-01',
 endDate: '2025-05-31',
 prizePool: '₹3,00,000',
 location: 'Delhi, Punjab, Haryana',
 description: 'Northern regional championship determining representatives for national tournament.'
 },
 {
 id: 5,
 name: 'Veterans Tournament',
 type: '7-a-side',
 format: 'Round Robin',
 status: 'completed',
 participants: 12,
 startDate: '2024-12-01',
 endDate: '2024-12-15',
 prizePool: '₹75,000',
 location: 'Chennai, Tamil Nadu',
 description: 'Celebrating football legends with an exciting veterans tournament.'
 },
 {
 id: 6,
 name: 'Women\'s Premier League',
 type: '11-a-side',
 format: 'League',
 status: 'upcoming',
 participants: 14,
 startDate: '2025-02-15',
 endDate: '2025-05-15',
 prizePool: '₹4,00,000',
 location: 'Pan India',
 description: 'Empowering women in football through competitive league format.'
 }
 ]

 const getStatusColor = (status: string) => {
 switch (status) {
 case 'ongoing':
 return 'bg-green-100 text-green-800 border-green-200'
 case 'upcoming':
 return 'bg-blue-100 text-blue-800 border-blue-200'
 case 'registration':
 return 'bg-orange-100 text-orange-800 border-orange-200'
 case 'completed':
 return 'bg-gray-100 text-gray-800 border-gray-200'
 default:
 return 'bg-gray-100 text-gray-800 border-gray-200'
 }
 }

 const getStatusText = (status: string) => {
 switch (status) {
 case 'ongoing':
 return 'Live'
 case 'upcoming':
 return 'Upcoming'
 case 'registration':
 return 'Registration Open'
 case 'completed':
 return 'Completed'
 default:
 return status
 }
 }

 const getTypeColor = (type: string) => {
 switch (type) {
 case '11-a-side':
 return 'bg-purple-100 text-purple-800'
 case '7-a-side':
 return 'bg-blue-100 text-blue-800'
 case '5-a-side':
 return 'bg-green-100 text-green-800'
 default:
 return 'bg-gray-100 text-gray-800'
 }
 }

 return (
 <div className="min-h-screen bg-background">
 {/* Header */}
 <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white">
 <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
 <h1 className="text-4xl font-bold mb-4">Tournaments</h1>
 <p className="text-xl opacity-90">
 Compete in exciting tournaments across different formats and skill levels
 </p>
 </div>
 </div>

 <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
 {/* Quick Stats */}
 <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
 <Card>
 <CardContent className="text-center p-6">
 <div className="text-2xl font-bold text-green-600 mb-2">2</div>
 <div className="text-sm font-medium text-green-700">Live Tournaments</div>
 </CardContent>
 </Card>
 <Card>
 <CardContent className="text-center p-6">
 <div className="text-2xl font-bold text-blue-600 mb-2">2</div>
 <div className="text-sm font-medium text-blue-700">Upcoming</div>
 </CardContent>
 </Card>
 <Card>
 <CardContent className="text-center p-6">
 <div className="text-2xl font-bold text-orange-600 mb-2">1</div>
 <div className="text-sm font-medium text-orange-700">Registration Open</div>
 </CardContent>
 </Card>
 <Card>
 <CardContent className="text-center p-6">
 <div className="text-2xl font-bold text-purple-600 mb-2">₹15.25L</div>
 <div className="text-sm font-medium text-purple-700">Total Prize Pool</div>
 </CardContent>
 </Card>
 </div>

 {/* Action Buttons */}
 <div className="flex flex-wrap gap-4 justify-center mb-8">
 <Button size="lg" className="bg-gradient-to-r from-purple-600 to-blue-600">
 Register New Tournament
 </Button>
 <Button variant="outline" size="lg">
 View Tournament Rules
 </Button>
 <Link href="/">
 <Button variant="outline" size="lg">← Back to Home</Button>
 </Link>
 </div>

 {/* Tournaments Grid */}
 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
 {tournaments.map((tournament) => (
 <Card key={tournament.id} className="group hover:shadow-lg transition-all duration-300 hover:scale-105">
 <CardHeader>
 <div className="flex justify-between items-start mb-2">
 <Badge className={getStatusColor(tournament.status)}>
 {getStatusText(tournament.status)}
 </Badge>
 <Badge variant="secondary" className={getTypeColor(tournament.type)}>
 {tournament.type}
 </Badge>
 </div>
 <CardTitle className="text-lg leading-tight">
 {tournament.name}
 </CardTitle>
 <CardDescription className="flex items-center gap-1">
 📍 {tournament.location}
 </CardDescription>
 </CardHeader>
 <CardContent className="space-y-4">
 {/* Tournament Details */}
 <div className="space-y-2 text-sm">
 <div className="flex justify-between">
 <span className="font-medium">Format:</span>
 <span className="text-muted-foreground">{tournament.format}</span>
 </div>
 <div className="flex justify-between">
 <span className="font-medium">Participants:</span>
 <span className="text-muted-foreground">{tournament.participants} teams</span>
 </div>
 <div className="flex justify-between">
 <span className="font-medium">Prize Pool:</span>
 <span className="text-muted-foreground font-semibold">{tournament.prizePool}</span>
 </div>
 <div className="flex justify-between">
 <span className="font-medium">Duration:</span>
 <span className="text-muted-foreground">
 {new Date(tournament.startDate).toLocaleDateString()} - {new Date(tournament.endDate).toLocaleDateString()}
 </span>
 </div>
 </div>

 {/* Description */}
 <p className="text-sm text-muted-foreground">
 {tournament.description}
 </p>

 {/* Action Button */}
 <div className="pt-2">
 {tournament.status === 'registration' && (
 <Button className="w-full bg-gradient-to-r from-green-600 to-blue-600">
 Register Now
 </Button>
 )}
 {tournament.status === 'ongoing' && (
 <Button className="w-full bg-gradient-to-r from-purple-600 to-pink-600">
 View Live Scores
 </Button>
 )}
 {tournament.status === 'upcoming' && (
 <Button variant="outline" className="w-full">
 View Details
 </Button>
 )}
 {tournament.status === 'completed' && (
 <Button variant="outline" className="w-full">
 View Results
 </Button>
 )}
 </div>
 </CardContent>
 </Card>
 ))}
 </div>

 {/* Tournament Information Section */}
 <div className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-8">
 <Card>
 <CardHeader>
 <CardTitle className="flex items-center gap-2">
 🏆 Tournament Formats
 </CardTitle>
 </CardHeader>
 <CardContent className="space-y-4">
 <div>
 <h4 className="font-semibold text-foreground">11-a-side</h4>
 <p className="text-sm text-muted-foreground">
 Traditional full-field football with complete team rosters and professional rules.
 </p>
 </div>
 <div>
 <h4 className="font-semibold text-foreground">7-a-side</h4>
 <p className="text-sm text-muted-foreground">
 Fast-paced football on smaller pitches, perfect for skill development and quick matches.
 </p>
 </div>
 <div>
 <h4 className="font-semibold text-foreground">5-a-side</h4>
 <p className="text-sm text-muted-foreground">
 Indoor/outdoor futsal-style games emphasizing technical skills and quick thinking.
 </p>
 </div>
 </CardContent>
 </Card>

 <Card>
 <CardHeader>
 <CardTitle className="flex items-center gap-2">
 📋 How to Participate
 </CardTitle>
 </CardHeader>
 <CardContent className="space-y-4">
 <div className="space-y-3 text-sm">
 <div className="flex items-start gap-3">
 <span className="bg-purple-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">1</span>
 <span>Register your club on the PCL platform</span>
 </div>
 <div className="flex items-start gap-3">
 <span className="bg-purple-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">2</span>
 <span>Complete team verification and player registration</span>
 </div>
 <div className="flex items-start gap-3">
 <span className="bg-purple-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">3</span>
 <span>Choose your tournament and submit registration</span>
 </div>
 <div className="flex items-start gap-3">
 <span className="bg-purple-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">4</span>
 <span>Pay registration fees and await confirmation</span>
 </div>
 <div className="flex items-start gap-3">
 <span className="bg-purple-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">5</span>
 <span>Receive schedule and compete!</span>
 </div>
 </div>
 </CardContent>
 </Card>
 </div>
 </div>
 </div>
 )
}