-- ============================================
-- FIX: Remove remaining EXISTS() policies causing recursion
-- ============================================
-- 
-- PROBLEM: 
-- Two policies still use EXISTS() which triggers circular RLS checks:
-- 1. "Club owners can update their contracts" on contracts table
-- 2. "Club owners can view contracted players" on players table
--
-- SOLUTION:
-- Replace these two policies with IN() equivalents
--
-- ============================================

-- Drop the two problematic policies
DROP POLICY IF EXISTS "Club owners can update their contracts" ON contracts;
DROP POLICY IF EXISTS "Club owners can view contracted players" ON players;

-- ============================================
-- FIX 1: Replace "Club owners can update their contracts"
-- ============================================

CREATE POLICY "Club owners can update their contracts"
  ON contracts
  FOR UPDATE
  USING (
    club_id IN (SELECT id FROM clubs WHERE owner_id = auth.uid())
  )
  WITH CHECK (
    status = ANY (ARRAY['pending'::contract_status, 'rejected'::contract_status, 'terminated'::contract_status])
    AND club_id IN (SELECT id FROM clubs WHERE owner_id = auth.uid())
  );

-- ============================================
-- FIX 2: Replace "Club owners can view contracted players"
-- ============================================

CREATE POLICY "Club owners can view contracted players"
  ON players
  FOR SELECT
  USING (
    id IN (
      SELECT DISTINCT contracts.player_id 
      FROM contracts
      WHERE contracts.club_id IN (SELECT id FROM clubs WHERE owner_id = auth.uid())
    )
  );

-- ============================================
-- VERIFY THE FIX
-- ============================================

SELECT 
  'contracts' as table_name,
  COUNT(*) as policy_count
FROM pg_policies
WHERE tablename = 'contracts'
GROUP BY tablename

UNION ALL

SELECT 
  'players' as table_name,
  COUNT(*) as policy_count
FROM pg_policies
WHERE tablename = 'players'
GROUP BY tablename

UNION ALL

SELECT 
  'notifications' as table_name,
  COUNT(*) as policy_count
FROM pg_policies
WHERE tablename = 'notifications'
GROUP BY tablename;

-- List all updated policies
SELECT 
  tablename,
  policyname,
  cmd
FROM pg_policies
WHERE tablename IN ('contracts', 'players', 'notifications')
ORDER BY tablename, policyname;

-- ============================================
-- SUCCESS!
-- ============================================
-- 
-- The two remaining EXISTS() policies have been replaced with IN()
-- This removes all circular dependencies!
--
-- Next steps:
-- 1. Run this in Supabase SQL Editor
-- 2. Hard refresh your app: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)
-- 3. The 500 errors should be completely gone ✅
--
-- ============================================
