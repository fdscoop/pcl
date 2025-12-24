# Team Formation & Squad Management Guide

## Overview

The Premier Cricket League platform now supports comprehensive team formation management with proper squad handling, player substitutions, and tactical formations for different match formats (5-a-side, 7-a-side, 11-a-side).

## Database Architecture

### 1. **teams** (Enhanced)
- Added `format` column: Specifies team format ('5-a-side', '7-a-side', '11-a-side')
- Added `formation_data` (JSONB): Stores formation configuration
- Added `last_lineup_updated`: Timestamp of last lineup change

### 2. **team_squads** (New)
The overall squad - all contracted players eligible to play for this team.

```sql
CREATE TABLE team_squads (
  id UUID PRIMARY KEY,
  team_id UUID REFERENCES teams,
  player_id UUID REFERENCES players,
  contract_id UUID REFERENCES contracts,
  joined_at TIMESTAMP,
  is_active BOOLEAN
)
```

**Purpose**: Track which players belong to the team's overall squad (via active contracts).

### 3. **team_lineups** (New)
Specific formations and match-day squads.

```sql
CREATE TABLE team_lineups (
  id UUID PRIMARY KEY,
  team_id UUID REFERENCES teams,
  lineup_name TEXT, -- e.g., "Default 4-3-3", "Match vs Team X"
  format match_format, -- '5-a-side', '7-a-side', '11-a-side'
  formation TEXT, -- e.g., "4-3-3", "2-2", "3-2-1"
  is_default BOOLEAN,
  match_id UUID REFERENCES matches (optional)
)
```

**Purpose**: Store different tactical formations. A team can have multiple lineups:
- Default lineup for each format
- Match-specific lineups
- Practice/training lineups

### 4. **team_lineup_players** (New)
The actual players in a lineup - both starting XI and substitutes.

```sql
CREATE TABLE team_lineup_players (
  id UUID PRIMARY KEY,
  lineup_id UUID REFERENCES team_lineups,
  player_id UUID REFERENCES players,
  position_on_field TEXT, -- "GK", "CB", "ST", etc.
  position_x DECIMAL, -- X coordinate (0-100)
  position_y DECIMAL, -- Y coordinate (0-100)
  jersey_number INTEGER,
  is_starter BOOLEAN, -- true = starting XI, false = substitute
  substitute_order INTEGER -- 1, 2, 3... for substitutes
)
```

**Purpose**: Define who plays where in a specific lineup.

**Key Concept**:
- `is_starter = true`: Player is in the starting XI (on the field)
- `is_starter = false`: Player is a substitute (on the bench)
- When you substitute a player FROM the field, they become a substitute

### 5. **substitution_history** (New)
Track in-game substitutions.

```sql
CREATE TABLE substitution_history (
  id UUID PRIMARY KEY,
  lineup_id UUID REFERENCES team_lineups,
  match_id UUID REFERENCES matches,
  player_out_id UUID, -- Player removed from field
  player_in_id UUID,  -- Player brought onto field
  substitution_time INTEGER, -- Minute (e.g., 45, 67)
  reason TEXT, -- "Injury", "Tactical", "Performance"
  made_by UUID REFERENCES users -- Coach/manager
)
```

**Purpose**: Historical record of who was substituted when and why.

## Player Flow & Substitution Logic

### Three Player Pools:

1. **Bench** (Not selected)
   - All contracted players not currently selected for this lineup
   - Click "Select" to add them to Available XI

2. **Available for XI** (Selected, not yet assigned)
   - Players selected for the lineup but not yet placed on the field
   - Limited to the format's field size (5, 7, or 11)
   - Click on a field position to assign them

3. **Substitutes** (Selected, overflow from XI)
   - Players selected but exceed the field limit
   - When you substitute a field player, they move here
   - Can swap with field players

### Substitution Behavior:

**Scenario 1: Remove player from field (click X button)**
```
Field Player → Removed from position
            → Stays in selectedPlayers
            → Moves to "Available XI" or "Substitutes" (depending on count)
```

**Scenario 2: Swap field player with substitute**
```
Field Player A → Moves to Substitutes
Substitute B   → Moves to Field (takes A's position)
```

**Scenario 3: Move player back to bench**
```
Available/Substitute Player → Click "Bench" button
                           → Removed from selectedPlayers
                           → Back to Bench pool
```

## Swap Mode Feature

### How to Use:

1. **Enable Swap Mode**
   - Click the "Swap Players" button
   - Interface enters swap mode (blue highlighting)

2. **Select First Player**
   - Click any player (on field, in Available XI, or in Substitutes)
   - Player is highlighted with blue border
   - Alert shows: "Player Name selected. Click another player to swap."

3. **Select Second Player**
   - Click another player to complete the swap
   - Players exchange positions automatically
   - Swap mode exits

4. **Cancel Swap**
   - Click "Cancel Swap" or the X button in the alert
   - Returns to normal mode

### Swap Scenarios:

| First Player | Second Player | Result |
|-------------|---------------|--------|
| Field Position A | Field Position B | Players swap positions |
| Field Position | Available XI | Field player → Substitutes<br>Available player → Field |
| Field Position | Substitute | Substitute → Field<br>Field player → Substitutes |
| Available/Sub | Available/Sub | No change (both in same pool) |

### Visual Indicators:

- **Swap Mode Active**: Blue "Swap Players" button
- **Player Selected**: Blue ring around player, "1st" badge
- **Swappable Players**: "Swap" badge appears
- **Field Players in Swap Mode**: Blue swap icon (↔) instead of red X

## Format Requirements

### 5-a-side
- **Players on field**: 5
- **Minimum substitutes**: 3
- **Total required**: 8 players
- **Recommended squad**: 8 players
- **Formations**: 2-2, 1-2-1

### 7-a-side
- **Players on field**: 7
- **Minimum substitutes**: 4
- **Total required**: 11 players
- **Recommended squad**: 11 players
- **Formations**: 3-2-1, 2-3-1

### 11-a-side
- **Players on field**: 11
- **Minimum substitutes**: 3
- **Total required**: 14 players
- **Recommended squad**: 18 players
- **Formations**: 4-3-3, 4-4-2, 3-5-2

## Database Constraints & Validation

### Automatic Validations:

1. **Player Count Validation**
   - Trigger prevents adding more starters than format allows
   - Error: "Cannot add more than X starters for Y format"

2. **Squad Membership**
   - Players in lineup must be in team_squads
   - Players must have active contracts

3. **Substitute Order**
   - Starters: `is_starter=true`, `substitute_order=NULL`
   - Substitutes: `is_starter=false`, `substitute_order=1,2,3...`

4. **Auto-Update Team Player Count**
   - Trigger automatically updates `teams.total_players`
   - Reflects active squad size

## Example Usage

### Creating a Default 11-a-side Lineup:

```sql
-- 1. Create the lineup
INSERT INTO team_lineups (team_id, lineup_name, format, formation, is_default)
VALUES ('team-uuid', 'Default 4-3-3', '11-a-side', '4-3-3', true);

-- 2. Add starting XI (11 players)
INSERT INTO team_lineup_players (lineup_id, player_id, position_on_field, position_x, position_y, is_starter)
VALUES
  ('lineup-uuid', 'gk-uuid', 'GK', 50, 90, true),
  ('lineup-uuid', 'lb-uuid', 'LB', 20, 70, true),
  -- ... add all 11 starters

-- 3. Add substitutes (3+ players)
INSERT INTO team_lineup_players (lineup_id, player_id, position_on_field, is_starter, substitute_order)
VALUES
  ('lineup-uuid', 'sub1-uuid', 'Midfielder', false, 1),
  ('lineup-uuid', 'sub2-uuid', 'Forward', false, 2),
  ('lineup-uuid', 'sub3-uuid', 'Defender', false, 3);
```

### Making a Substitution During a Match:

```sql
-- Record the substitution
INSERT INTO substitution_history (lineup_id, match_id, player_out_id, player_in_id, substitution_time, reason)
VALUES ('lineup-uuid', 'match-uuid', 'tired-player-uuid', 'fresh-player-uuid', 67, 'Tactical');

-- Update the lineup
UPDATE team_lineup_players
SET is_starter = false, substitute_order = 4
WHERE lineup_id = 'lineup-uuid' AND player_id = 'tired-player-uuid';

UPDATE team_lineup_players
SET is_starter = true, substitute_order = NULL, position_on_field = 'CM', position_x = 50, position_y = 50
WHERE lineup_id = 'lineup-uuid' AND player_id = 'fresh-player-uuid';
```

## Best Practices

### 1. Lineup Management
- Create default lineups for each format your team supports
- Name match-specific lineups clearly (e.g., "Semi-Final vs Warriors")
- Keep at least minimum substitutes for each format

### 2. Squad Building
- Maintain active contracts for all squad members
- Use team_squads to track overall squad membership
- Regular cleanup of inactive players

### 3. Substitution Strategy
- Track substitution reasons for analytics
- Monitor substitution patterns per player
- Use substitute_order to define bench priority

### 4. Formation Testing
- Test different formations in practice matches
- Save successful formations as defaults
- Analyze formation effectiveness over time

## UI/UX Features

### Formation Builder Component

**Features**:
- Visual football pitch with field markings
- Drag-and-drop style player assignment
- Format selector (5s, 7s, 11s)
- Formation templates per format
- Auto-assign players by position
- Swap mode for easy substitutions
- Three-tier player management (Bench, Available, Substitutes)

**Player Actions**:
- **From Bench**: Click "Select" to add to Available XI
- **From Available XI**: Click field position to assign, or "Remove" to send back to bench
- **From Field**: Click X to remove (goes to Substitutes), or use Swap mode
- **From Substitutes**: Click "Bench" to move back, or use Swap mode to swap onto field

## Future Enhancements

### Planned Features:
1. **Captain & Vice-Captain Selection**
2. **Formation Analytics** (win rate per formation)
3. **Player Fatigue Tracking** (suggest substitutions)
4. **Tactical Instructions** (per position/player)
5. **Multi-Team Lineups** (clubs with multiple teams)
6. **Lineup Templates** (save and reuse across matches)
7. **Player Availability Status** (injured, suspended, available)

---

## Summary

This system provides a complete team formation management solution that:

✅ **Properly tracks** contracted players (team_squads)
✅ **Manages lineups** for different formats (team_lineups)
✅ **Defines positions** for starting XI and substitutes (team_lineup_players)
✅ **Records substitutions** during matches (substitution_history)
✅ **Enforces constraints** (player counts, squad membership)
✅ **Provides great UX** (swap mode, visual indicators, three-tier management)
✅ **Handles substitution flow** (field → substitutes, not bench)

The key innovation is the **proper substitution flow**: when you substitute a player FROM the field, they don't disappear - they move to the substitutes list, staying part of your match-day squad. This mirrors real football/cricket team management.
