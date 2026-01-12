'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { filterValidImages } from '@/lib/image-compression'
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
import razorpayService, { PaymentResponse, RazorpayService } from '@/services/razorpayService'
import { notifyOpponentClub, notifyStadiumOwner, notifyOwnClubPlayers } from '@/services/matchNotificationService'
import { Capacitor } from '@capacitor/core'
import { useMobileDetection } from '@/hooks/useMobileDetection'
import { MobileMatchCreation } from './mobile-match-creation'
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
 X,
 Camera,
 Zap,
 ChevronLeft,
 ChevronRight,
 AlertCircle,
 CreditCard,
 Lock,
 Banknote
} from 'lucide-react'

interface Club {
 id: string
 name: string
 city: string
 state: string
 district: string
 kyc_verified: boolean
 logo_url?: string
 available_formats?: {
 '5-a-side': boolean
 '7-a-side': boolean
 '11-a-side': boolean
 }
 squad_sizes?: {
 '5-a-side': number
 '7-a-side': number
 '11-a-side': number
 }
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
 is_active: boolean
 photos?: string[]
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
 const { isMobile } = useMobileDetection()
 const [loading, setLoading] = useState(false)
 const [loadingData, setLoadingData] = useState(true)

 // Multi-step wizard state
 const [currentStep, setCurrentStep] = useState<number>(1)
 const totalSteps = 6 // Updated to include payment step
 
 // Payment state
 const [paymentProcessing, setPaymentProcessing] = useState(false)
 const [paymentCompleted, setPaymentCompleted] = useState(false)
 const [paymentResponse, setPaymentResponse] = useState<PaymentResponse | null>(null)
 
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
 const [isLoadingMatches, setIsLoadingMatches] = useState(false) // ✅ Track loading state
 
 // ✅ Use ref to track the current stadium being loaded to prevent race conditions
 const currentLoadingStadiumRef = useRef<string | null>(null)
 
 // Stadium photo navigation state
 const [selectedStadiumPhotos, setSelectedStadiumPhotos] = useState<{[key: string]: number}>({})

 // Navigation functions for stadium photos
 const nextStadiumPhoto = (stadiumId: string, totalPhotos: number, e: React.MouseEvent) => {
 e.preventDefault()
 e.stopPropagation()
 setSelectedStadiumPhotos(prev => ({
 ...prev,
 [stadiumId]: ((prev[stadiumId] || 0) + 1) % totalPhotos
 }))
 }

 const prevStadiumPhoto = (stadiumId: string, totalPhotos: number, e: React.MouseEvent) => {
 e.preventDefault()
 e.stopPropagation()
 setSelectedStadiumPhotos(prev => ({
 ...prev,
 [stadiumId]: ((prev[stadiumId] || 0) - 1 + totalPhotos) % totalPhotos
 }))
 }
 // Search states
 const [clubSearchTerm, setClubSearchTerm] = useState('')
 const [showClubDropdown, setShowClubDropdown] = useState(false)
 
 // Form data with enhanced fields
 const [formData, setFormData] = useState({
 matchFormat: availableFormats[0] || '5-a-side',
 teamId: teams[0]?.id || '',
 selectedClub: null as Club | null,
 matchDate: new Date(),
 matchTime: '', // ✅ No default - user must select
 duration: 1, // hours
 stadiumId: '',
 selectedStadium: null as Stadium | null,
 matchType: 'friendly' as 'friendly' | 'official',
 leagueType: 'hobby' as 'hobby' | 'amateur' | 'intermediate' | 'professional' | 'tournament' | 'friendly' | null, // Friendly=hobby (no officials), Official defaults to 'friendly' but can be other levels
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
 '5-a-side': 1, // 20min/half + 20min buffer = 1 hour
 '7-a-side': 2, // 35min/half + buffer = 2 hours
 '11-a-side': 3 // 45min/half + buffer = 3 hours
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

 // Minimum squad sizes required for each format
 // Following proper football rules for each format
 const MIN_SQUAD_SIZES = {
 '5-a-side': 8, // 5 players + 3 subs minimum
 '7-a-side': 11, // 7 players + 4 subs minimum 
 '11-a-side': 16 // 11 players + 5 subs minimum
 }

 // Load active clubs with their teams (excluding own club)
 // Filter by district first, fallback to city if no district match
 // TODO: Re-enable KYC verification filter for production
 let clubQuery = supabase
 .from('clubs')
 .select(`
 id,
 club_name,
 city,
 state,
 country,
 district,
 logo_url,
 category,
 is_active,
 kyc_verified,
 teams!inner(
 id,
 format,
 total_players
 )
 `)
 .eq('is_active', true)
 // .eq('kyc_verified', true) // TEMPORARILY DISABLED FOR TESTING
 .neq('id', club.id)

 // Apply district/city filtering for PCL match organization
 if (club.district) {
 // District-level filtering (priority)
 clubQuery = clubQuery.eq('district', club.district)
 } else if (club.city) {
 // City-level filtering (fallback)
 clubQuery = clubQuery.eq('city', club.city)
 }

 const { data: clubsData, error: clubsError } = await clubQuery.order('club_name', { ascending: true })

 console.log('🔍 DEBUG: Raw clubs from query:', {
 count: clubsData?.length || 0,
 error: clubsError,
 rawClubsData: clubsData,
 clubs: clubsData?.map(c => ({
 name: c.club_name,
 district: c.district,
 teams: c.teams
 }))
 })

 // Group clubs by ID since teams!inner returns one row per team
 const clubsMap = new Map<string, any>()
 clubsData?.forEach(row => {
 if (!clubsMap.has(row.id)) {
 clubsMap.set(row.id, {
 ...row,
 teams: []
 })
 }
 if (row.teams && !Array.isArray(row.teams)) {
 // Single team object - convert to array
 clubsMap.get(row.id).teams.push(row.teams)
 } else if (row.teams && Array.isArray(row.teams)) {
 // Already an array
 clubsMap.get(row.id).teams = row.teams
 }
 })
 const groupedClubsData = Array.from(clubsMap.values())

 console.log('🔍 DEBUG: Grouped clubs:', {
 count: groupedClubsData.length,
 clubs: groupedClubsData.map(c => ({
 name: c.club_name,
 district: c.district,
 teamsCount: c.teams?.length || 0,
 teams: c.teams
 }))
 })

 // Transform and enrich club data with format availability
 const transformedClubs = groupedClubsData?.map(c => {
 // Group teams by format and sum players
 const formatData = {
 '5-a-side': { hasTeam: false, totalPlayers: 0 },
 '7-a-side': { hasTeam: false, totalPlayers: 0 },
 '11-a-side': { hasTeam: false, totalPlayers: 0 }
 }

 // Process teams - intelligent format eligibility based on squad size
 // A club with X players can play in any format they have enough players for
 if (c.teams && Array.isArray(c.teams)) {
 c.teams.forEach((team: any) => {
 console.log(`🔍 TEAM DEBUG for ${c.club_name}:`, {
 teamName: team.team_name,
 originalFormat: team.format,
 totalPlayers: team.total_players,
 willCheckEligibilityFor: 'all formats based on squad size'
 })
 
 const teamPlayers = team.total_players || 0
 
 // Smart eligibility: Check which formats this team can actually play
 // A team with 8 players can play 5-a-side and 7-a-side (but not 11-a-side)
 if (teamPlayers >= MIN_SQUAD_SIZES['5-a-side']) {
 formatData['5-a-side'].hasTeam = true
 formatData['5-a-side'].totalPlayers = Math.max(formatData['5-a-side'].totalPlayers, teamPlayers)
 }
 if (teamPlayers >= MIN_SQUAD_SIZES['7-a-side']) {
 formatData['7-a-side'].hasTeam = true
 formatData['7-a-side'].totalPlayers = Math.max(formatData['7-a-side'].totalPlayers, teamPlayers)
 }
 if (teamPlayers >= MIN_SQUAD_SIZES['11-a-side']) {
 formatData['11-a-side'].hasTeam = true
 formatData['11-a-side'].totalPlayers = Math.max(formatData['11-a-side'].totalPlayers, teamPlayers)
 }
 
 console.log(`✅ Smart format eligibility for ${teamPlayers} players:`, {
 '5-a-side': teamPlayers >= MIN_SQUAD_SIZES['5-a-side'] ? 'ELIGIBLE' : 'not eligible',
 '7-a-side': teamPlayers >= MIN_SQUAD_SIZES['7-a-side'] ? 'ELIGIBLE' : 'not eligible', 
 '11-a-side': teamPlayers >= MIN_SQUAD_SIZES['11-a-side'] ? 'ELIGIBLE' : 'not eligible',
 formatData
 })
 })
 }
 
 // Calculate available formats
 const availableFormats = {
 '5-a-side': formatData['5-a-side'].hasTeam && formatData['5-a-side'].totalPlayers >= MIN_SQUAD_SIZES['5-a-side'],
 '7-a-side': formatData['7-a-side'].hasTeam && formatData['7-a-side'].totalPlayers >= MIN_SQUAD_SIZES['7-a-side'],
 '11-a-side': formatData['11-a-side'].hasTeam && formatData['11-a-side'].totalPlayers >= MIN_SQUAD_SIZES['11-a-side']
 }
 
 console.log(`🎯 SMART ELIGIBILITY RESULT for ${c.club_name}:`, {
 availableFormats,
 explanation: 'Club eligible for formats based on actual squad size, not just team format setting',
 hasAnyAvailableFormat: Object.values(availableFormats).some(available => available)
 })

 return {
 id: c.id,
 name: c.club_name,
 city: c.city,
 state: c.state,
 district: c.district || c.city,
 kyc_verified: c.kyc_verified,
 logo_url: c.logo_url,
 category: c.category,
 available_formats: availableFormats,
 squad_sizes: {
 '5-a-side': formatData['5-a-side'].totalPlayers,
 '7-a-side': formatData['7-a-side'].totalPlayers,
 '11-a-side': formatData['11-a-side'].totalPlayers
 }
 }
 }) || []

 console.log('🔍 DEBUG: Transformed clubs:', {
 count: transformedClubs.length,
 clubs: transformedClubs.map(c => ({
 name: c.name,
 district: c.district,
 squadSizes: c.squad_sizes,
 availableFormats: c.available_formats
 }))
 })

 // Filter clubs that have at least one format available
 const clubsWithTeams = transformedClubs.filter(club => {
 const hasAnyFormat = club.available_formats?.['5-a-side'] ||
 club.available_formats?.['7-a-side'] ||
 club.available_formats?.['11-a-side']
 
 console.log(`🎯 FILTER CHECK for ${club.name}:`, {
 availableFormats: club.available_formats,
 hasAnyFormat,
 willBeIncluded: hasAnyFormat
 })
 
 return hasAnyFormat
 })

 console.log('🔍 DEBUG: Final filtered clubs:', {
 count: clubsWithTeams.length,
 minSquadSizes: MIN_SQUAD_SIZES,
 clubs: clubsWithTeams.map(c => ({
 name: c.name,
 district: c.district,
 availableFormats: c.available_formats
 }))
 })

 setAvailableClubs(clubsWithTeams)

 // Load stadiums - filter by district/city for PCL match organization
 // Get all active stadiums first, then filter client-side for flexibility
 let stadiumQuery = supabase
 .from('stadiums')
 .select('id, stadium_name, location, district, city, state, hourly_rate, amenities, is_active')
 .eq('is_active', true)

 const { data: allStadiumsData, error: stadiumsError } = await stadiumQuery
 
 // Smart filtering: Match by district first, then by city, then include all as fallback
 let stadiumsData: typeof allStadiumsData = allStadiumsData || []
 let filterStrategy = 'none'
 
 if (club.district && allStadiumsData && allStadiumsData.length > 0) {
 // Try district-level filtering first
 const districtMatches = allStadiumsData.filter(s => 
 s.district && s.district.toLowerCase() === club.district.toLowerCase()
 )
 if (districtMatches.length > 0) {
 stadiumsData = districtMatches
 filterStrategy = `district (${club.district})`
 } else if (club.city) {
 // Fall back to city matching
 const cityMatches = allStadiumsData.filter(s =>
 s.city && s.city.toLowerCase() === club.city.toLowerCase()
 )
 if (cityMatches.length > 0) {
 stadiumsData = cityMatches
 filterStrategy = `city (${club.city})`
 } else {
 // Include all stadiums as last resort
 stadiumsData = allStadiumsData
 filterStrategy = 'all stadiums (no district/city match)'
 }
 } else {
 // No city available, include all
 stadiumsData = allStadiumsData
 filterStrategy = 'all stadiums (no city fallback)'
 }
 } else if (club.city && allStadiumsData && allStadiumsData.length > 0) {
 // City-level filtering
 const cityMatches = allStadiumsData.filter(s =>
 s.city && s.city.toLowerCase() === club.city.toLowerCase()
 )
 stadiumsData = cityMatches.length > 0 ? cityMatches : allStadiumsData
 filterStrategy = cityMatches.length > 0 ? `city (${club.city})` : 'all stadiums'
 } else {
 stadiumsData = allStadiumsData || []
 filterStrategy = 'all stadiums (no filters available)'
 }
 
 console.log('🔍 DEBUG: Stadiums query result:', {
 userClub: {
 id: club.id,
 name: club.club_name,
 district: club.district,
 city: club.city
 },
 totalStadiums: allStadiumsData?.length || 0,
 filteredCount: stadiumsData?.length || 0,
 filterStrategy,
 error: stadiumsError,
 stadiums: stadiumsData?.map(s => ({
 name: s.stadium_name,
 location: s.location,
 district: s.district,
 city: s.city,
 isActive: s.is_active
 }))
 })

 // Transform stadiums to use amenities as facilities
 const transformedStadiums: Stadium[] = stadiumsData?.map(s => ({
 ...s,
 facilities: s.amenities || [],
 district: s.district || s.city || s.state || 'Unknown',
 photos: [] // Initialize empty photos array
 })) || []

 console.log('🔍 DEBUG: Transformed stadiums:', {
 count: transformedStadiums.length,
 stadiums: transformedStadiums.map(s => ({
 name: s.stadium_name,
 location: s.location,
 district: s.district,
 facilities: s.facilities
 }))
 })

 // Fetch stadium photos for display
 let stadiumsWithPhotos = transformedStadiums
 if (transformedStadiums.length > 0) {
 const stadiumIds = transformedStadiums.map(s => s.id)
 const { data: stadiumPhotos } = await supabase
 .from('stadium_photos')
 .select('stadium_id, photo_data')
 .in('stadium_id', stadiumIds)
 .order('display_order', { ascending: true })

 // Create a map of stadium_id to photos array
 const photosMap = new Map<string, string[]>()
 if (stadiumPhotos) {
 stadiumPhotos.forEach(photo => {
 if (!photosMap.has(photo.stadium_id)) {
 photosMap.set(photo.stadium_id, [])
 }
 // Enhanced validation to prevent invalid base64 images
 const photoData = photo.photo_data
 if (photoData && 
 photoData.startsWith('data:image/') && 
 photoData.includes(';base64,') &&
 photoData.split(',')[1] && 
 photoData.split(',')[1] !== '=' && 
 photoData.split(',')[1] !== '==') {
 photosMap.get(photo.stadium_id)!.push(photoData)
 }
 })
 }

 // Attach photos to stadiums
 stadiumsWithPhotos = transformedStadiums.map(stadium => ({
 ...stadium,
 photos: photosMap.get(stadium.id) || []
 }))

 console.log('📸 DEBUG: Stadium photos loaded:', {
 totalPhotos: stadiumPhotos?.length || 0,
 stadiumsWithPhotos: stadiumsWithPhotos.map(s => ({
 name: s.stadium_name,
 photoCount: s.photos?.length || 0
 }))
 })
 }

 setAvailableStadiums(stadiumsWithPhotos)

 // Load referees - filter by district/city through users table
 // Note: Try to select city/district but fall back gracefully if migration not applied yet
 const { data: refereesData, error: refereesError } = await supabase
 .from('referees')
 .select(`
 id, unique_referee_id, certification_level, hourly_rate, is_available,
 users!inner(first_name, last_name, city, district)
 `)
 .eq('is_available', true)

 // If query fails (possibly due to missing columns), try without city/district
 let formattedReferees: any[] = []
 if (refereesError) {
 console.warn('Could not load referees with location data, falling back:', refereesError.message)
 const { data: fallbackReferees } = await supabase
 .from('referees')
 .select(`
 id, unique_referee_id, certification_level, hourly_rate, is_available,
 users!inner(first_name, last_name)
 `)
 .eq('is_available', true)

 formattedReferees = fallbackReferees?.map(ref => ({
 ...ref,
 users: Array.isArray(ref.users) ? ref.users[0] : ref.users
 })) || []
 } else {
 // Format referees first
 formattedReferees = refereesData?.map(ref => ({
 ...ref,
 users: Array.isArray(ref.users) ? ref.users[0] : ref.users
 })) || []

 // Apply district/city filtering in JavaScript (PostgREST doesn't support nested filtering)
 if (club.district) {
 // District-level filtering (priority)
 formattedReferees = formattedReferees.filter(ref =>
 ref.users && (ref.users as any).district === club.district
 )
 } else if (club.city) {
 // City-level filtering (fallback)
 formattedReferees = formattedReferees.filter(ref =>
 ref.users && (ref.users as any).city === club.city
 )
 }
 }

 setAvailableReferees(formattedReferees as Referee[])

 // Load staff - filter by district/city through users table
 // Note: Try to select city/district but fall back gracefully if migration not applied yet
 const { data: staffData, error: staffError } = await supabase
 .from('staff')
 .select(`
 id, unique_staff_id, role_type, hourly_rate, is_available,
 users!inner(first_name, last_name, city, district)
 `)
 .eq('is_available', true)

 // If query fails (possibly due to missing columns), try without city/district
 let formattedStaff: any[] = []
 if (staffError) {
 console.warn('Could not load staff with location data, falling back:', staffError.message)
 const { data: fallbackStaff } = await supabase
 .from('staff')
 .select(`
 id, unique_staff_id, role_type, hourly_rate, is_available,
 users!inner(first_name, last_name)
 `)
 .eq('is_available', true)

 formattedStaff = fallbackStaff?.map(staff => ({
 ...staff,
 users: Array.isArray(staff.users) ? staff.users[0] : staff.users
 })) || []
 } else {
 // Format staff first
 formattedStaff = staffData?.map(staff => ({
 ...staff,
 users: Array.isArray(staff.users) ? staff.users[0] : staff.users
 })) || []

 // Apply district/city filtering in JavaScript (PostgREST doesn't support nested filtering)
 if (club.district) {
 // District-level filtering (priority)
 formattedStaff = formattedStaff.filter(staff =>
 staff.users && (staff.users as any).district === club.district
 )
 } else if (club.city) {
 // City-level filtering (fallback)
 formattedStaff = formattedStaff.filter(staff =>
 staff.users && (staff.users as any).city === club.city
 )
 }
 }

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
 // ✅ Set loading state at the start
 setIsLoadingMatches(true)

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
 setIsLoadingMatches(false) // ✅ Clear loading state
 currentLoadingStadiumRef.current = null
 return
 }

 // ✅ Capture current stadium ID to prevent race conditions
 const currentStadiumId = formData.stadiumId
 currentLoadingStadiumRef.current = currentStadiumId
 
 console.log('🔄 Loading matches for stadium:', currentStadiumId)

 const supabase = createClient()
 const dateStr = format(selectedDate, 'yyyy-MM-dd')

 // ✅ Fetch matches scheduled on this stadium for the selected date (exclude cancelled matches)
 const { data: matches, error: matchesError } = await supabase
 .from('matches')
 .select('id, match_date, match_time, match_format')
 .eq('stadium_id', formData.stadiumId)
 .eq('match_date', dateStr)
 .in('status', ['scheduled', 'ongoing'])
 .is('canceled_at', null)

 if (matchesError) {
 console.error('❌ Error fetching scheduled matches:', matchesError)
 // Continue with empty matches to show all slots as available
 }

 // Calculate match duration based on format
 const getMatchDuration = (matchFormat: string): number => {
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
 // ✅ Check if stadium hasn't changed during async operation (using both state and ref)
 if (currentStadiumId !== formData.stadiumId || currentLoadingStadiumRef.current !== currentStadiumId) {
 console.log('⚠️ Stadium changed during async load - ignoring stale data for:', currentStadiumId)
 return
 }

 setScheduledMatches(matches)
 const blockedSlots: string[] = []

 console.log('🔍 Found existing matches:', matches.length)

 // Calculate blocked time slots based on scheduled matches
 matches.forEach((match: any) => {
 const [hours, minutes] = match.match_time.split(':').map(Number)
 const matchDuration = getMatchDuration(match.match_format)

 console.log(`⏰ Blocking slots for ${match.match_format} match at ${hours}:00 (${matchDuration} hours)`)

 // Block all hours covered by this match
 for (let i = 0; i < matchDuration; i++) {
 const blockedHour = hours + i
 if (blockedHour < 24) {
 const timeSlot = `${String(blockedHour).padStart(2, '0')}:00`
 blockedSlots.push(timeSlot)
 console.log(` 🚫 Blocking: ${timeSlot}`)
 }
 }
 })

 const uniqueBlockedSlots = [...new Set(blockedSlots)]
 setBlockedTimeSlots(uniqueBlockedSlots)

 console.log('🚫 Total blocked slots:', uniqueBlockedSlots)

 // Generate available time slots
 const availableSlots = allSlots.filter(slot => !uniqueBlockedSlots.includes(slot))
 setAvailableTimeSlots(availableSlots)
 
 console.log('✅ Available slots:', availableSlots.length)
 } else {
 // ✅ Check if stadium hasn't changed during async operation (using both state and ref)
 if (currentStadiumId !== formData.stadiumId || currentLoadingStadiumRef.current !== currentStadiumId) {
 console.log('⚠️ Stadium changed during async load - ignoring stale data for:', currentStadiumId)
 return
 }

 console.log('✅ No existing matches - all slots available for:', currentStadiumId)
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
 } finally {
 // ✅ Always clear loading state when done (success or error)
 setIsLoadingMatches(false)
 }
 }

 // Load time slots when date changes
 useEffect(() => {
 loadScheduledMatches()
 }, [selectedDate, formData.stadiumId])

 // Recalculate budget when relevant form data changes
 useEffect(() => {
 calculateBudget()
 }, [formData.selectedStadium, formData.duration, formData.refereeIds, formData.staffIds, formData.teamSize])

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

 const handlePayment = async () => {
 if (paymentProcessing || paymentCompleted) return

 // Debug information
 console.log('=== PAYMENT DEBUG INFO ===')
 console.log('Platform:', {
 isNativePlatform: Capacitor.isNativePlatform(),
 platform: Capacitor.getPlatform(),
 userAgent: navigator.userAgent
 })
 console.log('Budget:', budget)
 console.log('Environment:', {
 razorpayKeyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID?.substring(0, 8) + '...',
 mode: process.env.NEXT_PUBLIC_RAZORPAY_MODE
 })

 setPaymentProcessing(true)

 try {
 const amount = RazorpayService.rupeesToPaise(budget.totalCost)
 const receipt = RazorpayService.generateReceipt('MATCH')
 
 console.log('Payment data:', { amount, receipt })
 
 const paymentData = {
 amount: amount,
 currency: 'INR',
 receipt: receipt,
 description: `Match booking - ${formData.matchFormat} at ${formData.selectedStadium?.stadium_name}`,
 customer: {
 name: club.name,
 email: club.contact_email || 'owner@example.com',
 contact: club.contact_phone || '9999999999'
 },
 notes: {
 match_format: formData.matchFormat,
 stadium_id: formData.stadiumId,
 club_id: club.id,
 match_date: selectedDate ? format(selectedDate, 'yyyy-MM-dd') : '',
 match_time: formData.matchTime
 }
 }

 console.log('Initiating payment with razorpayService...')
 
 await razorpayService.processPayment(
 paymentData,
 (response: PaymentResponse) => {
 console.log('=== PAYMENT SUCCESS ===')
 console.log('Payment successful:', response)
 setPaymentResponse(response)
 setPaymentCompleted(true)
 setPaymentProcessing(false)
 
 addToast({
 title: 'Payment Successful',
 description: 'Payment completed successfully. Creating match...',
 type: 'success'
 })

 // Automatically proceed to match creation using the response directly
 console.log('🚀 Starting automatic match creation in 1 second...')
 setTimeout(() => {
 console.log('🔄 Calling createMatchAfterPayment() automatically with direct response...')
 createMatchAfterPaymentDirect(response)
 }, 1000)
 },
 (error: any) => {
 console.error('=== PAYMENT ERROR ===')
 console.error('Payment failed:', error)
 setPaymentProcessing(false)
 
 addToast({
 title: 'Payment Failed',
 description: error.message || 'Payment was cancelled or failed. Please try again.',
 type: 'error'
 })
 }
 )

 } catch (error: any) {
 console.error('=== PAYMENT PROCESSING ERROR ===')
 console.error('Payment processing error:', error)
 setPaymentProcessing(false)
 
 addToast({
 title: 'Payment Error',
 description: error.message || 'Failed to process payment. Please try again.',
 type: 'error'
 })
 }
 }

 const createMatchAfterPayment = async (directPaymentResponse?: PaymentResponse) => {
 // Use direct payment response if provided, otherwise use state
 const activePaymentResponse = directPaymentResponse || paymentResponse
 const activePaymentCompleted = directPaymentResponse ? true : paymentCompleted
 
 console.log('🎯 createMatchAfterPayment() called - paymentCompleted:', activePaymentCompleted, 'paymentResponse:', !!activePaymentResponse)
 console.log('📋 Direct response provided:', !!directPaymentResponse, 'State response exists:', !!paymentResponse)
 
 if (!activePaymentCompleted || !activePaymentResponse) {
 console.log('❌ Payment verification failed - paymentCompleted:', activePaymentCompleted, 'paymentResponse exists:', !!activePaymentResponse)
 addToast({
 title: 'Error',
 description: 'Payment verification required before creating match.',
 type: 'error'
 })
 return
 }

 console.log('✅ Payment verified, starting match creation...')
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

 // Validate official match requirements
 if (formData.matchType === 'official') {
 if (!formData.refereeIds || formData.refereeIds.length === 0) {
 throw new Error('Official matches require at least one referee. Please select a referee in Step 4.')
 }
 if (!formData.staffIds || formData.staffIds.length === 0) {
 throw new Error('Official matches require at least one staff member. Please select staff in Step 4.')
 }
 }

 // ✅ SERVER-SIDE VALIDATION: Check for stadium conflicts
 const matchDate = format(selectedDate, 'yyyy-MM-dd')
 const matchTimeHour = parseInt(formData.matchTime.split(':')[0])
 
 // Calculate match duration based on format
 const MATCH_DURATIONS: Record<string, number> = {
 '5-a-side': 1, // 1 hour
 '7-a-side': 2, // 2 hours
 '11-a-side': 3 // 3 hours
 }
 const matchDuration = MATCH_DURATIONS[formData.matchFormat as keyof typeof MATCH_DURATIONS] || 1

 // Fetch existing matches for this stadium on this date
 const { data: existingMatches, error: conflictCheckError } = await supabase
 .from('matches')
 .select('id, match_time, match_format')
 .eq('stadium_id', formData.stadiumId)
 .eq('match_date', matchDate)
 .eq('status', 'scheduled')

 if (conflictCheckError) {
 console.error('Error checking stadium conflicts:', conflictCheckError)
 throw new Error('Unable to verify stadium availability. Please try again.')
 }

 // Check for time slot conflicts
 if (existingMatches && existingMatches.length > 0) {
 for (const existingMatch of existingMatches) {
 const existingStartHour = parseInt(existingMatch.match_time.split(':')[0])
 const existingDuration = MATCH_DURATIONS[existingMatch.match_format as keyof typeof MATCH_DURATIONS] || 1

 // Check if time slots overlap
 const newMatchEnd = matchTimeHour + matchDuration
 const existingMatchEnd = existingStartHour + existingDuration

 if (
 (matchTimeHour >= existingStartHour && matchTimeHour < existingMatchEnd) ||
 (newMatchEnd > existingStartHour && newMatchEnd <= existingMatchEnd) ||
 (matchTimeHour <= existingStartHour && newMatchEnd >= existingMatchEnd)
 ) {
 const conflictTimeRange = `${String(existingStartHour).padStart(2, '0')}:00 - ${String(existingMatchEnd).padStart(2, '0')}:00`
 throw new Error(
 `Stadium already booked from ${conflictTimeRange} on this date. Please select a different time slot or stadium.`
 )
 }
 }
 }

 console.log(`✅ STADIUM VALIDATION: No conflicts found for ${formData.matchTime} on ${matchDate}`)

 // Get the home team details and validate it can play this format
 const { data: homeTeam } = await supabase
 .from('teams')
 .select('*')
 .eq('id', formData.teamId)
 .single()

 if (!homeTeam) throw new Error('Team not found')

 // Validate home team has enough players for selected format
 const MIN_SQUAD_SIZES: Record<string, number> = {
 '5-a-side': 8,
 '7-a-side': 11,
 '11-a-side': 16
 }

 const minRequired = MIN_SQUAD_SIZES[formData.matchFormat as keyof typeof MIN_SQUAD_SIZES]
 if ((homeTeam.total_players || 0) < minRequired) {
 throw new Error(
 `Your team "${homeTeam.team_name}" has only ${homeTeam.total_players} players. Minimum ${minRequired} required for ${formData.matchFormat}.`
 )
 }

 console.log(`🎯 HOME TEAM VALIDATION: ${homeTeam.team_name} (${homeTeam.total_players} players) is eligible for ${formData.matchFormat}`)

 // For friendly matches, we need an away team with matching format
 let awayTeamId = null

 if (formData.selectedClub?.id) {
 // Smart team selection: Find any team with enough players for the selected format
 // Rather than requiring exact format match
 const { data: availableTeams, error: teamsError } = await supabase
 .from('teams')
 .select('*')
 .eq('club_id', formData.selectedClub.id)
 .eq('is_active', true)

 if (teamsError || !availableTeams || availableTeams.length === 0) {
 throw new Error(
 `${formData.selectedClub.name} does not have any active teams. Please select a different opponent.`
 )
 }

 // Find the team with most players that meets the minimum requirement
 const eligibleTeams = availableTeams.filter(team => 
 (team.total_players || 0) >= minRequired
 )

 if (eligibleTeams.length === 0) {
 const bestTeam = availableTeams.reduce((prev, curr) => 
 (curr.total_players || 0) > (prev.total_players || 0) ? curr : prev
 )
 throw new Error(
 `${formData.selectedClub.name}'s best team has only ${bestTeam.total_players} players. Minimum ${minRequired} required for ${formData.matchFormat}.`
 )
 }

 // Select the team with the most players for better match quality
 const selectedTeam = eligibleTeams.reduce((prev, curr) => 
 (curr.total_players || 0) > (prev.total_players || 0) ? curr : prev
 )

 awayTeamId = selectedTeam.id

 console.log(`🎯 TEAM SELECTION: Selected ${selectedTeam.team_name} (${selectedTeam.total_players} players) for ${formData.matchFormat} match`)
 } else {
 throw new Error('Please select an opponent club.')
 }

 // Final check - ensure teams are different
 if (homeTeam.id === awayTeamId) {
 throw new Error('Home and away teams cannot be the same. Please select a different opponent club.')
 }

 console.log('Match setup - Home Team:', homeTeam.id, 'Away Team:', awayTeamId)

 // Get the payment record ID using the razorpay_order_id (more reliable since webhook uses order_id)
 let paymentRecord = null
 let attemptCount = 0
 const maxAttempts = 5 // Increase attempts for webhook processing time
 
 console.log('🔍 Looking for payment record using order_id:', activePaymentResponse.razorpay_order_id)
 
 while (!paymentRecord && attemptCount < maxAttempts) {
 attemptCount++
 console.log(`🔄 Attempting to find payment record (attempt ${attemptCount}/${maxAttempts})...`)
 
 const { data, error } = await supabase
 .from('payments')
 .select('id, status, razorpay_payment_id')
 .eq('razorpay_order_id', activePaymentResponse.razorpay_order_id)
 .single()
 
 if (data && !error) {
 console.log('✅ Payment record found:', {
 id: data.id,
 status: data.status,
 razorpay_payment_id: data.razorpay_payment_id
 })
 
 // Verify the payment is completed (webhook should have updated this)
 if (data.status === 'completed') {
 paymentRecord = data
 break
 } else {
 console.log(`⏳ Payment record found but status is '${data.status}', waiting for webhook...`)
 }
 }
 
 if (attemptCount < maxAttempts) {
 console.log('💤 Payment record not ready, waiting 2 seconds before retry...')
 await new Promise(resolve => setTimeout(resolve, 2000)) // Longer wait for webhook
 } else {
 console.error('❌ Final attempt failed. Error:', error)
 throw new Error(`Could not find completed payment record for order_id: ${activePaymentResponse.razorpay_order_id}. Webhook processing may be delayed - please try again.`)
 }
 }

 // Final check - ensure we have a payment record
 if (!paymentRecord) {
 throw new Error(`Could not find completed payment record for order_id: ${activePaymentResponse.razorpay_order_id}. Webhook processing may be delayed - please try again.`)
 }

 console.log('✅ Found completed payment record:', paymentRecord.id, 'for order_id:', activePaymentResponse.razorpay_order_id)

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
 match_type: formData.matchType, // Save friendly vs official
 league_structure: formData.leagueType, // Friendly matches save 'friendly', official matches save hobby/amateur/etc
 status: 'scheduled',
 created_by: userData.user.id,
 payment_id: paymentRecord.id // Use payment table UUID, not razorpay_payment_id
 }
 ])
 .select()

 if (matchError) throw matchError
 if (!matchData || matchData.length === 0) throw new Error('Failed to create match')

 const createdMatch = matchData[0]
 console.log('Match created:', createdMatch.id, 'Home:', createdMatch.home_team_id, 'Away:', createdMatch.away_team_id, 'Payment:', activePaymentResponse.razorpay_payment_id)

 // Update payment record with match_id and stadium_id
 const { error: paymentUpdateError } = await supabase
 .from('payments')
 .update({ 
 match_id: createdMatch.id,
 stadium_id: formData.stadiumId
 })
 .eq('id', paymentRecord.id)

 if (paymentUpdateError) {
 console.error('Warning: Failed to update payment record with match_id and stadium_id:', paymentUpdateError)
 // Don't throw error here - match is already created successfully
 } else {
 console.log('✅ Payment record updated with match_id:', createdMatch.id, 'and stadium_id:', formData.stadiumId)
 }

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

 // Send comprehensive notifications
 const notificationPromises: Promise<void>[] = []
 
 // 1. Notify opponent club owner
 if (formData.selectedClub?.id) {
   notificationPromises.push(
     notifyOpponentClub(
       formData.selectedClub.id,
       club.name,
       selectedDate.toISOString(),
       formData.matchFormat
     )
   )
 }

 // 2. Notify stadium owner
 if (formData.selectedStadium?.id) {
   notificationPromises.push(
     notifyStadiumOwner(
       formData.selectedStadium.id,
       club.name,
       formData.selectedClub?.name || 'TBD',
       selectedDate.toISOString(),
       formData.matchTime,
       formData.matchFormat
     )
   )
 }

 // 3. Notify own club players
 if (formData.teamId) {
   notificationPromises.push(
     notifyOwnClubPlayers(
       club.id,
       formData.teamId,
       formData.selectedClub?.name || 'TBD',
       selectedDate.toISOString(),
       formData.matchTime,
       createdMatch.id,
       formData.matchFormat
     )
   )
 }

 // Execute all notifications
 await Promise.allSettled(notificationPromises)

 addToast({
 title: 'Success',
 description: 'Match created successfully with payment confirmation!',
 type: 'success'
 })

 console.log('Match created successfully with payment:', activePaymentResponse.razorpay_payment_id)
 onSuccess()
 
 } catch (error: any) {
 console.error('Error creating match after payment:', error)
 addToast({
 title: 'Error',
 description: error.message || 'Failed to create match after payment',
 type: 'error'
 })
 } finally {
 setLoading(false)
 }
 }

 // Direct version that takes payment response as parameter (avoids React state timing issues)
 const createMatchAfterPaymentDirect = async (paymentRes: PaymentResponse) => {
 console.log('🎯 createMatchAfterPaymentDirect() called with payment:', paymentRes.razorpay_payment_id)
 
 if (!paymentRes) {
 console.log('❌ Direct payment verification failed - no payment response')
 addToast({
 title: 'Error',
 description: 'Payment verification required before creating match.',
 type: 'error'
 })
 return
 }

 console.log('✅ Direct payment verified, calling createMatchAfterPayment with direct response...')
 
 // Call the original function with the direct payment response
 await createMatchAfterPayment(paymentRes)
 }

 const handleSubmit = async (e: React.FormEvent) => {
 e.preventDefault()
 
 // For payment step (step 6), handle payment
 if (currentStep === 6) {
 await handlePayment()
 return
 }
 
 // For other steps, just proceed to next step
 if (currentStep < totalSteps) {
 setCurrentStep(currentStep + 1)
 }
 }

 const originalHandleSubmit = async (e: React.FormEvent) => {
 e.preventDefault()
 
 // Prevent double submission
 if (loading) {
 console.log('⏸️ Submission already in progress, ignoring duplicate click')
 return
 }
 
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

 // Validate official match requirements
 if (formData.matchType === 'official') {
 if (!formData.refereeIds || formData.refereeIds.length === 0) {
 throw new Error('Official matches require at least one referee. Please select a referee in Step 4.')
 }
 if (!formData.staffIds || formData.staffIds.length === 0) {
 throw new Error('Official matches require at least one staff member. Please select staff in Step 4.')
 }
 }

 // ✅ SERVER-SIDE VALIDATION: Check for stadium conflicts
 const matchDate = format(selectedDate, 'yyyy-MM-dd')
 const matchTimeHour = parseInt(formData.matchTime.split(':')[0])
 
 // Calculate match duration based on format
 const MATCH_DURATIONS: Record<string, number> = {
 '5-a-side': 1, // 1 hour
 '7-a-side': 2, // 2 hours
 '11-a-side': 3 // 3 hours
 }
 const matchDuration = MATCH_DURATIONS[formData.matchFormat as keyof typeof MATCH_DURATIONS] || 1

 // Fetch existing matches for this stadium on this date
 const { data: existingMatches, error: conflictCheckError } = await supabase
 .from('matches')
 .select('id, match_time, match_format')
 .eq('stadium_id', formData.stadiumId)
 .eq('match_date', matchDate)
 .eq('status', 'scheduled')

 if (conflictCheckError) {
 console.error('Error checking stadium conflicts:', conflictCheckError)
 throw new Error('Unable to verify stadium availability. Please try again.')
 }

 // Check for time slot conflicts
 if (existingMatches && existingMatches.length > 0) {
 for (const existingMatch of existingMatches) {
 const existingStartHour = parseInt(existingMatch.match_time.split(':')[0])
 const existingDuration = MATCH_DURATIONS[existingMatch.match_format as keyof typeof MATCH_DURATIONS] || 1

 // Check if time slots overlap
 const newMatchEnd = matchTimeHour + matchDuration
 const existingMatchEnd = existingStartHour + existingDuration

 if (
 (matchTimeHour >= existingStartHour && matchTimeHour < existingMatchEnd) ||
 (newMatchEnd > existingStartHour && newMatchEnd <= existingMatchEnd) ||
 (matchTimeHour <= existingStartHour && newMatchEnd >= existingMatchEnd)
 ) {
 const conflictTimeRange = `${String(existingStartHour).padStart(2, '0')}:00 - ${String(existingMatchEnd).padStart(2, '0')}:00`
 throw new Error(
 `Stadium already booked from ${conflictTimeRange} on this date. Please select a different time slot or stadium.`
 )
 }
 }
 }

 console.log(`✅ STADIUM VALIDATION: No conflicts found for ${formData.matchTime} on ${matchDate}`)

 // Get the home team details and validate it can play this format
 const { data: homeTeam } = await supabase
 .from('teams')
 .select('*')
 .eq('id', formData.teamId)
 .single()

 if (!homeTeam) throw new Error('Team not found')

 // Validate home team has enough players for selected format
 const MIN_SQUAD_SIZES: Record<string, number> = {
 '5-a-side': 8,
 '7-a-side': 11,
 '11-a-side': 16
 }

 const minRequired = MIN_SQUAD_SIZES[formData.matchFormat as keyof typeof MIN_SQUAD_SIZES]
 if ((homeTeam.total_players || 0) < minRequired) {
 throw new Error(
 `Your team "${homeTeam.team_name}" has only ${homeTeam.total_players} players. Minimum ${minRequired} required for ${formData.matchFormat}.`
 )
 }

 console.log(`🎯 HOME TEAM VALIDATION: ${homeTeam.team_name} (${homeTeam.total_players} players) is eligible for ${formData.matchFormat}`)

 // For friendly matches, we need an away team with matching format
 let awayTeamId = null

 if (formData.selectedClub?.id) {
 // Smart team selection: Find any team with enough players for the selected format
 // Rather than requiring exact format match
 const { data: availableTeams, error: teamsError } = await supabase
 .from('teams')
 .select('*')
 .eq('club_id', formData.selectedClub.id)
 .eq('is_active', true)

 if (teamsError || !availableTeams || availableTeams.length === 0) {
 throw new Error(
 `${formData.selectedClub.name} does not have any active teams. Please select a different opponent.`
 )
 }

 // Find the team with most players that meets the minimum requirement
 const MIN_SQUAD_SIZES: Record<string, number> = {
 '5-a-side': 8,
 '7-a-side': 11,
 '11-a-side': 16
 }

 const minRequired = MIN_SQUAD_SIZES[formData.matchFormat as keyof typeof MIN_SQUAD_SIZES]
 const eligibleTeams = availableTeams.filter(team => 
 (team.total_players || 0) >= minRequired
 )

 if (eligibleTeams.length === 0) {
 const bestTeam = availableTeams.reduce((prev, curr) => 
 (curr.total_players || 0) > (prev.total_players || 0) ? curr : prev
 )
 throw new Error(
 `${formData.selectedClub.name}'s best team has only ${bestTeam.total_players} players. Minimum ${minRequired} required for ${formData.matchFormat}.`
 )
 }

 // Select the team with the most players for better match quality
 const selectedTeam = eligibleTeams.reduce((prev, curr) => 
 (curr.total_players || 0) > (prev.total_players || 0) ? curr : prev
 )

 awayTeamId = selectedTeam.id

 console.log(`🎯 TEAM SELECTION: Selected ${selectedTeam.team_name} (${selectedTeam.total_players} players) for ${formData.matchFormat} match`)
 } else {
 throw new Error('Please select an opponent club.')
 }

 // Final check - ensure teams are different
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
 match_type: formData.matchType, // Save friendly vs official
 league_structure: formData.leagueType, // Friendly matches save 'friendly', official matches save hobby/amateur/etc
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

 // Send comprehensive notifications
 const notificationPromises: Promise<void>[] = []
 
 // 1. Notify opponent club owner
 if (formData.selectedClub?.id) {
   notificationPromises.push(
     notifyOpponentClub(
       formData.selectedClub.id,
       club.name,
       selectedDate.toISOString(),
       formData.matchFormat
     )
   )
 }

 // 2. Notify stadium owner
 if (formData.selectedStadium?.id) {
   notificationPromises.push(
     notifyStadiumOwner(
       formData.selectedStadium.id,
       club.name,
       formData.selectedClub?.name || 'TBD',
       selectedDate.toISOString(),
       formData.matchTime,
       formData.matchFormat
     )
   )
 }

 // 3. Notify own club players
 if (formData.teamId) {
   notificationPromises.push(
     notifyOwnClubPlayers(
       club.id,
       formData.teamId,
       formData.selectedClub?.name || 'TBD',
       selectedDate.toISOString(),
       formData.matchTime,
       createdMatch.id,
       formData.matchFormat
     )
   )
 }

 // Execute all notifications
 await Promise.allSettled(notificationPromises)

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
 console.log('🏟️ Selecting stadium:', stadium.stadium_name, stadium.id)
 
 // ✅ Clear ref immediately to invalidate any pending loads
 currentLoadingStadiumRef.current = null
 
 setFormData(prev => ({
 ...prev,
 stadiumId: stadium.id,
 selectedStadium: stadium,
 // ✅ Clear matchTime when switching stadiums because each stadium has different booked times
 matchTime: ''
 }))
 // ✅ IMPORTANT: Clear blocked/available time slots immediately when switching stadiums
 // This prevents old stadium's booked slots from showing on new stadium
 setBlockedTimeSlots([])
 setAvailableTimeSlots([])
 setScheduledMatches([])
 
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
 // ✅ Check if stadium is selected AND matches are finished loading
 if (!formData.stadiumId) {
 return false
 }
 
 // ✅ Prevent proceeding if matches are still being loaded
 if (isLoadingMatches) {
 return false
 }
 
 return true
 }

 const validateStep3 = (): boolean => {
 // Check if date and time are selected
 if (!selectedDate || !formData.matchTime) {
 return false
 }
 
 // ✅ NEW: Check if selected time slot is blocked (already booked)
 if (blockedTimeSlots.includes(formData.matchTime)) {
 return false
 }
 
 return true
 }

 const validateStep4 = (): boolean => {
 // For hobby matches, no validation needed
 // For official matches, at least one referee is recommended but not required
 return true
 }

 const validateStep5 = (): boolean => {
 // Budget review step - always valid (just for review)
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
 case 5:
 return validateStep5()
 case 6:
 return paymentCompleted // Can only proceed if payment is completed
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

 // Render mobile-optimized wizard for mobile devices
 if (isMobile) {
 return (
 <MobileMatchCreation
 formData={formData}
 setFormData={setFormData}
 availableFormats={availableFormats}
 teams={teams}
 filteredClubs={filteredClubs}
 filteredStadiums={filteredStadiums}
 availableReferees={availableReferees}
 availableStaff={availableStaff}
 selectedDate={selectedDate}
 setSelectedDate={setSelectedDate}
 blockedTimeSlots={blockedTimeSlots}
 availableTimeSlots={availableTimeSlots}
 isLoadingMatches={isLoadingMatches}
 budget={budget}
 paymentProcessing={paymentProcessing}
 paymentCompleted={paymentCompleted}
 selectClub={selectClub}
 selectStadium={selectStadium}
 toggleReferee={toggleReferee}
 toggleStaff={toggleStaff}
 canSelectTimeSlot={canSelectTimeSlot}
 handlePayment={handlePayment}
 currentStep={currentStep}
 setCurrentStep={setCurrentStep}
 validateStep1={validateStep1}
 validateStep2={validateStep2}
 validateStep3={validateStep3}
 validateStep4={validateStep4}
 validateStep5={validateStep5}
 clubSearchTerm={clubSearchTerm}
 setClubSearchTerm={setClubSearchTerm}
 club={club}
 selectedStadiumPhotos={selectedStadiumPhotos}
 nextStadiumPhoto={nextStadiumPhoto}
 prevStadiumPhoto={prevStadiumPhoto}
 onClose={onSuccess}
 />
 )
 }

 // Desktop version (original UI)
 return (
 <div className="max-w-5xl mx-auto space-y-8">
 <Card className="border-0 shadow-lg bg-gradient-to-r from-white via-gray-50 to-white">
 <CardHeader className="pb-6">
 <div className="flex items-center justify-between">
 <div className="flex items-center gap-3">
 <div className="p-2 bg-blue-100 rounded-lg">
 <Target className="h-6 w-6 text-blue-600" />
 </div>
 <div>
 <CardTitle className="text-2xl font-bold text-gray-900">
 Create Match
 </CardTitle>
 <CardDescription className="text-lg">
 {currentStep === 1 ? '⚙️ Match Setup' :
 currentStep === 2 ? '🏟️ Select Stadium' :
 currentStep === 3 ? '📅 Date & Time' :
 currentStep === 4 ? '👨‍⚖️ Officials & Resources' :
 currentStep === 5 ? '📋 Review & Budget' :
 '💳 Payment & Confirmation'}
 </CardDescription>
 </div>
 </div>
 <div className="text-right">
 <div className="text-sm text-gray-500">Step</div>
 <div className="text-2xl font-bold text-blue-600">{currentStep}</div>
 <div className="text-xs text-gray-400">of {totalSteps}</div>
 </div>
 </div>

 {/* Enhanced Progress Bar */}
 <div className="mt-8">
 <div className="relative">
 {/* Progress background line */}
 <div className="absolute top-5 left-5 right-5 h-1 bg-gray-200 rounded-full"></div>
 {/* Progress active line */}
 <div 
 className="absolute top-5 left-5 h-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-500 ease-in-out"
 style={{ width: `${((currentStep - 1) / (totalSteps - 1)) * 100}%` }}
 ></div>
 
 {/* Step indicators */}
 <div className="relative flex justify-between">
 {[1, 2, 3, 4, 5].map((step) => (
 <div key={step} className="flex flex-col items-center">
 <div className={`
 w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all duration-300 transform border-4
 ${currentStep >= step
 ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white border-white shadow-lg scale-110'
 : currentStep === step - 1
 ? 'bg-white text-blue-500 border-blue-300 shadow-md animate-pulse'
 : 'bg-gray-100 text-gray-400 border-gray-200'
 }
 `}>
 {currentStep > step ? '✓' : step}
 </div>
 <div className={`mt-2 text-center transition-all duration-300 ${currentStep >= step ? 'transform translate-y-0' : 'transform translate-y-1'}`}>
 <span className={`text-xs font-medium block ${
 currentStep >= step 
 ? 'text-blue-600' 
 : 'text-gray-400'
 }`}>
 {step === 1 && 'Setup'}
 {step === 2 && 'Stadium'}
 {step === 3 && 'Schedule'}
 {step === 4 && 'Officials'}
 {step === 5 && 'Review'}
 {step === 6 && 'Payment'}
 </span>
 </div>
 </div>
 ))}
 </div>
 </div>
 </div>
 </CardHeader>
 <CardContent className="pt-6">{/* Remove the duplicate lines */}
 <form onSubmit={handleSubmit} className="space-y-8">
 {/* District/City Level Info Banner */}
 {(club.district || club.city) && currentStep === 1 && (
 <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
 <div className="flex items-start gap-3">
 <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
 <div>
 <h4 className="font-semibold text-blue-900 mb-1">
 {club.district ? 'District-Level Match Organization' : 'City-Level Match Organization'}
 </h4>
 <p className="text-sm text-blue-800 ">
 This match will be organized at the <span className="font-semibold">{club.district || club.city}</span> level.
 All opponent clubs, stadiums, referees, and staff shown are filtered to match your location for PCL matches.
 </p>
 </div>
 </div>
 </div>
 )}

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
 ? 'border-blue-500 bg-blue-50 shadow-md'
 : 'border-gray-200 hover:border-gray-300'
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
 className="w-full p-3 border border-gray-300 rounded-md "
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
 <div className="flex items-center justify-between">
 <h3 className="font-semibold flex items-center gap-2 text-lg">
 <Users className="h-5 w-5" />
 Opponent Club Selection
 </h3>
 {(club.district || club.city) && (
 <Badge className="bg-blue-500 text-white">
 <MapPin className="h-3 w-3 mr-1" />
 {club.district ? `${club.district} District` : `${club.city} City`}
 </Badge>
 )}
 </div>
 
 <div className="space-y-3">
 {/* Filter by Location */}
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200 ">
 <div>
 <Label className="text-sm font-medium">Filter by State</Label>
 <select
 className="w-full mt-1 p-2 border border-gray-300 rounded-md text-sm"
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
 className="w-full mt-1 p-2 border border-gray-300 rounded-md text-sm"
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
 <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
 {filteredClubs.map((club) => {
 const canPlayFormat = club.available_formats?.[formData.matchFormat as keyof typeof club.available_formats]
 const squadSize = club.squad_sizes?.[formData.matchFormat as keyof typeof club.squad_sizes] || 0

 return (
 <div
 key={club.id}
 className={`p-3 cursor-pointer border-b border-gray-100 last:border-0 ${
 canPlayFormat
 ? 'hover:bg-gray-100 '
 : 'opacity-60 hover:bg-red-50 '
 }`}
 onClick={() => canPlayFormat && selectClub(club)}
 >
 <div className="flex items-center justify-between mb-2">
 <div className="flex-1">
 <div className="font-medium flex items-center gap-2">
 {club.name}
 {club.kyc_verified && (
 <Badge className="bg-green-500 text-white text-xs">
 <UserCheck className="h-3 w-3 mr-1" />
 Verified
 </Badge>
 )}
 </div>
 <div className="text-sm text-gray-500">
 {club.city}, {club.district}
 </div>
 </div>
 </div>

 <div className="flex flex-wrap gap-1 mt-2">
 {club.available_formats?.['5-a-side'] && (
 <Badge className="bg-orange-500 text-white text-xs">
 5s ({club.squad_sizes?.['5-a-side']} players)
 </Badge>
 )}
 {club.available_formats?.['7-a-side'] && (
 <Badge className="bg-emerald-500 text-white text-xs">
 7s ({club.squad_sizes?.['7-a-side']} players)
 </Badge>
 )}
 {club.available_formats?.['11-a-side'] && (
 <Badge className="bg-blue-500 text-white text-xs">
 11s ({club.squad_sizes?.['11-a-side']} players)
 </Badge>
 )}

 {!canPlayFormat && (
 <Badge variant="destructive" className="text-xs">
 No {formData.matchFormat} team
 </Badge>
 )}
 </div>
 </div>
 )
 })}
 </div>
 )}
 </div>

 {formData.selectedClub && (
 <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
 <div className="flex items-center gap-3">
 <CheckCircle2 className="h-5 w-5 text-green-600" />
 <div>
 <h4 className="font-semibold text-green-800 ">
 Selected: {formData.selectedClub.name}
 </h4>
 <p className="text-sm text-green-700 ">
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
 formData.matchType === 'friendly'
 ? 'border-green-500 bg-green-50 '
 : 'border-gray-200 hover:border-gray-300'
 }`}
 onClick={() => setFormData({ ...formData, matchType: 'friendly', leagueType: 'hobby' })}
 >
 <div className="text-center">
 <div className="text-2xl mb-2">🏃</div>
 <h4 className="font-semibold">Friendly Match</h4>
 <p className="text-sm text-gray-600 mt-1">
 Hobby level - No officials required
 </p>
 </div>
 </div>

 <div
 className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
 formData.matchType === 'official'
 ? 'border-blue-500 bg-blue-50 '
 : 'border-gray-200 hover:border-gray-300'
 }`}
 onClick={() => setFormData({ ...formData, matchType: 'official', leagueType: 'friendly' })}
 >
 <div className="text-center">
 <div className="text-2xl mb-2">🏆</div>
 <h4 className="font-semibold">Official Match</h4>
 <p className="text-sm text-gray-600 mt-1">
 With officials & staff required
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
 <div className="flex items-center gap-2">
 <h3 className="font-semibold flex items-center gap-2 text-lg">
 <Building className="h-5 w-5 text-purple-600" />
 Select Stadium
 <Badge variant="outline" className="ml-2">{filteredStadiums.length} available</Badge>
 </h3>
 {(club.district || club.city) && (
 <Badge className="bg-blue-500 text-white">
 <MapPin className="h-3 w-3 mr-1" />
 {club.district ? `${club.district} District` : `${club.city} City`}
 </Badge>
 )}
 </div>
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
 {/* Enhanced Selected Stadium Display */}
 {formData.stadiumId && formData.selectedStadium && (
 <div className="relative overflow-hidden bg-gradient-to-r from-purple-50 via-blue-50 to-purple-50 border-2 border-purple-300 rounded-xl shadow-lg mb-6">
 {/* Background Pattern */}
 <div className="absolute inset-0 opacity-10">
 <div className="absolute inset-0" style={{
 backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C5CF2' fill-opacity='0.2'%3E%3Ccircle cx='30' cy='30' r='3'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
 }}></div>
 </div>
 
 <div className="relative p-6">
 <div className="flex items-start gap-6">
 {/* Stadium Icon/Image with Navigation */}
 <div className="flex-shrink-0">
 {formData.selectedStadium.photos && formData.selectedStadium.photos.length > 0 ? (
 <div className="relative w-20 h-20 rounded-xl overflow-hidden border-4 border-white shadow-lg group">
 <img
 src={formData.selectedStadium.photos[selectedStadiumPhotos[formData.selectedStadium.id] || 0]}
 alt={`${formData.selectedStadium?.stadium_name || 'Stadium'} - Photo ${(selectedStadiumPhotos[formData.selectedStadium.id] || 0) + 1}`}
 className="w-full h-full object-cover transition-transform duration-200"
 onError={(e) => {
 e.currentTarget.style.display = 'none'
 }}
 />
 
 {/* Navigation arrows for selected stadium photo */}
 {formData.selectedStadium && formData.selectedStadium.photos && formData.selectedStadium.photos.length > 1 && (
 <>
 <button
 type="button"
 className="absolute left-1 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-1 transition-all duration-200 opacity-0 group-hover:opacity-100 z-10"
 onClick={(e) => prevStadiumPhoto(formData.selectedStadium!.id, formData.selectedStadium!.photos!.length, e)}
 >
 <ChevronLeft className="h-3 w-3" />
 </button>
 <button
 type="button"
 className="absolute right-1 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-1 transition-all duration-200 opacity-0 group-hover:opacity-100 z-10"
 onClick={(e) => nextStadiumPhoto(formData.selectedStadium!.id, formData.selectedStadium!.photos!.length, e)}
 >
 <ChevronRight className="h-3 w-3" />
 </button>
 </>
 )}

 {/* Photo indicator dots */}
 {formData.selectedStadium && formData.selectedStadium.photos && formData.selectedStadium.photos.length > 1 && (
 <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">
 {formData.selectedStadium.photos.map((_, idx) => (
 <div
 key={idx}
 className={`w-1.5 h-1.5 rounded-full transition-all duration-200 ${
 idx === (selectedStadiumPhotos[formData.selectedStadium!.id] || 0)
 ? 'bg-white shadow-lg'
 : 'bg-white/60'
 }`}
 />
 ))}
 </div>
 )}
 </div>
 ) : (
 <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl flex items-center justify-center border-4 border-white shadow-lg">
 <Building className="h-10 w-10 text-white" />
 </div>
 )}
 </div>

 {/* Stadium Details */}
 <div className="flex-1 min-w-0">
 <div className="flex items-start justify-between mb-3">
 <div>
 <div className="flex items-center gap-3 mb-1">
 <h4 className="font-bold text-purple-900 text-xl">{formData.selectedStadium.stadium_name}</h4>
 <Badge className="bg-green-100 text-green-800 border border-green-300">
 <CheckCircle2 className="h-3 w-3 mr-1" />
 Selected
 </Badge>
 </div>
 <p className="text-purple-700 flex items-center gap-1 mb-1">
 <MapPin className="h-4 w-4" />
 {formData.selectedStadium.location}
 </p>
 <p className="text-sm text-purple-600">District: {formData.selectedStadium.district}</p>
 </div>
 <div className="text-right">
 <Badge className="bg-purple-600 text-white text-lg px-3 py-1">
 ₹{formData.selectedStadium.hourly_rate}/hr
 </Badge>
 <p className="text-sm text-purple-600 mt-1 font-semibold">
 Total: ₹{formData.selectedStadium.hourly_rate * formData.duration}
 </p>
 </div>
 </div>
 
 {/* Facilities */}
 {formData.selectedStadium.facilities && formData.selectedStadium.facilities.length > 0 && (
 <div className="space-y-2">
 <div className="flex items-center gap-1 text-sm font-medium text-purple-800">
 <Zap className="h-4 w-4" />
 Available Facilities
 </div>
 <div className="flex flex-wrap gap-2">
 {formData.selectedStadium.facilities.map((facility, index) => (
 <Badge key={index} className="bg-white text-purple-700 border border-purple-300 shadow-sm">
 {facility}
 </Badge>
 ))}
 </div>
 </div>
 )}
 </div>

 {/* Clear Selection Button */}
 <div className="flex-shrink-0">
 <Button
 variant="outline"
 size="sm"
 onClick={() => setFormData(prev => ({ ...prev, stadiumId: '', selectedStadium: null }))}
 className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-300"
 >
 <X className="h-4 w-4 mr-1" />
 Change
 </Button>
 </div>
 </div>
 </div>
 </div>
 )}

 {/* Enhanced Stadium Grid */}
 <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
 {filteredStadiums.map((stadium) => (
 <div
 key={stadium.id}
 className={`group relative overflow-hidden border-2 rounded-xl cursor-pointer transition-all duration-300 transform hover:scale-105 ${
 formData.stadiumId === stadium.id
 ? 'border-purple-500 bg-gradient-to-br from-purple-50 to-blue-50 shadow-xl ring-4 ring-purple-200'
 : 'border-gray-200 bg-white hover:border-purple-300 hover:shadow-lg'
 }`}
 onClick={() => selectStadium(stadium)}
 >
 {/* Stadium Photos Header with Navigation */}
 {stadium.photos && stadium.photos.length > 0 ? (
 <div className="relative h-48 overflow-hidden">
 {/* Current Photo */}
 <img
 src={stadium.photos[selectedStadiumPhotos[stadium.id] || 0]}
 alt={`${stadium.stadium_name} - Photo ${(selectedStadiumPhotos[stadium.id] || 0) + 1}`}
 className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
 onError={(e) => {
 e.currentTarget.style.display = 'none'
 }}
 />
 
 {/* Navigation arrows (only show if more than 1 photo) */}
 {stadium.photos.length > 1 && (
 <>
 {/* Previous Photo Button */}
 <button
 type="button"
 className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-all duration-200 opacity-0 group-hover:opacity-100 z-10"
 onClick={(e) => prevStadiumPhoto(stadium.id, stadium.photos!.length, e)}
 >
 <ChevronLeft className="h-4 w-4" />
 </button>
 
 {/* Next Photo Button */}
 <button
 type="button"
 className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-all duration-200 opacity-0 group-hover:opacity-100 z-10"
 onClick={(e) => nextStadiumPhoto(stadium.id, stadium.photos!.length, e)}
 >
 <ChevronRight className="h-4 w-4" />
 </button>
 </>
 )}

 {/* Photo indicators (dots) */}
 {stadium.photos.length > 1 && (
 <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1 z-10">
 {stadium.photos.map((_, idx) => (
 <div
 key={idx}
 className={`w-2 h-2 rounded-full transition-all duration-200 ${
 idx === (selectedStadiumPhotos[stadium.id] || 0)
 ? 'bg-white shadow-lg'
 : 'bg-white/50'
 }`}
 />
 ))}
 </div>
 )}

 {/* Selected indicator */}
 {formData.stadiumId === stadium.id && (
 <div className="absolute top-4 right-4 z-10">
 <div className="bg-purple-600 text-white rounded-full p-2 shadow-lg">
 <CheckCircle2 className="h-5 w-5" />
 </div>
 </div>
 )}

 {/* Photo count indicator */}
 {stadium.photos.length > 1 && (
 <div className="absolute top-4 left-4 z-10">
 <div className="bg-black/70 text-white px-2 py-1 rounded-full text-xs flex items-center gap-1">
 <Camera className="h-3 w-3" />
 {(selectedStadiumPhotos[stadium.id] || 0) + 1}/{stadium.photos.length}
 </div>
 </div>
 )}
 </div>
 ) : (
 <div className="h-48 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center relative">
 <Building className="h-16 w-16 text-gray-400" />
 {formData.stadiumId === stadium.id && (
 <div className="absolute top-4 right-4">
 <div className="bg-purple-600 text-white rounded-full p-2 shadow-lg">
 <CheckCircle2 className="h-5 w-5" />
 </div>
 </div>
 )}
 </div>
 )}

 {/* Stadium Details */}
 <div className="p-5">
 {/* Stadium Title */}
 <div className="mb-3">
 <h4 className="font-bold text-gray-900 text-lg mb-1">{stadium.stadium_name}</h4>
 <p className="text-gray-600 text-sm flex items-center gap-1">
 <MapPin className="h-4 w-4" />
 {stadium.location}
 </p>
 </div>

 <div className="flex items-center justify-between mb-4">
 <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
 {stadium.district}
 </div>
 <div className="flex items-center gap-2">
 <Badge 
 className={`font-bold ${formData.stadiumId === stadium.id ? 'bg-purple-600' : 'bg-green-600'} text-white`}
 >
 ₹{stadium.hourly_rate}/hr
 </Badge>
 </div>
 </div>

 {/* Facilities */}
 {stadium.facilities && stadium.facilities.length > 0 && (
 <div className="space-y-2">
 <div className="flex items-center gap-1 text-sm font-medium text-gray-700">
 <Zap className="h-4 w-4" />
 Facilities
 </div>
 <div className="flex flex-wrap gap-1">
 {stadium.facilities.slice(0, 3).map((facility, index) => (
 <Badge key={index} variant="secondary" className="text-xs bg-blue-50 text-blue-700 border border-blue-200">
 {facility}
 </Badge>
 ))}
 {stadium.facilities.length > 3 && (
 <Badge variant="secondary" className="text-xs bg-gray-100 text-gray-600">
 +{stadium.facilities.length - 3}
 </Badge>
 )}
 </div>
 </div>
 )}

 {/* Selection Call to Action */}
 <div className="mt-4 pt-3 border-t border-gray-200">
 <div className="text-center">
 {formData.stadiumId === stadium.id ? (
 <div className="flex items-center justify-center gap-2 text-purple-600 font-semibold">
 <CheckCircle2 className="h-5 w-5" />
 Selected
 </div>
 ) : (
 <div className="text-gray-600 text-sm group-hover:text-purple-600 transition-colors">
 Click to select this stadium
 </div>
 )}
 </div>
 </div>
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
 <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
 {/* Calendar Header */}
 <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-200 ">
 <div className="flex items-center justify-between flex-wrap gap-4">
 <div>
 <h4 className="font-semibold text-gray-800 ">Select Match Date & Time</h4>
 <p className="text-sm text-gray-600 ">Choose your preferred date and time slot</p>
 </div>
 <div className="flex items-center gap-4 text-xs flex-wrap">
 <div className="flex items-center gap-2">
 <div className="w-3 h-3 bg-green-500 rounded"></div>
 <span className="text-gray-600 ">Available</span>
 </div>
 <div className="flex items-center gap-2">
 <div className="w-3 h-3 bg-red-500 rounded"></div>
 <span className="text-gray-600 ">Booked</span>
 </div>
 <div className="flex items-center gap-2">
 <div className="w-3 h-3 bg-orange-500 rounded"></div>
 <span className="text-gray-600 ">Insufficient</span>
 </div>
 <div className="flex items-center gap-2">
 <div className="w-3 h-3 bg-blue-500 rounded"></div>
 <span className="text-gray-600 ">Selected</span>
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
 className="w-full md:w-80 justify-start text-left h-12 bg-white border-2 hover:border-blue-300"
 onClick={() => setShowDatePicker(!showDatePicker)}
 >
 <Calendar className="h-4 w-4 mr-3 text-blue-600" />
 <span className="font-medium">
 {selectedDate ? format(selectedDate, 'EEEE, MMMM d, yyyy') : 'Pick a date'}
 </span>
 </Button>
 
 {showDatePicker && (
 <div className="absolute top-14 left-0 z-50 bg-white border-2 border-gray-200 rounded-xl shadow-xl p-4">
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
 <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 ">
 <Calendar className="h-12 w-12 mx-auto mb-3 text-gray-400" />
 <p className="text-gray-600 font-medium mb-1">Date Required</p>
 <p className="text-sm text-gray-500 ">Select a date above to view available time slots</p>
 </div>
 ) : (
 <div className="space-y-4">
 {/* Morning Session */}
 <div>
 <h5 className="font-medium text-gray-700 mb-3 flex items-center gap-2">
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
 ? 'bg-blue-100 text-blue-700 border-blue-300 '
 : isBlocked
 ? 'bg-red-100 text-red-600 border-red-300 cursor-not-allowed '
 : !canSelect
 ? 'bg-orange-50 text-orange-600 border-orange-200 cursor-not-allowed '
 : isAvailable
 ? 'bg-green-50 text-green-700 border-green-300 hover:bg-green-100 hover:border-green-400 '
 : 'bg-gray-100 text-gray-400 border-gray-300 cursor-not-allowed '
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
 <h5 className="font-medium text-gray-700 mb-3 flex items-center gap-2">
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
 ? 'bg-blue-100 text-blue-700 border-blue-300 '
 : isBlocked
 ? 'bg-red-100 text-red-600 border-red-300 cursor-not-allowed '
 : !canSelect
 ? 'bg-orange-50 text-orange-600 border-orange-200 cursor-not-allowed '
 : isAvailable
 ? 'bg-green-50 text-green-700 border-green-300 hover:bg-green-100 hover:border-green-400 '
 : 'bg-gray-100 text-gray-400 border-gray-300 cursor-not-allowed '
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
 <h5 className="font-medium text-gray-700 mb-3 flex items-center gap-2">
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
 ? 'bg-blue-100 text-blue-700 border-blue-300 '
 : isBlocked
 ? 'bg-red-100 text-red-600 border-red-300 cursor-not-allowed '
 : !canSelect
 ? 'bg-orange-50 text-orange-600 border-orange-200 cursor-not-allowed '
 : isAvailable
 ? 'bg-green-50 text-green-700 border-green-300 hover:bg-green-100 hover:border-green-400 '
 : 'bg-gray-100 text-gray-400 border-gray-300 cursor-not-allowed '
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
 <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
 <div className="flex items-center gap-3">
 <CheckCircle2 className="h-5 w-5 text-blue-600 " />
 <div className="flex-1">
 <p className="font-medium text-blue-800 ">Time Slot Selected</p>
 <p className="text-sm text-blue-600 ">
 {format(selectedDate || new Date(), 'EEEE, MMMM d')} at {formData.matchTime}
 {formData.duration > 1 && (() => {
 const [hours] = formData.matchTime.split(':').map(Number)
 const endHour = hours + formData.duration
 return ` - ${String(endHour).padStart(2, '0')}:00`
 })()}
 </p>
 <p className="text-xs text-blue-500 mt-1">
 Duration: {formData.duration} hour{formData.duration > 1 ? 's' : ''}
 {formData.duration > 1 && ` (${getAffectedSlots(formData.matchTime).join(', ')})`}
 </p>
 </div>
 </div>
 </div>
 )}
 </div>
 )}

 {/* Error Message for Blocked Time Slot */}
 {formData.matchTime && blockedTimeSlots.includes(formData.matchTime) && (
 <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
 <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
 <div>
 <h4 className="font-semibold text-red-800 mb-1">
 Time Slot Not Available
 </h4>
 <p className="text-sm text-red-700 ">
 This time slot is already booked on the selected date. Please choose a different time slot or select another stadium.
 </p>
 </div>
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
 <div className="flex items-center gap-2">
 <Label className="text-base font-semibold flex items-center gap-2">
 <UserCheck className="h-4 w-4" />
 Select Referees ({formData.refereeIds.length} selected)
 </Label>
 {(club.district || club.city) && (
 <Badge className="bg-blue-500 text-white text-xs">
 <MapPin className="h-3 w-3 mr-1" />
 {club.district ? `${club.district} District` : `${club.city} City`}
 </Badge>
 )}
 </div>
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
 ? 'border-blue-500 bg-blue-50 '
 : 'border-gray-200 hover:border-gray-300'
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
 <div className="flex items-center gap-2">
 <Label className="text-base font-semibold flex items-center gap-2">
 <Users className="h-4 w-4" />
 Select PCL Staff ({formData.staffIds.length} selected)
 </Label>
 {(club.district || club.city) && (
 <Badge className="bg-blue-500 text-white text-xs">
 <MapPin className="h-3 w-3 mr-1" />
 {club.district ? `${club.district} District` : `${club.city} City`}
 </Badge>
 )}
 </div>
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
 ? 'border-blue-500 bg-blue-50 '
 : 'border-gray-200 hover:border-gray-300'
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
 <div className="bg-blue-50 border border-blue-200 rounded-lg p-8 text-center">
 <div className="flex flex-col items-center gap-4">
 <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
 <Info className="h-8 w-8 text-blue-600 " />
 </div>
 <div>
 <h3 className="font-semibold text-lg text-blue-900 mb-2">
 Hobby Match - No Officials Required
 </h3>
 <p className="text-blue-700 text-sm max-w-md">
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
 <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
 <h3 className="font-semibold text-xl mb-4 text-blue-900 ">Match Summary</h3>
 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
 <div className="space-y-3">
 <div>
 <p className="text-sm text-gray-600 ">Match Format</p>
 <p className="font-semibold text-gray-900 ">{formData.matchFormat}</p>
 </div>
 <div>
 <p className="text-sm text-gray-600 ">Match Type</p>
 <p className="font-semibold text-gray-900 capitalize">{formData.matchType}</p>
 </div>
 <div>
 <p className="text-sm text-gray-600 ">Your Team</p>
 <p className="font-semibold text-gray-900 ">
 {teams.find(t => t.id === formData.teamId)?.team_name || 'Not selected'}
 </p>
 </div>
 <div>
 <p className="text-sm text-gray-600 ">Opponent</p>
 <p className="font-semibold text-gray-900 ">{formData.selectedClub?.name || 'Not selected'}</p>
 </div>
 </div>

 <div className="space-y-3">
 <div>
 <p className="text-sm text-gray-600 ">Stadium</p>
 <p className="font-semibold text-gray-900 ">{formData.selectedStadium?.stadium_name || 'Not selected'}</p>
 </div>
 <div>
 <p className="text-sm text-gray-600 ">Date & Time</p>
 <p className="font-semibold text-gray-900 ">
 {selectedDate ? format(selectedDate, 'PPP') : 'Not selected'} at {formData.matchTime}
 </p>
 </div>
 <div>
 <p className="text-sm text-gray-600 ">Duration</p>
 <p className="font-semibold text-gray-900 ">{formData.duration} hour{formData.duration > 1 ? 's' : ''}</p>
 </div>
 {formData.matchType === 'official' && (
 <div>
 <p className="text-sm text-gray-600 ">Officials</p>
 <p className="font-semibold text-gray-900 ">
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
 className="text-blue-600 hover:text-blue-700 "
 >
 Edit Match Setup
 </Button>
 <Button
 type="button"
 variant="outline"
 size="sm"
 onClick={() => setCurrentStep(2)}
 className="text-blue-600 hover:text-blue-700 "
 >
 Edit Stadium
 </Button>
 <Button
 type="button"
 variant="outline"
 size="sm"
 onClick={() => setCurrentStep(3)}
 className="text-blue-600 hover:text-blue-700 "
 >
 Edit Schedule
 </Button>
 {formData.matchType === 'official' && (
 <Button
 type="button"
 variant="outline"
 size="sm"
 onClick={() => setCurrentStep(4)}
 className="text-blue-600 hover:text-blue-700 "
 >
 Edit Officials
 </Button>
 )}
 </div>
 </div>

 {/* Budget Calculator */}
 <div className="bg-gray-50 rounded-lg p-6 space-y-4">
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
 <span>Platform Charges (9.5%):</span>
 <span className="font-medium">₹{budget.processingFee.toFixed(2)}</span>
 </div>
 
 <div className="border-t pt-2 flex justify-between text-lg font-bold">
 <span>Total Cost:</span>
 <span className="text-green-600">₹{budget.totalCost.toFixed(2)}</span>
 </div>
 </div>
 
 <div className="space-y-3">
 <div className="text-center p-4 bg-blue-50 rounded-lg">
 <h4 className="font-semibold text-blue-800 mb-2">
 Cost Per Player
 </h4>
 <div className="text-2xl font-bold text-blue-600">
 ₹{budget.costPerPlayer.toFixed(2)}
 </div>
 <p className="text-sm text-blue-700 mt-1">
 Split between {formData.teamSize * 2} players (both teams)
 </p>
 </div>
 
 {formData.hasPrizeMoney && formData.prizeMoney > 0 && (
 <div className="text-center p-3 bg-yellow-50 rounded-lg">
 <h5 className="font-medium text-yellow-800 ">
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
 <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
 <div className="flex items-start gap-2">
 <Info className="h-4 w-4 text-blue-600 mt-0.5" />
 <div className="text-sm text-blue-800 ">
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

 {/* STEP 6: Payment & Confirmation */}
 {(currentStep as number) === 6 && (
 <div className="space-y-6">
 {/* Payment Header */}
 <div className="bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-lg p-6">
 <h3 className="font-semibold text-xl mb-4 text-orange-900 flex items-center gap-2">
 <CreditCard className="h-6 w-6" />
 Payment & Confirmation
 </h3>
 <p className="text-orange-700 text-sm">
 Secure payment powered by Razorpay. Complete payment to confirm your match booking.
 </p>
 </div>

 {/* Payment Summary */}
 <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
 <h4 className="font-semibold text-lg mb-4 flex items-center gap-2">
 <Banknote className="h-5 w-5 text-green-600" />
 Payment Summary
 </h4>
 
 <div className="space-y-3">
 <div className="flex justify-between text-sm">
 <span className="text-gray-600">Stadium Booking ({formData.duration}h)</span>
 <span className="font-medium">₹{budget.stadiumCost}</span>
 </div>
 
 {formData.matchType === 'official' && budget.refereeCost > 0 && (
 <div className="flex justify-between text-sm">
 <span className="text-gray-600">Referees ({formData.refereeIds.length})</span>
 <span className="font-medium">₹{budget.refereeCost}</span>
 </div>
 )}
 
 {formData.matchType === 'official' && budget.staffCost > 0 && (
 <div className="flex justify-between text-sm">
 <span className="text-gray-600">PCL Staff ({formData.staffIds.length})</span>
 <span className="font-medium">₹{budget.staffCost}</span>
 </div>
 )}
 
 <div className="flex justify-between text-sm">
 <span className="text-gray-600">Platform Charges (9.5%)</span>
 <span className="font-medium">₹{budget.processingFee.toFixed(2)}</span>
 </div>
 
 <div className="border-t pt-3 flex justify-between text-lg font-bold">
 <span>Total Amount</span>
 <span className="text-green-600">₹{budget.totalCost.toFixed(2)}</span>
 </div>
 </div>
 </div>

 {/* Match Summary for Payment */}
 <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
 <h4 className="font-semibold text-lg mb-4">Match Details</h4>
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
 <div>
 <span className="text-gray-600">Format:</span>
 <span className="ml-2 font-medium">{formData.matchFormat}</span>
 </div>
 <div>
 <span className="text-gray-600">Date:</span>
 <span className="ml-2 font-medium">
 {selectedDate ? format(selectedDate, 'PPP') : 'Not selected'}
 </span>
 </div>
 <div>
 <span className="text-gray-600">Time:</span>
 <span className="ml-2 font-medium">{formData.matchTime}</span>
 </div>
 <div>
 <span className="text-gray-600">Stadium:</span>
 <span className="ml-2 font-medium">{formData.selectedStadium?.stadium_name}</span>
 </div>
 <div>
 <span className="text-gray-600">Opponent:</span>
 <span className="ml-2 font-medium">{formData.selectedClub?.name}</span>
 </div>
 <div>
 <span className="text-gray-600">Duration:</span>
 <span className="ml-2 font-medium">{formData.duration} hour(s)</span>
 </div>
 </div>
 </div>

 {/* Payment Status */}
 {!paymentCompleted && !paymentProcessing && (
 <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
 <div className="flex items-start gap-3">
 <Lock className="h-5 w-5 text-blue-600 mt-1" />
 <div>
 <h4 className="font-semibold text-blue-900 mb-2">Secure Payment</h4>
 <p className="text-blue-700 text-sm mb-4">
 Click "Pay Now" to proceed with secure payment via Razorpay. Your payment is protected by industry-standard encryption.
 </p>
 <div className="flex flex-wrap gap-2">
 <Badge variant="outline" className="text-xs">256-bit SSL</Badge>
 <Badge variant="outline" className="text-xs">PCI Compliant</Badge>
 <Badge variant="outline" className="text-xs">Razorpay Secured</Badge>
 </div>

 {/* Debug Information for Mobile Testing */}
 <div className="mt-4 p-2 bg-gray-100 rounded text-xs">
 <div><strong>Platform:</strong> {Capacitor.getPlatform()}</div>
 <div><strong>Is Native:</strong> {Capacitor.isNativePlatform().toString()}</div>
 <div><strong>User Agent:</strong> {navigator.userAgent.substring(0, 50)}...</div>
 </div>
 </div>
 </div>
 </div>
 )}

 {paymentProcessing && (
 <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
 <div className="flex items-center gap-3">
 <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-yellow-600"></div>
 <div>
 <h4 className="font-semibold text-yellow-900">Processing Payment...</h4>
 <p className="text-yellow-700 text-sm">
 Please complete the payment process. Do not refresh or close this page.
 </p>
 </div>
 </div>
 </div>
 )}

 {paymentCompleted && paymentResponse && (
 <div className="bg-green-50 border border-green-200 rounded-lg p-6">
 <div className="flex items-start gap-3">
 <CheckCircle2 className="h-6 w-6 text-green-600 mt-1" />
 <div>
 <h4 className="font-semibold text-green-900 mb-2">Payment Successful!</h4>
 <p className="text-green-700 text-sm mb-3">
 Your payment has been processed successfully. Match booking is being finalized.
 </p>
 <div className="text-xs text-green-600 font-mono bg-green-100 p-2 rounded">
 Payment ID: {paymentResponse.razorpay_payment_id}
 </div>
 </div>
 </div>
 </div>
 )}
 </div>
 )}

 {/* Enhanced Navigation */}
 <div className="flex items-center justify-between pt-8 mt-8 border-t border-gray-200 bg-gray-50 -mx-6 px-6 py-6 rounded-b-lg">
 {currentStep > 1 ? (
 <Button
 type="button"
 variant="outline"
 onClick={handlePreviousStep}
 className="flex items-center gap-2 px-6 py-3 border-2 border-gray-300 hover:border-gray-400 transition-all"
 >
 <div className="w-5 h-5 rounded-full bg-gray-400 flex items-center justify-center text-white text-xs">
 ←
 </div>
 Previous
 </Button>
 ) : (
 <div></div>
 )}

 <div className="flex items-center gap-3">
 {/* Step counter */}
 <div className="text-sm text-gray-500 bg-white px-3 py-1 rounded-full border">
 Step {currentStep} of {totalSteps}
 </div>
 
 {currentStep < totalSteps ? (
 <div className="flex flex-col gap-2">
 <Button
 type="button"
 onClick={handleNextStep}
 disabled={!canProceedToNextStep()}
 className={`flex items-center gap-2 px-6 py-3 transition-all transform hover:scale-105 ${
 canProceedToNextStep() 
 ? 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 shadow-lg' 
 : 'bg-gray-400 cursor-not-allowed'
 }`}
 >
 {isLoadingMatches && currentStep === 2 ? (
 <>
 <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
 Loading matches...
 </>
 ) : (
 <>
 Continue
 <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-xs">
 →
 </div>
 </>
 )}
 </Button>
 
 {/* ✅ Show loading message when matches are being fetched */}
 {isLoadingMatches && currentStep === 2 && (
 <p className="text-sm text-blue-600 flex items-center gap-2">
 <span className="animate-pulse">⏳</span>
 Loading scheduled matches to check availability...
 </p>
 )}
 </div>
 ) : currentStep === 6 ? (
 // Payment step buttons
 <div className="flex flex-col gap-2">
 {!paymentCompleted ? (
 <Button
 type="button"
 onClick={(e) => {
 e.preventDefault()
 handleSubmit(e as any)
 }}
 disabled={paymentProcessing || budget.totalCost <= 0}
 className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 px-8 py-3 shadow-lg transform hover:scale-105 transition-all"
 >
 {paymentProcessing ? (
 <div className="flex items-center gap-3">
 <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
 <span>Processing Payment...</span>
 </div>
 ) : (
 <div className="flex items-center gap-3">
 <CreditCard className="h-5 w-5" />
 <span className="font-semibold">Pay ₹{budget.totalCost.toFixed(2)}</span>
 <Lock className="h-4 w-4" />
 </div>
 )}
 </Button>
 ) : (
 <Button
 type="button"
 onClick={(e) => {
 e.preventDefault()
 createMatchAfterPayment()
 }}
 disabled={loading}
 className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 px-8 py-3 shadow-lg transform hover:scale-105 transition-all"
 >
 {loading ? (
 <div className="flex items-center gap-3">
 <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
 <span>Creating Match...</span>
 </div>
 ) : (
 <div className="flex items-center gap-3">
 <CheckCircle2 className="h-5 w-5" />
 <span className="font-semibold">Complete Match Booking</span>
 <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-xs">
 ✓
 </div>
 </div>
 )}
 </Button>
 )}
 </div>
 ) : (
 // Legacy final step button (now unused)
 <Button
 type="button"
 onClick={(e) => {
 e.preventDefault()
 handleSubmit(e as any)
 }}
 disabled={loading || !formData.selectedClub || !formData.stadiumId}
 className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 px-8 py-3 shadow-lg transform hover:scale-105 transition-all"
 >
 {loading ? (
 <div className="flex items-center gap-3">
 <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
 <span>Creating Match Request...</span>
 </div>
 ) : (
 <div className="flex items-center gap-3">
 <Send className="h-5 w-5" />
 <span className="font-semibold">Create Match Request</span>
 <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-xs">
 ✓
 </div>
 </div>
 )}
 </Button>
 )}
 </div>
 </div>
 </form>
 </CardContent>
 </Card>
 </div>
 )
}