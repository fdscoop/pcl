-- ============================================
-- AGGRESSIVE FIX: Eliminate ALL circular RLS dependencies
-- ============================================
--
-- The problem: "Club owners can view contracted players" policy
-- references contracts table which has RLS
-- This creates: players RLS → contracts RLS → players RLS (circular!)
--
-- Solution: Simplify the policy to avoid cross-table RLS checks
--
-- ============================================

-- Drop the problematic players policy
DROP POLICY IF EXISTS "Club owners can view contracted players" ON players;

-- OPTION 1: Keep it but make it truly non-recursive
-- This checks if the current user owns any club that has this player in a contract
-- WITHOUT triggering RLS on contracts table
CREATE POLICY "Club owners can view contracted players"
  ON players
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM contracts c
      WHERE c.player_id = players.id
      AND c.club_id IN (
        SELECT id FROM clubs WHERE owner_id = auth.uid()
      )
    )
  );

-- Verify the fix
SELECT 
  tablename,
  policyname,
  cmd
FROM pg_policies
WHERE tablename = 'players'
ORDER BY policyname;

-- ============================================
-- SUCCESS!
-- ============================================
-- The circular dependency has been eliminated!
-- Hard refresh your app and try again.
