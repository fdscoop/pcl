'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { NotificationCenter } from '@/components/NotificationCenter'
import { useClubNotifications } from '@/hooks/useClubNotifications'
import { useToast } from '@/context/ToastContext'
import { Edit2, X, ChevronDown, ChevronUp } from 'lucide-react'

interface Player {
 id: string
 player_id: string
 jersey_number: number
 position_assigned: string
 players: {
 id: string
 position: string
 photo_url: string
 unique_player_id: string
 date_of_birth: string
 nationality: string
 users: {
 first_name: string
 last_name: string
 }
 }
}

export default function TeamManagementPage() {
 const router = useRouter()
 const [loading, setLoading] = useState(true)
 const [club, setClub] = useState<any>(null)
 const [team, setTeam] = useState<any>(null)
 const [players, setPlayers] = useState<Player[]>([]) // Players in team_squads (the squad/bench)
 const [contractedPlayers, setContractedPlayers] = useState<Player[]>([]) // All contracted players
 const [selectedPosition, setSelectedPosition] = useState<string>('all')
 const [editingJerseyPlayerId, setEditingJerseyPlayerId] = useState<string | null>(null)
 const [editingJerseyNumber, setEditingJerseyNumber] = useState<string>('')
 const [updatingJersey, setUpdatingJersey] = useState(false)
 const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null)
 const [expandedPlayerId, setExpandedPlayerId] = useState<string | null>(null) // For mobile expand/collapse
 const { addToast } = useToast()
 const {
 notifications,
 unreadCount,
 loading: notificationsLoading,
 markAsRead,
 markAllAsRead
 } = useClubNotifications(club?.id || null)

 useEffect(() => {
 loadData()
 }, [])

 const loadData = async () => {
 try {
 const supabase = createClient()
 const { data: { user } } = await supabase.auth.getUser()

 if (!user) {
 router.push('/auth/login')
 return
 }

 // Get club
 const { data: clubData } = await supabase
 .from('clubs')
 .select('*')
 .eq('owner_id', user.id)
 .single()

 if (!clubData) {
 router.push('/dashboard/club-owner')
 return
 }

 setClub(clubData)

 // Check KYC verification status
 if (!clubData.kyc_verified) {
 router.replace('/dashboard/club-owner/kyc')
 return
 }

 // Try to get existing team (don't auto-create)
 const { data: teamData, error: teamError } = await supabase
 .from('teams')
 .select('*')
 .eq('club_id', clubData.id)
 .maybeSingle()

 if (teamError) {
 console.error('Error fetching team:', teamError)
 }

 setTeam(teamData)

 // Fetch ALL contracted players (for the "Declare Squad" functionality)
 const { data: contractsData, error: contractsError } = await supabase
 .from('contracts')
 .select('id, jersey_number, position_assigned, player_id')
 .eq('club_id', clubData.id)
 .eq('status', 'active')
 .order('jersey_number', { ascending: true })

 if (contractsError) {
 console.error('Error loading contracts:', contractsError)
 }

 // If team exists, fetch squad players from team_squads
 if (teamData && contractsData && contractsData.length > 0) {
 const { data: squadData, error: squadError } = await supabase
 .from('team_squads')
 .select('contract_id, player_id, jersey_number')
 .eq('team_id', teamData.id)
 .eq('is_active', true)

 if (squadError) {
 console.error('Error loading squad:', squadError)
 }

 // Get all player IDs (both squad and contracted)
 // Use Set to remove duplicates in case there are duplicate squad entries
 const squadPlayerIds = [...new Set(squadData?.map(s => s.player_id) || [])]
 const allPlayerIds = contractsData.map(c => c.player_id)

 // Fetch player details for all
 const { data: playersData, error: playersError } = await supabase
 .from('players')
 .select('id, position, photo_url, unique_player_id, user_id, date_of_birth, nationality')
 .in('id', allPlayerIds)

 if (!playersError && playersData) {
 // Fetch user details
 const userIds = playersData.map(p => p.user_id)
 const { data: usersData, error: usersError } = await supabase
 .from('users')
 .select('id, first_name, last_name')
 .in('id', userIds)

 if (!usersError && usersData) {
 // Merge data
 const usersMap = new Map(usersData.map(u => [u.id, u]))
 const playersWithUsers = playersData.map(p => ({
 ...p,
 users: usersMap.get(p.user_id)
 }))

 const playersMap = new Map(playersWithUsers.map(p => [p.id, p]))

 // Create a map of squad data for easy lookup (player_id -> squad record)
 const squadDataMap = new Map(squadData?.map(s => [s.player_id, s]) || [])

 // Squad players (in team_squads) - for bench/formations
 const squadContracts = contractsData.filter(c => squadPlayerIds.includes(c.player_id))
 const squadPlayers = squadContracts.map(contract => {
 const squadRecord = squadDataMap.get(contract.player_id)
 return {
 ...contract,
 // Use jersey_number from team_squads if available, otherwise fall back to contract's jersey_number
 jersey_number: squadRecord?.jersey_number ?? contract.jersey_number,
 players: playersMap.get(contract.player_id)
 }
 })
 setPlayers(squadPlayers as Player[])

 // All contracted players
 const allContractedPlayers = contractsData.map(contract => ({
 ...contract,
 players: playersMap.get(contract.player_id)
 }))
 setContractedPlayers(allContractedPlayers as Player[])
 }
 }
 } else if (contractsData && contractsData.length > 0) {
 // No team yet, just load contracted players
 const playerIds = contractsData.map(c => c.player_id)
 const { data: playersData, error: playersError } = await supabase
 .from('players')
 .select('id, position, photo_url, unique_player_id, user_id, date_of_birth, nationality')
 .in('id', playerIds)

 if (!playersError && playersData) {
 const userIds = playersData.map(p => p.user_id)
 const { data: usersData, error: usersError } = await supabase
 .from('users')
 .select('id, first_name, last_name')
 .in('id', userIds)

 if (!usersError && usersData) {
 const usersMap = new Map(usersData.map(u => [u.id, u]))
 const playersWithUsers = playersData.map(p => ({
 ...p,
 users: usersMap.get(p.user_id)
 }))

 const playersMap = new Map(playersWithUsers.map(p => [p.id, p]))
 const allContractedPlayers = contractsData.map(contract => ({
 ...contract,
 players: playersMap.get(contract.player_id)
 }))
 setContractedPlayers(allContractedPlayers as Player[])
 }
 }
 }
 } catch (error) {
 console.error('Error:', error)
 } finally {
 setLoading(false)
 }
 }

 const handleCreateTeam = async () => {
 if (!club) return

 const teamName = prompt(`Enter team name (e.g., "${club.club_name} First Team"):`) || `${club.club_name} First Team`

 try {
 const supabase = createClient()

 // Create team with unique slug
 const slug = teamName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

 const { data: newTeam, error: teamError } = await supabase
 .from('teams')
 .insert({
 club_id: club.id,
 team_name: teamName,
 slug: slug,
 format: '11-a-side',
 formation: '4-3-3'
 })
 .select()
 .single()

 if (teamError) {
 console.error('Error creating team:', teamError)
 alert(`Error creating team: ${teamError.message}`)
 return
 }

 setTeam(newTeam)
 alert(`Team "${teamName}" created successfully!`)
 loadData() // Reload data
 } catch (error) {
 console.error('Error:', error)
 alert('Failed to create team')
 }
 }

 const handleDeclareSquad = async () => {
 if (!team) {
 alert('Please create a team first')
 return
 }

 if (contractedPlayers.length === 0) {
 alert('No contracted players available')
 return
 }

 try {
 const supabase = createClient()

 // Get existing squad players to avoid duplicates
 const existingPlayerIds = players.map(p => p.player_id)

 // Filter out players already in squad
 const playersToAdd = contractedPlayers.filter(
 p => !existingPlayerIds.includes(p.player_id)
 )

 if (playersToAdd.length === 0) {
 alert('All contracted players are already in the squad')
 return
 }

 // Auto-assign jersey numbers based on position
 const squadWithJerseys = autoAssignJerseyNumbers(playersToAdd)

 // Add remaining contracted players to team_squads with auto-assigned jersey numbers
 const squadInserts = squadWithJerseys.map(player => ({
 team_id: team.id,
 player_id: player.player_id,
 contract_id: player.id,
 jersey_number: player.jersey_number,
 is_active: true
 }))

 const { error: squadError } = await supabase
 .from('team_squads')
 .insert(squadInserts)

 if (squadError) {
 console.error('Error declaring squad:', squadError)
 alert(`Error: ${squadError.message}`)
 return
 }

 addToast({
 title: 'Squad Updated',
 description: `${playersToAdd.length} player${playersToAdd.length > 1 ? 's' : ''} added to the team with auto-assigned jersey numbers.`,
 type: 'success',
 duration: 3000
 })
 loadData() // Reload data
 } catch (error) {
 console.error('Error:', error)
 alert('Failed to declare squad')
 }
 }

 // Auto-assign jersey numbers based on player position
 const autoAssignJerseyNumbers = (squadPlayers: any[]) => {
 const jerseyRanges: Record<string, { start: number; end: number }> = {
 'Goalkeeper': { start: 1, end: 3 },
 'Defender': { start: 4, end: 8 },
 'Midfielder': { start: 8, end: 10 },
 'Forward': { start: 9, end: 11 }
 }

 // Get all already taken jersey numbers from existing squad players
 const takenNumbers = new Set(players.map(p => p.jersey_number).filter(n => n != null))

 // Track newly assigned numbers in this batch (including pre-existing ones from contracts)
 const newlyAssigned: number[] = []

 const squadWithJerseys = squadPlayers.map(player => {
 // If player already has a jersey number from their contract, check if it's available
 const existingNumber = player.jersey_number

 if (existingNumber != null && existingNumber > 0) {
 // Check if the existing number is not taken by squad or newly added players
 if (!takenNumbers.has(existingNumber) && !newlyAssigned.includes(existingNumber)) {
 // Keep the existing jersey number
 newlyAssigned.push(existingNumber)
 return {
 ...player,
 jersey_number: existingNumber
 }
 }
 // If existing number is taken, we'll auto-assign a new one below
 }

 // Auto-assign a new number
 const position = player.players?.position || 'Forward'
 const range = jerseyRanges[position] || jerseyRanges['Forward']

 // Helper function to check if number is available
 const isNumberAvailable = (num: number) => {
 return !takenNumbers.has(num) && !newlyAssigned.includes(num)
 }

 // Find next available number in position range
 let nextNumber = range.start
 while (nextNumber <= range.end && !isNumberAvailable(nextNumber)) {
 nextNumber++
 }

 // If range is full, find next available number from 1-99
 if (nextNumber > range.end) {
 nextNumber = 1
 while (nextNumber <= 99 && !isNumberAvailable(nextNumber)) {
 nextNumber++
 }
 // Final fallback - if somehow we run out (unlikely with 99 numbers)
 if (nextNumber > 99) {
 nextNumber = Math.floor(Math.random() * 1000) + 100
 }
 }

 newlyAssigned.push(nextNumber)

 return {
 ...player,
 jersey_number: nextNumber
 }
 })

 return squadWithJerseys
 }

 const handleUpdateJerseyNumber = async (playerId: string, newJerseyNumber: number) => {
 // Validate range
 if (newJerseyNumber < 0 || newJerseyNumber > 99) {
 addToast({
 title: 'Invalid Jersey Number',
 description: 'Jersey number must be between 0 and 99',
 type: 'error',
 duration: 2500
 })
 return
 }

 // Check for duplicates in the same team
 const isDuplicate = players.some(
 p => p.id !== playerId && p.jersey_number === newJerseyNumber
 )

 if (isDuplicate) {
 const duplicatePlayer = players.find(p => p.jersey_number === newJerseyNumber)
 addToast({
 title: 'Jersey Number Already in Use',
 description: `${duplicatePlayer?.players?.users?.first_name} ${duplicatePlayer?.players?.users?.last_name} is already wearing #${newJerseyNumber}`,
 type: 'error',
 duration: 3000
 })
 return
 }

 if (!club) {
 addToast({
 title: 'Club Not Found',
 description: 'Unable to find club information',
 type: 'error',
 duration: 2500
 })
 return
 }

 setUpdatingJersey(true)
 try {
 const supabase = createClient()

 // Find the player to get their contract ID
 const player = players.find(p => p.id === playerId)
 if (!player) {
 addToast({
 title: 'Player Not Found',
 description: 'Unable to find player information',
 type: 'error',
 duration: 2500
 })
 return
 }

 // Update in team_squads table
 const { error: squadError } = await supabase
 .from('team_squads')
 .update({ jersey_number: newJerseyNumber })
 .eq('player_id', player.player_id)
 .eq('team_id', team.id)

 if (squadError) {
 console.error('Error updating team_squads:', squadError)
 addToast({
 title: 'Update Failed',
 description: squadError.message || 'Failed to update squad',
 type: 'error',
 duration: 3000
 })
 return
 }

 // Update in contracts table
 const { error: contractError } = await supabase
 .from('contracts')
 .update({ jersey_number: newJerseyNumber })
 .eq('id', playerId)

 if (contractError) {
 console.error('Error updating contracts:', contractError)
 addToast({
 title: 'Update Failed',
 description: contractError.message || 'Failed to update contract',
 type: 'error',
 duration: 3000
 })
 return
 }

 // Update in players table
 const { error: playerError } = await supabase
 .from('players')
 .update({ jersey_number: newJerseyNumber })
 .eq('id', player.player_id)

 if (playerError) {
 console.error('Error updating players:', playerError)
 addToast({
 title: 'Update Failed',
 description: playerError.message || 'Failed to update player',
 type: 'error',
 duration: 3000
 })
 return
 }

 // Reset editing state and reload
 setEditingJerseyPlayerId(null)
 setEditingJerseyNumber('')
 
 // Update local state
 const updatedPlayers = players.map(p =>
 p.id === playerId ? { ...p, jersey_number: newJerseyNumber } : p
 )
 setPlayers(updatedPlayers)
 
 addToast({
 title: 'Jersey Number Updated',
 description: `${player.players?.users?.first_name} is now wearing #${newJerseyNumber}`,
 type: 'success',
 duration: 2500
 })
 loadData()
 } catch (error) {
 console.error('Error:', error)
 alert('Failed to update jersey number')
 } finally {
 setUpdatingJersey(false)
 }
 }

 const positions = [
 'all',
 'Goalkeeper',
 'Defender',
 'Midfielder',
 'Forward'
 ]

 const filteredPlayers = selectedPosition === 'all'
 ? players
 : players.filter(p => p.players?.position === selectedPosition)

 // Auto-select first player when filtered players change
 useEffect(() => {
 if (filteredPlayers.length > 0) {
 // Only auto-select if no player is currently selected or if the selected player is not in the filtered list
 if (!selectedPlayer || !filteredPlayers.find(p => p.id === selectedPlayer.id)) {
 setSelectedPlayer(filteredPlayers[0])
 }
 }
 }, [filteredPlayers.length, selectedPosition])

 if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="relative mx-auto w-12 h-12">
            <div className="w-12 h-12 rounded-full border-4 border-teal-200"></div>
            <div className="absolute inset-0 w-12 h-12 rounded-full border-4 border-teal-500 border-t-transparent animate-spin"></div>
          </div>
          <p className="mt-4 text-slate-500 text-sm">Loading team...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background w-full max-w-full overflow-x-hidden">
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #14b8a6;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #0d9488;
        }
      `}</style>

      {/* Main Content - No extra nav needed since layout provides it */}
      <main className="p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6 w-full max-w-full overflow-x-hidden">
        {/* Header */}
        <div className="mb-4 sm:mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-1">
                Team Management
              </h1>
 <p className="text-muted-foreground">
 {team ? `Managing ${team.team_name}` : 'Create a team to get started'}
 </p>
 </div>
 <div className="flex gap-3">
 {!team && (
 <Button variant="gradient" onClick={handleCreateTeam} size="lg" className="shadow-lg">
 ➕ Create Team
 </Button>
 )}
 {team && players.length === 0 && contractedPlayers.length > 0 && (
 <Button 
 variant="default" 
 onClick={handleDeclareSquad} 
 size="lg" 
 className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 border-0 animate-pulse"
 >
 ⚡ Add {contractedPlayers.length} New Player{contractedPlayers.length !== 1 ? 's' : ''} to Squad
                </Button>
              )}
            </div>
          </div>

          {/* Team Status - Compact and Mobile-friendly */}
          {team && (
            <div className="bg-white rounded-xl p-3 sm:p-4 mb-4 sm:mb-6 border border-slate-200 shadow-lg">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center shadow-md">
                    <span className="text-white text-lg">🏆</span>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Team</p>
                    <p className="font-bold text-sm sm:text-base truncate max-w-[150px] sm:max-w-none">{team.team_name}</p>
                  </div>
                  <div className="flex items-center gap-4 ml-0 sm:ml-4">
                    <div className="text-center">
                      <p className="text-[10px] sm:text-xs text-slate-500">Squad</p>
                      <p className="font-bold text-teal-600 text-sm sm:text-base">{players.length}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] sm:text-xs text-slate-500">Contracted</p>
                      <p className="font-bold text-sm sm:text-base">{contractedPlayers.length}</p>
                    </div>
                  </div>
                </div>
                {team && players.length > 0 && (
                  <Button
                    onClick={() => router.push('/dashboard/club-owner/formations')}
                    className="w-full sm:w-auto bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white text-sm"
                    size="sm"
                  >
                    ⚽ Build Formations
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Urgent Action Required - New Players Alert */}
        {players.length < contractedPlayers.length && (
          <div className="mb-4 sm:mb-6 bg-gradient-to-r from-red-50 via-orange-50 to-yellow-50 border-2 border-red-200 rounded-xl p-3 sm:p-4 shadow-lg">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-lg flex-shrink-0">
                  <span className="text-white text-base sm:text-lg">🚨</span>
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-red-900 mb-0.5 sm:mb-1">
                    {contractedPlayers.length - players.length} New Player{contractedPlayers.length - players.length !== 1 ? 's' : ''} Waiting
                  </h3>
                  <p className="text-xs sm:text-sm text-red-800">
                    Add them to your squad to make them available
                  </p>
                </div>
              </div>
              <Button 
                onClick={handleDeclareSquad} 
                className="w-full sm:w-auto bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white shadow-lg text-sm"
                size="sm"
              >
                ✅ Add to Squad
              </Button>
            </div>
          </div>
        )}

        {!team ? (
          <Card className="border-2 border-dashed rounded-2xl">
            <CardContent className="py-8 sm:py-12">
              <div className="text-center">
                <div className="text-5xl sm:text-6xl mb-4">🏆</div>
                <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mb-2">
                  No Team Created
                </h3>
                <p className="text-slate-600 mb-6 text-sm sm:text-base">
                  Create your first team to start managing players
                </p>
                <Button variant="default" onClick={handleCreateTeam} size="lg" className="bg-gradient-to-r from-teal-500 to-cyan-500">
                  ➕ Create Team
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : players.length === 0 ? (
          <Card className="border-2 border-dashed border-amber-300 rounded-2xl">
            <CardContent className="py-8 sm:py-12">
              <div className="text-center">
                <div className="text-5xl sm:text-6xl mb-4">⚽</div>
                <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mb-2">
                  No Squad Players
                </h3>
                <p className="text-slate-600 mb-6 text-sm sm:text-base">
                  Add your contracted players to the squad
                </p>
                {contractedPlayers.length > 0 ? (
                  <Button 
                    variant="default" 
                    onClick={handleDeclareSquad} 
                    size="lg"
 className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white"
 >
 ✅ Add {contractedPlayers.length} Player{contractedPlayers.length !== 1 ? 's' : ''} to Squad
 </Button>
 ) : (
 <Button
 variant="gradient"
 onClick={() => router.push('/dashboard/club-owner/scout-players')}
 >
 🔍 Scout Players
 </Button>
 )}
 </div>
 </CardContent>
 </Card>
 ) : (
 <>
 {/* Position Filter */}
 {players.length > 0 && (
 <div className="flex gap-1.5 sm:gap-2 mb-4 sm:mb-6 flex-wrap">
 {positions.map(position => (
 <Button
 key={position}
 variant={selectedPosition === position ? 'default' : 'outline'}
 size="sm"
 className={`text-xs sm:text-sm ${selectedPosition === position 
 ? 'bg-gradient-to-r from-teal-500 to-cyan-500 text-white shadow-lg border-0 hover:shadow-xl' 
 : 'border-2 border-slate-200 text-slate-700 bg-white hover:border-teal-300 hover:text-teal-800 hover:bg-teal-50 transition-all duration-200'
 }`}
 onClick={() => setSelectedPosition(position)}
 >
 {position === 'all' ? '🌟 All' : position}
 {position !== 'all' && (
 <span className="ml-1 sm:ml-2 px-1.5 sm:px-2 py-0.5 rounded-full bg-white/30 text-[10px] sm:text-xs font-bold">
 {players.filter(p => p.players?.position === position).length}
 </span>
 )}
 </Button>
 ))}
 </div>
 )}

 {filteredPlayers.length === 0 ? (
 <Card className="border-dashed rounded-2xl">
 <CardContent className="py-8 sm:py-12">
 <div className="text-center text-muted-foreground">
 <div className="text-5xl sm:text-6xl mb-3 sm:mb-4">⚽</div>
 <h3 className="text-lg sm:text-xl font-bold text-foreground mb-2">
 {players.length === 0 ? 'No Players Yet' : 'No Players in This Position'}
 </h3>
 <p className="text-xs sm:text-sm mb-4">
 {players.length === 0
 ? 'Start building your team by scouting and signing players!'
 : `You don't have any ${selectedPosition.toLowerCase()}s in your squad yet.`}
 </p>
 {players.length === 0 && (
 <Button
 className="bg-gradient-to-r from-teal-500 to-cyan-500 text-white"
 onClick={() => router.push('/dashboard/club-owner/scout-players')}
 >
 🔍 Scout Players
 </Button>
 )}
 </div>
 </CardContent>
 </Card>
 ) : (
 // Two-column layout: Player list on left, Selected player details on right
 <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 sm:gap-6">
 {/* Left Column - Player List */}
 <div className="lg:col-span-2 space-y-2 sm:space-y-3 max-h-[600px] lg:max-h-[800px] overflow-y-auto pr-1 sm:pr-2 custom-scrollbar">
 {filteredPlayers.map((player, index) => {
 const getPositionColor = (position: string) => {
 switch (position) {
 case 'Goalkeeper':
 return {
 bg: 'from-slate-50 to-slate-100',
 border: 'border-slate-200',
 accent: 'bg-slate-600',
 text: 'text-slate-700'
 }
 case 'Defender':
 return {
 bg: 'from-blue-50 to-blue-100',
 border: 'border-blue-200',
 accent: 'bg-blue-600',
 text: 'text-blue-700'
 }
 case 'Midfielder':
 return {
 bg: 'from-teal-50 to-cyan-100',
 border: 'border-teal-200',
 accent: 'bg-gradient-to-r from-teal-500 to-teal-600',
 text: 'text-teal-700'
 }
 case 'Forward':
 return {
 bg: 'from-orange-50 to-orange-100',
 border: 'border-orange-200',
 accent: 'bg-orange-600',
 text: 'text-orange-700'
 }
 default:
 return {
 bg: 'from-gray-50 to-gray-100',
 border: 'border-gray-200',
 accent: 'bg-gray-600',
 text: 'text-gray-700'
 }
 }
 }

 const colors = getPositionColor(player.players?.position || '')
 const isSelected = selectedPlayer?.id === player.id
 const isExpanded = expandedPlayerId === player.id

 return (
 <div
 key={player.id}
 className={`relative overflow-hidden rounded-xl sm:rounded-2xl bg-white border-2 ${
 isSelected ? 'border-teal-500 shadow-lg shadow-teal-200' : colors.border
 } shadow-md hover:shadow-xl transition-all duration-300 group`}
 >
 <div 
 className="flex items-center gap-2.5 sm:gap-4 p-2.5 sm:p-3 cursor-pointer"
 onClick={(e) => {
 // Don't trigger if clicking on jersey edit area
 if (editingJerseyPlayerId !== player.id) {
 // On mobile: toggle expand, on desktop: select player for right panel
 if (window.innerWidth < 1024) {
 setExpandedPlayerId(isExpanded ? null : player.id)
 } else {
 setSelectedPlayer(player)
 }
 }
 }}
 >
 {/* Player Photo */}
 <div className="relative flex-shrink-0">
 <div className={`w-12 h-12 sm:w-16 sm:h-16 rounded-lg sm:rounded-xl overflow-hidden shadow-lg bg-gradient-to-br ${colors.bg} ${colors.border} border-2`}>
 {player.players?.photo_url ? (
 <img
 src={player.players.photo_url}
 alt={`${player.players.users?.first_name} ${player.players.users?.last_name}`}
 className="w-full h-full object-cover"
 />
 ) : (
 <div className={`w-full h-full flex items-center justify-center ${colors.accent} text-white text-sm sm:text-lg font-bold`}>
 {player.players?.users?.first_name?.[0]}{player.players?.users?.last_name?.[0]}
 </div>
 )}
 </div>
 {/* Jersey Number Badge */}
 <div className="absolute -top-1 -right-1 w-5 h-5 sm:w-7 sm:h-7 rounded-full bg-white border-2 border-gray-200 flex items-center justify-center shadow-md">
 <span className={`text-[10px] sm:text-xs font-black ${colors.text}`}>
 {player.jersey_number || '?'}
 </span>
 </div>
 </div>

 {/* Player Info */}
 <div className="flex-1 min-w-0">
 <h3 className="text-sm sm:text-base font-bold text-gray-900 truncate">
 {player.players?.users?.first_name} {player.players?.users?.last_name}
 </h3>
 <div className="flex items-center gap-1.5 sm:gap-2 mt-0.5 sm:mt-1">
 <Badge className={`${colors.accent} text-white text-[8px] sm:text-[10px] font-semibold px-1.5 sm:px-2 py-0`}>
 {player.players?.position === 'Goalkeeper' ? 'GK' : 
 player.players?.position === 'Defender' ? 'DF' :
 player.players?.position === 'Midfielder' ? 'MF' : 'FW'}
 </Badge>
 <span className="text-[10px] sm:text-xs text-gray-500 truncate hidden sm:inline">
 ID: {player.players?.unique_player_id}
 </span>
 </div>
 </div>

 {/* Jersey Edit Button */}
 <div className="flex-shrink-0" onClick={(e) => e.stopPropagation()}>
 {editingJerseyPlayerId === player.id ? (
 <div className="flex items-center gap-1">
 <Input
 type="number"
 min="0"
 max="99"
 value={editingJerseyNumber}
 onChange={(e) => setEditingJerseyNumber(e.target.value)}
 placeholder="#"
 className="h-7 sm:h-8 w-12 sm:w-16 text-xs sm:text-sm text-center"
 autoFocus
 onClick={(e) => e.stopPropagation()}
 />
 <Button
 size="sm"
 className={`${colors.accent} hover:opacity-90 text-white border-0 h-7 sm:h-8 px-1.5 sm:px-2`}
 onClick={(e) => {
 e.stopPropagation()
 const num = parseInt(editingJerseyNumber)
 if (!isNaN(num)) {
 handleUpdateJerseyNumber(player.id, num)
 }
 }}
 disabled={updatingJersey || !editingJerseyNumber}
 >
 ✓
 </Button>
 <Button
 size="sm"
 variant="ghost"
 className="h-7 sm:h-8 px-1.5 sm:px-2"
 onClick={(e) => {
 e.stopPropagation()
 setEditingJerseyPlayerId(null)
 setEditingJerseyNumber('')
 }}
 disabled={updatingJersey}
 >
 <X className="w-3 h-3" />
 </Button>
 </div>
 ) : (
 <Button
 size="sm"
 variant="ghost"
 className="h-7 sm:h-8 px-1.5 sm:px-2 opacity-0 group-hover:opacity-100 transition-opacity"
 onClick={(e) => {
 e.stopPropagation()
 setEditingJerseyPlayerId(player.id)
 setEditingJerseyNumber(player.jersey_number?.toString() || '')
 }}
 >
 <Edit2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400" />
 </Button>
 )}
 </div>
 
 {/* Expand/Collapse Arrow - Mobile only */}
 <div className="flex-shrink-0 lg:hidden">
 {isExpanded ? (
 <ChevronUp className="w-5 h-5 text-teal-600" />
 ) : (
 <ChevronDown className="w-5 h-5 text-gray-400" />
 )}
 </div>
 </div>

 {/* Expanded Player Details - Mobile only - Matches Desktop View */}
 {isExpanded && (
 <div className="lg:hidden border-t border-gray-200 bg-gradient-to-br from-teal-500 to-teal-700 animate-in slide-in-from-top duration-200">
 {/* Player Image Section */}
 <div className="relative">
 <div className="aspect-[4/3] relative overflow-hidden">
 {player.players?.photo_url ? (
 <img
 src={player.players.photo_url}
 alt={`${player.players.users?.first_name} ${player.players.users?.last_name}`}
 className="w-full h-full object-cover"
 />
 ) : (
 <div className="w-full h-full bg-gradient-to-br from-teal-600 to-teal-800 flex items-center justify-center">
 <span className="text-6xl text-white/30 font-bold">
 {player.players?.users?.first_name?.[0]}{player.players?.users?.last_name?.[0]}
 </span>
 </div>
 )}
 {/* Gradient Overlay */}
 <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
 </div>
 {/* Position Badge */}
 <div className="absolute top-4 left-4">
 <div className="bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-full text-xs font-bold text-white shadow-lg border border-white/30">
 {player.players?.position?.toUpperCase()}
 </div>
 </div>
 </div>

 {/* Player Details Section */}
 <div className="p-5 relative">
 {/* Player Name */}
 <div className="mb-6">
 <h3 className="text-2xl font-black text-white mb-2">
 {player.players?.users?.first_name}<br />
 {player.players?.users?.last_name}
 </h3>
 <div className="flex flex-wrap items-center gap-1.5 mt-3">
 <Badge className="bg-white text-teal-700 text-[10px] font-semibold px-2 py-0.5">
 AGE: {player.players?.date_of_birth ? (() => {
 const birthDate = new Date(player.players.date_of_birth)
 const today = new Date()
 let age = today.getFullYear() - birthDate.getFullYear()
 const monthDiff = today.getMonth() - birthDate.getMonth()
 if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
 age--
 }
 return age
 })() : 'N/A'}
 </Badge>
 <Badge className="bg-white text-teal-700 text-[10px] font-semibold px-2 py-0.5">
 {player.players?.nationality || 'N/A'}
 </Badge>
 <Badge className="bg-white text-teal-700 text-[10px] font-semibold px-2 py-0.5">
 {player.players?.position === 'Midfielder' ? 'CAM' : player.players?.position?.toUpperCase()}
 </Badge>
 </div>
 <div className="mt-4">
 <button
 onClick={() => router.push(`/dashboard/club-owner/players/${player.players?.id}`)}
 className="px-4 py-2 bg-white text-teal-700 rounded-lg font-semibold hover:bg-teal-50 transition-all shadow-lg flex items-center gap-2 text-sm"
 >
 <span className="text-base">👤</span>
 View Full Profile
 </button>
 </div>
 </div>

 {/* Stats - Simulated */}
 <div className="space-y-3 px-5 pb-5">
 <div>
 <div className="flex items-center justify-between mb-1.5">
 <span className="text-white font-semibold text-xs">Athleticism</span>
 <span className="text-white font-bold text-xs">86</span>
 </div>
 <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
 <div className="h-full bg-gradient-to-r from-green-400 to-green-500" style={{ width: '86%' }}></div>
 </div>
 </div>

 <div>
 <div className="flex items-center justify-between mb-1.5">
 <span className="text-white font-semibold text-xs">Shooting</span>
 <span className="text-white font-bold text-xs">60</span>
 </div>
 <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
 <div className="h-full bg-gradient-to-r from-pink-400 to-pink-500" style={{ width: '60%' }}></div>
 </div>
 </div>

 <div>
 <div className="flex items-center justify-between mb-1.5">
 <span className="text-white font-semibold text-xs">Technical</span>
 <span className="text-white font-bold text-xs">85</span>
 </div>
 <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
 <div className="h-full bg-gradient-to-r from-orange-400 to-orange-500" style={{ width: '85%' }}></div>
 </div>
 </div>

 <div>
 <div className="flex items-center justify-between mb-1.5">
 <span className="text-white font-semibold text-xs">Defending</span>
 <span className="text-white font-bold text-xs">40</span>
 </div>
 <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
 <div className="h-full bg-gradient-to-r from-red-400 to-red-500" style={{ width: '40%' }}></div>
 </div>
 </div>

 <div>
 <div className="flex items-center justify-between mb-1.5">
 <span className="text-white font-semibold text-xs">Mentality</span>
 <span className="text-white font-bold text-xs">72</span>
 </div>
 <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
 <div className="h-full bg-gradient-to-r from-purple-400 to-purple-500" style={{ width: '72%' }}></div>
 </div>
 </div>

 <div>
 <div className="flex items-center justify-between mb-1.5">
 <span className="text-white font-semibold text-xs">Passing</span>
 <span className="text-white font-bold text-xs">86</span>
 </div>
 <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
 <div className="h-full bg-gradient-to-r from-orange-400 to-orange-500" style={{ width: '86%' }}></div>
 </div>
 </div>
 </div>

 {/* Jersey Number - Large Display */}
 <div className="absolute bottom-4 right-4 opacity-10">
 <span className="text-[80px] font-black text-white leading-none">
 {player.jersey_number || '?'}
 </span>
 </div>
 </div>
 </div>
 )}

 {/* Hover effect indicator */}
 <div className={`absolute left-0 top-0 bottom-0 w-1 ${
 isSelected ? 'bg-teal-500 opacity-100' : `${colors.accent} opacity-0 group-hover:opacity-100`
 } transition-opacity duration-300`}></div>
 </div>
 )
 })}
 </div>

 {/* Right Column - Selected Player Details - Desktop Only */}
 <div className="hidden lg:block lg:col-span-3">
 {selectedPlayer ? (
 <div className="sticky top-4 lg:top-6 rounded-xl sm:rounded-2xl overflow-hidden shadow-xl sm:shadow-2xl bg-gradient-to-br from-teal-500 to-teal-700">
 <div className="flex flex-col lg:flex-row">
 {/* Left Side - Player Image */}
 <div className="lg:w-2/5 relative">
 <div className="aspect-[4/3] lg:aspect-[3/4] lg:h-full relative overflow-hidden">
 {selectedPlayer.players?.photo_url ? (
 <img
 src={selectedPlayer.players.photo_url}
 alt={`${selectedPlayer.players.users?.first_name} ${selectedPlayer.players.users?.last_name}`}
 className="w-full h-full object-cover"
 />
 ) : (
 <div className="w-full h-full bg-gradient-to-br from-teal-600 to-teal-800 flex items-center justify-center">
 <span className="text-6xl sm:text-9xl text-white/30 font-bold">
 {selectedPlayer.players?.users?.first_name?.[0]}{selectedPlayer.players?.users?.last_name?.[0]}
 </span>
 </div>
 )}
 {/* Gradient Overlay */}
 <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
 </div>
 {/* Position Badge */}
 <div className="absolute top-4 left-4 sm:top-6 sm:left-6">
 <div className="bg-white/20 backdrop-blur-md px-3 py-1.5 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm font-bold text-white shadow-lg border border-white/30">
 {selectedPlayer.players?.position?.toUpperCase()}
 </div>
 </div>
 </div>

 {/* Right Side - Player Details */}
 <div className="lg:w-3/5 p-5 sm:p-8 lg:p-12 relative">
 {/* Player Name */}
 <div className="mb-6 sm:mb-8">
 <h3 className="text-2xl sm:text-4xl lg:text-5xl font-black text-white mb-2">
 {selectedPlayer.players?.users?.first_name}<br />
 {selectedPlayer.players?.users?.last_name}
 </h3>
 <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mt-3 sm:mt-4">
 <Badge className="bg-white text-teal-700 text-[10px] sm:text-xs font-semibold px-2 sm:px-3 py-0.5 sm:py-1">
 AGE: {selectedPlayer.players?.date_of_birth ? (() => {
 const birthDate = new Date(selectedPlayer.players.date_of_birth)
 const today = new Date()
 let age = today.getFullYear() - birthDate.getFullYear()
 const monthDiff = today.getMonth() - birthDate.getMonth()
 if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
 age--
 }
 return age
 })() : 'N/A'}
 </Badge>
 <Badge className="bg-white text-teal-700 text-[10px] sm:text-xs font-semibold px-2 sm:px-3 py-0.5 sm:py-1">
 {selectedPlayer.players?.nationality || 'N/A'}
 </Badge>
 <Badge className="bg-white text-teal-700 text-[10px] sm:text-xs font-semibold px-2 sm:px-3 py-0.5 sm:py-1">
 {selectedPlayer.players?.position === 'Midfielder' ? 'CAM' : selectedPlayer.players?.position?.toUpperCase()}
 </Badge>
 </div>
 <div className="mt-4 sm:mt-6">
 <button
 onClick={() => router.push(`/dashboard/club-owner/players/${selectedPlayer.players?.id}`)}
 className="px-4 sm:px-6 py-2 sm:py-2.5 bg-white text-teal-700 rounded-lg font-semibold hover:bg-teal-50 transition-all shadow-lg flex items-center gap-2 text-sm sm:text-base"
 >
 <span className="text-base sm:text-lg">👤</span>
 View Full Profile
 </button>
 </div>
 </div>

 {/* Stats - Simulated for now */}
 <div className="space-y-3 sm:space-y-4">
 <div>
 <div className="flex items-center justify-between mb-1.5 sm:mb-2">
 <span className="text-white font-semibold text-xs sm:text-sm">Athleticism</span>
 <span className="text-white font-bold text-xs sm:text-sm">86</span>
 </div>
 <div className="h-1.5 sm:h-2 bg-white/20 rounded-full overflow-hidden">
 <div className="h-full bg-gradient-to-r from-green-400 to-green-500" style={{ width: '86%' }}></div>
 </div>
 </div>

 <div>
 <div className="flex items-center justify-between mb-1.5 sm:mb-2">
 <span className="text-white font-semibold text-xs sm:text-sm">Shooting</span>
 <span className="text-white font-bold text-xs sm:text-sm">60</span>
 </div>
 <div className="h-1.5 sm:h-2 bg-white/20 rounded-full overflow-hidden">
 <div className="h-full bg-gradient-to-r from-pink-400 to-pink-500" style={{ width: '60%' }}></div>
 </div>
 </div>

 <div>
 <div className="flex items-center justify-between mb-1.5 sm:mb-2">
 <span className="text-white font-semibold text-xs sm:text-sm">Technical</span>
 <span className="text-white font-bold text-xs sm:text-sm">85</span>
 </div>
 <div className="h-1.5 sm:h-2 bg-white/20 rounded-full overflow-hidden">
 <div className="h-full bg-gradient-to-r from-orange-400 to-orange-500" style={{ width: '85%' }}></div>
 </div>
 </div>

 <div>
 <div className="flex items-center justify-between mb-1.5 sm:mb-2">
 <span className="text-white font-semibold text-xs sm:text-sm">Defending</span>
 <span className="text-white font-bold text-xs sm:text-sm">40</span>
 </div>
 <div className="h-1.5 sm:h-2 bg-white/20 rounded-full overflow-hidden">
 <div className="h-full bg-gradient-to-r from-red-400 to-red-500" style={{ width: '40%' }}></div>
 </div>
 </div>

 <div>
 <div className="flex items-center justify-between mb-1.5 sm:mb-2">
 <span className="text-white font-semibold text-xs sm:text-sm">Mentality</span>
 <span className="text-white font-bold text-xs sm:text-sm">72</span>
 </div>
 <div className="h-1.5 sm:h-2 bg-white/20 rounded-full overflow-hidden">
 <div className="h-full bg-gradient-to-r from-purple-400 to-purple-500" style={{ width: '72%' }}></div>
 </div>
 </div>

 <div>
 <div className="flex items-center justify-between mb-1.5 sm:mb-2">
 <span className="text-white font-semibold text-xs sm:text-sm">Passing</span>
 <span className="text-white font-bold text-xs sm:text-sm">86</span>
 </div>
 <div className="h-1.5 sm:h-2 bg-white/20 rounded-full overflow-hidden">
 <div className="h-full bg-gradient-to-r from-orange-400 to-orange-500" style={{ width: '86%' }}></div>
 </div>
 </div>
 </div>

 {/* Jersey Number - Large Display */}
 <div className="absolute bottom-4 right-4 sm:bottom-8 sm:right-8 opacity-10">
 <span className="text-[80px] sm:text-[120px] font-black text-white leading-none">
 {selectedPlayer.jersey_number || '?'}
 </span>
 </div>
 </div>
 </div>
 </div>
 ) : (
 <div className="sticky top-4 lg:top-6 rounded-xl sm:rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50 p-8 sm:p-12 hidden lg:block">
 <div className="text-center text-gray-500">
 <div className="text-5xl sm:text-6xl mb-3 sm:mb-4">👈</div>
 <h3 className="text-lg sm:text-xl font-bold text-gray-700 mb-2">
 Select a Player
 </h3>
 <p className="text-xs sm:text-sm">
 Click on any player from the list to view their detailed stats
 </p>
 </div>
 </div>
 )}
 </div>
 </div>
 )}
 </>
 )}
 </main>
 </div>
 )
}
