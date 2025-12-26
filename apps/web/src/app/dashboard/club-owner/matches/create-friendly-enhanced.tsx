'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/context/ToastContext'
import { DayPicker } from 'react-day-picker'
import { format, isBefore, startOfDay, addHours, isAfter, isSameDay } from 'date-fns'
import 'react-day-picker/dist/style.css'
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
  role_type: string
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
  
  // Calendar and time slot states
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
  const [blockedTimeSlots, setBlockedTimeSlots] = useState<string[]>([])
  const [availableTimeSlots, setAvailableTimeSlots] = useState<string[]>([])
  const [scheduledMatches, setScheduledMatches] = useState<any[]>([])
  
  // Search states
  const [clubSearchTerm, setClubSearchTerm] = useState('')
  const [showClubDropdown, setShowClubDropdown] = useState(false)
  
  // Form data with enhanced fields
  const [formData, setFormData] = useState({
    matchFormat: availableFormats[0] || '5-a-side',
    teamId: teams[0]?.id || '',
    selectedClub: null as Club | null,
    matchDate: new Date(),
    matchTime: '09:00', // HH:mm format
    duration: 1, // hours
    stadiumId: '',
    selectedStadium: null as Stadium | null,
    matchType: 'hobby', // 'hobby' or 'official'
    refereeIds: [] as string[],
    staffIds: [] as string[],
    prizeMoney: 0,
    hasPrizeMoney: false,
    notes: '',
    teamSize: 8 // default for 5-a-side
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
          id, unique_staff_id, role_type, hourly_rate, is_available,
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

  const loadScheduledMatches = async () => {
    if (!formData.stadiumId || !selectedDate) return

    try {
      const supabase = createClient()
      const dateStr = format(selectedDate, 'yyyy-MM-dd')

      // Fetch matches scheduled on this stadium for the selected date
      const { data: matches } = await supabase
        .from('matches')
        .select('id, scheduled_date, start_time, duration')
        .eq('stadium_id', formData.stadiumId)
        .eq('scheduled_date', dateStr)
        .eq('status', 'scheduled')

      if (matches && matches.length > 0) {
        setScheduledMatches(matches)
        const blockedSlots: string[] = []

        // Calculate blocked time slots based on scheduled matches
        matches.forEach((match: any) => {
          const [hours, minutes] = match.start_time.split(':').map(Number)
          const matchDuration = match.duration || 2 // default 2 hours

          // Block 30 minutes before and after the match for setup/cleanup
          for (let i = 0; i < 24; i++) {
            const slotStart = i
            const slotEnd = i + 1

            // Check if this slot overlaps with the match
            if (slotStart < hours + matchDuration + 0.5 && slotEnd > hours - 0.5) {
              blockedSlots.push(`${String(i).padStart(2, '0')}:00`)
            }
          }
        })

        setBlockedTimeSlots([...new Set(blockedSlots)])

        // Generate available time slots
        const availableSlots: string[] = []
        for (let i = 6; i < 22; i++) { // 6 AM to 10 PM
          const timeStr = `${String(i).padStart(2, '0')}:00`
          if (!blockedSlots.includes(timeStr)) {
            availableSlots.push(timeStr)
          }
        }
        setAvailableTimeSlots(availableSlots)
      } else {
        setScheduledMatches([])
        setBlockedTimeSlots([])
        
        // Generate available time slots (all slots available)
        const availableSlots: string[] = []
        for (let i = 6; i < 22; i++) { // 6 AM to 10 PM
          availableSlots.push(`${String(i).padStart(2, '0')}:00`)
        }
        setAvailableTimeSlots(availableSlots)
      }
    } catch (error) {
      console.error('Error loading scheduled matches:', error)
    }
  }

  // Load scheduled matches when stadium or date changes
  useEffect(() => {
    loadScheduledMatches()
  }, [formData.stadiumId, selectedDate])

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
    const processingFee = subtotal * 0.05 // 5% processing fee
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
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) throw new Error('User not authenticated')

      // Create a notification entry that can be used to track the request
      const requestData = {
        type: 'friendly_match_request',
        title: `Friendly Match Request from ${club.name}`,
        message: `${club.name} has requested a ${formData.matchType} friendly match: ${formData.matchFormat} on ${format(formData.matchDate, 'PPP')} at ${formData.matchTime} for ${formData.duration} hours. Stadium: ${formData.selectedStadium?.stadium_name || 'TBD'}. Additional notes: ${formData.notes || 'None'}.`,
        action_url: `/dashboard/matches/requests/${userData.user.id}`,
        metadata: {
          requesting_club: club.name,
          requesting_club_id: club.id,
          requesting_team_id: formData.teamId,
          opponent_club: formData.selectedClub?.name || 'Manual Entry',
          opponent_club_id: formData.selectedClub?.id || null,
          match_format: formData.matchFormat,
          match_type: formData.matchType,
          match_date: format(formData.matchDate, 'yyyy-MM-dd'),
          match_time: formData.matchTime,
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

  const selectClub = (club: Club) => {
    setFormData(prev => ({ ...prev, selectedClub: club }))
    setClubSearchTerm(club.name)
    setShowClubDropdown(false)
  }

  const selectStadium = (stadium: Stadium) => {
    setFormData(prev => ({ 
      ...prev, 
      stadiumId: stadium.id, 
      selectedStadium: stadium 
    }))
  }

  const toggleReferee = (refereeId: string) => {
    setFormData(prev => ({
      ...prev,
      refereeIds: prev.refereeIds.includes(refereeId)
        ? prev.refereeIds.filter(id => id !== refereeId)
        : [...prev.refereeIds, refereeId]
    }))
  }

  const toggleStaff = (staffId: string) => {
    setFormData(prev => ({
      ...prev,
      staffIds: prev.staffIds.includes(staffId)
        ? prev.staffIds.filter(id => id !== staffId)
        : [...prev.staffIds, staffId]
    }))
  }

  if (loadingData) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-orange"></div>
        <span className="ml-3 text-gray-600">Loading match data...</span>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Create Enhanced Friendly Match
          </CardTitle>
          <CardDescription>
            Organize a friendly match with comprehensive booking and budget planning
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Match Format */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">Match Format</Label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {availableFormats.map((format) => (
                  <div
                    key={format}
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      formData.matchFormat === format
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-md'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                    }`}
                    onClick={() => setFormData({ ...formData, matchFormat: format })}
                  >
                    <div className="text-center">
                      <div className="text-3xl mb-2">{getFormatIcon(format)}</div>
                      <div className="font-semibold">{format}</div>
                      <div className="text-sm text-gray-500 mt-1">
                        {format === '5-a-side' && '8 players'}
                        {format === '7-a-side' && '11 players'}
                        {format === '11-a-side' && '14 players'}
                      </div>
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
                className="w-full p-3 border border-gray-300 rounded-md dark:border-gray-700 dark:bg-gray-800"
                value={formData.teamId}
                onChange={(e) => setFormData({ ...formData, teamId: e.target.value })}
                required
              >
                {teams.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.team_name} ({team.total_players || 0} players)
                  </option>
                ))}
              </select>
            </div>

            {/* Enhanced Opponent Selection */}
            <div className="space-y-4">
              <h3 className="font-semibold flex items-center gap-2 text-lg">
                <Users className="h-5 w-5" />
                Opponent Club Selection
              </h3>
              
              <div className="space-y-3">
                <Label>Search for Verified Clubs</Label>
                <div className="relative">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search by club name, city, or district..."
                      value={clubSearchTerm}
                      onChange={(e) => {
                        setClubSearchTerm(e.target.value)
                        setShowClubDropdown(true)
                      }}
                      onFocus={() => setShowClubDropdown(true)}
                      className="pl-10"
                    />
                  </div>
                  
                  {showClubDropdown && filteredClubs.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-60 overflow-y-auto">
                      {filteredClubs.map((club) => (
                        <div
                          key={club.id}
                          className="p-3 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer border-b border-gray-100 dark:border-gray-700 last:border-0"
                          onClick={() => selectClub(club)}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium">{club.name}</div>
                              <div className="text-sm text-gray-500">
                                {club.city}, {club.district}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">
                                KYC ✓
                              </Badge>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {formData.selectedClub && (
                  <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                      <div>
                        <h4 className="font-semibold text-green-800 dark:text-green-200">
                          Selected: {formData.selectedClub.name}
                        </h4>
                        <p className="text-sm text-green-700 dark:text-green-300">
                          {formData.selectedClub.city}, {formData.selectedClub.district}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Stadium Selection */}
            <div className="space-y-4">
              <h3 className="font-semibold flex items-center gap-2 text-lg">
                <Building className="h-5 w-5" />
                Stadium Selection
                <Badge variant="outline">{filteredStadiums.length} available</Badge>
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredStadiums.map((stadium) => (
                  <div
                    key={stadium.id}
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      formData.stadiumId === stadium.id
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                    }`}
                    onClick={() => selectStadium(stadium)}
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between">
                        <h4 className="font-semibold">{stadium.stadium_name}</h4>
                        <Badge variant="outline">₹{stadium.hourly_rate}/hr</Badge>
                      </div>
                      <p className="text-sm text-gray-600">{stadium.location}</p>
                      <p className="text-xs text-gray-500">District: {stadium.district}</p>
                      {stadium.facilities && stadium.facilities.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {stadium.facilities.slice(0, 3).map((facility, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {facility}
                            </Badge>
                          ))}
                          {stadium.facilities.length > 3 && (
                            <Badge variant="secondary" className="text-xs">
                              +{stadium.facilities.length - 3} more
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Match Type Selection */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">Match Type</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    formData.matchType === 'hobby'
                      ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                  }`}
                  onClick={() => setFormData({ ...formData, matchType: 'hobby' })}
                >
                  <div className="text-center">
                    <div className="text-2xl mb-2">🏃</div>
                    <h4 className="font-semibold">Hobby Match</h4>
                    <p className="text-sm text-gray-600 mt-1">
                      Casual friendly match, optional referees
                    </p>
                  </div>
                </div>
                
                <div
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    formData.matchType === 'official'
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                  }`}
                  onClick={() => setFormData({ ...formData, matchType: 'official' })}
                >
                  <div className="text-center">
                    <div className="text-2xl mb-2">🏆</div>
                    <h4 className="font-semibold">Official Match</h4>
                    <p className="text-sm text-gray-600 mt-1">
                      Professional match with referees & staff
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Referees & Staff Selection (for Official matches) */}
            {formData.matchType === 'official' && (
              <div className="space-y-6">
                {/* Referees */}
                <div className="space-y-3">
                  <Label className="text-base font-semibold flex items-center gap-2">
                    <UserCheck className="h-4 w-4" />
                    Select Referees ({formData.refereeIds.length} selected)
                  </Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {availableReferees.map((referee) => (
                      <div
                        key={referee.id}
                        className={`p-3 border rounded-lg cursor-pointer transition-all ${
                          formData.refereeIds.includes(referee.id)
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                        }`}
                        onClick={() => toggleReferee(referee.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h5 className="font-medium">
                              {referee.users.first_name} {referee.users.last_name}
                            </h5>
                            <p className="text-xs text-gray-500">
                              {referee.certification_level} | {referee.unique_referee_id}
                            </p>
                          </div>
                          <div className="text-right">
                            <Badge variant="outline">₹{referee.hourly_rate}/hr</Badge>
                            {formData.refereeIds.includes(referee.id) && (
                              <CheckCircle2 className="h-4 w-4 text-blue-600 mt-1" />
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Staff */}
                <div className="space-y-3">
                  <Label className="text-base font-semibold flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Select PCL Staff ({formData.staffIds.length} selected)
                  </Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {availableStaff.map((staff) => (
                      <div
                        key={staff.id}
                        className={`p-3 border rounded-lg cursor-pointer transition-all ${
                          formData.staffIds.includes(staff.id)
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                        }`}
                        onClick={() => toggleStaff(staff.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h5 className="font-medium">
                              {staff.users.first_name} {staff.users.last_name}
                            </h5>
                            <p className="text-xs text-gray-500">
                              {staff.role_type} | {staff.unique_staff_id}
                            </p>
                          </div>
                          <div className="text-right">
                            <Badge variant="outline">₹{staff.hourly_rate}/hr</Badge>
                            {formData.staffIds.includes(staff.id) && (
                              <CheckCircle2 className="h-4 w-4 text-blue-600 mt-1" />
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Date, Time and Duration */}
            <div className="space-y-4">
              <h3 className="font-semibold flex items-center gap-2 text-lg">
                <Calendar className="h-5 w-5" />
                Match Scheduling
              </h3>
              
              {/* Modern Calendar */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Calendar Section */}
                <div className="space-y-2">
                  <Label>Select Date</Label>
                  <div className="relative">
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full justify-start text-left"
                      onClick={() => setShowDatePicker(!showDatePicker)}
                    >
                      <Calendar className="h-4 w-4 mr-2" />
                      {selectedDate ? format(selectedDate, 'PPP') : 'Pick a date'}
                    </Button>
                    
                    {showDatePicker && (
                      <div className="absolute top-12 left-0 z-50 bg-white border rounded-lg shadow-lg p-4">
                        <DayPicker
                          mode="single"
                          selected={selectedDate}
                          onSelect={(date) => {
                            setSelectedDate(date)
                            setFormData({ ...formData, matchDate: date || new Date() })
                            setShowDatePicker(false)
                          }}
                          disabled={(date) => {
                            // Disable past dates
                            return isBefore(date, startOfDay(new Date()))
                          }}
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Time Slot Selection */}
                <div className="space-y-2">
                  <Label>Select Time Slot</Label>
                  <div className="space-y-2 max-h-48 overflow-y-auto border rounded-lg p-2">
                    {availableTimeSlots.length > 0 ? (
                      availableTimeSlots.map((time) => (
                        <Button
                          key={time}
                          type="button"
                          variant={formData.matchTime === time ? 'default' : 'outline'}
                          className="w-full justify-start"
                          onClick={() => setFormData({ ...formData, matchTime: time })}
                        >
                          <Clock className="h-4 w-4 mr-2" />
                          {time}
                        </Button>
                      ))
                    ) : (
                      <p className="text-sm text-gray-500 p-2">No available time slots for this date</p>
                    )}
                  </div>
                </div>

                {/* Blocked Slots Info */}
                <div className="space-y-2">
                  <Label>Blocked Time Slots</Label>
                  {blockedTimeSlots.length > 0 ? (
                    <div className="border rounded-lg p-3 bg-red-50">
                      <p className="text-sm font-semibold text-red-700 mb-2">Unavailable Times:</p>
                      <div className="flex flex-wrap gap-2">
                        {blockedTimeSlots.map((time) => (
                          <Badge key={time} variant="destructive">
                            {time}
                          </Badge>
                        ))}
                      </div>
                      {scheduledMatches.length > 0 && (
                        <div className="mt-3 text-xs text-red-600">
                          <p className="font-semibold mb-1">Scheduled Matches:</p>
                          {scheduledMatches.map((match) => (
                            <p key={match.id}>
                              {format(new Date(match.scheduled_date + ' ' + match.start_time), 'h:mm a')} - {match.duration}h duration
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="border rounded-lg p-3 bg-green-50">
                      <p className="text-sm text-green-700">✓ All time slots available</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Duration */}
              <div className="space-y-2">
                <Label htmlFor="duration">Match Duration (hours)</Label>
                <select
                  id="duration"
                  className="w-full p-2 border border-gray-300 rounded-md dark:border-gray-700 dark:bg-gray-800"
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
                >
                  {[1, 2, 3, 4, 5, 6].map(hours => (
                    <option key={hours} value={hours}>
                      {hours} Hour{hours > 1 ? 's' : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Prize Money */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="hasPrizeMoney"
                  checked={formData.hasPrizeMoney}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    hasPrizeMoney: e.target.checked,
                    prizeMoney: e.target.checked ? formData.prizeMoney : 0 
                  })}
                  className="rounded border-gray-300"
                />
                <Label htmlFor="hasPrizeMoney" className="flex items-center gap-2 cursor-pointer">
                  <Trophy className="h-4 w-4" />
                  Add Prize Money
                </Label>
              </div>
              
              {formData.hasPrizeMoney && (
                <div className="space-y-2">
                  <Label htmlFor="prizeMoney">Prize Money Amount (₹)</Label>
                  <Input
                    id="prizeMoney"
                    type="number"
                    min="0"
                    value={formData.prizeMoney}
                    onChange={(e) => setFormData({ ...formData, prizeMoney: parseInt(e.target.value) || 0 })}
                    placeholder="Enter prize money amount"
                  />
                </div>
              )}
            </div>

            {/* Budget Calculator */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 space-y-4">
              <h3 className="font-semibold flex items-center gap-2 text-lg">
                <Calculator className="h-5 w-5" />
                Budget Calculator
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>Stadium Booking:</span>
                    <span className="font-medium">₹{budget.stadiumCost}</span>
                  </div>
                  
                  {formData.matchType === 'official' && (
                    <>
                      <div className="flex justify-between">
                        <span>Referees ({formData.refereeIds.length}):</span>
                        <span className="font-medium">₹{budget.refereeCost}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>PCL Staff ({formData.staffIds.length}):</span>
                        <span className="font-medium">₹{budget.staffCost}</span>
                      </div>
                    </>
                  )}
                  
                  <div className="flex justify-between">
                    <span>Processing Fee (5%):</span>
                    <span className="font-medium">₹{budget.processingFee.toFixed(2)}</span>
                  </div>
                  
                  <div className="border-t pt-2 flex justify-between text-lg font-bold">
                    <span>Total Cost:</span>
                    <span className="text-green-600">₹{budget.totalCost.toFixed(2)}</span>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">
                      Cost Per Player
                    </h4>
                    <div className="text-2xl font-bold text-blue-600">
                      ₹{budget.costPerPlayer.toFixed(2)}
                    </div>
                    <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                      Based on {formData.teamSize} players
                    </p>
                  </div>
                  
                  {formData.hasPrizeMoney && formData.prizeMoney > 0 && (
                    <div className="text-center p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                      <h5 className="font-medium text-yellow-800 dark:text-yellow-200">
                        Prize Money
                      </h5>
                      <div className="text-xl font-bold text-yellow-600">
                        ₹{formData.prizeMoney}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Additional Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Additional Notes (Optional)</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Any special requirements, rules, or additional information..."
                rows={3}
              />
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <Info className="h-4 w-4 text-blue-600 mt-0.5" />
                <div className="text-sm text-blue-800 dark:text-blue-200">
                  <p className="font-medium mb-1">Enhanced Match Request Process:</p>
                  <ul className="text-xs space-y-1">
                    <li>• Opponent club will receive detailed match proposal</li>
                    <li>• Stadium booking will be coordinated automatically</li>
                    <li>• Referee and staff assignments confirmed upon acceptance</li>
                    <li>• Budget breakdown shared with both teams</li>
                    <li>• Payment processing handled securely by PCL</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={loading || !formData.selectedClub || !formData.stadiumId}
              className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-lg py-3"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Creating Match Request...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Send className="h-5 w-5" />
                  Create Enhanced Match Request
                </div>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}