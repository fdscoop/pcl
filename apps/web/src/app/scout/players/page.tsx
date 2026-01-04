'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import CompactPlayerCard from '@/components/CompactPlayerCard'
import ElaboratedContractModal from '@/components/ElaboratedContractModal'
import { useToast } from '@/context/ToastContext'

interface Player {
  id: string
  user_id: string
  unique_player_id: string
  photo_url?: string | null
  position?: string
  state?: string | null
  district?: string | null
  address?: string | null
  jersey_number?: number | null
  height_cm?: number | null
  weight_kg?: number | null
  date_of_birth?: string | null
  nationality?: string
  total_matches_played: number
  total_goals_scored: number
  total_assists: number
  is_available_for_scout: boolean
  users?: Array<{
    id: string
    first_name: string
    last_name: string
    email: string
    bio?: string | null
  }>
}

export default function ScoutPlayersPage() {
  const router = useRouter()
  const { addToast } = useToast()
  const [club, setClub] = useState<any>(null)
  const [players, setPlayers] = useState<Player[]>([])
  const [filteredPlayers, setFilteredPlayers] = useState<Player[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedPosition, setSelectedPosition] = useState('all')
  const [selectedState, setSelectedState] = useState('all')
  const [selectedDistrict, setSelectedDistrict] = useState('all')
  const [messageModal, setMessageModal] = useState<{ isOpen: boolean; player: Player | null }>({
    isOpen: false,
    player: null
  })
  const [messageContent, setMessageContent] = useState('')
  const [sendingMessage, setSendingMessage] = useState(false)
  const [viewModal, setViewModal] = useState<{ isOpen: boolean; player: Player | null }>({
    isOpen: false,
    player: null
  })
  const [contractModal, setContractModal] = useState<{ isOpen: boolean; player: Player | null }>({
    isOpen: false,
    player: null
  })
  const [noPlayersMessage, setNoPlayersMessage] = useState<string | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)

  const positions = ['Goalkeeper', 'Defender', 'Midfielder', 'Forward']

  // Dynamically extract unique states and districts from loaded players
  const availableStates = Array.from(
    new Set(players.filter(p => p.state).map(p => p.state).sort())
  ) as string[]

  const availableDistricts = selectedState !== 'all'
    ? Array.from(
        new Set(
          players
            .filter(p => p.state === selectedState && p.district)
            .map(p => p.district)
            .sort()
        )
      ) as string[]
    : []

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    filterPlayers()
  }, [players, searchTerm, selectedPosition, selectedState, selectedDistrict])

  const loadData = async () => {
    try {
      console.log('=== SCOUT PLAYERS PAGE LOADING ===')
      setLoadError(null)
      setNoPlayersMessage(null)
      
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        console.error('No user authenticated')
        router.push('/auth/login')
        return
      }

      console.log('User authenticated:', user.id)

      // Get club data
      const { data: clubData, error: clubError } = await supabase
        .from('clubs')
        .select('*')
        .eq('owner_id', user.id)
        .single()

      if (clubError) {
        console.error('Error loading club:', clubError)
        setLoadError('Failed to load your club information. Please try again.')
      }

      if (clubData) {
        const normalizedClub = {
          id: clubData.id,
          name: clubData.club_name,
          type: clubData.club_type,
          category: clubData.category,
          city: clubData.city,
          state: clubData.state,
          country: clubData.country,
          email: clubData.contact_email || clubData.email,
          phone: clubData.contact_phone || clubData.phone,
          logo_url: clubData.logo_url
        }
        setClub(normalizedClub)
        console.log('Club loaded:', clubData.club_name)

        // Check KYC verification status
        if (!clubData.kyc_verified) {
          console.log('Club KYC not verified, redirecting to KYC page')
          router.replace('/dashboard/club-owner/kyc')
          return
        }
      }

      // Get verified players available for scouting
      console.log('Fetching available players...')
      const { data: playersData, error } = await supabase
        .from('players')
        .select(`
          id,
          user_id,
          position,
          photo_url,
          unique_player_id,
          jersey_number,
          height_cm,
          weight_kg,
          date_of_birth,
          nationality,
          preferred_foot,
          current_club_id,
          is_available_for_scout,
          state,
          district,
          address,
          total_matches_played,
          total_goals_scored,
          total_assists,
          users!players_user_id_fkey (
            id,
            first_name,
            last_name,
            email,
            bio
          )
        `)
        .eq('is_available_for_scout', true)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error loading players:', error)
        setLoadError(`Error loading players: ${error.message}`)
      } else {
        console.log('✅ Players loaded:', playersData?.length || 0)
        console.log('📊 Players data sample:', playersData?.slice(0, 2))
        console.log('🔍 First player users data:', playersData?.[0]?.users)
        console.log('🔍 Sample user_id:', playersData?.[0]?.user_id)
        console.log('🔍 Users data type:', typeof playersData?.[0]?.users)
        console.log('🔍 Is users an array?:', Array.isArray(playersData?.[0]?.users))
        console.log('🔍 Users keys:', playersData?.[0]?.users ? Object.keys(playersData[0].users) : 'null')
        if (!playersData || playersData.length === 0) {
          console.warn('⚠️ No players found with is_available_for_scout = true')
          setNoPlayersMessage('No available players to scout right now. Make sure players have enabled "is_available_for_scout" in their profile settings.')
        }
        setPlayers(playersData || [])
      }

      // Debug: Check ALL players
      const { data: allPlayers } = await supabase
        .from('players')
        .select('id, unique_player_id, is_available_for_scout, user_id')
      
      console.log('🔍 Total players in DB:', allPlayers?.length || 0)
      console.log('🔍 Players by availability:', {
        available: allPlayers?.filter((p: any) => p.is_available_for_scout).length || 0,
        unavailable: allPlayers?.filter((p: any) => !p.is_available_for_scout).length || 0
      })
    } catch (error) {
      console.error('❌ Error in loadData:', error)
      setLoadError(`Error loading page: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  const filterPlayers = () => {
    let filtered = players

    // Search by name or email
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(p => {
        const user = p.users
        return (
          `${user?.first_name} ${user?.last_name}`.toLowerCase().includes(term) ||
          user?.email?.toLowerCase().includes(term) ||
          p.unique_player_id?.toLowerCase().includes(term)
        )
      })
    }

    // Filter by position
    if (selectedPosition !== 'all') {
      filtered = filtered.filter(p => p.position === selectedPosition)
    }

    // Filter by state (from players table)
    if (selectedState !== 'all') {
      filtered = filtered.filter(p => p.state === selectedState)
    }

    // Filter by district (from players table)
    if (selectedDistrict !== 'all') {
      filtered = filtered.filter(p => p.district === selectedDistrict)
    }

    setFilteredPlayers(filtered)
  }

  const handleContactPlayer = (player: Player) => {
    setMessageModal({ isOpen: true, player })
    setMessageContent('')
  }

  const handleSendMessage = async () => {
    if (!messageModal.player || !messageContent.trim()) {
      addToast({
        type: 'error',
        title: 'Message Empty',
        description: 'Please enter a message before sending'
      })
      return
    }

    try {
      setSendingMessage(true)
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user || !club) {
        addToast({
          type: 'error',
          title: 'Error',
          description: 'Could not identify sender'
        })
        return
      }

      // Save message to database
      const { error } = await supabase
        .from('messages')
        .insert([
          {
            sender_id: user.id,
            sender_type: 'club_owner',
            receiver_id: messageModal.player.user_id,
            receiver_type: 'player',
            subject: `Message from ${club.name}`,
            content: messageContent,
            created_at: new Date().toISOString()
          }
        ])

      if (error) {
        console.error('Error sending message:', error)
        addToast({
          type: 'error',
          title: 'Failed to Send',
          description: 'Could not send message. Please try again.'
        })
      } else {
        const user = messageModal.player?.users
        addToast({
          type: 'success',
          title: 'Message Sent',
          description: `Message sent to ${user?.first_name}!`
        })
        setMessageModal({ isOpen: false, player: null })
        setMessageContent('')
      }
    } catch (error) {
      console.error('Error:', error)
      addToast({
        type: 'error',
        title: 'Error',
        description: 'Error sending message'
      })
    } finally {
      setSendingMessage(false)
    }
  }

  const handleCreateContract = async (contractData: any) => {
    try {
      console.log('=== CONTRACT CREATION STARTED ===')
      console.log('Contract Data received:', contractData)

      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user || !club) {
        throw new Error('Authentication required')
      }

      console.log('User ID:', user.id)
      console.log('Club ID:', club.id)
      console.log('Player ID:', contractData.playerId)

      const contractToInsert = {
        player_id: contractData.playerId,
        club_id: contractData.clubId,
        status: 'pending',
        contract_type: contractData.contractType,
        contract_start_date: contractData.startDate,
        contract_end_date: contractData.endDate,
        notice_period: contractData.noticePeriod ? parseInt(contractData.noticePeriod) : null,
        annual_salary: contractData.annualSalary ? parseFloat(contractData.annualSalary) : null,
        salary_monthly: contractData.annualSalary ? parseFloat(contractData.annualSalary) / 12 : null,
        signing_bonus: contractData.signingBonus ? parseFloat(contractData.signingBonus) : null,
        release_clause: contractData.releaseClause ? parseFloat(contractData.releaseClause) : null,
        goal_bonus: contractData.goalBonus ? parseFloat(contractData.goalBonus) : null,
        appearance_bonus: contractData.appearanceBonus ? parseFloat(contractData.appearanceBonus) : null,
        medical_insurance: contractData.medicalInsurance ? parseFloat(contractData.medicalInsurance) : null,
        housing_allowance: contractData.housingAllowance ? parseFloat(contractData.housingAllowance) : null,
        position_assigned: contractData.position || null,
        jersey_number: contractData.jerseyNumber ? parseInt(contractData.jerseyNumber) : null,
        training_days_per_week: contractData.trainingDaysPerWeek ? parseInt(contractData.trainingDaysPerWeek) : null,
        image_rights: contractData.imageRights || 'yes',
        agent_name: contractData.agentName || null,
        agent_contact: contractData.agentContact || null,
        terms_conditions: contractData.termsAndConditions || null,
        created_by: user.id,
        signing_status: 'unsigned',
        club_signature_timestamp: contractData.clubSignatoryDate ? new Date(contractData.clubSignatoryDate).toISOString() : new Date().toISOString(),
        club_signature_name: contractData.clubSignatoryName || club.club_name,
        player_signature_timestamp: null,
        player_signature_data: null,
        contract_html: null
      }

      console.log('Contract to insert:', contractToInsert)

      // Insert contract into database
      const { data, error } = await supabase
        .from('contracts')
        .insert([contractToInsert])
        .select()
        .single()

      if (error) {
        console.error('❌ Error creating contract:', error)
        console.error('Error details:', JSON.stringify(error, null, 2))
        throw new Error(error.message || 'Failed to create contract')
      }

      console.log('✅ Contract created successfully:', data)

      // Create notification for player about new contract
      try {
        const { data: playerData } = await supabase
          .from('players')
          .select('id, user_id, position, photo_url, unique_player_id, jersey_number, height_cm, weight_kg, date_of_birth, nationality, preferred_foot, current_club_id, is_available_for_scout')
          .eq('id', contractData.playerId)
          .single()

        // Fetch user data separately
        let userData = null
        if (playerData) {
          const userResult = await supabase
            .from('users')
            .select('first_name, last_name')
            .eq('id', playerData.user_id)
            .single()
          userData = userResult.data
        }

        // Fetch club name from database to ensure it's always available
        const { data: clubData } = await supabase
          .from('clubs')
          .select('club_name')
          .eq('id', contractData.clubId)
          .single()

        const playerName = userData ? `${userData.first_name} ${userData.last_name}` : 'Player'
        const clubName = clubData?.club_name || 'Club'

        const { error: notificationInsertError } = await supabase
          .from('notifications')
          .insert({
            player_id: contractData.playerId,
            notification_type: 'contract_created',
            title: '📋 New Contract Offer',
            message: `${clubName} has sent you a new contract offer for ${playerName}`,
            contract_id: data.id,
            related_user_id: user.id,
            action_url: `/dashboard/player/contracts/${data.id}/view`,
            read_by_player: false
          })

        if (notificationInsertError) {
          console.warn('❌ Error creating notification:', notificationInsertError)
          console.warn('Error details:', JSON.stringify(notificationInsertError, null, 2))
          // Continue even if notification fails - contract is created
        } else {
          console.log('✅ Notification created for player')
        }
      } catch (notificationError) {
        console.error('❌ Unexpected error in notification creation:', notificationError)
        // Continue even if notification fails - contract is created
      }

      // Generate professional HTML and store it
      try {
        const { generateContractHTML, getDefaultPCLPolicies } = await import('@/utils/contractGenerator')
        
        // Fetch player details for HTML generation
        const { data: playerData } = await supabase
          .from('players')
          .select('id, user_id, position, photo_url, unique_player_id, jersey_number, height_cm, weight_kg, date_of_birth, nationality, preferred_foot, current_club_id, is_available_for_scout')
          .eq('id', contractData.playerId)
          .single()

        // Fetch user data separately
        let userData = null
        if (playerData) {
          const userResult = await supabase
            .from('users')
            .select('first_name, last_name')
            .eq('id', playerData.user_id)
            .single()
          userData = userResult.data
        }

        const playerName = userData ? `${userData.first_name} ${userData.last_name}` : 'Player'

        // Generate professional HTML
        const policies = getDefaultPCLPolicies()
        const contractHTML = generateContractHTML({
          contractId: data.id,
          clubName: club.name,
          clubLogo: club.logo_url,
          clubEmail: club.email,
          clubPhone: club.phone,
          clubCity: club.city,
          clubState: club.state,
          playerName,
          playerId: contractData.playerId,
          position: contractData.position || 'Not assigned',
          jerseyNumber: contractData.jerseyNumber ? parseInt(contractData.jerseyNumber) : undefined,
          startDate: contractData.startDate,
          endDate: contractData.endDate,
          monthlySalary: contractData.annualSalary ? parseFloat(contractData.annualSalary) / 12 : 0,
          annualSalary: contractData.annualSalary ? parseFloat(contractData.annualSalary) : 0,
          signingBonus: contractData.signingBonus ? parseFloat(contractData.signingBonus) : undefined,
          releaseClause: contractData.releaseClause ? parseFloat(contractData.releaseClause) : undefined,
          goalBonus: contractData.goalBonus ? parseFloat(contractData.goalBonus) : undefined,
          appearanceBonus: contractData.appearanceBonus ? parseFloat(contractData.appearanceBonus) : undefined,
          medicalInsurance: contractData.medicalInsurance ? parseFloat(contractData.medicalInsurance) : undefined,
          housingAllowance: contractData.housingAllowance ? parseFloat(contractData.housingAllowance) : undefined,
          contractStatus: 'pending',
          noticePeriod: contractData.noticePeriod ? parseInt(contractData.noticePeriod) : undefined,
          trainingDaysPerWeek: contractData.trainingDaysPerWeek ? parseInt(contractData.trainingDaysPerWeek) : undefined,
          clubSignatureName: contractData.clubSignatoryName || undefined,
          clubSignatureTimestamp: contractData.clubSignatoryDate || undefined,
          playerSignatureName: undefined,
          playerSignatureTimestamp: undefined,
          policies
        })

        // Update contract with HTML and initial signature fields
        const { error: updateError } = await supabase
          .from('contracts')
          .update({
            contract_html: contractHTML,
            signing_status: 'unsigned'
          })
          .eq('id', data.id)

        if (updateError) {
          console.error('Warning: Could not store contract HTML:', updateError)
        } else {
          console.log('✅ Contract HTML generated and stored')
        }
      } catch (htmlError) {
        console.warn('Warning: Could not generate professional HTML:', htmlError)
        // Continue even if HTML generation fails - contract is already created
      }

      console.log('=== CONTRACT CREATION COMPLETED ===')

      alert(`Contract created successfully! Contract ID: ${data.id}`)
    } catch (error) {
      console.error('❌ Error in handleCreateContract:', error)
      alert(`Failed to create contract: ${error instanceof Error ? error.message : 'Unknown error'}`)
      throw error
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-slate-600">Loading players...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="bg-card border-b border-border shadow-sm sticky top-0 z-50 backdrop-blur-sm bg-card/95">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <img src="/logo.png" alt="PCL Logo" className="h-10 w-10" />
              <span className="text-lg font-semibold text-foreground hidden sm:inline">
                Professional Club League
              </span>
            </div>
            <div className="flex items-center gap-4">
              {club && <span className="text-sm text-muted-foreground">{club.name}</span>}
              <Button onClick={() => router.push('/dashboard/club-owner')} variant="outline" size="sm" className="btn-lift">
                Back to Dashboard
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">🔍 Scout Players</h1>
          <p className="text-muted-foreground">Find and connect with verified players available for recruitment</p>
        </div>

        {/* Error Alert */}
        {loadError && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>
              <span className="font-medium">⚠️ Error:</span> {loadError}
            </AlertDescription>
          </Alert>
        )}

        {/* No Players Alert */}
        {noPlayersMessage && filteredPlayers.length === 0 && (
          <Alert variant="warning" className="mb-6">
            <AlertDescription>
              <span className="font-medium">📋 No Players Available:</span> {noPlayersMessage}
            </AlertDescription>
          </Alert>
        )}
        <Card className="mb-8 border-l-4 border-l-accent">
          <CardHeader>
            <CardTitle className="text-lg text-primary">Filter Players</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Search */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Search</label>
                <input
                  type="text"
                  placeholder="Name, email, or player ID"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-3 py-2 border border-input bg-card text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-accent placeholder:text-muted-foreground"
                />
              </div>

              {/* Position */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Position</label>
                <select
                  value={selectedPosition}
                  onChange={(e) => setSelectedPosition(e.target.value)}
                  className="w-full px-3 py-2 border border-input bg-card text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                >
                  <option value="all">All Positions</option>
                  {positions.map(pos => (
                    <option key={pos} value={pos}>{pos}</option>
                  ))}
                </select>
              </div>

              {/* State */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">State</label>
                <select
                  value={selectedState}
                  onChange={(e) => {
                    setSelectedState(e.target.value)
                    setSelectedDistrict('all') // Reset district when state changes
                  }}
                  className="w-full px-3 py-2 border border-input bg-card text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                >
                  <option value="all">All States</option>
                  {availableStates.map(state => (
                    <option key={state} value={state}>{state}</option>
                  ))}
                </select>
              </div>

              {/* District */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">District</label>
                <select
                  value={selectedDistrict}
                  onChange={(e) => setSelectedDistrict(e.target.value)}
                  disabled={selectedState === 'all' || availableDistricts.length === 0}
                  className="w-full px-3 py-2 border border-input bg-card text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-accent disabled:bg-muted disabled:text-muted-foreground"
                >
                  <option value="all">All Districts</option>
                  {availableDistricts.map(district => (
                    <option key={district} value={district}>{district}</option>
                  ))}
                </select>
              </div>

              {/* Results Count */}
              <div className="flex items-end">
                <div className="w-full text-sm text-foreground bg-accent/10 border border-accent/30 rounded-lg p-2">
                  📊 <strong>{filteredPlayers.length}</strong> players found
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Players Grid */}
        {filteredPlayers.length === 0 ? (
          <Alert>
            <AlertDescription>
              No players found. Try adjusting your filters or check back later!
            </AlertDescription>
          </Alert>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5">
            {filteredPlayers.map((player) => (
              <CompactPlayerCard
                key={player.id}
                player={player}
                onView={() => setViewModal({ isOpen: true, player })}
                onMessage={() => handleContactPlayer(player)}
                onContract={() => setContractModal({ isOpen: true, player })}
              />
            ))}
          </div>
        )}
      </main>

      {/* Message Modal */}
      {messageModal.isOpen && messageModal.player && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <Card className="w-full max-w-md shadow-lg animate-in scale-in duration-200">
            <CardHeader className="border-b">
              <CardTitle className="text-xl">
                💬 Send Message to {messageModal.player.users?.first_name}
              </CardTitle>
              <CardDescription className="text-sm">
                Message from {club?.name || 'Your Club'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Message
                </label>
                <textarea
                  value={messageContent}
                  onChange={(e) => setMessageContent(e.target.value)}
                  placeholder="Write your message here... Be professional and clear about your interest."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-slate-100 disabled:text-slate-400 resize-none"
                  rows={4}
                  disabled={sendingMessage}
                  maxLength={500}
                />
                <p className="text-xs text-slate-500 mt-1">
                  {messageContent.length}/500 characters
                </p>
              </div>
              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setMessageModal({ isOpen: false, player: null })}
                  disabled={sendingMessage}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400"
                  onClick={handleSendMessage}
                  disabled={sendingMessage || messageContent.trim().length === 0}
                >
                  {sendingMessage ? 'Sending...' : 'Send Message'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Player Details Modal */}
      {viewModal.isOpen && viewModal.player && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 p-4 animate-in fade-in duration-200 overflow-y-auto flex items-start justify-center pt-4">
          <Card className="w-full max-w-2xl shadow-lg animate-in scale-in duration-200 mt-0 mb-8">
            <CardHeader className="sticky top-0 z-10 border-b bg-gradient-to-r from-blue-50 to-slate-50">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <CardTitle className="text-2xl">
                    {viewModal.player.users?.first_name} {viewModal.player.users?.last_name}
                  </CardTitle>
                  <CardDescription className="text-sm">
                    Player ID: {viewModal.player.unique_player_id}
                  </CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setViewModal({ isOpen: false, player: null })}
                  className="text-slate-500 hover:text-slate-700"
                >
                  ✕
                </Button>
              </div>
            </CardHeader>

            <CardContent className="space-y-6 pt-6 max-h-[calc(100vh-200px)] overflow-y-auto pr-4">
              {/* Player Photo */}
              {viewModal.player.photo_url && (
                <div className="relative w-full h-64 rounded-lg overflow-hidden">
                  <Image
                    src={viewModal.player.photo_url}
                    alt={`${viewModal.player.users?.first_name} ${viewModal.player.users?.last_name}`}
                    fill
                    className="object-cover"
                  />
                </div>
              )}

              {/* Player Bio/Description */}
              {viewModal.player.users?.bio && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-slate-900 mb-2">About Player</h3>
                  <p className="text-sm text-slate-700 leading-relaxed">{viewModal.player.users[0].bio}</p>
                </div>
              )}

              {/* Basic Information */}
              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-3">Basic Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50 p-3 rounded-lg">
                    <p className="text-xs text-slate-500 font-medium">Position</p>
                    <p className="text-lg font-semibold text-slate-900">{viewModal.player.position || 'N/A'}</p>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-lg">
                    <p className="text-xs text-slate-500 font-medium">Nationality</p>
                    <p className="text-lg font-semibold text-slate-900">{viewModal.player.nationality || 'N/A'}</p>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-lg">
                    <p className="text-xs text-slate-500 font-medium">Height</p>
                    <p className="text-lg font-semibold text-slate-900">{viewModal.player.height_cm ? `${viewModal.player.height_cm} cm` : 'N/A'}</p>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-lg">
                    <p className="text-xs text-slate-500 font-medium">Weight</p>
                    <p className="text-lg font-semibold text-slate-900">{viewModal.player.weight_kg ? `${viewModal.player.weight_kg} kg` : 'N/A'}</p>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-lg">
                    <p className="text-xs text-slate-500 font-medium">Date of Birth</p>
                    <p className="text-lg font-semibold text-slate-900">
                      {viewModal.player.date_of_birth
                        ? new Date(viewModal.player.date_of_birth).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })
                        : 'N/A'}
                    </p>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-lg">
                    <p className="text-xs text-slate-500 font-medium">Jersey Number</p>
                    <p className="text-lg font-semibold text-slate-900">{viewModal.player.jersey_number || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Performance Statistics */}
              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-3">Performance Statistics</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg text-center">
                    <p className="text-3xl font-bold text-blue-600">{viewModal.player.total_matches_played}</p>
                    <p className="text-xs text-slate-600 mt-1">Matches Played</p>
                  </div>
                  <div className="bg-green-50 border border-green-200 p-4 rounded-lg text-center">
                    <p className="text-3xl font-bold text-green-600">{viewModal.player.total_goals_scored}</p>
                    <p className="text-xs text-slate-600 mt-1">Goals Scored</p>
                  </div>
                  <div className="bg-purple-50 border border-purple-200 p-4 rounded-lg text-center">
                    <p className="text-3xl font-bold text-purple-600">{viewModal.player.total_assists}</p>
                    <p className="text-xs text-slate-600 mt-1">Assists</p>
                  </div>
                </div>
              </div>

              {/* Location Information */}
              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-3">Location</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50 p-3 rounded-lg">
                    <p className="text-xs text-slate-500 font-medium">State</p>
                    <p className="text-base font-semibold text-slate-900">{viewModal.player.state || 'N/A'}</p>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-lg">
                    <p className="text-xs text-slate-500 font-medium">District</p>
                    <p className="text-base font-semibold text-slate-900">{viewModal.player.district || 'N/A'}</p>
                  </div>
                  <div className="col-span-2 bg-slate-50 p-3 rounded-lg">
                    <p className="text-xs text-slate-500 font-medium">Address</p>
                    <p className="text-base font-semibold text-slate-900">{viewModal.player.address || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Availability Status */}
              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-3">Status</h3>
                <div className={`p-4 rounded-lg border-2 ${
                  viewModal.player.is_available_for_scout
                    ? 'bg-green-50 border-green-200'
                    : 'bg-yellow-50 border-yellow-200'
                }`}>
                  <p className="font-semibold">
                    {viewModal.player.is_available_for_scout ? (
                      <span className="text-green-700">✓ Available for Scout</span>
                    ) : (
                      <span className="text-yellow-700">⚠ Not Available for Scout</span>
                    )}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-4 border-t">
                <Button
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                  onClick={() => {
                    if (viewModal.player) {
                      setViewModal({ isOpen: false, player: null })
                      handleContactPlayer(viewModal.player)
                    }
                  }}
                >
                  💬 Send Message
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setViewModal({ isOpen: false, player: null })}
                >
                  Close
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Contract Modal */}
      {contractModal.isOpen && contractModal.player && (
        <ElaboratedContractModal
          player={contractModal.player}
          club={club}
          onClose={() => setContractModal({ isOpen: false, player: null })}
          onSubmit={handleCreateContract}
        />
      )}
    </div>
  )
}

