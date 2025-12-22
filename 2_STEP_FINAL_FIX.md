# FINAL FIX: Just 2 Steps to Resolve 406 Error

## The Issue
```
Failed to load resource: the server responded with a status of 406
GET /rest/v1/players?select=id,user_id,...&user_id=eq.UUID
```

**Root Cause:** Using `.eq('user_id')` on players table triggers Supabase API error

**Solution:** Remove that filter, fetch all players, filter in code

---

## Step 1: Restart Dev Server (2 minutes)

```bash
# Stop the running dev server
# Press Ctrl+C in your terminal

# Clear Next.js cache
cd /Users/bineshbalan/pcl
rm -rf apps/web/.next

# Restart
npm run dev

# Wait for: "ready - started server on 0.0.0.0:3000"
```

---

## Step 2: Test in Browser (1 minute)

1. **Hard refresh:** Press `Cmd+Shift+R`
2. **Login** as a player
3. **Go to notifications**
4. **Click on a contract**
5. **Check console (F12 → Network tab)**
   - Should see `/rest/v1/players` request
   - Status should be **200 OK** ✅ (not 406)

---

## What Changed

**4 files modified** to remove `.eq('user_id')` filter:
- ✅ `player/page.tsx`
- ✅ `player/contracts/page.tsx`
- ✅ `player/contracts/[id]/view/page.tsx`
- ✅ `forms/PlayerProfileForm.tsx`

**All changes:**
- Removed: `.eq('user_id', user.id)`
- Added: `.find(p => p.user_id === user.id)` client-side filtering

---

## Expected Result

| Before | After |
|--------|-------|
| 406 Error ❌ | 200 OK ✅ |
| "Failed to load" | Player data loads |
| Contract won't display | Contract displays perfectly |

---

## If It Still Doesn't Work

Double-check:
- [ ] Killed and restarted dev server
- [ ] Cleared `.next` cache folder
- [ ] Did hard refresh (Cmd+Shift+R)
- [ ] Waiting in browser (give it 10 seconds)
- [ ] Check Network tab for status code

If still broken, tell me the exact HTTP status code you see.

---

**Expected time to fix: 3 minutes ⏱️**
