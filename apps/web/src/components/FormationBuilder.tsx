'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { TextInputDialog } from '@/components/ui/text-input-dialog'
import { X, ArrowUpCircle, ArrowDownCircle, Trash2, RefreshCw, ArrowLeftRight, Save, Download, Plus } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/context/ToastContext'

interface Player {
  id: string
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

interface FormationBuilderProps {
  players: Player[]
  clubId: string
  teamId?: string
}

type FieldPosition = {
  role: string
  x: number
  y: number
  count: number
}

type Formation = {
  name: string
  format: string
  playersOnField: number
  positions: FieldPosition[]
}

// Formation configurations for different formats
const FORMATIONS: Record<string, Record<string, Formation>> = {
  // 5-a-side formations (5 players on field)
  '5s': {
    '2-2': {
      name: '2-2',
      format: '5-a-side',
      playersOnField: 5,
      positions: [
        { role: 'GK', x: 50, y: 88, count: 1 },
        { role: 'LB', x: 30, y: 65, count: 1 },
        { role: 'RB', x: 70, y: 65, count: 1 },
        { role: 'LF', x: 35, y: 25, count: 1 },
        { role: 'RF', x: 65, y: 25, count: 1 }
      ]
    },
    '1-2-1': {
      name: '1-2-1',
      format: '5-a-side',
      playersOnField: 5,
      positions: [
        { role: 'GK', x: 50, y: 88, count: 1 },
        { role: 'CB', x: 50, y: 68, count: 1 },
        { role: 'LM', x: 30, y: 45, count: 1 },
        { role: 'RM', x: 70, y: 45, count: 1 },
        { role: 'ST', x: 50, y: 20, count: 1 }
      ]
    },
    '1-3': {
      name: '1-3 (Diamond)',
      format: '5-a-side',
      playersOnField: 5,
      positions: [
        { role: 'GK', x: 50, y: 88, count: 1 },
        { role: 'CB', x: 50, y: 65, count: 1 },
        { role: 'LW', x: 25, y: 40, count: 1 },
        { role: 'RW', x: 75, y: 40, count: 1 },
        { role: 'ST', x: 50, y: 20, count: 1 }
      ]
    },
    '1-1-2': {
      name: '1-1-2',
      format: '5-a-side',
      playersOnField: 5,
      positions: [
        { role: 'GK', x: 50, y: 88, count: 1 },
        { role: 'CB', x: 50, y: 70, count: 1 },
        { role: 'CM', x: 50, y: 45, count: 1 },
        { role: 'LF', x: 35, y: 20, count: 1 },
        { role: 'RF', x: 65, y: 20, count: 1 }
      ]
    }
  },
  // 7-a-side formations (7 players on field)
  '7s': {
    '3-2-1': {
      name: '3-2-1',
      format: '7-a-side',
      playersOnField: 7,
      positions: [
        { role: 'GK', x: 50, y: 88, count: 1 },
        { role: 'LB', x: 25, y: 68, count: 1 },
        { role: 'CB', x: 50, y: 68, count: 1 },
        { role: 'RB', x: 75, y: 68, count: 1 },
        { role: 'LM', x: 35, y: 45, count: 1 },
        { role: 'RM', x: 65, y: 45, count: 1 },
        { role: 'ST', x: 50, y: 20, count: 1 }
      ]
    },
    '2-3-1': {
      name: '2-3-1',
      format: '7-a-side',
      playersOnField: 7,
      positions: [
        { role: 'GK', x: 50, y: 88, count: 1 },
        { role: 'LB', x: 35, y: 68, count: 1 },
        { role: 'RB', x: 65, y: 68, count: 1 },
        { role: 'LM', x: 25, y: 45, count: 1 },
        { role: 'CM', x: 50, y: 48, count: 1 },
        { role: 'RM', x: 75, y: 45, count: 1 },
        { role: 'ST', x: 50, y: 20, count: 1 }
      ]
    },
    '2-2-2': {
      name: '2-2-2',
      format: '7-a-side',
      playersOnField: 7,
      positions: [
        { role: 'GK', x: 50, y: 88, count: 1 },
        { role: 'LB', x: 35, y: 68, count: 1 },
        { role: 'RB', x: 65, y: 68, count: 1 },
        { role: 'LM', x: 30, y: 45, count: 1 },
        { role: 'RM', x: 70, y: 45, count: 1 },
        { role: 'ST', x: 40, y: 20, count: 1 },
        { role: 'ST', x: 60, y: 20, count: 1 }
      ]
    },
    '3-3-1': {
      name: '3-3-1',
      format: '7-a-side',
      playersOnField: 7,
      positions: [
        { role: 'GK', x: 50, y: 88, count: 1 },
        { role: 'LB', x: 25, y: 68, count: 1 },
        { role: 'CB', x: 50, y: 68, count: 1 },
        { role: 'RB', x: 75, y: 68, count: 1 },
        { role: 'LM', x: 30, y: 45, count: 1 },
        { role: 'RM', x: 70, y: 45, count: 1 },
        { role: 'ST', x: 50, y: 20, count: 1 }
      ]
    },
    '2-1-3': {
      name: '2-1-3',
      format: '7-a-side',
      playersOnField: 7,
      positions: [
        { role: 'GK', x: 50, y: 88, count: 1 },
        { role: 'LB', x: 35, y: 68, count: 1 },
        { role: 'RB', x: 65, y: 68, count: 1 },
        { role: 'CM', x: 50, y: 48, count: 1 },
        { role: 'LW', x: 30, y: 25, count: 1 },
        { role: 'ST', x: 50, y: 20, count: 1 },
        { role: 'RW', x: 70, y: 25, count: 1 }
      ]
    }
  },
  // 11-a-side formations (11 players on field)
  '11s': {
    '4-3-3': {
      name: '4-3-3',
      format: '11-a-side',
      playersOnField: 11,
      positions: [
        { role: 'GK', x: 50, y: 90, count: 1 },
        { role: 'LB', x: 20, y: 70, count: 1 },
        { role: 'CB', x: 40, y: 70, count: 1 },
        { role: 'CB', x: 60, y: 70, count: 1 },
        { role: 'RB', x: 80, y: 70, count: 1 },
        { role: 'CM', x: 35, y: 45, count: 1 },
        { role: 'CM', x: 50, y: 50, count: 1 },
        { role: 'CM', x: 65, y: 45, count: 1 },
        { role: 'LW', x: 20, y: 20, count: 1 },
        { role: 'ST', x: 50, y: 15, count: 1 },
        { role: 'RW', x: 80, y: 20, count: 1 }
      ]
    },
    '4-4-2': {
      name: '4-4-2',
      format: '11-a-side',
      playersOnField: 11,
      positions: [
        { role: 'GK', x: 50, y: 90, count: 1 },
        { role: 'LB', x: 20, y: 70, count: 1 },
        { role: 'CB', x: 40, y: 70, count: 1 },
        { role: 'CB', x: 60, y: 70, count: 1 },
        { role: 'RB', x: 80, y: 70, count: 1 },
        { role: 'LM', x: 20, y: 45, count: 1 },
        { role: 'CM', x: 40, y: 50, count: 1 },
        { role: 'CM', x: 60, y: 50, count: 1 },
        { role: 'RM', x: 80, y: 45, count: 1 },
        { role: 'ST', x: 40, y: 20, count: 1 },
        { role: 'ST', x: 60, y: 20, count: 1 }
      ]
    },
    '3-5-2': {
      name: '3-5-2',
      format: '11-a-side',
      playersOnField: 11,
      positions: [
        { role: 'GK', x: 50, y: 90, count: 1 },
        { role: 'CB', x: 30, y: 70, count: 1 },
        { role: 'CB', x: 50, y: 70, count: 1 },
        { role: 'CB', x: 70, y: 70, count: 1 },
        { role: 'LM', x: 15, y: 45, count: 1 },
        { role: 'CM', x: 35, y: 50, count: 1 },
        { role: 'CM', x: 50, y: 55, count: 1 },
        { role: 'CM', x: 65, y: 50, count: 1 },
        { role: 'RM', x: 85, y: 45, count: 1 },
        { role: 'ST', x: 40, y: 20, count: 1 },
        { role: 'ST', x: 60, y: 20, count: 1 }
      ]
    },
    '4-2-3-1': {
      name: '4-2-3-1',
      format: '11-a-side',
      playersOnField: 11,
      positions: [
        { role: 'GK', x: 50, y: 90, count: 1 },
        { role: 'LB', x: 20, y: 70, count: 1 },
        { role: 'CB', x: 40, y: 70, count: 1 },
        { role: 'CB', x: 60, y: 70, count: 1 },
        { role: 'RB', x: 80, y: 70, count: 1 },
        { role: 'CM', x: 40, y: 55, count: 1 },
        { role: 'CM', x: 60, y: 55, count: 1 },
        { role: 'LW', x: 20, y: 35, count: 1 },
        { role: 'AM', x: 50, y: 35, count: 1 },
        { role: 'RW', x: 80, y: 35, count: 1 },
        { role: 'ST', x: 50, y: 15, count: 1 }
      ]
    },
    '3-4-3': {
      name: '3-4-3',
      format: '11-a-side',
      playersOnField: 11,
      positions: [
        { role: 'GK', x: 50, y: 90, count: 1 },
        { role: 'CB', x: 30, y: 70, count: 1 },
        { role: 'CB', x: 50, y: 70, count: 1 },
        { role: 'CB', x: 70, y: 70, count: 1 },
        { role: 'LM', x: 20, y: 45, count: 1 },
        { role: 'CM', x: 40, y: 50, count: 1 },
        { role: 'CM', x: 60, y: 50, count: 1 },
        { role: 'RM', x: 80, y: 45, count: 1 },
        { role: 'LW', x: 20, y: 20, count: 1 },
        { role: 'ST', x: 50, y: 15, count: 1 },
        { role: 'RW', x: 80, y: 20, count: 1 }
      ]
    },
    '4-1-4-1': {
      name: '4-1-4-1',
      format: '11-a-side',
      playersOnField: 11,
      positions: [
        { role: 'GK', x: 50, y: 90, count: 1 },
        { role: 'LB', x: 20, y: 70, count: 1 },
        { role: 'CB', x: 40, y: 70, count: 1 },
        { role: 'CB', x: 60, y: 70, count: 1 },
        { role: 'RB', x: 80, y: 70, count: 1 },
        { role: 'DM', x: 50, y: 55, count: 1 },
        { role: 'LM', x: 20, y: 40, count: 1 },
        { role: 'CM', x: 40, y: 45, count: 1 },
        { role: 'CM', x: 60, y: 45, count: 1 },
        { role: 'RM', x: 80, y: 40, count: 1 },
        { role: 'ST', x: 50, y: 15, count: 1 }
      ]
    },
    '5-3-2': {
      name: '5-3-2',
      format: '11-a-side',
      playersOnField: 11,
      positions: [
        { role: 'GK', x: 50, y: 90, count: 1 },
        { role: 'LB', x: 15, y: 70, count: 1 },
        { role: 'CB', x: 35, y: 70, count: 1 },
        { role: 'CB', x: 50, y: 70, count: 1 },
        { role: 'CB', x: 65, y: 70, count: 1 },
        { role: 'RB', x: 85, y: 70, count: 1 },
        { role: 'CM', x: 35, y: 45, count: 1 },
        { role: 'CM', x: 50, y: 50, count: 1 },
        { role: 'CM', x: 65, y: 45, count: 1 },
        { role: 'ST', x: 40, y: 20, count: 1 },
        { role: 'ST', x: 60, y: 20, count: 1 }
      ]
    },
    '5-4-1': {
      name: '5-4-1',
      format: '11-a-side',
      playersOnField: 11,
      positions: [
        { role: 'GK', x: 50, y: 90, count: 1 },
        { role: 'LB', x: 15, y: 70, count: 1 },
        { role: 'CB', x: 35, y: 70, count: 1 },
        { role: 'CB', x: 50, y: 70, count: 1 },
        { role: 'CB', x: 65, y: 70, count: 1 },
        { role: 'RB', x: 85, y: 70, count: 1 },
        { role: 'LM', x: 20, y: 45, count: 1 },
        { role: 'CM', x: 40, y: 50, count: 1 },
        { role: 'CM', x: 60, y: 50, count: 1 },
        { role: 'RM', x: 80, y: 45, count: 1 },
        { role: 'ST', x: 50, y: 15, count: 1 }
      ]
    }
  }
}

// Squad requirements (players on field + minimum substitutes)
const SQUAD_REQUIREMENTS = {
  '5s': { minPlayers: 8, playersOnField: 5, minSubs: 3, recommended: 8 },
  '7s': { minPlayers: 11, playersOnField: 7, minSubs: 4, recommended: 11 },
  '11s': { minPlayers: 14, playersOnField: 11, minSubs: 3, recommended: 18 }
}

export function FormationBuilder({ players, clubId, teamId }: FormationBuilderProps) {
  const totalPlayers = players.length
  const { addToast } = useToast()

  // Determine which formats are available based on squad size
  const getAvailableFormats = () => {
    const formats: string[] = []
    if (totalPlayers >= SQUAD_REQUIREMENTS['5s'].minPlayers) formats.push('5s')
    if (totalPlayers >= SQUAD_REQUIREMENTS['7s'].minPlayers) formats.push('7s')
    if (totalPlayers >= SQUAD_REQUIREMENTS['11s'].minPlayers) formats.push('11s')
    return formats
  }

  const availableFormats = getAvailableFormats()
  const defaultFormat = availableFormats[availableFormats.length - 1] || '5s'

  const [selectedFormat, setSelectedFormat] = useState<string>(defaultFormat)
  const [selectedFormation, setSelectedFormation] = useState<string>(
    Object.keys(FORMATIONS[defaultFormat as keyof typeof FORMATIONS] || FORMATIONS['5s'])[0]
  )
  const [assignments, setAssignments] = useState<Record<string, Player | null>>({})
  const [selectedPlayers, setSelectedPlayers] = useState<Set<string>>(new Set()) // Players moved from bench
  const [swapMode, setSwapMode] = useState<boolean>(false) // Swap mode toggle
  const [firstSwapPlayer, setFirstSwapPlayer] = useState<{ player: Player; source: 'field' | 'substitute' | 'available'; positionKey?: string } | null>(null)
  // Local UI state for available players and substitutes.
  // These are kept in sync from derived values below so other flows (loadLineup)
  // can call the setters (setAvailablePlayers / setSubstitutePlayers).
  const [availablePlayers, setAvailablePlayers] = useState<Player[]>(players)
  const [substitutePlayers, setSubstitutePlayers] = useState<Player[]>([])
  const [showSaveDialog, setShowSaveDialog] = useState<boolean>(false)

  const currentFormations = FORMATIONS[selectedFormat] || FORMATIONS['5s']
  const formation: Formation =
    currentFormations[selectedFormation] || Object.values(currentFormations)[0]
  const requirements = SQUAD_REQUIREMENTS[selectedFormat as keyof typeof SQUAD_REQUIREMENTS]

  // Three tiers of players
  const assignedPlayerIds = new Set(
    Object.values(assignments)
      .filter((p): p is Player => p !== null)
      .map(p => p.id)
  )

  // Available for XI: Selected but not assigned to formation (max = playersOnField)
  const availableXIPlayers = players
    .filter(p => selectedPlayers.has(p.id) && !assignedPlayerIds.has(p.id))
    .slice(0, requirements.playersOnField)

  // Bench: All players not selected AND not currently assigned/available/substitute
  // This prevents duplicates when a lineup is loaded (assigned players appearing in bench)
  const benchPlayers = players.filter(p => {
    const inSelected = selectedPlayers.has(p.id)
    const inAssigned = assignedPlayerIds.has(p.id)
    const inSubstitutes = substitutePlayers.some(s => s.id === p.id)
    const inAvailableXI = availableXIPlayers.some(a => a.id === p.id)
    return !inSelected && !inAssigned && !inSubstitutes && !inAvailableXI
  })

  // Keep substitutes in sync when players/selection/assignments change
  useEffect(() => {
    const subs = players
      .filter(p => selectedPlayers.has(p.id) && !assignedPlayerIds.has(p.id))
      .slice(requirements.playersOnField)
    setSubstitutePlayers(subs)
  }, [players, selectedPlayers, assignments, requirements.playersOnField])

  const getPlayerByPosition = (role: string): Player | null => {
    return assignments[role] || null
  }

  const handleAssignPlayer = (positionKey: string, player: Player) => {
    // Count how many positions are currently assigned
    const currentAssignedCount = Object.values(assignments).filter(p => p !== null).length
    const playersOnField = requirements.playersOnField || 11
    
    // Check if adding this player would exceed the field limit
    // (only if this is a new assignment, not replacing an existing one)
    if (!assignments[positionKey] && currentAssignedCount >= playersOnField) {
      addToast({
        title: 'Field is Full',
        description: `Maximum ${playersOnField} players allowed on field. Remove a player first.`,
        type: 'error',
        duration: 2500
      })
      return
    }
    
    setAssignments(prev => ({
      ...prev,
      [positionKey]: player
    }))
  }

  const handleRemoveFromPosition = (positionKey: string) => {
    setAssignments(prev => {
      const newAssignments = { ...prev }
      delete newAssignments[positionKey]
      return newAssignments
    })
  }

  const handleAddFromBench = (player: Player) => {
    setSelectedPlayers(prev => {
      // Check if we already have the maximum number of players
      const totalNeeded = (requirements.playersOnField || 11) + (requirements.minSubs || 2)
      if (prev.size >= totalNeeded) {
        addToast({
          title: 'Lineup Full',
          description: `Maximum ${totalNeeded} players for this format. Remove some players first.`,
          type: 'error',
          duration: 2500
        })
        return prev
      }
      return new Set(prev).add(player.id)
    })
  }

  // Swap functionality
  const handleSwapClick = (player: Player, source: 'field' | 'substitute' | 'available', positionKey?: string) => {
    if (!firstSwapPlayer) {
      // First selection
      setFirstSwapPlayer({ player, source, positionKey })
    } else {
      // Second selection - perform swap
      performSwap(firstSwapPlayer, { player, source, positionKey })
      setFirstSwapPlayer(null)
      setSwapMode(false)
    }
  }

  const performSwap = (
    first: { player: Player; source: 'field' | 'substitute' | 'available'; positionKey?: string },
    second: { player: Player; source: 'field' | 'substitute' | 'available'; positionKey?: string }
  ) => {
    // Field <-> Field: Swap positions
    if (first.source === 'field' && second.source === 'field' && first.positionKey && second.positionKey) {
      setAssignments(prev => ({
        ...prev,
        [first.positionKey!]: second.player,
        [second.positionKey!]: first.player
      }))
    }
    // Field <-> Substitute/Available: Replace player on field, first player goes to substitutes
    else if (first.source === 'field' && (second.source === 'substitute' || second.source === 'available') && first.positionKey) {
      setAssignments(prev => ({
        ...prev,
        [first.positionKey!]: second.player
      }))
      // First player stays in selectedPlayers (goes to substitutes automatically)
    }
    // Substitute/Available <-> Field: Replace player on field, second player goes to substitutes
    else if ((first.source === 'substitute' || first.source === 'available') && second.source === 'field' && second.positionKey) {
      setAssignments(prev => ({
        ...prev,
        [second.positionKey!]: first.player
      }))
      // Second player stays in selectedPlayers (goes to substitutes automatically)
    }
    // Substitute/Available <-> Substitute/Available: Just a visual swap (both stay in selectedPlayers)
    else {
      // No action needed - they're both in the same pool
    }
  }

  const cancelSwap = () => {
    setFirstSwapPlayer(null)
    setSwapMode(false)
  }

  const handleMoveToBench = (player: Player) => {
    // Remove from selected players (moves to bench)
    setSelectedPlayers(prev => {
      const newSet = new Set(prev)
      newSet.delete(player.id)
      return newSet
    })

    // Remove from any position assignments
    setAssignments(prev => {
      const newAssignments = { ...prev }
      Object.keys(newAssignments).forEach(key => {
        if (newAssignments[key]?.id === player.id) {
          delete newAssignments[key]
        }
      })
      return newAssignments
    })
  }

  const handleAddPlayerToField = (player: Player) => {
    // Find first vacant position on field
    const fieldPositions = formation?.positions || []
    const vacantPosition = fieldPositions.find(pos => {
      const posKey = `${pos.role}-${pos.x}-${pos.y}`
      return !assignments[posKey]
    })

    if (vacantPosition) {
      const posKey = `${vacantPosition.role}-${vacantPosition.x}-${vacantPosition.y}`
      handleAssignPlayer(posKey, player)
      addToast({
        title: 'Player Added',
        description: `${player.players.users.first_name} assigned to field`,
        type: 'success',
        duration: 2000
      })
    } else {
      addToast({
        title: 'Field is Full',
        description: 'Remove a player to add another',
        type: 'error',
        duration: 2500
      })
    }
  }

  const clearFormation = () => {
    setAssignments({})
  }

  const autoAssign = () => {
    const newAssignments: Record<string, Player | null> = {}
    const usedPlayers = new Set<string>()

    // Get all selected players (Available XI + Substitutes)
    const selectedPlayersList = players.filter(p => selectedPlayers.has(p.id))

    formation.positions.forEach((pos) => {
      const posKey = `${pos.role}-${pos.x}-${pos.y}`

      const suitablePlayer = selectedPlayersList.find(p => {
        if (usedPlayers.has(p.id)) return false

        if (pos.role === 'GK' && p.players?.position === 'Goalkeeper') return true
        if ((pos.role.includes('B') || pos.role === 'CB') && p.players?.position === 'Defender') return true
        if ((pos.role.includes('M') || pos.role === 'CM') && p.players?.position === 'Midfielder') return true
        if ((pos.role === 'ST' || pos.role.includes('W') || pos.role.includes('F')) && p.players?.position === 'Forward') return true

        return false
      })

      if (suitablePlayer) {
        newAssignments[posKey] = suitablePlayer
        usedPlayers.add(suitablePlayer.id)
      }
    })

    setAssignments(newAssignments)
  }

  const handleFormatChange = (format: string) => {
    setSelectedFormat(format)
    const formationsForFormat = FORMATIONS[format as keyof typeof FORMATIONS]
    const newFormationKey = Object.keys(formationsForFormat)[0]
    setSelectedFormation(newFormationKey)
    
    // Re-assign players to compatible positions in the new formation
    const newFormation = formationsForFormat[newFormationKey as keyof typeof formationsForFormat]
    if (newFormation) {
      const newPositionKeys = new Set(
        newFormation.positions.map(pos => `${pos.role}-${pos.x}-${pos.y}`)
      )
      
      const updatedAssignments: Record<string, Player | null> = {}
      const displacedPlayers: Array<{ player: Player; oldRole: string }> = []
      
      // First pass: Keep exact position matches
      Object.entries(assignments).forEach(([key, player]) => {
        if (newPositionKeys.has(key) && player) {
          updatedAssignments[key] = player
        } else if (player) {
          // Extract the role from the old position key (e.g., "LB" from "LB-30-65")
          const oldRole = key.split('-')[0]
          displacedPlayers.push({ player, oldRole })
        }
      })
      
      // Second pass: Try to re-assign displaced players to compatible roles
      const availableNewPositions = newFormation.positions.filter(pos => {
        const posKey = `${pos.role}-${pos.x}-${pos.y}`
        return !Object.values(updatedAssignments).some(p => 
          p && assignments[Object.keys(assignments).find(k => 
            assignments[k]?.id === p.id && k === posKey
          ) || '']
        )
      })
      
      // Define role compatibility mapping
      const roleCompatibility: Record<string, string[]> = {
        'GK': ['GK'],
        'CB': ['CB', 'LB', 'RB', 'LWB', 'RWB'],
        'LB': ['LB', 'CB', 'LWB'],
        'RB': ['RB', 'CB', 'RWB'],
        'LWB': ['LWB', 'LB'],
        'RWB': ['RWB', 'RB'],
        'CM': ['CM', 'CAM', 'CDM', 'LM', 'RM'],
        'CAM': ['CAM', 'CM', 'LM', 'RM'],
        'CDM': ['CDM', 'CM'],
        'LM': ['LM', 'CM', 'CAM', 'LW'],
        'RM': ['RM', 'CM', 'CAM', 'RW'],
        'LW': ['LW', 'LM', 'ST'],
        'RW': ['RW', 'RM', 'ST'],
        'ST': ['ST', 'LW', 'RW', 'CF'],
        'CF': ['CF', 'ST'],
        'LF': ['LF', 'LW', 'ST'],
        'RF': ['RF', 'RW', 'ST']
      }
      
      // Try to assign displaced players to compatible roles
      displacedPlayers.forEach(({ player, oldRole }) => {
        const compatibleRoles = roleCompatibility[oldRole] || [oldRole]
        const bestMatch = availableNewPositions.find(pos => 
          compatibleRoles.includes(pos.role)
        )
        
        if (bestMatch) {
          const posKey = `${bestMatch.role}-${bestMatch.x}-${bestMatch.y}`
          updatedAssignments[posKey] = player
          // Remove from available positions so it's not used again
          availableNewPositions.splice(availableNewPositions.indexOf(bestMatch), 1)
        } else {
          // If no compatible position, move to available tier
          // (This is handled below with selectedPlayers)
        }
      })
      
      setAssignments(updatedAssignments)
      
      // Add any remaining displaced players to available tier
      const assignedPlayerIds = new Set(Object.values(updatedAssignments).map(p => p?.id).filter(Boolean))
      const stillDisplaced = new Set<string>()
      displacedPlayers.forEach(({ player }) => {
        if (!assignedPlayerIds.has(player.id)) {
          stillDisplaced.add(player.id)
        }
      })
      
      setSelectedPlayers(stillDisplaced)
      setSubstitutePlayers([])
    }
  }

  const saveLineup = async (lineupName: string) => {
    if (!teamId) {
      addToast({
        title: 'Team Not Selected',
        description: 'Please select a team before saving',
        type: 'error',
        duration: 2500
      })
      return
    }

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        addToast({
          title: 'Authentication Error',
          description: 'You are not authenticated. Please log in.',
          type: 'error',
          duration: 2500
        })
        return
      }

      // Convert format string to match_format enum
      const formatMap: Record<string, string> = {
        '5s': '5-a-side',
        '7s': '7-a-side',
        '11s': '11-a-side'
      }

      // Upsert lineup by team + format: if a lineup for this team and format exists, update it; otherwise create.
      const { data: existingLineups } = await supabase
        .from('team_lineups')
        .select('*')
        .eq('team_id', teamId)
        .eq('format', formatMap[selectedFormat])
        .order('created_at', { ascending: false })
        .limit(1)

      let lineup: any = null

      if (existingLineups && existingLineups.length > 0) {
        // Update existing lineup
        const existing = existingLineups[0]
        const { error: updateError } = await supabase
          .from('team_lineups')
          .update({
            lineup_name: lineupName,
            formation: selectedFormation,
            is_default: false,
            updated_at: new Date().toISOString()
          })
          .eq('id', existing.id)

        if (updateError) {
          console.error('Error updating lineup:', updateError)
          addToast({
            title: 'Update Failed',
            description: updateError.message || 'Failed to update lineup',
            type: 'error',
            duration: 3000
          })
          return
        }

        lineup = existing
      } else {
        // Create new lineup
        const { data: newLineup, error: lineupError } = await supabase
          .from('team_lineups')
          .insert({
            team_id: teamId,
            lineup_name: lineupName,
            format: formatMap[selectedFormat],
            formation: selectedFormation,
            is_default: false,
            created_by: user.id
          })
          .select()
          .single()

        if (lineupError) {
          console.error('Error creating lineup:', lineupError)
          addToast({
            title: 'Creation Failed',
            description: lineupError.message || 'Failed to create lineup',
            type: 'error',
            duration: 3000
          })
          return
        }

        lineup = newLineup
      }

      // Save starters
      const starterInserts = Object.entries(assignments).map(([posKey, player], index) => {
        if (!player) return null
        const [role, x, y] = posKey.split('-')
        return {
          lineup_id: lineup.id,
          player_id: player.players.id,
          position_on_field: role,
          position_x: parseFloat(x),
          position_y: parseFloat(y),
          jersey_number: player.jersey_number,
          is_starter: true,
          substitute_order: null
        }
      }).filter(Boolean)

      // Validate starter count doesn't exceed format limit
      if (starterInserts.length > (requirements.playersOnField || 11)) {
        addToast({
          title: 'Too Many Starters',
          description: `This format allows maximum ${requirements.playersOnField} starters. You have ${starterInserts.length}. Move extra players to substitutes.`,
          type: 'error',
          duration: 3000
        })
        return
      }

      // Save substitutes
      // Prefer explicit substitute state; fallback to selectedPlayers-derived substitutes
      const starterPlayerIds = new Set(
        Object.values(assignments)
          .filter((p): p is Player => p !== null)
          .map((p) => p.players.id)
      )

      const derivedSubstitutes = players
        .filter((p) => selectedPlayers.has(p.id) && !starterPlayerIds.has(p.players.id))

      const substitutesToSave = substitutePlayers.length > 0 ? substitutePlayers : derivedSubstitutes

      const subInserts = substitutesToSave.map((player, index) => ({
        lineup_id: lineup.id,
        player_id: player.players.id,
        position_on_field: player.players.position,
        position_x: null,
        position_y: null,
        jersey_number: player.jersey_number,
        is_starter: false,
        substitute_order: index + 1
      }))

      const allInserts = [...starterInserts, ...subInserts]

      // If updating an existing lineup, remove old player rows for this lineup id first
      if (lineup && lineup.id) {
        const { error: deleteError } = await supabase
          .from('team_lineup_players')
          .delete()
          .eq('lineup_id', lineup.id)

        if (deleteError) {
          console.error('Error deleting old lineup players:', deleteError)
          addToast({
            title: 'Deletion Failed',
            description: deleteError.message || 'Failed to remove old lineup data',
            type: 'error',
            duration: 3000
          })
          return
        }
      }

      if (allInserts.length > 0) {
        const insertsWithLineupId = allInserts.map((row) => ({ ...row, lineup_id: lineup.id }))
        const { error: playersError } = await supabase
          .from('team_lineup_players')
          .insert(insertsWithLineupId)

        if (playersError) {
          console.error('Error saving players:', playersError)
          addToast({
            title: 'Save Failed',
            description: playersError.message || 'Failed to save players to lineup',
            type: 'error',
            duration: 3000
          })
          return
        }
      }

      addToast({
        title: 'Lineup Saved',
        description: `"${lineupName}" has been saved successfully with ${starterInserts.length} starters and ${subInserts.length} substitutes`,
        type: 'success',
        duration: 3000
      })
    } catch (error) {
      console.error('Error saving lineup:', error)
      addToast({
        title: 'Save Failed',
        description: 'An unexpected error occurred while saving the lineup',
        type: 'error',
        duration: 3000
      })
    }
  }

  const handleSaveLineup = () => {
    setShowSaveDialog(true)
  }

  const handleSaveLineupWithName = (lineupName: string) => {
    setShowSaveDialog(false)
    saveLineup(lineupName)
  }

  const loadLineup = async (lineupId: string) => {
    try {
      const supabase = createClient()

      // Fetch lineup details
      const { data: lineup, error: lineupError } = await supabase
        .from('team_lineups')
        .select('*')
        .eq('id', lineupId)
        .single()

      if (lineupError || !lineup) {
        console.error('Error loading lineup:', lineupError)
        addToast({
          title: 'Load Failed',
          description: 'Failed to load the lineup details',
          type: 'error',
          duration: 2500
        })
        return
      }

      // Fetch lineup players
      const { data: lineupPlayers, error: playersError } = await supabase
        .from('team_lineup_players')
        .select('*')
        .eq('lineup_id', lineupId)

      if (playersError) {
        console.error('Error loading lineup players:', playersError)
        addToast({
          title: 'Load Failed',
          description: 'Failed to load players from the lineup',
          type: 'error',
          duration: 2500
        })
        return
      }

      // Map format back to UI format
      const formatMap: Record<string, '5s' | '7s' | '11s'> = {
        '5-a-side': '5s',
        '7-a-side': '7s',
        '11-a-side': '11s'
      }

      const uiFormat = formatMap[lineup.format]
      if (!uiFormat) {
        addToast({
          title: 'Invalid Format',
          description: 'The lineup has an unsupported format',
          type: 'error',
          duration: 2500
        })
        return
      }

      // Set format and formation
      setSelectedFormat(uiFormat)
      setSelectedFormation(lineup.formation)

      // Clear current assignments
      setAssignments({})
      setSubstitutePlayers([])
      setAvailablePlayers([...players])

      // Wait for state to update
      setTimeout(async () => {
        const newAssignments: Record<string, Player> = {}
        const newSubstitutes: Player[] = []
        const usedPlayerIds = new Set<string>()

        // Process lineup players
        for (const lineupPlayer of lineupPlayers || []) {
          const player = players.find(p => p.players.id === lineupPlayer.player_id)
          if (!player) continue

          usedPlayerIds.add(player.id)

          if (lineupPlayer.is_starter && lineupPlayer.position_x !== null && lineupPlayer.position_y !== null) {
            // Add to field assignments
            const posKey = `${lineupPlayer.position_on_field}-${lineupPlayer.position_x}-${lineupPlayer.position_y}`
            newAssignments[posKey] = player
          } else if (!lineupPlayer.is_starter) {
            // Add to substitutes
            newSubstitutes.push(player)
          }
        }

        // Sort substitutes by order
        newSubstitutes.sort((a, b) => {
          const aOrder = lineupPlayers?.find(lp => lp.player_id === a.players.id)?.substitute_order || 0
          const bOrder = lineupPlayers?.find(lp => lp.player_id === b.players.id)?.substitute_order || 0
          return aOrder - bOrder
        })

        // Update state
        setAssignments(newAssignments)
        setSubstitutePlayers(newSubstitutes)

        // Update available players (excluding assigned ones)
        const newAvailablePlayers = players.filter(p => !usedPlayerIds.has(p.id))
        setAvailablePlayers(newAvailablePlayers)

        // Update selectedPlayers to include all starters and substitutes
        const newSelectedPlayers = new Set<string>()
        Object.values(newAssignments).forEach(player => {
          if (player) newSelectedPlayers.add(player.id)
        })
        newSubstitutes.forEach(player => {
          newSelectedPlayers.add(player.id)
        })
        setSelectedPlayers(newSelectedPlayers)
      }, 100)
    } catch (error) {
      console.error('Error loading lineup:', error)
      addToast({
        title: 'Load Failed',
        description: 'Failed to load the lineup',
        type: 'error',
        duration: 2500
      })
    }
  }

  const handleLoadLineup = async () => {
    if (!teamId) {
      addToast({
        title: 'Team Not Selected',
        description: 'Please select a team before loading a lineup',
        type: 'error',
        duration: 2500
      })
      return
    }

    try {
      const supabase = createClient()

      // Fetch available lineups for this team
      const { data: lineups, error: lineupsError } = await supabase
        .from('team_lineups')
        .select('id, lineup_name, format, formation, created_at')
        .eq('team_id', teamId)
        .order('created_at', { ascending: false })

      if (lineupsError) {
        console.error('Error fetching lineups:', lineupsError)
        addToast({
          title: 'Fetch Failed',
          description: 'Failed to fetch available lineups',
          type: 'error',
          duration: 2500
        })
        return
      }

      if (!lineups || lineups.length === 0) {
        addToast({
          title: 'No Lineups Found',
          description: 'No saved lineups available for this team',
          type: 'info',
          duration: 2500
        })
        return
      }

      // Create a simple selection prompt
      const lineupList = lineups.map((l, i) =>
        `${i + 1}. ${l.lineup_name} (${l.format}, ${l.formation})`
      ).join('\n')

      const selection = prompt(`Select a lineup to load:\n\n${lineupList}\n\nEnter the number:`)

      if (!selection) return

      const index = parseInt(selection) - 1
      if (isNaN(index) || index < 0 || index >= lineups.length) {
        addToast({
          title: 'Invalid Selection',
          description: 'Please select a valid lineup',
          type: 'error',
          duration: 2000
        })
        return
      }

      const selectedLineup = lineups[index]
      await loadLineup(selectedLineup.id)
    } catch (error) {
      console.error('Error loading lineups:', error)
      addToast({
        title: 'Load Failed',
        description: 'Failed to load lineups. Please try again.',
        type: 'error',
        duration: 2500
      })
    }
  }

  // Load the latest lineup for the currently selected format (if any).
  const loadLatestLineupForFormat = async (formatKey: string) => {
    if (!teamId) return
    try {
      const supabase = createClient()
      const formatMap: Record<string, string> = {
        '5s': '5-a-side',
        '7s': '7-a-side',
        '11s': '11-a-side'
      }

      const { data: lineups, error } = await supabase
        .from('team_lineups')
        .select('id')
        .eq('team_id', teamId)
        .eq('format', formatMap[formatKey])
        .order('created_at', { ascending: false })
        .limit(1)

      if (error) {
        console.error('Error fetching latest lineup:', error)
        return
      }

      // Only load if a lineup exists for this format
      // If no lineup exists, keep the current assignments (don't clear them)
      if (lineups && lineups.length > 0) {
        await loadLineup(lineups[0].id)
      }
    } catch (err) {
      console.error('Error loading latest lineup for format:', err)
    }
  }

  // Auto-load latest lineup when team or format changes (only if team selected)
  useEffect(() => {
    if (!teamId) return
    
    // When switching format, preserve assigned players but clear their positions
    // They will move to "available" tier where user can reposition them
    const previousAssignments = { ...assignments }
    const previousSubstitutes = [...substitutePlayers]
    
    loadLatestLineupForFormat(selectedFormat)
    
    // After loading, if no lineup was found for this format, keep the players
    // but they'll be repositioned by the user
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teamId, selectedFormat])

  // Handle formation layout changes (e.g., 2-2 to 1-2-1 within same 5-a-side format)
  // Re-assign players to compatible positions in the new formation
  useEffect(() => {
    if (!formation) return
    
    const newPositions = formation.positions || []
    const newPositionKeys = new Set(
      newPositions.map(pos => `${pos.role}-${pos.x}-${pos.y}`)
    )
    
    const updatedAssignments: Record<string, any> = {}
    const displacedPlayers: Array<{ player: any; oldRole: string }> = []
    
    // First pass: Keep exact position matches
    Object.entries(assignments).forEach(([key, player]) => {
      if (newPositionKeys.has(key) && player) {
        updatedAssignments[key] = player
      } else if (player) {
        const oldRole = key.split('-')[0]
        displacedPlayers.push({ player, oldRole })
      }
    })
    
    // Second pass: Try to re-assign displaced players to compatible roles
    const availableNewPositions = newPositions.filter(pos => {
      const posKey = `${pos.role}-${pos.x}-${pos.y}`
      return !Object.keys(updatedAssignments).includes(posKey)
    })
    
    // Role compatibility mapping
    const roleCompatibility: Record<string, string[]> = {
      'GK': ['GK'],
      'CB': ['CB', 'LB', 'RB', 'LWB', 'RWB'],
      'LB': ['LB', 'CB', 'LWB'],
      'RB': ['RB', 'CB', 'RWB'],
      'LWB': ['LWB', 'LB'],
      'RWB': ['RWB', 'RB'],
      'CM': ['CM', 'CAM', 'CDM', 'LM', 'RM'],
      'CAM': ['CAM', 'CM', 'LM', 'RM'],
      'CDM': ['CDM', 'CM'],
      'LM': ['LM', 'CM', 'CAM', 'LW'],
      'RM': ['RM', 'CM', 'CAM', 'RW'],
      'LW': ['LW', 'LM', 'ST'],
      'RW': ['RW', 'RM', 'ST'],
      'ST': ['ST', 'LW', 'RW', 'CF'],
      'CF': ['CF', 'ST'],
      'LF': ['LF', 'LW', 'ST'],
      'RF': ['RF', 'RW', 'ST']
    }
    
    // Try to assign displaced players to compatible roles
    displacedPlayers.forEach(({ player, oldRole }) => {
      const compatibleRoles = roleCompatibility[oldRole] || [oldRole]
      const bestMatch = availableNewPositions.find(pos =>
        compatibleRoles.includes(pos.role)
      )
      
      if (bestMatch) {
        const posKey = `${bestMatch.role}-${bestMatch.x}-${bestMatch.y}`
        updatedAssignments[posKey] = player
        availableNewPositions.splice(availableNewPositions.indexOf(bestMatch), 1)
      } else {
        // Move to available tier if no compatible position
        setSelectedPlayers(prev => new Set(prev).add(player.id))
      }
    })
    
    setAssignments(updatedAssignments)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedFormation])


  const PlayerCard = ({ player, variant, onAction, actionIcon, actionLabel, source, positionKey }: {
    player: Player
    variant: 'bench' | 'available' | 'substitute'
    onAction: () => void
    actionIcon: React.ReactNode
    actionLabel: string
    source?: 'field' | 'substitute' | 'available'
    positionKey?: string
  }) => {
    const isSelected = swapMode && firstSwapPlayer?.player.id === player.id
    const canSwap = swapMode && variant !== 'bench'

    return (
      <div
        className={`flex items-center gap-3 p-3 rounded-lg transition-all group border ${
          isSelected 
            ? 'bg-orange-50 border-2 border-orange-500 shadow-md' 
            : 'bg-white border border-slate-200 hover:border-slate-300 hover:shadow-md'
        } ${canSwap ? 'cursor-pointer' : ''}`}
        onClick={() => canSwap && source && handleSwapClick(player, source, positionKey)}
      >
        {player.players?.photo_url ? (
          <img
            src={player.players.photo_url}
            alt={`${player.players.users?.first_name}`}
            className="w-14 h-14 rounded-full object-cover border-3 border-white shadow-md"
          />
        ) : (
          <div className="w-14 h-14 rounded-full gradient-brand flex items-center justify-center text-white font-bold shadow-md text-lg">
            {player.players?.users?.first_name?.[0]}
            {player.players?.users?.last_name?.[0]}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="font-bold text-sm truncate text-foreground">
            {player.players?.users?.first_name} {player.players?.users?.last_name}
          </p>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="secondary" className="text-xs bg-primary/10 text-primary border-primary/20">
              {player.players?.position}
            </Badge>
            <span className="text-xs text-muted-foreground font-bold bg-orange-500/10 px-2 py-0.5 rounded-full">
              #{player.jersey_number}
            </span>
          </div>
        </div>
        {!swapMode && (
          <Button
            size="sm"
            variant={variant === 'bench' ? 'default' : 'outline'}
            className={`opacity-0 group-hover:opacity-100 transition-all shadow-sm ${
              variant === 'bench' 
                ? 'gradient-brand hover:shadow-md' 
                : 'hover:bg-primary/10 hover:border-primary'
            }`}
            onClick={onAction}
          >
            {actionIcon}
            <span className="ml-1 text-xs font-semibold">{actionLabel}</span>
          </Button>
        )}
        {canSwap && (
          <Badge 
            variant={isSelected ? 'default' : 'outline'} 
            className={`text-xs ${isSelected ? 'bg-blue-500' : 'border-2'}`}
          >
            {isSelected ? '1st' : 'Swap'}
          </Badge>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Format & Squad Requirements */}
      <Card className="border-0 shadow-lg bg-gradient-to-br from-accent/5 to-primary/5">
        <CardHeader>
          <CardTitle className="text-2xl">⚽ Team Format Selection</CardTitle>
          <CardDescription className="text-base">
            Choose the format based on your squad size ({totalPlayers} players available)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {(['5s', '7s', '11s'] as const).map((format) => {
              const req = SQUAD_REQUIREMENTS[format]
              const isAvailable = totalPlayers >= req.minPlayers
              const isRecommended = totalPlayers >= req.recommended

              return (
                <div
                  key={format}
                  className={`relative overflow-hidden rounded-2xl cursor-pointer transition-all transform hover:scale-105 ${
                    selectedFormat === format
                      ? 'shadow-2xl'
                      : isAvailable
                      ? 'shadow-lg hover:shadow-2xl'
                      : 'opacity-50 cursor-not-allowed'
                  }`}
                  onClick={() => isAvailable && handleFormatChange(format)}
                >
                  <div className={`p-6 ${
                    selectedFormat === format
                      ? 'gradient-brand'
                      : isAvailable
                      ? 'bg-gradient-to-br from-slate-50 to-slate-100 hover:bg-slate-100'
                      : 'bg-gradient-to-br from-slate-200 to-slate-300'
                  }`}>
                    <div className={`text-center ${selectedFormat === format ? 'text-white' : 'text-slate-900'}`}>
                      <div className="text-5xl mb-3">
                        {format === '5s' && '⚡'} {format === '7s' && '🎯'} {format === '11s' && '🏆'}
                      </div>
                      <h4 className="text-2xl font-bold mb-3">{format.replace('s', '-a-side')}</h4>
                      <div className="space-y-2 text-sm mb-4">
                        <div className={`flex justify-between items-center rounded-lg px-3 py-2 ${
                          selectedFormat === format
                            ? 'bg-white/10'
                            : 'bg-slate-200/50'
                        }`}>
                          <span className={selectedFormat === format ? 'text-white/90' : 'text-slate-700'}>On field:</span>
                          <span className="font-bold">{req.playersOnField}</span>
                        </div>
                        <div className={`flex justify-between items-center rounded-lg px-3 py-2 ${
                          selectedFormat === format
                            ? 'bg-white/10'
                            : 'bg-slate-200/50'
                        }`}>
                          <span className={selectedFormat === format ? 'text-white/90' : 'text-slate-700'}>Min subs:</span>
                          <span className="font-bold">{req.minSubs}</span>
                        </div>
                        <div className={`flex justify-between items-center rounded-lg px-3 py-2 ${
                          selectedFormat === format
                            ? 'bg-white/10'
                            : 'bg-slate-200/50'
                        }`}>
                          <span className={selectedFormat === format ? 'text-white/90' : 'text-slate-700'}>Total needed:</span>
                          <span className="font-bold">{req.minPlayers}</span>
                        </div>
                      </div>
                      <div className="mt-3">
                        {!isAvailable && (
                          <div className="bg-red-500 text-white px-4 py-2 rounded-full text-sm font-bold">
                            Need {req.minPlayers - totalPlayers} more
                          </div>
                        )}
                        {isAvailable && !isRecommended && (
                          <div className="bg-yellow-500 text-white px-4 py-2 rounded-full text-sm font-bold">
                            Available (Limited)
                          </div>
                        )}
                        {isRecommended && (
                          <div className="bg-green-600 text-white px-4 py-2 rounded-full text-sm font-bold">
                            ✓ Full Squad
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {availableFormats.length === 0 && (
            <Alert variant="destructive" className="border-2">
              <AlertDescription className="text-base">
                You need at least {SQUAD_REQUIREMENTS['5s'].minPlayers} players to set up a formation.
                You currently have {totalPlayers} player{totalPlayers !== 1 ? 's' : ''}.
                Scout {SQUAD_REQUIREMENTS['5s'].minPlayers - totalPlayers} more player{SQUAD_REQUIREMENTS['5s'].minPlayers - totalPlayers !== 1 ? 's' : ''} to get started!
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {availableFormats.length > 0 && (
        <>
          {/* Formation Selector */}
          <Card className="border-0 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-blue-900 to-blue-800 text-white rounded-t-lg">
              <CardTitle className="text-xl">🎯 Select Formation - {selectedFormat.replace('s', '-a-side')}</CardTitle>
              <CardDescription className="text-slate-200">Choose a tactical formation for {selectedFormat} format</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="flex gap-3 flex-wrap mb-6">
                {Object.entries(currentFormations).map(([key, formationData]) => (
                  <Button
                    key={key}
                    variant={selectedFormation === key ? 'default' : 'outline'}
                    size="lg"
                    className={selectedFormation === key ? 'gradient-brand text-white shadow-lg border-0' : 'border-2 border-slate-200 text-slate-700 bg-white hover:border-orange-300 hover:text-orange-800 hover:bg-orange-50 transition-all duration-200'}
                    onClick={() => setSelectedFormation(key)}
                  >
                    {formationData.name}
                  </Button>
                ))}
              </div>
              <div className="flex gap-3 flex-wrap">
                <Button 
                  size="lg"
                  className="!bg-slate-600 hover:!bg-slate-700 !text-white shadow-lg transition-colors duration-200"
                  onClick={autoAssign}
                >
                  🤖 Auto-Assign Players
                </Button>
                <Button 
                  size="lg"
                  className="!bg-slate-500 hover:!bg-slate-600 !text-white shadow-lg transition-colors duration-200"
                  onClick={clearFormation}
                >
                  🗑️ Clear Formation
                </Button>
                <Button
                  variant={swapMode ? 'default' : 'outline'}
                  size="lg"
                  className={swapMode ? 'bg-purple-600 hover:bg-purple-700 text-white shadow-lg transition-colors duration-200' : 'border-2 border-slate-200 text-slate-700 bg-white hover:border-purple-300 hover:text-purple-800 hover:bg-purple-50 transition-all duration-200'}
                  onClick={() => {
                    setSwapMode(!swapMode)
                    if (swapMode) cancelSwap()
                  }}
                >
                  <ArrowLeftRight className="w-4 h-4 mr-2" />
                  {swapMode ? 'Cancel Swap' : 'Swap Players'}
                </Button>
                <Button 
                  variant="outline" 
                  size="lg"
                  className="border-2 hover:bg-green-500/10 hover:border-green-500"
                  onClick={handleSaveLineup} 
                  disabled={!teamId || Object.keys(assignments).length === 0}
                >
                  <Save className="w-4 h-4 mr-2" />
                  Declare Team
                </Button>
                {swapMode && firstSwapPlayer && (
                  <Alert className="w-full mt-2 bg-blue-500/10 border-2 border-blue-500">
                    <AlertDescription>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">
                          <strong>{firstSwapPlayer.player.players.users.first_name} {firstSwapPlayer.player.players.users.last_name}</strong> selected. Click another player to swap.
                        </span>
                        <Button size="sm" variant="ghost" onClick={cancelSwap}>
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Formation Pitch */}
            <div className="lg:col-span-2">
              <Card className="overflow-hidden shadow-2xl">
                <CardHeader className="bg-green-700 text-white">
                  <CardTitle>Formation: {formation.name}</CardTitle>
                  <CardDescription className="text-white/80">
                    {selectedFormat.replace('s', '-a-side')} - {formation.playersOnField} players on field
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0 bg-green-700">
                  <div
                    className="relative w-full overflow-hidden"
                    style={{
                      aspectRatio: '2/3',
                      background: `
                        repeating-linear-gradient(
                          0deg,
                          #16a34a,
                          #16a34a 6%,
                          #15803d 6%,
                          #15803d 12%
                        )
                      `,
                      boxShadow: 'inset 0 0 50px rgba(0,0,0,0.2)'
                    }}
                  >
                    {/* Field markings - Outer border */}
                    <div className="absolute inset-0 border-4 border-white/70"></div>

                    {/* Half-way line */}
                    <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-1 bg-white/70"></div>

                    {/* Penalty boxes - Top */}
                    <div className="absolute left-1/4 top-0 w-1/2 h-1/6 border-4 border-t-0 border-white/70"></div>
                    <div className="absolute left-1/3 top-0 w-1/3 h-[10%] border-4 border-t-0 border-white/70"></div>

                    {/* Penalty boxes - Bottom */}
                    <div className="absolute left-1/4 bottom-0 w-1/2 h-1/6 border-4 border-b-0 border-white/70"></div>
                    <div className="absolute left-1/3 bottom-0 w-1/3 h-[10%] border-4 border-b-0 border-white/70"></div>

                    {/* Center circle */}
                    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-1/3 h-1/5 rounded-full border-4 border-white/70"></div>
                    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white"></div>

                    {/* Penalty spots */}
                    <div className="absolute left-1/2 top-[12%] -translate-x-1/2 w-2.5 h-2.5 rounded-full bg-white"></div>
                    <div className="absolute left-1/2 bottom-[12%] -translate-x-1/2 w-2.5 h-2.5 rounded-full bg-white"></div>

                    {/* Corner arcs */}
                    <div className="absolute top-0 left-0 w-8 h-8 border-4 border-white/70 border-r-0 border-b-0 rounded-tl-full"></div>
                    <div className="absolute top-0 right-0 w-8 h-8 border-4 border-white/70 border-l-0 border-b-0 rounded-tr-full"></div>
                    <div className="absolute bottom-0 left-0 w-8 h-8 border-4 border-white/70 border-r-0 border-t-0 rounded-bl-full"></div>
                    <div className="absolute bottom-0 right-0 w-8 h-8 border-4 border-white/70 border-l-0 border-t-0 rounded-br-full"></div>

                    {/* Player positions */}
                    {formation.positions.map((pos, index) => {
                      const key = `${pos.role}-${pos.x}-${pos.y}`
                      const assignedPlayer = getPlayerByPosition(key)

                      return (
                        <div
                          key={index}
                          className="absolute transform -translate-x-1/2 -translate-y-1/2 group z-10"
                          style={{
                            left: `${pos.x}%`,
                            top: `${pos.y}%`
                          }}
                        >
                          {assignedPlayer ? (
                            <div
                              className={`relative cursor-pointer ${
                                swapMode && firstSwapPlayer?.player.id === assignedPlayer.id
                                  ? 'ring-4 ring-blue-500 rounded-full'
                                  : ''
                              }`}
                              onClick={() => swapMode && handleSwapClick(assignedPlayer, 'field', key)}
                            >
                              <div className="w-16 h-16 rounded-full overflow-hidden border-4 border-white shadow-2xl group-hover:scale-110 transition-transform">
                                {assignedPlayer.players?.photo_url ? (
                                  <img
                                    src={assignedPlayer.players.photo_url}
                                    alt={`${assignedPlayer.players.users?.first_name}`}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full bg-blue-600 flex items-center justify-center text-white font-bold text-lg">
                                    {assignedPlayer.players?.users?.first_name?.[0]}
                                    {assignedPlayer.players?.users?.last_name?.[0]}
                                  </div>
                                )}
                              </div>
                              <div className="absolute -bottom-1 -right-1 bg-yellow-400 text-black rounded-full w-7 h-7 flex items-center justify-center text-sm font-bold border-2 border-white shadow-lg">
                                {assignedPlayer.jersey_number}
                              </div>
                              {/* Remove button */}
                              {!swapMode && (
                                <button
                                  onClick={() => handleRemoveFromPosition(key)}
                                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg hover:bg-red-600"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              )}
                              {swapMode && (
                                <div className="absolute -top-2 -right-2 bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center shadow-lg">
                                  <ArrowLeftRight className="w-3 h-3" />
                                </div>
                              )}
                              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 bg-black/90 text-white text-xs px-3 py-1.5 rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity shadow-xl z-20">
                                <div className="font-bold">
                                  {assignedPlayer.players?.users?.first_name} {assignedPlayer.players?.users?.last_name}
                                </div>
                                <div className="text-gray-300 text-[10px]">{pos.role} {swapMode && '• Click to swap'}</div>
                              </div>
                            </div>
                          ) : (
                            <div
                              className="w-16 h-16 rounded-full border-4 border-white border-dashed bg-white/30 backdrop-blur-sm flex flex-col items-center justify-center hover:bg-white/50 transition-all shadow-lg cursor-pointer"
                              onClick={() => {
                                if (availableXIPlayers.length > 0) {
                                  handleAssignPlayer(key, availableXIPlayers[0])
                                }
                              }}
                            >
                              <span className="text-white text-xs font-bold drop-shadow-lg">{pos.role}</span>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Player Lists */}
            <div className="space-y-4">
              {/* Available for XI */}
              <Card className="border-0 shadow-lg overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-blue-900 to-blue-800 text-white">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">⚡ Available for XI</CardTitle>
                      <CardDescription className="text-white/80">
                        Click "Add" to assign to first vacant position
                      </CardDescription>
                    </div>
                    <div className="bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-full text-sm font-bold">
                      {availableXIPlayers.length}/{requirements.playersOnField}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="space-y-2 max-h-[250px] overflow-y-auto">
                    {availableXIPlayers.length === 0 ? (
                      <div className="text-center py-6 text-muted-foreground">
                        <div className="text-3xl mb-2">📋</div>
                        <p className="text-xs">Add from bench below</p>
                      </div>
                    ) : (
                      availableXIPlayers.map((player) => (
                        <PlayerCard
                          key={player.id}
                          player={player}
                          variant="available"
                          onAction={() => handleAddPlayerToField(player)}
                          actionIcon={<Plus className="w-3 h-3" />}
                          actionLabel="Add"
                          source="available"
                        />
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Substitutes */}
              <Card className="border-0 shadow-lg overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-blue-900 to-blue-800 text-white">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">🔄 Substitutes</CardTitle>
                      <CardDescription className="text-white/80">
                        Extra players selected for match
                      </CardDescription>
                    </div>
                    <div className="bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-full text-sm font-bold">
                      {substitutePlayers.length}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="space-y-2 max-h-[200px] overflow-y-auto">
                    {substitutePlayers.map((player) => (
                      <PlayerCard
                        key={player.id}
                        player={player}
                        variant="substitute"
                        onAction={() => handleMoveToBench(player)}
                        actionIcon={<ArrowDownCircle className="w-3 h-3" />}
                        actionLabel="Bench"
                        source="substitute"
                      />
                    ))}
                    {substitutePlayers.length === 0 && (
                      <div className="text-center py-3 text-muted-foreground text-xs">
                        No extra subs selected
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Bench */}
              <Card className="border-0 shadow-lg overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-blue-900 to-blue-800 text-white">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">👥 Bench</CardTitle>
                      <CardDescription className="text-white/80">
                        All unselected players from squad
                      </CardDescription>
                    </div>
                    <div className="bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-full text-sm font-bold">
                      {benchPlayers.length}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="space-y-2 max-h-[300px] overflow-y-auto">
                    {benchPlayers.map((player) => (
                      <PlayerCard
                        key={player.id}
                        player={player}
                        variant="bench"
                        onAction={() => handleAddFromBench(player)}
                        actionIcon={<ArrowUpCircle className="w-3 h-3" />}
                        actionLabel="Select"
                      />
                    ))}
                    {benchPlayers.length === 0 && (
                      <div className="text-center py-4 text-muted-foreground text-sm">
                        <div className="text-3xl mb-2">✓</div>
                        <p className="text-xs">All players selected!</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </>
      )}
      
      {/* Declare Team Dialog */}
      <TextInputDialog
        isOpen={showSaveDialog}
        title="Declare Team"
        message="Enter a name for this team lineup"
        placeholder="e.g., Formation A, Match Day Setup"
        onConfirm={handleSaveLineupWithName}
        onCancel={() => setShowSaveDialog(false)}
      />
    </div>
  )
}
