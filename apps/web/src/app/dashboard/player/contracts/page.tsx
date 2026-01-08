'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface Contract {
  id: string
  player_id: string
  club_id: string
  status: 'pending' | 'active' | 'rejected' | 'terminated'
  contract_type: string
  contract_start_date: string
  contract_end_date: string
  annual_salary: number
  signing_bonus: number
  goal_bonus: number
  appearance_bonus: number
  medical_insurance: number
  housing_allowance: number
  position_assigned: string
  jersey_number: number
  notice_period: number
  training_days_per_week: number
  image_rights: string
  agent_name: string
  agent_contact: string
  release_clause: number
  terms_conditions: string
  created_at: string
  clubs: {
    id: string
    club_name: string
    club_type: string
    city: string
    state: string
    country: string
    logo_url: string
    email: string
    phone: string
  }
}

export default function PlayerContractsPage() {
  const router = useRouter()
  const [contracts, setContracts] = useState<Contract[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'pending' | 'active' | 'rejected' | 'terminated'>('all')
  const [player, setPlayer] = useState<any>(null)
  const [processing, setProcessing] = useState<string | null>(null)
  const [expandedContract, setExpandedContract] = useState<string | null>(null)

  useEffect(() => {
    loadContracts()
  }, [])

  const loadContracts = async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/auth/login')
        return
      }

      // Get player profile
      // Note: Can't use .eq('user_id') with specific columns - fetch all and filter
      const { data: allPlayerData } = await supabase
        .from('players')
        .select('id, user_id, position, photo_url, unique_player_id, jersey_number, height_cm, weight_kg, date_of_birth, nationality, preferred_foot, current_club_id, is_available_for_scout')
      
      const playerData = allPlayerData?.find(p => p.user_id === user.id)

      if (!playerData) {
        router.push('/dashboard/player')
        return
      }

      setPlayer(playerData)

      // Fetch contracts for this player with club details using a different approach
      // We'll fetch contracts and clubs separately to avoid RLS issues with nested queries
      const { data: contractsData, error: contractsError } = await supabase
        .from('contracts')
        .select('*')
        .eq('player_id', playerData.id)
        .order('created_at', { ascending: false })

      console.log('Player ID:', playerData.id)
      console.log('Player Contracts query result:', { data: contractsData, error: contractsError })

      if (contractsError) {
        console.error('Error loading contracts:', contractsError)
        alert(`Error loading contracts: ${contractsError.message}`)
      } else if (contractsData && contractsData.length > 0) {
        // For each contract, we'll store the club_id
        // We can't fetch clubs directly due to RLS, so we'll store minimal club info or skip it
        // Alternatively, fetch clubs with anon role by calling RPC or public endpoint
        
        // Fetch clubs data separately
        const clubIds = [...new Set(contractsData.map(c => c.club_id))]

        const { data: clubsData, error: clubsError } = await supabase
          .from('clubs')
          .select('id, club_name, club_type, city, state, country, logo_url, email, phone')
          .in('id', clubIds)

        if (clubsError) {
          console.error('Error fetching clubs data:', {
            error: clubsError,
            message: clubsError.message,
            details: clubsError.details,
            hint: clubsError.hint,
            clubIds
          })
        } else {
          console.log('Clubs data loaded successfully:', clubsData)
        }

        // Merge club data into contracts
        const clubsMap = new Map(clubsData?.map((c: any) => [c.id, c]) || [])
        const mergedContracts = contractsData.map(contract => ({
          ...contract,
          clubs: clubsMap.get(contract.club_id) || {
            id: contract.club_id,
            club_name: clubsError ? 'Club information unavailable' : 'Unknown Club',
            city: '',
            state: '',
            country: '',
            club_type: ''
          }
        }))
        console.log('Player contracts with clubs:', mergedContracts)
        setContracts(mergedContracts || [])
      } else {
        console.log('Player contracts loaded:', contractsData)
        setContracts(contractsData || [])
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAcceptContract = async (contractId: string) => {
    setProcessing(contractId)
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('contracts')
        .update({ status: 'active' })
        .eq('id', contractId)

      if (error) {
        console.error('Error accepting contract:', error)
        // Navigate to view the contract instead of showing error
        router.push(`/dashboard/player/contracts/${contractId}/view`)
      } else {
        // Navigate to view the accepted contract
        router.push(`/dashboard/player/contracts/${contractId}/view`)
      }
    } catch (error) {
      console.error('Error:', error)
      // Still navigate to show the contract
      router.push(`/dashboard/player/contracts/${contractId}/view`)
    } finally {
      setProcessing(null)
    }
  }

  const handleRejectContract = async (contractId: string) => {
    if (!confirm('Are you sure you want to reject this contract offer? This action cannot be undone.')) {
      return
    }

    setProcessing(contractId)
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('contracts')
        .update({ status: 'rejected' })
        .eq('id', contractId)

      if (error) {
        console.error('Error rejecting contract:', error)
        alert('Failed to reject contract. Please try again.')
      } else {
        alert('Contract rejected.')
        loadContracts()
      }
    } catch (error) {
      console.error('Error:', error)
      alert('An error occurred. Please try again.')
    } finally {
      setProcessing(null)
    }
  }

  const filteredContracts = filter === 'all'
    ? contracts
    : contracts.filter(c => c.status === filter)

  const getStatusBadge = (status: string) => {
    const statusColors = {
      pending: 'bg-yellow-100 text-yellow-800',
      active: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      terminated: 'bg-gray-100 text-gray-800'
    }
    return (
      <Badge className={statusColors[status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800'}>
        {status.toUpperCase()}
      </Badge>
    )
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-10 shadow-2xl border-2 border-orange-200 rounded-2xl">
          <div className="flex flex-col items-center gap-5">
            <div className="relative">
              <div className="w-20 h-20 rounded-full border-4 border-orange-200"></div>
              <div className="w-20 h-20 rounded-full border-4 border-orange-500 border-t-transparent animate-spin absolute top-0 left-0"></div>
            </div>
            <div className="text-center">
              <h3 className="text-2xl font-bold text-slate-800 mb-2">Loading Contracts</h3>
              <p className="text-slate-500">Please wait while we fetch your contracts...</p>
            </div>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Main Content */}
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center gap-4 mb-3">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center text-3xl shadow-xl shadow-orange-500/30">
              📋
            </div>
            <div>
              <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">
                My Contracts
              </h1>
              <p className="text-lg text-slate-600 mt-1">
                View and manage your contract offers and active contracts
              </p>
            </div>
          </div>
        </div>

        {/* Stats Cards - Larger */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 md:gap-5 mb-10">
          <Card
            className={`cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-xl border-2 rounded-2xl p-5 ${
              filter === 'all' ? 'border-orange-400 bg-gradient-to-br from-orange-50 to-amber-50 ring-2 ring-orange-200 shadow-lg shadow-orange-500/20' : 'border-slate-200 hover:border-orange-300'
            }`}
            onClick={() => setFilter('all')}
          >
            <div className="text-center">
              <div className="text-3xl mb-2">📊</div>
              <div className="text-4xl font-extrabold text-slate-900">{contracts.length}</div>
              <p className="text-sm font-medium text-slate-600 mt-1">Total Contracts</p>
            </div>
          </Card>
          <Card
            className={`cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-xl border-2 rounded-2xl p-5 ${
              filter === 'pending' ? 'border-amber-400 bg-gradient-to-br from-amber-50 to-yellow-50 ring-2 ring-amber-200 shadow-lg shadow-amber-500/20' : 'border-slate-200 hover:border-amber-300'
            }`}
            onClick={() => setFilter('pending')}
          >
            <div className="text-center">
              <div className="text-3xl mb-2">⏳</div>
              <div className="text-4xl font-extrabold text-amber-600">
                {contracts.filter(c => c.status === 'pending').length}
              </div>
              <p className="text-sm font-medium text-amber-700 mt-1">Pending</p>
            </div>
          </Card>
          <Card
            className={`cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-xl border-2 rounded-2xl p-5 ${
              filter === 'active' ? 'border-emerald-400 bg-gradient-to-br from-emerald-50 to-teal-50 ring-2 ring-emerald-200 shadow-lg shadow-emerald-500/20' : 'border-slate-200 hover:border-emerald-300'
            }`}
            onClick={() => setFilter('active')}
          >
            <div className="text-center">
              <div className="text-3xl mb-2">✅</div>
              <div className="text-4xl font-extrabold text-emerald-600">
                {contracts.filter(c => c.status === 'active').length}
              </div>
              <p className="text-sm font-medium text-emerald-700 mt-1">Active</p>
            </div>
          </Card>
          <Card
            className={`cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-xl border-2 rounded-2xl p-5 ${
              filter === 'rejected' ? 'border-red-400 bg-gradient-to-br from-red-50 to-rose-50 ring-2 ring-red-200 shadow-lg shadow-red-500/20' : 'border-slate-200 hover:border-red-300'
            }`}
            onClick={() => setFilter('rejected')}
          >
            <div className="text-center">
              <div className="text-3xl mb-2">❌</div>
              <div className="text-4xl font-extrabold text-red-600">
                {contracts.filter(c => c.status === 'rejected').length}
              </div>
              <p className="text-sm font-medium text-red-700 mt-1">Rejected</p>
            </div>
          </Card>
          <Card
            className={`cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-xl border-2 rounded-2xl p-5 ${
              filter === 'terminated' ? 'border-slate-400 bg-gradient-to-br from-slate-100 to-slate-200 ring-2 ring-slate-300 shadow-lg' : 'border-slate-200 hover:border-slate-400'
            }`}
            onClick={() => setFilter('terminated')}
          >
            <div className="text-center">
              <div className="text-3xl mb-2">🔚</div>
              <div className="text-4xl font-extrabold text-slate-600">
                {contracts.filter(c => c.status === 'terminated').length}
              </div>
              <p className="text-sm font-medium text-slate-600 mt-1">Terminated</p>
            </div>
          </Card>
        </div>

        {/* Contracts List */}
        <Card className="rounded-2xl border-2 border-orange-200 shadow-xl shadow-orange-500/10 overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-orange-50 to-amber-50 border-b-2 border-orange-100 p-6">
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-2xl font-bold text-slate-800">
                  {filter === 'all' ? 'All Contracts' : `${filter.charAt(0).toUpperCase() + filter.slice(1)} Contracts`}
                </CardTitle>
                <CardDescription className="text-base mt-1">
                  {filteredContracts.length} contract{filteredContracts.length !== 1 ? 's' : ''} found
                </CardDescription>
              </div>
              {filter !== 'all' && (
                <Button
                  variant="outline"
                  onClick={() => setFilter('all')}
                  className="border-2 border-orange-300 hover:border-orange-400 hover:bg-orange-50 font-bold rounded-xl"
                >
                  📊 Show All
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {filteredContracts.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-24 h-24 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-orange-100 to-amber-100 flex items-center justify-center text-5xl shadow-xl">
                  📋
                </div>
                <h3 className="text-2xl font-bold text-slate-800 mb-3">No contracts found</h3>
                <p className="text-lg text-slate-600 max-w-md mx-auto">
                  {filter === 'all'
                    ? 'Complete your profile and KYC verification to receive contract offers from clubs!'
                    : `No ${filter} contracts at this time.`}
                </p>
                {filter !== 'all' && (
                  <Button
                    onClick={() => setFilter('all')}
                    className="mt-6 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold rounded-xl px-6 py-3"
                  >
                    View All Contracts
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-6">
                {filteredContracts.map((contract) => (
                  <div
                    key={contract.id}
                    className={`border-2 rounded-2xl p-6 md:p-8 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${
                      contract.status === 'pending'
                        ? 'border-amber-300 bg-gradient-to-br from-amber-50/50 to-yellow-50/50 hover:border-amber-400 hover:ring-2 hover:ring-amber-200 shadow-lg shadow-amber-500/10'
                        : contract.status === 'active'
                        ? 'border-emerald-300 bg-gradient-to-br from-emerald-50/50 to-teal-50/50 hover:border-emerald-400 hover:ring-2 hover:ring-emerald-200 shadow-lg shadow-emerald-500/10'
                        : contract.status === 'rejected'
                        ? 'border-red-200 bg-gradient-to-br from-red-50/30 to-rose-50/30 hover:border-red-300'
                        : 'border-slate-200 bg-gradient-to-br from-slate-50/30 to-slate-100/30 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-start gap-5">
                      {/* Club Logo */}
                      <div className="flex-shrink-0">
                        {contract.clubs?.logo_url ? (
                          <img
                            src={contract.clubs.logo_url}
                            alt={contract.clubs.club_name}
                            className="h-20 w-20 rounded-2xl object-cover border-2 border-orange-200 shadow-lg"
                          />
                        ) : (
                          <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-orange-100 to-amber-200 flex items-center justify-center shadow-lg">
                            <span className="text-3xl">🏆</span>
                          </div>
                        )}
                      </div>

                      {/* Contract Details */}
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-2xl font-extrabold text-slate-900">
                                📋 {contract.contract_type.charAt(0).toUpperCase() + contract.contract_type.slice(1)} Contract
                              </h3>
                            </div>
                            <h4 className="text-xl font-bold text-orange-600 mb-1">
                              {contract.clubs?.club_name}
                            </h4>
                            <p className="text-base text-slate-600">
                              📍 {contract.clubs?.city}, {contract.clubs?.state} • {contract.clubs?.club_type}
                            </p>
                          </div>
                          {getStatusBadge(contract.status)}
                        </div>

                        {/* Primary Contract Info - Grid Layout */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-5">
                          <div className="bg-gradient-to-br from-orange-50 to-amber-50 p-4 rounded-xl border-2 border-orange-200">
                            <span className="text-xs text-orange-700 font-bold uppercase">📋 Type</span>
                            <p className="font-bold text-orange-900 text-lg capitalize mt-1">{contract.contract_type}</p>
                          </div>
                          <div className="bg-gradient-to-br from-purple-50 to-indigo-50 p-4 rounded-xl border-2 border-purple-200">
                            <span className="text-xs text-purple-700 font-bold uppercase">⚽ Position</span>
                            <p className="font-bold text-purple-900 text-lg mt-1">{contract.position_assigned || 'TBD'}</p>
                          </div>
                          <div className="bg-gradient-to-br from-amber-50 to-yellow-50 p-4 rounded-xl border-2 border-amber-200">
                            <span className="text-xs text-amber-700 font-bold uppercase">#️⃣ Jersey</span>
                            <p className="font-bold text-amber-900 text-lg mt-1">#{contract.jersey_number || 'N/A'}</p>
                          </div>
                          <div className="bg-gradient-to-br from-emerald-50 to-teal-50 p-4 rounded-xl border-2 border-emerald-200">
                            <span className="text-xs text-emerald-700 font-bold uppercase">💰 Annual</span>
                            <p className="font-bold text-emerald-700 text-lg mt-1">
                              {contract.annual_salary ? formatCurrency(contract.annual_salary) : 'N/A'}
                            </p>
                          </div>
                        </div>

                        {/* Secondary Contract Info */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                          <div className="bg-slate-50 p-4 rounded-xl border-2 border-slate-200">
                            <span className="text-xs text-slate-600 font-bold uppercase">📅 Start</span>
                            <p className="font-bold text-slate-900 text-base mt-1">{formatDate(contract.contract_start_date)}</p>
                          </div>
                          <div className="bg-slate-50 p-4 rounded-xl border-2 border-slate-200">
                            <span className="text-xs text-slate-600 font-bold uppercase">🏁 End</span>
                            <p className="font-bold text-slate-900 text-base mt-1">{formatDate(contract.contract_end_date)}</p>
                          </div>
                          <div className="bg-gradient-to-br from-amber-50 to-orange-50 p-4 rounded-xl border-2 border-amber-200">
                            <span className="text-xs text-amber-700 font-bold uppercase">🎁 Bonus</span>
                            <p className="font-bold text-amber-700 text-base mt-1">
                              {contract.signing_bonus ? formatCurrency(contract.signing_bonus) : 'N/A'}
                            </p>
                          </div>
                          <div className="bg-slate-50 p-4 rounded-xl border-2 border-slate-200">
                            <span className="text-xs text-slate-600 font-bold uppercase">🕒 Created</span>
                            <p className="font-bold text-slate-900 text-base mt-1">{formatDate(contract.created_at)}</p>
                          </div>
                        </div>

                        {/* Expandable Full Details */}
                        {expandedContract === contract.id && (
                          <div className="mt-6 p-6 md:p-8 bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl border-2 border-orange-200 shadow-inner">
                            <div className="flex items-center gap-3 mb-5">
                              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center text-white text-sm shadow-md">📄</div>
                              <h4 className="font-bold text-slate-900 text-xl">Complete Contract Details</h4>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                              {contract.goal_bonus && (
                                <div className="bg-white p-4 rounded-xl border-2 border-emerald-200 shadow-md">
                                  <span className="text-xs text-emerald-700 font-bold uppercase">⚽ Goal Bonus</span>
                                  <p className="font-bold text-emerald-600 text-xl mt-1">{formatCurrency(contract.goal_bonus)}</p>
                                </div>
                              )}
                              {contract.appearance_bonus && (
                                <div className="bg-white p-4 rounded-xl border-2 border-blue-200 shadow-md">
                                  <span className="text-xs text-blue-700 font-bold uppercase">👕 Appearance</span>
                                  <p className="font-bold text-blue-600 text-xl mt-1">{formatCurrency(contract.appearance_bonus)}</p>
                                </div>
                              )}
                              {contract.medical_insurance && (
                                <div className="bg-white p-4 rounded-xl border-2 border-purple-200 shadow-md">
                                  <span className="text-xs text-purple-700 font-bold uppercase">🏥 Medical</span>
                                  <p className="font-bold text-purple-600 text-xl mt-1">{formatCurrency(contract.medical_insurance)}</p>
                                </div>
                              )}
                              {contract.housing_allowance && (
                                <div className="bg-white p-4 rounded-xl border-2 border-orange-200 shadow-md">
                                  <span className="text-xs text-orange-700 font-bold uppercase">🏠 Housing</span>
                                  <p className="font-bold text-orange-600 text-xl mt-1">{formatCurrency(contract.housing_allowance)}</p>
                                </div>
                              )}
                              {contract.release_clause && (
                                <div className="bg-white p-4 rounded-xl border-2 border-red-200 shadow-md">
                                  <span className="text-xs text-red-700 font-bold uppercase">💰 Release</span>
                                  <p className="font-bold text-red-600 text-xl mt-1">{formatCurrency(contract.release_clause)}</p>
                                </div>
                              )}
                              {contract.notice_period && (
                                <div className="bg-white p-4 rounded-xl border-2 border-slate-200 shadow-md">
                                  <span className="text-xs text-slate-600 font-bold uppercase">📅 Notice</span>
                                  <p className="font-bold text-slate-900 text-xl mt-1">{contract.notice_period} days</p>
                                </div>
                              )}
                              {contract.training_days_per_week && (
                                <div className="bg-white p-4 rounded-xl border-2 border-indigo-200 shadow-md">
                                  <span className="text-xs text-indigo-700 font-bold uppercase">🏋️ Training</span>
                                  <p className="font-bold text-indigo-600 text-xl mt-1">{contract.training_days_per_week} days/week</p>
                                </div>
                              )}
                              {contract.image_rights && (
                                <div className="bg-white p-4 rounded-xl border-2 border-pink-200 shadow-md">
                                  <span className="text-xs text-pink-700 font-bold uppercase">📸 Image Rights</span>
                                  <p className="font-bold text-pink-600 text-lg mt-1 capitalize">{contract.image_rights}</p>
                                </div>
                              )}
                              {contract.agent_name && (
                                <div className="bg-white p-4 rounded-xl border-2 border-teal-200 shadow-md">
                                  <span className="text-xs text-teal-700 font-bold uppercase">👤 Agent</span>
                                  <p className="font-bold text-teal-600 text-lg mt-1">{contract.agent_name}</p>
                                </div>
                              )}
                              {contract.agent_contact && (
                                <div className="bg-white p-4 rounded-xl border-2 border-cyan-200 shadow-md">
                                  <span className="text-xs text-cyan-700 font-bold uppercase">📞 Agent Contact</span>
                                  <p className="font-bold text-cyan-600 text-lg mt-1">{contract.agent_contact}</p>
                                </div>
                              )}
                            </div>
                            {contract.terms_conditions && (
                              <div className="mt-6 bg-white p-5 rounded-xl border-2 border-amber-200 shadow-md">
                                <div className="flex items-center gap-2 mb-3">
                                  <span className="text-amber-700 font-bold">📜 Terms & Conditions</span>
                                </div>
                                <p className="text-base text-slate-700 leading-relaxed whitespace-pre-wrap">{contract.terms_conditions}</p>
                              </div>
                            )}
                            <div className="mt-5 bg-white p-5 rounded-xl border-2 border-orange-200 shadow-md">
                              <div className="flex items-center gap-2 mb-3">
                                <span className="text-orange-700 font-bold">📧 Club Contact</span>
                              </div>
                              <div className="flex flex-col md:flex-row gap-4 text-base">
                                <div className="flex items-center gap-2">
                                  <span className="text-orange-500">✉️</span>
                                  <span className="text-slate-600">Email:</span>
                                  <span className="font-bold text-slate-900">{contract.clubs?.email || 'N/A'}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-orange-500">📱</span>
                                  <span className="text-slate-600">Phone:</span>
                                  <span className="font-bold text-slate-900">{contract.clubs?.phone || 'N/A'}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Action buttons */}
                        <div className="mt-6 flex gap-3 flex-wrap">
                          <Button
                            variant="outline"
                            className="border-2 border-slate-300 hover:border-orange-400 hover:bg-orange-50 font-bold rounded-xl px-5 py-3"
                            onClick={() => setExpandedContract(expandedContract === contract.id ? null : contract.id)}
                          >
                            {expandedContract === contract.id ? '⬆️ Hide Details' : '⬇️ View Details'}
                          </Button>
                          <Button
                            className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold shadow-lg shadow-orange-500/30 rounded-xl px-5 py-3"
                            onClick={() => router.push(`/dashboard/player/contracts/${contract.id}/view`)}
                          >
                            📋 View Document
                          </Button>
                          {contract.status === 'pending' && (
                            <>
                              <Button
                                className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold shadow-lg shadow-emerald-500/30 rounded-xl px-5 py-3"
                                onClick={() => handleAcceptContract(contract.id)}
                                disabled={processing === contract.id}
                              >
                                {processing === contract.id ? '⏳ Processing...' : '✅ Accept'}
                              </Button>
                              <Button
                                variant="outline"
                                className="text-red-600 hover:text-red-700 border-2 border-red-300 hover:border-red-400 hover:bg-red-50 font-bold rounded-xl px-5 py-3"
                                onClick={() => handleRejectContract(contract.id)}
                                disabled={processing === contract.id}
                              >
                                ❌ Reject
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
