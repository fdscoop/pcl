# 🔧 Infinite Recursion Fix - Quick Guide

## 🚨 Problem

You're seeing these errors:
```
Error loading contracts: infinite recursion detected in policy for relation "contracts"
Error loading notifications: infinite recursion detected in policy for relation "players"
500 Internal Server Error
```

## 🎯 Root Cause

Your RLS (Row Level Security) policies have **circular dependencies**:
- `contracts` policies query `players` table (which has RLS)
- `players` policies query `contracts` table (which has RLS)  
- `notifications` policies query both `players` and `contracts` (both have RLS)

This creates an **infinite loop** 🔄

## ✅ Solution

I've created a complete fix: **`FIX_INFINITE_RECURSION_COMPLETE.sql`**

This fix:
1. Replaces `EXISTS()` with `IN()` subqueries
2. Simplifies policies to avoid cross-table RLS checks
3. Uses direct `auth.uid()` checks where possible

## 📋 How to Apply the Fix

### Step 1: Go to Supabase
1. Open https://app.supabase.com
2. Select your project (`uvifkmkdoiohqrdbwgzt`)
3. Click **"SQL Editor"** in the left sidebar
4. Click **"New Query"**

### Step 2: Run the Fix
1. Open the file: **`FIX_INFINITE_RECURSION_COMPLETE.sql`**
2. Copy ALL the SQL (Cmd+A, Cmd+V)
3. Paste into Supabase SQL Editor
4. Click **"RUN"** button (or press Cmd+Enter)
5. Wait for **"Success"** message ✅

### Step 3: Verify
You should see three tables with their policies listed:
- `contracts` - 5 policies
- `players` - 5 policies
- `notifications` - 5 policies

### Step 4: Test Your App
1. Go back to your app in the browser
2. **Hard refresh**: `Cmd+Shift+R` (Mac) or `Ctrl+Shift+R` (Windows)
3. Navigate to club dashboard
4. Check that contracts and notifications load without errors

## 🔍 What Changed?

### Before (Causing Recursion):
```sql
-- ❌ This causes recursion
CREATE POLICY "Players can view their contracts"
  ON contracts
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM players  -- ← players has RLS!
      WHERE players.id = contracts.player_id
      AND players.user_id = auth.uid()
    )
  );
```

### After (No Recursion):
```sql
-- ✅ This works
CREATE POLICY "Players can view their contracts"
  ON contracts
  FOR SELECT
  USING (
    player_id IN (SELECT id FROM players WHERE user_id = auth.uid())
  );
```

## 🎯 Key Differences

| Old (Broken) | New (Fixed) |
|-------------|-------------|
| Uses `EXISTS()` | Uses `IN()` |
| Cross-table RLS checks | Simplified subqueries |
| Circular dependencies | Linear dependencies |

## 📊 Expected Results

After applying the fix, these queries should work:

✅ Load contracts for club owners
```sql
SELECT * FROM contracts WHERE club_id = 'your-club-id'
```

✅ Load notifications for club owners
```sql
SELECT * FROM notifications WHERE club_id = 'your-club-id'
```

✅ Load contracts for players
```sql
SELECT * FROM contracts WHERE player_id = 'your-player-id'
```

✅ Load notifications for players
```sql
SELECT * FROM notifications WHERE player_id = 'your-player-id'
```

## 🐛 Still Having Issues?

### Check 1: Verify RLS is enabled
```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('contracts', 'players', 'notifications');
```

All should show `rowsecurity = true`

### Check 2: List all policies
```sql
SELECT tablename, policyname, cmd
FROM pg_policies
WHERE tablename IN ('contracts', 'players', 'notifications')
ORDER BY tablename, policyname;
```

You should see 15 policies total (5 per table)

### Check 3: Test queries directly in Supabase
Go to Supabase SQL Editor and run:
```sql
-- Test as a club owner
SELECT * FROM contracts LIMIT 5;
SELECT * FROM notifications LIMIT 5;

-- Test as a player
SELECT * FROM players WHERE user_id = auth.uid();
```

## 📝 Summary

**Files to use:**
- 📄 **FIX_INFINITE_RECURSION_COMPLETE.sql** - The complete fix (copy/paste this)
- 📄 **INFINITE_RECURSION_FIX_GUIDE.md** - This guide

**Time required:** ~2 minutes

**Steps:**
1. Copy SQL
2. Paste in Supabase
3. Run
4. Hard refresh your app
5. Done! ✅

---

## 🎉 After the Fix

Your app should:
- ✅ Load club dashboard without 500 errors
- ✅ Show contracts correctly
- ✅ Show notifications correctly
- ✅ No infinite recursion errors in console
- ✅ All RLS policies working properly

If you still see issues after this, check the browser console for any new errors and let me know!
