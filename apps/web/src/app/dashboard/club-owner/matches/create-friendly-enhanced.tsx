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
  Trophy,
  X
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
  district: string | null
  city?: string
  state?: string
  hourly_rate: number
  facilities?: string[]
  amenities?: string[]
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

  // Multi-step wizard state
  const [currentStep, setCurrentStep] = useState<number>(1)
  const totalSteps = 5
  
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
    
    // Initialize time slots for today
    const allSlots: string[] = []
    for (let i = 6; i < 22; i++) {
      allSlots.push(`${String(i).padStart(2, '0')}:00`)
    }
    setAvailableTimeSlots(allSlots)
  }, [])

  useEffect(() => {
    // Update team size and duration based on format
    const teamSizes: { [key: string]: number } = {
      '5-a-side': 8,
      '7-a-side': 11,
      '11-a-side': 14
    }
    const matchDurations: { [key: string]: number } = {
      '5-a-side': 1,  // 20min/half + 20min buffer = 1 hour
      '7-a-side': 2,  // 35min/half + buffer = 2 hours
      '11-a-side': 3  // 45min/half + buffer = 3 hours
    }
    setFormData(prev => ({
      ...prev,
      teamSize: teamSizes[prev.matchFormat] || 8,
      duration: matchDurations[prev.matchFormat] || 1
    }))
  }, [formData.matchFormat])

  useEffect(() => {
    calculateBudget()
  }, [formData.stadiumId, formData.refereeIds, formData.staffIds, formData.duration, formData.teamSize])

  useEffect(() => {
    // Filter clubs based on search term
    const filtered = availableClubs.filter(club =>
      club.name.toLowerCase().includes(clubSearchTerm.toLowerCase()) ||
      club.city.toLowerCase().includes(clubSearchTerm.toLowerCase()) ||
      club.state.toLowerCase().includes(clubSearchTerm.toLowerCase()) ||
      club.district.toLowerCase().includes(clubSearchTerm.toLowerCase())
    )
    setFilteredClubs(filtered)
  }, [clubSearchTerm, availableClubs])

  useEffect(() => {
    // Don't filter stadiums by district since most have null district
    // Show all available stadiums
    setFilteredStadiums(availableStadiums)
  }, [formData.selectedClub, availableStadiums, club.district])

  const loadInitialData = async () => {
    try {
      setLoadingData(true)
      const supabase = createClient()

      // Load active clubs (excluding own club)
      const { data: clubsData } = await supabase
        .from('clubs')
        .select('id, club_name, city, state, country, logo_url, category, is_active')
        .eq('is_active', true)
        .neq('id', club.id)
        .order('club_name', { ascending: true })

      // Transform data to match the Club interface
      const transformedClubs = clubsData?.map(c => ({
        id: c.id,
        name: c.club_name,
        city: c.city,
        state: c.state,
        district: c.city, // Use city as district proxy for now
        kyc_verified: true,
        logo_url: c.logo_url,
        category: c.category
      })) || []

      setAvailableClubs(transformedClubs)

      // Load stadiums
      const { data: stadiumsData } = await supabase
        .from('stadiums')
        .select('id, stadium_name, location, district, city, state, hourly_rate, amenities, is_available')
        .eq('is_available', true)

      // Transform stadiums to use amenities as facilities
      const transformedStadiums = stadiumsData?.map(s => ({
        ...s,
        facilities: s.amenities || [],
        district: s.district || s.city || s.state || 'Unknown'
      })) || []

      setAvailableStadiums(transformedStadiums)

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
    try {
      // Generate all available time slots first (6 AM - 10 PM)
      const allSlots: string[] = []
      for (let i = 6; i < 22; i++) {
        allSlots.push(`${String(i).padStart(2, '0')}:00`)
      }
      
      // If no stadium or date selected, don't show time slots yet
      if (!selectedDate || !formData.stadiumId) {
        setAvailableTimeSlots([])
        setBlockedTimeSlots([])
        setScheduledMatches([])
        return
      }

      const supabase = createClient()
      const dateStr = format(selectedDate, 'yyyy-MM-dd')

      // Fetch matches scheduled on this stadium for the selected date
      const { data: matches } = await supabase
        .from('matches')
        .select('id, scheduled_date, start_time, duration, format')
        .eq('stadium_id', formData.stadiumId)
        .eq('scheduled_date', dateStr)
        .eq('status', 'scheduled')

      // Calculate match duration based on format
      const getMatchDuration = (matchFormat: string) => {
        switch (matchFormat) {
          case '5-a-side':
            return 1 // 20min/half + 20min buffer = 1 hour
          case '7-a-side':
            return 2 // 35min/half + buffer = 2 hours
          case '11-a-side':
            return 3 // 45min/half + buffer = 3 hours
          default:
            return 1 // default 1 hour
        }
      }

      if (matches && matches.length > 0) {
        setScheduledMatches(matches)
        const blockedSlots: string[] = []

        // Calculate blocked time slots based on scheduled matches
        matches.forEach((match: any) => {
          const [hours, minutes] = match.start_time.split(':').map(Number)
          const matchDuration = getMatchDuration(match.format) || match.duration || getMatchDuration(formData.matchFormat)

          // Block time slots with proper duration (no extra buffer needed as duration includes setup time)
          for (let i = 0; i < 24; i++) {
            const slotStart = i
            const slotEnd = i + 1

            // Check if this slot overlaps with the match
            if (slotStart < hours + matchDuration && slotEnd > hours) {
              blockedSlots.push(`${String(i).padStart(2, '0')}:00`)
            }
          }
        })

        setBlockedTimeSlots([...new Set(blockedSlots)])

        // Generate available time slots
        const availableSlots = allSlots.filter(slot => !blockedSlots.includes(slot))
        setAvailableTimeSlots(availableSlots)
      } else {
        setScheduledMatches([])
        setBlockedTimeSlots([])
        setAvailableTimeSlots(allSlots)
      }
    } catch (error) {
      console.error('Error loading scheduled matches:', error)
      // Fallback to show all slots
      const allSlots: string[] = []
      for (let i = 6; i < 22; i++) {
        allSlots.push(`${String(i).padStart(2, '0')}:00`)
      }
      setAvailableTimeSlots(allSlots)
    }
  }

  // Load time slots when date changes
  useEffect(() => {
    loadScheduledMatches()
  }, [selectedDate, formData.stadiumId])

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
    // Cost per player split between both teams (your team + opponent team)
    const totalPlayers = formData.teamSize * 2
    const costPerPlayer = totalCost / totalPlayers

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

      // Validate required fields
      if (!formData.stadiumId) throw new Error('Stadium is required')
      if (!selectedDate) throw new Error('Match date is required')
      if (!formData.matchTime) throw new Error('Match time is required')
      if (!formData.teamId) throw new Error('Team is required')

      // Get the home team details
      const { data: homeTeam } = await supabase
        .from('teams')
        .select('*')
        .eq('id', formData.teamId)
        .single()

      if (!homeTeam) throw new Error('Team not found')

      // For friendly matches, we need an away team. 
      // If opponent is selected, use their team with same format
      // If not available, use their first team regardless of format
      let awayTeamId = null

      if (formData.selectedClub?.id) {
        // First, try to find a team with matching format
        const { data: opponentTeamsSameFormat } = await supabase
          .from('teams')
          .select('*')
          .eq('club_id', formData.selectedClub.id)
          .eq('format', formData.matchFormat)
          .limit(1)

        if (opponentTeamsSameFormat && opponentTeamsSameFormat.length > 0) {
          awayTeamId = opponentTeamsSameFormat[0].id
        } else {
          // If no matching format, use any team from opponent club
          const { data: opponentTeamsAny } = await supabase
            .from('teams')
            .select('*')
            .eq('club_id', formData.selectedClub.id)
            .limit(1)

          if (opponentTeamsAny && opponentTeamsAny.length > 0) {
            awayTeamId = opponentTeamsAny[0].id
          }
        }
      }

      // If still no away team found, create a temporary/placeholder team for opponent
      if (!awayTeamId && formData.selectedClub?.id) {
        // Create a temporary team for the opponent club
        const { data: newTeam, error: teamCreateError } = await supabase
          .from('teams')
          .insert([
            {
              club_id: formData.selectedClub.id,
              team_name: `${formData.selectedClub.name} - ${formData.matchFormat}`,
              format: formData.matchFormat,
              status: 'active'
            }
          ])
          .select()

        if (teamCreateError) {
          console.error('Error creating temporary team:', teamCreateError)
          throw new Error('Unable to find or create opponent team. Please ensure the opponent club exists.')
        }

        if (newTeam && newTeam.length > 0) {
          awayTeamId = newTeam[0].id
        }
      }

      // Final check - ensure both teams exist and are different
      if (!awayTeamId) {
        throw new Error('Unable to find or create opponent team. Please select a valid opponent club.')
      }

      if (homeTeam.id === awayTeamId) {
        throw new Error('Home and away teams cannot be the same. Please select a different opponent club.')
      }

      console.log('Match setup - Home Team:', homeTeam.id, 'Away Team:', awayTeamId)

      // Insert into matches table using correct schema
      const { data: matchData, error: matchError } = await supabase
        .from('matches')
        .insert([
          {
            home_team_id: homeTeam.id,
            away_team_id: awayTeamId,
            stadium_id: formData.stadiumId,
            match_date: format(selectedDate, 'yyyy-MM-dd'),
            match_time: formData.matchTime,
            match_format: formData.matchFormat,
            status: 'scheduled',
            created_by: userData.user.id
          }
        ])
        .select()

      if (matchError) throw matchError
      if (!matchData || matchData.length === 0) throw new Error('Failed to create match')

      const createdMatch = matchData[0]
      console.log('Match created:', createdMatch.id, 'Home:', createdMatch.home_team_id, 'Away:', createdMatch.away_team_id)

      // Handle referee/staff assignments if it's an official match
      if (formData.matchType === 'official' && formData.refereeIds.length > 0) {
        const assignments = formData.refereeIds.map(refereeId => ({
          match_id: createdMatch.id,
          referee_id: refereeId,
          assignment_type: 'referee',
          status: 'pending'
        }))

        await supabase.from('match_assignments').insert(assignments)
      }

      if (formData.matchType === 'official' && formData.staffIds.length > 0) {
        const assignments = formData.staffIds.map(staffId => ({
          match_id: createdMatch.id,
          staff_id: staffId,
          assignment_type: 'staff',
          status: 'pending'
        }))

        await supabase.from('match_assignments').insert(assignments)
      }

      // Create notification for the opponent club
      if (formData.selectedClub?.id) {
        // Get the opponent club's owner to notify them
        const { data: opponentClub } = await supabase
          .from('clubs')
          .select('owner_id')
          .eq('id', formData.selectedClub.id)
          .single()

        if (opponentClub?.owner_id) {
          const matchDateStr = format(selectedDate, 'PPP')
          const stadiumName = formData.selectedStadium?.stadium_name || 'TBD'
          
          const { error: notificationError } = await supabase
            .from('notifications')
            .insert([
              {
                user_id: opponentClub.owner_id,
                type: 'friendly_match_request',
                title: `Friendly Match Request from ${club.name}`,
                message: `${club.name} requested a ${formData.matchFormat} match on ${matchDateStr} at ${formData.matchTime}. Location: ${stadiumName}`,
                action_url: `/dashboard/matches/${createdMatch.id}`,
                read: false
              }
            ])

          if (notificationError) console.error('Notification error:', notificationError)
        }
      }

      console.log('Match created successfully:', createdMatch)

      addToast({
        title: 'Success',
        description: 'Friendly match has been created successfully!',
        type: 'success'
      })

      onSuccess()
    } catch (error: any) {
      console.error('Error creating friendly match:', error)
      addToast({
        title: 'Error',
        description: error.message || 'Failed to create friendly match',
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
    // Load scheduled matches for this stadium
    if (selectedDate) {
      loadScheduledMatches()
    }
  }

  const canSelectTimeSlot = (startTime: string): boolean => {
    // Check if enough consecutive slots are available
    const [hours] = startTime.split(':').map(Number)
    const duration = formData.duration

    // Check if all required slots are available
    for (let i = 0; i < duration; i++) {
      const slotTime = `${String(hours + i).padStart(2, '0')}:00`
      if (blockedTimeSlots.includes(slotTime) || !availableTimeSlots.includes(slotTime)) {
        return false
      }
    }

    // Check if booking extends beyond operating hours (22:00)
    if (hours + duration > 22) {
      return false
    }

    return true
  }

  const getAffectedSlots = (startTime: string): string[] => {
    // Get all slots that will be booked for this match
    const [hours] = startTime.split(':').map(Number)
    const slots: string[] = []

    for (let i = 0; i < formData.duration; i++) {
      slots.push(`${String(hours + i).padStart(2, '0')}:00`)
    }

    return slots
  }

  // Step validation functions
  const validateStep1 = (): boolean => {
    return !!(formData.matchFormat && formData.teamId && formData.selectedClub)
  }

  const validateStep2 = (): boolean => {
    return !!(formData.stadiumId)
  }

  const validateStep3 = (): boolean => {
    return !!(selectedDate && formData.matchTime)
  }

  const validateStep4 = (): boolean => {
    // For hobby matches, no validation needed
    // For official matches, at least one referee is recommended but not required
    return true
  }

  const canProceedToNextStep = (): boolean => {
    switch (currentStep) {
      case 1:
        return validateStep1()
      case 2:
        return validateStep2()
      case 3:
        return validateStep3()
      case 4:
        return validateStep4()
      default:
        return true
    }
  }

  const handleNextStep = () => {
    if (canProceedToNextStep()) {
      setCurrentStep(prev => Math.min(prev + 1, totalSteps))
    } else {
      addToast({
        title: 'Incomplete Information',
        description: 'Please fill in all required fields before proceeding.',
        type: 'error'
      })
    }
  }

  const handlePreviousStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1))
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
            Step {currentStep} of {totalSteps}:{' '}
            {currentStep === 1 ? 'Match Setup' :
             currentStep === 2 ? 'Select Stadium' :
             currentStep === 3 ? 'Date & Time' :
             currentStep === 4 ? 'Officials & Resources' :
             'Review & Confirm'}
          </CardDescription>

          {/* Progress Bar */}
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              {[1, 2, 3, 4, 5].map((step) => (
                <div key={step} className="flex items-center flex-1">
                  <div className="flex flex-col items-center flex-1">
                    <div className={`
                      w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all
                      ${currentStep >= step
                        ? 'bg-blue-600 text-white shadow-lg'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                      }
                    `}>
                      {step}
                    </div>
                    <span className={`text-xs mt-1 text-center ${currentStep >= step ? 'text-blue-600 dark:text-blue-400 font-medium' : 'text-gray-400 dark:text-gray-500'}`}>
                      {step === 1 && 'Setup'}
                      {step === 2 && 'Stadium'}
                      {step === 3 && 'Schedule'}
                      {step === 4 && 'Officials'}
                      {step === 5 && 'Review'}
                    </span>
                  </div>
                  {step < 5 && (
                    <div className={`h-1 flex-1 mx-2 rounded ${currentStep > step ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'}`} />
                  )}
                </div>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* STEP 1: Match Setup */}
            {currentStep === 1 && (
              <div className="space-y-6">
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
                        {format === '5-a-side' && '8 players • 1 hour'}
                        {format === '7-a-side' && '11 players • 2 hours'}
                        {format === '11-a-side' && '14 players • 3 hours'}
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
                {/* Filter by Location */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700">
                  <div>
                    <Label className="text-sm font-medium">Filter by State</Label>
                    <select
                      className="w-full mt-1 p-2 border border-gray-300 rounded-md dark:border-gray-700 dark:bg-gray-800 text-sm"
                      onChange={(e) => {
                        const selectedState = e.target.value
                        if (selectedState) {
                          const stateClubs = availableClubs.filter(c => c.state === selectedState)
                          setFilteredClubs(stateClubs)
                        } else {
                          setFilteredClubs(availableClubs)
                        }
                      }}
                    >
                      <option value="">All States</option>
                      {[...new Set(availableClubs.map(c => c.state))].sort().map(state => (
                        <option key={state} value={state}>{state}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium">Filter by District</Label>
                    <select
                      className="w-full mt-1 p-2 border border-gray-300 rounded-md dark:border-gray-700 dark:bg-gray-800 text-sm"
                      onChange={(e) => {
                        const selectedDistrict = e.target.value
                        if (selectedDistrict) {
                          const districtClubs = availableClubs.filter(c => c.district === selectedDistrict)
                          setFilteredClubs(districtClubs)
                        } else {
                          setFilteredClubs(availableClubs)
                        }
                      }}
                    >
                      <option value="">All Districts</option>
                      {[...new Set(availableClubs.map(c => c.district))].sort().map(district => (
                        <option key={district} value={district}>{district}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <Label>Search for Clubs</Label>
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
          </div>
            )}

            {/* STEP 2: Venue & Schedule */}
            {currentStep === 2 && (
              <div className="space-y-6">
                {/* Stadium Selection */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold flex items-center gap-2 text-lg">
                      <Building className="h-5 w-5 text-purple-600" />
                      Select Stadium
                      <Badge variant="outline" className="ml-2">{filteredStadiums.length} available</Badge>
                    </h3>
                    {formData.stadiumId && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setFormData(prev => ({ ...prev, stadiumId: '', selectedStadium: null }))}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <X className="h-4 w-4 mr-1" />
                        Clear Selection
                      </Button>
                    )}
                  </div>

                  {filteredStadiums.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                      <Building className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                      <p className="text-gray-600 font-medium mb-1">No Stadiums Available</p>
                      <p className="text-sm text-gray-500">No stadiums found in the selected districts</p>
                    </div>
                  ) : (
                    <>
                      {/* Selected Stadium Display */}
                      {formData.stadiumId && formData.selectedStadium && (
                        <div className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 border-2 border-purple-300 rounded-lg shadow-sm">
                          <div className="flex items-start gap-4">
                            <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                              <Building className="h-6 w-6 text-white" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-start justify-between mb-2">
                                <div>
                                  <h4 className="font-semibold text-purple-900 text-lg">{formData.selectedStadium.stadium_name}</h4>
                                  <p className="text-sm text-purple-700">{formData.selectedStadium.location}</p>
                                  <p className="text-xs text-purple-600">District: {formData.selectedStadium.district}</p>
                                </div>
                                <div className="text-right">
                                  <Badge className="bg-purple-600 text-white">₹{formData.selectedStadium.hourly_rate}/hr</Badge>
                                  <p className="text-xs text-purple-600 mt-1">
                                    Total: ₹{formData.selectedStadium.hourly_rate * formData.duration}
                                  </p>
                                </div>
                              </div>
                              {formData.selectedStadium.facilities && formData.selectedStadium.facilities.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-2">
                                  {formData.selectedStadium.facilities.map((facility, index) => (
                                    <Badge key={index} variant="secondary" className="text-xs bg-white">
                                      {facility}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Stadium Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {filteredStadiums.map((stadium) => (
                          <div
                            key={stadium.id}
                            className={`p-4 border-2 rounded-lg cursor-pointer transition-all hover:shadow-md ${
                              formData.stadiumId === stadium.id
                                ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 shadow-md'
                                : 'border-gray-200 dark:border-gray-700 hover:border-purple-300'
                            }`}
                            onClick={() => selectStadium(stadium)}
                          >
                            <div className="space-y-2">
                              <div className="flex items-start justify-between">
                                <h4 className="font-semibold text-gray-900 dark:text-white">{stadium.stadium_name}</h4>
                                <div className="text-right">
                                  <Badge variant="outline" className="whitespace-nowrap">₹{stadium.hourly_rate}/hr</Badge>
                                  {formData.stadiumId === stadium.id && (
                                    <CheckCircle2 className="h-5 w-5 text-purple-600 mt-1 ml-auto" />
                                  )}
                                </div>
                              </div>
                              <div className="space-y-1">
                                <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1">
                                  <MapPin className="h-3 w-3" />
                                  {stadium.location}
                                </p>
                                <p className="text-xs text-gray-500">District: {stadium.district}</p>
                              </div>
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
                    </>
                  )}
                </div>
              </div>
            )}

            {/* STEP 3: Date & Time Scheduling */}
            {currentStep === 3 && (
              <div className="space-y-6">
                {/* Modern Match Scheduling */}
                <div className="space-y-6">
                  <h3 className="font-semibold flex items-center gap-2 text-lg">
                    <Calendar className="h-5 w-5 text-blue-600" />
                    Select Date & Time
                  </h3>

                  {/* Stadium Selection Alert */}
                  {!formData.stadiumId && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
                        <div>
                          <p className="font-medium text-amber-800">Stadium Required</p>
                          <p className="text-sm text-amber-600">Please go back to Step 2 and select a stadium first.</p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Modern Calendar with Session Navigation */}
                  {formData.stadiumId && (
                    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden shadow-sm">
                      {/* Calendar Header */}
                      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between flex-wrap gap-4">
                          <div>
                            <h4 className="font-semibold text-gray-800 dark:text-white">Select Match Date & Time</h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Choose your preferred date and time slot</p>
                          </div>
                          <div className="flex items-center gap-4 text-xs flex-wrap">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 bg-green-500 rounded"></div>
                              <span className="text-gray-600 dark:text-gray-400">Available</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 bg-red-500 rounded"></div>
                              <span className="text-gray-600 dark:text-gray-400">Booked</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 bg-orange-500 rounded"></div>
                              <span className="text-gray-600 dark:text-gray-400">Insufficient</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 bg-blue-500 rounded"></div>
                              <span className="text-gray-600 dark:text-gray-400">Selected</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Calendar Content */}
                      <div className="p-6">
                        {/* Date Selection */}
                        <div className="mb-6">
                          <Label className="text-base font-medium mb-3 block">1. Choose Date</Label>
                          <div className="relative">
                            <Button
                              type="button"
                              variant="outline"
                              className="w-full md:w-80 justify-start text-left h-12 bg-white dark:bg-gray-800 border-2 hover:border-blue-300"
                              onClick={() => setShowDatePicker(!showDatePicker)}
                            >
                              <Calendar className="h-4 w-4 mr-3 text-blue-600" />
                              <span className="font-medium">
                                {selectedDate ? format(selectedDate, 'EEEE, MMMM d, yyyy') : 'Pick a date'}
                              </span>
                            </Button>
                            
                            {showDatePicker && (
                              <div className="absolute top-14 left-0 z-50 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl shadow-xl p-4">
                                <DayPicker
                                  mode="single"
                                  selected={selectedDate}
                                  onSelect={(date) => {
                                    setSelectedDate(date)
                                    setFormData({ ...formData, matchDate: date || new Date() })
                                    setShowDatePicker(false)
                                    if (date && formData.stadiumId) {
                                      loadScheduledMatches()
                                    }
                                  }}
                                  disabled={(date) => {
                                    return isBefore(date, startOfDay(new Date()))
                                  }}
                                  className="!font-medium"
                                />
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Time Slot Grid */}
                        <div className="space-y-3">
                          <Label className="text-base font-medium">2. Choose Time Slot</Label>
                          
                          {!selectedDate ? (
                            <div className="text-center py-12 bg-gray-50 dark:bg-gray-900/50 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600">
                              <Calendar className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                              <p className="text-gray-600 dark:text-gray-400 font-medium mb-1">Date Required</p>
                              <p className="text-sm text-gray-500 dark:text-gray-500">Select a date above to view available time slots</p>
                            </div>
                          ) : (
                            <div className="space-y-4">
                              {/* Morning Session */}
                              <div>
                                <h5 className="font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                                  <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                                  Morning Session (6:00 AM - 12:00 PM)
                                </h5>
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
                                  {['06:00', '07:00', '08:00', '09:00', '10:00', '11:00'].map((time) => {
                                    const isBlocked = blockedTimeSlots.includes(time)
                                    const isSelected = formData.matchTime === time
                                    const isAvailable = availableTimeSlots.includes(time)
                                    const canSelect = canSelectTimeSlot(time)
                                    const affectedSlots = formData.matchTime ? getAffectedSlots(formData.matchTime) : []
                                    const isInSelectedRange = affectedSlots.includes(time)

                                    return (
                                      <button
                                        key={time}
                                        type="button"
                                        disabled={isBlocked || !isAvailable || !canSelect}
                                        onClick={() => setFormData({ ...formData, matchTime: time })}
                                        className={`
                                          p-3 rounded-lg border-2 transition-all font-medium text-sm relative
                                          ${isSelected
                                            ? 'bg-blue-600 text-white border-blue-700 shadow-lg ring-2 ring-blue-300'
                                            : isInSelectedRange && !isSelected
                                              ? 'bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-900/30 dark:text-blue-300'
                                              : isBlocked
                                                ? 'bg-red-100 text-red-600 border-red-300 cursor-not-allowed dark:bg-red-900/30 dark:text-red-400'
                                                : !canSelect
                                                  ? 'bg-orange-50 text-orange-600 border-orange-200 cursor-not-allowed dark:bg-orange-900/30 dark:text-orange-400'
                                                  : isAvailable
                                                    ? 'bg-green-50 text-green-700 border-green-300 hover:bg-green-100 hover:border-green-400 dark:bg-green-900/30 dark:text-green-300'
                                                    : 'bg-gray-100 text-gray-400 border-gray-300 cursor-not-allowed dark:bg-gray-800 dark:text-gray-600'
                                          }
                                        `}
                                      >
                                        {time}
                                        {isSelected && formData.duration > 1 && (
                                          <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                                            {formData.duration}h
                                          </span>
                                        )}
                                      </button>
                                    )
                                  })}
                                </div>
                              </div>

                              {/* Afternoon Session */}
                              <div>
                                <h5 className="font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                                  <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
                                  Afternoon Session (12:00 PM - 6:00 PM)
                                </h5>
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
                                  {['12:00', '13:00', '14:00', '15:00', '16:00', '17:00'].map((time) => {
                                    const isBlocked = blockedTimeSlots.includes(time)
                                    const isSelected = formData.matchTime === time
                                    const isAvailable = availableTimeSlots.includes(time)
                                    const canSelect = canSelectTimeSlot(time)
                                    const affectedSlots = formData.matchTime ? getAffectedSlots(formData.matchTime) : []
                                    const isInSelectedRange = affectedSlots.includes(time)

                                    return (
                                      <button
                                        key={time}
                                        type="button"
                                        disabled={isBlocked || !isAvailable || !canSelect}
                                        onClick={() => setFormData({ ...formData, matchTime: time })}
                                        className={`
                                          p-3 rounded-lg border-2 transition-all font-medium text-sm relative
                                          ${isSelected
                                            ? 'bg-blue-600 text-white border-blue-700 shadow-lg ring-2 ring-blue-300'
                                            : isInSelectedRange && !isSelected
                                              ? 'bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-900/30 dark:text-blue-300'
                                              : isBlocked
                                                ? 'bg-red-100 text-red-600 border-red-300 cursor-not-allowed dark:bg-red-900/30 dark:text-red-400'
                                                : !canSelect
                                                  ? 'bg-orange-50 text-orange-600 border-orange-200 cursor-not-allowed dark:bg-orange-900/30 dark:text-orange-400'
                                                  : isAvailable
                                                    ? 'bg-green-50 text-green-700 border-green-300 hover:bg-green-100 hover:border-green-400 dark:bg-green-900/30 dark:text-green-300'
                                                    : 'bg-gray-100 text-gray-400 border-gray-300 cursor-not-allowed dark:bg-gray-800 dark:text-gray-600'
                                          }
                                        `}
                                      >
                                        {time}
                                        {isSelected && formData.duration > 1 && (
                                          <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                                            {formData.duration}h
                                          </span>
                                        )}
                                      </button>
                                    )
                                  })}
                                </div>
                              </div>

                              {/* Evening Session */}
                              <div>
                                <h5 className="font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                                  <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                                  Evening Session (6:00 PM - 10:00 PM)
                                </h5>
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
                                  {['18:00', '19:00', '20:00', '21:00'].map((time) => {
                                    const isBlocked = blockedTimeSlots.includes(time)
                                    const isSelected = formData.matchTime === time
                                    const isAvailable = availableTimeSlots.includes(time)
                                    const canSelect = canSelectTimeSlot(time)
                                    const affectedSlots = formData.matchTime ? getAffectedSlots(formData.matchTime) : []
                                    const isInSelectedRange = affectedSlots.includes(time)

                                    return (
                                      <button
                                        key={time}
                                        type="button"
                                        disabled={isBlocked || !isAvailable || !canSelect}
                                        onClick={() => setFormData({ ...formData, matchTime: time })}
                                        className={`
                                          p-3 rounded-lg border-2 transition-all font-medium text-sm relative
                                          ${isSelected
                                            ? 'bg-blue-600 text-white border-blue-700 shadow-lg ring-2 ring-blue-300'
                                            : isInSelectedRange && !isSelected
                                              ? 'bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-900/30 dark:text-blue-300'
                                              : isBlocked
                                                ? 'bg-red-100 text-red-600 border-red-300 cursor-not-allowed dark:bg-red-900/30 dark:text-red-400'
                                                : !canSelect
                                                  ? 'bg-orange-50 text-orange-600 border-orange-200 cursor-not-allowed dark:bg-orange-900/30 dark:text-orange-400'
                                                  : isAvailable
                                                    ? 'bg-green-50 text-green-700 border-green-300 hover:bg-green-100 hover:border-green-400 dark:bg-green-900/30 dark:text-green-300'
                                                    : 'bg-gray-100 text-gray-400 border-gray-300 cursor-not-allowed dark:bg-gray-800 dark:text-gray-600'
                                          }
                                        `}
                                      >
                                        {time}
                                        {isSelected && formData.duration > 1 && (
                                          <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                                            {formData.duration}h
                                          </span>
                                        )}
                                      </button>
                                    )
                                  })}
                                </div>
                              </div>

                              {/* Selected Time Summary */}
                              {formData.matchTime && (
                                <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                                  <div className="flex items-center gap-3">
                                    <CheckCircle2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                    <div className="flex-1">
                                      <p className="font-medium text-blue-800 dark:text-blue-200">Time Slot Selected</p>
                                      <p className="text-sm text-blue-600 dark:text-blue-400">
                                        {format(selectedDate || new Date(), 'EEEE, MMMM d')} at {formData.matchTime}
                                        {formData.duration > 1 && (() => {
                                          const [hours] = formData.matchTime.split(':').map(Number)
                                          const endHour = hours + formData.duration
                                          return ` - ${String(endHour).padStart(2, '0')}:00`
                                        })()}
                                      </p>
                                      <p className="text-xs text-blue-500 dark:text-blue-500 mt-1">
                                        Duration: {formData.duration} hour{formData.duration > 1 ? 's' : ''}
                                        {formData.duration > 1 && ` (${getAffectedSlots(formData.matchTime).join(', ')})`}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* STEP 4: Officials & Resources */}
            {currentStep === 4 && (
              <div className="space-y-6">
                {formData.matchType === 'official' ? (
                  <>
                    {/* Referees */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="text-base font-semibold flex items-center gap-2">
                          <UserCheck className="h-4 w-4" />
                          Select Referees ({formData.refereeIds.length} selected)
                        </Label>
                        {formData.refereeIds.length > 0 && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setFormData(prev => ({ ...prev, refereeIds: [] }))}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <X className="h-4 w-4 mr-1" />
                            Clear All Referees
                          </Button>
                        )}
                      </div>
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
                  <div className="flex items-center justify-between">
                    <Label className="text-base font-semibold flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Select PCL Staff ({formData.staffIds.length} selected)
                    </Label>
                    {formData.staffIds.length > 0 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setFormData(prev => ({ ...prev, staffIds: [] }))}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <X className="h-4 w-4 mr-1" />
                        Clear All Staff
                      </Button>
                    )}
                  </div>
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
                  </>
                ) : (
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-8 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-16 h-16 bg-blue-100 dark:bg-blue-800 rounded-full flex items-center justify-center">
                        <Info className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg text-blue-900 dark:text-blue-100 mb-2">
                          Hobby Match - No Officials Required
                        </h3>
                        <p className="text-blue-700 dark:text-blue-300 text-sm max-w-md">
                          Hobby matches don't require referees or PCL staff. You can proceed directly to review your match details.
                        </p>
                      </div>
                      <Button
                        type="button"
                        onClick={handleNextStep}
                        className="mt-4 bg-blue-600 hover:bg-blue-700"
                      >
                        Continue to Review →
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* STEP 5: Review & Confirm */}
            {(currentStep as number) === 5 && (
              <div className="space-y-6">
                {/* Match Summary */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
                  <h3 className="font-semibold text-xl mb-4 text-blue-900 dark:text-blue-100">Match Summary</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Match Format</p>
                        <p className="font-semibold text-gray-900 dark:text-white">{formData.matchFormat}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Match Type</p>
                        <p className="font-semibold text-gray-900 dark:text-white capitalize">{formData.matchType}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Your Team</p>
                        <p className="font-semibold text-gray-900 dark:text-white">
                          {teams.find(t => t.id === formData.teamId)?.team_name || 'Not selected'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Opponent</p>
                        <p className="font-semibold text-gray-900 dark:text-white">{formData.selectedClub?.name || 'Not selected'}</p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Stadium</p>
                        <p className="font-semibold text-gray-900 dark:text-white">{formData.selectedStadium?.stadium_name || 'Not selected'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Date & Time</p>
                        <p className="font-semibold text-gray-900 dark:text-white">
                          {selectedDate ? format(selectedDate, 'PPP') : 'Not selected'} at {formData.matchTime}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Duration</p>
                        <p className="font-semibold text-gray-900 dark:text-white">{formData.duration} hour{formData.duration > 1 ? 's' : ''}</p>
                      </div>
                      {formData.matchType === 'official' && (
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Officials</p>
                          <p className="font-semibold text-gray-900 dark:text-white">
                            {formData.refereeIds.length} Referee{formData.refereeIds.length !== 1 ? 's' : ''}, {formData.staffIds.length} Staff
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="mt-4 flex gap-2 flex-wrap">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentStep(1)}
                      className="text-blue-600 hover:text-blue-700 dark:text-blue-400"
                    >
                      Edit Match Setup
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentStep(2)}
                      className="text-blue-600 hover:text-blue-700 dark:text-blue-400"
                    >
                      Edit Stadium
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentStep(3)}
                      className="text-blue-600 hover:text-blue-700 dark:text-blue-400"
                    >
                      Edit Schedule
                    </Button>
                    {formData.matchType === 'official' && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentStep(4)}
                        className="text-blue-600 hover:text-blue-700 dark:text-blue-400"
                      >
                        Edit Officials
                      </Button>
                    )}
                  </div>
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
                      Split between {formData.teamSize * 2} players (both teams)
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
          </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between pt-6 border-t dark:border-gray-700">
              {currentStep > 1 ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handlePreviousStep}
                  className="flex items-center gap-2"
                >
                  ← Previous
                </Button>
              ) : (
                <div></div>
              )}

              {currentStep < totalSteps ? (
                <Button
                  type="button"
                  onClick={handleNextStep}
                  disabled={!canProceedToNextStep()}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
                >
                  Next →
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault()
                    handleSubmit(e as any)
                  }}
                  disabled={loading || !formData.selectedClub || !formData.stadiumId}
                  className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Creating Match Request...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Send className="h-5 w-5" />
                      Create Match Request
                    </div>
                  )}
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}