# Formations Page Match Cards Optimization

## Overview
Optimized the upcoming match cards in the formations page to display club logos and names instead of just team names, matching the implementation from the club dashboard.

## Changes Made

### 1. Updated Match Interface
Added club-related fields to the `Match` interface:
```typescript
interface Match {
  // ... existing fields
  home_club_name?: string
  away_club_name?: string
  home_club_logo?: string
  away_club_logo?: string
}
```

### 2. Enhanced Data Fetching Logic
Updated the `loadData()` function to enrich match data with club information:

**Process:**
1. Fetch matches with team data
2. Create a map of `team_id` → `club_id` for all teams involved
3. Fetch missing team-to-club mappings for opponent teams
4. Collect all unique club IDs
5. Fetch club data (names and logos) in a single query
6. Enrich matches with club information

**Optimization Benefits:**
- Minimizes database queries (batches club fetches)
- Handles single club vs multiple clubs efficiently
- Works for both home and away matches
- Prevents duplicate club fetches

### 3. Redesigned Match Cards UI

**New Visual Elements:**
- **Club Logos**: Displays both your club and opponent club logos (12x12 rounded images)
- **VS Layout**: Clear visual separation with "VS" between clubs
- **Home/Away Indicator**: Shows "HOME MATCH" or "AWAY MATCH" label
- **Your Club Highlight**: Your club logo has a teal border, opponent has gray
- **Fallback UI**: Shows placeholder with club initial if no logo available
- **Better Date Formatting**: Includes weekday (e.g., "Mon, Jan 5")
- **Improved Spacing**: Border separator between match-up and details

**Before vs After:**
```
BEFORE:
┌─────────────────┐
│ 5-a-side        │
│                 │
│ Away vs         │
│ Team Name       │
│                 │
│ 📅 1/5/2026    │
│ 🕐 09:00       │
└─────────────────┘

AFTER:
┌─────────────────┐
│ 5-a-side        │
│ AWAY MATCH      │
│  🏆    VS   🏆  │
│ Your    Opponent│
│ Club      Club  │
│ ─────────────── │
│ 📅 Mon, Jan 5  │
│ 🕐 09:00       │
└─────────────────┘
```

### 4. Updated Selection Banner
The banner that shows selected match info now displays club names instead of team names.

## Code Structure

### Data Flow
```
1. Fetch matches with team data
   ↓
2. Build team_id → club_id mapping
   ↓
3. Fetch missing opponent team mappings
   ↓
4. Collect all unique club_ids
   ↓
5. Fetch club data (name + logo)
   ↓
6. Enrich matches with club info
   ↓
7. Display in UI with logos
```

### UI Component Breakdown
```jsx
<Card>
  <Header>
    - Format Badge (5/7/11-a-side)
    - Selected Badge (if selected)
  </Header>

  <Match-up>
    - Home/Away Label
    - Your Club (logo + name)
    - VS Separator
    - Opponent Club (logo + name)
  </Match-up>

  <Details>
    - Date (with weekday)
    - Time
    - Stadium
  </Details>
</Card>
```

## Benefits

1. **Visual Clarity**: Club logos make it immediately clear who you're playing against
2. **Professional Look**: Matches the design pattern from the dashboard
3. **Consistent UX**: Same data display pattern across the app
4. **Better Recognition**: Users recognize clubs by logos faster than team names
5. **Optimized Queries**: Batches database fetches efficiently
6. **Fallback Handling**: Gracefully handles missing logos

## Files Modified

- `/apps/web/src/app/dashboard/club-owner/formations/page.tsx`
  - Updated `Match` interface
  - Enhanced `loadData()` function
  - Redesigned match card UI
  - Updated selection banner

## Testing Checklist

- [ ] Match cards display correctly with club logos
- [ ] Fallback UI shows when logo is missing
- [ ] Home/Away indicator shows correctly
- [ ] Your club is highlighted with teal border
- [ ] Opponent club uses gray border
- [ ] Date formatting includes weekday
- [ ] Selected state styling works
- [ ] Banner shows correct club name when selected
- [ ] Multiple matches display correctly in grid
- [ ] Responsive layout works on mobile/tablet/desktop

## Screenshots Reference

Refer to the club dashboard "Next Game" card for the visual design pattern that was replicated.
