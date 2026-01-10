'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import CompactPlayerCard from '@/components/CompactPlayerCard'
import ElaboratedContractModal from '@/components/ElaboratedContractModal'
import { useToast } from '@/context/ToastContext'
import { Search, Filter, MapPin, Users, TrendingUp, MessageCircle, X, FileText } from 'lucide-react'
import { notifyNewContractOffer } from '@/services/matchNotificationService'
import { sendMessageWithPush } from '@/services/messageServiceWithPush'

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
 users?: {
 id: string
 first_name: string
 last_name: string
 email: string
 bio?: string | null
 }
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
 const [showFilters, setShowFilters] = useState(false)

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
 const supabase = createClient()
 const { data: { user } } = await supabase.auth.getUser()

 if (!user) {
 router.push('/auth/login')
 return
 }

 // Get club data
 const { data: clubData, error: clubError } = await supabase
 .from('clubs')
 .select('*')
 .eq('owner_id', user.id)
 .single()

 if (clubError) {
 console.error('Error loading club:', clubError)
 addToast({
 type: 'error',
 title: 'Error',
 description: 'Failed to load your club information'
 })
 return
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

 // Check KYC verification status
 if (!clubData.kyc_verified) {
 router.replace('/dashboard/club-owner/kyc')
 return
 }
 }

 // Get verified players available for scouting
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
 addToast({
 type: 'error',
 title: 'Error',
 description: 'Failed to load players'
 })
 } else {
 setPlayers((playersData || []) as unknown as Player[])
 }
 } catch (error) {
 console.error('Error in loadData:', error)
 addToast({
 type: 'error',
 title: 'Error',
 description: 'Something went wrong'
 })
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

 // Filter by state
 if (selectedState !== 'all') {
 filtered = filtered.filter(p => p.state === selectedState)
 }

 // Filter by district
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

 if (!club) {
 addToast({
 type: 'error',
 title: 'Error',
 description: 'Could not identify sender'
 })
 return
 }

 const result = await sendMessageWithPush({
 receiverId: messageModal.player.user_id,
 receiverType: 'player',
 subject: `Message from ${club.name}`,
 content: messageContent
 })

 if (!result.success) {
 console.error('Error sending message:', result.error)
 addToast({
 type: 'error',
 title: 'Failed to Send',
 description: result.error || 'Could not send message. Please try again.'
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
 const supabase = createClient()
 const { data: { user } } = await supabase.auth.getUser()

 if (!user || !club) {
 throw new Error('Authentication required')
 }

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

 const { data, error } = await supabase
 .from('contracts')
 .insert([contractToInsert])
 .select()
 .single()

 if (error) {
 console.error('Error creating contract:', error)
 throw new Error(error.message || 'Failed to create contract')
 }

 // Create notification for player
 const { data: playerData } = await supabase
 .from('players')
 .select('user_id')
 .eq('id', contractData.playerId)
 .single()

 if (playerData) {
 await supabase.from('notifications').insert([
 {
 user_id: playerData.user_id,
 type: 'contract_offer',
 title: 'New Contract Offer',
 message: `${club.name} has sent you a contract offer. Please review and sign.`,
 action_url: `/dashboard/player/contracts/${data.id}`,
 read: false
 }
 ])

 // Send push notification to player
 try {
 await notifyNewContractOffer(
 playerData.user_id,
 club.club_name || club.name || 'A club',
 data.id
 )
 console.log('✅ Push notification sent to player for new contract offer')
 } catch (pushErr) {
 console.warn('Failed to send push notification:', pushErr)
 // Don't fail if push notification fails
 }
 }

 addToast({
 type: 'success',
 title: 'Contract Sent',
 description: 'Contract offer has been sent to the player'
 })

 setContractModal({ isOpen: false, player: null })
 } catch (error) {
 console.error('Error creating contract:', error)
 addToast({
 type: 'error',
 title: 'Error',
 description: error instanceof Error ? error.message : 'Failed to create contract'
 })
 }
 }

 const clearFilters = () => {
 setSearchTerm('')
 setSelectedPosition('all')
 setSelectedState('all')
 setSelectedDistrict('all')
 }

 if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="relative mx-auto w-12 h-12">
            <div className="w-12 h-12 rounded-full border-4 border-teal-200"></div>
            <div className="absolute inset-0 w-12 h-12 rounded-full border-4 border-teal-500 border-t-transparent animate-spin"></div>
          </div>
          <p className="mt-4 text-slate-500 text-sm">Loading players...</p>
        </div>
      </div>
    )
  }

  const activeFiltersCount = [
    selectedPosition !== 'all',
    selectedState !== 'all',
    selectedDistrict !== 'all'
  ].filter(Boolean).length

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6 w-full max-w-full overflow-x-hidden">
      {/* Page Header - Mobile optimized */}
      <div className="space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Scout Players</h1>
            <p className="text-slate-600 text-sm sm:text-base mt-1">Discover and recruit talented players</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs sm:text-sm bg-teal-50 border-teal-200 text-teal-700">
              <Users className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
              {players.length} Available
            </Badge>
          </div>
        </div>
      </div>

      {/* Search and Filter Section - Mobile friendly */}
      <Card className="border-0 shadow-lg rounded-2xl overflow-hidden">
        <CardHeader className="pb-3 sm:pb-4 bg-gradient-to-r from-teal-50 to-cyan-50">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base sm:text-lg flex items-center gap-2">
              <Search className="w-4 h-4 sm:w-5 sm:h-5 text-teal-600" />
              Search & Filter
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="lg:hidden text-xs"
            >
              <Filter className="w-4 h-4 mr-1" />
              Filters
              {activeFiltersCount > 0 && (
                <Badge variant="destructive" className="ml-1 h-4 w-4 p-0 flex items-center justify-center text-[10px]">
                  {activeFiltersCount}
                </Badge>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 pt-4">
          {/* Search Bar - Always visible */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4 sm:w-5 sm:h-5" />
            <Input
              type="text"
              placeholder="Search by name, email, or player ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 sm:pl-10 h-10 sm:h-11 text-sm"
            />
          </div>

          {/* Filters - Responsive */}
          <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 ${!showFilters && 'hidden lg:grid'}`}>
            {/* Position Filter */}
            <div>
              <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1.5 sm:mb-2">Position</label>
              <select
                value={selectedPosition}
                onChange={(e) => setSelectedPosition(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 bg-white rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              >
                <option value="all">All Positions</option>
                {positions.map(pos => (
                  <option key={pos} value={pos}>{pos}</option>
                ))}
              </select>
            </div>

            {/* State Filter */}
            <div>
              <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1.5 sm:mb-2">State</label>
              <select
                value={selectedState}
                onChange={(e) => {
                  setSelectedState(e.target.value)
                  setSelectedDistrict('all')
 }}
                className="w-full px-3 py-2 text-sm border border-slate-200 bg-white rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              >
                <option value="all">All States</option>
                {availableStates.map(state => (
                  <option key={state} value={state}>{state}</option>
                ))}
              </select>
            </div>

            {/* District Filter */}
            <div>
              <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1.5 sm:mb-2">District</label>
              <select
                value={selectedDistrict}
                onChange={(e) => setSelectedDistrict(e.target.value)}
                disabled={selectedState === 'all' || availableDistricts.length === 0}
                className="w-full px-3 py-2 text-sm border border-slate-200 bg-white rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent disabled:bg-slate-100 disabled:text-slate-400"
              >
                <option value="all">All Districts</option>
                {availableDistricts.map(district => (
                  <option key={district} value={district}>{district}</option>
                ))}
              </select>
            </div>

            {/* Results and Clear */}
            <div className="flex flex-col justify-end gap-2">
              <div className="flex items-center justify-between px-3 py-2 bg-teal-50 border border-teal-200 rounded-xl">
                <span className="text-xs sm:text-sm font-medium text-teal-900">
                  {filteredPlayers.length} Result{filteredPlayers.length !== 1 ? 's' : ''}
                </span>
                {activeFiltersCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    className="h-6 text-xs text-teal-700 hover:text-teal-900"
                  >
                    Clear All
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Players Grid - Mobile responsive */}
      {filteredPlayers.length === 0 ? (
        <Card className="border-0 shadow-lg rounded-2xl">
          <CardContent className="py-12">
            <div className="text-center">
              <Users className="w-12 h-12 sm:w-16 sm:h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-base sm:text-lg font-semibold text-slate-900 mb-2">No Players Found</h3>
              <p className="text-slate-600 mb-4 text-sm">
                {players.length === 0 
                  ? "No players are currently available for scouting."
                  : "Try adjusting your filters to see more results."
                }
              </p>
              {activeFiltersCount > 0 && (
                <Button onClick={clearFilters} variant="outline" size="sm">
                  Clear Filters
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
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

 {/* Message Modal - Mobile Optimized */}
 {messageModal.isOpen && messageModal.player && (
 <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-[130] p-0 sm:p-4 animate-in fade-in duration-200">
 <Card className="w-full sm:max-w-lg sm:rounded-2xl rounded-t-3xl rounded-b-none sm:rounded-b-2xl shadow-2xl animate-in slide-in-from-bottom sm:zoom-in-95 duration-300 max-h-[90vh] sm:max-h-[80vh] flex flex-col bg-white">
 <CardHeader className="border-b bg-white pb-4 pt-6 px-6 flex-shrink-0">
 <div className="flex items-start justify-between">
 <div className="flex-1">
 <CardTitle className="text-xl sm:text-2xl flex items-center gap-2 text-slate-900">
 <MessageCircle className="w-5 h-5 sm:w-6 sm:h-6 text-teal-600" />
 Send Message
 </CardTitle>
 <CardDescription className="mt-2 text-sm sm:text-base text-slate-600">
 To: <span className="font-semibold text-slate-900">{messageModal.player.users?.first_name} {messageModal.player.users?.last_name}</span>
 </CardDescription>
 </div>
 <Button
 variant="ghost"
 size="sm"
 onClick={() => setMessageModal({ isOpen: false, player: null })}
 className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full -mr-2"
 disabled={sendingMessage}
 >
 ✕
 </Button>
 </div>
 </CardHeader>
 <CardContent className="space-y-4 pt-6 px-6 pb-6 overflow-y-auto flex-1 bg-white">
 <div>
 <label className="block text-sm font-semibold text-slate-700 mb-2">
 Your Message
 </label>
 <textarea
 value={messageContent}
 onChange={(e) => setMessageContent(e.target.value)}
 placeholder="Write your message here... Be professional and clear about your interest."
 className="w-full px-4 py-3 border-2 border-slate-200 bg-white rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 disabled:bg-slate-50 disabled:text-slate-400 resize-none text-sm"
 rows={6}
 disabled={sendingMessage}
 maxLength={500}
 />
 <div className="flex items-center justify-between mt-2">
 <p className="text-xs text-slate-500">
 {messageContent.length}/500 characters
 </p>
 {messageContent.trim().length > 0 && (
 <p className="text-xs text-teal-600 font-medium">✓ Ready to send</p>
 )}
 </div>
 </div>
 <div className="flex gap-3 pt-2">
 <Button
 variant="outline"
 className="flex-1 h-11 border-2 hover:bg-slate-50"
 onClick={() => setMessageModal({ isOpen: false, player: null })}
 disabled={sendingMessage}
 >
 Cancel
 </Button>
 <Button
 className="flex-1 h-11 bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white shadow-lg"
 onClick={handleSendMessage}
 disabled={sendingMessage || messageContent.trim().length === 0}
 >
 {sendingMessage ? (
 <>
 <span className="animate-spin mr-2">⏳</span>
 Sending...
 </>
 ) : (
 <>
 <MessageCircle className="w-4 h-4 mr-2" />
 Send Message
 </>
 )}
 </Button>
 </div>
 </CardContent>
 </Card>
 </div>
 )}

 {/* Player Details Modal - Mobile Optimized */}
 {viewModal.isOpen && viewModal.player && (
 <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[130] overflow-y-auto flex items-start sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
 <Card className="w-full sm:max-w-4xl sm:rounded-2xl rounded-t-3xl rounded-b-none sm:rounded-b-2xl shadow-2xl animate-in slide-in-from-bottom sm:zoom-in-95 duration-300 my-0 sm:my-8 bg-white">
 <CardHeader className="border-b bg-white sticky top-0 z-10 pb-4 pt-6 px-4 sm:px-6">
 <div className="flex justify-between items-start gap-4">
 <div className="flex-1 min-w-0">
 <CardTitle className="text-xl sm:text-2xl font-bold text-slate-900 truncate">
 {viewModal.player.users?.first_name} {viewModal.player.users?.last_name}
 </CardTitle>
 <CardDescription className="text-xs sm:text-sm mt-1 text-slate-600">
 Player ID: <span className="font-mono font-semibold">{viewModal.player.unique_player_id}</span>
 </CardDescription>
 </div>
 <Button
 variant="ghost"
 size="sm"
 onClick={() => setViewModal({ isOpen: false, player: null })}
 className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full flex-shrink-0"
 >
 <X className="w-5 h-5" />
 </Button>
 </div>
 </CardHeader>

 <CardContent className="space-y-4 sm:space-y-6 pt-4 sm:pt-6 px-4 sm:px-6 pb-6 bg-white">
 {/* Player Photo - Larger and mobile-friendly */}
 {viewModal.player.photo_url && (
 <div className="relative w-full h-[300px] sm:h-[400px] md:h-[500px] rounded-xl sm:rounded-2xl overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200 shadow-lg">
 <Image
 src={viewModal.player.photo_url}
 alt={`${viewModal.player.users?.first_name} ${viewModal.player.users?.last_name}`}
 fill
 className="object-contain p-2"
 priority
 />
 </div>
 )}

 {/* Player Bio */}
 {viewModal.player.users?.bio && (
 <div className="bg-gradient-to-r from-teal-50 to-cyan-50 border-2 border-teal-200 rounded-xl sm:rounded-2xl p-4">
 <h3 className="text-sm font-semibold text-slate-900 mb-2 flex items-center gap-2">
 <TrendingUp className="w-4 h-4 text-teal-600" />
 About Player
 </h3>
 <p className="text-sm text-slate-700 leading-relaxed">{viewModal.player.users.bio}</p>
 </div>
 )}

 {/* Basic Information */}
 <div>
 <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-3 sm:mb-4">Basic Information</h3>
 <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
 <div className="bg-white border-2 border-slate-200 p-3 sm:p-4 rounded-xl hover:border-teal-300 transition-colors">
 <p className="text-xs text-slate-500 font-medium mb-1">Position</p>
 <p className="text-sm sm:text-base font-bold text-slate-900">{viewModal.player.position || 'N/A'}</p>
 </div>
 <div className="bg-white border-2 border-slate-200 p-3 sm:p-4 rounded-xl hover:border-teal-300 transition-colors">
 <p className="text-xs text-slate-500 font-medium mb-1">Nationality</p>
 <p className="text-sm sm:text-base font-bold text-slate-900">{viewModal.player.nationality || 'N/A'}</p>
 </div>
 <div className="bg-white border-2 border-slate-200 p-3 sm:p-4 rounded-xl hover:border-teal-300 transition-colors">
 <p className="text-xs text-slate-500 font-medium mb-1">Jersey #</p>
 <p className="text-sm sm:text-base font-bold text-slate-900">{viewModal.player.jersey_number || 'N/A'}</p>
 </div>
 <div className="bg-white border-2 border-slate-200 p-3 sm:p-4 rounded-xl hover:border-teal-300 transition-colors">
 <p className="text-xs text-slate-500 font-medium mb-1">Height</p>
 <p className="text-sm sm:text-base font-bold text-slate-900">{viewModal.player.height_cm ? `${viewModal.player.height_cm} cm` : 'N/A'}</p>
 </div>
 <div className="bg-white border-2 border-slate-200 p-3 sm:p-4 rounded-xl hover:border-teal-300 transition-colors">
 <p className="text-xs text-slate-500 font-medium mb-1">Weight</p>
 <p className="text-sm sm:text-base font-bold text-slate-900">{viewModal.player.weight_kg ? `${viewModal.player.weight_kg} kg` : 'N/A'}</p>
 </div>
 <div className="bg-white border-2 border-slate-200 p-3 sm:p-4 rounded-xl hover:border-teal-300 transition-colors">
 <p className="text-xs text-slate-500 font-medium mb-1">Date of Birth</p>
 <p className="text-sm sm:text-base font-bold text-slate-900">
 {viewModal.player.date_of_birth
 ? new Date(viewModal.player.date_of_birth).toLocaleDateString('en-US', {
 year: 'numeric',
 month: 'short',
 day: 'numeric'
 })
 : 'N/A'}
 </p>
 </div>
 </div>
 </div>

 {/* Performance Statistics */}
 <div>
 <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-3 sm:mb-4">Performance Statistics</h3>
 <div className="grid grid-cols-3 gap-3 sm:gap-4">
 <div className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-300 p-4 sm:p-5 rounded-xl sm:rounded-2xl text-center hover:scale-105 transition-transform">
 <p className="text-2xl sm:text-3xl font-black text-blue-700">{viewModal.player.total_matches_played}</p>
 <p className="text-xs font-semibold text-blue-600 mt-2">Matches Played</p>
 </div>
 <div className="bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-300 p-4 sm:p-5 rounded-xl sm:rounded-2xl text-center hover:scale-105 transition-transform">
 <p className="text-2xl sm:text-3xl font-black text-green-700">{viewModal.player.total_goals_scored}</p>
 <p className="text-xs font-semibold text-green-600 mt-2">Goals Scored</p>
 </div>
 <div className="bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-300 p-4 sm:p-5 rounded-xl sm:rounded-2xl text-center hover:scale-105 transition-transform">
 <p className="text-2xl sm:text-3xl font-black text-purple-700">{viewModal.player.total_assists}</p>
 <p className="text-xs font-semibold text-purple-600 mt-2">Assists</p>
 </div>
 </div>
 </div>

 {/* Location Information */}
 <div>
 <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-3 sm:mb-4 flex items-center gap-2">
 <MapPin className="w-5 h-5 text-teal-600" />
 Location
 </h3>
 <div className="grid grid-cols-2 gap-3 sm:gap-4">
 <div className="bg-white border-2 border-slate-200 p-3 sm:p-4 rounded-xl hover:border-teal-300 transition-colors">
 <p className="text-xs text-slate-500 font-medium mb-1">State</p>
 <p className="text-sm sm:text-base font-bold text-slate-900">{viewModal.player.state || 'N/A'}</p>
 </div>
 <div className="bg-white border-2 border-slate-200 p-3 sm:p-4 rounded-xl hover:border-teal-300 transition-colors">
 <p className="text-xs text-slate-500 font-medium mb-1">District</p>
 <p className="text-sm sm:text-base font-bold text-slate-900">{viewModal.player.district || 'N/A'}</p>
 </div>
 {viewModal.player.address && (
 <div className="col-span-2 bg-white border-2 border-slate-200 p-3 sm:p-4 rounded-xl hover:border-teal-300 transition-colors">
 <p className="text-xs text-slate-500 font-medium mb-1">Address</p>
 <p className="text-sm sm:text-base font-bold text-slate-900">{viewModal.player.address}</p>
 </div>
 )}
 </div>
 </div>

 {/* Action Buttons - Sticky on mobile */}
 <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t-2 border-slate-200 sticky bottom-0 bg-white pb-2">
 <Button
 className="flex-1 h-12 bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white shadow-lg font-semibold"
 onClick={() => {
 if (viewModal.player) {
 setViewModal({ isOpen: false, player: null })
 handleContactPlayer(viewModal.player)
 }
 }}
 >
 <MessageCircle className="w-4 h-4 mr-2" />
 Send Message
 </Button>
 <Button
 className="flex-1 h-12 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg font-semibold"
 onClick={() => {
 if (viewModal.player) {
 setViewModal({ isOpen: false, player: null })
 setContractModal({ isOpen: true, player: viewModal.player })
 }
 }}
 >
 <FileText className="w-4 h-4 mr-2" />
 Send Contract
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
