# Match-Specific Formations Implementation

## Overview
This implementation adds the ability to create and manage match-specific formations in addition to reusable formation templates.

## Changes Made

### 1. Database Migration (`014_add_match_id_to_team_lineups.sql`)

**New Column:**
- Added `match_id` column to `team_lineups` table (nullable UUID, references `matches.id`)
- When `match_id` is NULL: lineup is a reusable template
- When `match_id` is set: lineup is specific to that match

**Validation:**
- Created `validate_lineup_match_format()` function to ensure lineup format matches match format
- Added trigger to enforce this validation on INSERT/UPDATE

**Performance:**
- Added index `idx_team_lineups_match_id` for faster match lineup queries

**New View:**
- Created `match_lineup_overview` view for easy querying of match lineups with match details

### 2. Formations Page (`apps/web/src/app/dashboard/club-owner/formations/page.tsx`)

**New Features:**
- Fetches upcoming matches for the team
- Displays upcoming matches in a card grid
- Allows selecting a match to build formation for
- Visual indication of selected match
- Passes `matchId` and `matchFormat` to FormationBuilder component

**UI Components:**
- Match cards showing:
  - Match format badge (5-a-side, 7-a-side, 11-a-side)
  - Opponent team name
  - Match date and time
  - Stadium location
  - Home/Away indicator
  - Selected state indicator

**State Management:**
- `matches`: Array of upcoming matches
- `selectedMatch`: Currently selected match (or null for template formations)

### 3. FormationBuilder Component (`apps/web/src/components/FormationBuilder.tsx`)

**New Props:**
- `matchId?: string` - ID of the selected match
- `matchFormat?: string` - Format of the selected match (5-a-side, 7-a-side, 11-a-side)

**Auto-Format Selection:**
- When a match is selected, automatically switches to the match's format
- Updates formation selection to default for that format

**Save Functionality:**
- Updated `saveLineup()` to include `match_id` when saving
- Queries check for existing lineup by team + format + match_id
- Match-specific lineups and templates are stored separately

**Load Functionality:**
- Updated `loadLatestLineupForFormat()` to consider `matchId`
- Prioritizes match-specific lineup when match is selected
- Falls back to template when no match is selected
- Auto-loads lineup when match selection changes

**useEffect Updates:**
- Added effect to auto-select format when match is selected
- Updated lineup loading effect to trigger when `matchId` changes

## How It Works

### Creating a Formation Template (No Match Selected)
1. User goes to formations page
2. No match is selected
3. User builds formation for any available format
4. Saves with a name
5. Lineup is saved with `match_id = NULL` (reusable template)

### Creating a Match-Specific Formation
1. User goes to formations page
2. User clicks on an upcoming match card
3. Match is selected, format auto-switches to match format
4. Existing match lineup loads (if one exists)
5. User builds/modifies formation
6. Saves with a name
7. Lineup is saved with `match_id = <match.id>` (match-specific)

### Benefits

1. **Match Preparation**: Club owners can prepare specific formations for upcoming matches
2. **Format Enforcement**: System ensures lineup format matches match format
3. **Flexibility**: Can maintain both templates and match-specific lineups
4. **Auto-Loading**: Previously saved lineups load automatically when match is selected
5. **Clear Separation**: Templates and match-specific lineups don't interfere with each other

## Database Schema Changes

```sql
-- team_lineups table now has:
ALTER TABLE team_lineups
ADD COLUMN match_id UUID REFERENCES matches(id) ON DELETE CASCADE;

-- Example queries:

-- Get all templates (reusable formations)
SELECT * FROM team_lineups WHERE match_id IS NULL;

-- Get lineup for a specific match
SELECT * FROM team_lineups WHERE match_id = '<match-uuid>';

-- Get upcoming matches with their lineups
SELECT * FROM match_lineup_overview;
```

## Testing Checklist

- [ ] Database migration runs successfully
- [ ] Formations page loads without errors
- [ ] Upcoming matches display correctly
- [ ] Can select and deselect matches
- [ ] Format auto-switches when match is selected
- [ ] Can save formation for a specific match
- [ ] Can save formation template (no match selected)
- [ ] Match-specific lineup loads when match is selected
- [ ] Template lineup loads when no match is selected
- [ ] Cannot save lineup with mismatched format
- [ ] Switching between matches loads correct lineups
- [ ] UI clearly indicates match vs template mode

## Next Steps

1. Apply the database migration to your production/staging database
2. Test the functionality with real match data
3. Consider adding:
   - Match lineup status indicator (complete/incomplete)
   - Copy template to match functionality
   - Match day lineup locking
   - Formation comparison between matches
