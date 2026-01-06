# Match Classification - Quick Reference

## Database Columns

### matches table
| Column | Type | Description | When Used |
|--------|------|-------------|-----------|
| `match_type` | enum('friendly', 'official') | Match competitiveness level | Always (defaults to 'official') |
| `league_structure` | enum('friendly', 'hobby', 'amateur', 'intermediate', 'professional', 'tournament') | League classification | Only for official club matches (when tournament_id is NULL) |
| `match_format` | enum('friendly', '5-a-side', '7-a-side', '11-a-side') | Number of players per side | Always |
| `tournament_id` | uuid (nullable) | Link to tournament | Only for tournament matches |

## Match Types Explained

### 🤝 Friendly Match
- **match_type:** 'friendly'
- **league_structure:** null
- **Use case:** Casual, non-competitive matches between clubs
- **Badge color:** Green
- **Features:** No rankings, no league points, just for fun/practice

### ⚡ Official Match (General)
- **match_type:** 'official'
- **league_structure:** null (not specified)
- **Use case:** Competitive match without specific league classification
- **Badge color:** Red
- **Features:** May count towards club ratings

### 🎯 Hobby League
- **match_type:** 'official'
- **league_structure:** 'hobby'
- **Use case:** Recreational competitive matches
- **Badge color:** Blue
- **Features:** Beginner-friendly, minimal pressure

### ⭐ Amateur League
- **match_type:** 'official'
- **league_structure:** 'amateur'
- **Use case:** Non-professional competitive matches
- **Badge color:** Cyan
- **Features:** More serious than hobby, but not professional

### 🎖️ Intermediate League
- **match_type:** 'official'
- **league_structure:** 'intermediate'
- **Use case:** Semi-professional level matches
- **Badge color:** Indigo
- **Features:** High-level amateur or semi-pro

### 👑 Professional League
- **match_type:** 'official'
- **league_structure:** 'professional'
- **Use case:** Elite competitive matches
- **Badge color:** Purple
- **Features:** Highest level of club competition

### 🏆 Tournament
- **match_type:** 'official'
- **league_structure:** 'tournament'
- **Use case:** Cup/knockout competitions
- **Badge color:** Amber
- **Features:** Elimination-based, high stakes

## Classification Priority Logic

When displaying match classification, the system uses this priority:

1. **Tournament Classification** (highest priority)
   - If `tournament_id` is set, use `tournament.league_structure`
   - Overrides all other classifications

2. **Friendly Match**
   - If `match_type === 'friendly'`
   - Shows as "Friendly Match" regardless of other fields

3. **Official with League Classification**
   - If `match_type === 'official'` AND `league_structure` is set
   - Shows specific league level (Hobby, Amateur, etc.)

4. **Default Official** (lowest priority)
   - If `match_type === 'official'` but no `league_structure`
   - Shows as generic "Official Match"

## UI Flow

### Creating a Match

1. **Select Match Type:**
   - 🏃 Friendly Match
   - 🏆 Official Match

2. **If Official Selected:**
   - League Classification dropdown appears
   - Select from: Hobby, Amateur, Intermediate, Professional, Tournament

3. **Data Saved:**
   ```typescript
   {
     match_type: 'friendly' | 'official',
     league_structure: 'hobby' | 'amateur' | etc. (if official)
   }
   ```

### Viewing on Statistics Page

Matches automatically display with colored badges:
- Friendly → Green badge 🤝
- Hobby → Blue badge 🎯
- Amateur → Cyan badge ⭐
- Intermediate → Indigo badge 🎖️
- Professional → Purple badge 👑
- Tournament → Amber badge 🏆

## Common Scenarios

### Scenario 1: Friendly Club Match
```json
{
  "match_type": "friendly",
  "league_structure": null,
  "tournament_id": null
}
```
**Display:** 🤝 Friendly Match (Green)

### Scenario 2: Amateur League Match
```json
{
  "match_type": "official",
  "league_structure": "amateur",
  "tournament_id": null
}
```
**Display:** ⭐ Amateur League (Cyan)

### Scenario 3: Tournament Match
```json
{
  "match_type": "official",
  "league_structure": null,
  "tournament_id": "abc-123",
  "tournament": {
    "league_structure": "professional"
  }
}
```
**Display:** 👑 Professional League (Purple) - from tournament

### Scenario 4: Generic Official Match
```json
{
  "match_type": "official",
  "league_structure": null,
  "tournament_id": null
}
```
**Display:** ⚡ Official Match (Red)

## Migration Impact

### Existing Matches After Migration
- Matches with `match_format = 'friendly'` → Converted to `match_type = 'friendly'`
- Matches with `tournament_id` → Set to `match_type = 'official'`
- All other matches → Default to `match_type = 'official'`

### New Matches
All new matches will have proper classification based on user selection during creation.

## Developer Notes

### Adding New League Levels
1. Add to enum in migration:
   ```sql
   ALTER TYPE league_structure ADD VALUE 'new_level';
   ```
2. Add case to `getTournamentTypeStyle()` in statistics page
3. Add SelectItem to match creation form
4. Update TypeScript types

### Filtering Matches by Classification
```typescript
// Get only friendly matches
const friendlyMatches = matches.filter(m => m.match_type === 'friendly');

// Get only amateur league matches
const amateurMatches = matches.filter(m => 
  m.match_type === 'official' && 
  m.league_structure === 'amateur'
);

// Get tournament matches
const tournamentMatches = matches.filter(m => m.tournament_id !== null);
```

### Analytics Queries
```sql
-- Count matches by type
SELECT match_type, COUNT(*) 
FROM matches 
GROUP BY match_type;

-- Count official matches by league
SELECT league_structure, COUNT(*) 
FROM matches 
WHERE match_type = 'official' AND league_structure IS NOT NULL
GROUP BY league_structure;

-- Get distribution of match classifications
SELECT 
  CASE 
    WHEN tournament_id IS NOT NULL THEN 'Tournament'
    WHEN match_type = 'friendly' THEN 'Friendly'
    WHEN league_structure IS NOT NULL THEN league_structure
    ELSE 'Official (Unclassified)'
  END as classification,
  COUNT(*)
FROM matches
GROUP BY classification;
```

---

**Last Updated:** 2025-01-XX
**Version:** 1.0
