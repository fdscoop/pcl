# Quick Start: Location Fields Implementation

## What Was Added

Location fields (address, district, state) have been added to the player profile system to support district-based tournament organization.

---

## Files Modified

### 1. Player Profile Form
**File:** `apps/web/src/components/forms/PlayerProfileForm.tsx`

**Changes:**
- Added `address`, `district`, `state` to form schema
- Added form fields in the UI
- Pre-fill existing location data when editing
- Save location data to database

### 2. Database Schema
**File:** `CREATE_PLAYERS_TABLE.sql`

**Changes:**
- Added `address TEXT` column
- Added `district TEXT` column
- Added `state TEXT` column
- Added database indexes for efficient filtering:
  - `idx_players_district`
  - `idx_players_state`
  - `idx_players_district_state`

---

## How It Works

### For Players

When completing their profile, players now provide:

1. **Address** (full address)
   - House/Flat No., Street, Area
   - Example: "123 Main Street, Bekal Area"

2. **District** (required for DQL participation)
   - Example: "Kasaragod"
   - Used for District Qualifier Level (DQL) tournaments
   - Players can only play for clubs in their district at DQL level

3. **State** (required for state/national level)
   - Example: "Kerala"
   - Required for state and national level leagues

### Form Validation

```typescript
// All three fields are required
address: z.string().min(5, 'Address is required'),
district: z.string().min(2, 'District is required'),
state: z.string().min(2, 'State is required'),
```

### Database Storage

```sql
-- Location fields for district-based tournament system
address TEXT,
district TEXT,
state TEXT,

-- Indexes for district-based tournament filtering
CREATE INDEX IF NOT EXISTS idx_players_district ON players(district);
CREATE INDEX IF NOT EXISTS idx_players_state ON players(state);
CREATE INDEX IF NOT EXISTS idx_players_district_state ON players(district, state);
```

---

## Tournament Eligibility Rules

### DQL (District Qualifier Level)
- Players MUST be from the same district as their club
- Example: Kasaragod players can only play for Kasaragod clubs
- Cross-district transfers NOT allowed

### Amateur League (District Level)
- Same rules as DQL
- District-based qualification

### Intermediate League (State Level)
- Players must be from the same state as their club
- Cross-district transfers allowed within state
- Example: Kasaragod player can join Kottayam club (both Kerala)

### Professional League (National Level)
- No geographic restrictions
- Players can represent any club from any state

---

## Next Steps

### For Development

1. **Add District Dropdown** (Optional Enhancement)
   - Replace text input with dropdown for Kerala districts
   - Prevents typos and ensures consistency
   - List of 14 Kerala districts available in rulebook

2. **Add State Dropdown** (Optional Enhancement)
   - Dropdown for Indian states
   - Better UX than free text

3. **Implement Tournament Filtering**
   - Filter players by district for DQL scouting
   - Filter players by state for Intermediate League scouting

4. **Add Validation Rules**
   - Validate district exists in state
   - Prevent invalid district/state combinations

### For Database

If you already have a `players` table, run this migration:

```sql
-- Add location columns if they don't exist
ALTER TABLE players ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE players ADD COLUMN IF NOT EXISTS district TEXT;
ALTER TABLE players ADD COLUMN IF NOT EXISTS state TEXT;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_players_district ON players(district);
CREATE INDEX IF NOT EXISTS idx_players_state ON players(state);
CREATE INDEX IF NOT EXISTS idx_players_district_state ON players(district, state);
```

---

## Testing

### Test Player Profile Completion

1. Sign in as a player
2. Go to "Complete Profile" or "Edit Profile"
3. Fill in all fields including:
   - Address: "123 Main Street, Bekal"
   - District: "Kasaragod"
   - State: "Kerala"
4. Save profile
5. Check dashboard - location data should be saved

### Verify Database

```sql
-- Check if location data is being saved
SELECT
  id,
  unique_player_id,
  address,
  district,
  state
FROM players
ORDER BY created_at DESC
LIMIT 10;
```

### Test District Filtering (Future Feature)

```sql
-- Find all players from Kasaragod
SELECT
  unique_player_id,
  position,
  district,
  state
FROM players
WHERE district = 'Kasaragod'
AND is_available_for_scout = true;
```

---

## Business Logic Reference

For complete tournament rules, player eligibility, and business logic, see:

**[PCL_LEAGUE_STRUCTURE_AND_RULES.md](PCL_LEAGUE_STRUCTURE_AND_RULES.md)**

This document contains:
- Tournament hierarchy (DQL → Amateur → Intermediate → Professional)
- Player eligibility rules by tournament level
- District-based filtering logic
- Kasaragod pilot program details
- Database schema and validation logic
- Future expansion plans

---

## Kerala Districts (for reference)

If implementing district dropdown, use these 14 districts:

1. Kasaragod (Pilot District)
2. Kannur
3. Wayanad
4. Kozhikode
5. Malappuram
6. Palakkad
7. Thrissur
8. Ernakulam
9. Idukki
10. Kottayam
11. Alappuzha
12. Pathanamthitta
13. Kollam
14. Thiruvananthapuram

---

## Summary

✅ **Completed:**
- Location fields added to player profile form
- Database schema updated with address, district, state
- Database indexes created for efficient filtering
- Form validation implemented
- Helper text added to explain DQL usage
- Comprehensive rulebook created

🔜 **Next:**
- Add district/state dropdowns (optional)
- Implement tournament filtering features
- Build club scouting system with district filters
- Create tournament registration with eligibility validation

---

**Ready to test! Players can now complete profiles with location information for district-based tournament organization.**
