# Database Tables & Views Explanation

## Overview: How Matches and Lineups Work Together

In this system, there are several interconnected tables and views that manage match scheduling and team formations. Here's how they work:

---

## Core Tables

### 1. `matches` Table
**Purpose**: Stores all scheduled matches (both friendly and tournament matches)

**Key Fields:**
```sql
- id: Unique match identifier
- home_team_id: Reference to teams table (home team)
- away_team_id: Reference to teams table (away team)
- match_format: Format of the match ('5-a-side', '7-a-side', '11-a-side')
- match_date: When the match is scheduled
- match_time: Time of the match
- stadium_id: Where the match will be played
- status: Current match status (scheduled, ongoing, completed, etc.)
- home_team_score: Final score for home team
- away_team_score: Final score for away team
```

**Function:**
- Acts as the central record for all matches
- Links two teams (home vs away)
- Defines the match format (which determines how many players needed)
- Tracks match status and results

---

### 2. `team_lineups` Table
**Purpose**: Stores formation configurations (both templates and match-specific)

**Key Fields:**
```sql
- id: Unique lineup identifier
- team_id: Which team owns this lineup
- lineup_name: User-given name (e.g., "Attacking 4-3-3")
- format: Match format ('5-a-side', '7-a-side', '11-a-side')
- formation: Specific formation (e.g., "4-3-3", "2-2", etc.)
- match_id: (OPTIONAL) Reference to a specific match
- is_default: Whether this is the default lineup for this format
```

**Function:**
- Stores both **reusable templates** (when `match_id` is NULL)
- Stores **match-specific lineups** (when `match_id` is set)
- Links to `team_lineup_players` to define which players are in this lineup

**Two Types of Lineups:**

**A. Template Lineup** (match_id = NULL)
```
Team: Barcelona FC
Format: 11-a-side
Formation: 4-3-3
Match ID: NULL ← This is a reusable template
```
Use case: Club owner creates a general 4-3-3 formation they like to use

**B. Match-Specific Lineup** (match_id = set)
```
Team: Barcelona FC
Format: 11-a-side
Formation: 4-3-3
Match ID: abc-123-def ← This is for a specific match
```
Use case: Club owner prepares lineup specifically for match against Real Madrid

---

### 3. `team_lineup_players` Table
**Purpose**: Stores individual player assignments within a lineup

**Key Fields:**
```sql
- lineup_id: Which lineup this player belongs to
- player_id: Which player
- position_on_field: Position (e.g., "GK", "CB", "ST")
- position_x, position_y: Visual position on field diagram
- jersey_number: Player's jersey number
- is_starter: true = starting XI, false = substitute
- substitute_order: Order in substitute bench (1, 2, 3, etc.)
```

**Function:**
- Defines the actual players in a lineup
- Separates starters from substitutes
- Stores visual positioning for formation diagram

---

## Database View

### 4. `match_lineup_overview` View
**Purpose**: Provides a convenient "at-a-glance" view of upcoming matches and their lineup status

**What it Shows:**
```sql
For each upcoming match:
- Match details (date, time, teams, format, status)
- Associated lineup (if one has been created)
- How many starters are assigned
- How many subs are assigned
```

**Example Output:**
```
match_id | match_date | home_team | away_team | lineup_id | formation | starters | subs
---------|------------|-----------|-----------|-----------|-----------|----------|------
abc-123  | 2026-01-10 | Barca FC  | Real FC   | xyz-789   | 4-3-3     | 11       | 7
def-456  | 2026-01-12 | City FC   | United FC | NULL      | NULL      | 0        | 0
```

**Function:**
- **Quick Dashboard**: Shows which matches have lineups ready and which don't
- **Preparation Tracking**: Club owners can see at a glance which matches need lineup preparation
- **Reporting**: Easy to generate reports on match readiness

---

## How It All Works Together

### Scenario 1: Creating a Match-Specific Formation

```
1. USER ACTION: Club owner goes to formations page
   ↓
2. QUERY: Fetch upcoming matches from `matches` table
   WHERE home_team_id = user's team OR away_team_id = user's team
   ↓
3. DISPLAY: Show match cards with date, opponent, format
   ↓
4. USER ACTION: Clicks on a 5-a-side match
   ↓
5. SYSTEM: Sets matchId and matchFormat props
   ↓
6. QUERY: Check if lineup exists for this match
   SELECT * FROM team_lineups
   WHERE team_id = user's team
   AND match_id = selected match
   ↓
7a. IF EXISTS: Load existing lineup
7b. IF NOT: Show empty formation builder
   ↓
8. USER ACTION: Assigns players to positions
   ↓
9. SAVE: Insert into team_lineups with match_id
   INSERT INTO team_lineups (team_id, match_id, format, formation, ...)
   ↓
10. SAVE: Insert players into team_lineup_players
    INSERT INTO team_lineup_players (lineup_id, player_id, position, ...)
```

### Scenario 2: Using the Overview View

**Use Case**: Dashboard showing match preparation status

```sql
-- Query to show which matches need lineups
SELECT
  match_date,
  home_team_name,
  away_team_name,
  match_format,
  CASE
    WHEN lineup_id IS NULL THEN 'Not Prepared'
    WHEN starters_count < required_starters THEN 'Incomplete'
    ELSE 'Ready'
  END as lineup_status
FROM match_lineup_overview
WHERE lineup_team_id = 'user-team-id';
```

**Output:**
```
Date       | Home    | Away     | Format    | Status
-----------|---------|----------|-----------|-------------
2026-01-10 | Barca   | Real     | 11-a-side | Ready
2026-01-12 | City    | United   | 7-a-side  | Not Prepared
2026-01-15 | Barca   | Chelsea  | 5-a-side  | Incomplete
```

---

## Benefits of This Design

### 1. **Flexibility**
- Can create reusable formation templates
- Can create match-specific formations
- Can have multiple formations per format

### 2. **Data Integrity**
- Database validation ensures lineup format matches match format
- Can't assign more players than allowed by format
- Can't use players not in the squad

### 3. **Easy Querying**
- View provides quick access to match lineup status
- No need to write complex joins every time
- Optimized for common queries

### 4. **Scalability**
- Supports unlimited matches
- Supports unlimited formations per team
- Easy to add new match formats in the future

### 5. **Audit Trail**
- Each lineup is timestamped (created_at, updated_at)
- Can track who created the lineup (created_by)
- Can see historical lineups for past matches

---

## Common Queries

### Get all upcoming matches without lineups
```sql
SELECT * FROM match_lineup_overview
WHERE lineup_id IS NULL
AND (home_team_id = 'user-team-id' OR away_team_id = 'user-team-id');
```

### Get match with its lineup details
```sql
SELECT
  m.*,
  tl.formation,
  tl.lineup_name,
  COUNT(CASE WHEN tlp.is_starter THEN 1 END) as starters,
  COUNT(CASE WHEN NOT tlp.is_starter THEN 1 END) as subs
FROM matches m
LEFT JOIN team_lineups tl ON m.id = tl.match_id
LEFT JOIN team_lineup_players tlp ON tl.id = tlp.lineup_id
WHERE m.id = 'match-id'
GROUP BY m.id, tl.id;
```

### Get all template formations for a team
```sql
SELECT * FROM team_lineups
WHERE team_id = 'team-id'
AND match_id IS NULL;
```

### Get lineup for a specific match
```sql
SELECT * FROM team_lineups
WHERE team_id = 'team-id'
AND match_id = 'match-id';
```

---

## Summary

- **`matches`** = The scheduled games
- **`team_lineups`** = The formations (both templates and match-specific)
- **`team_lineup_players`** = The actual player assignments
- **`match_lineup_overview`** = A convenient view for dashboards and reports

Together, they enable:
✅ Scheduling matches with specific formats
✅ Preparing formations for upcoming matches
✅ Reusing successful formations as templates
✅ Tracking match preparation status
✅ Ensuring data consistency through validation
