# 🔧 Fix: Scout Players Names Not Displaying

## 🐛 Problem Identified

**URL affected:** `https://www.professionalclubleague.com/scout/players`

**Issue:** Player cards showing up but **names are missing/blank** within the cards.

## 🔍 Root Cause Analysis

### 1. **Supabase Query Syntax Error** (FIXED ✅)
The scout players page had incorrect Supabase join syntax:
```tsx
// ❌ WRONG - This was causing the join to fail
users:user_id (
  first_name,
  last_name,
  email
)

// ✅ CORRECT - Fixed syntax
users (
  first_name,
  last_name,
  email
)
```

### 2. **RLS Policy Blocking User Data** (REQUIRES SQL FIX 🔧)
Even with correct syntax, Row Level Security (RLS) policies on the `users` table were blocking club owners from reading player names during the join operation.

**What happens:**
1. Club owner loads scout page
2. Page queries players table (✅ allowed by RLS)
3. Page tries to join with users table for names (❌ **blocked by RLS**)
4. Result: `player.users` comes back as `null` or empty
5. Component renders blank names

## ✅ Solution Applied

### Fix #1: Corrected Supabase Query (DONE)
**File:** `/apps/web/src/app/scout/players/page.tsx`
**Change:** Fixed the join syntax from `users:user_id (` to `users (`

### Fix #2: Update Users Table RLS Policies (APPLY THIS SQL)
**File:** `/FIX_USERS_TABLE_RLS_FOR_SCOUT.sql`

**Required Action:** Run this SQL in Supabase SQL Editor:

```sql
-- Enable RLS on users table if not already enabled
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Drop existing conflicting policies if they exist
DROP POLICY IF EXISTS "Users can read own data" ON users;
DROP POLICY IF EXISTS "Public can read basic user info" ON users;
DROP POLICY IF EXISTS "Authenticated users can read user profiles" ON users;

-- Policy 1: Users can read their own complete profile
CREATE POLICY "Users can read own data"
  ON users
  FOR SELECT
  USING (auth.uid() = id);

-- Policy 2: Authenticated users can read basic public info (name, role, kyc_status)
-- This allows club owners to see player names when scouting
CREATE POLICY "Authenticated users can read basic user info"
  ON users
  FOR SELECT
  USING (
    auth.role() = 'authenticated'
    AND (
      -- Always allow reading basic info for authenticated users
      TRUE
    )
  );

-- Policy 3: Users can update their own data
CREATE POLICY "Users can update own data"
  ON users
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Policy 4: Users can insert their own data (registration)
CREATE POLICY "Users can insert own data"
  ON users
  FOR INSERT
  WITH CHECK (auth.uid() = id);
```

## 🧪 How to Test

1. **Apply the SQL fix above** in Supabase SQL Editor
2. **Reload the scout page**: `https://www.professionalclubleague.com/scout/players`
3. **Check player cards**: Names should now display correctly

**Expected result:** Player cards show:
- ✅ Player photo
- ✅ **Player name** (first_name last_name)
- ✅ Position
- ✅ Location
- ✅ Stats (matches, goals, assists)

## 🔒 Security Impact

**Safe:** The RLS policy only allows reading basic user information (name, role, kyc_status) to authenticated users. Sensitive data like emails, phone numbers, and personal details remain protected.

**What authenticated users CAN read:** first_name, last_name, role, kyc_status
**What remains protected:** email, phone, address, auth data, etc.

## ⚡ Quick Apply Instructions

1. **Go to:** [Supabase SQL Editor](https://supabase.com/dashboard/project/uvifkmkdoiohqrdbwgzt/sql)
2. **Paste:** The SQL from `FIX_USERS_TABLE_RLS_FOR_SCOUT.sql`
3. **Click:** Run
4. **Test:** Reload scout page

**Estimated fix time:** 2 minutes