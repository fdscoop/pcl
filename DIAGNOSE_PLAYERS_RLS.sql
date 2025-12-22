-- ============================================
-- DIAGNOSTIC: Check players table RLS and data
-- ============================================

-- List all policies on players table
SELECT 
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'players'
ORDER BY policyname;

-- Check if RLS is enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE tablename = 'players';

-- ============================================
-- The 406 error suggests the query is malformed
-- or the RLS policy is rejecting it
-- ============================================
