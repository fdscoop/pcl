-- ============================================
-- EMERGENCY FIX: Drop ALL policies and recreate
-- ============================================

-- First, get all existing policy names
SELECT policyname FROM pg_policies WHERE tablename = 'contracts' ORDER BY policyname;

-- Disable RLS temporarily to drop all policies
ALTER TABLE contracts DISABLE ROW LEVEL SECURITY;

-- Re-enable RLS
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;

-- ============================================
-- Now create fresh policies
-- ============================================

-- 1. Club owners can VIEW contracts for their club
CREATE POLICY "club_owner_select" ON contracts
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM clubs 
      WHERE clubs.id = contracts.club_id 
      AND clubs.owner_id = auth.uid()
    )
  );

-- 2. Club owners can CREATE contracts for their club
CREATE POLICY "club_owner_insert" ON contracts
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM clubs 
      WHERE clubs.id = contracts.club_id 
      AND clubs.owner_id = auth.uid()
    )
  );

-- 3. Club owners can UPDATE contracts for their club
CREATE POLICY "club_owner_update" ON contracts
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

-- 4. Players can VIEW contracts where they are the player
CREATE POLICY "player_select" ON contracts
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM players 
      WHERE players.id = contracts.player_id 
      AND players.user_id = auth.uid()
    )
  );

-- 5. Players can UPDATE contracts where they are the player
CREATE POLICY "player_update" ON contracts
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM players 
      WHERE players.id = contracts.player_id 
      AND players.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM players 
      WHERE players.id = contracts.player_id 
      AND players.user_id = auth.uid()
    )
  );

-- ============================================
-- Verify all policies
-- ============================================
SELECT 
  policyname,
  cmd,
  CASE WHEN qual IS NOT NULL THEN 'HAS USING' ELSE 'NO USING' END as has_using,
  CASE WHEN with_check IS NOT NULL THEN 'HAS WITH CHECK' ELSE 'NO WITH CHECK' END as has_with_check
FROM pg_policies
WHERE tablename = 'contracts'
ORDER BY policyname;
