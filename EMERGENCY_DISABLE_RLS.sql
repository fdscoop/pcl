-- ================================================================
-- IMMEDIATE HOTFIX: DISABLE RLS TEMPORARILY
-- ================================================================
-- 
-- Purpose: Temporarily disable RLS to restore application functionality
-- Use this only if the application is completely broken
-- Remember to re-enable RLS after fixing the policies
--
-- ================================================================

-- WARNING: This temporarily removes security constraints
-- Only use in development or as emergency hotfix

-- Step 1: Temporarily disable RLS on users table
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Step 2: Grant broad access for immediate fix
GRANT ALL ON users TO authenticated;
GRANT ALL ON users TO anon;

-- Success message with warning
DO $$ 
BEGIN 
    RAISE NOTICE '⚠️  EMERGENCY HOTFIX APPLIED! ⚠️';
    RAISE NOTICE 'RLS has been DISABLED on users table.';
    RAISE NOTICE 'This is a TEMPORARY fix for immediate functionality.';
    RAISE NOTICE '';
    RAISE NOTICE 'TO RE-ENABLE SECURITY:';
    RAISE NOTICE '1. Run URGENT_FIX_RLS_500_ERROR.sql';
    RAISE NOTICE '2. Test that policies work correctly';
    RAISE NOTICE '3. Do NOT deploy to production without RLS!';
END $$;