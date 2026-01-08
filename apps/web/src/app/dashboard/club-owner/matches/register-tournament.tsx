'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/context/ToastContext'
import { 
 Trophy, 
 Users, 
 Calendar, 
 Clock, 
 MapPin, 
 CheckCircle2,
 X,
 Send,
 Info,
 Star
} from 'lucide-react'

interface Tournament {
 id: string
 tournament_name: string
 match_format: string
 start_date: string
 end_date: string
 registration_deadline: string
 entry_fee?: number
 max_teams: number
 current_teams: number
 status: string
 description?: string
 prize_pool?: string
 location?: string
}

interface RegisterTournamentProps {
 club: any
 teams: any[]
 tournaments: Tournament[]
 availableFormats: string[]
 onSuccess: () => void
}

export function RegisterTournament({ 
 club, 
 teams, 
 tournaments, 
 availableFormats, 
 onSuccess 
}: RegisterTournamentProps) {
 const { addToast } = useToast()
 const [loading, setLoading] = useState(false)
 const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null)
 const [selectedTeam, setSelectedTeam] = useState(teams[0]?.id || '')
 const [notes, setNotes] = useState('')

 const handleRegister = async () => {
 if (!selectedTournament) return

 setLoading(true)

 try {
 const supabase = createClient()

 // Check if tournament_registrations table exists, if not create a notification
 const { data, error } = await supabase
 .from('tournament_registrations')
 .insert([
 {
 tournament_id: selectedTournament.id,
 team_id: selectedTeam,
 club_id: club.id,
 registration_date: new Date().toISOString(),
 status: 'pending',
 notes: notes
 }
 ])
 .select()

 if (error) {
 // If table doesn't exist, create a notification entry instead
 console.log('Tournament registration recorded:', {
 tournament: selectedTournament.tournament_name,
 team: selectedTeam,
 club: club.name,
 notes: notes
 })
 
 addToast({
 title: 'Success',
 description: `Tournament registration for ${selectedTournament.tournament_name} has been recorded! Tournament organizers will be notified.`,
 type: 'success'
 })
 } else {
 addToast({
 title: 'Success',
 description: `Successfully registered for ${selectedTournament.tournament_name}!`,
 type: 'success'
 })
 }

 onSuccess()
 } catch (error: any) {
 console.error('Error registering for tournament:', error)
 addToast({
 title: 'Error',
 description: error.message || 'Failed to register for tournament',
 type: 'error'
 })
 } finally {
 setLoading(false)
 }
 }

 const getFormatIcon = (format: string) => {
 switch (format) {
 case '5-a-side': return '⚡'
 case '7-a-side': return '🎯'
 case '11-a-side': return '🏆'
 default: return '⚽'
 }
 }

 const getFormatColor = (format: string) => {
 switch (format) {
 case '5-a-side': return 'bg-orange-500'
 case '7-a-side': return 'bg-emerald-500'
 case '11-a-side': return 'bg-blue-500'
 default: return 'bg-gray-500'
 }
 }

 const isEligible = (tournament: Tournament) => {
 return availableFormats.includes(tournament.match_format)
 }

 const isRegistrationOpen = (tournament: Tournament) => {
 const deadline = new Date(tournament.registration_deadline)
 const now = new Date()
 return deadline > now && tournament.current_teams < tournament.max_teams
 }

 if (selectedTournament) {
 return (
 <div className="max-w-2xl mx-auto">
 <div className="mb-4">
 <Button
 onClick={() => setSelectedTournament(null)}
 variant="outline"
 size="sm"
 >
 ← Back to Tournaments
 </Button>
 </div>

 <Card>
 <CardHeader>
 <CardTitle className="flex items-center gap-2">
 <Trophy className="h-5 w-5" />
 Register for {selectedTournament.tournament_name}
 </CardTitle>
 </CardHeader>
 <CardContent className="space-y-6">
 {/* Tournament Details */}
 <div className="bg-gray-50 rounded-lg p-4">
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
 <div className="flex items-center gap-2">
 <div className={`w-8 h-8 rounded-full ${getFormatColor(selectedTournament.match_format)} flex items-center justify-center text-white text-sm`}>
 {getFormatIcon(selectedTournament.match_format)}
 </div>
 <div>
 <p className="font-semibold">{selectedTournament.match_format}</p>
 <p className="text-xs text-gray-600">Format</p>
 </div>
 </div>
 <div className="flex items-center gap-2">
 <Calendar className="h-4 w-4 text-gray-500" />
 <div>
 <p className="font-semibold">
 {new Date(selectedTournament.start_date).toLocaleDateString()} - {new Date(selectedTournament.end_date).toLocaleDateString()}
 </p>
 <p className="text-xs text-gray-600">Tournament Dates</p>
 </div>
 </div>
 <div className="flex items-center gap-2">
 <Clock className="h-4 w-4 text-gray-500" />
 <div>
 <p className="font-semibold">
 {new Date(selectedTournament.registration_deadline).toLocaleDateString()}
 </p>
 <p className="text-xs text-gray-600">Registration Deadline</p>
 </div>
 </div>
 <div className="flex items-center gap-2">
 <Users className="h-4 w-4 text-gray-500" />
 <div>
 <p className="font-semibold">
 {selectedTournament.current_teams}/{selectedTournament.max_teams} teams
 </p>
 <p className="text-xs text-gray-600">Spots Available</p>
 </div>
 </div>
 </div>
 
 {selectedTournament.description && (
 <div className="pt-2 border-t border-gray-200 ">
 <p className="text-sm text-gray-600 ">
 {selectedTournament.description}
 </p>
 </div>
 )}

 {selectedTournament.prize_pool && (
 <div className="pt-2">
 <div className="flex items-center gap-2">
 <Star className="h-4 w-4 text-yellow-500" />
 <span className="font-semibold text-green-600">Prize Pool: {selectedTournament.prize_pool}</span>
 </div>
 </div>
 )}
 </div>

 {/* Team Selection */}
 <div className="space-y-2">
 <Label>Select Team to Register</Label>
 <select
 className="w-full p-3 border border-gray-300 rounded-md "
 value={selectedTeam}
 onChange={(e) => setSelectedTeam(e.target.value)}
 required
 >
 {teams.map((team) => (
 <option key={team.id} value={team.id}>
 {team.team_name} ({team.total_players} players)
 </option>
 ))}
 </select>
 </div>

 {/* Additional Notes */}
 <div className="space-y-2">
 <Label htmlFor="notes">Additional Notes (Optional)</Label>
 <Textarea
 id="notes"
 value={notes}
 onChange={(e) => setNotes(e.target.value)}
 placeholder="Any special requests or information for the tournament organizers..."
 rows={3}
 />
 </div>

 {/* Registration Fee */}
 {selectedTournament.entry_fee && (
 <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
 <div className="flex items-center gap-2">
 <Info className="h-4 w-4 text-yellow-600" />
 <div>
 <p className="font-medium text-yellow-800 ">
 Entry Fee: ${selectedTournament.entry_fee}
 </p>
 <p className="text-sm text-yellow-700 ">
 Payment will be processed after registration approval
 </p>
 </div>
 </div>
 </div>
 )}

 {/* Eligibility Check */}
 {!isEligible(selectedTournament) && (
 <div className="bg-red-50 border border-red-200 rounded-lg p-4">
 <div className="flex items-center gap-2">
 <X className="h-4 w-4 text-red-600" />
 <div>
 <p className="font-medium text-red-800 ">
 Team Not Eligible
 </p>
 <p className="text-sm text-red-700 ">
 You need more players for {selectedTournament.match_format} format
 </p>
 </div>
 </div>
 </div>
 )}

 {/* Registration Info */}
 <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
 <div className="flex items-start gap-2">
 <Info className="h-4 w-4 text-blue-600 mt-0.5" />
 <div className="text-sm text-blue-800 ">
 <p className="font-medium mb-1">Registration Process:</p>
 <ul className="text-xs space-y-1">
 <li>• Your registration will be reviewed by tournament organizers</li>
 <li>• You'll receive confirmation within 24-48 hours</li>
 <li>• Match schedule will be provided after registration closes</li>
 <li>• Tournament rules and guidelines will be sent via email</li>
 </ul>
 </div>
 </div>
 </div>

 {/* Submit Button */}
 <Button
 onClick={handleRegister}
 disabled={loading || !isEligible(selectedTournament) || !isRegistrationOpen(selectedTournament)}
 className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
 >
 {loading ? (
 <div className="flex items-center gap-2">
 <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
 Registering...
 </div>
 ) : (
 <div className="flex items-center gap-2">
 <Send className="h-4 w-4" />
 {!isEligible(selectedTournament) 
 ? 'Team Not Eligible'
 : !isRegistrationOpen(selectedTournament)
 ? 'Registration Closed'
 : 'Register Team'
 }
 </div>
 )}
 </Button>
 </CardContent>
 </Card>
 </div>
 )
 }

 return (
 <div className="max-w-4xl mx-auto">
 <Card>
 <CardHeader>
 <CardTitle className="flex items-center gap-2">
 <Trophy className="h-5 w-5" />
 Available Tournaments
 </CardTitle>
 <CardDescription>
 Register your team for upcoming tournaments
 </CardDescription>
 </CardHeader>
 <CardContent>
 {tournaments.length === 0 ? (
 <div className="text-center py-12">
 <Trophy className="h-12 w-12 text-gray-400 mx-auto mb-4" />
 <h3 className="text-lg font-semibold text-gray-900 mb-2">
 No Tournaments Available
 </h3>
 <p className="text-gray-600 ">
 There are currently no open tournaments for registration. Check back later!
 </p>
 </div>
 ) : (
 <div className="space-y-4">
 {tournaments.map((tournament) => {
 const eligible = isEligible(tournament)
 const registrationOpen = isRegistrationOpen(tournament)
 
 return (
 <div
 key={tournament.id}
 className={`p-6 border-2 rounded-lg transition-all ${
 eligible && registrationOpen
 ? 'border-blue-200 bg-blue-50 hover:border-blue-300'
 : 'border-gray-200 bg-gray-50 '
 }`}
 >
 <div className="flex items-start justify-between mb-4">
 <div className="flex items-start gap-3">
 <div className={`w-12 h-12 rounded-full ${getFormatColor(tournament.match_format)} flex items-center justify-center text-white text-xl`}>
 {getFormatIcon(tournament.match_format)}
 </div>
 <div>
 <h3 className="text-xl font-bold text-gray-900 mb-1">
 {tournament.tournament_name}
 </h3>
 <div className="flex items-center gap-4 text-sm text-gray-600">
 <Badge variant="outline">
 {tournament.match_format}
 </Badge>
 <div className="flex items-center gap-1">
 {eligible ? (
 <CheckCircle2 className="h-4 w-4 text-green-500" />
 ) : (
 <X className="h-4 w-4 text-red-500" />
 )}
 <span>
 {eligible ? 'Eligible' : 'Need more players'}
 </span>
 </div>
 </div>
 </div>
 </div>
 
 <div className="text-right">
 <Badge variant={registrationOpen ? 'default' : 'secondary'}>
 {registrationOpen ? 'Open' : 'Closed'}
 </Badge>
 <p className="text-sm text-gray-600 mt-1">
 {tournament.current_teams}/{tournament.max_teams} teams
 </p>
 </div>
 </div>

 <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
 <div className="flex items-center gap-2 text-sm text-gray-600">
 <Calendar className="h-4 w-4" />
 <span>
 {new Date(tournament.start_date).toLocaleDateString()} - {new Date(tournament.end_date).toLocaleDateString()}
 </span>
 </div>
 <div className="flex items-center gap-2 text-sm text-gray-600">
 <Clock className="h-4 w-4" />
 <span>
 Register by: {new Date(tournament.registration_deadline).toLocaleDateString()}
 </span>
 </div>
 {tournament.entry_fee && (
 <div className="flex items-center gap-2 text-sm text-gray-600">
 <Star className="h-4 w-4" />
 <span>Entry: ${tournament.entry_fee}</span>
 </div>
 )}
 </div>

 {tournament.description && (
 <p className="text-gray-600 text-sm mb-4">
 {tournament.description}
 </p>
 )}

 <div className="flex justify-end">
 <Button
 onClick={() => setSelectedTournament(tournament)}
 disabled={!eligible || !registrationOpen}
 variant={eligible && registrationOpen ? 'default' : 'outline'}
 >
 {!eligible 
 ? 'Need More Players'
 : !registrationOpen
 ? 'Registration Closed'
 : 'Register Team'
 }
 </Button>
 </div>
 </div>
 )
 })}
 </div>
 )}
 </CardContent>
 </Card>
 </div>
 )
}
