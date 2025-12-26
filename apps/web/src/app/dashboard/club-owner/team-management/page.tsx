'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { FormationBuilder } from '@/components/FormationBuilder'
import { NotificationCenter } from '@/components/NotificationCenter'
import { useClubNotifications } from '@/hooks/useClubNotifications'
import { useToast } from '@/context/ToastContext'
import { Edit2, X } from 'lucide-react'

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
  const [viewMode, setViewMode] = useState<'list' | 'formation'>('list')
  const [editingJerseyPlayerId, setEditingJerseyPlayerId] = useState<string | null>(null)
  const [editingJerseyNumber, setEditingJerseyNumber] = useState<string>('')
  const [updatingJersey, setUpdatingJersey] = useState(false)
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
          .select('id, position, photo_url, unique_player_id, user_id')
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
          .select('id, position, photo_url, unique_player_id, user_id')
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground">Loading team...</div>
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
                {club?.club_name} - Team Management
              </span>
            </div>
            <div className="flex items-center gap-4">
              <NotificationCenter
                notifications={notifications}
                unreadCount={unreadCount}
                onMarkAsRead={markAsRead}
                onMarkAllAsRead={markAllAsRead}
                loading={notificationsLoading}
              />
              <Button onClick={() => router.push('/dashboard/club-owner')} variant="ghost" size="sm" className="border border-border">
                ← Back to Dashboard
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">
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
              {team && players.length > 0 && (
                <div className="flex gap-2 bg-muted/50 p-1.5 rounded-xl">
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'ghost'}
                    size="lg"
                    className={viewMode === 'list' ? 'gradient-brand text-white shadow-lg border-0 hover:shadow-xl' : 'border-2 border-slate-200 text-slate-700 bg-white hover:border-orange-300 hover:text-orange-800 hover:bg-orange-50 transition-all duration-200'}
                    onClick={() => setViewMode('list')}
                  >
                    📋 Roster List
                  </Button>
                  <Button
                    variant={viewMode === 'formation' ? 'default' : 'ghost'}
                    size="lg"
                    className={viewMode === 'formation' ? 'gradient-brand text-white shadow-lg border-0 hover:shadow-xl' : 'border-2 border-slate-200 text-slate-700 bg-white hover:border-orange-300 hover:text-orange-800 hover:bg-orange-50 transition-all duration-200'}
                    onClick={() => setViewMode('formation')}
                  >
                    ⚽ Formation
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Optimized Team Status Section */}
          {team && (
            <div className="bg-gradient-to-r from-slate-50/50 to-slate-100/50 dark:from-slate-900/50 dark:to-slate-800/50 rounded-xl p-4 mb-6 border border-slate-200/50 shadow-md">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-orange to-brand-orange-light flex items-center justify-center shadow-lg">
                      <span className="text-white text-xl">🏆</span>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Team</p>
                      <p className="font-bold text-lg">{team.team_name}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground">Squad Size</p>
                      <p className="font-bold text-base text-brand-orange">{players.length} players</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground">Contracted</p>
                      <p className="font-bold text-base">{contractedPlayers.length} players</p>
                    </div>
                  </div>
                  
                  {players.length < contractedPlayers.length && (
                    <Badge variant="outline" className="ml-2 border-red-400 text-red-700 bg-red-50 animate-pulse">
                      {contractedPlayers.length - players.length} newly recruited players waiting
                    </Badge>
                  )}
                </div>
                {players.length < contractedPlayers.length && (
                  <div className="flex flex-col gap-2">
                    <Button 
                      variant="default" 
                      size="lg" 
                      onClick={handleDeclareSquad} 
                      className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 border-0 animate-pulse"
                    >
                      ✨ Add {contractedPlayers.length - players.length} New Player{contractedPlayers.length - players.length !== 1 ? 's' : ''} to Squad
                    </Button>
                    <p className="text-xs text-red-600 font-medium text-center">
                      ⚠️ These players can't play until added to squad
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Urgent Action Required - New Players Alert */}
        {players.length < contractedPlayers.length && (
          <div className="mb-6 bg-gradient-to-r from-red-50 via-orange-50 to-yellow-50 dark:from-red-950 dark:via-orange-950 dark:to-yellow-950 border-2 border-red-200 dark:border-red-800 rounded-xl p-4 shadow-lg animate-pulse">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-lg animate-bounce">
                <span className="text-white text-xl">🚨</span>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-red-900 dark:text-red-100 mb-1">
                  Action Required: New Players Need Squad Assignment
                </h3>
                <p className="text-sm text-red-800 dark:text-red-200 mb-3">
                  You have <strong>{contractedPlayers.length - players.length} newly recruited player{contractedPlayers.length - players.length !== 1 ? 's' : ''}</strong> who are contracted but not yet added to your team squad. 
                  These players cannot participate in matches or formations until they are officially added to the squad.
                </p>
                <div className="flex items-center gap-3">
                  <Button 
                    onClick={handleDeclareSquad} 
                    className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 border-0"
                    size="lg"
                  >
                    ✅ Add All {contractedPlayers.length - players.length} Player{contractedPlayers.length - players.length !== 1 ? 's' : ''} to Squad Now
                  </Button>
                  <div className="flex items-center gap-2 text-xs text-red-700 dark:text-red-300">
                    <span className="w-2 h-2 bg-red-500 rounded-full animate-ping"></span>
                    <span>Urgent action needed</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Compact Information Section */}
        <div className="mb-6 space-y-3">
          {/* Quick Overview Card */}
          <Card className="border-0 shadow-lg bg-gradient-to-r from-brand-orange/5 via-brand-orange/10 to-brand-orange-light/5 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-brand-orange to-brand-orange-light flex items-center justify-center shadow-lg">
                  <span className="text-white text-lg">ℹ️</span>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-foreground">Team Management Overview</h3>
                  <p className="text-sm text-muted-foreground">Build and declare your official team lineup for competitions</p>
                </div>
              </div>
              
              {/* Key Actions Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="flex items-center gap-2 p-2 rounded-lg bg-white/50">
                  <span className="text-blue-600">✓</span>
                  <span className="text-xs font-medium">Create Teams</span>
                </div>
                <div className="flex items-center gap-2 p-2 rounded-lg bg-white/50">
                  <span className="text-blue-600">✓</span>
                  <span className="text-xs font-medium">Manage Squad</span>
                </div>
                <div className="flex items-center gap-2 p-2 rounded-lg bg-white/50">
                  <span className="text-blue-600">✓</span>
                  <span className="text-xs font-medium">Set Formations</span>
                </div>
                <div className="flex items-center gap-2 p-2 rounded-lg bg-white/50">
                  <span className="text-blue-600">✓</span>
                  <span className="text-xs font-medium">Jersey Numbers</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Important Rules - Compact Banner */}
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950 dark:to-orange-950 border border-amber-200 dark:border-amber-800 rounded-xl p-3 shadow-md">
            <div className="flex items-start gap-3">
              <span className="text-2xl">⚠️</span>
              <div className="flex-1">
                <h4 className="font-semibold text-amber-900 dark:text-amber-100 text-sm mb-2">Tournament Compliance Rules</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-amber-800 dark:text-amber-200">
                  <div className="flex items-center gap-1">
                    <span className="text-red-500">•</span>
                    <span>Declare team before matches</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-red-500">•</span>
                    <span>No suspended players in lineups</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-red-500">•</span>
                    <span>Notify changes immediately</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-red-500">•</span>
                    <span>Ensure squad compliance</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        {!team ? (
          <Card className="border-2 border-dashed">
            <CardContent className="py-12">
              <div className="text-center">
                <div className="text-6xl mb-4">🏆</div>
                <h3 className="text-2xl font-bold text-foreground mb-2">
                  No Team Created
                </h3>
                <p className="text-muted-foreground mb-6">
                  Create your first team to start managing your squad and formations.
                </p>
                <Button variant="gradient" onClick={handleCreateTeam} size="lg">
                  ➕ Create Your First Team
                </Button>
                {contractedPlayers.length > 0 && (
                  <p className="text-sm text-muted-foreground mt-4">
                    You have {contractedPlayers.length} contracted player{contractedPlayers.length !== 1 ? 's' : ''} ready to join your team.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        ) : players.length === 0 ? (
          <Card className="border-2 border-dashed border-amber-300">
            <CardContent className="py-12">
              <div className="text-center">
                <div className="text-6xl mb-4">�</div>
                <h3 className="text-2xl font-bold text-foreground mb-2">
                  Squad Not Declared Yet
                </h3>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  Your team exists, but you haven't declared your squad yet. Add your contracted players to the team squad to start building formations and lineups.
                </p>
                {contractedPlayers.length > 0 ? (
                  <>
                    <div className="bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-950 dark:to-green-950 border border-emerald-200 dark:border-emerald-800 rounded-xl p-4 mb-6 max-w-md mx-auto">
                      <p className="text-sm text-emerald-800 dark:text-emerald-200 mb-3">
                        🎉 Great! You have <strong>{contractedPlayers.length} contracted player{contractedPlayers.length !== 1 ? 's' : ''}</strong> ready to join your squad.
                      </p>
                      <Button 
                        variant="default" 
                        onClick={handleDeclareSquad} 
                        size="lg"
                        className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 border-0"
                      >
                        ✅ Add All {contractedPlayers.length} Player{contractedPlayers.length !== 1 ? 's' : ''} to Squad
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      This will make all your contracted players available for formations and match lineups.
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-sm text-muted-foreground mb-4">
                      You don't have any contracted players yet. Start by scouting and signing players.
                    </p>
                    <Button
                      variant="gradient"
                      onClick={() => router.push('/scout/players')}
                    >
                      🔍 Scout Players
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Enhanced Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
              <div className="relative overflow-hidden rounded-xl p-4 bg-gradient-to-br from-brand-orange/5 via-brand-orange/10 to-brand-orange-light/10 border border-brand-orange/20 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
                <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-brand-orange/20 to-transparent rounded-full -translate-y-4 translate-x-4"></div>
                <div className="flex items-center justify-between mb-2">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-brand-orange to-brand-orange-light flex items-center justify-center shadow-lg">
                    <span className="text-white text-lg">⚽</span>
                  </div>
                  <span className="text-2xl sm:text-3xl font-black text-brand-orange">{players.length}</span>
                </div>
                <p className="text-xs sm:text-sm font-semibold text-slate-700">Total Players</p>
              </div>
              
              <div className="relative overflow-hidden rounded-xl p-4 bg-gradient-to-br from-slate-100 via-slate-200/50 to-slate-300/30 border border-slate-300/40 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
                <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-slate-400/20 to-transparent rounded-full -translate-y-4 translate-x-4"></div>
                <div className="flex items-center justify-between mb-2">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center shadow-lg">
                    <span className="text-white text-lg">🥅</span>
                  </div>
                  <span className="text-2xl sm:text-3xl font-black text-slate-700">{players.filter(p => p.players?.position === 'Goalkeeper').length}</span>
                </div>
                <p className="text-xs sm:text-sm font-semibold text-slate-700">Goalkeepers</p>
              </div>
              
              <div className="relative overflow-hidden rounded-xl p-4 bg-gradient-to-br from-blue-100 via-blue-200/50 to-blue-300/30 border border-blue-300/40 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
                <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-blue-400/20 to-transparent rounded-full -translate-y-4 translate-x-4"></div>
                <div className="flex items-center justify-between mb-2">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center shadow-lg">
                    <span className="text-white text-lg">🛡️</span>
                  </div>
                  <span className="text-2xl sm:text-3xl font-black text-blue-700">{players.filter(p => p.players?.position === 'Defender').length}</span>
                </div>
                <p className="text-xs sm:text-sm font-semibold text-blue-700">Defenders</p>
              </div>
              
              <div className="relative overflow-hidden rounded-xl p-4 bg-gradient-to-br from-emerald-100 via-emerald-200/50 to-emerald-300/30 border border-emerald-300/40 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
                <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-emerald-400/20 to-transparent rounded-full -translate-y-4 translate-x-4"></div>
                <div className="flex items-center justify-between mb-2">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-600 to-emerald-700 flex items-center justify-center shadow-lg">
                    <span className="text-white text-lg">⚡</span>
                  </div>
                  <span className="text-2xl sm:text-3xl font-black text-emerald-700">{players.filter(p => p.players?.position === 'Midfielder').length}</span>
                </div>
                <p className="text-xs sm:text-sm font-semibold text-emerald-700">Midfielders</p>
              </div>
              
              <div className="relative overflow-hidden rounded-xl p-4 bg-gradient-to-br from-indigo-100 via-indigo-200/50 to-indigo-300/30 border border-indigo-300/40 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
                <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-indigo-400/20 to-transparent rounded-full -translate-y-4 translate-x-4"></div>
                <div className="flex items-center justify-between mb-2">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-600 to-indigo-700 flex items-center justify-center shadow-lg">
                    <span className="text-white text-lg">🎯</span>
                  </div>
                  <span className="text-2xl sm:text-3xl font-black text-indigo-700">{players.filter(p => p.players?.position === 'Forward').length}</span>
                </div>
                <p className="text-xs sm:text-sm font-semibold text-indigo-700">Forwards</p>
              </div>
            </div>

            {/* Content based on view mode */}
            {viewMode === 'list' ? (
          <>
            {/* Position Filter */}
            {players.length > 0 && (
              <div className="flex gap-2 mb-6 flex-wrap">
                {positions.map(position => (
                  <Button
                    key={position}
                    variant={selectedPosition === position ? 'default' : 'outline'}
                    size="sm"
                    className={selectedPosition === position 
                      ? 'gradient-brand text-white shadow-lg border-0 hover:shadow-xl' 
                      : 'border-2 border-slate-200 text-slate-700 bg-white hover:border-orange-300 hover:text-orange-800 hover:bg-orange-50 transition-all duration-200'
                    }
                    onClick={() => setSelectedPosition(position)}
                  >
                    {position === 'all' ? '🌟 All Players' : position}
                    {position !== 'all' && (
                      <span className="ml-2 px-2 py-0.5 rounded-full bg-white/30 text-xs font-bold">
                        {players.filter(p => p.players?.position === position).length}
                      </span>
                    )}
                  </Button>
                ))}
              </div>
            )}

            {/* Optimized Player List Header */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-brand-orange to-brand-orange-light flex items-center justify-center shadow-lg">
                    <span className="text-white text-lg">📋</span>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-foreground">
                      Team Roster - {selectedPosition === 'all' ? 'All Players' : selectedPosition + 's'}
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      {filteredPlayers.length} {filteredPlayers.length === 1 ? 'player' : 'players'} • Ready for match lineups
                    </p>
                  </div>
                </div>
                <div className="text-3xl">🏆</div>
              </div>

              {filteredPlayers.length === 0 ? (
                <Card className="border-dashed">
                  <CardContent className="py-12">
                    <div className="text-center text-muted-foreground">
                      <div className="text-6xl mb-4">⚽</div>
                      <h3 className="text-xl font-bold text-foreground mb-2">
                        {players.length === 0 ? 'No Players Yet' : 'No Players in This Position'}
                      </h3>
                      <p className="text-sm mb-4">
                        {players.length === 0
                          ? 'Start building your team by scouting and signing players!'
                          : `You don't have any ${selectedPosition.toLowerCase()}s in your squad yet.`}
                      </p>
                      {players.length === 0 && (
                        <Button
                          variant="gradient"
                          onClick={() => router.push('/scout/players')}
                        >
                          🔍 Scout Players
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {filteredPlayers.map((player) => {
                    const getPositionGradient = (position: string) => {
                      switch (position) {
                        case 'Goalkeeper':
                          return 'from-slate-600 to-slate-700' // Professional dark gray
                        case 'Defender':
                          return 'from-blue-600 to-blue-700' // Brand-aligned blue
                        case 'Midfielder':
                          return 'from-orange-500 to-orange-600' // Brand orange
                        case 'Forward':
                          return 'from-indigo-600 to-indigo-700' // Professional indigo
                        default:
                          return 'from-gray-600 to-gray-700'
                      }
                    }

                    return (
                      <div
                        key={player.id}
                        className="relative overflow-hidden rounded-3xl shadow-2xl aspect-[4/5] group cursor-pointer transform transition-transform hover:scale-105"
                      >
                        {/* Background Image */}
                        <div className="absolute inset-0">
                          {player.players?.photo_url ? (
                            <img
                              src={player.players.photo_url}
                              alt={`${player.players.users?.first_name} ${player.players.users?.last_name}`}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className={`w-full h-full bg-gradient-to-br ${getPositionGradient(player.players?.position || '')}`} />
                          )}
                          {/* Gradient Overlay */}
                          <div className={`absolute inset-0 bg-gradient-to-br ${getPositionGradient(
                            player.players?.position || ''
                          )} opacity-60 mix-blend-multiply`} />
                          {/* Dark gradient from bottom */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                        </div>

                        {/* Jersey Number Badge */}
                        <div className="absolute top-4 right-4 z-20">
                          <div className="w-16 h-16 rounded-full bg-orange-500 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform border-2 border-white/30">
                            <span className="text-2xl font-bold text-white">#{player.jersey_number || '?'}</span>
                          </div>
                        </div>

                        {/* Position Badge */}
                        <div className="absolute top-4 left-4 z-20">
                          <div className="inline-block bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-full text-xs font-bold text-white shadow-lg border border-white/30">
                            {player.players?.position?.toUpperCase()}
                          </div>
                        </div>

                        {/* Curved accent line */}
                        <div className="absolute right-0 top-1/4 w-1/2 h-1/2 opacity-30 z-10">
                          <svg viewBox="0 0 100 200" className="w-full h-full">
                            <path
                              d="M0 0 Q 50 100 0 200"
                              fill="none"
                              stroke="rgba(255,255,255,0.6)"
                              strokeWidth="10"
                            />
                          </svg>
                        </div>

                        {/* Info Section - Lower Half */}
                        <div className="absolute bottom-0 left-0 right-0 p-6 z-20">
                          {/* Player Info */}
                          <div className="text-white">
                            <h4 className="text-2xl font-bold mb-1 drop-shadow-lg">
                              {player.players?.users?.first_name} {player.players?.users?.last_name}
                            </h4>
                            <p className="text-sm text-white/90 mb-3 drop-shadow">
                              ID: {player.players?.unique_player_id}
                            </p>

                            {/* Jersey Edit Box */}
                            {editingJerseyPlayerId === player.id ? (
                              <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/20 mb-3">
                                <div className="flex gap-2">
                                  <Input
                                    type="number"
                                    min="0"
                                    max="99"
                                    value={editingJerseyNumber}
                                    onChange={(e) => setEditingJerseyNumber(e.target.value)}
                                    placeholder="Jersey #"
                                    className="bg-white/20 border-white/30 text-white placeholder:text-white/60"
                                    autoFocus
                                  />
                                  <Button
                                    size="sm"
                                    className="bg-orange-500 hover:bg-orange-600 text-white border-0"
                                    onClick={() => {
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
                                    className="bg-white/20 hover:bg-white/30 text-white border-0"
                                    onClick={() => {
                                      setEditingJerseyPlayerId(null)
                                      setEditingJerseyNumber('')
                                    }}
                                    disabled={updatingJersey}
                                  >
                                    <X className="w-4 h-4" />
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <div 
                                className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/20 cursor-pointer hover:bg-white/20 transition-colors"
                                onClick={() => {
                                  setEditingJerseyPlayerId(player.id)
                                  setEditingJerseyNumber(player.jersey_number?.toString() || '')
                                }}
                              >
                                <div className="flex items-center justify-between">
                                  <div>
                                    <div className="text-xs text-white/80 font-medium mb-0.5">
                                      Jersey Number
                                    </div>
                                    <div className="text-2xl font-bold text-orange-300">
                                      #{player.jersey_number || '?'}
                                    </div>
                                  </div>
                                  <Edit2 className="w-5 h-5 text-white/60" />
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Large watermark text */}
                        <div className="absolute bottom-16 left-0 right-0 pointer-events-none overflow-hidden z-10">
                          <div className="text-[80px] font-black text-white/10 leading-none">
                            PCL
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </>
        ) : (
          <FormationBuilder players={players} clubId={club?.id} teamId={team?.id} />
        )}
      </>
    )}
      </main>
    </div>
  )
}
