'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import Link from 'next/link'

export default function PlayersPage() {
  const [players, setPlayers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [displayedPlayers, setDisplayedPlayers] = useState<any[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const playersPerPage = 12

  // Filters
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedNationality, setSelectedNationality] = useState<string>('all')
  const [selectedState, setSelectedState] = useState<string>('all')
  const [selectedPosition, setSelectedPosition] = useState<string>('all')

  // Available filter options
  const [nationalities, setNationalities] = useState<string[]>([])
  const [states, setStates] = useState<string[]>([])
  const [positions, setPositions] = useState<string[]>([])

  useEffect(() => {
    fetchPlayers()
  }, [])

  const fetchPlayers = async () => {
    try {
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        console.warn('Supabase not configured - showing demo data')
        setLoading(false)
        return
      }

      const { createClient } = await import('@/lib/supabase/client')
      const client = createClient()

      const { data: playersData, error } = await client
        .from('players')
        .select(`
          id,
          user_id,
          unique_player_id,
          position,
          jersey_number,
          nationality,
          state,
          district,
          photo_url,
          total_matches_played,
          total_goals_scored,
          total_assists,
          users (
            first_name,
            last_name
          )
        `)
        .order('total_matches_played', { ascending: false })

      if (error) {
        console.error('Error fetching players:', error)
      } else if (playersData) {
        setPlayers(playersData)
        
        // Extract unique filter options
        const uniqueNationalities = [...new Set(playersData.map((p: any) => p.nationality).filter(Boolean))] as string[]
        const uniqueStates = [...new Set(playersData.map((p: any) => p.state).filter(Boolean))] as string[]
        const uniquePositions = [...new Set(playersData.map((p: any) => p.position).filter(Boolean))] as string[]
        
        setNationalities(uniqueNationalities.sort())
        setStates(uniqueStates.sort())
        setPositions(uniquePositions.sort())
      }
    } catch (error) {
      console.error('Error fetching players:', error)
    } finally {
      setLoading(false)
    }
  }

  // Filter and search players
  const filteredPlayers = players.filter((player: any) => {
    const matchesSearch = !searchTerm || 
      player.users?.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      player.users?.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      player.unique_player_id?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesNationality = selectedNationality === 'all' || player.nationality === selectedNationality
    const matchesState = selectedState === 'all' || player.state === selectedState
    const matchesPosition = selectedPosition === 'all' || player.position === selectedPosition
    
    return matchesSearch && matchesNationality && matchesState && matchesPosition
  })

  // Pagination
  const totalPages = Math.ceil(filteredPlayers.length / playersPerPage)
  const startIndex = (currentPage - 1) * playersPerPage
  const paginatedPlayers = filteredPlayers.slice(startIndex, startIndex + playersPerPage)

  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, selectedNationality, selectedState, selectedPosition])

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <h1 className="text-4xl font-bold mb-4">All Players</h1>
          <p className="text-xl opacity-90">
            Discover talented players from around the world
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Demo Data Notice */}
        <div className="mb-6 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-900 text-center">
            <strong>Demo Data:</strong> All player profiles shown are sample data for demonstration purposes only.
          </p>
        </div>

        {/* Filters Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Search & Filter Players</CardTitle>
            <CardDescription>
              Find players by name, location, position, and more
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Search Bar */}
            <div>
              <Input
                type="text"
                placeholder="Search by name or player ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-md"
              />
            </div>

            {/* Filter Dropdowns */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Nationality</label>
                <Select value={selectedNationality} onValueChange={setSelectedNationality}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select nationality" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Nationalities</SelectItem>
                    {nationalities.map((nationality) => (
                      <SelectItem key={nationality} value={nationality}>
                        {nationality}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">State</label>
                <Select value={selectedState} onValueChange={setSelectedState}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select state" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All States</SelectItem>
                    {states.map((state) => (
                      <SelectItem key={state} value={state}>
                        {state}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Position</label>
                <Select value={selectedPosition} onValueChange={setSelectedPosition}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select position" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Positions</SelectItem>
                    {positions.map((position) => (
                      <SelectItem key={position} value={position}>
                        {position}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results Summary */}
        <div className="flex justify-between items-center mb-6">
          <div className="text-muted-foreground">
            {loading ? (
              'Loading players...'
            ) : (
              `Showing ${paginatedPlayers.length} of ${filteredPlayers.length} players`
            )}
          </div>
          
          <Link href="/">
            <Button variant="outline">← Back to Home</Button>
          </Link>
        </div>

        {/* Players Grid */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="text-muted-foreground">Loading players...</div>
          </div>
        ) : paginatedPlayers.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {paginatedPlayers.map((player) => (
                <Card key={player.id} className="group hover:shadow-lg transition-all duration-300 hover:scale-105">
                  <CardHeader className="pb-3">
                    {player.photo_url && (
                      <div className="mb-3 flex justify-center">
                        <img
                          src={player.photo_url}
                          alt={`${player.users?.first_name} ${player.users?.last_name}`}
                          className="h-20 w-20 object-cover rounded-full border-2 border-border"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none'
                          }}
                        />
                      </div>
                    )}
                    <CardTitle className="text-center text-lg">
                      {player.users?.first_name} {player.users?.last_name}
                    </CardTitle>
                    {player.unique_player_id && (
                      <CardDescription className="text-center">
                        ID: {player.unique_player_id}
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      {player.position && (
                        <div>
                          <div className="font-semibold">Position</div>
                          <div className="text-muted-foreground capitalize">{player.position}</div>
                        </div>
                      )}
                      {player.jersey_number && (
                        <div>
                          <div className="font-semibold">Jersey</div>
                          <div className="text-muted-foreground">#{player.jersey_number}</div>
                        </div>
                      )}
                      {player.nationality && (
                        <div>
                          <div className="font-semibold">Nationality</div>
                          <div className="text-muted-foreground">{player.nationality}</div>
                        </div>
                      )}
                      {player.state && (
                        <div>
                          <div className="font-semibold">State</div>
                          <div className="text-muted-foreground">{player.state}</div>
                        </div>
                      )}
                    </div>

                    {/* Statistics */}
                    <div className="grid grid-cols-3 gap-2 text-xs bg-muted/50 rounded-lg p-3">
                      <div className="text-center">
                        <div className="font-semibold">{player.total_matches_played || 0}</div>
                        <div className="text-muted-foreground">Matches</div>
                      </div>
                      <div className="text-center">
                        <div className="font-semibold">{player.total_goals_scored || 0}</div>
                        <div className="text-muted-foreground">Goals</div>
                      </div>
                      <div className="text-center">
                        <div className="font-semibold">{player.total_assists || 0}</div>
                        <div className="text-muted-foreground">Assists</div>
                      </div>
                    </div>

                    <Button size="sm" variant="outline" className="w-full" asChild>
                      <Link href={`/player/${player.id}`}>View Profile</Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-8">
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                
                <span className="px-4 py-2 text-sm text-muted-foreground">
                  Page {currentPage} of {totalPages}
                </span>
                
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12">
            <div className="text-muted-foreground mb-4">
              {searchTerm || selectedNationality !== 'all' || selectedState !== 'all' || selectedPosition !== 'all'
                ? 'No players found matching your search criteria'
                : 'No players available yet'
              }
            </div>
            {(searchTerm || selectedNationality !== 'all' || selectedState !== 'all' || selectedPosition !== 'all') && (
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm('')
                  setSelectedNationality('all')
                  setSelectedState('all')
                  setSelectedPosition('all')
                }}
              >
                Clear Filters
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}