'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { FormationBuilder } from '@/components/FormationBuilder'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Calendar, MapPin, Clock } from 'lucide-react'

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
  home_team: {
    team_name: string
  }
  away_team: {
    team_name: string
  }
  stadium?: {
    stadium_name: string
  }
  home_club_name?: string
  away_club_name?: string
  home_club_logo?: string
  away_club_logo?: string
}

export default function FormationsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [club, setClub] = useState<any>(null)
  const [team, setTeam] = useState<any>(null)
  const [players, setPlayers] = useState<Player[]>([])
  const [matches, setMatches] = useState<Match[]>([])
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null)

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

      // Get team
      const { data: teamData } = await supabase
        .from('teams')
        .select('*')
        .eq('club_id', clubData.id)
        .maybeSingle()

      setTeam(teamData)

      if (teamData) {
        // Fetch squad players
        const { data: squadData } = await supabase
          .from('team_squads')
          .select('*')
          .eq('team_id', teamData.id)

        const squadPlayerIds = [...new Set(squadData?.map(s => s.player_id) || [])]

        if (squadPlayerIds.length > 0) {
          const { data: playersData } = await supabase
            .from('players')
            .select(`
              id,
              position,
              photo_url,
              unique_player_id,
              users (
                first_name,
                last_name
              )
            `)
            .in('id', squadPlayerIds)

          if (playersData && squadData) {
            const playersMap = new Map(playersData.map(p => [p.id, p]))
            const squadPlayers = squadData.map(squad => ({
              ...squad,
              players: playersMap.get(squad.player_id)
            }))
            setPlayers(squadPlayers as Player[])
          }
        }

        // Fetch upcoming matches for this team
        const { data: matchesData } = await supabase
          .from('matches')
          .select(`
            *,
            home_team:teams!matches_home_team_id_fkey(id, team_name),
            away_team:teams!matches_away_team_id_fkey(id, team_name),
            stadium:stadiums(stadium_name)
          `)
          .or(`home_team_id.eq.${teamData.id},away_team_id.eq.${teamData.id}`)
          .gte('match_date', new Date().toISOString().split('T')[0])
          .order('match_date')
          .order('match_time')
          .limit(10)

        if (matchesData && matchesData.length > 0) {
          // Create a map of team_id to club_id
          const teamToClubMap = new Map()
          teamToClubMap.set(teamData.id, teamData.club_id)

          // Get all unique team IDs from the matches
          const allTeamIds = new Set<string>()
          matchesData.forEach((match) => {
            allTeamIds.add(match.home_team_id)
            allTeamIds.add(match.away_team_id)
          })

          // Fetch club_id for opponent teams
          const missingTeamIds = Array.from(allTeamIds).filter(teamId => !teamToClubMap.has(teamId))

          if (missingTeamIds.length > 0) {
            const { data: missingTeams } = await supabase
              .from('teams')
              .select('id, club_id')
              .in('id', missingTeamIds)

            if (missingTeams) {
              missingTeams.forEach((team) => {
                teamToClubMap.set(team.id, team.club_id)
              })
            }
          }

          // Get all unique club IDs from the matches
          const clubIds = new Set<string>()
          matchesData.forEach((match) => {
            const homeClubId = teamToClubMap.get(match.home_team_id)
            const awayClubId = teamToClubMap.get(match.away_team_id)
            if (homeClubId) clubIds.add(homeClubId)
            if (awayClubId) clubIds.add(awayClubId)
          })

          // Fetch club names and logos for these IDs
          if (clubIds.size > 0) {
            const clubIdArray = Array.from(clubIds)
            let clubsQuery = supabase
              .from('clubs')
              .select('id, club_name, logo_url')

            // Use eq for single value, in for multiple
            if (clubIdArray.length === 1) {
              clubsQuery = clubsQuery.eq('id', clubIdArray[0])
            } else {
              clubsQuery = clubsQuery.in('id', clubIdArray)
            }

            const { data: clubsData } = await clubsQuery

            // Create a map of club_id to club info
            const clubMap = new Map()
            if (clubsData) {
              // Handle both single object and array responses
              const clubsArray = Array.isArray(clubsData) ? clubsData : [clubsData]
              clubsArray.forEach((club) => {
                clubMap.set(club.id, { name: club.club_name, logo: club.logo_url })
              })
            }

            // Enrich matches with club names and logos
            const enrichedMatches = matchesData.map((match) => ({
              ...match,
              home_club_name: clubMap.get(teamToClubMap.get(match.home_team_id))?.name || 'Unknown',
              home_club_logo: clubMap.get(teamToClubMap.get(match.home_team_id))?.logo || null,
              away_club_name: clubMap.get(teamToClubMap.get(match.away_team_id))?.name || 'Unknown',
              away_club_logo: clubMap.get(teamToClubMap.get(match.away_team_id))?.logo || null
            }))

            setMatches(enrichedMatches)
          } else {
            setMatches(matchesData)
          }
        }
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground">Loading formations...</div>
      </div>
    )
  }

  if (!team) {
    return (
      <div className="min-h-screen p-6">
        <Card className="max-w-2xl mx-auto border-2 border-dashed bg-white/90 backdrop-blur-sm shadow-xl">
          <CardContent className="py-12">
            <div className="text-center">
              <div className="text-6xl mb-4">🏆</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                No Team Created
              </h3>
              <p className="text-gray-600 mb-6">
                Create a team first to build formations
              </p>
              <button
                onClick={() => router.push('/dashboard/club-owner/team-management')}
                className="px-6 py-3 bg-gradient-to-r from-teal-500 to-teal-600 text-white rounded-lg font-semibold hover:from-teal-600 hover:to-teal-700 transition-all shadow-lg"
              >
                Go to Squad
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (players.length === 0) {
    return (
      <div className="min-h-screen p-6">
        <Card className="max-w-2xl mx-auto border-2 border-dashed border-amber-300 bg-white/90 backdrop-blur-sm shadow-xl">
          <CardContent className="py-12">
            <div className="text-center">
              <div className="text-6xl mb-4">⚽</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                No Squad Players
              </h3>
              <p className="text-gray-600 mb-6">
                Add players to your squad to create formations
              </p>
              <button
                onClick={() => router.push('/dashboard/club-owner/team-management')}
                className="px-6 py-3 bg-gradient-to-r from-teal-500 to-teal-600 text-white rounded-lg font-semibold hover:from-teal-600 hover:to-teal-700 transition-all shadow-lg"
              >
                Go to Squad
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <main className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header Section */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-teal-600 font-medium mb-1">welcome back 👋</p>
              <h1 className="text-4xl font-bold text-gray-900">Formation</h1>
            </div>
            <button
              onClick={() => router.push('/dashboard/club-owner/team-management')}
              className="px-4 py-2 text-sm text-teal-600 hover:text-teal-700 font-medium border border-teal-200 rounded-lg hover:bg-teal-50 transition-colors"
            >
              view all squad
            </button>
          </div>
        </div>

        {/* Upcoming Matches Section */}
        {matches.length > 0 && (
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Upcoming Matches</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {matches.map((match) => {
                const isHomeTeam = match.home_team_id === team?.id
                const opponentName = isHomeTeam ? match.away_club_name : match.home_club_name
                const opponentLogo = isHomeTeam ? match.away_club_logo : match.home_club_logo
                const yourLogo = isHomeTeam ? match.home_club_logo : match.away_club_logo
                const isSelected = selectedMatch?.id === match.id

                return (
                  <Card
                    key={match.id}
                    className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
                      isSelected
                        ? 'ring-2 ring-teal-500 shadow-lg bg-teal-50'
                        : 'hover:ring-2 hover:ring-teal-200'
                    }`}
                    onClick={() => setSelectedMatch(isSelected ? null : match)}
                  >
                    <CardContent className="p-4">
                      {/* Header with Format Badge and Selected Badge */}
                      <div className="flex items-center justify-between mb-4">
                        <Badge
                          className={`${
                            match.match_format === '5-a-side' ? 'bg-orange-500' :
                            match.match_format === '7-a-side' ? 'bg-emerald-500' :
                            'bg-blue-500'
                          } text-white`}
                        >
                          {match.match_format}
                        </Badge>
                        {isSelected && (
                          <Badge className="bg-teal-500 text-white">Selected</Badge>
                        )}
                      </div>

                      {/* Match-up Display with Logos */}
                      <div className="mb-4">
                        <p className="text-xs text-gray-500 mb-2 uppercase tracking-wide">
                          {isHomeTeam ? 'Home Match' : 'Away Match'}
                        </p>
                        <div className="flex items-center justify-between gap-2">
                          {/* Your Club */}
                          <div className="flex flex-col items-center flex-1">
                            {yourLogo ? (
                              <img
                                src={yourLogo}
                                alt="Your Club"
                                className="w-12 h-12 rounded-full object-cover border-2 border-teal-500 mb-1"
                              />
                            ) : (
                              <div className="w-12 h-12 rounded-full bg-teal-100 flex items-center justify-center border-2 border-teal-500 mb-1">
                                <span className="text-teal-600 font-bold text-sm">YOU</span>
                              </div>
                            )}
                            <span className="text-xs font-medium text-gray-700 text-center line-clamp-1">
                              {club?.club_name}
                            </span>
                          </div>

                          {/* VS Separator */}
                          <div className="flex-shrink-0 px-2">
                            <span className="text-gray-400 font-bold text-sm">VS</span>
                          </div>

                          {/* Opponent Club */}
                          <div className="flex flex-col items-center flex-1">
                            {opponentLogo ? (
                              <img
                                src={opponentLogo}
                                alt={opponentName}
                                className="w-12 h-12 rounded-full object-cover border-2 border-gray-300 mb-1"
                              />
                            ) : (
                              <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center border-2 border-gray-300 mb-1">
                                <span className="text-gray-600 font-bold text-lg">
                                  {opponentName?.charAt(0) || '?'}
                                </span>
                              </div>
                            )}
                            <span className="text-xs font-medium text-gray-700 text-center line-clamp-1">
                              {opponentName}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Match Details */}
                      <div className="space-y-1.5 text-sm text-gray-600 border-t pt-3">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <span>{new Date(match.match_date).toLocaleDateString('en-US', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric'
                          })}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-gray-400" />
                          <span>{match.match_time}</span>
                        </div>
                        {match.stadium && (
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-gray-400" />
                            <span className="line-clamp-1">{match.stadium.stadium_name}</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>

            {selectedMatch && (
              <div className="mt-4 p-4 bg-teal-50 border border-teal-200 rounded-lg">
                <p className="text-sm text-teal-800">
                  <strong>Building formation for:</strong> {selectedMatch.match_format} match vs{' '}
                  {selectedMatch.home_team_id === team?.id
                    ? selectedMatch.away_club_name
                    : selectedMatch.home_club_name}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Main Content - Full Width */}
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-200">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-900">
                {selectedMatch ? 'Match Formation' : 'Formation Templates'}
              </h2>
              <div className="text-sm text-gray-500">
                {players.length} players available
              </div>
            </div>

            {/* Formation Builder Component */}
            <FormationBuilder
              players={players}
              clubId={club?.id}
              teamId={team?.id}
              matchId={selectedMatch?.id}
              matchFormat={selectedMatch?.match_format}
            />
          </div>
        </div>
      </main>
    </div>
  )
}
