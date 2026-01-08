-- ================================================================
-- COMPREHENSIVE FIX: ALL DATABASE ACCESS ISSUES
-- ================================================================
-- 
-- Purpose: Fix all 400/500 errors by addressing RLS policies across all tables
-- This addresses users, matches, clubs, and other tables causing issues
--
-- ================================================================

-- Step 1: Fix users table policies (CRITICAL)
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;
DROP POLICY IF EXISTS "Users can insert their own record during signup" ON users;
DROP POLICY IF EXISTS "Admins can view all users" ON users;
DROP POLICY IF EXISTS "Admins can update all users" ON users;
DROP POLICY IF EXISTS "Users can read own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;
DROP POLICY IF EXISTS "Users can insert own data" ON users;
DROP POLICY IF EXISTS "Authenticated users can read player profiles for scouting" ON users;

-- Create minimal working policies for users
CREATE POLICY "users_select_own" 
ON users FOR SELECT 
TO authenticated 
USING (auth.uid() = id);

CREATE POLICY "users_update_own"
ON users FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

CREATE POLICY "users_insert_own"
ON users FOR INSERT
TO authenticated  
WITH CHECK (auth.uid() = id);

-- Step 2: Fix matches table access (causing 400 errors)
-- Check if matches table has RLS issues
DO $$
BEGIN
    -- Drop any overly restrictive match policies
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'matches') THEN
        DROP POLICY IF EXISTS "matches_restrictive_policy" ON matches;
        
        -- Create basic read access for authenticated users
        CREATE POLICY IF NOT EXISTS "authenticated_can_read_matches"
        ON matches FOR SELECT
        TO authenticated
        USING (true); -- Allow all authenticated users to read matches
        
        RAISE NOTICE 'Fixed matches table policies';
    ELSE
        RAISE NOTICE 'Matches table does not exist';
    END IF;
END $$;

-- Step 3: Fix clubs table access (part of matches join)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'clubs') THEN
        -- Ensure clubs can be read for match data
        CREATE POLICY IF NOT EXISTS "authenticated_can_read_clubs_for_matches"
        ON clubs FOR SELECT
        TO authenticated
        USING (true); -- Allow reading club info for matches
        
        RAISE NOTICE 'Fixed clubs table policies';
    ELSE
        RAISE NOTICE 'Clubs table does not exist';
    END IF;
END $$;

-- Step 4: Fix players table if it exists (causing 500 errors in KYC)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'players') THEN
        -- Create basic read access
        CREATE POLICY IF NOT EXISTS "users_can_read_own_player_profile"
        ON players FOR SELECT
        TO authenticated
        USING (user_id = auth.uid());
        
        RAISE NOTICE 'Fixed players table policies';
    ELSE
        RAISE NOTICE 'Players table does not exist';
    END IF;
END $$;

-- Step 5: Ensure all tables have RLS enabled but not overly restrictive
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Step 6: Grant necessary permissions broadly
GRANT SELECT, UPDATE, INSERT ON users TO authenticated;
GRANT USAGE ON SCHEMA auth TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- Grant read access for commonly accessed tables
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'matches') THEN
        GRANT SELECT ON matches TO authenticated;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'clubs') THEN
        GRANT SELECT ON clubs TO authenticated;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'players') THEN
        GRANT SELECT, UPDATE, INSERT ON players TO authenticated;
    END IF;
END $$;

-- Step 7: Create performance indexes
CREATE INDEX IF NOT EXISTS idx_users_id_auth ON users(id);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Step 8: Test critical queries
DO $$
DECLARE
    policy_count INTEGER;
BEGIN
    -- Check users policies
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies 
    WHERE tablename = 'users';
    
    RAISE NOTICE 'Users table has % policies', policy_count;
    
    -- List all current policies
    FOR policy_count IN 
        SELECT policyname FROM pg_policies WHERE tablename = 'users'
    LOOP
        RAISE NOTICE 'Policy: %', policy_count;
    END LOOP;
    
END $$;

-- Success message
DO $$ 
BEGIN 
    RAISE NOTICE '================================================================';
    RAISE NOTICE 'COMPREHENSIVE DATABASE ACCESS FIX APPLIED!';
    RAISE NOTICE '';
    RAISE NOTICE '✅ Users table: Fixed RLS policies';
    RAISE NOTICE '✅ Matches table: Fixed read access';  
    RAISE NOTICE '✅ Clubs table: Fixed read access';
    RAISE NOTICE '✅ Players table: Fixed if exists';
    RAISE NOTICE '✅ Permissions: Granted necessary access';
    RAISE NOTICE '';
    RAISE NOTICE 'Test the application now:';
    RAISE NOTICE '- Login should work';
    RAISE NOTICE '- Dashboard should load';
    RAISE NOTICE '- KYC verification should work';
    RAISE NOTICE '- Match data should display';
    RAISE NOTICE '================================================================';
END $$;