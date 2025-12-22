-- ============================================
-- FIX: Allow club owners to view player data when viewing contracts
-- ============================================
--
-- The issue: Club owners could load contracts, but when trying to fetch
-- player data for contract display, they were blocked by RLS policies.
--
-- Solution: Create a specific policy that allows viewing player data
-- for players they have contracts with.
--
-- ============================================

-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Users can view specific player records" ON players;

-- Create a new policy that allows:
-- 1. Players to view their own data
-- 2. Club owners to view player data for players they have contracts with
-- 3. Admins to view all players
CREATE POLICY "View player data for contracts"
  ON players
  FOR SELECT
  USING (
    -- Players can view their own data
    auth.uid() = user_id
    OR
    -- Club owners can view player data for contracts their club has
    (
      SELECT COUNT(*) > 0 
      FROM contracts 
      WHERE contracts.player_id = players.id
      AND contracts.club_id IN (
        SELECT id FROM clubs WHERE owner_id = auth.uid()
      )
    )
    OR
    -- Admins can view all players
    auth.uid() IN (
      SELECT id FROM users WHERE role = 'admin'::user_role
    )
    OR
    -- Club owners can view available players for scouting
    (
      is_available_for_scout = true
      AND auth.uid() IN (
        SELECT id FROM users
        WHERE role = 'club_owner'::user_role
        AND kyc_status = 'verified'::kyc_status
      )
    )
  );

-- Verify the policy
SELECT 
  policyname,
  cmd
FROM pg_policies
WHERE tablename = 'players'
ORDER BY policyname;

-- ============================================
-- SUCCESS!
-- ============================================
-- Club owners can now view player data for contracts their club has created
-- This should fix the 406/403 errors when club owners try to view contracts
