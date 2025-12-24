'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { X, ArrowUpCircle, ArrowDownCircle, Trash2 } from 'lucide-react'

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
}

// Formation configurations for different formats
const FORMATIONS = {
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
    }
  }
}

// Squad requirements (players on field + minimum substitutes)
const SQUAD_REQUIREMENTS = {
  '5s': { minPlayers: 8, playersOnField: 5, minSubs: 3, recommended: 8 },
  '7s': { minPlayers: 11, playersOnField: 7, minSubs: 4, recommended: 11 },
  '11s': { minPlayers: 14, playersOnField: 11, minSubs: 3, recommended: 18 }
}

export function FormationBuilder({ players, clubId }: FormationBuilderProps) {
  const totalPlayers = players.length

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

  const currentFormations = FORMATIONS[selectedFormat as keyof typeof FORMATIONS] || FORMATIONS['5s']
  const formation = currentFormations[selectedFormation as keyof typeof currentFormations]
  const requirements = SQUAD_REQUIREMENTS[selectedFormat as keyof typeof SQUAD_REQUIREMENTS]

  // Three tiers of players
  const assignedPlayerIds = new Set(
    Object.values(assignments)
      .filter((p): p is Player => p !== null)
      .map(p => p.id)
  )

  // Bench: All players not selected
  const benchPlayers = players.filter(p => !selectedPlayers.has(p.id))

  // Available for XI: Selected but not assigned to formation (max = playersOnField)
  const availableXIPlayers = players
    .filter(p => selectedPlayers.has(p.id) && !assignedPlayerIds.has(p.id))
    .slice(0, requirements.playersOnField)

  // Substitutes: Selected but exceed playersOnField limit
  const substitutePlayers = players
    .filter(p => selectedPlayers.has(p.id) && !assignedPlayerIds.has(p.id))
    .slice(requirements.playersOnField)

  const getPlayerByPosition = (role: string): Player | null => {
    return assignments[role] || null
  }

  const handleAssignPlayer = (positionKey: string, player: Player) => {
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
    setSelectedPlayers(prev => new Set(prev).add(player.id))
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
    setSelectedFormation(Object.keys(formationsForFormat)[0])
    // Don't clear formation - keep assignments
  }

  const PlayerCard = ({ player, variant, onAction, actionIcon, actionLabel }: {
    player: Player
    variant: 'bench' | 'available' | 'substitute'
    onAction: () => void
    actionIcon: React.ReactNode
    actionLabel: string
  }) => (
    <div className="flex items-center gap-3 p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors group">
      {player.players?.photo_url ? (
        <img
          src={player.players.photo_url}
          alt={`${player.players.users?.first_name}`}
          className="w-12 h-12 rounded-full object-cover border-2 border-border"
        />
      ) : (
        <div className="w-12 h-12 rounded-full bg-accent flex items-center justify-center text-accent-foreground font-bold">
          {player.players?.users?.first_name?.[0]}
          {player.players?.users?.last_name?.[0]}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm truncate">
          {player.players?.users?.first_name} {player.players?.users?.last_name}
        </p>
        <div className="flex items-center gap-2 mt-1">
          <Badge variant="secondary" className="text-xs">
            {player.players?.position}
          </Badge>
          <span className="text-xs text-muted-foreground font-bold">
            #{player.jersey_number}
          </span>
        </div>
      </div>
      <Button
        size="sm"
        variant={variant === 'bench' ? 'default' : 'outline'}
        className="opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={onAction}
      >
        {actionIcon}
        <span className="ml-1 text-xs">{actionLabel}</span>
      </Button>
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Format & Squad Requirements */}
      <Card className="border-2 border-accent/30">
        <CardHeader>
          <CardTitle>Team Format Selection</CardTitle>
          <CardDescription>
            Choose the format based on your squad size ({totalPlayers} players available)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {(['5s', '7s', '11s'] as const).map((format) => {
              const req = SQUAD_REQUIREMENTS[format]
              const isAvailable = totalPlayers >= req.minPlayers
              const isRecommended = totalPlayers >= req.recommended

              return (
                <Card
                  key={format}
                  className={`cursor-pointer transition-all ${
                    selectedFormat === format
                      ? 'border-2 border-primary shadow-lg bg-primary/5'
                      : isAvailable
                      ? 'border-2 border-border hover:border-accent/50'
                      : 'border-2 border-dashed border-muted opacity-60 cursor-not-allowed'
                  }`}
                  onClick={() => isAvailable && handleFormatChange(format)}
                >
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <h3 className="text-2xl font-bold mb-2">
                        {format === '5s' && '⚡'} {format === '7s' && '🎯'} {format === '11s' && '🏆'}
                      </h3>
                      <h4 className="text-lg font-bold mb-2">{format.replace('s', '-a-side')}</h4>
                      <div className="space-y-1 text-sm">
                        <p className="text-muted-foreground">
                          On field: <span className="font-bold text-foreground">{req.playersOnField}</span>
                        </p>
                        <p className="text-muted-foreground">
                          Min subs: <span className="font-bold text-foreground">{req.minSubs}</span>
                        </p>
                        <p className="text-muted-foreground">
                          Total needed: <span className="font-bold text-foreground">{req.minPlayers}</span>
                        </p>
                      </div>
                      <div className="mt-3">
                        {!isAvailable && (
                          <Badge variant="destructive">
                            Need {req.minPlayers - totalPlayers} more
                          </Badge>
                        )}
                        {isAvailable && !isRecommended && (
                          <Badge variant="secondary">
                            Available (Limited)
                          </Badge>
                        )}
                        {isRecommended && (
                          <Badge className="bg-green-500">
                            ✓ Full Squad
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {availableFormats.length === 0 && (
            <Alert variant="destructive">
              <AlertDescription>
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
          <Card>
            <CardHeader>
              <CardTitle>Select Formation - {selectedFormat.replace('s', '-a-side')}</CardTitle>
              <CardDescription>Choose a tactical formation for {selectedFormat} format</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-3 flex-wrap mb-4">
                {Object.entries(currentFormations).map(([key, formationData]) => (
                  <Button
                    key={key}
                    variant={selectedFormation === key ? 'default' : 'outline'}
                    onClick={() => setSelectedFormation(key)}
                  >
                    {formationData.name}
                  </Button>
                ))}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={autoAssign}>
                  🤖 Auto-Assign Players
                </Button>
                <Button variant="outline" onClick={clearFormation}>
                  🗑️ Clear Formation
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Formation Pitch */}
            <div className="lg:col-span-2">
              <Card className="overflow-hidden shadow-2xl">
                <CardHeader className="bg-gradient-to-r from-green-700 to-green-600 text-white">
                  <CardTitle>Formation: {formation.name}</CardTitle>
                  <CardDescription className="text-green-100">
                    {selectedFormat.replace('s', '-a-side')} - {formation.playersOnField} players on field
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0 bg-green-600">
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
                            <div className="relative cursor-pointer">
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
                              <button
                                onClick={() => handleRemoveFromPosition(key)}
                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg hover:bg-red-600"
                              >
                                <X className="w-4 h-4" />
                              </button>
                              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 bg-black/90 text-white text-xs px-3 py-1.5 rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity shadow-xl z-20">
                                <div className="font-bold">
                                  {assignedPlayer.players?.users?.first_name} {assignedPlayer.players?.users?.last_name}
                                </div>
                                <div className="text-gray-300 text-[10px]">{pos.role}</div>
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
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Available for XI</span>
                    <Badge variant="secondary">{availableXIPlayers.length}/{requirements.playersOnField}</Badge>
                  </CardTitle>
                  <CardDescription>
                    Click position to assign first available
                  </CardDescription>
                </CardHeader>
                <CardContent>
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
                          onAction={() => handleMoveToBench(player)}
                          actionIcon={<Trash2 className="w-3 h-3" />}
                          actionLabel="Remove"
                        />
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Substitutes */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Substitutes</span>
                    <Badge variant="outline">{substitutePlayers.length}</Badge>
                  </CardTitle>
                  <CardDescription>
                    Extra players selected
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-[200px] overflow-y-auto">
                    {substitutePlayers.map((player) => (
                      <PlayerCard
                        key={player.id}
                        player={player}
                        variant="substitute"
                        onAction={() => handleMoveToBench(player)}
                        actionIcon={<ArrowDownCircle className="w-3 h-3" />}
                        actionLabel="Bench"
                      />
                    ))}
                    {substitutePlayers.length === 0 && (
                      <div className="text-center py-3 text-muted-foreground text-xs">
                        No extra subs
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Bench */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Bench</span>
                    <Badge>{benchPlayers.length}</Badge>
                  </CardTitle>
                  <CardDescription>
                    All unselected players
                  </CardDescription>
                </CardHeader>
                <CardContent>
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
    </div>
  )
}
