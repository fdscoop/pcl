-- ============================================
-- FIX: Ensure club owners can view contracts
-- ============================================
--
-- Issue: Club owners can't view contracts when accessed directly (e.g., from notification)
-- Cause: RLS policies on contracts table might not include proper club owner permissions
--
-- Solution: Create/update RLS policies to allow club owners to view their contracts
--
-- ============================================

-- Check current RLS state and policies on contracts table
SELECT tablename, rowsecurity
FROM pg_tables
WHERE tablename = 'contracts';

SELECT policyname, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'contracts'
ORDER BY policyname;

-- ============================================
-- Drop ALL existing policies on contracts table
-- ============================================
DROP POLICY IF EXISTS "Club owners can view contracts for their clubs" ON contracts;
DROP POLICY IF EXISTS "Club owners can view their contracts" ON contracts;
DROP POLICY IF EXISTS "Club owners can create contracts" ON contracts;
DROP POLICY IF EXISTS "Club owners can update their contracts" ON contracts;
DROP POLICY IF EXISTS "Club owners can update their pending contracts" ON contracts;
DROP POLICY IF EXISTS "Players can view their contracts" ON contracts;
DROP POLICY IF EXISTS "Players can update their contracts" ON contracts;
DROP POLICY IF EXISTS "Players can update contract status" ON contracts;
DROP POLICY IF EXISTS "Club owners can view contracts" ON contracts;
DROP POLICY IF EXISTS "Club owners can create contract" ON contracts;
DROP POLICY IF EXISTS "Club owners can update contract" ON contracts;

-- ============================================
-- Create club owner policies
-- ============================================

-- 1. Club owners can VIEW contracts for their club
--    Uses RLS bypass: SELECT directly from clubs table without RLS check
CREATE POLICY "Club owners can view contracts for their clubs"
  ON contracts
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM clubs 
      WHERE clubs.id = contracts.club_id 
      AND clubs.owner_id = auth.uid()
    )
  );

-- 2. Club owners can CREATE contracts for their club
CREATE POLICY "Club owners can create contracts"
  ON contracts
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM clubs 
      WHERE clubs.id = contracts.club_id 
      AND clubs.owner_id = auth.uid()
    )
  );

-- 3. Club owners can UPDATE contracts for their club
CREATE POLICY "Club owners can update contracts"
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
    EXISTS (
      SELECT 1 FROM clubs 
      WHERE clubs.id = contracts.club_id 
      AND clubs.owner_id = auth.uid()
    )
  );

-- ============================================
-- Player policies (ensure they still work)
-- ============================================

-- 4. Players can VIEW contracts where they are the player
CREATE POLICY "Players can view their contracts"
  ON contracts
  FOR SELECT
  USING (
    player_id IN (
      SELECT id FROM players WHERE user_id = auth.uid()
    )
  );

-- 5. Players can UPDATE contracts where they are the player
CREATE POLICY "Players can update their contracts"
  ON contracts
  FOR UPDATE
  USING (
    player_id IN (
      SELECT id FROM players WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    player_id IN (
      SELECT id FROM players WHERE user_id = auth.uid()
    )
  );

-- ============================================
-- Verify all policies
-- ============================================
SELECT 
  policyname,
  cmd,
  CASE 
    WHEN qual IS NOT NULL THEN 'HAS USING'
    ELSE 'NO USING'
  END as has_using,
  CASE 
    WHEN with_check IS NOT NULL THEN 'HAS WITH CHECK'
    ELSE 'NO WITH CHECK'
  END as has_with_check
FROM pg_policies
WHERE tablename = 'contracts'
ORDER BY policyname;
