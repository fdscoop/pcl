-- Fix RLS Policy for Scout Players
-- The club owner should be able to view verified players without needing KYC verification

-- First, drop the old restrictive policy
DROP POLICY IF EXISTS "Club owners can view verified players" ON players;

-- Create new policy that allows club owners to view verified players
-- without requiring the club owner to have kyc_status = 'verified'
CREATE POLICY "Club owners can view verified players"
  ON players
  FOR SELECT
  USING (
    is_available_for_scout = true
    AND EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'club_owner'
    )
  );

-- Verify the policy is created
SELECT schemaname, tablename, policyname, permissive, cmd
FROM pg_policies
WHERE tablename = 'players'
AND policyname = 'Club owners can view verified players';
