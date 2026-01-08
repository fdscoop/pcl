-- ================================================================
-- DEBUG: CHECK DATABASE STATE AND ACCESS
-- ================================================================
-- 
-- Purpose: Diagnose current database issues causing 400/500 errors
-- Run this to see what's wrong with table access
--
-- ================================================================

-- Step 1: Check table existence and RLS status
SELECT 
    t.tablename,
    c.relrowsecurity as rls_enabled,
    COUNT(p.policyname) as policy_count
FROM pg_tables t
LEFT JOIN pg_class c ON c.relname = t.tablename
LEFT JOIN pg_policies p ON p.tablename = t.tablename
WHERE t.tablename IN ('users', 'matches', 'clubs', 'players', 'kyc_aadhaar_requests')
GROUP BY t.tablename, c.relrowsecurity
ORDER BY t.tablename;

-- Step 2: Check users table policies specifically
SELECT 
    policyname,
    cmd,
    permissive,
    roles
FROM pg_policies 
WHERE tablename = 'users'
ORDER BY policyname;

-- Step 3: Check matches table policies (causing 400 errors)
SELECT 
    policyname,
    cmd,
    permissive,
    roles
FROM pg_policies 
WHERE tablename = 'matches'
ORDER BY policyname;

-- Step 4: Check grants on critical tables
SELECT 
    grantee,
    table_name,
    privilege_type
FROM information_schema.role_table_grants 
WHERE table_name IN ('users', 'matches', 'clubs') 
AND grantee IN ('authenticated', 'anon', 'public')
ORDER BY table_name, grantee;

-- Step 5: Test basic auth function
SELECT 
    current_setting('request.jwt.claims', true)::json->>'sub' as auth_uid,
    current_user as current_db_user,
    session_user as session_db_user;

-- Step 6: Check for any constraint violations
SELECT 
    conname as constraint_name,
    conrelid::regclass as table_name,
    contype as constraint_type
FROM pg_constraint 
WHERE conrelid IN (
    SELECT oid FROM pg_class 
    WHERE relname IN ('users', 'matches', 'clubs')
)
ORDER BY table_name, constraint_name;

-- Step 7: Sample test queries (these should work after fixes)
-- Test user access
DO $$
BEGIN
    BEGIN
        PERFORM COUNT(*) FROM users LIMIT 1;
        RAISE NOTICE '✅ Users table accessible';
    EXCEPTION
        WHEN OTHERS THEN
            RAISE NOTICE '❌ Users table error: %', SQLERRM;
    END;
    
    BEGIN
        PERFORM COUNT(*) FROM matches LIMIT 1;
        RAISE NOTICE '✅ Matches table accessible';
    EXCEPTION
        WHEN OTHERS THEN
            RAISE NOTICE '❌ Matches table error: %', SQLERRM;
    END;
    
    BEGIN
        PERFORM COUNT(*) FROM clubs LIMIT 1;
        RAISE NOTICE '✅ Clubs table accessible';
    EXCEPTION
        WHEN OTHERS THEN
            RAISE NOTICE '❌ Clubs table error: %', SQLERRM;
    END;
END $$;

-- Step 8: Show summary
DO $$ 
BEGIN 
    RAISE NOTICE '================================================================';
    RAISE NOTICE 'DATABASE DEBUG COMPLETE!';
    RAISE NOTICE 'Review the results above to identify issues.';
    RAISE NOTICE 'Then run COMPREHENSIVE_DATABASE_FIX.sql to resolve them.';
    RAISE NOTICE '================================================================';
END $$;