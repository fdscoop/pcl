# EMERGENCY: Fix 500 Errors Now

## Problem
The RLS policies we created caused infinite recursion, breaking all player queries with 500 errors.

## Solution Steps (Takes 2 minutes)

### Step 1: Open Supabase Dashboard
1. Go to https://supabase.com/dashboard
2. Select your project
3. Click on **SQL Editor** in the left sidebar

### Step 2: Run the Fix
1. Click **New Query**
2. Copy the entire contents of `EMERGENCY_FIX_500_ERROR.sql`
3. Paste it into the SQL Editor
4. Click **Run** button

### Step 3: Verify the Fix
1. Go back to your app: http://localhost:3006/dashboard/player
2. Refresh the page
3. Check browser console - the 500 errors should be gone

## What the Fix Does

The fix:
- ✅ Drops the problematic recursive policies
- ✅ Creates simple, non-recursive policies
- ✅ Allows authenticated users to read clubs (safe - club data is public)
- ✅ Allows players to read their own player data
- ✅ Allows players to read their own contracts
- ✅ Allows club owners to read their club's contracts

## After Fixing

Once the 500 errors are resolved:
1. Test the player dashboard
2. Test the contracts page: http://localhost:3006/dashboard/player/contracts
3. Test viewing a contract with full club and player information

## If Still Having Issues

If you still see 500 errors after running the SQL:
1. Check the SQL Editor for any error messages
2. Share the error message with me
3. We may need to disable RLS temporarily on specific tables
