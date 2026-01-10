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
 <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
 {/* Top Navigation - Sticky with Status Bar Fix */}
 <nav className="sticky-nav-mobile-safe bg-white border-b border-slate-200 shadow-md sticky top-0 z-50">
 <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
 <div className="flex justify-between items-center h-14 sm:h-16">
 <div className="flex items-center gap-2 sm:gap-3">
 <Button
 onClick={() => router.push('/dashboard/club-owner/contracts')}
 variant="outline"
 size="sm"
 className="text-xs sm:text-sm px-2 sm:px-4 py-1.5 sm:py-2 border-2 hover:bg-blue-50 hover:border-blue-300 transition-all"
 >
 ← <span className="hidden sm:inline ml-1">Back</span>
 </Button>
 <span className="text-slate-400 hidden sm:inline">|</span>
 <div className="flex items-center gap-2">
 <span className="text-lg sm:text-xl">📋</span>
 <h1 className="text-sm sm:text-lg font-bold text-slate-900 truncate">
 {club?.club_name ? `${club.club_name} - Contract` : 'Contract Preview'}
 </h1>
 </div>
 </div>
 <div className="flex items-center gap-2 sm:gap-3">
 <Button
 onClick={() => window.print()}
 variant="outline"
 size="sm"
 className="text-xs sm:text-sm px-2 sm:px-3 py-1.5 sm:py-2 border-2 hover:bg-slate-50 transition-all"
 >
 🖨️ <span className="hidden sm:inline ml-1">Print</span>
 </Button>
 <Button
 onClick={() => router.push('/dashboard/club-owner/contracts')}
 variant="outline"
 size="sm"
 className="text-xs sm:text-sm px-2 sm:px-4 py-1.5 sm:py-2 border-2 bg-blue-500 text-white hover:bg-blue-600 transition-all"
 >
 📋 <span className="hidden sm:inline ml-1">All Contracts</span>
 </Button>
 </div>
 </div>
 </div>
 </nav>

 {/* Main Content */}
 <div className="py-5 sm:py-8 px-3 sm:px-6">
 {/* Contract Viewer */}
 {contractHtml ? (
 <div className="max-w-4xl mx-auto">
 {/* Display stored HTML contract */}
 <Card className="bg-white rounded-xl sm:rounded-2xl shadow-2xl overflow-hidden border-2 border-slate-200 hover:shadow-3xl transition-shadow p-6 sm:p-8 md:p-10 mb-6 sm:mb-8">
 <div
 className="contract-content prose prose-sm sm:prose-base max-w-none"
 dangerouslySetInnerHTML={{ __html: contractHtml }}
 />
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
