-- ================================================================
-- EMERGENCY: CLEAN ALL USER POLICIES AND START FRESH
-- ================================================================
-- 
-- Purpose: Remove ALL conflicting policies and create minimal working ones
-- This fixes the immediate 500 errors by eliminating policy conflicts
--
-- ================================================================

-- Step 1: Drop ALL existing policies on users table
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;
DROP POLICY IF EXISTS "Users can insert their own record during signup" ON users;
DROP POLICY IF EXISTS "Admins can view all users" ON users;
DROP POLICY IF EXISTS "Admins can update all users" ON users;
DROP POLICY IF EXISTS "Users can read own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;
DROP POLICY IF EXISTS "Users can insert own data" ON users;
DROP POLICY IF EXISTS "Authenticated users can read player profiles for scouting" ON users;

-- Step 2: Create ONLY essential policies (no complex logic)
-- Simple read access for users
CREATE POLICY "users_select_own" 
ON users FOR SELECT 
TO authenticated 
USING (auth.uid() = id);

-- Simple update access for users  
CREATE POLICY "users_update_own"
ON users FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Simple insert access for signup
CREATE POLICY "users_insert_own"
ON users FOR INSERT
TO authenticated  
WITH CHECK (auth.uid() = id);

-- Step 3: Ensure RLS is enabled
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Step 4: Grant permissions
GRANT SELECT, UPDATE, INSERT ON users TO authenticated;

-- Success message
DO $$ 
BEGIN 
    RAISE NOTICE 'EMERGENCY CLEANUP COMPLETE!';
    RAISE NOTICE 'All conflicting policies removed.';
    RAISE NOTICE 'Only minimal essential policies remain.';
    RAISE NOTICE 'Test login now - should work!';
END $$;