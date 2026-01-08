# Player Matches Page - Optimized with Dynamic Data

## Summary
Successfully optimized the player matches page (`/dashboard/player/matches`) with dynamic data from the database, using the **same logic as the main player dashboard** to fetch both upcoming and completed matches.

## Critical Fix: Upcoming Matches Now Show Correctly

### The Problem
- **Before**: Queried via `team_lineup_players` which only returns matches where lineups already exist
- **Result**: Upcoming matches didn't show because lineups aren't created until closer to match time

### The Solution  
- **After**: Uses the same approach as the main dashboard:
  1. Get player's active contract
  2. Find their club
  3. Get all teams in that club
  4. Fetch ALL matches for those teams (upcoming + completed)
  5. Separately fetch player stats for completed matches via lineups

### Why This Works
- Shows upcoming matches even before lineups are created ✅
- Shows all club matches the player might participate in ✅
- Still displays accurate player stats for completed matches ✅

## Key Improvements

### 1. **Dynamic Match Data Loading (Same as Dashboard)**
- Uses player's active contract → club → teams → matches approach
- Fetches ALL matches for the player's club teams (both scheduled and completed)
- Shows upcoming matches immediately, regardless of lineup status
- Retrieves player performance stats only for completed matches where they were in lineup
- Matches are ordered by date (most recent first)

### 2. **Match Query Strategy**
```typescript
// 1. Get player's active contract and club
const { data: activeContract } = await supabase
  .from('contracts')
  .select('*, clubs(*)')
  .eq('player_id', playerData.id)
  .eq('status', 'active')
  .single()

// 2. Get all teams in that club
const { data: clubTeams } = await supabase
  .from('teams')
  .select('id, name, club_id')
  .eq('club_id', activeContract.clubs.id)
  .eq('is_active', true)

// 3. Get all matches where those teams play
const { data: matchesData } = await supabase
  .from('matches')
  .select(`
    *,
    home_team:teams!matches_home_team_id_fkey(id, name, club_id),
    away_team:teams!matches_away_team_id_fkey(id, name, club_id),
    stadiums(name)
  `)
  .or(`home_team_id.in.(${teamIds.join(',')}),away_team_id.in.(${teamIds.join(',')})`)
  .order('match_date', { ascending: false })

// 4. Get player stats for completed matches (via lineup participation)
const { data: lineupStats } = await supabase
  .from('team_lineup_players')
  .select(`
    goals, assists, minutes_played, yellow_cards, red_cards, rating,
    lineup:team_lineups!inner(match_id)
  `)
  .eq('player_id', playerData.id)

// 5. Map stats to matches
playerStatsMap.set(lineup.match_id, stats)
```

### 3. **Enhanced Navigation UX**
- Added toast notifications for match navigation (like main dashboard)
- Shows team names and dates instead of raw match IDs
- Implemented loading states on buttons with "Opening..." text
- Smooth navigation with 500ms delay for better UX
- Toast format: `{ title, description, type }`

### 4. **Gradient Badge Design**
- **Upcoming/Scheduled**: Blue gradient with shadow (`from-blue-500 to-blue-600`)
- **Live/In Progress**: Green gradient with pulse animation (`from-green-500 to-emerald-600`)
- **Completed**: Gray gradient (`from-gray-600 to-gray-700`)
- **Postponed**: Yellow-orange gradient (`from-yellow-500 to-orange-600`)
- **Cancelled**: Red gradient (`from-red-500 to-red-600`)

### 5. **Improved Match Display**
- Upcoming matches filter now includes both 'upcoming' and 'scheduled' statuses
- Completed matches show player performance stats with color-coded icons:
  - 🎯 Goals (green)
  - ⚡ Assists (blue)
  - ⏱️ Minutes (purple)
  - ⭐ Rating (amber)
- Added empty states with icons for both upcoming and completed tabs
- Enhanced player stats display with `font-medium` for better readability
- Shows tournament/league name when available

## Technical Details

### Data Flow
1. **Auth Check**: Verify user is logged in
2. **Player Stats**: Load aggregate stats from `players` table
3. **Active Contract**: Find player's current club via active contract
4. **Club Teams**: Get all teams belonging to that club
5. **All Matches**: Fetch matches where club teams play (home OR away)
6. **Player Stats**: Get individual match stats via lineup participation
7. **Transform**: Combine match data with player stats into Match objects

### Interface Updates
```typescript
interface Match {
  id: string
  match_date: string
  match_time: string
  home_team: string
  away_team: string
  home_team_id: string  // For database queries
  away_team_id: string  // For database queries
  venue: string
  status: 'upcoming' | 'live' | 'completed' | 'scheduled' | 'in_progress' | 'postponed' | 'cancelled'
  home_score?: number
  away_score?: number
  tournament?: string
  player_stats?: {
    goals: number
    assists: number
    minutes_played: number
    yellow_cards: number
    red_cards: number
    rating?: number
  }
}
```

### Performance Optimization
- Single query for all matches (no N+1 problem)
- Player stats fetched in one query, then mapped by match_id
- Team names included in match query via foreign key joins
- Stadium names included via nested select

## Features

### Three-Tab Layout
1. **Upcoming Tab**
   - Shows scheduled and upcoming matches for player's club
   - Displays match date, time, venue
   - "View Details" button navigates to match page with toast notification
   - Empty state: "No Upcoming Matches" with helpful message
   - Works even before lineups are created ✅

2. **Completed Tab**
   - Shows past matches with final scores
   - Displays player performance stats (if player was in lineup)
   - Color-coded stat icons for quick scanning
   - "Match Report" button for detailed view
   - Empty state: "No Completed Matches" for new players

3. **Statistics Tab**
   - Performance statistics card (matches, goals, assists, rating, minutes)
   - Achievements & Records card (MOTM, cards, goals per match)
   - Two-column grid layout on large screens
   - Responsive single column on mobile

## Files Modified
- `/apps/web/src/app/dashboard/player/matches/page.tsx` - Complete rewrite of match loading logic

## Dependencies
- `@/context/ToastContext` - Toast notifications (object format)
- `@/lib/supabase/client` - Database client
- `@/components/ui/*` - UI components (ModernCard, ModernButton, Badge, Tabs)
- `lucide-react` - Icons (Calendar, Trophy, Target, Star, etc.)

## Testing Recommendations
1. ✅ **Verify upcoming matches show for players with active contracts**
2. ✅ **Test with player who has no contract (should show empty state)**
3. ✅ **Confirm matches appear before lineups are created**
4. Test navigation to match details page
5. Confirm toast notifications appear properly
6. Validate player stats display correctly for completed matches
7. Test responsive design on mobile devices
8. Verify gradient badges render properly for all match statuses
9. Check performance with players in clubs with many matches

## Comparison with Dashboard

### Main Dashboard (`/dashboard/player`)
- Shows up to 5 upcoming matches
- Shows up to 5 recent completed matches
- Focused on quick overview

### Matches Page (`/dashboard/player/matches`)
- Shows ALL matches for the player's club
- Three-tab organization (upcoming, completed, stats)
- Detailed player performance for each match
- Comprehensive statistics view

**Both use identical data fetching logic** ✅

## Future Enhancements
- Add pagination for clubs with many matches
- Implement tournament/league filtering
- Add match search by opponent or date
- Show match highlights/videos
- Add comparison with team averages
- Export stats to PDF/CSV
- Season-wise statistics breakdown
- Filter by match status (scheduled, live, completed)
- Show player's position in each match
- Display match formation/tactics

## Notes
- ✅ **FIXED**: Upcoming matches now show correctly using club-based query
- All static sample data has been removed
- Empty state messages guide users when no matches are found
- The page gracefully handles missing data with fallback values
- Player stats only shown for matches where they actually played
- Matches without player participation still visible (club context)
- Toast context uses object format: `{ title, description, type }`
- Gradient badges enhance visual hierarchy and match status recognition
- Consistent UX with main player dashboard
