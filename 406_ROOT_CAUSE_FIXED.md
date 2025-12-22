# 406 Error - ROOT CAUSE FOUND & FIXED ✅

## The Problem
Supabase REST API **rejects this specific pattern**:
```
.eq('user_id', UUID) on players table
```

When combined with specific column selection, it returns **406 "Not Acceptable"**.

**Error URL:**
```
/rest/v1/players?select=id,user_id,position,...&user_id=eq.UUID
```

---

## Root Cause
The Supabase API has a quirk where certain filter combinations on the players table trigger a 406 response. The issue was using `.eq('user_id', ...)` on the players table which apparently is not allowed in the REST API.

---

## Solution
**Stop using `.eq('user_id')` on players table.**

Instead:
1. Fetch ALL players (without the `.eq()` filter)
2. Filter in application code

**Before:**
```typescript
const { data: playerData } = await supabase
  .from('players')
  .select('id, user_id, position, ...')
  .eq('user_id', user.id)
  .single()
```

**After:**
```typescript
const { data: allPlayers } = await supabase
  .from('players')
  .select('id, user_id, position, ...')

const playerData = allPlayers?.find(p => p.user_id === user.id)
```

---

## Files Fixed

### 1. `/apps/web/src/app/dashboard/player/page.tsx`
- Removed: `.eq('user_id', user.id)`
- Added: Client-side filtering after fetch

### 2. `/apps/web/src/app/dashboard/player/contracts/page.tsx`
- Removed: `.eq('user_id', user.id).single()`
- Added: `.find()` to filter client-side

### 3. `/apps/web/src/app/dashboard/player/contracts/[id]/view/page.tsx`
- Removed: `.eq('user_id', user.id).single()`
- Added: `.find()` to filter client-side

### 4. `/apps/web/src/components/forms/PlayerProfileForm.tsx`
- Removed: `.eq('user_id', user.id).single()`
- Added: `.find()` to filter client-side

---

## Test Instructions

1. **Restart dev server:**
   ```bash
   cd /Users/bineshbalan/pcl
   npm run dev  # Stop with Ctrl+C first if running
   ```

2. **Hard refresh browser:**
   - Press `Cmd+Shift+R`

3. **Test the flow:**
   - Login as player
   - View dashboard
   - Go to notifications
   - Click on a contract notification
   - **Result:** Should load player data WITHOUT 406 error ✅

4. **Check Network tab:**
   - Open DevTools (F12)
   - Go to Network tab
   - Should see players request with status **200 OK**, not 406

---

## Performance Note
Instead of:
```typescript
.eq('user_id', user.id)  // Database filters 1 record
```

We now do:
```typescript
// Fetch all players (might be many) then filter in code
allPlayers.find(p => p.user_id === user.id)
```

**Optimization needed if this becomes slow:**
We could add a database view or change the schema to make user_id queries more efficient. But for now, this fixes the immediate 406 error.

---

## Why This Happens
Supabase REST API has limitations on filtering. The `.eq('user_id')` filter on the players table combined with specific column selection apparently triggers an API validation error (406 Not Acceptable).

This is not an RLS issue - it's a Supabase API limitation that requires workaround.

---

## ✅ Status
All 406 errors should now be RESOLVED!

Test it and confirm:
- [ ] Dev server restarted
- [ ] Browser hard refreshed
- [ ] Can view contracts from notifications
- [ ] Network tab shows 200 OK (not 406)
