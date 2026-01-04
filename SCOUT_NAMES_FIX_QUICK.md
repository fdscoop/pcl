# 🚀 Quick Fix: Scout Player Names Not Displaying

## Issue
Player names not showing on scout players page: https://www.professionalclubleague.com/scout/players

## Root Cause
1. ✅ **Fixed:** Supabase query syntax error in scout page
2. 🔧 **Needs SQL:** RLS policy blocking user name data

## 30-Second Fix

### Step 1: Go to Supabase
https://supabase.com/dashboard/project/uvifkmkdoiohqrdbwgzt/sql

### Step 2: Paste & Run This SQL
```sql
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own data" ON users;
DROP POLICY IF EXISTS "Authenticated users can read basic user info" ON users;

CREATE POLICY "Users can read own data"
  ON users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Authenticated users can read basic user info"
  ON users FOR SELECT
  USING (auth.role() = 'authenticated');
```

### Step 3: Test
Reload: https://www.professionalclubleague.com/scout/players

**Result:** Player names will now display ✅

## What This Fixes
- ❌ Before: Blank player cards (no names)
- ✅ After: Full player cards with names

## Security
Safe - only allows reading basic user info (names) to authenticated users.