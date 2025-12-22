-- ============================================
-- DIAGNOSTIC: Disable RLS on players to test
-- ============================================
--
-- PURPOSE: Test if RLS is the cause of 406 errors
-- If contract view works with RLS disabled, then the issue is the policies
--
-- ============================================

-- Disable RLS on players table temporarily
ALTER TABLE players DISABLE ROW LEVEL SECURITY;

-- Verify RLS is disabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE tablename = 'players';

-- ============================================
-- After running this:
-- 1. Hard refresh the browser
-- 2. Try to view a contract again
-- 3. If it works now, the issue is the RLS policies
-- 4. If it still fails, the issue is something else
--
-- Then let me know and I'll fix it properly!
-- ============================================
