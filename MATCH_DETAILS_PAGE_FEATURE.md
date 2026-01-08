# Match Details Page Feature

## Overview

A comprehensive match details page (`/match/[id]`) that provides players and users with complete information about any match including:

- **Team Information** with club logos
- **Match Details** (date, time, venue, format)
- **Win Probability** calculation based on head-to-head history
- **Team Lineups** with player details
- **Formation Visualization** on a football pitch
- **Team Statistics Comparison**
- **Head-to-Head History** with past match results

## Features

### 1. Match Header Card
- Large club logos for both teams
- Match date, time, and venue information
- Match format badge (5v5, 7v7, 11v11)
- Status badge (scheduled, ongoing, completed)
- Score display for completed matches
- **Win Probability Bar** showing predicted outcome

### 2. Tabs Navigation

#### Overview Tab
- Match information (format, type, league)
- Team formations display
- Quick stats summary (wins, draws, goals)

#### Lineups Tab
- Starting XI for both teams
- Substitute players
- Player jersey numbers
- Player positions
- Goals scored badge for each player
- **Formation Visualization** - Interactive pitch view

#### Stats Tab
- Goals scored comparison
- Wins comparison
- Win rate percentage
- Visual bar charts

#### Head-to-Head Tab
- Previous matches history
- Scores and results
- Clickable to view past match details

### 3. Formation Visualization Component
- Football pitch with accurate markings
- Player positions based on formation (e.g., 4-3-3, 4-4-2)
- Jersey numbers displayed
- Player names shown
- Home team on bottom half (blue)
- Away team on top half (red)

## Win Probability Calculation

The win probability is calculated based on:
1. Historical head-to-head results
2. Home wins, away wins, and draws
3. Minimum 10% baseline probability to prevent 0%

```typescript
const calculateWinProbability = () => {
  const total = headToHead.total_matches
  const homeWinRate = (headToHead.home_wins / total) * 100
  const awayWinRate = (headToHead.away_wins / total) * 100
  const drawRate = (headToHead.draws / total) * 100
  // ... normalized to 100%
}
```

## Database Queries

The page fetches data from multiple tables:
- `matches` - Match details
- `teams` - Team information
- `clubs` - Club details with logos
- `stadiums` - Venue information
- `team_lineups` - Formation and lineup info
- `team_lineup_players` - Players in lineup
- `players` - Player details
- `users` - Player names

## Navigation

### From Player Dashboard
Match cards in the "Upcoming Matches" section are now:
- **Clickable** - navigates to `/match/{matchId}`
- Display **club logos** for both teams
- Show "View Details →" hint

### Back Navigation
- "Back" button returns to previous page
- Sticky header with status badge

## Files Changed

### New Files
- `/apps/web/src/app/match/[id]/page.tsx` - Main match details page

### Modified Files
- `/apps/web/src/app/dashboard/player/page.tsx`
  - Added club logos to match cards
  - Made match cards clickable
  - Added navigation to match details

## UI Components Used

- Card, CardHeader, CardContent, CardTitle, CardDescription
- Badge
- Button
- Tabs, TabsList, TabsTrigger, TabsContent
- Various Lucide icons

## Responsive Design

- Mobile-first design
- Flexible grid layouts
- Truncated text for long names
- Compact view on small screens
- Full pitch visualization on larger screens

## Future Enhancements

1. **News Section** - Related match news and updates
2. **Coach Details** - Manager/coach information
3. **Player Ratings** - Individual performance ratings
4. **Live Updates** - Real-time score updates
5. **Match Events** - Goals, cards, substitutions timeline
6. **Weather Widget** - Weather forecast for match day
7. **Social Sharing** - Share match details
8. **Notifications** - Match reminders

## Access

This page is **public** and accessible to:
- Players viewing their upcoming matches
- Club owners checking match details
- Fans following team matches
- Anyone with the match URL
