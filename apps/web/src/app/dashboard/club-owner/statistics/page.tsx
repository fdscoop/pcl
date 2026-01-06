'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Trophy, Target, TrendingUp, Award, Clock, Calendar } from 'lucide-react';

interface ClubStats {
  id: string;
  club_name: string;
  club_rating: number;
  trophies_won: number;
  total_matches: number;
  total_wins: number;
  total_draws: number;
  total_losses: number;
  total_goals_scored: number;
  total_goals_conceded: number;
}

interface Match {
  id: string;
  match_date: string;
  match_time: string;
  match_format: string;
  match_type: 'friendly' | 'official' | null;
  league_structure: 'hobby' | 'amateur' | 'intermediate' | 'professional' | 'tournament' | 'friendly' | null;
  tournament_id: string | null;
  tournament?: {
    tournament_name: string;
    league_structure: string;
  } | null;
  status: string;
  home_team_score: number | null;
  away_team_score: number | null;
  home_team: {
    team_name: string;
    club: {
      club_name: string;
    };
  };
  away_team: {
    team_name: string;
    club: {
      club_name: string;
    };
  };
}

interface TopPlayer {
  id: string;
  user: {
    first_name: string;
    last_name: string;
  };
  position: string;
  player_rating: number;
  total_goals_scored: number;
  total_assists: number;
  total_matches_played: number;
  man_of_match_awards: number;
}

// Helper function to calculate time remaining until match
function getTimeUntilMatch(matchDate: string, matchTime: string): string {
  const matchDateTime = new Date(`${matchDate}T${matchTime}`);
  const now = new Date();
  const diff = matchDateTime.getTime() - now.getTime();

  if (diff < 0) return 'Match time passed';

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (days > 0) {
    return `${days}d ${hours}h`;
  } else if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else {
    return `${minutes}m`;
  }
}

// Helper function to format relative date
function getRelativeDate(matchDate: string): string {
  const date = new Date(matchDate);
  const now = new Date();
  const diffTime = date.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Tomorrow';
  if (diffDays === -1) return 'Yesterday';
  if (diffDays > 1 && diffDays <= 7) return `In ${diffDays} days`;
  if (diffDays < -1 && diffDays >= -7) return `${Math.abs(diffDays)} days ago`;
  
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// Helper function to get tournament type styling
function getTournamentTypeStyle(match: { 
  tournament_id: string | null; 
  tournament?: { league_structure: string } | null; 
  match_format: string;
  match_type: 'friendly' | 'official' | null;
  league_structure: 'hobby' | 'amateur' | 'intermediate' | 'professional' | 'tournament' | 'friendly' | null;
}): { 
  label: string; 
  bgColor: string; 
  textColor: string; 
  icon: string;
  show: boolean;
} {
  // Priority 1: If there's a tournament_id, use the tournament's league_structure
  if (match.tournament_id && match.tournament) {
    const leagueStructure = match.tournament.league_structure.toLowerCase();
    
    switch (leagueStructure) {
      case 'friendly':
        return {
          label: 'Friendly Tournament',
          bgColor: 'bg-green-100',
          textColor: 'text-green-700',
          icon: '🤝',
          show: true
        };
      case 'hobby':
        return {
          label: 'Hobby League',
          bgColor: 'bg-blue-100',
          textColor: 'text-blue-700',
          icon: '🎯',
          show: true
        };
      case 'tournament':
        return {
          label: 'Tournament',
          bgColor: 'bg-amber-100',
          textColor: 'text-amber-700',
          icon: '🏆',
          show: true
        };
      case 'amateur':
        return {
          label: 'Amateur League',
          bgColor: 'bg-cyan-100',
          textColor: 'text-cyan-700',
          icon: '⭐',
          show: true
        };
      case 'intermediate':
        return {
          label: 'Intermediate League',
          bgColor: 'bg-indigo-100',
          textColor: 'text-indigo-700',
          icon: '🎖️',
          show: true
        };
      case 'professional':
        return {
          label: 'Professional League',
          bgColor: 'bg-purple-100',
          textColor: 'text-purple-700',
          icon: '👑',
          show: true
        };
      default:
        return {
          label: 'Tournament',
          bgColor: 'bg-amber-100',
          textColor: 'text-amber-700',
          icon: '🏆',
          show: true
        };
    }
  }
  
  // Priority 2: Use match_type (friendly vs official)
  if (match.match_type === 'friendly') {
    return {
      label: 'Friendly Match',
      bgColor: 'bg-green-100',
      textColor: 'text-green-700',
      icon: '🤝',
      show: true
    };
  }
  
  // Priority 3: If official match, check league_structure
  if (match.match_type === 'official' && match.league_structure) {
    const leagueStructure = match.league_structure.toLowerCase();
    
    switch (leagueStructure) {
      case 'hobby':
        return {
          label: 'Hobby League',
          bgColor: 'bg-blue-100',
          textColor: 'text-blue-700',
          icon: '🎯',
          show: true
        };
      case 'amateur':
        return {
          label: 'Amateur League',
          bgColor: 'bg-cyan-100',
          textColor: 'text-cyan-700',
          icon: '⭐',
          show: true
        };
      case 'intermediate':
        return {
          label: 'Intermediate League',
          bgColor: 'bg-indigo-100',
          textColor: 'text-indigo-700',
          icon: '🎖️',
          show: true
        };
      case 'professional':
        return {
          label: 'Professional League',
          bgColor: 'bg-purple-100',
          textColor: 'text-purple-700',
          icon: '👑',
          show: true
        };
      case 'tournament':
        return {
          label: 'Tournament',
          bgColor: 'bg-amber-100',
          textColor: 'text-amber-700',
          icon: '🏆',
          show: true
        };
      default:
        return {
          label: 'Official Match',
          bgColor: 'bg-red-100',
          textColor: 'text-red-700',
          icon: '⚡',
          show: true
        };
    }
  }
  
  // Default: Official match without specific classification
  return {
    label: 'Official Match',
    bgColor: 'bg-red-100',
    textColor: 'text-red-700',
    icon: '⚡',
    show: true
  };
}

// Helper function to get match format styling
function getMatchFormatStyle(format: string): { label: string; bgColor: string; textColor: string; icon: string } {
  const formatLower = format.toLowerCase();
  
  if (formatLower.includes('5-a-side') || formatLower === '5-a-side') {
    return {
      label: '5-a-side',
      bgColor: 'bg-blue-100',
      textColor: 'text-blue-700',
      icon: '⚽'
    };
  } else if (formatLower.includes('7-a-side') || formatLower === '7-a-side') {
    return {
      label: '7-a-side',
      bgColor: 'bg-purple-100',
      textColor: 'text-purple-700',
      icon: '⚽'
    };
  } else if (formatLower.includes('11-a-side') || formatLower === '11-a-side') {
    return {
      label: '11-a-side',
      bgColor: 'bg-green-100',
      textColor: 'text-green-700',
      icon: '⚽'
    };
  } else if (formatLower === 'friendly') {
    return {
      label: 'Friendly',
      bgColor: 'bg-yellow-100',
      textColor: 'text-yellow-700',
      icon: '🤝'
    };
  } else {
    return {
      label: format,
      bgColor: 'bg-gray-100',
      textColor: 'text-gray-700',
      icon: '⚽'
    };
  }
}

export default function PerformancePage() {
  const [loading, setLoading] = useState(true);
  const [clubData, setClubData] = useState<ClubStats | null>(null);
  const [upcomingMatches, setUpcomingMatches] = useState<Match[]>([]);
  const [pastMatches, setPastMatches] = useState<Match[]>([]);
  const [topPlayers, setTopPlayers] = useState<TopPlayer[]>([]);
  const [clubTeamIds, setClubTeamIds] = useState<string[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const supabase = createClient();

  // Update current time every minute for countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Fetch club data with performance stats
        const { data: club, error: clubError } = await supabase
          .from('clubs')
          .select('*')
          .eq('owner_id', user.id)
          .single();

        if (clubError) {
          console.error('Error fetching club:', clubError);
        } else {
          setClubData(club);
          
          // Fetch teams for this club
          const { data: teams } = await supabase
            .from('teams')
            .select('id')
            .eq('club_id', club.id);

          if (teams && teams.length > 0) {
            const teamIds = teams.map(t => t.id);
            setClubTeamIds(teamIds);

            // Fetch all matches (we'll filter client-side based on date)
            const { data: allMatches } = await supabase
              .from('matches')
              .select(`
                id,
                match_date,
                match_time,
                match_format,
                match_type,
                league_structure,
                tournament_id,
                tournament:tournaments(
                  tournament_name,
                  league_structure
                ),
                status,
                home_team_score,
                away_team_score,
                home_team_id,
                away_team_id,
                home_team:teams!matches_home_team_id_fkey(
                  team_name,
                  club:clubs(club_name)
                ),
                away_team:teams!matches_away_team_id_fkey(
                  team_name,
                  club:clubs(club_name)
                )
              `)
              .or(`home_team_id.in.(${teamIds.join(',')}),away_team_id.in.(${teamIds.join(',')})`)
              .order('match_date', { ascending: false })
              .order('match_time', { ascending: false });

            if (allMatches) {
              // Transform the data to match our interface
              const transformedMatches = allMatches.map((m: any) => ({
                ...m,
                tournament: Array.isArray(m.tournament) ? m.tournament[0] : m.tournament,
                home_team: Array.isArray(m.home_team) ? m.home_team[0] : m.home_team,
                away_team: Array.isArray(m.away_team) ? m.away_team[0] : m.away_team,
              })).map((m: any) => ({
                ...m,
                home_team: {
                  team_name: m.home_team?.team_name || '',
                  club: Array.isArray(m.home_team?.club) ? m.home_team.club[0] : m.home_team?.club,
                },
                away_team: {
                  team_name: m.away_team?.team_name || '',
                  club: Array.isArray(m.away_team?.club) ? m.away_team.club[0] : m.away_team?.club,
                },
              }));

              // Filter matches based on date/time and status
              const now = new Date();
              const upcoming: Match[] = [];
              const past: Match[] = [];

              transformedMatches.forEach((match: Match) => {
                const matchDateTime = new Date(`${match.match_date}T${match.match_time}`);
                
                // If match is completed OR date has passed, it goes to past
                if (match.status === 'completed' || matchDateTime < now) {
                  past.push(match);
                } else {
                  // Otherwise it's upcoming
                  upcoming.push(match);
                }
              });

              // Sort upcoming by date ascending (soonest first)
              upcoming.sort((a, b) => {
                const dateA = new Date(`${a.match_date}T${a.match_time}`);
                const dateB = new Date(`${b.match_date}T${b.match_time}`);
                return dateA.getTime() - dateB.getTime();
              });

              // Past matches already sorted by date descending (most recent first)
              setUpcomingMatches(upcoming.slice(0, 5));
              setPastMatches(past.slice(0, 5));
            }
          }

          // Fetch top players from this club
          const { data: players } = await supabase
            .from('players')
            .select(`
              id,
              position,
              player_rating,
              total_goals_scored,
              total_assists,
              total_matches_played,
              man_of_match_awards,
              user:users(first_name, last_name)
            `)
            .eq('current_club_id', club.id)
            .order('player_rating', { ascending: false })
            .limit(5);

          if (players) {
            // Transform the data to match our interface
            const transformedPlayers = players.map((p: any) => ({
              ...p,
              user: Array.isArray(p.user) ? p.user[0] : p.user,
            }));
            setTopPlayers(transformedPlayers);
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
      </div>
    );
  }

  const goalDifference = (clubData?.total_goals_scored || 0) - (clubData?.total_goals_conceded || 0);
  const winRate = clubData?.total_matches ? ((clubData.total_wins / clubData.total_matches) * 100).toFixed(1) : '0';

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Club Performance</h1>
          <p className="text-gray-600 mt-1">{clubData?.club_name || 'Your Club'}</p>
        </div>
        <div className="flex items-center gap-2 bg-gradient-to-r from-teal-500 to-teal-600 text-white px-6 py-3 rounded-xl shadow-lg">
          <Award className="w-6 h-6" />
          <div className="text-left">
            <div className="text-xs opacity-90">Club Rating</div>
            <div className="text-2xl font-bold">{clubData?.club_rating?.toFixed(1) || '0.0'}</div>
          </div>
        </div>
      </div>

      {/* Key Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 font-medium">Total Matches</p>
                <p className="text-3xl font-bold text-blue-900">{clubData?.total_matches || 0}</p>
              </div>
              <Target className="w-10 h-10 text-blue-500 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600 font-medium">Win Rate</p>
                <p className="text-3xl font-bold text-green-900">{winRate}%</p>
              </div>
              <TrendingUp className="w-10 h-10 text-green-500 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-600 font-medium">Goal Difference</p>
                <p className={`text-3xl font-bold ${goalDifference >= 0 ? 'text-green-900' : 'text-red-900'}`}>
                  {goalDifference > 0 ? '+' : ''}{goalDifference}
                </p>
              </div>
              <Target className="w-10 h-10 text-purple-500 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-yellow-600 font-medium">Trophies</p>
                <p className="text-3xl font-bold text-yellow-900">{clubData?.trophies_won || 0}</p>
              </div>
              <Trophy className="w-10 h-10 text-yellow-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Match Statistics */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Target className="w-5 h-5 text-teal-600" />
              Match Statistics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Total Matches:</span>
                <span className="font-semibold text-lg">{clubData?.total_matches || 0}</span>
              </div>
              <div className="h-px bg-gray-200"></div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Wins:</span>
                <span className="font-semibold text-green-600 text-lg">{clubData?.total_wins || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Draws:</span>
                <span className="font-semibold text-yellow-600 text-lg">{clubData?.total_draws || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Losses:</span>
                <span className="font-semibold text-red-600 text-lg">{clubData?.total_losses || 0}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Goals Statistics */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Trophy className="w-5 h-5 text-teal-600" />
              Goals Statistics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Goals Scored:</span>
                <span className="font-semibold text-green-600 text-lg">{clubData?.total_goals_scored || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Goals Conceded:</span>
                <span className="font-semibold text-red-600 text-lg">{clubData?.total_goals_conceded || 0}</span>
              </div>
              <div className="h-px bg-gray-200"></div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Goal Difference:</span>
                <span className={`font-bold text-xl ${goalDifference >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {goalDifference > 0 ? '+' : ''}{goalDifference}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Avg Goals/Match:</span>
                <span className="font-semibold text-lg">
                  {clubData?.total_matches ? (clubData.total_goals_scored / clubData.total_matches).toFixed(2) : '0.00'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Club Rating & Achievements */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Award className="w-5 h-5 text-teal-600" />
              Rating & Achievements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Overall Rating:</span>
                <span className="font-bold text-2xl text-teal-600">{clubData?.club_rating?.toFixed(1) || '0.0'}</span>
              </div>
              <div className="h-px bg-gray-200"></div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Trophies Won:</span>
                <span className="font-semibold text-yellow-600 text-lg flex items-center gap-1">
                  <Trophy className="w-4 h-4" />
                  {clubData?.trophies_won || 0}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Win Rate:</span>
                <span className="font-semibold text-lg">{winRate}%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Players */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Award className="w-5 h-5 text-teal-600" />
            Top Performing Players
          </CardTitle>
        </CardHeader>
        <CardContent>
          {topPlayers.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-2 text-sm font-semibold text-gray-700">Player</th>
                    <th className="text-left py-3 px-2 text-sm font-semibold text-gray-700">Position</th>
                    <th className="text-center py-3 px-2 text-sm font-semibold text-gray-700">Rating</th>
                    <th className="text-center py-3 px-2 text-sm font-semibold text-gray-700">Matches</th>
                    <th className="text-center py-3 px-2 text-sm font-semibold text-gray-700">Goals</th>
                    <th className="text-center py-3 px-2 text-sm font-semibold text-gray-700">Assists</th>
                    <th className="text-center py-3 px-2 text-sm font-semibold text-gray-700">MOTM</th>
                  </tr>
                </thead>
                <tbody>
                  {topPlayers.map((player, idx) => (
                    <tr key={player.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-2">
                        <div className="flex items-center gap-2">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                            idx === 0 ? 'bg-yellow-400 text-yellow-900' :
                            idx === 1 ? 'bg-gray-300 text-gray-700' :
                            idx === 2 ? 'bg-orange-400 text-orange-900' :
                            'bg-gray-200 text-gray-600'
                          }`}>
                            {idx + 1}
                          </div>
                          <span className="font-medium">{player.user.first_name} {player.user.last_name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-2 text-sm text-gray-600">{player.position || 'N/A'}</td>
                      <td className="py-3 px-2 text-center">
                        <span className="font-semibold text-teal-600">{player.player_rating?.toFixed(1) || '0.0'}</span>
                      </td>
                      <td className="py-3 px-2 text-center text-sm">{player.total_matches_played || 0}</td>
                      <td className="py-3 px-2 text-center text-sm font-semibold text-green-600">{player.total_goals_scored || 0}</td>
                      <td className="py-3 px-2 text-center text-sm font-semibold text-blue-600">{player.total_assists || 0}</td>
                      <td className="py-3 px-2 text-center text-sm font-semibold text-yellow-600">{player.man_of_match_awards || 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">No players in your club yet</p>
              <p className="text-sm text-gray-400 mt-2">Recruit players to see their performance here</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upcoming & Past Matches Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-teal-50 to-blue-50 border-b border-teal-100">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Calendar className="w-5 h-5 text-teal-600" />
              Upcoming Matches
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            {upcomingMatches.length > 0 ? (
              <div className="space-y-3">
                {upcomingMatches.map((match, index) => {
                  const timeRemaining = getTimeUntilMatch(match.match_date, match.match_time);
                  const relativeDate = getRelativeDate(match.match_date);
                  const formatStyle = getMatchFormatStyle(match.match_format);
                  const tournamentType = getTournamentTypeStyle(match);
                  const isNext = index === 0;
                  
                  return (
                    <div 
                      key={match.id} 
                      className={`p-4 rounded-lg transition-all hover:shadow-md ${
                        isNext 
                          ? 'bg-gradient-to-r from-teal-500 to-blue-500 text-white shadow-lg transform hover:scale-[1.02]' 
                          : 'bg-gray-50 hover:bg-gray-100'
                      }`}
                    >
                      {/* Date and Countdown */}
                      <div className="flex justify-between items-center mb-3">
                        <div className="flex items-center gap-2">
                          <Clock className={`w-4 h-4 ${isNext ? 'text-white' : 'text-teal-600'}`} />
                          <span className={`text-xs font-semibold ${isNext ? 'text-white' : 'text-gray-700'}`}>
                            {relativeDate}
                          </span>
                        </div>
                        <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                          isNext 
                            ? 'bg-white/20 text-white' 
                            : 'bg-teal-100 text-teal-700'
                        }`}>
                          {timeRemaining}
                        </span>
                      </div>

                      {/* Match Type and Format Badges */}
                      <div className="mb-3 flex flex-wrap gap-2">
                        {/* Tournament Type Badge */}
                        {tournamentType.show && (
                          <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${
                            isNext 
                              ? 'bg-white/30 text-white border border-white/40' 
                              : `${tournamentType.bgColor} ${tournamentType.textColor}`
                          }`}>
                            <span>{tournamentType.icon}</span>
                            <span>{tournamentType.label}</span>
                          </span>
                        )}
                        
                        {/* Match Format Badge */}
                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${
                          isNext 
                            ? 'bg-white/20 text-white' 
                            : `${formatStyle.bgColor} ${formatStyle.textColor}`
                        }`}>
                          <span>{formatStyle.icon}</span>
                          <span>{formatStyle.label}</span>
                        </span>
                      </div>

                      {/* Match Info */}
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex-1 text-right">
                          <span className={`text-sm font-bold ${isNext ? 'text-white' : 'text-gray-900'}`}>
                            {match.home_team.club.club_name}
                          </span>
                        </div>
                        <div className={`px-3 py-1 rounded-lg font-bold text-xs ${
                          isNext 
                            ? 'bg-white/20 text-white' 
                            : 'bg-white text-gray-600'
                        }`}>
                          VS
                        </div>
                        <div className="flex-1">
                          <span className={`text-sm font-bold ${isNext ? 'text-white' : 'text-gray-900'}`}>
                            {match.away_team.club.club_name}
                          </span>
                        </div>
                      </div>

                      {/* Time */}
                      <div className={`mt-2 text-center text-xs ${isNext ? 'text-white/80' : 'text-gray-500'}`}>
                        Kickoff: {match.match_time}
                      </div>

                      {isNext && (
                        <div className="mt-3 pt-3 border-t border-white/20 text-center">
                          <span className="text-xs font-semibold text-white/90">⚡ NEXT MATCH</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 font-medium">No upcoming matches scheduled</p>
                <p className="text-sm text-gray-400 mt-1">Check the Matches tab to schedule new matches</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b border-green-100">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Trophy className="w-5 h-5 text-green-600" />
              Recent Results
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            {pastMatches.length > 0 ? (
              <div className="space-y-3">
                {pastMatches.map((match, index) => {
                  const relativeDate = getRelativeDate(match.match_date);
                  const formatStyle = getMatchFormatStyle(match.match_format);
                  const tournamentType = getTournamentTypeStyle(match);
                  const isLatest = index === 0;
                  const homeScore = match.home_team_score ?? 0;
                  const awayScore = match.away_team_score ?? 0;
                  
                  // Determine result (assuming first team in list is the club's team)
                  let resultBadge = '';
                  let resultColor = '';
                  
                  if (homeScore > awayScore) {
                    resultBadge = 'W';
                    resultColor = 'bg-green-100 text-green-700';
                  } else if (homeScore < awayScore) {
                    resultBadge = 'L';
                    resultColor = 'bg-red-100 text-red-700';
                  } else {
                    resultBadge = 'D';
                    resultColor = 'bg-yellow-100 text-yellow-700';
                  }
                  
                  return (
                    <div 
                      key={match.id} 
                      className={`p-4 rounded-lg transition-all ${
                        isLatest 
                          ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 shadow-md' 
                          : 'bg-gray-50 hover:bg-gray-100'
                      }`}
                    >
                      {/* Date and Status */}
                      <div className="flex justify-between items-center mb-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-xs font-medium ${isLatest ? 'text-green-700' : 'text-gray-500'}`}>
                            {relativeDate}
                          </span>
                          {/* Tournament Type Badge */}
                          {tournamentType.show && (
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${tournamentType.bgColor} ${tournamentType.textColor}`}>
                              <span>{tournamentType.icon}</span>
                              <span>{tournamentType.label}</span>
                            </span>
                          )}
                          {/* Match Format Badge */}
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${formatStyle.bgColor} ${formatStyle.textColor}`}>
                            <span>{formatStyle.icon}</span>
                            <span>{formatStyle.label}</span>
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {isLatest && (
                            <span className="text-xs font-bold bg-green-500 text-white px-2 py-1 rounded">
                              LATEST
                            </span>
                          )}
                          <span className={`text-xs font-semibold px-2 py-1 rounded ${resultColor}`}>
                            {resultBadge}
                          </span>
                        </div>
                      </div>

                      {/* Score */}
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex-1 text-right">
                          <span className={`text-sm font-bold ${isLatest ? 'text-gray-900' : 'text-gray-700'}`}>
                            {match.home_team.club.club_name}
                          </span>
                        </div>
                        <div className={`flex items-center gap-3 px-4 py-2 rounded-lg ${
                          isLatest ? 'bg-white shadow-sm' : 'bg-white'
                        }`}>
                          <span className={`font-bold text-xl ${
                            homeScore > awayScore ? 'text-green-600' : homeScore < awayScore ? 'text-red-600' : 'text-gray-600'
                          }`}>
                            {homeScore}
                          </span>
                          <span className="text-gray-400 font-bold">-</span>
                          <span className={`font-bold text-xl ${
                            awayScore > homeScore ? 'text-green-600' : awayScore < homeScore ? 'text-red-600' : 'text-gray-600'
                          }`}>
                            {awayScore}
                          </span>
                        </div>
                        <div className="flex-1">
                          <span className={`text-sm font-bold ${isLatest ? 'text-gray-900' : 'text-gray-700'}`}>
                            {match.away_team.club.club_name}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <Trophy className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 font-medium">No past matches available</p>
                <p className="text-sm text-gray-400 mt-1">Match history will appear here once matches are completed</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
