-- ============================================
-- FIX CONTRACT RLS POLICIES
-- Run this to fix the club owner update policy
-- ============================================

-- Drop the old restrictive policy
DROP POLICY IF EXISTS "Club owners can update their pending contracts" ON contracts;

-- Create a new policy that allows club owners to update contracts
-- They can cancel pending contracts (change to rejected)
-- They can terminate active contracts (change to terminated)
CREATE POLICY "Club owners can update their contracts"
  ON contracts
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM clubs
      WHERE clubs.id = contracts.club_id
      AND clubs.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    -- Club owners can only update to rejected or terminated
    status IN ('pending', 'rejected', 'terminated')
    AND EXISTS (
      SELECT 1 FROM clubs
      WHERE clubs.id = contracts.club_id
      AND clubs.owner_id = auth.uid()
    )
  );

-- Verify the policies
SELECT schemaname, tablename, policyname, permissive, cmd
FROM pg_policies
WHERE tablename = 'contracts'
ORDER BY policyname;
