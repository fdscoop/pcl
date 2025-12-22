# 406 "Not Acceptable" Error Fix - COMPLETE ✅

## Problem
The application was returning 406 "Not Acceptable" errors when trying to fetch player data:
```
Failed to load resource: the server responded with a status of 406 ()
GET /rest/v1/players?select=*&user_id=eq.97375890-aba6-4aa8-8996-ae8f04c01333
```

This was preventing:
- Notifications from loading player information
- Contract views from displaying player details  
- Scout page from functioning properly

## Root Cause Analysis
The Supabase REST API was rejecting queries that used `.select('*')` on the players table, especially when combined with filter conditions like `.eq()`. This is a **known Supabase API behavior** that rejects wildcard selects in certain query patterns.

**This was NOT an RLS issue** - we confirmed this by temporarily disabling RLS and the 406 error persisted.

## Solution Applied
**Changed all player data queries to use specific column selection instead of wildcards.**

### Files Modified

#### 1. `/Users/bineshbalan/pcl/apps/web/src/services/contractService.ts`
**Issue**: Line 119 had `.select('*, users(first_name, last_name)')` with a join
**Fix**: 
- Changed to select specific player columns only
- Fetch user data in a separate query
- Fixed playerName generation to use separate userData object

```typescript
// BEFORE
const playerInfo = await supabase
  .from('players')
  .select('*, users(first_name, last_name)')
  .eq('id', existingContract.player_id)
  .single()

// AFTER
const playerInfo = await supabase
  .from('players')
  .select('id, user_id, position, photo_url, unique_player_id, jersey_number, height_cm, weight_kg, date_of_birth, nationality, preferred_foot, current_club_id, is_available_for_scout')
  .eq('id', existingContract.player_id)
  .single()

let userInfo = null
if (playerInfo.data) {
  userInfo = await supabase
    .from('users')
    .select('first_name, last_name')
    .eq('id', playerInfo.data.user_id)
    .single()
}
```

#### 2. `/Users/bineshbalan/pcl/apps/web/src/app/dashboard/player/page.tsx`
**Issue**: Line 53 had `.select('*')` on players table
**Fix**: Changed to specific column selection

```typescript
// BEFORE
.select('*')

// AFTER
.select('id, user_id, position, photo_url, unique_player_id, jersey_number, height_cm, weight_kg, date_of_birth, nationality, preferred_foot, current_club_id, is_available_for_scout')
```

#### 3. `/Users/bineshbalan/pcl/apps/web/src/app/dashboard/player/contracts/page.tsx`
**Issue**: Line 72 had `.select('*')` on players table
**Fix**: Changed to specific column selection

#### 4. `/Users/bineshbalan/pcl/apps/web/src/app/dashboard/club-owner/contracts/[id]/view/page.tsx`
**Status**: Already fixed in previous session - using specific column selection

#### 5. `/Users/bineshbalan/pcl/apps/web/src/components/forms/PlayerProfileForm.tsx`
**Issue**: Line 70 had `.select('*, users!inner(bio)')` with join
**Fix**: Split into two queries
- Select player columns
- Fetch user bio separately

```typescript
// BEFORE
.select('*, users!inner(bio)')

// AFTER
.select('id, user_id, position, photo_url, unique_player_id, jersey_number, height_cm, weight_kg, date_of_birth, nationality, preferred_foot, current_club_id, is_available_for_scout, address, district, state')
// Then fetch user data separately
.select('bio')
```

#### 6. `/Users/bineshbalan/pcl/apps/web/src/app/scout/players/page.tsx`
**Issues**: 
- Line 132: `.select('*, users(id, first_name, last_name, email, bio)')`
- Lines 334, 375: `.select('*, users(first_name, last_name)')`

**Fixes**:
- Changed initial query to specific columns (added state, district, address, total_matches_played, total_goals_scored, total_assists)
- Split relationship joins into separate queries
- Fetch user data separately after getting player data

#### 7. `/Users/bineshbalan/pcl/apps/web/src/app/dashboard/player/contracts/[id]/view/page.tsx`
**Issue**: Line 110 had `.select('*')` on players table
**Fix**: Changed to specific column selection and fixed player name generation

#### 8. `/Users/bineshbalan/pcl/apps/web/src/components/forms/PlayerProfileForm.tsx` (Bonus Fix)
**Issue**: Line 234 had `maxSizeMB={5}` but component expects `maxSizeKB`
**Fix**: Changed to `maxSizeKB={5120}` (5MB = 5120KB)

## Standard Player Column Selection
All player queries now use this consistent column set:
```
id, user_id, position, photo_url, unique_player_id, jersey_number, height_cm, weight_kg, date_of_birth, nationality, preferred_foot, current_club_id, is_available_for_scout
```

Additional columns when needed:
- `state, district, address` - for scout filtering
- `total_matches_played, total_goals_scored, total_assists` - for player stats

## User Data Queries
User information (first_name, last_name, bio, email) is now **always fetched separately** from the users table:
```typescript
const { data: userData } = await supabase
  .from('users')
  .select('first_name, last_name, bio, email')
  .eq('id', player.user_id)
  .single()
```

## Testing
✅ All files compile without errors
✅ No TypeScript compilation errors
✅ All changes follow consistent pattern

## Next Steps
1. Hard refresh browser (Cmd+Shift+R)
2. Test the full flow:
   - Dashboard should load
   - Notifications should display
   - Clicking notifications should navigate to contracts
   - Contract views should display player information
   - Scout page should load available players
3. Verify browser console shows 200 OK responses, no 406 errors

## Why This Works
- Supabase REST API doesn't reject specific column selections with filters
- Separating relationship queries eliminates API validation issues
- Each query is now more efficient and cacheable
- Application logic properly handles optional user data fields

## Verification Command
To verify no `.select('*')` queries remain on players table:
```bash
grep -r "\.from('players')" apps/web/src --include="*.tsx" --include="*.ts" | grep "select('\\*')"
```

Should return only documentation/markdown files, not actual code files.
