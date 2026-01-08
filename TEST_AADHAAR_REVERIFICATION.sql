-- ================================================================
-- TEST AADHAAR RE-VERIFICATION LOGIC
-- ================================================================
-- 
-- Purpose: Test that the re-verification logic works correctly
-- Run this after applying the RLS policies fix
--
-- ================================================================

-- Test Setup: Create test users (if needed for testing)
-- Note: Only run this in development/testing environment

/*
-- Create test players for verification testing
INSERT INTO users (id, email, role, kyc_status, aadhaar_number, full_name)
VALUES 
    ('11111111-1111-1111-1111-111111111111', 'player1@test.com', 'player', 'verified', '123456789001', 'Test Player 1'),
    ('22222222-2222-2222-2222-222222222222', 'player2@test.com', 'player', 'pending', NULL, 'Test Player 2')
ON CONFLICT (id) DO NOTHING;
*/

-- ================================================================
-- TEST CASES
-- ================================================================

-- Test 1: Check if fraud prevention function works correctly
DO $$
DECLARE
    result BOOLEAN;
BEGIN
    RAISE NOTICE 'TEST 1: Fraud Prevention Function';
    
    -- Test 1a: Same user re-verification (should pass)
    BEGIN
        SELECT check_aadhaar_fraud_prevention(
            '11111111-1111-1111-1111-111111111111'::uuid,
            '123456789001',
            'player'
        ) INTO result;
        RAISE NOTICE '✅ Test 1a PASSED: Same user re-verification allowed';
    EXCEPTION 
        WHEN OTHERS THEN
            RAISE NOTICE '❌ Test 1a FAILED: Same user re-verification blocked: %', SQLERRM;
    END;
    
    -- Test 1b: Different user using same Aadhaar (should fail)
    BEGIN
        SELECT check_aadhaar_fraud_prevention(
            '22222222-2222-2222-2222-222222222222'::uuid,
            '123456789001',  -- Same Aadhaar as player1
            'player'
        ) INTO result;
        RAISE NOTICE '❌ Test 1b FAILED: Different user fraud attempt was allowed (should be blocked)';
    EXCEPTION 
        WHEN OTHERS THEN
            RAISE NOTICE '✅ Test 1b PASSED: Different user fraud attempt blocked: %', SQLERRM;
    END;
    
    -- Test 1c: New Aadhaar for new user (should pass)
    BEGIN
        SELECT check_aadhaar_fraud_prevention(
            '22222222-2222-2222-2222-222222222222'::uuid,
            '999888777666',  -- New unused Aadhaar
            'player'
        ) INTO result;
        RAISE NOTICE '✅ Test 1c PASSED: New Aadhaar for new user allowed';
    EXCEPTION 
        WHEN OTHERS THEN
            RAISE NOTICE '❌ Test 1c FAILED: New Aadhaar blocked: %', SQLERRM;
    END;
    
END $$;

-- Test 2: Check existing Aadhaar duplicates in database
DO $$
DECLARE
    duplicate_count INTEGER;
    duplicate_details RECORD;
BEGIN
    RAISE NOTICE 'TEST 2: Existing Aadhaar Duplicates Check';
    
    -- Count duplicate Aadhaar numbers
    SELECT COUNT(*) INTO duplicate_count
    FROM (
        SELECT aadhaar_number, COUNT(*) as user_count
        FROM users 
        WHERE aadhaar_number IS NOT NULL 
        AND aadhaar_number != ''
        GROUP BY aadhaar_number
        HAVING COUNT(*) > 1
    ) duplicates;
    
    IF duplicate_count = 0 THEN
        RAISE NOTICE '✅ No duplicate Aadhaar numbers found';
    ELSE
        RAISE NOTICE '⚠️ Found % duplicate Aadhaar numbers:', duplicate_count;
        
        -- Show details of duplicates
        FOR duplicate_details IN 
            SELECT aadhaar_number, COUNT(*) as user_count, 
                   array_agg(id::text) as user_ids,
                   array_agg(email) as emails,
                   array_agg(role) as roles
            FROM users 
            WHERE aadhaar_number IS NOT NULL 
            AND aadhaar_number != ''
            GROUP BY aadhaar_number
            HAVING COUNT(*) > 1
        LOOP
            RAISE NOTICE 'Aadhaar %: % users (%, %, %)', 
                duplicate_details.aadhaar_number,
                duplicate_details.user_count,
                duplicate_details.user_ids,
                duplicate_details.emails,
                duplicate_details.roles;
        END LOOP;
    END IF;
    
END $$;

-- Test 3: Check current RLS policies
DO $$
BEGIN
    RAISE NOTICE 'TEST 3: RLS Policy Status';
    
    -- Check if RLS is enabled
    IF (SELECT relrowsecurity FROM pg_class WHERE relname = 'users') THEN
        RAISE NOTICE '✅ RLS is enabled on users table';
    ELSE
        RAISE NOTICE '❌ RLS is NOT enabled on users table';
    END IF;
    
END $$;

-- Test 4: Show current policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'users' 
ORDER BY policyname;

-- Test 5: Performance test - check if indexes exist
DO $$
BEGIN
    RAISE NOTICE 'TEST 5: Index Status';
    
    -- Check for Aadhaar index
    IF EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'users' 
        AND indexname = 'idx_users_aadhaar_number'
    ) THEN
        RAISE NOTICE '✅ Aadhaar number index exists';
    ELSE
        RAISE NOTICE '❌ Aadhaar number index missing';
    END IF;
    
    -- Check for composite index
    IF EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'users' 
        AND indexname = 'idx_users_aadhaar_role_kyc'
    ) THEN
        RAISE NOTICE '✅ Composite Aadhaar/role/KYC index exists';
    ELSE
        RAISE NOTICE '❌ Composite index missing';
    END IF;
    
END $$;

-- ================================================================
-- SUMMARY QUERY
-- ================================================================

-- Show user statistics
SELECT 
    role,
    kyc_status,
    COUNT(*) as user_count,
    COUNT(DISTINCT aadhaar_number) FILTER (WHERE aadhaar_number IS NOT NULL) as unique_aadhaars,
    COUNT(aadhaar_number) FILTER (WHERE aadhaar_number IS NOT NULL) as total_aadhaars
FROM users 
GROUP BY role, kyc_status
ORDER BY role, kyc_status;

-- Final success message
DO $$ 
BEGIN 
    RAISE NOTICE '================================================================';
    RAISE NOTICE 'TESTING COMPLETE!';
    RAISE NOTICE 'Review the test results above to ensure everything is working correctly.';
    RAISE NOTICE '================================================================';
END $$;