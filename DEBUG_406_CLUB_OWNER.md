# Debug: 406 Errors Still Appearing in Club Owner Contract View

## What We Know
✅ **Works:** Player dashboard → click notification → view contract (loads player data)
❌ **Fails:** Club owner notifications → click notification → view contract (406 error on player data)

## Root Causes (in order of likelihood)

### 1. **Next.js Build Cache** (MOST LIKELY)
The app might be serving an old compiled version with the `.select('*')` code.

**Fix:**
```bash
cd /Users/bineshbalan/pcl
npm run dev  # Stop if running (Ctrl+C)
rm -rf apps/web/.next  # Clear Next.js cache
npm run dev  # Restart
```

Then in browser:
- Press `Cmd+Shift+R` to hard refresh
- Test again

### 2. **RLS Policy Blocking** (POSSIBLE)
If RLS is enabled on players table, club owners might not have permission to view player data.

**Check RLS state in Supabase:**
```sql
SELECT tablename, rowsecurity
FROM pg_tables
WHERE tablename = 'players';
```

If `rowsecurity = true`, you need RLS policies that allow club owners to view player data.

**Fix:**
Run one of these SQL files in Supabase:
- `FIX_RLS_PLAYERS_SIMPLE.sql` - Allows authenticated users to view all player records
- `FIX_RLS_CLUB_OWNER_PLAYER_VIEW.sql` - More restrictive, only allows viewing related players

### 3. **Supabase Client Version** (UNLIKELY)
Older version might have caching issues.

**Check/Update:**
```bash
cd /Users/bineshbalan/pcl/apps/web
npm update @supabase/supabase-js
npm run dev  # Restart
```

---

## Step-by-Step Debug Process

### Step 1: Clear Cache & Rebuild
```bash
cd /Users/bineshbalan/pcl
npm run dev  # Stop with Ctrl+C if running
rm -rf apps/web/.next
npm run dev  # Restart
```

### Step 2: Check Browser Network Tab
1. Open DevTools (F12)
2. Go to Network tab
3. Click on a notification (as club owner)
4. Look for request to `/rest/v1/players`
5. **Check the Status Column:**
   - **406** = Query format problem (code issue)
   - **403** = RLS blocking (database issue)
   - **200** = Success ✅

### Step 3: If Status is 403
RLS is blocking club owners. Run this in Supabase SQL Editor:
```sql
-- See which policies exist
SELECT policyname, qual
FROM pg_policies
WHERE tablename = 'players'
ORDER BY policyname;

-- Then apply the fix
-- Copy and paste contents of: FIX_RLS_PLAYERS_SIMPLE.sql
```

### Step 4: If Still Not Working
Tell me:
1. The exact HTTP status code (406, 403, 500, etc.)
2. The exact error message from the Network tab
3. Full URL of the failed request

---

## What Each Fix Does

### `FIX_RLS_PLAYERS_SIMPLE.sql`
- Makes player records visible to all authenticated users
- Keeps personal player data protected (only players can edit their own)
- Safest and simplest approach
- Allows: contract views, scouting, notifications
- Blocks: unauthorized DELETE/UPDATE operations

### `FIX_RLS_CLUB_OWNER_PLAYER_VIEW.sql`
- More granular permissions
- Club owners can only see players they have contracts with
- Tighter security but more complex

---

## Quick Troubleshooting Checklist

- [ ] Killed and restarted `npm run dev`
- [ ] Cleared `.next` cache folder
- [ ] Hard refreshed browser (Cmd+Shift+R)
- [ ] Checked Network tab for actual HTTP status code
- [ ] If 403: Applied RLS policy fix from Supabase
- [ ] Waited 10 seconds after applying SQL changes
- [ ] Tested again in fresh browser window/private mode

---

## Expected Timeline
1. Cache clear + rebuild: **1-2 minutes**
2. Browser hard refresh: **Instant**
3. RLS policy update (if needed): **Instant**
4. Full test: **2-3 minutes**

Total expected time to resolve: **5 minutes maximum**

---

## Next Action
Please run the cache clear and rebuild steps above, then tell me:
1. What HTTP status code you see (406, 403, or 200)
2. If you changed the RLS policies (yes/no)
3. Does it work now? (yes/no)
