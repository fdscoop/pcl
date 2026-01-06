'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { FormationBuilder } from '@/components/FormationBuilder'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Calendar, MapPin, Clock, CheckCircle2, Info } from 'lucide-react'

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
  has_lineup?: boolean
}

export default function FormationsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(true)
  const [club, setClub] = useState<any>(null)
  const [team, setTeam] = useState<any>(null)
  const [players, setPlayers] = useState<Player[]>([])
  const [matches, setMatches] = useState<Match[]>([])
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null)
  const [lastLineupUpdate, setLastLineupUpdate] = useState<number>(0)

  useEffect(() => {
    loadData()
  }, [searchParams])

  useEffect(() => {
    // Check for lineup updates from localStorage
    const checkLineupUpdate = () => {
      const lineupUpdateStr = localStorage.getItem('lineupUpdated')
      if (lineupUpdateStr) {
        try {
          const update = JSON.parse(lineupUpdateStr)
          if (update.timestamp > lastLineupUpdate) {
            setLastLineupUpdate(update.timestamp)
            refreshLineupStatus()
          }
        } catch (e) {
          console.error('Error parsing lineup update:', e)
        }
      }
    }

    // Check immediately on mount
    checkLineupUpdate()

    // Set up interval to check periodically when page is active
    const interval = setInterval(checkLineupUpdate, 1000)

    return () => {
      clearInterval(interval)
    }
  }, [lastLineupUpdate, matches, team])

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
            let enrichedMatches = matchesData.map((match) => ({
              ...match,
              home_club_name: clubMap.get(teamToClubMap.get(match.home_team_id))?.name || 'Unknown',
              home_club_logo: clubMap.get(teamToClubMap.get(match.home_team_id))?.logo || null,
              away_club_name: clubMap.get(teamToClubMap.get(match.away_team_id))?.name || 'Unknown',
              away_club_logo: clubMap.get(teamToClubMap.get(match.away_team_id))?.logo || null
            }))

            // Check lineup status for each match
            if (enrichedMatches.length > 0) {
              const lineupChecks = await Promise.all(
                enrichedMatches.map(async (match) => {
                  // First, check if lineup exists for this specific match
                  const { data: matchSpecificLineup } = await supabase
                    .from('team_lineups')
                    .select('id')
                    .eq('team_id', teamData.id)
                    .eq('match_id', match.id)
                    .eq('format', match.match_format)
                    .limit(1)
                    .maybeSingle()

                  // If no match-specific lineup, check for template lineup (match_id = null)
                  let hasLineup = !!matchSpecificLineup

                  if (!matchSpecificLineup) {
                    const { data: templateLineup } = await supabase
                      .from('team_lineups')
                      .select('id')
                      .eq('team_id', teamData.id)
                      .is('match_id', null)
                      .eq('format', match.match_format)
                      .limit(1)
                      .maybeSingle()

                    hasLineup = !!templateLineup
                  }

                  return {
                    ...match,
                    has_lineup: hasLineup
                  }
                })
              )
              enrichedMatches = lineupChecks
            }

            setMatches(enrichedMatches)

            // If match parameter is provided in URL, auto-select that match
            const matchParam = searchParams.get('match')
            if (matchParam) {
              const matchToSelect = enrichedMatches.find(m => m.id === matchParam)
              if (matchToSelect) {
                setSelectedMatch(matchToSelect)
              }
            }
          } else {
            setMatches(matchesData)

            // If match parameter is provided in URL, auto-select that match
            const matchParam = searchParams.get('match')
            if (matchParam) {
              const matchToSelect = matchesData.find(m => m.id === matchParam)
              if (matchToSelect) {
                setSelectedMatch(matchToSelect)
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const refreshLineupStatus = async () => {
    // Only refresh lineup status if we have matches and team data
    if (matches.length === 0 || !team) return

    try {
      const supabase = createClient()

      const lineupChecks = await Promise.all(
        matches.map(async (match) => {
          // First, check if lineup exists for this specific match
          const { data: matchSpecificLineup } = await supabase
            .from('team_lineups')
            .select('id')
            .eq('team_id', team.id)
            .eq('match_id', match.id)
            .eq('format', match.match_format)
            .limit(1)
            .maybeSingle()

          // If no match-specific lineup, check for template lineup (match_id = null)
          let hasLineup = !!matchSpecificLineup

          if (!matchSpecificLineup) {
            const { data: templateLineup } = await supabase
              .from('team_lineups')
              .select('id')
              .eq('team_id', team.id)
              .is('match_id', null)
              .eq('format', match.match_format)
              .limit(1)
              .maybeSingle()

            hasLineup = !!templateLineup
          }

          return {
            ...match,
            has_lineup: hasLineup
          }
        })
      )

      setMatches(lineupChecks)
    } catch (error) {
      console.error('Error refreshing lineup status:', error)
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
              <h1 className="text-4xl font-bold text-gray-900">Formation & Playing XI</h1>
              <p className="text-gray-600 mt-2 text-sm">
                Build your tactical formation and declare your starting lineup for each match
              </p>
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
          <div className="mb-8">
            <div className="mb-5">
              <h2 className="text-2xl font-bold text-gray-900 mb-1">Your Upcoming Matches</h2>
              <p className="text-sm text-gray-600">Click on a match card to build your formation and declare Playing XI</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {matches.map((match) => {
                const isHomeTeam = match.home_team_id === team?.id
                const opponentName = isHomeTeam ? match.away_club_name : match.home_club_name
                const opponentLogo = isHomeTeam ? match.away_club_logo : match.home_club_logo
                const yourLogo = isHomeTeam ? match.home_club_logo : match.away_club_logo
                const isSelected = selectedMatch?.id === match.id

                return (
                  <Card
                    key={match.id}
                    className={`group cursor-pointer transition-all duration-300 border-2 overflow-hidden ${
                      isSelected
                        ? 'border-teal-500 shadow-xl shadow-teal-100 scale-[1.02]'
                        : 'border-transparent hover:border-teal-200 hover:shadow-lg'
                    }`}
                    onClick={() => setSelectedMatch(isSelected ? null : match)}
                  >
                    {/* Top Accent Bar */}
                    <div className={`h-1.5 ${
                      match.match_format === '5-a-side' ? 'bg-gradient-to-r from-orange-400 to-orange-600' :
                      match.match_format === '7-a-side' ? 'bg-gradient-to-r from-emerald-400 to-emerald-600' :
                      'bg-gradient-to-r from-blue-400 to-blue-600'
                    }`} />

                    <CardContent className="p-5">
                      {/* Status Badges */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge
                            variant="outline"
                            className={`${
                              match.match_format === '5-a-side' ? 'border-orange-300 bg-orange-50 text-orange-700' :
                              match.match_format === '7-a-side' ? 'border-emerald-300 bg-emerald-50 text-emerald-700' :
                              'border-blue-300 bg-blue-50 text-blue-700'
                            } font-semibold`}
                          >
                            {match.match_format}
                          </Badge>
                          <Badge
                            variant="outline"
                            className={`${
                              isHomeTeam
                                ? 'border-teal-300 bg-teal-50 text-teal-700'
                                : 'border-gray-300 bg-gray-50 text-gray-700'
                            } text-xs`}
                          >
                            {isHomeTeam ? 'HOME' : 'AWAY'}
                          </Badge>
                        </div>
                        {isSelected && (
                          <div className="flex items-center gap-1.5 bg-teal-500 text-white px-2.5 py-1 rounded-full text-xs font-semibold animate-pulse">
                            <div className="w-1.5 h-1.5 bg-white rounded-full" />
                            Active
                          </div>
                        )}
                      </div>

                      {/* Match-up Display */}
                      <div className="mb-5 bg-gradient-to-br from-gray-50 to-white p-4 rounded-xl border border-gray-100">
                        <div className="flex items-center justify-between gap-3">
                          {/* Your Club */}
                          <div className="flex flex-col items-center flex-1 group-hover:scale-105 transition-transform">
                            <div className="relative mb-2">
                              {yourLogo ? (
                                <img
                                  src={yourLogo}
                                  alt="Your Club"
                                  className="w-14 h-14 rounded-full object-cover shadow-md ring-2 ring-teal-400"
                                />
                              ) : (
                                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center shadow-md ring-2 ring-teal-300">
                                  <span className="text-white font-bold text-base">YOU</span>
                                </div>
                              )}
                            </div>
                            <span className="text-xs font-bold text-gray-800 text-center line-clamp-2 px-1">
                              {club?.club_name}
                            </span>
                          </div>

                          {/* VS Badge */}
                          <div className="flex-shrink-0">
                            <div className="bg-gradient-to-br from-gray-700 to-gray-900 text-white font-black text-xs px-3 py-1.5 rounded-lg shadow-md">
                              VS
                            </div>
                          </div>

                          {/* Opponent Club */}
                          <div className="flex flex-col items-center flex-1 group-hover:scale-105 transition-transform">
                            <div className="relative mb-2">
                              {opponentLogo ? (
                                <img
                                  src={opponentLogo}
                                  alt={opponentName}
                                  className="w-14 h-14 rounded-full object-cover shadow-md ring-2 ring-gray-300"
                                />
                              ) : (
                                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center shadow-md ring-2 ring-gray-200">
                                  <span className="text-gray-700 font-bold text-xl">
                                    {opponentName?.charAt(0) || '?'}
                                  </span>
                                </div>
                              )}
                            </div>
                            <span className="text-xs font-bold text-gray-800 text-center line-clamp-2 px-1">
                              {opponentName}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Match Info */}
                      <div className="space-y-2.5 mb-4">
                        <div className="flex items-center gap-2.5 text-sm">
                          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-50">
                            <Calendar className="h-4 w-4 text-blue-600" />
                          </div>
                          <div className="flex-1">
                            <p className="text-xs text-gray-500 font-medium">Match Date</p>
                            <p className="text-sm font-semibold text-gray-900">
                              {new Date(match.match_date).toLocaleDateString('en-US', {
                                weekday: 'short',
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric'
                              })}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2.5 text-sm">
                          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-purple-50">
                            <Clock className="h-4 w-4 text-purple-600" />
                          </div>
                          <div className="flex-1">
                            <p className="text-xs text-gray-500 font-medium">Kick-off Time</p>
                            <p className="text-sm font-semibold text-gray-900">{match.match_time}</p>
                          </div>
                        </div>
                        {match.stadium && (
                          <div className="flex items-center gap-2.5 text-sm">
                            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-green-50">
                              <MapPin className="h-4 w-4 text-green-600" />
                            </div>
                            <div className="flex-1">
                              <p className="text-xs text-gray-500 font-medium">Venue</p>
                              <p className="text-sm font-semibold text-gray-900 line-clamp-1">{match.stadium.stadium_name}</p>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Lineup Status */}
                      {typeof match.has_lineup !== 'undefined' && (
                        <div className={`mt-4 pt-4 border-t ${
                          match.has_lineup ? 'border-green-100' : 'border-red-100'
                        }`}>
                          {match.has_lineup ? (
                            <div className="flex items-center gap-2 text-green-700 bg-green-50 px-3 py-2 rounded-lg">
                              <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
                              <span className="text-xs font-semibold">Playing XI Ready</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 text-red-700 bg-red-50 px-3 py-2 rounded-lg">
                              <Info className="h-4 w-4 flex-shrink-0" />
                              <span className="text-xs font-semibold">Playing XI Not Declared</span>
                            </div>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </div>

            {selectedMatch && (
              <div className="mt-6 p-5 bg-gradient-to-r from-teal-50 via-teal-50 to-blue-50 border-2 border-teal-200 rounded-xl shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-10 h-10 bg-teal-500 rounded-full shadow-md">
                    <CheckCircle2 className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-teal-600 uppercase tracking-wide mb-0.5">
                      Building Formation For
                    </p>
                    <p className="text-sm font-bold text-gray-900">
                      {selectedMatch.match_format} match vs{' '}
                      {selectedMatch.home_team_id === team?.id
                        ? selectedMatch.away_club_name
                        : selectedMatch.home_club_name}
                    </p>
                  </div>
                  <Badge className="bg-teal-500 text-white">Selected</Badge>
                </div>
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
