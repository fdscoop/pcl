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
import { 
  Users, 
  Trophy, 
  Calendar, 
  DollarSign, 
  Star, 
  MessageCircle,
  FileText,
  Search,
  Shield,
  ChevronRight,
  AlertTriangle,
  MapPin
} from 'lucide-react'

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
      <div className="flex items-center justify-center p-8 min-h-[60vh]">
        <div className="text-center">
          <div className="relative mx-auto w-12 h-12">
            <div className="w-12 h-12 rounded-full border-4 border-teal-200"></div>
            <div className="absolute inset-0 w-12 h-12 rounded-full border-4 border-teal-500 border-t-transparent animate-spin"></div>
          </div>
          <p className="mt-4 text-slate-500 text-sm">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (!club) {
    return null // Layout will handle redirect
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Welcome Message */}
      <div className="mb-2">
        <p className="text-teal-600 font-medium text-sm sm:text-base">Welcome back, {userData?.first_name} 👋</p>
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900">Dashboard</h1>
      </div>

      {/* Team Building Alert */}
 <TeamBuildingAlert activeContractsCount={activeContractsCount} />

 {/* New Messages Alert */}
      {/* Alerts Section - Stack on mobile */}
      <div className="space-y-4">
        {unreadMessagesCount > 0 && (
          <Alert className="border-2 border-red-400 bg-gradient-to-r from-red-50 to-pink-50 shadow-lg rounded-xl">
            <div className="flex items-start gap-3 sm:gap-4">
              <div className="p-2 rounded-full bg-red-100 flex-shrink-0">
                <MessageCircle className="w-5 h-5 text-red-600" />
              </div>
              <div className="flex-1 min-w-0">
                <AlertTitle className="text-base sm:text-lg font-bold mb-1 text-red-700">
                  {unreadMessagesCount} New Message{unreadMessagesCount > 1 ? 's' : ''}
                </AlertTitle>
                <AlertDescription className="space-y-2">
                  <p className="text-sm text-gray-700">
                    Player{unreadMessagesCount > 1 ? 's have' : ' has'} sent you new message{unreadMessagesCount > 1 ? 's' : ''}.
                  </p>
                  <Button
                    onClick={() => router.push('/dashboard/club-owner/messages')}
                    variant="destructive"
                    size="sm"
                    className="w-full sm:w-auto font-semibold"
                  >
                    Read Messages
                  </Button>
                </AlertDescription>
              </div>
            </div>
          </Alert>
        )}

        {/* Verification Alert */}
        {!club?.kyc_verified && (
          <Alert className="border-2 border-amber-400 bg-gradient-to-r from-amber-50 to-yellow-50 shadow-lg rounded-xl">
            <div className="flex items-start gap-3 sm:gap-4">
              <div className="p-2 rounded-full bg-amber-100 flex-shrink-0">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-amber-900 mb-1 text-sm sm:text-base">
                  Verification Required
                </h3>
                <p className="text-xs sm:text-sm text-amber-800 mb-3">
                  Complete KYC verification to unlock all features.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push('/dashboard/club-owner/kyc')}
                  className="w-full sm:w-auto border-amber-500 hover:bg-amber-100 text-amber-700"
                >
                  <Shield className="w-4 h-4 mr-2" />
                  Start Verification
                </Button>
              </div>
            </div>
          </Alert>
        )}
      </div>

      {/* Stats Grid - Responsive 2x2 on mobile, 4 columns on desktop */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Teams Card */}
        <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-lg rounded-2xl overflow-hidden">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row sm:items-start gap-3">
              <div className="p-2.5 sm:p-3 bg-purple-100 rounded-xl w-fit">
                <Users className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium uppercase mb-0.5">Teams</p>
                <p className="text-xl sm:text-2xl font-bold text-slate-900">{teamsCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Players Card */}
        <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-lg rounded-2xl overflow-hidden">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row sm:items-start gap-3">
              <div className="p-2.5 sm:p-3 bg-pink-100 rounded-xl w-fit">
                <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 text-pink-600" />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium uppercase mb-0.5">Players</p>
                <p className="text-xl sm:text-2xl font-bold text-slate-900">{activeContractsCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Founded Card */}
        <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-lg rounded-2xl overflow-hidden">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row sm:items-start gap-3">
              <div className="p-2.5 sm:p-3 bg-orange-100 rounded-xl w-fit">
                <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-orange-600" />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium uppercase mb-0.5">Founded</p>
                <p className="text-xl sm:text-2xl font-bold text-slate-900">{club?.founded_year || '-'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Matches Card */}
        <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-lg rounded-2xl overflow-hidden">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row sm:items-start gap-3">
              <div className="p-2.5 sm:p-3 bg-teal-100 rounded-xl w-fit">
                <Star className="w-5 h-5 sm:w-6 sm:h-6 text-teal-600" />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium uppercase mb-0.5">Matches</p>
                <p className="text-xl sm:text-2xl font-bold text-slate-900">0</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Left Column - Full width on mobile, 2/3 on desktop */}
        <div className="lg:col-span-2 space-y-4 sm:space-y-6">
          {/* Next Game Card */}
          <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-lg rounded-2xl overflow-hidden">
            <CardHeader className="pb-2 sm:pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base sm:text-lg font-bold text-slate-900">Next Match</CardTitle>
                <button 
                  onClick={() => router.push('/dashboard/club-owner/matches')}
                  className="text-xs sm:text-sm text-teal-600 font-medium hover:text-teal-700 flex items-center gap-1"
                >
                  View all <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              {upcomingMatches.length > 0 ? (
                <div className="space-y-4">
                  {upcomingMatches.map((match: any) => (
                    <div key={match.id} className="p-4 sm:p-6 bg-gradient-to-br from-teal-50 to-cyan-50 rounded-2xl border border-teal-100">
                      {/* Format Badge */}
                      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-teal-100 text-teal-700">
                          {match.match_format}
                        </span>
                        {match.stadium && (
                          <p className="text-xs text-slate-600 flex items-center gap-1">
                            <MapPin className="w-3 h-3" /> {match.stadium.stadium_name}
                          </p>
                        )}
                      </div>

                      {/* Match Display - Responsive */}
                      <div className="flex items-center justify-between gap-2 sm:gap-4">
                        {/* Home Team */}
                        <div className="flex-1 flex flex-col items-center text-center">
                          {match.home_club_logo ? (
                            <img
                              src={match.home_club_logo}
                              alt={match.home_club_name}
                              className="w-14 h-14 sm:w-20 sm:h-20 rounded-full object-cover mb-2 border-2 border-white shadow-md"
                            />
                          ) : (
                            <div className="w-14 h-14 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-slate-300 to-slate-400 mb-2 border-2 border-white shadow-md flex items-center justify-center">
                              <span className="text-slate-600 text-[10px] sm:text-xs font-semibold">Logo</span>
                            </div>
                          )}
                          <p className="font-semibold text-slate-800 text-xs sm:text-sm line-clamp-1">{match.home_club_name}</p>
                        </div>

                        {/* VS Circle */}
                        <div className="flex flex-col items-center gap-2">
                          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-teal-400 to-cyan-400 flex items-center justify-center shadow-lg">
                            <span className="text-white font-bold text-xs sm:text-sm">vs</span>
                          </div>
                          <div className="text-center">
                            <p className="text-[10px] sm:text-xs text-slate-600 font-medium">
                              {new Date(match.match_date).toLocaleDateString('en-US', { 
                                month: 'short', 
                                day: 'numeric'
                              })}
                            </p>
                            <p className="text-[10px] sm:text-xs text-slate-600 font-medium">{match.match_time}</p>
                          </div>
                        </div>

                        {/* Away Team */}
                        <div className="flex-1 flex flex-col items-center text-center">
                          {match.away_club_logo ? (
                            <img
                              src={match.away_club_logo}
                              alt={match.away_club_name}
                              className="w-14 h-14 sm:w-20 sm:h-20 rounded-full object-cover mb-2 border-2 border-white shadow-md"
                            />
                          ) : (
                            <div className="w-14 h-14 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-slate-300 to-slate-400 mb-2 border-2 border-white shadow-md flex items-center justify-center">
                              <span className="text-slate-600 text-[10px] sm:text-xs font-semibold">Logo</span>
                            </div>
                          )}
                          <p className="font-semibold text-slate-800 text-xs sm:text-sm line-clamp-1">{match.away_club_name}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-500">
                  <Calendar className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                  <p className="text-sm font-medium">No upcoming matches</p>
                  <p className="text-xs mt-1">Schedule will appear here</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Club Information Card */}
          <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-lg rounded-2xl overflow-hidden">
            <CardHeader className="pb-2 sm:pb-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <CardTitle className="text-base sm:text-lg font-bold text-slate-900">Club Information</CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push(`/club/${club?.id}/edit`)}
                  className="text-teal-600 border-teal-300 hover:bg-teal-50 text-xs sm:text-sm"
                >
                  Edit Profile
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-4">
                <div className="flex items-start gap-3 sm:gap-4">
                  {club?.logo_url ? (
                    <img
                      src={club.logo_url}
                      alt={club.club_name}
                      className="h-14 w-14 sm:h-16 sm:w-16 rounded-xl object-cover border-2 border-slate-200 flex-shrink-0"
                    />
                  ) : (
                    <div className="h-14 w-14 sm:h-16 sm:w-16 rounded-xl bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center text-2xl flex-shrink-0">
                      🏆
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-1 truncate">{club?.club_name}</h3>
                    <div className="flex flex-wrap gap-1.5 sm:gap-2">
                      {club?.club_type && (
                        <span className="px-2 py-0.5 bg-teal-100 text-teal-700 rounded-md text-[10px] sm:text-xs font-medium">
                          {club.club_type}
                        </span>
                      )}
                      {club?.category && (
                        <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-md text-[10px] sm:text-xs font-medium">
                          {club.category}
                        </span>
                      )}
                      {club?.kyc_verified && (
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-md text-[10px] sm:text-xs font-medium flex items-center gap-1">
                          <Shield className="w-3 h-3" />
                          Verified
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-slate-500 font-medium text-xs">Location</p>
                    <p className="text-slate-900 text-sm truncate">{club?.city}, {club?.state}</p>
                  </div>
                  <div>
                    <p className="text-slate-500 font-medium text-xs">Founded</p>
                    <p className="text-slate-900 text-sm">{club?.founded_year}</p>
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <p className="text-slate-500 font-medium text-xs">Email</p>
                    <p className="text-slate-900 text-sm truncate">{club?.email}</p>
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <p className="text-slate-500 font-medium text-xs">Phone</p>
                    <p className="text-slate-900 text-sm">{club?.phone}</p>
                  </div>
                </div>
                {club?.description && (
                  <div className="pt-3 border-t border-slate-200">
                    <p className="text-slate-500 font-medium mb-1 text-xs">Description</p>
                    <p className="text-slate-700 text-sm line-clamp-3">{club.description}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Quick Actions (visible on mobile too, at bottom) */}
        <div className="space-y-4 sm:space-y-6">
          {/* Quick Actions Card */}
          <Card className="bg-gradient-to-br from-teal-500 to-cyan-600 border-0 shadow-xl rounded-2xl overflow-hidden text-white">
            <CardContent className="p-4 sm:p-6">
              <p className="text-xs font-semibold uppercase mb-1 opacity-90">Quick Actions</p>
              <h3 className="text-xl sm:text-2xl font-bold mb-4 leading-tight">Get Started</h3>
              <div className="space-y-2">
                <Button
                  onClick={() => router.push('/dashboard/club-owner/team-management')}
                  className="w-full bg-white/20 hover:bg-white/30 backdrop-blur-sm border-0 text-white font-medium justify-start text-sm"
                  variant="outline"
                >
                  <Users className="w-4 h-4 mr-2" />
                  Manage Teams
                </Button>
                <Button
                  onClick={() => router.push('/dashboard/club-owner/scout-players')}
                  className="w-full bg-white/20 hover:bg-white/30 backdrop-blur-sm border-0 text-white font-medium justify-start text-sm"
                  variant="outline"
                >
                  <Search className="w-4 h-4 mr-2" />
                  Scout Players
                </Button>
                <Button
                  onClick={() => router.push('/dashboard/club-owner/contracts')}
                  className="w-full bg-white/20 hover:bg-white/30 backdrop-blur-sm border-0 text-white font-medium justify-start relative text-sm"
                  variant="outline"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  View Contracts
                  <UnreadContractBadge userType="club_owner" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Games Statistics Card - Only on larger screens */}
          <Card className="hidden lg:block bg-white/90 backdrop-blur-sm border-0 shadow-lg rounded-2xl overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-bold text-slate-900">Statistics</CardTitle>
                <button className="text-sm text-teal-600 font-medium hover:text-teal-700 flex items-center gap-1">
                  View all <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full flex">
                      <div className="bg-gradient-to-r from-teal-500 to-cyan-500" style={{ width: '0%' }}></div>
                      <div className="bg-slate-300" style={{ width: '0%' }}></div>
                      <div className="bg-gradient-to-r from-red-400 to-red-500" style={{ width: '0%' }}></div>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-2 text-center">
                  <div>
                    <p className="text-[10px] text-slate-500 font-medium">PL</p>
                    <p className="text-lg font-bold text-slate-900">0</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500 font-medium">WIN</p>
                    <p className="text-lg font-bold text-slate-900">0</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500 font-medium">DRAW</p>
                    <p className="text-lg font-bold text-slate-900">0</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500 font-medium">LOST</p>
                    <p className="text-lg font-bold text-slate-900">0</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-lg rounded-2xl overflow-hidden">
            <CardHeader className="pb-2 sm:pb-3">
              <CardTitle className="text-base sm:text-lg font-bold text-slate-900">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-6 text-slate-500">
                <Trophy className="w-10 h-10 mx-auto mb-2 text-slate-300" />
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
