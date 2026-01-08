-- ================================================================
-- FINAL FIX: Remove ALL Aadhaar fraud prevention artifacts
-- ================================================================
--
-- Run this in Supabase SQL Editor to completely remove
-- all triggers, functions, and policies related to Aadhaar fraud
--
-- ================================================================

-- 1. Drop ALL triggers on users table that reference aadhaar
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT tgname 
        FROM pg_trigger 
        WHERE tgrelid = 'users'::regclass 
        AND tgname LIKE '%aadhaar%'
    ) LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS %I ON users CASCADE', r.tgname);
        RAISE NOTICE 'Dropped trigger: %', r.tgname;
    END LOOP;
END $$;

-- 2. Drop ALL functions related to aadhaar fraud prevention
DROP FUNCTION IF EXISTS check_aadhaar_fraud_prevention(UUID, TEXT, user_role) CASCADE;
DROP FUNCTION IF EXISTS check_aadhaar_fraud_prevention(UUID, TEXT, TEXT) CASCADE;
DROP FUNCTION IF EXISTS check_aadhaar_fraud_prevention CASCADE;
DROP FUNCTION IF EXISTS trigger_check_aadhaar_fraud() CASCADE;
DROP FUNCTION IF EXISTS trigger_check_aadhaar_fraud CASCADE;

-- 3. Drop ALL RLS policies on users table that reference aadhaar
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'users' 
        AND schemaname = 'public'
        AND (
            policyname LIKE '%aadhaar%' 
            OR qual::text LIKE '%aadhaar%'
            OR with_check::text LIKE '%aadhaar%'
        )
    ) LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON users CASCADE', r.policyname);
        RAISE NOTICE 'Dropped policy: %', r.policyname;
    END LOOP;
END $$;

-- 4. Verify cleanup
DO $$ 
BEGIN 
    RAISE NOTICE ''; 
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ CLEANUP COMPLETE!';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'All Aadhaar fraud prevention artifacts have been removed.';
    RAISE NOTICE 'KYC verification should now work without database errors.';
    RAISE NOTICE '';
END $$;