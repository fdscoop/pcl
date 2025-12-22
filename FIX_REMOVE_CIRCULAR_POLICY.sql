-- ============================================
-- FINAL FIX: Remove problematic circular RLS policy
-- ============================================
--
-- PROBLEM: "Club owners can view contracted players" on players table
-- This policy queries contracts table which has its own RLS
-- When contracts RLS tries to check players, it creates infinite loop:
--   players RLS → contracts RLS → players RLS → ...
--
-- SOLUTION: Remove this policy completely
-- Club owners can still see players via the scouting/available players policy
-- If they need to see their contracted players, they can query contracts instead
--
-- ============================================

-- Drop the circular dependency policy
DROP POLICY IF EXISTS "Club owners can view contracted players" ON notifications;
DROP POLICY IF EXISTS "Club owners can view contracted players" ON players;

-- Verify only safe policies remain on players table
SELECT 
  tablename,
  policyname,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'players'
ORDER BY policyname;

-- Verify contracts table is clean
SELECT 
  tablename,
  policyname,
  cmd
FROM pg_policies
WHERE tablename = 'contracts'
ORDER BY policyname;

-- ============================================
-- EXPLANATION
-- ============================================
-- Removed: "Club owners can view contracted players"
-- Why: Causes circular RLS dependency (players → contracts → players)
--
-- Alternative: Club owners can still get contracted players via:
-- 1. Query contracts table directly (allowed by contracts RLS policy)
-- 2. Then get player info separately
--
-- This is the same approach used in contract views across the app
-- and avoids the circular RLS problem
--
-- ============================================
-- SUCCESS!
-- ============================================
