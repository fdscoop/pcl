# Player Dashboard - Upcoming Matches Fix ✅

## Problem
Upcoming matches were not showing in the player dashboard card because the query was incorrectly using **club IDs** to filter matches, when the `matches` table actually uses **team IDs**.

## Root Cause

### Database Schema
```sql
CREATE TABLE matches (
  id UUID PRIMARY KEY,
  home_team_id UUID REFERENCES teams(id),  -- ❌ NOT club_id
  away_team_id UUID REFERENCES teams(id),  -- ❌ NOT club_id
  -- other fields...
)
```

The matches table stores **team IDs** (not club IDs) because:
- A club can have multiple teams (5-a-side, 7-a-side, 11-a-side)
- Each match is between two specific teams
- Teams belong to clubs via `teams.club_id`

### Incorrect Query (Before Fix)
```typescript
// ❌ WRONG: Trying to use club.id directly on team_id columns
const { data: upcomingData } = await supabase
  .from('matches')
  .select('*, home_team:clubs!home_team_id(club_name, logo_url), away_team:clubs!away_team_id(club_name, logo_url)')
  .or(`home_team_id.eq.${club.id},away_team_id.eq.${club.id}`)  // ❌ club.id won't match team_id
```

This query failed because:
1. `home_team_id` and `away_team_id` are **team IDs**, not club IDs
2. The foreign key join `clubs!home_team_id` is invalid (teams and clubs are different tables)
3. The filter `.or(home_team_id.eq.${club.id})` would never match

## Solution

### Correct Approach (3 Steps)

#### Step 1: Get All Teams for the Player's Club
```typescript
const { data: clubTeams } = await supabase
  .from('teams')
  .select('id, team_name, club_id')
  .eq('club_id', club.id)
  .eq('is_active', true)

const teamIds = clubTeams.map(t => t.id)
```

#### Step 2: Query Matches Using Team IDs
```typescript
const { data: upcomingData } = await supabase
  .from('matches')
  .select(`
    *,
    home_team:teams!matches_home_team_id_fkey(id, team_name, club_id),
    away_team:teams!matches_away_team_id_fkey(id, team_name, club_id)
  `)
  .or(`home_team_id.in.(${teamIds.join(',')}),away_team_id.in.(${teamIds.join(',')})`)
  .eq('status', 'scheduled')
  .gte('match_date', new Date().toISOString().split('T')[0])
  .order('match_date', { ascending: true })
  .limit(5)
```

#### Step 3: Enrich with Club Information
```typescript
// Get unique club IDs from matches
const clubIds = new Set<string>()
matches.forEach(match => {
  if (match.home_team?.club_id) clubIds.add(match.home_team.club_id)
  if (match.away_team?.club_id) clubIds.add(match.away_team.club_id)
})

// Fetch club data
const { data: clubsData } = await supabase
  .from('clubs')
  .select('id, club_name, logo_url')
  .in('id', Array.from(clubIds))

// Map club info to matches
const clubMap = new Map(clubsData.map(c => [c.id, c]))
const enrichedMatches = matches.map(match => ({
  ...match,
  home_team: {
    ...match.home_team,
    club_name: clubMap.get(match.home_team?.club_id)?.club_name,
    logo_url: clubMap.get(match.home_team?.club_id)?.logo_url
  },
  away_team: {
    ...match.away_team,
    club_name: clubMap.get(match.away_team?.club_id)?.club_name,
    logo_url: clubMap.get(match.away_team?.club_id)?.logo_url
  }
}))
```

## Data Flow Diagram

```
Player
  └─> has Contract
        └─> with Club (club_id)
              └─> has Teams (team_id) [5v5, 7v7, 11v11]
                    └─> plays Matches
                          ├─> home_team_id (team)
                          └─> away_team_id (team)
```

## Key Relationships

| Table | Column | References | Purpose |
|-------|--------|------------|---------|
| `contracts` | `club_id` | `clubs.id` | Player's contracted club |
| `teams` | `club_id` | `clubs.id` | Team belongs to club |
| `matches` | `home_team_id` | `teams.id` | Home team in match |
| `matches` | `away_team_id` | `teams.id` | Away team in match |

## Files Changed

### `/apps/web/src/app/dashboard/player/page.tsx`

**Changes:**
1. Added query to fetch all teams for the player's contracted club
2. Updated matches query to use team IDs instead of club ID
3. Proper foreign key joins: `teams!matches_home_team_id_fkey`
4. Added `enrichMatches()` helper to fetch and map club information
5. Fixed lineup checking to use enriched match IDs

## Why This Pattern?

This is the **same pattern** used successfully in:
- ✅ Club Owner Dashboard (`/dashboard/club-owner/page.tsx`)
- ✅ Club Owner Matches Page (`/dashboard/club-owner/matches/page.tsx`)
- ✅ Formations Page (`/dashboard/club-owner/formations/page.tsx`)

## Testing Checklist

- [x] Player with active contract can see upcoming matches
- [x] Matches show correct club names (home and away)
- [x] Matches show correct club logos
- [x] Match dates are filtered correctly (upcoming only)
- [x] Lineup status displays if player is selected
- [x] Recent/past matches also work correctly

## Benefits

✅ **Correct Data Retrieval**: Matches are fetched based on actual team participation  
✅ **Multi-Team Support**: Works when club has teams in different formats (5v5, 7v7, 11v11)  
✅ **Proper Foreign Keys**: Uses correct joins through teams table  
✅ **Consistent Pattern**: Matches club-owner dashboard implementation  
✅ **Scalable**: Handles clubs with multiple teams efficiently  

## Related Documentation

- `DATABASE_TABLES_EXPLANATION.md` - Database schema overview
- `MATCH_SPECIFIC_FORMATIONS_IMPLEMENTATION.md` - Match-team relationship
- `FORMATIONS_PAGE_MATCH_CARDS_OPTIMIZATION.md` - Similar fix for formations page
