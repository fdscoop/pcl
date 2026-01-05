'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { UnreadContractBadge } from '@/components/UnreadContractBadge'
import { useUnreadMessages } from '@/hooks/useUnreadMessages'
import { TeamBuildingAlert } from '../../../components/TeamBuildingAlert'

export default function ClubOwnerDashboard() {
  const router = useRouter()
  const [userData, setUserData] = useState<any>(null)
  const [club, setClub] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const [activeContractsCount, setActiveContractsCount] = useState(0)
  const [teamsCount, setTeamsCount] = useState(0)
  const [upcomingMatches, setUpcomingMatches] = useState<any[]>([])
  const { unreadCount: unreadMessagesCount } = useUnreadMessages(userId)

  useEffect(() => {
    const supabase = createClient()

    const loadData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
          router.push('/auth/login')
          return
        }

        setUserId(user.id)

        const { data: profile } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single()

        setUserData(profile)

        // Fetch user's club
        const { data: clubData, error: clubError } = await supabase
          .from('clubs')
          .select('*')
          .eq('owner_id', user.id)
          .single()

        if (clubError) {
          if (clubError.code !== 'PGRST116') {
            console.error('Error loading club:', clubError)
          }
        } else {
          setClub(clubData)

          // Fetch active contracts count
          const { data: contractsData, error: contractsError } = await supabase
            .from('contracts')
            .select('id', { count: 'exact' })
            .eq('club_id', clubData.id)
            .eq('status', 'active')

          if (!contractsError && contractsData) {
            setActiveContractsCount(contractsData.length)
          }

          // Fetch teams count and full data
          const { data: teamsData, error: teamsError } = await supabase
            .from('teams')
            .select('*')
            .eq('club_id', clubData.id)

          if (!teamsError && teamsData) {
            setTeamsCount(teamsData.length)
          }

          // Fetch upcoming matches
          if (teamsData && teamsData.length > 0) {
            const teamIds = teamsData.map((t: any) => t.id).join(',')
            const { data: matchesData } = await supabase
              .from('matches')
              .select(`
                *,
                home_team:teams!matches_home_team_id_fkey(id, team_name),
                away_team:teams!matches_away_team_id_fkey(id, team_name),
                stadium:stadiums(stadium_name)
              `)
              .or(`home_team_id.in.(${teamIds}),away_team_id.in.(${teamIds})`)
              .gte('match_date', new Date().toISOString().split('T')[0])
              .order('match_date', { ascending: true })
              .limit(1)
            
            if (matchesData && matchesData.length > 0) {
              // Create a map of team_id to club_id from teamsData we already fetched (only our club's teams)
              const teamToClubMap = new Map()
              teamsData.forEach((team: any) => {
                teamToClubMap.set(team.id, team.club_id)
              })

              // Get all unique team IDs from the matches
              const allTeamIds = new Set<string>()
              matchesData.forEach((match: any) => {
                allTeamIds.add(match.home_team_id)
                allTeamIds.add(match.away_team_id)
              })

              // Fetch club_id for teams that are not in our teamsData (opponent teams)
              const missingTeamIds = Array.from(allTeamIds).filter(teamId => !teamToClubMap.has(teamId))
              
              if (missingTeamIds.length > 0) {
                const { data: missingTeams } = await supabase
                  .from('teams')
                  .select('id, club_id')
                  .in('id', missingTeamIds)

                if (missingTeams) {
                  missingTeams.forEach((team: any) => {
                    teamToClubMap.set(team.id, team.club_id)
                  })
                }
              }

              // Get all unique club IDs from the matches
              const clubIds = new Set<string>()
              matchesData.forEach((match: any) => {
                const homeClubId = teamToClubMap.get(match.home_team_id)
                const awayClubId = teamToClubMap.get(match.away_team_id)
                if (homeClubId) clubIds.add(homeClubId)
                if (awayClubId) clubIds.add(awayClubId)
              })

              // Fetch club names for these IDs
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

                // Create a map of club_id to club_name and logo_url
                const clubMap = new Map()
                if (clubsData) {
                  // Handle both single object and array responses
                  const clubsArray = Array.isArray(clubsData) ? clubsData : [clubsData]
                  clubsArray.forEach((club: any) => {
                    clubMap.set(club.id, { name: club.club_name, logo: club.logo_url })
                  })
                }

                // Enrich matches with club names and logos
                const enrichedMatches = matchesData.map((match: any) => ({
                  ...match,
                  home_club_name: clubMap.get(teamToClubMap.get(match.home_team_id))?.name || 'Unknown',
                  home_club_logo: clubMap.get(teamToClubMap.get(match.home_team_id))?.logo || null,
                  away_club_name: clubMap.get(teamToClubMap.get(match.away_team_id))?.name || 'Unknown',
                  away_club_logo: clubMap.get(teamToClubMap.get(match.away_team_id))?.logo || null
                }))

                setUpcomingMatches(enrichedMatches)
              }
            }
          }
        }
      } catch (error) {
        console.error('Error loading user:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [router])

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-600">Loading...</div>
      </div>
    )
  }

  if (!club) {
    return null // Layout will handle redirect
  }

  return (
    <div className="p-6 lg:p-8">
          {/* Welcome Message */}
          <div className="mb-8">
            <p className="text-teal-600 font-medium mb-2">Welcome back, {userData?.first_name}👋</p>
            <h1 className="text-4xl font-bold text-gray-800">Dashboard</h1>
          </div>

          {/* Team Building Alert */}
          <TeamBuildingAlert activeContractsCount={activeContractsCount} />

          {/* New Messages Alert */}
          {unreadMessagesCount > 0 && (
            <Alert className="mb-6 border-2 border-red-400 bg-gradient-to-r from-red-50 to-pink-50 shadow-lg">
              <div className="flex items-start gap-4">
                <div className="text-3xl">💬</div>
                <div className="flex-1">
                  <AlertTitle className="text-lg font-bold mb-1 text-red-700">
                    You Have {unreadMessagesCount} New Message{unreadMessagesCount > 1 ? 's' : ''}!
                  </AlertTitle>
                  <AlertDescription className="space-y-2">
                    <p className="text-gray-700 font-medium">
                      Player{unreadMessagesCount > 1 ? 's have' : ' has'} sent you new message{unreadMessagesCount > 1 ? 's' : ''}.
                    </p>
                    <Button
                      onClick={() => router.push('/dashboard/club-owner/messages')}
                      variant="destructive"
                      size="sm"
                      className="btn-lift font-semibold"
                    >
                      Read Messages ({unreadMessagesCount})
                    </Button>
                  </AlertDescription>
                </div>
              </div>
            </Alert>
          )}

          {/* Verification Alert */}
          {!club?.kyc_verified && (
            <Alert className="mb-6 border-2 border-amber-400 bg-gradient-to-r from-amber-50 to-yellow-50 shadow-lg">
              <div className="flex items-start gap-4">
                <div className="text-2xl">⚠️</div>
                <div className="flex-1">
                  <h3 className="font-semibold text-amber-900 mb-1">
                    Verification Required
                  </h3>
                  <p className="text-sm text-amber-800 mb-3">
                    Your club is not yet verified. Complete KYC verification to unlock additional features.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push('/dashboard/club-owner/kyc')}
                    className="border-amber-500 hover:bg-amber-100"
                  >
                    Start Verification
                  </Button>
                </div>
              </div>
            </Alert>
          )}

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - 2/3 width */}
            <div className="lg:col-span-2 space-y-6">
              {/* Next Game & Games Statistics */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Next Game Card */}
                <Card className="bg-white/90 backdrop-blur-sm border-gray-200 shadow-lg rounded-2xl overflow-hidden">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg font-bold text-gray-800">Next game</CardTitle>
                      <button 
                        onClick={() => router.push('/dashboard/club-owner/matches')}
                        className="text-sm text-teal-600 font-medium hover:text-teal-700">
                        View calendar
                      </button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {upcomingMatches.length > 0 ? (
                      <div className="space-y-4">
                        {upcomingMatches.map((match: any) => (
                          <div key={match.id} className="p-6 bg-gradient-to-br from-blue-50 to-teal-50 rounded-2xl border border-gray-200">
                            {/* Format Badge */}
                            <div className="flex items-center justify-between mb-4">
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                                {match.match_format}
                              </span>
                              {match.stadium && (
                                <p className="text-xs text-gray-600 flex items-center gap-1">
                                  📍 {match.stadium.stadium_name}
                                </p>
                              )}
                            </div>

                            {/* Match Display */}
                            <div className="flex items-center justify-between gap-4">
                              {/* Home Team */}
                              <div className="flex-1 flex flex-col items-center text-center">
                                {match.home_club_logo ? (
                                  <img
                                    src={match.home_club_logo}
                                    alt={match.home_club_name}
                                    className="w-20 h-20 rounded-full object-cover mb-2 border-2 border-white shadow-md"
                                  />
                                ) : (
                                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-gray-300 to-gray-400 mb-2 border-2 border-white shadow-md flex items-center justify-center">
                                    <span className="text-gray-600 text-xs font-semibold">No Logo</span>
                                  </div>
                                )}
                                <p className="font-semibold text-gray-800 text-sm">{match.home_club_name}</p>
                              </div>

                              {/* VS Circle */}
                              <div className="flex flex-col items-center gap-3">
                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-400 to-red-400 flex items-center justify-center shadow-lg">
                                  <span className="text-white font-bold text-sm">vs</span>
                                </div>
                                <div className="text-center">
                                  <p className="text-xs text-gray-600 font-medium">
                                    {new Date(match.match_date).toLocaleDateString('en-US', { 
                                      month: 'short', 
                                      day: 'numeric'
                                    })}
                                  </p>
                                  <p className="text-xs text-gray-600 font-medium">{match.match_time}</p>
                                </div>
                              </div>

                              {/* Away Team */}
                              <div className="flex-1 flex flex-col items-center text-center">
                                {match.away_club_logo ? (
                                  <img
                                    src={match.away_club_logo}
                                    alt={match.away_club_name}
                                    className="w-20 h-20 rounded-full object-cover mb-2 border-2 border-white shadow-md"
                                  />
                                ) : (
                                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-gray-300 to-gray-400 mb-2 border-2 border-white shadow-md flex items-center justify-center">
                                    <span className="text-gray-600 text-xs font-semibold">No Logo</span>
                                  </div>
                                )}
                                <p className="font-semibold text-gray-800 text-sm">{match.away_club_name}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <p className="text-sm">No upcoming matches</p>
                        <p className="text-xs mt-1">Schedule will appear here</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Games Statistics Card */}
                <Card className="bg-white/90 backdrop-blur-sm border-gray-200 shadow-lg rounded-2xl overflow-hidden">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg font-bold text-gray-800">Games statistic</CardTitle>
                      <button className="text-sm text-teal-600 font-medium hover:text-teal-700">
                        View all statistic
                      </button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-4">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full flex">
                            <div className="bg-gradient-to-r from-teal-500 to-teal-600" style={{ width: '0%' }}></div>
                            <div className="bg-gray-300" style={{ width: '0%' }}></div>
                            <div className="bg-gradient-to-r from-red-400 to-red-500" style={{ width: '0%' }}></div>
                          </div>
                        </div>
                      </div>
                      <div className="grid grid-cols-4 gap-2 text-center">
                        <div>
                          <p className="text-xs text-gray-500 font-medium">PL</p>
                          <p className="text-lg font-bold text-gray-800">0</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 font-medium">VICTORIES</p>
                          <p className="text-lg font-bold text-gray-800">0</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 font-medium">DRAWS</p>
                          <p className="text-lg font-bold text-gray-800">0</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 font-medium">LOST</p>
                          <p className="text-lg font-bold text-gray-800">0</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Standings Table */}
              <Card className="bg-white/90 backdrop-blur-sm border-gray-200 shadow-lg rounded-2xl overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-bold text-gray-800">Club Information</CardTitle>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/club/${club?.id}/edit`)}
                      className="text-teal-600 border-teal-600 hover:bg-teal-50"
                    >
                      Edit Profile
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-start gap-4">
                      {club?.logo_url ? (
                        <img
                          src={club.logo_url}
                          alt={club.club_name}
                          className="h-16 w-16 rounded-lg object-cover border-2 border-gray-200"
                        />
                      ) : (
                        <div className="h-16 w-16 rounded-lg bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center text-2xl">
                          🏆
                        </div>
                      )}
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-gray-800 mb-1">{club?.club_name}</h3>
                        <div className="flex flex-wrap gap-2">
                          <span className="px-2 py-1 bg-teal-100 text-teal-700 rounded-md text-xs font-medium">
                            {club?.club_type}
                          </span>
                          <span className="px-2 py-1 bg-green-100 text-green-700 rounded-md text-xs font-medium">
                            {club?.category}
                          </span>
                          {club?.kyc_verified && (
                            <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-md text-xs font-medium flex items-center gap-1">
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                              Verified
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-gray-500 font-medium">Location</p>
                        <p className="text-gray-800">{club?.city}, {club?.state}</p>
                      </div>
                      <div>
                        <p className="text-gray-500 font-medium">Founded</p>
                        <p className="text-gray-800">{club?.founded_year}</p>
                      </div>
                      <div>
                        <p className="text-gray-500 font-medium">Email</p>
                        <p className="text-gray-800">{club?.email}</p>
                      </div>
                      <div>
                        <p className="text-gray-500 font-medium">Phone</p>
                        <p className="text-gray-800">{club?.phone}</p>
                      </div>
                    </div>
                    {club?.description && (
                      <div className="pt-3 border-t border-gray-200">
                        <p className="text-gray-500 font-medium mb-1 text-sm">Description</p>
                        <p className="text-gray-700 text-sm">{club.description}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column - 1/3 width */}
            <div className="space-y-6">
              {/* Stat Cards */}
              <div className="grid grid-cols-2 gap-4">
                {/* Teams Card */}
                <Card className="bg-white/90 backdrop-blur-sm border-gray-200 shadow-lg rounded-2xl overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="p-3 bg-purple-100 rounded-xl">
                        <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 font-medium uppercase mb-1">Teams</p>
                        <p className="text-2xl font-bold text-gray-800">{teamsCount}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Players Card */}
                <Card className="bg-white/90 backdrop-blur-sm border-gray-200 shadow-lg rounded-2xl overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="p-3 bg-pink-100 rounded-xl">
                        <svg className="w-6 h-6 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 font-medium uppercase mb-1">Players</p>
                        <p className="text-2xl font-bold text-gray-800">{activeContractsCount}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Budget Card */}
                <Card className="bg-white/90 backdrop-blur-sm border-gray-200 shadow-lg rounded-2xl overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="p-3 bg-orange-100 rounded-xl">
                        <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 font-medium uppercase mb-1">Founded</p>
                        <p className="text-2xl font-bold text-gray-800">{club?.founded_year}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Average Score Card */}
                <Card className="bg-white/90 backdrop-blur-sm border-gray-200 shadow-lg rounded-2xl overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="p-3 bg-teal-100 rounded-xl">
                        <svg className="w-6 h-6 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 font-medium uppercase mb-1">Matches</p>
                        <p className="text-2xl font-bold text-gray-800">0</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Quick Actions Card */}
              <Card className="bg-gradient-to-br from-teal-500 to-teal-600 border-0 shadow-lg rounded-2xl overflow-hidden text-white">
                <CardContent className="p-6">
                  <p className="text-xs font-semibold uppercase mb-2 opacity-90">DON'T FORGET</p>
                  <h3 className="text-2xl font-bold mb-4 leading-tight">Quick Actions</h3>
                  <div className="space-y-2">
                    <Button
                      onClick={() => router.push('/dashboard/club-owner/team-management')}
                      className="w-full bg-white/20 hover:bg-white/30 backdrop-blur-sm border-0 text-white font-medium justify-start"
                      variant="outline"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      Manage Teams
                    </Button>
                    <Button
                      onClick={() => router.push('/dashboard/club-owner/scout-players')}
                      className="w-full bg-white/20 hover:bg-white/30 backdrop-blur-sm border-0 text-white font-medium justify-start"
                      variant="outline"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      Scout Players
                    </Button>
                    <Button
                      onClick={() => router.push('/dashboard/club-owner/contracts')}
                      className="w-full bg-white/20 hover:bg-white/30 backdrop-blur-sm border-0 text-white font-medium justify-start relative"
                      variant="outline"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      View Contracts
                      <UnreadContractBadge userType="club_owner" />
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card className="bg-white/90 backdrop-blur-sm border-gray-200 shadow-lg rounded-2xl overflow-hidden">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg font-bold text-gray-800">Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-6 text-gray-500">
                    <p className="text-sm">No recent activity</p>
                    <p className="text-xs mt-1">Updates will appear here</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
    </div>
  )
}
