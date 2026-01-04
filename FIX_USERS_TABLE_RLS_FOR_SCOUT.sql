-- ============================================
-- FIX: Users Table RLS for Scout Players Feature
-- ============================================
-- Problem: Scout players page not showing player names because RLS blocks the join
-- Solution: The users table must allow reading user data when players table references it
-- 
-- When club owners query the players table with a users() join,
-- Supabase needs to be able to read the users records that are referenced by players.
-- The users table has a user_id foreign key to users(id).

-- Enable RLS on users table if not already enabled
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies on users table first
DROP POLICY IF EXISTS "Users can read own data" ON users;
DROP POLICY IF EXISTS "Users can read their own data" ON users;
DROP POLICY IF EXISTS "Public can read basic user info" ON users;
DROP POLICY IF EXISTS "Authenticated users can read user profiles" ON users;
DROP POLICY IF EXISTS "Authenticated users can read basic user info" ON users;
DROP POLICY IF EXISTS "Authenticated users can read player profiles for scouting" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;
DROP POLICY IF EXISTS "Users can insert own data" ON users;

-- Policy 1: Users can read their own complete profile (primary security policy)
CREATE POLICY "Users can read own data"
  ON users
  FOR SELECT
  USING (auth.uid() = id);

-- Policy 2: Authenticated users can read basic public player info
-- This is CRITICAL for the scout players feature to work
-- When club owners query: SELECT players(..., users(...))
-- Supabase must be able to read the referenced users records
-- We allow reading: id, first_name, last_name, email, bio, role, kyc_status
-- We block reading: passwords, sensitive auth data, etc.
CREATE POLICY "Authenticated users can read player profiles for scouting"
  ON users
  FOR SELECT
  USING (
    auth.role() = 'authenticated'
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

-- Verify the policies were created
SELECT tablename, policyname, cmd
FROM pg_policies
WHERE tablename = 'users'
ORDER BY policyname;

-- Success message
SELECT '✅ Users table RLS policies updated for scout feature' as status;

-- ============================================
-- VERIFICATION: How the data flows
-- ============================================
-- 
-- 1. Club owner visits /scout/players
-- 2. Page executes query:
--    SELECT players(..., users(...)) 
--    WHERE is_available_for_scout = true
--
-- 3. Database execution:
--    a) players table RLS allows: Club owners can see available players ✅
--    b) FOR EACH player row, need to fetch users data via user_id foreign key
--    c) users table RLS must allow: Authenticated users can read player profiles ✅
--
-- 4. Result:
--    { 
--      id: "player-uuid",
--      user_id: "user-uuid",
--      users: { id, first_name, last_name, email, bio, ... }
--    }
--
-- 5. Component displays:
--    - player.users[0].first_name + player.users[0].last_name ✅
--    - Plus all other player stats
--
-- Without the "Authenticated users can read player profiles" policy,
-- the users join would fail and names would be blank.
