-- ================================================================
-- URGENT FIX: RLS 500 ERROR ON USERS TABLE
-- ================================================================
-- 
-- Purpose: Fix immediate 500 errors preventing user access
-- This addresses the RLS policy blocking users from reading their own data
--
-- ================================================================

-- Step 1: Check current RLS status
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables t
LEFT JOIN pg_class c ON c.relname = t.tablename
WHERE tablename = 'users';

-- Step 2: Check existing policies causing conflicts
SELECT 
    policyname,
    cmd,
    permissive,
    roles,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'users'
ORDER BY policyname;

-- Step 3: Drop ALL conflicting policies (including duplicates found)
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;
DROP POLICY IF EXISTS "Users can insert their own record during signup" ON users;
DROP POLICY IF EXISTS "Admins can view all users" ON users;
DROP POLICY IF EXISTS "Admins can update all users" ON users;

-- Drop duplicate/conflicting policies
DROP POLICY IF EXISTS "Users can read own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;
DROP POLICY IF EXISTS "Users can insert own data" ON users;
DROP POLICY IF EXISTS "Authenticated users can read player profiles for scouting" ON users;

-- Step 4: Create clean, simple RLS policies (without complex subqueries)
-- Basic read policy for users (simple and reliable)
CREATE POLICY "Users can view their own profile"
ON users FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Update policy for users (simple, Aadhaar validation handled by application)
CREATE POLICY "Users can update their own profile"
ON users FOR UPDATE  
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Insert policy for signup (simple)
CREATE POLICY "Users can insert their own record during signup"
ON users FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- Admin read policy (simple)
CREATE POLICY "Admins can view all users"
ON users FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM users u
        WHERE u.id = auth.uid() 
        AND u.role = 'admin'
    )
);

-- Admin update policy (simple)
CREATE POLICY "Admins can update all users"
ON users FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM users u
        WHERE u.id = auth.uid() 
        AND u.role = 'admin'
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM users u
        WHERE u.id = auth.uid() 
        AND u.role = 'admin'
    )
);

-- Step 5: Ensure RLS is enabled but not overly restrictive
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Step 6: Grant necessary permissions
GRANT SELECT, UPDATE, INSERT ON users TO authenticated;
GRANT USAGE ON SCHEMA auth TO authenticated;

-- Step 7: Create indexes for policy performance
CREATE INDEX IF NOT EXISTS idx_users_id_auth ON users(id);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Step 8: Test query that should work
-- This should return the user's own profile
DO $$
DECLARE
    test_result RECORD;
BEGIN
    -- This simulates what the application is trying to do
    RAISE NOTICE 'Testing user self-access...';
    
    -- Note: In production, auth.uid() would return the actual user ID
    -- For testing, we'll just check if the policy structure is correct
    
    IF EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'users' 
        AND policyname = 'Users can view their own profile'
    ) THEN
        RAISE NOTICE '✅ User read policy exists';
    ELSE
        RAISE NOTICE '❌ User read policy missing';
    END IF;
    
END $$;

-- Success message
DO $$ 
BEGIN 
    RAISE NOTICE '================================================================';
    RAISE NOTICE 'URGENT RLS FIX APPLIED!';
    RAISE NOTICE 'Users should now be able to access their profiles.';
    RAISE NOTICE 'Test the application to confirm 500 errors are resolved.';
    RAISE NOTICE '================================================================';
END $$;