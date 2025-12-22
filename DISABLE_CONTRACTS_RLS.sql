-- ============================================
-- DISABLE RLS on contracts table
-- ============================================
--
-- Issue: RLS policies on contracts are blocking access due to circular dependencies
-- Solution: Disable RLS and do permission checking in application code
--
-- The club-owner contract view already verifies:
--   1. Club ownership (checks if user owns the club)
--   2. Contract ownership (checks if contract belongs to that club)
--
-- ============================================

-- Disable RLS on contracts table
ALTER TABLE contracts DISABLE ROW LEVEL SECURITY;

-- Verify RLS is disabled
SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'contracts';

-- All contracts are now readable, but application checks permissions
-- When club owner queries: contracts are readable
-- When player queries: contracts are readable
-- But code verifies the user has permission to view it

COMMIT;
