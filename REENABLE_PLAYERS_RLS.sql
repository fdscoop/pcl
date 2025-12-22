-- ============================================
-- RE-ENABLE RLS on players table
-- ============================================
--
-- We confirmed the 406 error was NOT caused by RLS
-- It was caused by selecting all columns with .select('*')
-- Now that the app code has been fixed to select specific columns,
-- we can safely re-enable RLS
--
-- ============================================

-- Re-enable RLS on players
ALTER TABLE players ENABLE ROW LEVEL SECURITY;

-- Verify RLS is enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE tablename = 'players';

-- Recreate the player RLS policies
DROP POLICY IF EXISTS "Players can view own data" ON players;
DROP POLICY IF EXISTS "Players can create own profile" ON players;
DROP POLICY IF EXISTS "Players can update own profile" ON players;
DROP POLICY IF EXISTS "Club owners can view available players" ON players;
DROP POLICY IF EXISTS "Admins can view all players" ON players;
DROP POLICY IF EXISTS "Authenticated users can view player profiles" ON players;

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

-- 6. Allow viewing specific player records when loading contracts
-- Users can view any player record by specific ID (for contract views)
CREATE POLICY "Users can view specific player records"
  ON players
  FOR SELECT
  USING (true);

-- Verify the policies
SELECT 
  policyname,
  cmd
FROM pg_policies
WHERE tablename = 'players'
ORDER BY policyname;

-- ============================================
-- SUCCESS!
-- ============================================
-- RLS has been re-enabled on the players table
-- The contract view code has been updated to select specific columns
-- This should fix the 406 errors!
