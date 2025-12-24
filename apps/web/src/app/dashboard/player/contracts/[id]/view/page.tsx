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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="p-12 shadow-2xl border-2 border-accent/30">
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
            <div className="text-center">
              <h3 className="text-xl font-bold text-foreground mb-2">Loading Contract</h3>
              <p className="text-muted-foreground">Please wait while we fetch your contract details...</p>
            </div>
          </div>
        </Card>
      </div>
    )
  }

  if (error || !contract || !player) {
    return (
      <div className="min-h-screen bg-background py-8 px-4 flex items-center justify-center">
        <div className="max-w-2xl w-full">
          <Card className="p-10 border-4 border-destructive/30 bg-destructive/10 shadow-2xl">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-full bg-destructive flex items-center justify-center text-3xl shadow-lg">
                ⚠️
              </div>
              <h2 className="text-3xl font-bold text-destructive">Unable to Load Contract</h2>
            </div>
            <div className="bg-card p-6 rounded-lg border-2 border-destructive/20 mb-6">
              <p className="text-destructive text-lg leading-relaxed">
                {error || 'The contract could not be loaded. Please try again or contact support.'}
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={() => router.push('/dashboard/player/contracts')}
                className="flex-1 btn-lift font-semibold py-6 text-lg"
              >
                ← Back to Contracts
              </Button>
              <Button
                onClick={() => window.location.reload()}
                variant="outline"
                className="flex-1 btn-lift font-semibold py-6 text-lg"
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
    <div className="min-h-screen bg-background">
      {/* Top Navigation */}
      <nav className="bg-card border-b-2 border-accent/20 shadow-lg fixed top-0 inset-x-0 z-50 backdrop-blur-sm bg-card/95">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <Button
                onClick={() => router.back()}
                className="btn-lift font-semibold shadow-md"
                size="sm"
              >
                ← Back
              </Button>
              <span className="text-accent/50">|</span>
              <div>
                <h1 className="text-lg font-bold text-foreground">
                  📋 {contract.clubs.club_name}
                </h1>
                <p className="text-xs text-muted-foreground">Contract Details & Signing</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button
                onClick={() => window.print()}
                variant="outline"
                size="sm"
                className="border-2 btn-lift font-medium"
              >
                🖨️ Print
              </Button>
              <Button
                onClick={() => router.push('/dashboard/player/contracts')}
                variant="gradient"
                className="btn-lift font-semibold shadow-md"
                size="sm"
              >
                All Contracts
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="pt-0 pb-8 flex flex-col items-center">
        {error && !loading && (
          <div className="w-full max-w-4xl mx-auto px-4 mb-6">
            <Card className="p-4 border-red-200 bg-red-50">
              <p className="text-red-800">
                <strong>Error:</strong> {error}
              </p>
            </Card>
          </div>
        )}

        {/* Contract Overview - Modern Optimized */}
        <div className="w-full max-w-3xl mx-auto px-4 mt-0 mb-10">
          <div className="rounded-xl gradient-brand border border-accent/20 shadow-xl p-6 md:p-8 flex flex-col items-center text-center relative overflow-hidden">
            <div className="absolute inset-0 opacity-10 bg-grid-pattern"></div>
            <div className="relative z-10 w-full">
              <h2 className="text-2xl md:text-3xl font-extrabold text-white mb-2 tracking-tight">Contract Overview</h2>
              {contract.status === 'pending' && (
                <span className="inline-flex items-center gap-2 px-4 py-1.5 mb-4 rounded-full bg-warning text-warning-foreground font-semibold text-sm shadow">
                  ⚠️ Action Required
                </span>
              )}
              {contract.status === 'active' && (
                <span className="inline-flex items-center gap-2 px-4 py-1.5 mb-4 rounded-full bg-success text-success-foreground font-semibold text-sm shadow">
                  ✅ Contract Active & Signed
                </span>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full mt-2">
                <div>
                  <div className="text-xs font-semibold text-white/70 uppercase mb-1">Club</div>
                  <div className="text-lg font-bold text-white">{contract.clubs.club_name}</div>
                  {contract.clubs.city && contract.clubs.state && (
                    <div className="text-sm text-white/80 mt-1">📍 {contract.clubs.city}, {contract.clubs.state}</div>
                  )}
                </div>
                <div>
                  <div className="text-xs font-semibold text-white/70 uppercase mb-1">Contract Period</div>
                  <div className="text-lg font-bold text-white">
                    {new Date(contract.contract_start_date).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })} - {new Date(contract.contract_end_date).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
                  </div>
                </div>
                <div>
                  <div className="text-xs font-semibold text-white/70 uppercase mb-1">Position</div>
                  <div className="text-lg font-bold text-white capitalize">{contract.position_assigned || 'Not Assigned'}</div>
                </div>
                {(contract.clubs.email || contract.clubs.phone) && (
                  <div>
                    <div className="text-xs font-semibold text-white/70 uppercase mb-1">Contact Club</div>
                    {contract.clubs.email && (
                      <a href={`mailto:${contract.clubs.email}`} className="block text-white hover:text-accent-foreground hover:underline text-sm mb-1 transition-colors">
                        📧 {contract.clubs.email}
                      </a>
                    )}
                    {contract.clubs.phone && (
                      <a href={`tel:${contract.clubs.phone}`} className="block text-white hover:text-accent-foreground hover:underline text-sm transition-colors">
                        📱 {contract.clubs.phone}
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Contract Viewer */}
        {contractHtml ? (
          <div className="w-full max-w-4xl mx-auto px-4">
            {/* Display stored HTML contract */}
            <div
              className="bg-white rounded-xl shadow-2xl overflow-hidden border-2 border-blue-100 hover:shadow-3xl transition-shadow duration-300"
              dangerouslySetInnerHTML={{ __html: contractHtml }}
            />
            
            {/* Signing Panel - PROMINENT AND ATTENTION-GRABBING */}
            {contract.signing_status === 'unsigned' && (
              <div className="w-full max-w-4xl mx-auto px-4 mt-12 mb-12">
                {/* Sticky Badge */}
                <div className="mb-6 text-center">
                  <div className="inline-block bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-2 rounded-full font-bold text-sm shadow-lg">
                    ⭐ ACTION REQUIRED - Sign Contract
                  </div>
                </div>

                <Card className="p-8 bg-white border-4 border-green-500 shadow-2xl relative overflow-hidden">
                  {/* Decorative background accent */}
                  <div className="absolute -top-20 -right-20 w-40 h-40 bg-green-100 rounded-full opacity-50 pointer-events-none"></div>
                  <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-4xl">✍️</span>
                      <h2 className="text-3xl font-bold text-green-700">Sign This Contract Now</h2>
                    </div>
                    <p className="text-lg text-slate-600 mb-8 font-medium">
                      Complete the form below to digitally sign and accept this contract. This action is final.
                    </p>
                    
                    {/* Progress indicator */}
                    <div className="mb-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <p className="text-sm font-semibold text-blue-900 mb-3">📋 Sign-off Progress:</p>
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold ${signature.trim() ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-600'}`}>
                            {signature.trim() ? '✓' : '1'}
                          </div>
                          <span className={signature.trim() ? 'text-green-700 font-semibold' : 'text-slate-600'}>
                            Your name provided {signature.trim() && <span>✓</span>}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold ${signingDate ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-600'}`}>
                            {signingDate ? '✓' : '2'}
                          </div>
                          <span className={signingDate ? 'text-green-700 font-semibold' : 'text-slate-600'}>
                            Signing date selected {signingDate && <span>✓</span>}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold ${agreedToTerms ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-600'}`}>
                            {agreedToTerms ? '✓' : '3'}
                          </div>
                          <span className={agreedToTerms ? 'text-green-700 font-semibold' : 'text-slate-600'}>
                            Terms agreed & confirmed {agreedToTerms && <span>✓</span>}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Validation Errors - PROMINENT */}
                    {validationErrors.length > 0 && (
                      <div className="mb-8 p-5 bg-red-50 border-l-8 border-red-600 rounded-r-lg shadow-md">
                        <h3 className="font-bold text-red-900 mb-3 text-lg flex items-center gap-2">
                          <span>🚨</span> Please Fix These Issues
                        </h3>
                        <ul className="space-y-2">
                          {validationErrors.map((errorMsg, idx) => (
                            <li key={idx} className="text-red-800 font-medium flex items-start gap-3">
                              <span className="text-red-600 font-bold mt-1">▸</span>
                              <span>{errorMsg}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {/* Form Fields - Larger and More Prominent */}
                    <div className="space-y-6 mb-8 bg-gradient-to-b from-slate-50 to-white p-6 rounded-xl border border-slate-200">
                      <div>
                        <label className="block text-base font-bold text-slate-900 mb-3">
                          👤 Your Name (for signature) <span className="text-red-600 text-2xl">*</span>
                        </label>
                        <input
                          type="text"
                          placeholder={playerName}
                          value={signature}
                          onChange={(e) => {
                            setSignature(e.target.value)
                            setValidationErrors([])
                          }}
                          className={`w-full px-5 py-4 border-2 rounded-lg text-lg font-semibold focus:outline-none focus:ring-2 transition-all ${
                            validationErrors.some(e => e.includes('Signature'))
                              ? 'border-red-500 bg-red-50 focus:ring-red-500'
                              : 'border-slate-300 focus:border-green-500 focus:ring-green-500'
                          }`}
                          autoFocus
                        />
                        {signature.trim() && (
                          <p className="text-green-600 text-sm font-semibold mt-2 flex items-center gap-2">
                            <span>✓</span> Signature name entered
                          </p>
                        )}
                      </div>
                      <div>
                        <label className="block text-base font-bold text-slate-900 mb-3">
                          📅 Signing Date <span className="text-red-600 text-2xl">*</span>
                        </label>
                        <input
                          type="date"
                          value={signingDate}
                          onChange={(e) => {
                            setSigningDate(e.target.value)
                            setValidationErrors([])
                          }}
                          className={`w-full px-5 py-4 border-2 rounded-lg text-lg font-semibold focus:outline-none focus:ring-2 transition-all ${
                            validationErrors.some(e => e.includes('date'))
                              ? 'border-red-500 bg-red-50 focus:ring-red-500'
                              : 'border-slate-300 focus:border-green-500 focus:ring-green-500'
                          }`}
                        />
                        {signingDate && (
                          <p className="text-green-600 text-sm font-semibold mt-2 flex items-center gap-2">
                            <span>✓</span> Date selected: {new Date(signingDate).toLocaleDateString('en-IN')}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Terms Agreement - HIGHLY PROMINENT */}
                    <div className={`p-6 mb-8 rounded-xl border-2 transition-all ${
                      agreedToTerms 
                        ? 'bg-green-50 border-green-500 shadow-md' 
                        : 'bg-amber-50 border-amber-400 border-dashed'
                    }`}>
                      <label className="flex items-start gap-4 cursor-pointer group">
                        <div className="relative mt-1">
                          <input
                            type="checkbox"
                            checked={agreedToTerms}
                            onChange={(e) => {
                              setAgreedToTerms(e.target.checked)
                              setValidationErrors([])
                            }}
                            className="w-6 h-6 accent-green-600 cursor-pointer"
                          />
                          <div className={`absolute inset-0 rounded border-2 transition-all ${
                            agreedToTerms ? 'border-green-500' : 'border-amber-400 group-hover:border-amber-500'
                          }`}></div>
                        </div>
                        <div className="flex-1">
                          <p className={`text-lg font-bold mb-2 ${agreedToTerms ? 'text-green-800' : 'text-amber-900'}`}>
                            🔒 I Understand & Accept All Terms
                          </p>
                          <p className={`text-base leading-relaxed ${agreedToTerms ? 'text-green-800' : 'text-amber-900'}`}>
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
                        <p className="text-green-700 text-sm font-bold mt-3 flex items-center gap-2">
                          <span className="text-lg">✅</span> All terms accepted - Ready to sign
                        </p>
                      )}
                      {validationErrors.some(e => e.includes('agree')) && (
                        <p className="text-red-600 text-sm font-bold mt-3 flex items-center gap-2">
                          <span className="text-lg">⚠️</span> You must agree to all terms to proceed
                        </p>
                      )}
                    </div>

                    {/* Action Buttons - PROMINENT */}
                    <div className="flex gap-4">
                      <Button
                        onClick={() => handleSignContract(contract.id)}
                        disabled={
                          isSigning || 
                          !signature.trim() || 
                          !signingDate || 
                          !agreedToTerms
                        }
                        className={`flex-1 font-bold py-4 text-lg rounded-lg transition-all shadow-lg ${
                          isSigning || !signature.trim() || !signingDate || !agreedToTerms
                            ? 'bg-gray-400 cursor-not-allowed opacity-60'
                            : 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-xl hover:shadow-2xl transform hover:scale-105'
                        }`}
                      >
                        {isSigning ? (
                          <span className="flex items-center justify-center gap-2">
                            <span className="animate-spin">⏳</span> Processing Signature...
                          </span>
                        ) : (
                          <span className="flex items-center justify-center gap-2">
                            <span className="text-2xl">✓</span> Sign & Accept Contract
                          </span>
                        )}
                      </Button>
                      <Button
                        onClick={() => router.push('/dashboard/player/contracts')}
                        variant="outline"
                        className="flex-1 text-lg font-semibold py-4 rounded-lg border-2 hover:bg-red-50 hover:border-red-400"
                      >
                        ❌ Decline & Exit
                      </Button>
                    </div>

                    {/* Warning message */}
                    <div className="mt-6 p-4 bg-purple-50 border-l-4 border-purple-600 rounded text-purple-900 text-sm">
                      <p className="font-semibold">⚡ Important: This is a legally binding digital signature.</p>
                      <p className="mt-1">Once signed, you cannot undo this action. Please review all terms carefully before proceeding.</p>
                    </div>
                  </div>
                </Card>
              </div>
            )}

            {/* Signed Contract Info */}
            {contract.signing_status === 'fully_signed' && contract.player_signature_timestamp && (
              <div className="max-w-4xl mx-auto px-4 mt-8 mb-8">
                <Card className="p-8 bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 border-4 border-green-400 shadow-2xl">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-16 h-16 rounded-full bg-green-500 flex items-center justify-center text-3xl shadow-lg">
                      ✅
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-green-900">Contract Successfully Signed!</h3>
                      <p className="text-sm text-green-700">This contract is now active and legally binding</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-white rounded-lg border-2 border-green-200">
                    <div>
                      <p className="text-xs text-green-700 font-semibold uppercase mb-1">👤 Signed By</p>
                      <p className="text-lg font-bold text-green-900">{playerName}</p>
                    </div>
                    <div>
                      <p className="text-xs text-green-700 font-semibold uppercase mb-1">📅 Signed On</p>
                      <p className="text-lg font-bold text-green-900">
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
