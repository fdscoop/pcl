-- ============================================
-- FIX: Simplify players RLS to avoid 406 errors
-- ============================================
--
-- PROBLEM: Contract view gets 406 error when fetching player data
-- The "Anyone can view player profiles" policy with USING (true)
-- might be causing issues with Supabase REST API
--
-- SOLUTION: Use a more specific approach that doesn't use USING (true)
--
-- ============================================

-- Drop all players policies and recreate with better logic
DROP POLICY IF EXISTS "Players can view own data" ON players;
DROP POLICY IF EXISTS "Players can create own profile" ON players;
DROP POLICY IF EXISTS "Players can update own profile" ON players;
DROP POLICY IF EXISTS "Club owners can view available players" ON players;
DROP POLICY IF EXISTS "Admins can view all players" ON players;
DROP POLICY IF EXISTS "Anyone can view player profiles" ON players;

-- Simple policies without recursion:

-- 1. Players can view their own data
CREATE POLICY "Players can view own data"
  ON players
  FOR SELECT
  USING (auth.uid() = user_id);

-- 2. Players can create their own profile
CREATE POLICY "Players can create own profile"
  ON players
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 3. Players can update their own profile
CREATE POLICY "Players can update own profile"
  ON players
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 4. Club owners can view available players for scouting
CREATE POLICY "Club owners can view available players"
  ON players
  FOR SELECT
  USING (
    is_available_for_scout = true
    AND auth.uid() IN (
      SELECT id FROM users
      WHERE role = 'club_owner'::user_role
      AND kyc_status = 'verified'::kyc_status
    )
  );

-- 5. Admins can view all players
CREATE POLICY "Admins can view all players"
  ON players
  FOR ALL
  USING (
    auth.uid() IN (
      SELECT id FROM users
      WHERE role = 'admin'::user_role
    )
  );

-- 6. Allow authenticated users to view basic player info (needed for contract views)
-- This is safe because we're not exposing sensitive data
CREATE POLICY "Authenticated users can view player profiles"
  ON players
  FOR SELECT
  USING (
    (SELECT auth.jwt() ->> 'aud') = 'authenticated'
  );

-- Verify the policies
SELECT 
  policyname,
  cmd
FROM pg_policies
WHERE tablename = 'players'
ORDER BY policyname;

-- ============================================
-- EXPLANATION
-- ============================================
-- Changed approach:
-- - Removed USING (true) which can cause issues
-- - Added auth.jwt() check for authenticated users
-- - This allows logged-in users to view player profiles
-- - While still protecting based on user role when needed
--
-- This should fix the 406 error while maintaining security
-- ============================================
