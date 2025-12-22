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
        <div className="text-slate-600">Loading contracts...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Navigation */}
      <nav className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <img src="/logo.png" alt="PCL Logo" className="h-10 w-10" />
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">
                PCL
              </h1>
              <span className="text-slate-400">|</span>
              <span className="text-slate-600 font-medium">
                {player?.first_name} {player?.last_name}
              </span>
            </div>
            <div className="flex items-center gap-4">
              <Button onClick={() => router.push('/dashboard/player')} variant="outline" size="sm">
                Back to Dashboard
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            My Contracts
          </h1>
          <p className="text-slate-600">
            View and manage your contract offers and active contracts
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <Card
            className={`cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-xl border-2 ${
              filter === 'all' ? 'border-blue-400 bg-blue-50 ring-2 ring-blue-200' : 'border-slate-200 hover:border-blue-300'
            }`}
            onClick={() => setFilter('all')}
          >
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600">📊 Total</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900">{contracts.length}</div>
              <p className="text-xs text-slate-500 mt-1">All contracts</p>
            </CardContent>
          </Card>
          <Card
            className={`cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-xl border-2 ${
              filter === 'pending' ? 'border-yellow-400 bg-yellow-50 ring-2 ring-yellow-200' : 'border-slate-200 hover:border-yellow-300'
            }`}
            onClick={() => setFilter('pending')}
          >
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-yellow-700">⏳ Pending</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-yellow-600">
                {contracts.filter(c => c.status === 'pending').length}
              </div>
              <p className="text-xs text-yellow-600 mt-1">Awaiting response</p>
            </CardContent>
          </Card>
          <Card
            className={`cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-xl border-2 ${
              filter === 'active' ? 'border-green-400 bg-green-50 ring-2 ring-green-200' : 'border-slate-200 hover:border-green-300'
            }`}
            onClick={() => setFilter('active')}
          >
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-green-700">✅ Active</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">
                {contracts.filter(c => c.status === 'active').length}
              </div>
              <p className="text-xs text-green-600 mt-1">Current contracts</p>
            </CardContent>
          </Card>
          <Card
            className={`cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-xl border-2 ${
              filter === 'rejected' ? 'border-red-400 bg-red-50 ring-2 ring-red-200' : 'border-slate-200 hover:border-red-300'
            }`}
            onClick={() => setFilter('rejected')}
          >
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-red-700">❌ Rejected</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-600">
                {contracts.filter(c => c.status === 'rejected').length}
              </div>
              <p className="text-xs text-red-600 mt-1">Declined offers</p>
            </CardContent>
          </Card>
          <Card
            className={`cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-xl border-2 ${
              filter === 'terminated' ? 'border-gray-400 bg-gray-50 ring-2 ring-gray-200' : 'border-slate-200 hover:border-gray-300'
            }`}
            onClick={() => setFilter('terminated')}
          >
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-700">🔚 Terminated</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-600">
                {contracts.filter(c => c.status === 'terminated').length}
              </div>
              <p className="text-xs text-gray-600 mt-1">Ended contracts</p>
            </CardContent>
          </Card>
        </div>

        {/* Contracts List */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>
                  {filter === 'all' ? 'All Contracts' : `${filter.charAt(0).toUpperCase() + filter.slice(1)} Contracts`}
                </CardTitle>
                <CardDescription>
                  {filteredContracts.length} contract{filteredContracts.length !== 1 ? 's' : ''} found
                </CardDescription>
              </div>
              {filter !== 'all' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setFilter('all')}
                  className="border-2 border-blue-300 hover:border-blue-400 hover:bg-blue-50 font-medium"
                >
                  📊 Show All Contracts
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {filteredContracts.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                <div className="text-6xl mb-4">📋</div>
                <p className="text-lg font-medium mb-2">No contracts found</p>
                <p className="text-sm">
                  {filter === 'all'
                    ? 'Complete your profile and KYC verification to receive contract offers from clubs!'
                    : `No ${filter} contracts at this time.`}
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {filteredContracts.map((contract) => (
                  <div
                    key={contract.id}
                    className={`border-2 rounded-xl p-6 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${
                      contract.status === 'pending'
                        ? 'border-yellow-300 bg-yellow-50/30 hover:border-yellow-400 hover:ring-2 hover:ring-yellow-200'
                        : contract.status === 'active'
                        ? 'border-green-300 bg-green-50/30 hover:border-green-400 hover:ring-2 hover:ring-green-200'
                        : contract.status === 'rejected'
                        ? 'border-red-200 bg-red-50/20 hover:border-red-300'
                        : 'border-slate-200 bg-slate-50/30 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      {/* Club Logo */}
                      <div className="flex-shrink-0">
                        {contract.clubs?.logo_url ? (
                          <img
                            src={contract.clubs.logo_url}
                            alt={contract.clubs.club_name}
                            className="h-16 w-16 rounded-lg object-cover border-2 border-slate-200"
                          />
                        ) : (
                          <div className="h-16 w-16 rounded-lg bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
                            <span className="text-2xl">🏆</span>
                          </div>
                        )}
                      </div>

                      {/* Contract Details */}
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="text-xl font-bold text-slate-900">
                                📋 {contract.contract_type.charAt(0).toUpperCase() + contract.contract_type.slice(1)} Contract
                              </h3>
                            </div>
                            <h4 className="text-lg font-semibold text-blue-700 mb-1">
                              {contract.clubs?.club_name}
                            </h4>
                            <p className="text-sm text-slate-600">
                              📍 {contract.clubs?.city}, {contract.clubs?.state} • {contract.clubs?.club_type}
                            </p>
                          </div>
                          {getStatusBadge(contract.status)}
                        </div>

                        {/* Primary Contract Info - Grid Layout */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
                          <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                            <span className="text-xs text-blue-700 font-medium uppercase">📋 Contract Type</span>
                            <p className="font-bold text-blue-900 capitalize mt-1">{contract.contract_type}</p>
                          </div>
                          <div className="bg-purple-50 p-3 rounded-lg border border-purple-200">
                            <span className="text-xs text-purple-700 font-medium uppercase">⚽ Position</span>
                            <p className="font-bold text-purple-900 mt-1">{contract.position_assigned || 'Not assigned'}</p>
                          </div>
                          <div className="bg-orange-50 p-3 rounded-lg border border-orange-200">
                            <span className="text-xs text-orange-700 font-medium uppercase">#️⃣ Jersey</span>
                            <p className="font-bold text-orange-900 mt-1">#{contract.jersey_number || 'N/A'}</p>
                          </div>
                          <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                            <span className="text-xs text-green-700 font-medium uppercase">💰 Annual Salary</span>
                            <p className="font-bold text-green-700 text-lg mt-1">
                              {contract.annual_salary ? formatCurrency(contract.annual_salary) : 'N/A'}
                            </p>
                          </div>
                        </div>

                        {/* Secondary Contract Info - Grid Layout */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mt-3">
                          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                            <span className="text-xs text-slate-700 font-medium uppercase">📅 Start Date</span>
                            <p className="font-bold text-slate-900 mt-1">{formatDate(contract.contract_start_date)}</p>
                          </div>
                          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                            <span className="text-xs text-slate-700 font-medium uppercase">🏁 End Date</span>
                            <p className="font-bold text-slate-900 mt-1">{formatDate(contract.contract_end_date)}</p>
                          </div>
                          <div className="bg-amber-50 p-3 rounded-lg border border-amber-200">
                            <span className="text-xs text-amber-700 font-medium uppercase">🎁 Signing Bonus</span>
                            <p className="font-bold text-amber-700 mt-1">
                              {contract.signing_bonus ? formatCurrency(contract.signing_bonus) : 'N/A'}
                            </p>
                          </div>
                          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                            <span className="text-xs text-slate-700 font-medium uppercase">🕒 Created</span>
                            <p className="font-bold text-slate-900 mt-1">{formatDate(contract.created_at)}</p>
                          </div>
                        </div>

                        {/* Expandable Full Details */}
                        {expandedContract === contract.id && (
                          <div className="mt-6 p-6 bg-gradient-to-br from-blue-50 to-slate-50 rounded-xl border-2 border-blue-200 shadow-inner">
                            <div className="flex items-center gap-2 mb-4">
                              <div className="w-1 h-6 bg-gradient-to-b from-blue-600 to-blue-700 rounded-full"></div>
                              <h4 className="font-bold text-slate-900 text-lg">📄 Complete Contract Details</h4>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                              {contract.goal_bonus && (
                                <div className="bg-white p-3 rounded-lg border border-green-200 shadow-sm">
                                  <span className="text-xs text-green-700 font-medium uppercase">⚽ Goal Bonus</span>
                                  <p className="font-bold text-green-600 text-lg mt-1">{formatCurrency(contract.goal_bonus)}</p>
                                </div>
                              )}
                              {contract.appearance_bonus && (
                                <div className="bg-white p-3 rounded-lg border border-blue-200 shadow-sm">
                                  <span className="text-xs text-blue-700 font-medium uppercase">👕 Appearance Bonus</span>
                                  <p className="font-bold text-blue-600 text-lg mt-1">{formatCurrency(contract.appearance_bonus)}</p>
                                </div>
                              )}
                              {contract.medical_insurance && (
                                <div className="bg-white p-3 rounded-lg border border-purple-200 shadow-sm">
                                  <span className="text-xs text-purple-700 font-medium uppercase">🏥 Medical Insurance</span>
                                  <p className="font-bold text-purple-600 text-lg mt-1">{formatCurrency(contract.medical_insurance)}</p>
                                </div>
                              )}
                              {contract.housing_allowance && (
                                <div className="bg-white p-3 rounded-lg border border-orange-200 shadow-sm">
                                  <span className="text-xs text-orange-700 font-medium uppercase">🏠 Housing Allowance</span>
                                  <p className="font-bold text-orange-600 text-lg mt-1">{formatCurrency(contract.housing_allowance)}</p>
                                </div>
                              )}
                              {contract.release_clause && (
                                <div className="bg-white p-3 rounded-lg border border-red-200 shadow-sm">
                                  <span className="text-xs text-red-700 font-medium uppercase">💰 Release Clause</span>
                                  <p className="font-bold text-red-600 text-lg mt-1">{formatCurrency(contract.release_clause)}</p>
                                </div>
                              )}
                              {contract.notice_period && (
                                <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
                                  <span className="text-xs text-slate-700 font-medium uppercase">📅 Notice Period</span>
                                  <p className="font-bold text-slate-900 text-lg mt-1">{contract.notice_period} days</p>
                                </div>
                              )}
                              {contract.training_days_per_week && (
                                <div className="bg-white p-3 rounded-lg border border-indigo-200 shadow-sm">
                                  <span className="text-xs text-indigo-700 font-medium uppercase">🏋️ Training Days</span>
                                  <p className="font-bold text-indigo-600 text-lg mt-1">{contract.training_days_per_week} days/week</p>
                                </div>
                              )}
                              {contract.image_rights && (
                                <div className="bg-white p-3 rounded-lg border border-pink-200 shadow-sm">
                                  <span className="text-xs text-pink-700 font-medium uppercase">📸 Image Rights</span>
                                  <p className="font-bold text-pink-600 text-lg mt-1 capitalize">{contract.image_rights}</p>
                                </div>
                              )}
                              {contract.agent_name && (
                                <div className="bg-white p-3 rounded-lg border border-teal-200 shadow-sm">
                                  <span className="text-xs text-teal-700 font-medium uppercase">👤 Agent Name</span>
                                  <p className="font-bold text-teal-600 text-lg mt-1">{contract.agent_name}</p>
                                </div>
                              )}
                              {contract.agent_contact && (
                                <div className="bg-white p-3 rounded-lg border border-cyan-200 shadow-sm">
                                  <span className="text-xs text-cyan-700 font-medium uppercase">📞 Agent Contact</span>
                                  <p className="font-bold text-cyan-600 text-lg mt-1">{contract.agent_contact}</p>
                                </div>
                              )}
                            </div>
                            {contract.terms_conditions && (
                              <div className="mt-6 bg-white p-4 rounded-lg border-2 border-amber-200 shadow-sm">
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="text-amber-700 font-semibold text-sm">📜 Terms & Conditions</span>
                                </div>
                                <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{contract.terms_conditions}</p>
                              </div>
                            )}
                            <div className="mt-4 bg-white p-4 rounded-lg border-2 border-blue-200 shadow-sm">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="text-blue-700 font-semibold text-sm">📧 Club Contact Information</span>
                              </div>
                              <div className="flex flex-col md:flex-row gap-3 text-sm">
                                <div className="flex items-center gap-2">
                                  <span className="text-blue-600">✉️</span>
                                  <span className="text-slate-600">Email:</span>
                                  <span className="font-medium text-slate-900">{contract.clubs?.email || 'N/A'}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-blue-600">📱</span>
                                  <span className="text-slate-600">Phone:</span>
                                  <span className="font-medium text-slate-900">{contract.clubs?.phone || 'N/A'}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Action buttons */}
                        <div className="mt-6 flex gap-3 flex-wrap">
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-2 border-slate-300 hover:border-slate-400 hover:bg-slate-50 font-medium"
                            onClick={() => setExpandedContract(expandedContract === contract.id ? null : contract.id)}
                          >
                            {expandedContract === contract.id ? '⬆️ Hide Details' : '⬇️ View Full Details'}
                          </Button>
                          <Button
                            size="sm"
                            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold shadow-md hover:shadow-lg"
                            onClick={() => router.push(`/dashboard/player/contracts/${contract.id}/view`)}
                          >
                            📋 View Contract Document
                          </Button>
                          {contract.status === 'pending' && (
                            <>
                              <Button
                                size="sm"
                                className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold shadow-md hover:shadow-lg"
                                onClick={() => handleAcceptContract(contract.id)}
                                disabled={processing === contract.id}
                              >
                                {processing === contract.id ? '⏳ Processing...' : '✅ Accept Offer'}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-red-600 hover:text-red-700 border-2 border-red-300 hover:border-red-400 hover:bg-red-50 font-medium"
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
      </main>
    </div>
  )
}
