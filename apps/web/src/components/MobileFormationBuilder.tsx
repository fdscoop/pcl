'use client'

import { useState, useEffect, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  MobileStepWizard,
  MobileSelectionCard,
  MobileSectionHeader,
  MobileInfoBanner,
  MobileWizardStep
} from '@/components/ui/mobile-step-wizard'
import { TextInputDialog } from '@/components/ui/text-input-dialog'
import {
  Users,
  Calendar,
  MapPin,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Save,
  ArrowLeftRight,
  X,
  Plus,
  ArrowUpCircle,
  ArrowDownCircle,
  RefreshCw,
  Search
} from 'lucide-react'
import { format } from 'date-fns'
import { notifyLineupAnnounced } from '@/services/matchNotificationService'

// Types
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

interface Match {
  id: string
  match_format: string
  match_date: string
  match_time: string
  status: string
  home_team_id: string
  away_team_id: string
  home_team: { team_name: string }
  away_team: { team_name: string }
  stadium?: { stadium_name: string }
  home_club_name?: string
  away_club_name?: string
  home_club_logo?: string
  away_club_logo?: string
  has_lineup?: boolean
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

// Formation configurations (same as desktop)
const FORMATIONS: Record<string, Record<string, Formation>> = {
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
    }
  },
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
    }
  },
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
        { role: 'CM', x: 40, y: 45, count: 1 },
        { role: 'CM', x: 60, y: 45, count: 1 },
        { role: 'RM', x: 80, y: 45, count: 1 },
        { role: 'ST', x: 40, y: 18, count: 1 },
        { role: 'ST', x: 60, y: 18, count: 1 }
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
        { role: 'CM', x: 35, y: 48, count: 1 },
        { role: 'CM', x: 50, y: 42, count: 1 },
        { role: 'CM', x: 65, y: 48, count: 1 },
        { role: 'RM', x: 85, y: 45, count: 1 },
        { role: 'ST', x: 40, y: 18, count: 1 },
        { role: 'ST', x: 60, y: 18, count: 1 }
      ]
    }
  }
}

const SQUAD_REQUIREMENTS = {
  '5s': { playersOnField: 5, minSubs: 3, minPlayers: 8, recommended: 10 },
  '7s': { playersOnField: 7, minSubs: 4, minPlayers: 11, recommended: 14 },
  '11s': { playersOnField: 11, minSubs: 3, minPlayers: 14, recommended: 18 }
}

interface MobileFormationBuilderProps {
  players: Player[]
  matches: Match[]
  teamId?: string
  clubId: string
  onSaveLineup: (lineupName: string, data: {
    matchId?: string
    format: string
    formation: string
    assignments: Record<string, Player | null>
    selectedPlayers: Set<string>
    substitutePlayers: Player[]
  }) => Promise<void>
  onLoadLineup?: (matchId?: string, format?: string) => Promise<{
    assignments: Record<string, Player | null>
    selectedPlayers: Set<string>
    substitutePlayers: Player[]
    formation: string
  } | null>
}

export function MobileFormationBuilder({
  players,
  matches,
  teamId,
  clubId,
  onSaveLineup,
  onLoadLineup
}: MobileFormationBuilderProps) {
  // Wizard state
  const [currentStep, setCurrentStep] = useState(1)
  
  // Track if format has been declared/saved
  const [formatDeclared, setFormatDeclared] = useState(false)
  const [declaredFormat, setDeclaredFormat] = useState<string | null>(null)

  // Match selection
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null)
  const [showAllMatches, setShowAllMatches] = useState(false)

  // Format & formation
  const [selectedFormat, setSelectedFormat] = useState<'5s' | '7s' | '11s'>('5s')
  const [selectedFormation, setSelectedFormation] = useState('2-2')

  // Player management
  const [selectedPlayers, setSelectedPlayers] = useState<Set<string>>(new Set())
  const [assignments, setAssignments] = useState<Record<string, Player | null>>({})
  const [substitutePlayers, setSubstitutePlayers] = useState<Player[]>([])

  // UI state
  const [searchTerm, setSearchTerm] = useState('')
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [swapMode, setSwapMode] = useState(false)
  const [firstSwapPlayer, setFirstSwapPlayer] = useState<{
    player: Player
    source: 'field' | 'substitute' | 'available'
    positionKey?: string
  } | null>(null)

  // Derived state
  const totalPlayers = players.length
  const formation = FORMATIONS[selectedFormat]?.[selectedFormation]
  const requirements = SQUAD_REQUIREMENTS[selectedFormat]

  const assignedPlayerIds = useMemo(() => new Set(
    Object.values(assignments).filter((p): p is Player => p !== null).map(p => p.id)
  ), [assignments])

  // Available XI: Selected players not on field, capped at playersOnField
  const availableXIPlayers = players
    .filter(p => selectedPlayers.has(p.id) && !assignedPlayerIds.has(p.id))
    .slice(0, requirements.playersOnField)

  // Bench: All unselected players
  const benchPlayers = players.filter(p => {
    const inSelected = selectedPlayers.has(p.id)
    const inAssigned = assignedPlayerIds.has(p.id)
    const inSubstitutes = substitutePlayers.some(s => s.id === p.id)
    const inAvailableXI = availableXIPlayers.some(a => a.id === p.id)
    return !inSelected && !inAssigned && !inSubstitutes && !inAvailableXI
  })

  // Filtered bench for search
  const filteredBenchPlayers = benchPlayers.filter(p =>
    searchTerm === '' ||
    `${p.players?.users?.first_name} ${p.players?.users?.last_name}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  )

  // Update substitutes when selection changes
  useEffect(() => {
    // Calculate actual substitutes based on total squad composition
    const totalFieldPlayers = Object.values(assignments).filter(p => p !== null).length
    const totalSelectedPlayers = selectedPlayers.size
    
    // If we have more selected players than field positions, the excess should be substitutes
    const expectedSubstitutes = Math.max(0, totalSelectedPlayers - totalFieldPlayers)
    
    // Get the actual unassigned selected players
    const unassignedSelectedPlayers = players
      .filter(p => selectedPlayers.has(p.id) && !assignedPlayerIds.has(p.id))
    
    // Take players beyond the available XI as substitutes
    const availableForField = Math.min(
      unassignedSelectedPlayers.length, 
      requirements.playersOnField - totalFieldPlayers
    )
    const subs = unassignedSelectedPlayers.slice(availableForField)
    
    setSubstitutePlayers(subs)
  }, [players, selectedPlayers, assignments, requirements.playersOnField, assignedPlayerIds])

  // Load lineup when match or format changes
  useEffect(() => {
    if (onLoadLineup && teamId) {
      onLoadLineup(selectedMatch?.id, selectedFormat).then(data => {
        if (data) {
          setAssignments(data.assignments)
          setSelectedPlayers(data.selectedPlayers)
          setSubstitutePlayers(data.substitutePlayers)
          setSelectedFormation(data.formation)
        }
      })
    }
  }, [selectedMatch?.id, selectedFormat, teamId])

  // Set format from match when selected
  useEffect(() => {
    if (selectedMatch) {
      const formatMap: Record<string, '5s' | '7s' | '11s'> = {
        '5-a-side': '5s',
        '7-a-side': '7s',
        '11-a-side': '11s'
      }
      const matchFormat = formatMap[selectedMatch.match_format]
      if (matchFormat) {
        setSelectedFormat(matchFormat)
        const formationsForFormat = FORMATIONS[matchFormat]
        setSelectedFormation(Object.keys(formationsForFormat)[0])
      }
    }
  }, [selectedMatch])

  // Handlers
  const handleAddFromBench = (player: Player) => {
    const totalNeeded = requirements.playersOnField + requirements.minSubs
    if (selectedPlayers.size >= totalNeeded) return
    setSelectedPlayers(prev => new Set(prev).add(player.id))
  }

  const handleMoveToSubstitutes = (player: Player) => {
    // Don't remove from selectedPlayers - just remove from field assignments
    // The player should remain selected as a substitute
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

  const handleRemoveFromSquad = (player: Player) => {
    // Completely remove from squad (both selectedPlayers and assignments)
    setSelectedPlayers(prev => {
      const newSet = new Set(prev)
      newSet.delete(player.id)
      return newSet
    })
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

  const handleAssignToPosition = (positionKey: string, player: Player) => {
    const currentAssignedCount = Object.values(assignments).filter(p => p !== null).length
    if (!assignments[positionKey] && currentAssignedCount >= requirements.playersOnField) {
      return
    }
    
    // Add haptic feedback for mobile devices
    if ('vibrate' in navigator) {
      navigator.vibrate(50) // Short vibration
    }
    
    // Ensure the player is in selectedPlayers when assigned to a position
    setSelectedPlayers(prev => new Set(prev).add(player.id))
    
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
    // Note: Removed player automatically goes back to available players
    // The useEffect will handle substitutes automatically based on selectedPlayers
  }

  const handleAutoAssign = () => {
    const newAssignments: Record<string, Player | null> = {}
    const usedPlayers = new Set<string>()
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

  const handleClearFormation = () => {
    setAssignments({})
  }

  const handleSave = async (lineupName: string) => {
    try {
      await onSaveLineup(lineupName, {
        matchId: selectedMatch?.id,
        format: selectedFormat,
        formation: selectedFormation,
        assignments,
        selectedPlayers,
        substitutePlayers
      })
      // Mark format as declared after successful save
      setFormatDeclared(true)
      setDeclaredFormat(selectedFormat)
      setShowSaveDialog(false)
    } catch (error) {
      console.error('❌ Mobile save error:', error)
      setShowSaveDialog(false)
      // Error toast will be shown by the parent handler
    }
  }

  // Swap functionality
  const handleSwapClick = (player: Player, source: 'field' | 'substitute' | 'available', positionKey?: string) => {
    // Add haptic feedback
    if ('vibrate' in navigator) {
      navigator.vibrate(30)
    }
    
    if (!firstSwapPlayer) {
      setFirstSwapPlayer({ player, source, positionKey })
    } else {
      performSwap(firstSwapPlayer, { player, source, positionKey })
      setFirstSwapPlayer(null)
      setSwapMode(false)
      
      // Success haptic feedback
      if ('vibrate' in navigator) {
        navigator.vibrate([50, 50, 50]) // Triple vibration for success
      }
    }
  }

  const performSwap = (
    first: { player: Player; source: 'field' | 'substitute' | 'available'; positionKey?: string },
    second: { player: Player; source: 'field' | 'substitute' | 'available'; positionKey?: string }
  ) => {
    // Ensure both players are in selectedPlayers when involved in any swap
    setSelectedPlayers(prev => {
      const newSet = new Set(prev)
      newSet.add(first.player.id)
      newSet.add(second.player.id)
      return newSet
    })
    
    if (first.source === 'field' && second.source === 'field' && first.positionKey && second.positionKey) {
      setAssignments(prev => ({
        ...prev,
        [first.positionKey!]: second.player,
        [second.positionKey!]: first.player
      }))
    } else if (first.source === 'field' && second.positionKey === undefined && first.positionKey) {
      setAssignments(prev => ({
        ...prev,
        [first.positionKey!]: second.player
      }))
    } else if (second.source === 'field' && second.positionKey) {
      setAssignments(prev => ({
        ...prev,
        [second.positionKey!]: first.player
      }))
    }
  }

  // Step content components

  // Step 1: Select Match
  const Step1Content = () => (
    <div className="space-y-4">
      <MobileSectionHeader
        title="Choose Match or Template"
        icon="⚽"
        subtitle={`${matches.length} matches scheduled`}
      />

      {matches.length === 0 ? (
        <MobileInfoBanner
          variant="info"
          icon="📅"
          title="No Upcoming Matches"
          description="You don't have any scheduled matches yet. Create a match first to declare your lineup, or build a template lineup below."
        />
      ) : (
        <div className="space-y-3">
          {/* Option to skip match selection - Use native button for better mobile touch support */}
          <button
            type="button"
            onClick={() => {
              setSelectedMatch(null)
            }}
            className={`w-full p-4 rounded-xl border-2 text-left transition-all active:scale-[0.98] touch-manipulation ${
              selectedMatch === null && currentStep > 1
                ? 'border-blue-500 bg-blue-50 shadow-md'
                : 'border-gray-200 bg-white active:border-gray-300'
            }`}
          >
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center text-2xl bg-gray-100">
                📋
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`font-semibold ${selectedMatch === null && currentStep > 1 ? 'text-blue-900' : 'text-gray-900'}`}>
                    Template Lineup
                  </span>
                </div>
                <p className={`text-sm mt-0.5 ${selectedMatch === null && currentStep > 1 ? 'text-blue-700' : 'text-gray-500'}`}>
                  Create a reusable lineup without a specific match
                </p>
              </div>
              <div className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                selectedMatch === null && currentStep > 1
                  ? 'border-blue-500 bg-blue-500'
                  : 'border-gray-300 bg-white'
              }`}>
                {selectedMatch === null && currentStep > 1 && <CheckCircle2 className="h-4 w-4 text-white" />}
              </div>
            </div>
          </button>

          <div className="flex items-center gap-2 my-3">
            <div className="flex-1 h-px bg-gray-200"></div>
            <span className="text-sm text-gray-500 px-2">OR</span>
            <div className="flex-1 h-px bg-gray-200"></div>
          </div>

          {(showAllMatches ? matches : matches.slice(0, 3)).map((match) => (
            <MobileSelectionCard
              key={match.id}
              selected={selectedMatch?.id === match.id}
              onClick={() => setSelectedMatch(match)}
              icon={
                match.home_club_logo ? (
                  <img src={match.home_club_logo} alt="" className="w-10 h-10 rounded-full object-cover shadow-sm" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-blue-500 flex items-center justify-center text-white font-bold">
                    ⚽
                  </div>
                )
              }
              title={`${match.home_club_name || match.home_team?.team_name} vs ${match.away_club_name || match.away_team?.team_name}`}
              subtitle={`${format(new Date(match.match_date), 'MMM d, yyyy')} • ${match.match_time?.slice(0, 5)} • ${match.stadium?.stadium_name || 'TBD'}`}
              badge={match.match_format}
            >
              <div className="flex items-center justify-between mt-2">
                {match.has_lineup ? (
                  <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    Lineup Ready
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="bg-yellow-100 text-yellow-700">
                    Lineup Needed
                  </Badge>
                )}
                <span className="text-xs text-gray-500">
                  {Math.ceil((new Date(match.match_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days
                </span>
              </div>
            </MobileSelectionCard>
          ))}

          {matches.length > 3 && !showAllMatches && (
            <Button
              variant="outline"
              className="w-full rounded-xl border-dashed"
              onClick={() => setShowAllMatches(true)}
            >
              Show All Matches ({matches.length - 3} more)
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          )}
        </div>
      )}
    </div>
  )

  // Step 2: Select Format & Formation
  const Step2Content = () => (
    <div className="space-y-6">
      {/* Format Selection */}
      <div>
        <MobileSectionHeader
          title="Match Format"
          icon="🏟️"
          subtitle={selectedMatch ? `Locked to ${selectedMatch.match_format}` : 'Choose your format'}
        />

        <div className="space-y-3">
          {(['5s', '7s', '11s'] as const).map((fmt) => {
            const req = SQUAD_REQUIREMENTS[fmt]
            const isAvailable = totalPlayers >= req.minPlayers
            const matchFormatMap: Record<string, string> = {
              '5-a-side': '5s',
              '7-a-side': '7s',
              '11-a-side': '11s'
            }
            const isMatchFormat = selectedMatch ? matchFormatMap[selectedMatch.match_format] === fmt : true
            const isDisabled = !isAvailable || (selectedMatch ? !isMatchFormat : false)

            return (
              <MobileSelectionCard
                key={fmt}
                selected={selectedFormat === fmt}
                onClick={() => !isDisabled && setSelectedFormat(fmt)}
                disabled={isDisabled}
                icon={<span className="text-2xl">{fmt === '5s' ? '⚡' : fmt === '7s' ? '🎯' : '🏆'}</span>}
                title={fmt.replace('s', '-a-side')}
                subtitle={`${req.playersOnField} on field + ${req.minSubs} subs • Need ${req.minPlayers} players`}
                badge={totalPlayers >= req.minPlayers ? 'Available' : `Need ${req.minPlayers - totalPlayers} more`}
              />
            )
          })}
        </div>
      </div>

      {/* Formation Selection */}
      <div>
        <MobileSectionHeader
          title="Formation"
          icon="📐"
          subtitle="Tactical arrangement"
        />

        <div className="grid grid-cols-3 gap-2">
          {Object.entries(FORMATIONS[selectedFormat] || {}).map(([key, fmt]) => (
            <button
              key={key}
              type="button"
              onClick={() => setSelectedFormation(key)}
              className={`
                p-3 rounded-xl border-2 text-center transition-all
                ${selectedFormation === key
                  ? 'border-blue-500 bg-blue-50 shadow-md'
                  : 'border-gray-200 bg-white'
                }
              `}
            >
              <div className="font-bold text-lg">{fmt.name}</div>
              <div className="text-xs text-gray-500">{fmt.playersOnField} players</div>
            </button>
          ))}
        </div>
      </div>

      {/* Mini Pitch Preview */}
      <div className="bg-gradient-to-b from-green-500 to-green-600 rounded-xl p-4 relative overflow-hidden shadow-lg" style={{ aspectRatio: '2/1.5' }}>
        {/* Grass texture overlay */}
        <div 
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `
              repeating-linear-gradient(
                45deg,
                transparent,
                transparent 2px,
                rgba(255,255,255,0.1) 2px,
                rgba(255,255,255,0.1) 4px
              )
            `
          }}
        ></div>
        
        {/* Field markings */}
        <div className="absolute inset-2 border-2 border-white/70 rounded"></div>
        <div className="absolute left-2 right-2 top-1/2 h-0.5 bg-white/70"></div>
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 border-2 border-white/70 rounded-full"></div>
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-white/70 rounded-full"></div>

        {/* Goal areas */}
        <div className="absolute left-1/4 top-2 w-1/2 h-[15%] border-2 border-t-0 border-white/70"></div>
        <div className="absolute left-1/4 bottom-2 w-1/2 h-[15%] border-2 border-b-0 border-white/70"></div>

        {formation?.positions.map((pos, idx) => (
          <div
            key={idx}
            className="absolute w-5 h-5 bg-white rounded-full border-2 border-blue-500 flex items-center justify-center text-xs font-bold text-blue-700 shadow-md animate-pulse"
            style={{
              left: `${pos.x}%`,
              top: `${pos.y}%`,
              transform: 'translate(-50%, -50%)',
              animationDelay: `${idx * 0.1}s`
            }}
          >
            {pos.role.charAt(0)}
          </div>
        ))}
        
        {/* Formation label */}
        <div className="absolute bottom-2 left-2 bg-black/50 backdrop-blur-sm text-white px-2 py-1 rounded text-xs font-medium">
          {formation?.name} Formation
        </div>
      </div>
    </div>
  )

  // Step 3: Select Players
  const Step3Content = () => {
    const selectedCount = selectedPlayers.size
    const maxPlayers = requirements.playersOnField + requirements.minSubs

    return (
      <div className="space-y-4">
        <MobileSectionHeader
          title="Select Your Squad"
          icon="👥"
          subtitle={`${selectedCount}/${maxPlayers} players selected`}
        />

        {/* Progress */}
        <div className="bg-gray-100 rounded-full h-3 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500"
            style={{ width: `${Math.min((selectedCount / maxPlayers) * 100, 100)}%` }}
          />
        </div>

        {/* Squad Status */}
        <div className="flex items-center justify-between bg-blue-50 rounded-lg p-3">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            <span className="font-medium text-blue-900">Squad Status</span>
          </div>
          <div className="text-right">
            <p className="text-sm font-bold text-blue-900">{selectedCount} / {maxPlayers}</p>
            <p className="text-xs text-blue-600">
              {selectedCount >= requirements.minPlayers ? 
                `${Math.max(0, requirements.playersOnField + requirements.minSubs - selectedCount)} more for full squad` : 
                `Need ${requirements.minPlayers - selectedCount} more to start`}
            </p>
          </div>
        </div>

        {/* Squad Breakdown */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white border border-gray-200 rounded-lg p-3 text-center">
            <div className="text-lg font-bold text-gray-900">{Math.min(selectedCount, requirements.playersOnField)}</div>
            <div className="text-xs text-gray-500">Starters ({requirements.playersOnField} needed)</div>
            <div className="w-full bg-gray-100 rounded-full h-1.5 mt-1">
              <div 
                className="bg-blue-500 h-1.5 rounded-full transition-all" 
                style={{ width: `${Math.min((Math.min(selectedCount, requirements.playersOnField) / requirements.playersOnField) * 100, 100)}%` }}
              ></div>
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-3 text-center">
            <div className="text-lg font-bold text-gray-900">{Math.max(0, selectedCount - requirements.playersOnField)}</div>
            <div className="text-xs text-gray-500">Subs ({requirements.minSubs} needed)</div>
            <div className="w-full bg-gray-100 rounded-full h-1.5 mt-1">
              <div 
                className="bg-purple-500 h-1.5 rounded-full transition-all" 
                style={{ width: `${Math.min((Math.max(0, selectedCount - requirements.playersOnField) / requirements.minSubs) * 100, 100)}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Selected Players */}
        {selectedCount > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium text-gray-700">Selected Players ({selectedCount})</p>
              {selectedCount > 0 && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setSelectedPlayers(new Set())
                    setAssignments({})
                  }}
                  className="text-xs h-7 px-2"
                >
                  Clear All
                </Button>
              )}
            </div>
            <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
              {players.filter(p => selectedPlayers.has(p.id)).map(player => (
                <div
                  key={player.id}
                  className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-full px-3 py-2 transition-all hover:bg-blue-100"
                >
                  {player.players?.photo_url ? (
                    <img src={player.players.photo_url} alt="" className="w-7 h-7 rounded-full object-cover" />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs font-bold">
                      {player.players?.users?.first_name?.[0]}
                    </div>
                  )}
                  <span className="text-sm font-medium text-blue-900">
                    {player.players?.users?.first_name}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveFromSquad(player)}
                    className="text-blue-400 hover:text-red-500 p-1 rounded-full hover:bg-white/50 transition-all"
                    title="Remove from squad"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <Input
            placeholder="Search players..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 rounded-xl border-gray-300 focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        {/* Bench Players */}
        <div className="space-y-2 max-h-[50vh] overflow-y-auto">
          {filteredBenchPlayers.length === 0 ? (
            <MobileInfoBanner
              variant="info"
              icon="✓"
              title={selectedCount >= maxPlayers ? "Squad Complete!" : "No more players"}
              description={selectedCount >= maxPlayers
                ? "You've selected the maximum number of players for this format"
                : searchTerm ? "No players found matching your search" : "All available players have been selected"
              }
            />
          ) : (
            filteredBenchPlayers.map(player => (
              <button
                key={player.id}
                type="button"
                disabled={selectedCount >= maxPlayers}
                onClick={() => handleAddFromBench(player)}
                className={`
                  w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left touch-manipulation
                  ${selectedCount >= maxPlayers
                    ? 'border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed'
                    : 'border-gray-200 bg-white hover:bg-blue-50 hover:border-blue-300 active:bg-blue-100'
                  }
                `}
              >
                {player.players?.photo_url ? (
                  <img src={player.players.photo_url} alt="" className="w-12 h-12 rounded-full object-cover shadow-sm" />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 text-white flex items-center justify-center font-bold shadow-sm">
                    {player.players?.users?.first_name?.[0]}{player.players?.users?.last_name?.[0]}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 truncate">
                    {player.players?.users?.first_name} {player.players?.users?.last_name}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="secondary" className="text-xs">
                      {player.players?.position === 'Goalkeeper' ? 'GK' :
                        player.players?.position === 'Defender' ? 'DEF' :
                          player.players?.position === 'Midfielder' ? 'MID' : 'FWD'}
                    </Badge>
                    <span className="text-xs text-gray-500 font-medium">#{player.jersey_number}</span>
                  </div>
                </div>
                <div className={`
                  w-8 h-8 rounded-full flex items-center justify-center transition-all
                  ${selectedCount >= maxPlayers ? 'bg-gray-200' : 'bg-blue-500 hover:bg-blue-600'}
                `}>
                  <Plus className={`h-5 w-5 ${selectedCount >= maxPlayers ? 'text-gray-400' : 'text-white'}`} />
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    )
  }

  // Step 4: Formation & Pitch View
  const Step4Content = () => {
    const assignedCount = Object.values(assignments).filter(p => p !== null).length
    const fieldPositions = formation?.positions || []

    return (
      <div className="space-y-4">
        <MobileSectionHeader
          title="Set Your Formation"
          icon="⚽"
          subtitle={`${assignedCount}/${requirements.playersOnField} positions filled`}
        />

        {/* Progress Bar */}
        <div className="bg-gray-100 rounded-full h-2 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-green-500 to-emerald-500 transition-all duration-500"
            style={{ width: `${Math.min((assignedCount / requirements.playersOnField) * 100, 100)}%` }}
          />
        </div>

        {/* Quick Actions */}
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={handleAutoAssign}
            className="flex-1 h-10"
            disabled={availableXIPlayers.length === 0}
          >
            <RefreshCw className="w-4 h-4 mr-1" />
            Auto-Fill
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleClearFormation}
            className="flex-1 h-10"
            disabled={assignedCount === 0}
          >
            <X className="w-4 h-4 mr-1" />
            Clear
          </Button>
          <Button
            size="sm"
            variant={swapMode ? 'default' : 'outline'}
            onClick={() => {
              setSwapMode(!swapMode)
              setFirstSwapPlayer(null)
            }}
            className={`h-10 ${swapMode ? 'bg-purple-600 hover:bg-purple-700' : ''}`}
            disabled={assignedCount < 2}
          >
            <ArrowLeftRight className="w-4 h-4" />
          </Button>
        </div>

        {/* Swap Mode Indicator */}
        {swapMode && (
          <MobileInfoBanner
            variant="info"
            icon="🔄"
            title={firstSwapPlayer
              ? `Selected: ${firstSwapPlayer.player.players.users.first_name}. Tap another player to swap.`
              : "Swap Mode: Tap two players to swap their positions"
            }
          />
        )}

        {/* Instructions for mobile users */}
        {availableXIPlayers.length > 0 && Object.values(assignments).filter(p => p !== null).length < requirements.playersOnField && (
          <MobileInfoBanner
            variant="info"
            icon="💡"
            title="Quick Assignment"
            description="Tap available players below to automatically assign them to empty positions, or tap empty positions to assign the first available player."
          />
        )}

        {/* Football Pitch */}
        <div
          className="relative w-full bg-green-600 rounded-xl overflow-hidden shadow-lg touch-manipulation"
          style={{
            aspectRatio: '2/3',
            background: `
              linear-gradient(45deg, #16a34a 25%, transparent 25%),
              linear-gradient(-45deg, #16a34a 25%, transparent 25%),
              linear-gradient(45deg, transparent 75%, #16a34a 75%),
              linear-gradient(-45deg, transparent 75%, #16a34a 75%),
              linear-gradient(to bottom, #15803d, #16a34a)
            `,
            backgroundSize: '8px 8px, 8px 8px, 8px 8px, 8px 8px, 100% 100%'
          }}
        >
          {/* Field markings */}
          <div className="absolute inset-2 border-2 border-white/70 rounded-lg"></div>
          <div className="absolute left-2 right-2 top-1/2 h-0.5 bg-white/70"></div>
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 border-2 border-white/70 rounded-full"></div>
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-white/70 rounded-full"></div>

          {/* Goal areas */}
          <div className="absolute left-1/4 top-2 w-1/2 h-[15%] border-2 border-t-0 border-white/70 rounded-b-lg"></div>
          <div className="absolute left-1/4 bottom-2 w-1/2 h-[15%] border-2 border-b-0 border-white/70 rounded-t-lg"></div>
          
          {/* Goal boxes */}
          <div className="absolute left-[37.5%] top-2 w-1/4 h-[8%] border-2 border-t-0 border-white/70 rounded-b"></div>
          <div className="absolute left-[37.5%] bottom-2 w-1/4 h-[8%] border-2 border-b-0 border-white/70 rounded-t"></div>

          {/* Player positions */}
          {fieldPositions.map((pos, idx) => {
            const posKey = `${pos.role}-${pos.x}-${pos.y}`
            const assignedPlayer = assignments[posKey]
            const isSwapTarget = swapMode && firstSwapPlayer?.positionKey === posKey

            return (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  if (swapMode && assignedPlayer) {
                    handleSwapClick(assignedPlayer, 'field', posKey)
                  } else if (!assignedPlayer && availableXIPlayers.length > 0) {
                    // Assign first available player
                    handleAssignToPosition(posKey, availableXIPlayers[0])
                  }
                }}
                className={`
                  absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-200
                  ${assignedPlayer ? 'w-14 h-14' : 'w-10 h-10'}
                  ${isSwapTarget ? 'ring-4 ring-orange-400 scale-110' : ''}
                  ${!assignedPlayer && availableXIPlayers.length > 0 ? 'animate-pulse' : ''}
                  touch-manipulation
                `}
                style={{
                  left: `${pos.x}%`,
                  top: `${pos.y}%`
                }}
              >
                {assignedPlayer ? (
                  <div className="relative w-full h-full">
                    {assignedPlayer.players?.photo_url ? (
                      <img
                        src={assignedPlayer.players.photo_url}
                        alt=""
                        className="w-full h-full rounded-full object-cover border-3 border-white shadow-lg"
                      />
                    ) : (
                      <div className="w-full h-full rounded-full bg-gradient-to-br from-blue-500 to-purple-500 text-white flex items-center justify-center font-bold text-sm border-3 border-white shadow-lg">
                        {assignedPlayer.players?.users?.first_name?.[0]}
                        {assignedPlayer.players?.users?.last_name?.[0]}
                      </div>
                    )}
                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-yellow-400 text-black text-xs font-bold px-1.5 py-0.5 rounded-full shadow min-w-[20px] text-center">
                      {assignedPlayer.jersey_number}
                    </div>
                    {!swapMode && (
                      <div
                        onClick={(e) => {
                          e.stopPropagation()
                          handleRemoveFromPosition(posKey)
                        }}
                        className="absolute -top-1 -right-1 bg-red-500 hover:bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center shadow-lg transition-colors touch-manipulation cursor-pointer"
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault()
                            e.stopPropagation()
                            handleRemoveFromPosition(posKey)
                          }
                        }}
                      >
                        <X className="w-3 h-3" />
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="w-full h-full rounded-full border-2 border-dashed border-white/80 flex items-center justify-center bg-white/20 backdrop-blur-sm">
                    <span className="text-white/90 text-xs font-bold">{pos.role}</span>
                  </div>
                )}
              </button>
            )
          })}
        </div>

        {/* Available Players (for quick assignment) */}
        {availableXIPlayers.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-500">Available to Place ({availableXIPlayers.length})</p>
              <p className="text-xs text-gray-400">Tap player to assign to position</p>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {availableXIPlayers.map(player => {
                const canAssign = Object.values(assignments).filter(p => p !== null).length < requirements.playersOnField
                
                return (
                  <button
                    key={player.id}
                    type="button"
                    onClick={() => {
                      if (swapMode) {
                        handleSwapClick(player, 'available')
                      } else if (canAssign) {
                        // Find first empty position and assign
                        const emptyPosition = formation.positions.find(pos => {
                          const posKey = `${pos.role}-${pos.x}-${pos.y}`
                          return !assignments[posKey]
                        })
                        if (emptyPosition) {
                          const posKey = `${emptyPosition.role}-${emptyPosition.x}-${emptyPosition.y}`
                          handleAssignToPosition(posKey, player)
                        }
                      }
                    }}
                    disabled={!canAssign && !swapMode}
                    className={`
                      flex-shrink-0 flex flex-col items-center p-2 rounded-xl border-2 transition-all touch-manipulation
                      ${swapMode && firstSwapPlayer?.player.id === player.id
                        ? 'border-orange-500 bg-orange-50 scale-105'
                        : canAssign || swapMode
                          ? 'border-blue-300 bg-blue-50 hover:bg-blue-100 hover:border-blue-400'
                          : 'border-gray-200 bg-gray-50 opacity-50'
                      }
                    `}
                  >
                    {player.players?.photo_url ? (
                      <img src={player.players.photo_url} alt="" className="w-12 h-12 rounded-full object-cover shadow-sm" />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 text-white flex items-center justify-center font-bold text-sm shadow-sm">
                        {player.players?.users?.first_name?.[0]}
                        {player.players?.users?.last_name?.[0]}
                      </div>
                    )}
                    <span className="text-xs font-medium mt-1 truncate max-w-[60px] text-center">
                      {player.players?.users?.first_name}
                    </span>
                    <span className="text-xs text-gray-400">#{player.jersey_number}</span>
                    {canAssign && !swapMode && (
                      <div className="absolute -top-1 -right-1 bg-blue-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-xs">
                        +
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Substitutes */}
        {substitutePlayers.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-500">Substitutes ({substitutePlayers.length})</p>
              <p className="text-xs text-gray-400">Ready for swaps</p>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {substitutePlayers.map((player, idx) => (
                <button
                  key={player.id}
                  type="button"
                  onClick={() => swapMode && handleSwapClick(player, 'substitute')}
                  className={`
                    flex-shrink-0 flex flex-col items-center p-2 rounded-xl border-2 transition-all touch-manipulation
                    ${swapMode && firstSwapPlayer?.player.id === player.id
                      ? 'border-orange-500 bg-orange-50 scale-105'
                      : 'border-gray-200 bg-gray-50 hover:bg-gray-100'
                    }
                  `}
                >
                  <div className="relative">
                    {player.players?.photo_url ? (
                      <img src={player.players.photo_url} alt="" className="w-12 h-12 rounded-full object-cover opacity-90 shadow-sm" />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gray-400 text-white flex items-center justify-center font-bold text-sm shadow-sm">
                        {player.players?.users?.first_name?.[0]}
                        {player.players?.users?.last_name?.[0]}
                      </div>
                    )}
                    <div className="absolute -top-1 -right-1 bg-amber-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold shadow">
                      {idx + 1}
                    </div>
                  </div>
                  <span className="text-xs font-medium mt-1 truncate max-w-[60px] text-center text-gray-600">
                    {player.players?.users?.first_name}
                  </span>
                  <span className="text-xs text-gray-400">#{player.jersey_number}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  // Step 5: Review & Save
  const Step5Content = () => {
    const assignedCount = Object.values(assignments).filter(p => p !== null).length
    const starters = Object.entries(assignments)
      .filter(([_, player]) => player !== null)
      .map(([posKey, player]) => ({ posKey, player: player! }))

    return (
      <div className="space-y-4">
        <MobileSectionHeader
          title="Review & Save"
          icon="📋"
          subtitle="Confirm your lineup"
        />

        {/* Summary Card */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-gray-500">Match</span>
              <p className="font-semibold">{selectedMatch ? `vs ${selectedMatch.away_club_name || selectedMatch.away_team?.team_name}` : 'Template'}</p>
            </div>
            <div>
              <span className="text-gray-500">Format</span>
              <p className="font-semibold">{selectedFormat.replace('s', '-a-side')}</p>
            </div>
            <div>
              <span className="text-gray-500">Formation</span>
              <p className="font-semibold">{formation?.name}</p>
            </div>
            <div>
              <span className="text-gray-500">Squad</span>
              <p className="font-semibold">{assignedCount} starters, {substitutePlayers.length} subs</p>
            </div>
          </div>
        </div>

        {/* Starters */}
        <div>
          <p className="text-sm font-semibold text-gray-700 mb-2">Starting XI ({assignedCount})</p>
          <div className="grid grid-cols-2 gap-2">
            {starters.map(({ posKey, player }) => {
              const role = posKey.split('-')[0]
              return (
                <div key={posKey} className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg p-2">
                  {player.players?.photo_url ? (
                    <img src={player.players.photo_url} alt="" className="w-8 h-8 rounded-full object-cover" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs font-bold">
                      {player.players?.users?.first_name?.[0]}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{player.players?.users?.first_name}</p>
                    <p className="text-xs text-gray-500">{role} • #{player.jersey_number}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Substitutes */}
        {substitutePlayers.length > 0 && (
          <div>
            <p className="text-sm font-semibold text-gray-700 mb-2">Substitutes ({substitutePlayers.length})</p>
            <div className="grid grid-cols-2 gap-2">
              {substitutePlayers.map((player, idx) => (
                <div key={player.id} className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg p-2">
                  {player.players?.photo_url ? (
                    <img src={player.players.photo_url} alt="" className="w-8 h-8 rounded-full object-cover opacity-80" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gray-400 text-white flex items-center justify-center text-xs font-bold">
                      {player.players?.users?.first_name?.[0]}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{player.players?.users?.first_name}</p>
                    <p className="text-xs text-gray-500">Sub #{idx + 1}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Validation Warnings */}
        {assignedCount < requirements.playersOnField && (
          <MobileInfoBanner
            variant="warning"
            icon="⚠️"
            title="Incomplete Lineup"
            description={`You need ${requirements.playersOnField - assignedCount} more players on the field`}
          />
        )}

        {/* Substitute Players Validation */}
        {substitutePlayers.length < requirements.minSubs && (
          <MobileInfoBanner
            variant="warning"
            icon="🔄"
            title="Insufficient Substitutes"
            description={`You need ${requirements.minSubs - substitutePlayers.length} more substitute players (${substitutePlayers.length}/${requirements.minSubs})`}
          />
        )}

        {/* Complete Lineup Success */}
        {assignedCount >= requirements.playersOnField && substitutePlayers.length >= requirements.minSubs && (
          <MobileInfoBanner
            variant="success"
            icon="✅"
            title="Lineup Complete!"
            description={`You have ${assignedCount} starters and ${substitutePlayers.length} substitutes ready for the match`}
          />
        )}
      </div>
    )
  }

  // Build steps array
  const steps: MobileWizardStep[] = [
    {
      id: 1,
      title: 'Select Match',
      shortTitle: 'Match',
      icon: '📅',
      content: <Step1Content />,
      isValid: true // Always valid, can skip match selection
    },
    {
      id: 2,
      title: 'Format & Formation',
      shortTitle: 'Format',
      icon: '📐',
      content: <Step2Content />,
      isValid: !!selectedFormat && !!selectedFormation
    },
    {
      id: 3,
      title: 'Select Players',
      shortTitle: 'Squad',
      icon: '👥',
      content: <Step3Content />,
      isValid: selectedPlayers.size >= requirements.playersOnField + requirements.minSubs
    },
    {
      id: 4,
      title: 'Set Formation',
      shortTitle: 'Pitch',
      icon: '⚽',
      content: <Step4Content />,
      isValid: Object.values(assignments).filter(p => p !== null).length >= requirements.playersOnField
    },
    {
      id: 5,
      title: 'Review & Save',
      shortTitle: 'Save',
      icon: '💾',
      content: <Step5Content />,
      isValid: Object.values(assignments).filter(p => p !== null).length >= requirements.playersOnField && substitutePlayers.length >= requirements.minSubs
    }
  ]

  // Final step save button
  const finalStepButton = (
    <div className="space-y-3">
      {/* Validation Status */}
      {(Object.values(assignments).filter(p => p !== null).length < requirements.playersOnField || substitutePlayers.length < requirements.minSubs) ? (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium text-amber-800">Lineup Requirements</span>
          </div>
          <div className="space-y-1 text-xs text-amber-700">
            {Object.values(assignments).filter(p => p !== null).length < requirements.playersOnField && (
              <div>• Need {requirements.playersOnField - Object.values(assignments).filter(p => p !== null).length} more starting players</div>
            )}
            {substitutePlayers.length < requirements.minSubs && (
              <div>• Need {requirements.minSubs - substitutePlayers.length} more substitute players</div>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
            <span className="text-sm font-medium text-green-800">
              Lineup is complete! {Object.values(assignments).filter(p => p !== null).length} starters + {substitutePlayers.length} subs
            </span>
          </div>
        </div>
      )}

      <Button
        type="button"
        onClick={() => setShowSaveDialog(true)}
        disabled={Object.values(assignments).filter(p => p !== null).length < requirements.playersOnField || substitutePlayers.length < requirements.minSubs || formatDeclared}
        className="w-full py-5 text-lg font-bold rounded-2xl bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg hover:from-green-600 hover:to-emerald-700 disabled:from-gray-300 disabled:to-gray-400 transition-all duration-200"
      >
        {formatDeclared ? (
          <>
            <CheckCircle2 className="h-5 w-5 mr-2" />
            Format Locked
          </>
        ) : (
          <>
            <Save className="h-5 w-5 mr-2" />
            Save Lineup
          </>
        )}
      </Button>
    </div>
  )

  return (
    <>
      <MobileStepWizard
        steps={steps}
        currentStep={currentStep}
        onNextStep={() => setCurrentStep(Math.min(currentStep + 1, 5))}
        onPreviousStep={() => setCurrentStep(Math.max(currentStep - 1, 1))}
        onStepClick={(step) => {
          if (step <= currentStep || steps[step - 1].isValid) {
            setCurrentStep(step)
          }
        }}
        isFinalStep={currentStep === 5}
        finalStepButton={finalStepButton}
        title="Formation Builder"
        subtitle="Create your tactical lineup"
        useDynamicTitle={true}
        hideNavbar={true}
        onClose={() => window.history.back()}
      />

      <TextInputDialog
        isOpen={showSaveDialog}
        onCancel={() => setShowSaveDialog(false)}
        onConfirm={handleSave}
        title="Save Lineup"
        message="Enter a name for this lineup"
        placeholder="e.g., Main XI, Attack Formation"
      />
    </>
  )
}

export default MobileFormationBuilder
