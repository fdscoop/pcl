-- ============================================
-- ENABLE: Club owners can view and update player data
-- ============================================
--
-- Requirement: Club owners should be able to view and update player information
-- for players in their club
--
-- Solution: Add RLS policies to players table allowing club owners to:
--   - SELECT player data for their club's players
--   - UPDATE player data for their club's players
--
-- ============================================

-- First, check if RLS is enabled on players table
SELECT tablename, rowsecurity
FROM pg_tables
WHERE tablename = 'players';

-- Check existing policies on players table
SELECT policyname, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'players'
ORDER BY policyname;

-- ============================================
-- Drop existing club owner policies (if any)
-- ============================================
DROP POLICY IF EXISTS "Club owners can view their club's players" ON players;
DROP POLICY IF EXISTS "Club owners can update their club's players" ON players;

-- ============================================
-- Add new policies for club owners
-- ============================================

-- 1. Club owners can view players from their club
--    This allows them to see player profiles, stats, etc.
CREATE POLICY "Club owners can view their club's players"
  ON players
  FOR SELECT
  USING (
    current_club_id IN (
      SELECT id FROM clubs WHERE owner_id = auth.uid()
    )
  );

-- 2. Club owners can update players in their club
--    This allows them to update player data like position, jersey number, etc.
CREATE POLICY "Club owners can update their club's players"
  ON players
  FOR UPDATE
  USING (
    current_club_id IN (
      SELECT id FROM clubs WHERE owner_id = auth.uid()
    )
  )
  WITH CHECK (
    current_club_id IN (
      SELECT id FROM clubs WHERE owner_id = auth.uid()
    )
  );

-- ============================================
-- Verify the policies were created
-- ============================================
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
WHERE tablename = 'players'
ORDER BY policyname;

-- ============================================
-- SUCCESS!
-- ============================================
-- Club owners can now:
-- - View player data for players in their club (SELECT)
-- - Update player data for their club's players (UPDATE)
--
-- This enables club owners to manage their roster!
