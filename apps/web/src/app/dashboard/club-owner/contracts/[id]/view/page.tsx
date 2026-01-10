'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

interface Contract {
 id: string
 player_id: string
 club_id: string
 status: 'pending' | 'active' | 'rejected' | 'terminated'
 contract_start_date: string
 contract_end_date: string
 salary_monthly?: number
 annual_salary?: number
 position_assigned?: string
 jersey_number?: number
 contract_html?: string
 signing_status?: string
 player_signature_timestamp?: string
 player_signature_data?: any
 created_at?: string
}

interface Player {
 id: string
 user_id: string
 users?: {
 first_name: string
 last_name: string
 }
}

interface Club {
 id: string
 club_name: string
 logo_url?: string
 email?: string
 phone?: string
 city?: string
 state?: string
}

export default function ClubOwnerContractViewPage() {
 const router = useRouter()
 const params = useParams()
 const contractId = params.id as string

 const [contract, setContract] = useState<Contract | null>(null)
 const [player, setPlayer] = useState<Player | null>(null)
 const [club, setClub] = useState<Club | null>(null)
 const [contractHtml, setContractHtml] = useState<string | null>(null)
 const [loading, setLoading] = useState(true)
 const [error, setError] = useState<string | null>(null)

 console.log('ClubOwnerContractViewPage rendered with contractId:', contractId)

 useEffect(() => {
 console.log('useEffect running with contractId:', contractId)
 loadContractDetails()
 }, [contractId])

 const loadContractDetails = async () => {
 try {
 setLoading(true)
 setError(null)

 const supabase = createClient()
 const { data: { user } } = await supabase.auth.getUser()

 if (!user) {
 console.log('No user found, redirecting to login')
 router.push('/auth/login')
 return
 }

 console.log('Authenticated user ID:', user.id)
 console.log('Contract ID from URL:', contractId)

 // Get club owned by this user
 const { data: clubData, error: clubError } = await supabase
 .from('clubs')
 .select('*')
 .eq('owner_id', user.id)
 .single()

 console.log('Club query result:', { clubData, clubError })

 if (!clubData) {
 console.error('Club not found for user:', user.id)
 setError('Club not found')
 return
 }

 console.log('Club found:', clubData.id, clubData.club_name)
 setClub(clubData)

 // Get contract by ID - fetch all columns to see what's happening
 const { data: contractData, error: contractError } = await supabase
 .from('contracts')
 .select('*')
 .eq('id', contractId)
 .single()

 console.log('Contract query result:', {
 contractId,
 contractData,
 contractError,
 errorMessage: contractError?.message,
 errorCode: contractError?.code
 })

 if (contractError) {
 console.error('Contract query error details:', {
 message: contractError.message,
 details: contractError.details,
 code: contractError.code,
 status: (contractError as any).status
 })
 }

 if (!contractData) {
 console.error('Contract not found with ID:', contractId)
 const msg = 'Contract not found'
 alert(`ALERT 1: ${msg}`)
 setError(msg)
 return
 }

 console.log('Contract found:', {
 id: contractData.id,
 club_id: contractData.club_id,
 player_id: contractData.player_id,
 status: contractData.status
 })

 // Verify the contract belongs to this club owner's club
 if (contractData.club_id !== clubData.id) {
 console.error('Club mismatch:', {
 contractClubId: contractData.club_id,
 userClubId: clubData.id,
 userClubName: clubData.club_name
 })
 const msg = `You do not have permission to view this contract. Contract is for club ${contractData.club_id} but you own club ${clubData.id}`
 alert(`ALERT 2: ${msg}`)
 setError('You do not have permission to view this contract')
 return
 }

 console.log('Permission check passed')

 setContract(contractData)

 // Get player details - fetch separately to avoid RLS recursion issues
 const { data: playerData, error: playerError } = await supabase
 .from('players')
 .select('id, user_id, position, photo_url, unique_player_id, jersey_number, height_cm, weight_kg, date_of_birth, nationality, preferred_foot, current_club_id, is_available_for_scout')
 .eq('id', contractData.player_id)
 .single()

 if (playerError) {
 console.error('Error loading player data:', {
 playerId: contractData.player_id,
 message: playerError?.message,
 details: playerError?.details,
 code: playerError?.code
 })
 }

 if (playerData) {
 // Fetch user data separately
 const { data: userData } = await supabase
 .from('users')
 .select('id, first_name, last_name')
 .eq('id', playerData.user_id)
 .single()
 
 setPlayer({
 ...playerData,
 users: userData || undefined
 })
 }

 // Always regenerate HTML to ensure latest signature data is displayed
 try {
 const { generateContractHTML, getDefaultPCLPolicies } = await import('@/utils/contractGenerator')
 let playerName = 'Player'
 
 if (playerData) {
 const { data: userData } = await supabase
 .from('users')
 .select('first_name, last_name')
 .eq('id', playerData.user_id)
 .single()
 
 if (userData) {
 playerName = `${userData.first_name} ${userData.last_name}`
 }
 }

 const policies = getDefaultPCLPolicies()
 const generatedHtml = generateContractHTML({
 contractId: contractData.id,
 clubName: clubData.club_name,
 clubLogo: clubData.logo_url,
 clubEmail: clubData.email,
 clubPhone: clubData.phone,
 clubCity: clubData.city,
 clubState: clubData.state,
 playerName,
 playerId: playerData?.id || contractData.player_id,
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
 console.error('Full error object:', JSON.stringify(err, null, 2))
 alert(`Error: ${errorMessage}\n\nCheck console for details`)
 } finally {
 setLoading(false)
 }
 }

 if (loading) {
 return (
 <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center px-2 sm:px-4">
 <div className="text-slate-600 text-sm sm:text-base">Loading contract...</div>
 </div>
 )
 }

 if (error || !contract) {
 console.log('Rendering error state:', { error, hasContract: !!contract, loading })
 return (
 <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-4 sm:py-8 px-2 sm:px-4">
 <div className="max-w-4xl mx-auto">
 <Card className="p-4 sm:p-8 border-red-200 bg-red-50 rounded-lg sm:rounded-xl">
 <h2 className="text-xl sm:text-2xl font-bold text-red-900 mb-3 sm:mb-4">Unable to Load Contract</h2>
 <p className="text-red-800 mb-4 sm:mb-6 text-sm sm:text-base">
 {error || 'The contract could not be loaded. Please try again or contact support.'}
 </p>
 <Button
 onClick={() => router.push('/dashboard/club-owner/contracts')}
 className="bg-red-600 hover:bg-red-700 text-sm sm:text-base px-4 py-2"
 >
 Back to Contracts
 </Button>
 </Card>
 </div>
 </div>
 )
 }

 return (
 <div className="min-h-screen bg-gradient-to-br from-slate-50 via-teal-50/20 to-slate-100">
 {/* Top Navigation - Modern & Clean */}
 <nav className="sticky-nav-mobile-safe bg-white/95 backdrop-blur-xl border-b border-slate-200 shadow-lg sticky top-0 z-50">
 <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
 <div className="flex justify-between items-center h-16 sm:h-20">
 {/* Left Section */}
 <div className="flex items-center gap-3 sm:gap-4">
 <Button
 onClick={() => router.push('/dashboard/club-owner/contracts')}
 variant="ghost"
 size="sm"
 className="group flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl hover:bg-teal-50 transition-all duration-200"
 >
 <svg className="w-5 h-5 sm:w-6 sm:h-6 text-slate-600 group-hover:text-teal-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
 </svg>
 <span className="hidden sm:inline font-semibold text-slate-700 group-hover:text-teal-600">Back</span>
 </Button>
 <div className="h-8 w-px bg-slate-200 hidden sm:block"></div>
 <div className="flex items-center gap-2 sm:gap-3">
 <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-teal-500/30">
 <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
 </svg>
 </div>
 <div>
 <h1 className="text-sm sm:text-lg font-bold text-slate-900 truncate max-w-[150px] sm:max-w-none">
 {club?.club_name || 'Contract'}
 </h1>
 <p className="text-xs text-slate-500 hidden sm:block">Player Contract Details</p>
 </div>
 </div>
 </div>

 {/* Right Section */}
 <div className="flex items-center gap-2 sm:gap-3">
 <Button
 onClick={() => window.print()}
 variant="ghost"
 size="sm"
 className="group flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl hover:bg-slate-50 transition-all duration-200"
 >
 <svg className="w-4 h-4 sm:w-5 sm:h-5 text-slate-600 group-hover:text-slate-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
 </svg>
 <span className="hidden sm:inline font-semibold text-slate-700 group-hover:text-slate-900">Print</span>
 </Button>
 <Button
 onClick={() => router.push('/dashboard/club-owner/contracts')}
 className="flex items-center gap-2 px-3 sm:px-5 py-2 sm:py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white font-bold shadow-lg shadow-teal-500/30 hover:shadow-xl hover:shadow-teal-500/40 transition-all duration-200"
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
 <div className="py-5 sm:py-8 px-4 sm:px-6">
 {/* Contract Overview - Modern Mobile-Optimized Design */}
 <div className="w-full max-w-4xl mx-auto mb-6 sm:mb-8">
 <Card className="rounded-2xl bg-gradient-to-br from-teal-500 via-teal-400 to-cyan-500 border-0 shadow-xl overflow-hidden">
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
 <span className="hidden sm:inline">Awaiting Player Signature</span>
 <span className="sm:hidden">Pending</span>
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
 {/* Player Info */}
 {player && player.users && (
 <Card className="bg-white/95 backdrop-blur-sm rounded-xl sm:rounded-2xl p-4 sm:p-5 border-0 shadow-md hover:shadow-xl transition-all duration-200 hover:scale-[1.02]">
 <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-teal-600 uppercase mb-2 sm:mb-3">
 <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
 </svg>
 <span>Player</span>
 </div>
 <div className="text-base sm:text-lg md:text-xl font-bold text-slate-900 break-words leading-tight mb-1">
 {player.users.first_name} {player.users.last_name}
 </div>
 </Card>
 )}

 {/* Contract Period */}
 <Card className="bg-white/95 backdrop-blur-sm rounded-xl sm:rounded-2xl p-4 sm:p-5 border-0 shadow-md hover:shadow-xl transition-all duration-200 hover:scale-[1.02]">
 <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-teal-600 uppercase mb-2 sm:mb-3">
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
 {contract.position_assigned && (
 <Card className="bg-white/95 backdrop-blur-sm rounded-xl sm:rounded-2xl p-4 sm:p-5 border-0 shadow-md hover:shadow-xl transition-all duration-200 hover:scale-[1.02]">
 <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-teal-600 uppercase mb-2 sm:mb-3">
 <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
 </svg>
 <span>Position</span>
 </div>
 <div className="text-base sm:text-lg md:text-xl font-bold text-slate-900 capitalize leading-tight">
 {contract.position_assigned}
 </div>
 {contract.jersey_number && (
 <div className="text-xs sm:text-sm text-slate-600 mt-1.5 font-medium">
 Jersey #{contract.jersey_number}
 </div>
 )}
 </Card>
 )}

 {/* Status */}
 <Card className="bg-white/95 backdrop-blur-sm rounded-xl sm:rounded-2xl p-4 sm:p-5 border-0 shadow-md hover:shadow-xl transition-all duration-200 hover:scale-[1.02]">
 <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-teal-600 uppercase mb-2 sm:mb-3">
 <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
 </svg>
 <span>Contract Status</span>
 </div>
 <div className={`inline-flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full font-bold text-xs sm:text-sm shadow-md ${
 contract.status === 'active'
 ? 'bg-emerald-100 text-emerald-800 border-2 border-emerald-300'
 : contract.status === 'pending'
 ? 'bg-amber-100 text-amber-800 border-2 border-amber-300'
 : 'bg-slate-100 text-slate-800 border-2 border-slate-300'
 }`}>
 {contract.status.charAt(0).toUpperCase() + contract.status.slice(1)}
 </div>
 </Card>
 </div>
 </div>
 </Card>
 </div>

 {/* Contract Viewer */}
 {contractHtml ? (
 <div className="max-w-4xl mx-auto">
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

 {/* Contract Status Info */}
 <div className="max-w-4xl mx-auto">
 <Card className={`p-4 sm:p-6 md:p-8 border-3 shadow-lg rounded-xl sm:rounded-2xl ${
 contract.signing_status === 'fully_signed'
 ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-300'
 : contract.signing_status === 'unsigned'
 ? 'bg-gradient-to-r from-yellow-50 to-amber-50 border-yellow-300'
 : 'bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-300'
 }`}>
 <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6">
 {/* Contract Status */}
 <div>
 <h3 className="text-xs sm:text-sm font-bold text-slate-700 mb-2 sm:mb-3 uppercase tracking-wide">Contract Status</h3>
 <div className={`inline-flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-full font-bold text-xs sm:text-sm shadow-md ${
 contract.status === 'active'
 ? 'bg-green-100 text-green-800 border-2 border-green-300'
 : contract.status === 'pending'
 ? 'bg-yellow-100 text-yellow-800 border-2 border-yellow-300'
 : contract.status === 'rejected'
 ? 'bg-red-100 text-red-800 border-2 border-red-300'
 : 'bg-gray-100 text-gray-800 border-2 border-gray-300'
 }`}>
 {contract.status === 'active' && '✓'}
 {contract.status === 'pending' && '⏳'}
 {contract.status === 'rejected' && '✗'}
 {contract.status === 'terminated' && '⊗'}
 {' '}{contract.status.toUpperCase()}
 </div>
 </div>

 {/* Signing Status */}
 <div>
 <h3 className="text-xs sm:text-sm font-bold text-slate-700 mb-2 sm:mb-3 uppercase tracking-wide">Signing Status</h3>
 <div className={`inline-flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-full font-bold text-xs sm:text-sm shadow-md ${
 contract.signing_status === 'fully_signed'
 ? 'bg-green-100 text-green-800 border-2 border-green-300'
 : 'bg-yellow-100 text-yellow-800 border-2 border-yellow-300'
 }`}>
 {contract.signing_status === 'fully_signed' ? '✓' : '⏳'}
 {' '}{contract.signing_status?.toUpperCase() || 'UNSIGNED'}
 </div>
 </div>

 {/* Signed Date */}
 {contract.player_signature_timestamp && (
 <div>
 <h3 className="text-xs sm:text-sm font-bold text-slate-700 mb-2 sm:mb-3 uppercase tracking-wide">Signed On</h3>
 <p className="text-slate-900 font-semibold text-xs sm:text-sm md:text-base break-words">
 {new Date(contract.player_signature_timestamp).toLocaleString('en-IN')}
 </p>
 </div>
 )}
 </div>

 {/* Player Signature Info */}
 {contract.player_signature_data && (
 <div className="mt-5 sm:mt-6 pt-5 sm:pt-6 border-t-2 border-slate-200">
 <h3 className="text-sm sm:text-base font-bold text-slate-700 mb-3 sm:mb-4 uppercase tracking-wide">Player Signature Information</h3>
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
 <Card className="p-3 sm:p-4 bg-slate-50 border-2 border-slate-200 rounded-lg shadow-sm">
 <span className="text-xs sm:text-sm text-slate-600 font-semibold block mb-1">Signed By:</span>
 <p className="font-bold text-slate-900 text-sm sm:text-base break-words">{contract.player_signature_data.name}</p>
 </Card>
 <Card className="p-3 sm:p-4 bg-slate-50 border-2 border-slate-200 rounded-lg shadow-sm">
 <span className="text-xs sm:text-sm text-slate-600 font-semibold block mb-1">Method:</span>
 <p className="font-bold text-slate-900 capitalize text-sm sm:text-base">{contract.player_signature_data.method}</p>
 </Card>
 {contract.player_signature_data.signedAt && (
 <Card className="p-3 sm:p-4 bg-slate-50 border-2 border-slate-200 rounded-lg shadow-sm md:col-span-2">
 <span className="text-xs sm:text-sm text-slate-600 font-semibold block mb-1">Date:</span>
 <p className="font-bold text-slate-900 text-sm sm:text-base">{contract.player_signature_data.signedAt}</p>
 </Card>
 )}
 </div>
 </div>
 )}
 </Card>
 </div>
 </div>
 ) : (
 <div className="max-w-4xl mx-auto">
 <Card className="p-6 sm:p-8 text-center border-2 border-yellow-300 bg-yellow-50 rounded-xl shadow-lg">
 <p className="text-yellow-800 text-sm sm:text-base font-medium">
 <strong>Note:</strong> Contract HTML is not available for this contract.
 </p>
 </Card>
 </div>
 )}
 </div>
 </div>
 )
}
