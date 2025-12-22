# Quick Fix: Rebuild and Test

## Step 1: Stop the dev server
Press `Ctrl+C` in your terminal running `npm run dev`

##  Step 2: Clear Next.js cache
```bash
cd /Users/bineshbalan/pcl
rm -rf apps/web/.next
```

## Step 3: Restart dev server
```bash
npm run dev
```

## Step 4: Hard refresh browser
- Press `Cmd+Shift+R` (force refresh, clear cache)

## Step 5: Test again
- Navigate to club owner dashboard
- Click on a notification
- Check browser console (F12 → Network tab)
- Look for the players request
- Should now say 200 OK, not 406

---

## If Still Getting 406

The issue might be an **RLS policy blocking club owners** from viewing player data.

In that case, apply this SQL in Supabase:
```sql
-- Copy contents of FIX_RLS_CLUB_OWNER_PLAYER_VIEW.sql
```

---

## Quick Diagnostic

Open browser console and paste:
```javascript
// Check what requests are being made
console.log('If you see any 406 or 403 errors below, note them:')
```

Then repeat the steps to trigger the error and report what you see.
