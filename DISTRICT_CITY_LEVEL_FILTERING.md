# District/City-Level Filtering for Match Creation

## Overview
Implemented location-based filtering for PCL match organization at district or city levels. When creating matches, clubs now only see opponent clubs, stadiums, referees, and staff from their same district or city.

## Changes Made

### 1. Database Migration
**File:** [supabase/migrations/015_add_location_fields_to_users.sql](supabase/migrations/015_add_location_fields_to_users.sql)

**Changes:**
- Added `city`, `district`, and `state` fields to `users` table
- Added `district` field to `stadiums` table
- Added `district` field to `clubs` table (if not exists)
- Created indexes on all location fields for better query performance

**Purpose:**
- Enables location-based filtering for referees and staff (through users table)
- Ensures all entities have consistent location fields
- Improves query performance with proper indexes

### 2. Match Creation Component Updates
**File:** [apps/web/src/app/dashboard/club-owner/matches/create-friendly-enhanced.tsx](apps/web/src/app/dashboard/club-owner/matches/create-friendly-enhanced.tsx)

#### A. Club Filtering (Lines 222-256)
**Before:**
```typescript
const { data: clubsData } = await supabase
  .from('clubs')
  .select('...')
  .eq('is_active', true)
  .eq('kyc_verified', true)
  .neq('id', club.id)
```

**After:**
```typescript
let clubQuery = supabase
  .from('clubs')
  .select('..., district')
  .eq('is_active', true)
  .eq('kyc_verified', true)
  .neq('id', club.id)

// Apply district/city filtering for PCL match organization
if (club.district) {
  clubQuery = clubQuery.eq('district', club.district)
} else if (club.city) {
  clubQuery = clubQuery.eq('city', club.city)
}
```

**Logic:**
- Priority: District-level filtering first
- Fallback: City-level filtering if no district set
- Only shows clubs from same district/city

#### B. Stadium Filtering (Lines 308-323)
**Before:**
```typescript
const { data: stadiumsData } = await supabase
  .from('stadiums')
  .select('...')
  .eq('is_available', true)
```

**After:**
```typescript
let stadiumQuery = supabase
  .from('stadiums')
  .select('..., district')
  .eq('is_available', true)

// Apply district/city filtering
if (club.district) {
  stadiumQuery = stadiumQuery.eq('district', club.district)
} else if (club.city) {
  stadiumQuery = stadiumQuery.eq('city', club.city)
}
```

**Logic:**
- Filters stadiums by district first, then city
- Only shows stadiums in the same location

#### C. Referee Filtering (Lines 334-352)
**Before:**
```typescript
const { data: refereesData } = await supabase
  .from('referees')
  .select(`
    ...,
    users!inner(first_name, last_name)
  `)
  .eq('is_available', true)
```

**After:**
```typescript
let refereeQuery = supabase
  .from('referees')
  .select(`
    ...,
    users!inner(first_name, last_name, city, district)
  `)
  .eq('is_available', true)

// Apply district/city filtering through users table
if (club.district) {
  refereeQuery = refereeQuery.eq('users.district', club.district)
} else if (club.city) {
  refereeQuery = refereeQuery.eq('users.city', club.city)
}
```

**Logic:**
- Filters referees through users table location
- Uses INNER JOIN to ensure user data exists
- Matches by district first, then city

#### D. Staff Filtering (Lines 361-379)
**Before:**
```typescript
const { data: staffData } = await supabase
  .from('staff')
  .select(`
    ...,
    users!inner(first_name, last_name)
  `)
  .eq('is_available', true)
```

**After:**
```typescript
let staffQuery = supabase
  .from('staff')
  .select(`
    ...,
    users!inner(first_name, last_name, city, district)
  `)
  .eq('is_available', true)

// Apply district/city filtering through users table
if (club.district) {
  staffQuery = staffQuery.eq('users.district', club.district)
} else if (club.city) {
  staffQuery = staffQuery.eq('users.city', club.city)
}
```

**Logic:**
- Same pattern as referee filtering
- Ensures staff are from the same district/city

### 3. UI Indicators
Added visual badges showing the active filtering scope:

#### A. Info Banner (Lines 883-899)
**Location:** Top of Step 1
**Displays:**
- Blue informational banner
- Shows "District-Level" or "City-Level" match organization
- Explains that all resources are filtered by location

#### B. Opponent Club Selection Badge (Lines 934-945)
**Location:** Opponent Club Selection header
**Displays:**
- Blue badge with MapPin icon
- Shows district or city name
- Example: "Thrissur District" or "Thrissur City"

#### C. Stadium Selection Badge (Lines 1138-1150)
**Location:** Select Stadium header
**Displays:**
- Blue badge indicating filtering scope
- Helps users understand why stadium list is limited

#### D. Referee Selection Badge (Lines 1555-1566)
**Location:** Select Referees header
**Displays:**
- Small blue badge showing location filter
- Appears in Officials step

#### E. Staff Selection Badge (Lines 1614-1625)
**Location:** Select PCL Staff header
**Displays:**
- Badge showing district/city level
- Consistent with other sections

## Filtering Logic Flow

### Priority System
1. **District-level (Priority 1)**: If `club.district` exists
   - Filter: `WHERE district = club.district`
   - Example: Show all clubs in "Thrissur District"

2. **City-level (Fallback)**: If `club.district` is null/empty but `club.city` exists
   - Filter: `WHERE city = club.city`
   - Example: Show all clubs in "Thrissur City"

3. **No filtering**: If neither district nor city is set
   - Shows all available resources
   - Not recommended for PCL matches

### Query Examples

**Clubs Query:**
```sql
SELECT id, club_name, city, state, district, ...
FROM clubs
WHERE is_active = true
  AND kyc_verified = true
  AND id != 'user-club-id'
  AND district = 'Thrissur'  -- or city = 'Thrissur'
ORDER BY club_name;
```

**Stadiums Query:**
```sql
SELECT id, stadium_name, location, district, city, ...
FROM stadiums
WHERE is_available = true
  AND district = 'Thrissur'  -- or city = 'Thrissur'
```

**Referees Query:**
```sql
SELECT r.*, u.first_name, u.last_name, u.city, u.district
FROM referees r
INNER JOIN users u ON r.user_id = u.id
WHERE r.is_available = true
  AND u.district = 'Thrissur'  -- or u.city = 'Thrissur'
```

**Staff Query:**
```sql
SELECT s.*, u.first_name, u.last_name, u.city, u.district
FROM staff s
INNER JOIN users u ON s.user_id = u.id
WHERE s.is_available = true
  AND u.district = 'Thrissur'  -- or u.city = 'Thrissur'
```

## UI Visual States

### Info Banner (Step 1)
```
┌────────────────────────────────────────────────┐
│ ℹ️ District-Level Match Organization           │
│                                                │
│ This match will be organized at the Thrissur   │
│ District level. All opponent clubs, stadiums,  │
│ referees, and staff shown are filtered to      │
│ match your location for PCL matches.           │
└────────────────────────────────────────────────┘
```

### Section Headers with Badge
```
┌─────────────────────────────────────────┐
│ 👥 Opponent Club Selection              │
│                     [📍 Thrissur District]│
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ 🏢 Select Stadium  (12 available)       │
│                     [📍 Thrissur District]│
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ ✓ Select Referees (2 selected)          │
│                     [📍 Thrissur District]│
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ 👥 Select PCL Staff (1 selected)        │
│                     [📍 Thrissur District]│
└─────────────────────────────────────────┘
```

## Benefits

### 1. Organized Match Management
- ✅ Matches are organized at district or city level
- ✅ Prevents cross-district match scheduling confusion
- ✅ Aligns with PCL's District Qualifier League (DQL) structure

### 2. Reduced Logistics
- ✅ Shorter travel distances for teams
- ✅ Local referees and staff familiar with the area
- ✅ Stadium availability within the same district/city

### 3. Better User Experience
- ✅ Clear visual indicators of filtering scope
- ✅ Users understand why certain options are shown
- ✅ Reduced clutter - only relevant options displayed

### 4. Performance Optimization
- ✅ Smaller result sets with indexed queries
- ✅ Faster query execution with location filters
- ✅ Better scalability as platform grows

### 5. PCL Structure Compliance
- ✅ Supports district-level DQL tournaments
- ✅ Enables city-level amateur leagues
- ✅ Scalable for state and national levels in future

## Migration Path

### For Existing Data
1. **Clubs**: District field already exists, may need population
2. **Stadiums**: New district field added by migration
3. **Users**: New city/district/state fields added
4. **Referees/Staff**: Use users table for location data

### Data Population Strategy
1. **Option A - Manual Entry**: Club owners update their district in settings
2. **Option B - Bulk Update**: Admin imports district data based on city
3. **Option C - API Integration**: Use location API to derive district from city

## Testing Checklist

- [x] Build completes successfully
- [ ] Clubs from same district appear in search
- [ ] Clubs from different districts do NOT appear
- [ ] Stadiums filtered by district/city
- [ ] Referees filtered by district/city through users table
- [ ] Staff filtered by district/city through users table
- [ ] UI badges display correctly
- [ ] Info banner shows on Step 1
- [ ] No filtering when district/city not set
- [ ] Performance acceptable with large datasets

## Edge Cases Handled

✅ **No district set**: Falls back to city-level filtering
✅ **No city set**: Shows all available resources (no filtering)
✅ **Empty result sets**: User sees no options but can still proceed
✅ **Mixed location data**: Handles clubs with partial location data
✅ **INNER JOIN**: Ensures referees/staff have valid user records

## Future Enhancements

### 1. State-Level Filtering
Add state-level filtering for regional tournaments:
```typescript
if (club.state) {
  query = query.eq('state', club.state)
}
```

### 2. Multi-Level Support
Allow club owners to choose filtering level:
```typescript
const filteringLevel = club.match_organization_level // 'district' | 'city' | 'state'
```

### 3. Cross-District Tournaments
Add flag for special tournaments that bypass filtering:
```typescript
if (!tournament.is_district_restricted) {
  // Show all clubs regardless of location
}
```

### 4. Location Autocomplete
Add autocomplete for district/city selection in club settings:
```typescript
<Autocomplete
  options={districts}
  value={club.district}
  onChange={handleDistrictChange}
/>
```

## Related Files

- [supabase/migrations/015_add_location_fields_to_users.sql](supabase/migrations/015_add_location_fields_to_users.sql) - Database migration
- [apps/web/src/app/dashboard/club-owner/matches/create-friendly-enhanced.tsx](apps/web/src/app/dashboard/club-owner/matches/create-friendly-enhanced.tsx) - Main component
- [MATCH_CREATION_CLUB_SEARCH_ISSUES.md](MATCH_CREATION_CLUB_SEARCH_ISSUES.md) - Previous security fixes
- [DATABASE_TABLES_EXPLANATION.md](DATABASE_TABLES_EXPLANATION.md) - Database structure

## Summary

This implementation adds district/city-level filtering to match creation, enabling PCL's district-based tournament structure. All opponent clubs, stadiums, referees, and staff are now filtered by the home club's district (or city as fallback), with clear visual indicators throughout the UI.

**Key Principle**: Matches are organized locally (district/city level), reducing logistics, improving user experience, and supporting PCL's hierarchical tournament structure.
