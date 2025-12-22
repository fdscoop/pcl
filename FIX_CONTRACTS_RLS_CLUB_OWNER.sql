-- ============================================
-- FIX: Allow club owners to view contracts in their club dashboard
-- ============================================
--
-- Issue: Club owners see "You do not have permission to view this contract"
-- Root cause: Contracts RLS policy isn't allowing club owners to view contracts
--
-- Solution: Ensure club owners can view contracts for their clubs
--
-- ============================================

-- Check current RLS state and policies
SELECT tablename, rowsecurity
FROM pg_tables
WHERE tablename = 'contracts';

SELECT policyname, cmd, qual
FROM pg_policies
WHERE tablename = 'contracts'
ORDER BY policyname;

-- Drop and recreate contracts RLS policies with club owner access
DROP POLICY IF EXISTS "Club owners can view their contracts" ON contracts;
DROP POLICY IF EXISTS "Club owners can create contracts" ON contracts;
DROP POLICY IF EXISTS "Club owners can update their contracts" ON contracts;
DROP POLICY IF EXISTS "Club owners can update their pending contracts" ON contracts;
DROP POLICY IF EXISTS "Players can view their contracts" ON contracts;
DROP POLICY IF EXISTS "Players can update contract status" ON contracts;

-- 1. Club owners can view contracts for their clubs
CREATE POLICY "Club owners can view their contracts"
  ON contracts
  FOR SELECT
  USING (
    club_id IN (
      SELECT id FROM clubs WHERE owner_id = auth.uid()
    )
  );

-- 2. Club owners can create contracts for their clubs
CREATE POLICY "Club owners can create contracts"
  ON contracts
  FOR INSERT
  WITH CHECK (
    club_id IN (
      SELECT id FROM clubs WHERE owner_id = auth.uid()
    )
  );

-- 3. Club owners can update contracts for their clubs
CREATE POLICY "Club owners can update their contracts"
  ON contracts
  FOR UPDATE
  USING (
    club_id IN (
      SELECT id FROM clubs WHERE owner_id = auth.uid()
    )
  );

-- 4. Players can view contracts where they are the player
CREATE POLICY "Players can view their contracts"
  ON contracts
  FOR SELECT
  USING (
    player_id IN (
      SELECT id FROM players WHERE user_id = auth.uid()
    )
  );

-- 5. Players can update contract status (sign/reject)
CREATE POLICY "Players can update contract status"
  ON contracts
  FOR UPDATE
  USING (
    player_id IN (
      SELECT id FROM players WHERE user_id = auth.uid()
    )
  );

-- Verify the policies were created
SELECT 
  policyname,
  cmd,
  CASE 
    WHEN qual IS NOT NULL THEN 'HAS USING clause'
    ELSE 'NO USING clause'
  END as has_using,
  CASE 
    WHEN with_check IS NOT NULL THEN 'HAS WITH CHECK clause'
    ELSE 'NO WITH CHECK clause'
  END as has_with_check
FROM pg_policies
WHERE tablename = 'contracts'
ORDER BY policyname;

-- ============================================
-- SUCCESS!
-- ============================================
-- Club owners can now:
-- - View all contracts for their clubs (SELECT)
-- - Create new contracts (INSERT)
-- - Update contracts (UPDATE)
--
-- Players can:
-- - View contracts where they are the player (SELECT)
-- - Sign/reject contracts (UPDATE)
--
-- This should fix the "You do not have permission" error!
