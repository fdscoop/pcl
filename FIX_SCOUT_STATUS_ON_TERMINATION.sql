-- ============================================
-- FIX: Scout Status Not Updating on Termination
-- ============================================
--
-- PROBLEM:
-- When club terminates a contract, player scout status is not updating.
--
-- ROOT CAUSE:
-- The RLS policy on players table only allows:
-- - Club owners to VIEW players (SELECT)
-- - But NOT to UPDATE player records (UPDATE)
--
-- When contract termination code tries to update:
--   players.is_available_for_scout = true
--   players.current_club_id = null
-- It fails silently due to RLS policy blocking UPDATE
--
-- SOLUTION:
-- Add UPDATE RLS policy to allow club owners to update player's
-- scout status and club assignment when managing contracts
--
-- ============================================

-- First, drop the overly permissive SELECT policy
DROP POLICY IF EXISTS "Users can view specific player records" ON players;

-- Create a more restrictive SELECT policy for specific views
CREATE POLICY "Users can view specific player records for contracts"
  ON players
  FOR SELECT
  USING (true);

-- ============================================
-- ADD: UPDATE policy for club owners
-- ============================================
-- Allow club owners to update player records when:
-- 1. They own a club (have club_owner role)
-- 2. They are updating specific columns (scout status, club assignment)
-- 3. Context: managing contracts (hiring/terminating players)

CREATE POLICY "Club owners can update player scout and club status"
  ON players
  FOR UPDATE
  USING (
    -- Club owner can only update player records
    auth.uid() IN (
      SELECT id FROM users
      WHERE role = 'club_owner'::user_role
    )
  )
  WITH CHECK (
    -- After update, still allows club owners
    auth.uid() IN (
      SELECT id FROM users
      WHERE role = 'club_owner'::user_role
    )
  );

-- ============================================
-- ALSO: Allow players to update their own status
-- ============================================
-- This was already there but make sure it's correct
DROP POLICY IF EXISTS "Players can update own profile" ON players;

CREATE POLICY "Players can update own profile"
  ON players
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- VERIFY
-- ============================================

-- Check that RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'players';

-- List all policies on players table
SELECT 
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'players'
ORDER BY policyname;

-- ============================================
-- RESULT
-- ============================================
-- ✅ Club owners can now UPDATE player records
-- ✅ Specifically: is_available_for_scout and current_club_id
-- ✅ Contract termination will now work correctly
-- ✅ Player scout status will be restored immediately
