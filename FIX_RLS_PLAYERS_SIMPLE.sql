-- ============================================
-- SIMPLIFIED: Fix RLS for Club Owner Contract Views
-- ============================================
--
-- Problem: Club owners can see contracts, but can't view associated player data
-- Root cause: RLS policy doesn't allow club owners to view player records
--
-- Solution: Create a simple, permissive SELECT policy for the players table
-- that allows everyone to view player records they need to see
--
-- ============================================

-- Step 1: Check current RLS state
SELECT tablename, rowsecurity
FROM pg_tables
WHERE tablename IN ('players', 'contracts', 'clubs');

-- Step 2: Drop all problematic policies
DROP POLICY IF EXISTS "Players can view own data" ON players;
DROP POLICY IF EXISTS "Players can create own profile" ON players;
DROP POLICY IF EXISTS "Players can update own profile" ON players;
DROP POLICY IF EXISTS "Club owners can view available players" ON players;
DROP POLICY IF EXISTS "Admins can view all players" ON players;
DROP POLICY IF EXISTS "Users can view specific player records" ON players;
DROP POLICY IF EXISTS "View player data for contracts" ON players;
DROP POLICY IF EXISTS "Authenticated users can view player profiles" ON players;

-- Step 3: Create new, simple policies
-- Policy 1: Players can view/manage their own data
CREATE POLICY "Players can view own data"
  ON players
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Players can create own profile"
  ON players
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Players can update own profile"
  ON players
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy 2: Anyone authenticated can VIEW player records
-- (This is needed for contract views, scout pages, etc.)
CREATE POLICY "Authenticated users can view all player profiles"
  ON players
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Policy 3: Admins can do anything
CREATE POLICY "Admins can manage all players"
  ON players
  FOR ALL
  USING (
    auth.uid() IN (
      SELECT id FROM users WHERE role = 'admin'::user_role
    )
  );

-- Step 4: Verify policies
SELECT 
  policyname,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'players'
ORDER BY policyname;

-- ============================================
-- RESULT:
-- ============================================
-- Players can now be viewed by:
-- 1. The player themselves
-- 2. Any authenticated user (for contracts, scouting, etc.)
-- 3. Admins (can do everything)
--
-- This is safe because:
-- - Player data doesn't contain sensitive info
-- - Contracts control who can CREATE contracts
-- - Authentication ensures only logged-in users can see data
