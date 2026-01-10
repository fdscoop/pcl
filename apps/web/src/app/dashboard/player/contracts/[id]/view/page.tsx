'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ProfessionalContractViewer } from '@/components/ProfessionalContractViewer'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { signContractAsPlayer, markContractAsReadByPlayer } from '@/services/contractService'

interface Contract {
 id: string
 player_id: string
 club_id: string
 status: 'pending' | 'active' | 'rejected' | 'terminated'
 contract_start_date: string
 contract_end_date: string
 salary_monthly?: number
 position_assigned?: string
 jersey_number?: number
 terms_conditions?: string
 clubs: {
 id: string
 club_name: string
 logo_url?: string
 email?: string
 phone?: string
 city?: string
 state?: string
 country?: string
 description?: string
 founded_year?: number
 website?: string
 }
 club_signature_timestamp?: string
 club_signature_name?: string
 player_signature_timestamp?: string
 signing_status?: string
 created_by?: string
}

interface Player {
 id: string
 first_name: string
 last_name: string
 user_id: string
 unique_player_id?: string
 position?: string
 photo_url?: string
 height_cm?: number
 weight_kg?: number
 date_of_birth?: string
 nationality?: string
 preferred_foot?: 'left' | 'right' | 'both'
 total_matches_played?: number
 total_goals_scored?: number
 total_assists?: number
 jersey_number?: number
 bio?: string
 email?: string
 phone?: string
 profile_photo_url?: string
}

export default function ContractViewerPage() {
 const router = useRouter()
 const params = useParams()
 const contractId = params.id as string

 const [contract, setContract] = useState<Contract | null>(null)
 const [player, setPlayer] = useState<Player | null>(null)
 const [contractHtml, setContractHtml] = useState<string | null>(null)
 const [signature, setSignature] = useState('')
 const [signingDate, setSigningDate] = useState(new Date().toISOString().split('T')[0])
 const [agreedToTerms, setAgreedToTerms] = useState(false)
 const [validationErrors, setValidationErrors] = useState<string[]>([])
 const [loading, setLoading] = useState(true)
 const [error, setError] = useState<string | null>(null)
 const [isSigning, setIsSigning] = useState(false)

 // Validation function
 const validateSigningForm = (): boolean => {
 const errors: string[] = []

 if (!signature.trim()) {
 errors.push('Signature name is required')
 } else if (signature.trim().length < 2) {
 errors.push('Signature name must be at least 2 characters')
 }

 if (!signingDate) {
 errors.push('Signing date is required')
 } else {
 const selectedDate = new Date(signingDate)
 const today = new Date()
 today.setHours(0, 0, 0, 0)
 
 if (selectedDate < today) {
 errors.push('Signing date cannot be in the past')
 }
 }

 if (!agreedToTerms) {
 errors.push('You must agree to all terms and conditions')
 }

 setValidationErrors(errors)
 return errors.length === 0
 }

 useEffect(() => {
 loadContractAndPlayer()
 }, [contractId])

 const loadContractAndPlayer = async () => {
 try {
 setLoading(true)
 setError(null)

 const supabase = createClient()
 const { data: { user } } = await supabase.auth.getUser()

 if (!user) {
 router.push('/auth/login')
 return
 }

 // Load the contract first (without join to avoid RLS issues)
 const { data: contractData, error: contractError } = await supabase
 .from('contracts')
 .select('*')
 .eq('id', contractId)
 .single()

 if (contractError || !contractData) {
 console.error('Error loading contract:', {
 contractId,
 message: contractError?.message,
 details: contractError?.details,
 code: (contractError as any)?.code
 })
 setError(contractError?.message || 'Contract not found or you do not have permission to view it')
 return
 }

 // Load player by contract.player_id with all details
 const { data: playerRow, error: playerError } = await supabase
 .from('players')
 .select('*')
 .eq('id', contractData.player_id)
 .single()

 if (playerError || !playerRow) {
 console.error('Error loading player row:', {
 playerId: contractData.player_id,
 message: playerError?.message,
 details: playerError?.details,
 code: (playerError as any)?.code
 })
 setError(playerError?.message || 'Could not load player information')
 return
 }

 // Extra safety: make sure the authenticated user is either the player OR the club owner
 let isAuthorized = playerRow.user_id === user.id // Player owns this contract
 
 // Also check if user is the club owner
 if (!isAuthorized && contractData.club_id) {
 const { data: clubOwner } = await supabase
 .from('clubs')
 .select('owner_id')
 .eq('id', contractData.club_id)
 .single()
 
 isAuthorized = clubOwner?.owner_id === user.id
 }

 if (!isAuthorized) {
 setError('You do not have permission to view this contract')
 return
 }

 // Fetch user data separately with all profile info
 const { data: userData, error: userError } = await supabase
 .from('users')
 .select('first_name, last_name, bio, email, phone, profile_photo_url')
 .eq('id', user.id)
 .single()

 if (userError) {
 console.error('Error loading user profile:', userError)
 }

 setPlayer({
 id: playerRow.id,
 user_id: playerRow.user_id,
 first_name: userData?.first_name || 'Player',
 last_name: userData?.last_name || '',
 unique_player_id: playerRow.unique_player_id,
 position: playerRow.position,
 photo_url: playerRow.photo_url,
 height_cm: playerRow.height_cm,
 weight_kg: playerRow.weight_kg,
 date_of_birth: playerRow.date_of_birth,
 nationality: playerRow.nationality,
 preferred_foot: playerRow.preferred_foot,
 total_matches_played: playerRow.total_matches_played,
 total_goals_scored: playerRow.total_goals_scored,
 total_assists: playerRow.total_assists,
 jersey_number: playerRow.jersey_number,
 bio: userData?.bio,
 email: userData?.email,
 phone: userData?.phone,
 profile_photo_url: userData?.profile_photo_url
 })

 // Fetch club data separately to avoid RLS issues with joins
 const { data: clubData, error: clubError } = await supabase
 .from('clubs')
 .select('id, club_name, logo_url, email, phone, city, state, country, description, founded_year, website')
 .eq('id', contractData.club_id)
 .single()

 if (clubError) {
 console.error('Error fetching club data:', {
 clubId: contractData.club_id,
 error: clubError,
 message: clubError.message,
 details: clubError.details,
 hint: clubError.hint
 })
 } else {
 console.log('Club data loaded successfully:', clubData)
 }

 // Merge contract with club data
 const mergedContract: Contract = {
 ...contractData,
 clubs: clubData || {
 id: contractData.club_id,
 club_name: clubError ? 'Club information unavailable' : 'Unknown Club',
 logo_url: undefined,
 email: undefined,
 phone: undefined,
 city: undefined,
 state: undefined,
 country: undefined,
 description: undefined,
 founded_year: undefined,
 website: undefined
 }
 }

 setContract(mergedContract)

 // Debug log to see what we got
 console.log('Contract loaded:', {
 contractId: contractData.id,
 clubId: contractData.club_id,
 clubDataAvailable: !!clubData,
 clubData,
 mergedContract
 })

 // Mark contract as read by player when they view it
 if (!contractData.read_by_player) {
 markContractAsReadByPlayer(contractId)
 }

 // Always regenerate HTML to ensure latest signature data is displayed
 try {
 const { generateContractHTML, getDefaultPCLPolicies } = await import('@/utils/contractGenerator')
 const playerName = userData ? `${userData.first_name} ${userData.last_name}` : 'Player'

 const policies = getDefaultPCLPolicies()
 const generatedHtml = generateContractHTML({
 contractId: contractData.id,
 clubName: clubData?.club_name || 'Club',
 clubLogo: clubData?.logo_url,
 clubEmail: clubData?.email,
 clubPhone: clubData?.phone,
 clubCity: clubData?.city,
 clubState: clubData?.state,
 playerName,
 playerId: playerRow.id,
 position: contractData.position_assigned || 'Not assigned',
 jerseyNumber: contractData.jersey_number,
 startDate: contractData.contract_start_date,
 endDate: contractData.contract_end_date,
 monthlySalary: contractData.salary_monthly,
 annualSalary: contractData.annual_salary,
 signingBonus: contractData.signing_bonus,
 releaseClause: contractData.release_clause,
 goalBonus: contractData.goal_bonus,
 appearanceBonus: contractData.appearance_bonus,
 medicalInsurance: contractData.medical_insurance,
 housingAllowance: contractData.housing_allowance,
 contractStatus: contractData.status,
 noticePeriod: contractData.notice_period,
 trainingDaysPerWeek: contractData.training_days_per_week,
 clubSignatureName: contractData.club_signature_name,
 clubSignatureTimestamp: contractData.club_signature_timestamp,
 playerSignatureName: contractData.player_signature_timestamp ? playerName : undefined,
 playerSignatureTimestamp: contractData.player_signature_timestamp,
 policies
 })
 setContractHtml(generatedHtml)
 } catch (genError) {
 console.error('Error regenerating HTML:', genError)
 // Fallback to stored HTML if regeneration fails
 setContractHtml(contractData.contract_html || null)
 }
 } catch (err) {
 const errorMessage = err instanceof Error ? err.message : 'An error occurred'
 setError(errorMessage)
 console.error('Error loading contract:', err)
 } finally {
 setLoading(false)
 }
 }

 const handleSignContract = async (contractIdToSign: string) => {
 if (!player) {
 setError('Player information not loaded')
 return
 }

 // Validate form
 if (!validateSigningForm()) {
 return
 }

 try {
 setIsSigning(true)
 setError(null)
 setValidationErrors([])

 // Call contract service to sign
 const result = await signContractAsPlayer({
 contractId: contractIdToSign,
 playerName: signature.trim(),
 playerSignatureData: {
 name: signature.trim(),
 timestamp: new Date().toISOString(),
 signedAt: signingDate,
 method: 'digital'
 }
 })

 if (!result.success) {
 setError(result.error || 'Failed to sign contract')
 return
 }

 // Reset form and reload contract to show updated signature status
 setSignature('')
 setSigningDate(new Date().toISOString().split('T')[0])
 await loadContractAndPlayer()
 } catch (err) {
 const errorMessage = err instanceof Error ? err.message : 'Failed to sign contract'
 setError(errorMessage)
 console.error('Error signing contract:', err)
 } finally {
 setIsSigning(false)
 }
 }

 if (loading) {
 return (
 <div className="min-h-screen flex items-center justify-center px-2 sm:px-4">
 <Card className="p-6 sm:p-10 shadow-2xl border-2 border-orange-200 rounded-xl sm:rounded-2xl">
 <div className="flex flex-col items-center gap-3 sm:gap-5">
 <div className="relative">
 <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-4 border-orange-200"></div>
 <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-4 border-orange-500 border-t-transparent animate-spin absolute top-0 left-0"></div>
 </div>
 <div className="text-center">
 <h3 className="text-xl sm:text-2xl font-bold text-slate-800 mb-2">Loading Contract</h3>
 <p className="text-slate-500 text-xs sm:text-base">Please wait while we fetch your contract details...</p>
 </div>
 </div>
 </Card>
 </div>
 )
 }

 if (error || !contract || !player) {
 return (
 <div className="py-4 sm:py-8 px-2 sm:px-4 flex items-center justify-center">
 <div className="max-w-2xl w-full">
 <Card className="p-6 sm:p-10 border-4 border-red-200 bg-red-50 shadow-2xl rounded-xl sm:rounded-2xl">
 <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
 <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-red-500 flex items-center justify-center text-2xl sm:text-3xl shadow-lg">
 ⚠️
 </div>
 <h2 className="text-2xl sm:text-3xl font-bold text-red-700">Unable to Load Contract</h2>
 </div>
 <div className="bg-white p-4 sm:p-6 rounded-lg sm:rounded-xl border-2 border-red-200 mb-4 sm:mb-6">
 <p className="text-red-700 text-base sm:text-lg leading-relaxed">
 {error || 'The contract could not be loaded. Please try again or contact support.'}
 </p>
 </div>
 <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
 <Button
 onClick={() => router.push('/dashboard/player/contracts')}
 size="lg"
 className="flex-1 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold py-4 sm:py-6 text-sm sm:text-lg rounded-lg sm:rounded-xl shadow-lg"
 >
 ← Back to Contracts
 </Button>
 <Button
 onClick={() => window.location.reload()}
 variant="outline"
 size="lg"
 className="flex-1 font-bold py-4 sm:py-6 text-sm sm:text-lg border-2 rounded-lg sm:rounded-xl"
 >
 🔄 Retry
 </Button>
 </div>
 </Card>
 </div>
 </div>
 )
 }

 const playerName = `${player.first_name} ${player.last_name}`

 return (
 <div className="min-h-screen bg-gradient-to-br from-slate-50 via-orange-50/20 to-slate-100">
 {/* Top Navigation - Modern & Clean */}
 <nav className="sticky-nav-mobile-safe bg-white/95 backdrop-blur-xl border-b border-slate-200 shadow-lg sticky top-0 z-50">
 <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
 <div className="flex justify-between items-center h-16 sm:h-20">
 {/* Left Section */}
 <div className="flex items-center gap-3 sm:gap-4">
 <Button
 onClick={() => router.push('/dashboard/player/contracts')}
 variant="ghost"
 size="sm"
 className="group flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl hover:bg-orange-50 transition-all duration-200 font-semibold text-slate-700 hover:text-orange-600"
 >
 ← <span className="hidden sm:inline">Back</span>
 </Button>
 <div className="h-8 w-px bg-slate-200 hidden sm:block"></div>
 <div className="flex items-center gap-2 sm:gap-3">
 <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center shadow-lg shadow-orange-500/30">
 <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
 </svg>
 </div>
 <div>
 <h1 className="text-sm sm:text-lg font-bold text-slate-900">
 Contract Preview
 </h1>
 <p className="text-xs text-slate-500 hidden sm:block">Review your professional contract</p>
 </div>
 </div>
 </div>

 {/* Right Section */}
 <div className="flex items-center gap-2 sm:gap-3">
 <Button
 onClick={() => window.print()}
 variant="ghost"
 size="sm"
 className="group flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl hover:bg-slate-50 transition-all duration-200 font-semibold text-slate-700 hover:text-slate-900"
 >
 <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
 </svg>
 <span className="hidden sm:inline">Print</span>
 </Button>
 <Button
 onClick={() => router.push('/dashboard/player/contracts')}
 className="flex items-center gap-2 px-3 sm:px-5 py-2 sm:py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold shadow-lg shadow-orange-500/30 hover:shadow-xl hover:shadow-orange-500/40 transition-all duration-200"
 >
 <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
 </svg>
 <span className="hidden sm:inline">All Contracts</span>
 </Button>
 </div>
 </div>
 </div>
 </nav>

 {/* Main Content */}
 <div className="p-3 sm:p-6 lg:p-8">
 {error && !loading && (
 <div className="w-full max-w-4xl mx-auto mb-4 sm:mb-6">
 <Card className="p-4 sm:p-5 border-2 border-red-300 bg-red-50 rounded-xl shadow-lg">
 <p className="text-red-800 text-sm sm:text-base font-medium">
 <strong>Error:</strong> {error}
 </p>
 </Card>
 </div>
 )}

 {/* Contract Overview - Modern Mobile-Optimized Design */}
 <div className="w-full max-w-4xl mx-auto mb-6 sm:mb-8">
 <Card className="rounded-2xl bg-gradient-to-br from-orange-500 via-orange-400 to-amber-500 border-0 shadow-xl overflow-hidden">
 {/* Decorative background patterns */}
 <div className="absolute top-0 right-0 w-32 h-32 sm:w-48 sm:h-48 bg-white/10 rounded-full -mr-16 sm:-mr-24 -mt-16 sm:-mt-24"></div>
 <div className="absolute bottom-0 left-0 w-24 h-24 sm:w-36 sm:h-36 bg-white/10 rounded-full -ml-12 sm:-ml-18 -mb-12 sm:-mb-18"></div>

 <div className="relative z-10 p-4 sm:p-6 md:p-8">
 {/* Header Section */}
 <div className="text-center mb-5 sm:mb-7">
 <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-white mb-3 sm:mb-4 tracking-tight drop-shadow-lg">
 Contract Overview
 </h2>
 {contract.status === 'pending' && (
 <span className="inline-flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-full bg-amber-100 text-amber-900 font-bold text-xs sm:text-sm shadow-lg border-2 border-amber-200">
 <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 20 20">
 <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
 </svg>
 <span className="hidden sm:inline">Action Required - Review & Sign</span>
 <span className="sm:hidden">Review & Sign</span>
 </span>
 )}
 {contract.status === 'active' && (
 <span className="inline-flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-full bg-emerald-100 text-emerald-900 font-bold text-xs sm:text-sm shadow-lg border-2 border-emerald-200">
 <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 20 20">
 <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
 </svg>
 <span className="hidden sm:inline">Contract Active & Signed</span>
 <span className="sm:hidden">Active</span>
 </span>
 )}
 </div>

 {/* Info Cards Grid */}
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
 {/* Club Info */}
 <Card className="bg-white/95 backdrop-blur-sm rounded-xl sm:rounded-2xl p-4 sm:p-5 border-0 shadow-md hover:shadow-xl transition-all duration-200 hover:scale-[1.02]">
 <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-orange-600 uppercase mb-2 sm:mb-3">
 <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
 </svg>
 <span>Club</span>
 </div>
 <div className="text-base sm:text-lg md:text-xl font-bold text-slate-900 break-words leading-tight mb-1">
 {contract.clubs.club_name}
 </div>
 {contract.clubs.city && contract.clubs.state && (
 <div className="text-xs sm:text-sm text-slate-600 mt-2 flex items-center gap-1.5">
 <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
 <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
 </svg>
 <span className="truncate">{contract.clubs.city}, {contract.clubs.state}</span>
 </div>
 )}
 </Card>

 {/* Contract Period */}
 <Card className="bg-white/95 backdrop-blur-sm rounded-xl sm:rounded-2xl p-4 sm:p-5 border-0 shadow-md hover:shadow-xl transition-all duration-200 hover:scale-[1.02]">
 <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-orange-600 uppercase mb-2 sm:mb-3">
 <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
 </svg>
 <span>Contract Period</span>
 </div>
 <div className="text-base sm:text-lg md:text-xl font-bold text-slate-900 leading-tight">
 {new Date(contract.contract_start_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
 </div>
 <div className="text-xs sm:text-sm text-slate-600 mt-1.5 font-medium">
 to {new Date(contract.contract_end_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
 </div>
 </Card>

 {/* Position */}
 <Card className="bg-white/95 backdrop-blur-sm rounded-xl sm:rounded-2xl p-4 sm:p-5 border-0 shadow-md hover:shadow-xl transition-all duration-200 hover:scale-[1.02]">
 <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-orange-600 uppercase mb-2 sm:mb-3">
 <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
 </svg>
 <span>Position</span>
 </div>
 <div className="text-base sm:text-lg md:text-xl font-bold text-slate-900 capitalize leading-tight">
 {contract.position_assigned || 'Not Assigned'}
 </div>
 {contract.jersey_number && (
 <div className="text-xs sm:text-sm text-slate-600 mt-1.5 font-medium">
 Jersey #{contract.jersey_number}
 </div>
 )}
 </Card>

 {/* Contact Info */}
 {(contract.clubs.email || contract.clubs.phone) && (
 <Card className="bg-white/95 backdrop-blur-sm rounded-xl sm:rounded-2xl p-4 sm:p-5 border-0 shadow-md hover:shadow-xl transition-all duration-200 hover:scale-[1.02]">
 <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-orange-600 uppercase mb-2 sm:mb-3">
 <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
 </svg>
 <span>Contact Club</span>
 </div>
 <div className="space-y-2">
 {contract.clubs.email && (
 <a
 href={`mailto:${contract.clubs.email}`}
 className="flex items-center gap-2 text-slate-900 hover:text-orange-600 text-xs sm:text-sm transition-colors truncate font-semibold group"
 >
 <svg className="w-4 h-4 flex-shrink-0 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
 </svg>
 <span className="truncate">{contract.clubs.email}</span>
 </a>
 )}
 {contract.clubs.phone && (
 <a
 href={`tel:${contract.clubs.phone}`}
 className="flex items-center gap-2 text-slate-900 hover:text-orange-600 text-xs sm:text-sm transition-colors font-semibold group"
 >
 <svg className="w-4 h-4 flex-shrink-0 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
 </svg>
 <span>{contract.clubs.phone}</span>
 </a>
 )}
 </div>
 </Card>
 )}
 </div>
 </div>
 </Card>
 </div>

 {/* Contract Viewer */}
 {contractHtml ? (
 <div className="w-full max-w-4xl mx-auto">
 {/* Display stored HTML contract - Mobile Optimized */}
 <Card className="bg-white rounded-2xl shadow-xl border-0 overflow-hidden mb-6 sm:mb-8">
 <div className="p-4 sm:p-6 md:p-8 lg:p-10">
 <div
 className="contract-content prose prose-sm sm:prose-base lg:prose-lg max-w-none
 [&>h1]:text-lg [&>h1]:sm:text-xl [&>h1]:md:text-2xl [&>h1]:lg:text-3xl [&>h1]:mb-3 [&>h1]:sm:mb-4 [&>h1]:leading-tight
 [&>h2]:text-base [&>h2]:sm:text-lg [&>h2]:md:text-xl [&>h2]:lg:text-2xl [&>h2]:mb-2 [&>h2]:sm:mb-3 [&>h2]:leading-snug [&>h2]:mt-4 [&>h2]:sm:mt-6
 [&>h3]:text-sm [&>h3]:sm:text-base [&>h3]:md:text-lg [&>h3]:mb-2 [&>h3]:leading-snug [&>h3]:mt-3 [&>h3]:sm:mt-4
 [&>p]:text-xs [&>p]:sm:text-sm [&>p]:md:text-base [&>p]:leading-relaxed [&>p]:mb-2 [&>p]:sm:mb-3 [&>p]:break-words
 [&>ul]:text-xs [&>ul]:sm:text-sm [&>ul]:md:text-base [&>ul]:space-y-1 [&>ul]:sm:space-y-1.5 [&>ul]:mb-3 [&>ul]:sm:mb-4
 [&>ol]:text-xs [&>ol]:sm:text-sm [&>ol]:md:text-base [&>ol]:space-y-1 [&>ol]:sm:space-y-1.5 [&>ol]:mb-3 [&>ol]:sm:mb-4
 [&>li]:leading-relaxed [&>li]:break-words
 [&_table]:text-xs [&_table]:sm:text-sm [&_table]:md:text-base [&_table]:overflow-x-auto [&_table]:block [&_table]:sm:table
 [&_td]:px-2 [&_td]:sm:px-3 [&_td]:py-1.5 [&_td]:sm:py-2 [&_td]:break-words
 [&_th]:px-2 [&_th]:sm:px-3 [&_th]:py-1.5 [&_th]:sm:py-2 [&_th]:text-xs [&_th]:sm:text-sm
 [&>*]:overflow-wrap-anywhere"
 dangerouslySetInnerHTML={{ __html: contractHtml }}
 />
 </div>
 </Card>

 {/* Signing Panel - PROMINENT AND ATTENTION-GRABBING */}
 {contract.signing_status === 'unsigned' && (
 <div className="w-full max-w-4xl mx-auto mt-6 sm:mt-8 mb-6 sm:mb-8">
 {/* Sticky Badge */}
 <div className="mb-5 sm:mb-6 text-center">
 <div className="inline-block bg-gradient-to-r from-orange-500 to-amber-500 text-white px-5 sm:px-8 py-2.5 sm:py-3 rounded-full font-bold text-sm sm:text-base shadow-xl shadow-orange-500/40 animate-pulse">
 ⭐ ACTION REQUIRED - Sign Your Contract
 </div>
 </div>

 <Card className="p-5 sm:p-8 md:p-10 bg-white border-3 sm:border-4 border-orange-400 shadow-2xl shadow-orange-500/30 relative overflow-hidden rounded-xl sm:rounded-2xl">
 {/* Decorative background accent */}
 <div className="absolute -top-20 -right-20 w-60 h-60 bg-gradient-to-br from-orange-100 to-amber-100 rounded-full opacity-50 pointer-events-none"></div>
 <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-gradient-to-tr from-amber-100 to-orange-100 rounded-full opacity-30 pointer-events-none"></div>
 
 <div className="relative z-10">
 <div className="flex items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
 <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center text-2xl sm:text-3xl shadow-lg">
 ✍️
 </div>
 <h2 className="text-xl sm:text-3xl md:text-4xl font-extrabold text-slate-800">Sign This Contract</h2>
 </div>
 <p className="text-sm sm:text-base md:text-lg text-slate-600 mb-5 sm:mb-8 font-medium leading-relaxed">
 Complete the form below to digitally sign and accept this contract. This action is final and legally binding.
 </p>
 
 {/* Progress indicator */}
 <div className="mb-4 sm:mb-8 p-3 sm:p-5 bg-gradient-to-r from-orange-50 to-amber-50 rounded-lg sm:rounded-xl border-2 border-orange-200">
 <p className="text-sm sm:text-base font-bold text-orange-900 mb-3 sm:mb-4">📋 Signing Progress:</p>
 <div className="space-y-2 sm:space-y-3">
 <div className="flex items-center gap-3 sm:gap-4">
 <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold shadow-md transition-all ${signature.trim() ? 'bg-gradient-to-br from-emerald-500 to-teal-500 text-white' : 'bg-slate-200 text-slate-500'}`}>
 {signature.trim() ? '✓' : '1'}
 </div>
 <span className={`text-xs sm:text-base ${signature.trim() ? 'text-emerald-700 font-bold' : 'text-slate-600'}`}>
 Your name provided {signature.trim() && <span className="text-emerald-500">✓</span>}
 </span>
 </div>
 <div className="flex items-center gap-3 sm:gap-4">
 <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold shadow-md transition-all ${signingDate ? 'bg-gradient-to-br from-emerald-500 to-teal-500 text-white' : 'bg-slate-200 text-slate-500'}`}>
 {signingDate ? '✓' : '2'}
 </div>
 <span className={`text-xs sm:text-base ${signingDate ? 'text-emerald-700 font-bold' : 'text-slate-600'}`}>
 Signing date selected {signingDate && <span className="text-emerald-500">✓</span>}
 </span>
 </div>
 <div className="flex items-center gap-3 sm:gap-4">
 <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold shadow-md transition-all ${agreedToTerms ? 'bg-gradient-to-br from-emerald-500 to-teal-500 text-white' : 'bg-slate-200 text-slate-500'}`}>
 {agreedToTerms ? '✓' : '3'}
 </div>
 <span className={`text-xs sm:text-base ${agreedToTerms ? 'text-emerald-700 font-bold' : 'text-slate-600'}`}>
 Terms agreed & confirmed {agreedToTerms && <span className="text-emerald-500">✓</span>}
 </span>
 </div>
 </div>
 </div>
 
 {/* Validation Errors - PROMINENT */}
 {validationErrors.length > 0 && (
 <div className="mb-4 sm:mb-8 p-4 sm:p-6 bg-red-50 border-l-4 sm:border-l-8 border-red-500 rounded-r-lg sm:rounded-r-xl shadow-lg">
 <h3 className="font-bold text-red-900 mb-2 sm:mb-3 text-base sm:text-lg flex items-center gap-2 sm:gap-3">
 <span className="text-xl sm:text-2xl">🚨</span> Please Fix These Issues
 </h3>
 <ul className="space-y-1 sm:space-y-2">
 {validationErrors.map((errorMsg, idx) => (
 <li key={idx} className="text-red-800 font-medium flex items-start gap-2 sm:gap-3 text-xs sm:text-base">
 <span className="text-red-500 font-bold mt-0.5">▸</span>
 <span>{errorMsg}</span>
 </li>
 ))}
 </ul>
 </div>
 )}
 
 {/* Form Fields - Larger and More Prominent */}
 <div className="space-y-4 sm:space-y-6 mb-4 sm:mb-8 bg-gradient-to-b from-slate-50 to-white p-3 sm:p-6 md:p-8 rounded-xl sm:rounded-2xl border-2 border-slate-200">
 <div>
 <label className="block text-sm sm:text-lg font-bold text-slate-900 mb-2 sm:mb-3">
 👤 Your Full Name (for signature) <span className="text-red-500 text-base sm:text-xl">*</span>
 </label>
 <input
 type="text"
 placeholder={playerName}
 value={signature}
 onChange={(e) => {
 setSignature(e.target.value)
 setValidationErrors([])
 }}
 className={`w-full px-3 sm:px-6 py-3 sm:py-5 border-2 rounded-lg sm:rounded-xl text-sm sm:text-lg font-semibold focus:outline-none focus:ring-4 transition-all ${
 validationErrors.some(e => e.includes('Signature'))
 ? 'border-red-400 bg-red-50 focus:ring-red-200'
 : 'border-slate-300 focus:border-orange-500 focus:ring-orange-200'
 }`}
 autoFocus
 />
 {signature.trim() && (
 <p className="text-emerald-600 text-xs sm:text-base font-semibold mt-2 sm:mt-3 flex items-center gap-2">
 <span>✓</span> Signature name entered
 </p>
 )}
 </div>
 <div>
 <label className="block text-sm sm:text-lg font-bold text-slate-900 mb-2 sm:mb-3">
 📅 Signing Date <span className="text-red-500 text-base sm:text-xl">*</span>
 </label>
 <input
 type="date"
 value={signingDate}
 onChange={(e) => {
 setSigningDate(e.target.value)
 setValidationErrors([])
 }}
 className={`w-full px-3 sm:px-6 py-3 sm:py-5 border-2 rounded-lg sm:rounded-xl text-sm sm:text-lg font-semibold focus:outline-none focus:ring-4 transition-all ${
 validationErrors.some(e => e.includes('date'))
 ? 'border-red-400 bg-red-50 focus:ring-red-200'
 : 'border-slate-300 focus:border-orange-500 focus:ring-orange-200'
 }`}
 />
 {signingDate && (
 <p className="text-emerald-600 text-xs sm:text-base font-semibold mt-2 sm:mt-3 flex items-center gap-2">
 <span>✓</span> Date selected: {new Date(signingDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
 </p>
 )}
 </div>
 </div>

 {/* Terms Agreement - HIGHLY PROMINENT */}
 <div className={`p-3 sm:p-6 md:p-8 mb-4 sm:mb-8 rounded-xl sm:rounded-2xl border-2 sm:border-3 transition-all ${
 agreedToTerms 
 ? 'bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-400 shadow-lg shadow-emerald-500/10' 
 : 'bg-gradient-to-r from-amber-50 to-orange-50 border-amber-400 border-dashed'
 }`}>
 <label className="flex items-start gap-3 sm:gap-5 cursor-pointer group">
 <div className="relative mt-1">
 <input
 type="checkbox"
 checked={agreedToTerms}
 onChange={(e) => {
 setAgreedToTerms(e.target.checked)
 setValidationErrors([])
 }}
 className="w-5 h-5 sm:w-7 sm:h-7 accent-emerald-600 cursor-pointer rounded-lg"
 />
 </div>
 <div className="flex-1">
 <p className={`text-base sm:text-xl font-bold mb-2 sm:mb-3 ${agreedToTerms ? 'text-emerald-800' : 'text-amber-900'}`}>
 🔒 I Understand & Accept All Terms
 </p>
 <p className={`text-xs sm:text-base leading-relaxed ${agreedToTerms ? 'text-emerald-800' : 'text-amber-900'}`}>
 I have fully read and reviewed the entire contract including:
 <br />
 <strong>• Anti-Drug Policy</strong> - Zero tolerance enforcement
 <br />
 <strong>• General Terms & Conditions</strong> - All contractual obligations
 <br />
 <br />
 I acknowledge that violation of any terms will result in <strong className="text-red-600">immediate contract termination</strong> and loss of all benefits.
 </p>
 </div>
 </label>
 {agreedToTerms && (
 <p className="text-emerald-700 text-xs sm:text-base font-bold mt-3 sm:mt-4 flex items-center gap-2">
 <span className="text-lg sm:text-xl">✅</span> All terms accepted - Ready to sign
 </p>
 )}
 {validationErrors.some(e => e.includes('agree')) && (
 <p className="text-red-600 text-xs sm:text-base font-bold mt-3 sm:mt-4 flex items-center gap-2">
 <span className="text-lg sm:text-xl">⚠️</span> You must agree to all terms to proceed
 </p>
 )}
 </div>

 {/* Action Buttons - PROMINENT */}
 <div className="flex flex-col md:flex-row gap-3 sm:gap-4">
 <Button
 onClick={() => handleSignContract(contract.id)}
 disabled={
 isSigning || 
 !signature.trim() || 
 !signingDate || 
 !agreedToTerms
 }
 className={`flex-1 font-bold py-4 sm:py-6 md:py-5 text-base sm:text-lg md:text-xl rounded-lg sm:rounded-xl transition-all shadow-lg sm:shadow-xl ${
 isSigning || !signature.trim() || !signingDate || !agreedToTerms
 ? 'bg-slate-400 cursor-not-allowed opacity-60'
 : 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-emerald-500/30 hover:shadow-2xl transform hover:scale-[1.02]'
 }`}
 >
 {isSigning ? (
 <span className="flex items-center justify-center gap-2 sm:gap-3">
 <span className="animate-spin text-xl sm:text-2xl">⏳</span> <span className="text-sm sm:text-base">Processing...</span>
 </span>
 ) : (
 <span className="flex items-center justify-center gap-2 sm:gap-3">
 <span className="text-xl sm:text-2xl">✓</span> <span className="text-sm sm:text-base">Sign & Accept Contract</span>
 </span>
 )}
 </Button>
 <Button
 onClick={() => router.push('/dashboard/player/contracts')}
 variant="outline"
 className="flex-1 text-sm sm:text-lg font-bold py-4 sm:py-6 md:py-5 rounded-lg sm:rounded-xl border-2 sm:border-3 border-slate-300 hover:bg-red-50 hover:border-red-400 hover:text-red-700 transition-all"
 >
 ❌ <span className="hidden sm:inline">Decline & Exit</span><span className="sm:hidden">Decline</span>
 </Button>
 </div>

 {/* Warning message */}
 <div className="mt-4 sm:mt-8 p-3 sm:p-5 bg-gradient-to-r from-purple-50 to-indigo-50 border-l-4 border-purple-500 rounded-xl text-purple-900">
 <p className="font-bold text-xs sm:text-base">⚡ Important: This is a legally binding digital signature.</p>
 <p className="mt-2 text-xs sm:text-base">Once signed, you cannot undo this action. Please review all terms carefully before proceeding.</p>
 </div>
 </div>
 </Card>
 </div>
 )}

 {/* Signed Contract Info */}
 {contract.signing_status === 'fully_signed' && contract.player_signature_timestamp && (
 <div className="max-w-4xl mx-auto mt-6 sm:mt-10 mb-6 sm:mb-10 px-2 sm:px-0">
 <Card className="p-4 sm:p-8 md:p-10 bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 border-2 sm:border-4 border-emerald-400 shadow-xl sm:shadow-2xl shadow-emerald-500/20 rounded-xl sm:rounded-2xl">
 <div className="flex items-center gap-3 sm:gap-5 mb-4 sm:mb-6">
 <div className="w-12 h-12 sm:w-20 sm:h-20 rounded-xl sm:rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-2xl sm:text-4xl shadow-xl">
 ✅
 </div>
 <div>
 <h3 className="text-xl sm:text-3xl font-extrabold text-emerald-900">Contract Successfully Signed!</h3>
 <p className="text-xs sm:text-base text-emerald-700 mt-1">This contract is now active and legally binding</p>
 </div>
 </div>
 <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-5 p-3 sm:p-6 bg-white rounded-lg sm:rounded-xl border-2 border-emerald-200">
 <div className="p-3 sm:p-4 bg-emerald-50 rounded-lg sm:rounded-xl">
 <p className="text-xs text-emerald-700 font-bold uppercase mb-1 sm:mb-2">👤 Signed By</p>
 <p className="text-base sm:text-xl font-bold text-emerald-900 break-words">{playerName}</p>
 </div>
 <div className="p-3 sm:p-4 bg-emerald-50 rounded-lg sm:rounded-xl">
 <p className="text-xs text-emerald-700 font-bold uppercase mb-1 sm:mb-2">📅 Signed On</p>
 <p className="text-base sm:text-xl font-bold text-emerald-900">
 {new Date(contract.player_signature_timestamp).toLocaleString('en-IN', {
 dateStyle: 'long',
 timeStyle: 'short'
 })}
 </p>
 </div>
 </div>
 </Card>
 </div>
 )}
 </div>
 ) : (
 /* Fallback to component view if HTML not available */
 <ProfessionalContractViewer
 contract={contract}
 playerName={playerName}
 playerId={player.id}
 onSign={handleSignContract}
 isFullPage={true}
 />
 )}
 </div>
 </div>
 )
}
