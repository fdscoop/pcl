'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/context/ToastContext'
import { 
 Users, 
 Calendar, 
 Clock, 
 MapPin, 
 Target,
 Send,
 Info,
 Search,
 DollarSign,
 Calculator,
 CheckCircle2,
 Building,
 UserCheck,
 Trophy
} from 'lucide-react'

interface Club {
 id: string
 name: string
 city: string
 state: string
 district: string
 kyc_verified: boolean
 logo_url?: string
}

interface Stadium {
 id: string
 stadium_name: string
 location: string
 district: string
 hourly_rate: number
 facilities: string[]
 is_available: boolean
}

interface Referee {
 id: string
 unique_referee_id: string
 certification_level: string
 hourly_rate: number
 is_available: boolean
 users: {
 first_name: string
 last_name: string
 }
}

interface Staff {
 id: string
 unique_staff_id: string
 role: string
 hourly_rate: number
 is_available: boolean
 users: {
 first_name: string
 last_name: string
 }
}

interface CreateFriendlyMatchProps {
 club: any
 teams: any[]
 availableFormats: string[]
 onSuccess: () => void
}

export function CreateFriendlyMatch({ 
 club, 
 teams, 
 availableFormats, 
 onSuccess 
}: CreateFriendlyMatchProps) {
 const { addToast } = useToast()
 const [loading, setLoading] = useState(false)
 const [loadingData, setLoadingData] = useState(true)
 
 // Available data
 const [availableClubs, setAvailableClubs] = useState<Club[]>([])
 const [availableStadiums, setAvailableStadiums] = useState<Stadium[]>([])
 const [availableReferees, setAvailableReferees] = useState<Referee[]>([])
 const [availableStaff, setAvailableStaff] = useState<Staff[]>([])
 const [filteredClubs, setFilteredClubs] = useState<Club[]>([])
 const [filteredStadiums, setFilteredStadiums] = useState<Stadium[]>([])
 
 // Search states
 const [clubSearchTerm, setClubSearchTerm] = useState('')
 const [showClubDropdown, setShowClubDropdown] = useState(false)
 
 // Form data with enhanced fields
 const [formData, setFormData] = useState({
 matchFormat: availableFormats[0] || '5-a-side',
 teamId: teams[0]?.id || '',
 selectedClub: null as Club | null,
 preferredDate: '',
 preferredTime: '',
 duration: 1, // hours
 stadiumId: '',
 selectedStadium: null as Stadium | null,
 matchType: 'hobby', // 'hobby' or 'official'
 refereeIds: [] as string[],
 staffIds: [] as string[],
 prizeMoney: 0,
 hasPrizeMoney: false,
 notes: '',
 teamSize: 8, // default for 5-a-side
 opponentClub: '',
 opponentEmail: '',
 opponentPhone: '',
 venue: 'home' // 'home', 'away', or 'neutral'
 })

 // Budget calculation
 const [budget, setBudget] = useState({
 stadiumCost: 0,
 refereeCost: 0,
 staffCost: 0,
 processingFee: 0,
 totalCost: 0,
 costPerPlayer: 0
 })

 useEffect(() => {
 loadInitialData()
 }, [])

 useEffect(() => {
 // Update team size based on format
 const teamSizes: { [key: string]: number } = {
 '5-a-side': 8,
 '7-a-side': 11,
 '11-a-side': 14
 }
 setFormData(prev => ({ ...prev, teamSize: teamSizes[prev.matchFormat] || 8 }))
 }, [formData.matchFormat])

 useEffect(() => {
 calculateBudget()
 }, [formData.stadiumId, formData.refereeIds, formData.staffIds, formData.duration, formData.teamSize])

 useEffect(() => {
 // Filter clubs based on search term
 const filtered = availableClubs.filter(club =>
 club.name.toLowerCase().includes(clubSearchTerm.toLowerCase()) ||
 club.city.toLowerCase().includes(clubSearchTerm.toLowerCase()) ||
 club.district.toLowerCase().includes(clubSearchTerm.toLowerCase())
 )
 setFilteredClubs(filtered)
 }, [clubSearchTerm, availableClubs])

 useEffect(() => {
 // Filter stadiums based on club's district if opponent is selected
 if (formData.selectedClub) {
 const filtered = availableStadiums.filter(stadium =>
 stadium.district === club.district || stadium.district === formData.selectedClub?.district
 )
 setFilteredStadiums(filtered)
 } else {
 setFilteredStadiums(availableStadiums)
 }
 }, [formData.selectedClub, availableStadiums, club.district])

 const loadInitialData = async () => {
 try {
 setLoadingData(true)
 const supabase = createClient()

 // Load verified clubs (excluding own club)
 const { data: clubsData } = await supabase
 .from('clubs')
 .select('id, name, city, state, district, kyc_verified, logo_url')
 .eq('kyc_verified', true)
 .neq('id', club.id)

 setAvailableClubs(clubsData || [])

 // Load stadiums
 const { data: stadiumsData } = await supabase
 .from('stadiums')
 .select('id, stadium_name, location, district, hourly_rate, facilities, is_available')
 .eq('is_available', true)

 setAvailableStadiums(stadiumsData || [])

 // Load referees
 const { data: refereesData } = await supabase
 .from('referees')
 .select(`
 id, unique_referee_id, certification_level, hourly_rate, is_available,
 users!inner(first_name, last_name)
 `)
 .eq('is_available', true)

 const formattedReferees = refereesData?.map(ref => ({
 ...ref,
 users: Array.isArray(ref.users) ? ref.users[0] : ref.users
 })) || []

 setAvailableReferees(formattedReferees as Referee[])

 // Load staff
 const { data: staffData } = await supabase
 .from('staff')
 .select(`
 id, unique_staff_id, role, hourly_rate, is_available,
 users!inner(first_name, last_name)
 `)
 .eq('is_available', true)

 const formattedStaff = staffData?.map(staff => ({
 ...staff,
 users: Array.isArray(staff.users) ? staff.users[0] : staff.users
 })) || []

 setAvailableStaff(formattedStaff as Staff[])
 } catch (error) {
 console.error('Error loading data:', error)
 addToast({
 title: 'Error',
 description: 'Failed to load required data',
 type: 'error'
 })
 } finally {
 setLoadingData(false)
 }
 }

 const calculateBudget = () => {
 let stadiumCost = 0
 let refereeCost = 0
 let staffCost = 0

 // Stadium cost
 if (formData.selectedStadium) {
 stadiumCost = formData.selectedStadium.hourly_rate * formData.duration
 }

 // Referee cost
 formData.refereeIds.forEach(refereeId => {
 const referee = availableReferees.find(r => r.id === refereeId)
 if (referee) {
 refereeCost += referee.hourly_rate * formData.duration
 }
 })

 // Staff cost
 formData.staffIds.forEach(staffId => {
 const staff = availableStaff.find(s => s.id === staffId)
 if (staff) {
 staffCost += staff.hourly_rate * formData.duration
 }
 })

 const subtotal = stadiumCost + refereeCost + staffCost
 const processingFee = subtotal * 0.095 // 9.5% platform charges
 const totalCost = subtotal + processingFee
 const costPerPlayer = totalCost / formData.teamSize

 setBudget({
 stadiumCost,
 refereeCost,
 staffCost,
 processingFee,
 totalCost,
 costPerPlayer
 })
 }

 const handleSubmit = async (e: React.FormEvent) => {
 e.preventDefault()
 setLoading(true)

 try {
 const supabase = createClient()

 // For now, we'll create a notification/message to the opponent club
 const { data: userData } = await supabase.auth.getUser()
 if (!userData.user) throw new Error('User not authenticated')

 // Create a notification entry that can be used to track the request
 const requestData = {
 type: 'friendly_match_request',
 title: `Friendly Match Request from ${club.name}`,
 message: `${club.name} has requested a ${formData.matchType} friendly match: ${formData.matchFormat} on ${formData.preferredDate} at ${formData.preferredTime} for ${formData.duration} hours. Stadium: ${formData.selectedStadium?.stadium_name || 'TBD'}. Additional notes: ${formData.notes || 'None'}.`,
 action_url: `/dashboard/matches/requests/${userData.user.id}`,
 metadata: {
 requesting_club: club.name,
 requesting_club_id: club.id,
 requesting_team_id: formData.teamId,
 opponent_club: formData.selectedClub?.name || 'Manual Entry',
 opponent_club_id: formData.selectedClub?.id || null,
 match_format: formData.matchFormat,
 match_type: formData.matchType,
 preferred_date: formData.preferredDate,
 preferred_time: formData.preferredTime,
 duration: formData.duration,
 stadium_id: formData.stadiumId,
 referee_ids: formData.refereeIds,
 staff_ids: formData.staffIds,
 prize_money: formData.hasPrizeMoney ? formData.prizeMoney : 0,
 budget: budget,
 notes: formData.notes
 }
 }

 console.log('Friendly match request created:', requestData)

 addToast({
 title: 'Success',
 description: 'Friendly match request has been recorded! You can follow up directly with the opponent club.',
 type: 'success'
 })

 onSuccess()
 } catch (error: any) {
 console.error('Error creating friendly match:', error)
 addToast({
 title: 'Error',
 description: error.message || 'Failed to create friendly match request',
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

 return (
 <div className="max-w-2xl mx-auto">
 <Card>
 <CardHeader>
 <CardTitle className="flex items-center gap-2">
 <Target className="h-5 w-5" />
 Create Friendly Match
 </CardTitle>
 <CardDescription>
 Request a friendly match with another club
 </CardDescription>
 </CardHeader>
 <CardContent>
 <form onSubmit={handleSubmit} className="space-y-6">
 {/* Match Format */}
 <div className="space-y-2">
 <Label htmlFor="matchFormat">Match Format</Label>
 <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
 {availableFormats.map((format) => (
 <div
 key={format}
 className={`p-3 border-2 rounded-lg cursor-pointer transition-colors ${
 formData.matchFormat === format
 ? 'border-blue-500 bg-blue-50 '
 : 'border-gray-200 hover:border-gray-300'
 }`}
 onClick={() => setFormData({ ...formData, matchFormat: format })}
 >
 <div className="text-center">
 <div className="text-2xl mb-1">{getFormatIcon(format)}</div>
 <div className="font-semibold text-sm">{format}</div>
 </div>
 </div>
 ))}
 </div>
 </div>

 {/* Team Selection */}
 <div className="space-y-2">
 <Label htmlFor="teamId">Select Your Team</Label>
 <select
 id="teamId"
 className="w-full p-2 border border-gray-300 rounded-md "
 value={formData.teamId}
 onChange={(e) => setFormData({ ...formData, teamId: e.target.value })}
 required
 >
 {teams.map((team) => (
 <option key={team.id} value={team.id}>
 {team.team_name}
 </option>
 ))}
 </select>
 </div>

 {/* Opponent Information */}
 <div className="space-y-4">
 <h3 className="font-semibold flex items-center gap-2">
 <Users className="h-4 w-4" />
 Opponent Information
 </h3>
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 <div className="space-y-2">
 <Label htmlFor="opponentClub">Opponent Club Name</Label>
 <Input
 id="opponentClub"
 value={formData.opponentClub}
 onChange={(e) => setFormData({ ...formData, opponentClub: e.target.value })}
 placeholder="Enter opponent club name"
 required
 />
 </div>
 <div className="space-y-2">
 <Label htmlFor="opponentEmail">Contact Email</Label>
 <Input
 id="opponentEmail"
 type="email"
 value={formData.opponentEmail}
 onChange={(e) => setFormData({ ...formData, opponentEmail: e.target.value })}
 placeholder="opponent@club.com"
 required
 />
 </div>
 </div>
 </div>

 {/* Match Details */}
 <div className="space-y-4">
 <h3 className="font-semibold flex items-center gap-2">
 <Calendar className="h-4 w-4" />
 Match Details
 </h3>
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 <div className="space-y-2">
 <Label htmlFor="preferredDate">Preferred Date</Label>
 <Input
 id="preferredDate"
 type="date"
 value={formData.preferredDate}
 onChange={(e) => setFormData({ ...formData, preferredDate: e.target.value })}
 min={new Date().toISOString().split('T')[0]}
 required
 />
 </div>
 <div className="space-y-2">
 <Label htmlFor="preferredTime">Preferred Time</Label>
 <Input
 id="preferredTime"
 type="time"
 value={formData.preferredTime}
 onChange={(e) => setFormData({ ...formData, preferredTime: e.target.value })}
 required
 />
 </div>
 </div>
 </div>

 {/* Venue Preference */}
 <div className="space-y-2">
 <Label>Venue Preference</Label>
 <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
 {[
 { value: 'home', label: 'Our Stadium', icon: '🏠' },
 { value: 'away', label: 'Their Stadium', icon: '✈️' },
 { value: 'neutral', label: 'Neutral Ground', icon: '⚖️' }
 ].map((option) => (
 <div
 key={option.value}
 className={`p-3 border-2 rounded-lg cursor-pointer transition-colors ${
 formData.venue === option.value
 ? 'border-blue-500 bg-blue-50 '
 : 'border-gray-200 hover:border-gray-300'
 }`}
 onClick={() => setFormData({ ...formData, venue: option.value })}
 >
 <div className="text-center">
 <div className="text-xl mb-1">{option.icon}</div>
 <div className="font-medium text-sm">{option.label}</div>
 </div>
 </div>
 ))}
 </div>
 </div>

 {/* Additional Notes */}
 <div className="space-y-2">
 <Label htmlFor="notes">Additional Notes (Optional)</Label>
 <Textarea
 id="notes"
 value={formData.notes}
 onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
 placeholder="Any special requirements, warm-up preferences, or other details..."
 rows={3}
 />
 </div>

 {/* Info Box */}
 <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
 <div className="flex items-start gap-2">
 <Info className="h-4 w-4 text-blue-600 mt-0.5" />
 <div className="text-sm text-blue-800 ">
 <p className="font-medium mb-1">How it works:</p>
 <ul className="text-xs space-y-1">
 <li>• Your request will be sent to the opponent club via email</li>
 <li>• They can accept, decline, or propose alternative arrangements</li>
 <li>• Once confirmed, the match will appear in your schedule</li>
 <li>• Referees and stadium booking will be arranged automatically</li>
 </ul>
 </div>
 </div>
 </div>

 {/* Submit Button */}
 <Button
 type="submit"
 disabled={loading}
 className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"
 >
 {loading ? (
 <div className="flex items-center gap-2">
 <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
 Sending Request...
 </div>
 ) : (
 <div className="flex items-center gap-2">
 <Send className="h-4 w-4" />
 Send Match Request
 </div>
 )}
 </Button>
 </form>
 </CardContent>
 </Card>
 </div>
 )
}
