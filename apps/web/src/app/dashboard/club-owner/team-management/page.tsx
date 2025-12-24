'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { FormationBuilder } from '@/components/FormationBuilder'
import { NotificationCenter } from '@/components/NotificationCenter'
import { useClubNotifications } from '@/hooks/useClubNotifications'

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

export default function TeamManagementPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [club, setClub] = useState<any>(null)
  const [players, setPlayers] = useState<Player[]>([])
  const [selectedPosition, setSelectedPosition] = useState<string>('all')
  const [viewMode, setViewMode] = useState<'list' | 'formation'>('list')
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

      // Fetch active contracts with player details
      const { data: contractsData, error: contractsError } = await supabase
        .from('contracts')
        .select('id, jersey_number, position_assigned, player_id')
        .eq('club_id', clubData.id)
        .eq('status', 'active')
        .order('jersey_number', { ascending: true })

      if (contractsError) {
        console.error('Error loading contracts:', contractsError)
      } else if (contractsData && contractsData.length > 0) {
        // Fetch player details
        const playerIds = contractsData.map(c => c.player_id)
        const { data: playersData, error: playersError } = await supabase
          .from('players')
          .select('id, position, photo_url, unique_player_id, user_id')
          .in('id', playerIds)

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
            const mergedData = contractsData.map(contract => ({
              ...contract,
              players: playersMap.get(contract.player_id)
            }))

            setPlayers(mergedData as Player[])
          }
        }
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
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
              <Button onClick={() => router.push('/dashboard/club-owner')} variant="outline" size="sm">
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
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">
                Team Management
              </h1>
              <p className="text-muted-foreground">
                Manage your squad and organize your team formation
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                onClick={() => setViewMode('list')}
              >
                📋 Roster List
              </Button>
              <Button
                variant={viewMode === 'formation' ? 'default' : 'outline'}
                onClick={() => setViewMode('formation')}
                disabled={players.length === 0}
              >
                ⚽ Formation
              </Button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Players</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{players.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Goalkeepers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">
                {players.filter(p => p.players?.position === 'Goalkeeper').length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Defenders</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">
                {players.filter(p => p.players?.position === 'Defender').length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Midfielders</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">
                {players.filter(p => p.players?.position === 'Midfielder').length}
              </div>
            </CardContent>
          </Card>
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
                    onClick={() => setSelectedPosition(position)}
                  >
                    {position === 'all' ? 'All Players' : position}
                    {position !== 'all' && (
                      <Badge variant="secondary" className="ml-2">
                        {players.filter(p => p.players?.position === position).length}
                      </Badge>
                    )}
                  </Button>
                ))}
              </div>
            )}

            {/* Player List */}
            <Card>
              <CardHeader>
                <CardTitle>
                  {selectedPosition === 'all' ? 'All Players' : selectedPosition + 's'}
                </CardTitle>
                <CardDescription>
                  {filteredPlayers.length} {filteredPlayers.length === 1 ? 'player' : 'players'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {filteredPlayers.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
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
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredPlayers.map((player) => (
                      <Card key={player.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                        <div className="relative">
                          {player.players?.photo_url ? (
                            <img
                              src={player.players.photo_url}
                              alt={`${player.players.users?.first_name} ${player.players.users?.last_name}`}
                              className="w-full h-48 object-cover"
                            />
                          ) : (
                            <div className="w-full h-48 bg-gradient-to-br from-accent/20 to-accent/40 flex items-center justify-center">
                              <span className="text-6xl">⚽</span>
                            </div>
                          )}
                          <div className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full w-12 h-12 flex items-center justify-center font-bold text-lg shadow-lg">
                            #{player.jersey_number || '?'}
                          </div>
                        </div>
                        <CardContent className="p-4">
                          <h3 className="font-bold text-lg text-foreground mb-1">
                            {player.players?.users?.first_name} {player.players?.users?.last_name}
                          </h3>
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary">{player.players?.position}</Badge>
                              {player.position_assigned && player.position_assigned !== player.players?.position && (
                                <Badge variant="outline">{player.position_assigned}</Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              ID: {player.players?.unique_player_id}
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        ) : (
          <FormationBuilder players={players} clubId={club?.id} />
        )}
      </main>
    </div>
  )
}
