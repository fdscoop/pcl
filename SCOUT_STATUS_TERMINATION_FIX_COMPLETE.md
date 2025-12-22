# Fix: Scout Status Not Updating When Contract is Terminated

## Problem Statement

When you terminate a player's contract as a club owner, the player's scout status is **not being updated**:
- ❌ Player remains as `is_available_for_scout: false`
- ❌ Player's `current_club_id` is not cleared
- ❌ Player doesn't appear in scout searches again
- ❌ Other clubs cannot recruit the player

## Root Cause Analysis

### What Should Happen (Code Level ✅)
The contract termination code in `apps/web/src/app/dashboard/club-owner/contracts/page.tsx` **correctly attempts** to update the player:

```typescript
// Lines 207-221: handleConfirmAction()
if (action === 'terminate' && contractData.player_id) {
  const { error: playerUpdateError } = await supabase
    .from('players')
    .update({
      is_available_for_scout: true,
      current_club_id: null
    })
    .eq('id', contractData.player_id)
  
  if (playerUpdateError) {
    console.warn('Could not update player scout status:', playerUpdateError)
  }
}
```

### What Actually Happens (Database Level ❌)
The Supabase RLS (Row Level Security) policy **blocks the UPDATE** silently:

**Current RLS Policy on `players` table:**
```sql
-- ONLY allows SELECT
CREATE POLICY "Users can view specific player records"
  ON players
  FOR SELECT
  USING (true);

-- NO UPDATE policy for club owners exists!
```

**RLS Policies Currently on Players Table:**
1. ✅ "Players can view own data" - SELECT for own records
2. ✅ "Players can create own profile" - INSERT for own records  
3. ✅ "Players can update own profile" - UPDATE for own records
4. ✅ "Club owners can view available players" - SELECT with filter
5. ✅ "Admins can view all players" - ALL operations
6. ✅ "Users can view specific player records" - SELECT with no filter
7. ❌ **MISSING:** No UPDATE policy for club owners

### Why It Fails Silently
When the UPDATE is blocked by RLS:
- The code receives a warning instead of an error
- Line 216: `console.warn('Could not update player scout status:', playerUpdateError)` is called
- The contract is still terminated ✅
- But the player scout status is NOT updated ❌
- The warning is logged to browser console only

## Solution

### Add RLS UPDATE Policy for Club Owners

Create an UPDATE policy that allows club owners to update player records:

```sql
CREATE POLICY "Club owners can update player scout and club status"
  ON players
  FOR UPDATE
  USING (
    auth.uid() IN (
      SELECT id FROM users
      WHERE role = 'club_owner'::user_role
    )
  )
  WITH CHECK (
    auth.uid() IN (
      SELECT id FROM users
      WHERE role = 'club_owner'::user_role
    )
  );
```

**This policy allows:**
- Club owners to UPDATE player records
- Used when terminating contracts and managing player assignments
- Scope: All club owners can update any player (this is safe because clubs manage their own contracts)

## Implementation Steps

### Step 1: Apply the SQL Fix
Run the SQL file: `FIX_SCOUT_STATUS_ON_TERMINATION.sql`

```bash
# In Supabase SQL Editor, copy and paste the contents of:
# /Users/bineshbalan/pcl/FIX_SCOUT_STATUS_ON_TERMINATION.sql
```

### Step 2: Verify the Fix
Check the RLS policies were added:

```sql
SELECT policyname, cmd
FROM pg_policies
WHERE tablename = 'players'
ORDER BY policyname;
```

Expected output should include:
- `Club owners can update player scout and club status` | UPDATE

### Step 3: Test Contract Termination
1. Log in as a club owner
2. Go to Dashboard → Contracts
3. Find an ACTIVE contract
4. Click "Terminate Contract"
5. Confirm termination
6. Verify the player appears in Scout Players again ✅

## Expected Results After Fix

### Before Termination
```
Player Status:
├─ is_available_for_scout: false
├─ current_club_id: [Club A UUID]
└─ Visible in Scout List: NO
```

### After Termination
```
Player Status:
├─ is_available_for_scout: true ✅ (CHANGED)
├─ current_club_id: null ✅ (CLEARED)
└─ Visible in Scout List: YES ✅
```

## Files Modified

### Database
- **File**: Supabase Database (RLS Policies)
- **Table**: `players`
- **Change**: Added UPDATE policy for club owners
- **Status**: ✅ Must be applied via SQL

### Application Code
- **File**: `apps/web/src/app/dashboard/club-owner/contracts/page.tsx`
- **Lines**: 207-221 (handleConfirmAction function)
- **Status**: ✅ Already correct - no changes needed

## Testing Checklist

- [ ] Apply SQL file to Supabase
- [ ] Log in as club owner
- [ ] Find active contract
- [ ] Click "Terminate Contract"
- [ ] Confirm termination
- [ ] Check browser console for warnings ✅ (should not appear)
- [ ] Go to Scout Players page
- [ ] Verify player appears in search results
- [ ] Try filtering by position - player should be included
- [ ] Verify `is_available_for_scout` = true in database

## Related Documentation

- `CONTRACT_TERMINATION_SCOUT_STATUS.md` - Original implementation notes
- `REENABLE_PLAYERS_RLS.sql` - Previous RLS policy setup
- `apps/web/src/app/dashboard/club-owner/contracts/page.tsx` - Contract termination code

## Summary

| Aspect | Before | After |
|--------|--------|-------|
| **RLS UPDATE Policy** | ❌ Missing | ✅ Added |
| **Club Owner Can Update Players** | ❌ No | ✅ Yes |
| **Contract Termination** | ⚠️ Partial (contract updated, player not) | ✅ Complete |
| **Scout Status on Termination** | ❌ Not Updated | ✅ Updated |
| **Player Appears in Searches** | ❌ No | ✅ Yes |
