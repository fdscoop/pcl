-- Check current RLS policies
-- Run this in Supabase SQL Editor to see what policies are active

-- ============================================================================
-- PART 1: Check if RLS is enabled on tables
-- ============================================================================

SELECT
  schemaname,
  tablename,
  rowsecurity AS rls_enabled
FROM pg_tables
WHERE tablename IN ('clubs', 'players', 'contracts', 'users')
ORDER BY tablename;

-- ============================================================================
-- PART 2: List all policies on clubs table
-- ============================================================================

SELECT
  tablename,
  policyname,
  permissive,
  roles,
  cmd AS command,
  qual AS using_expression,
  with_check AS with_check_expression
FROM pg_policies
WHERE tablename = 'clubs'
ORDER BY policyname;

-- ============================================================================
-- PART 3: List all policies on players table
-- ============================================================================

SELECT
  tablename,
  policyname,
  permissive,
  roles,
  cmd AS command,
  qual AS using_expression,
  with_check AS with_check_expression
FROM pg_policies
WHERE tablename = 'players'
ORDER BY policyname;

-- ============================================================================
-- PART 4: List all policies on contracts table
-- ============================================================================

SELECT
  tablename,
  policyname,
  permissive,
  roles,
  cmd AS command,
  qual AS using_expression,
  with_check AS with_check_expression
FROM pg_policies
WHERE tablename = 'contracts'
ORDER BY policyname;

-- ============================================================================
-- PART 5: Test if you can read clubs as authenticated user
-- ============================================================================
-- This will show you sample club data if RLS allows it
-- If you get no results, RLS is blocking the read

SELECT
  id,
  club_name,
  city,
  state,
  owner_id
FROM clubs
LIMIT 5;

-- ============================================================================
-- Expected Results
-- ============================================================================
/*
For clubs table, you should have a policy like:
- Name: "authenticated_read_clubs" or similar
- Command: SELECT
- Roles: authenticated
- Using: true (allows all authenticated users to read)

For players table:
- Policy allowing users to read their own player data
- Using: (user_id = auth.uid())

For contracts table:
- Policy allowing players to read their contracts
- Policy allowing club owners to read their club's contracts
*/
