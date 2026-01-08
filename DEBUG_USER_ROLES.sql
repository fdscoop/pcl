-- ================================================================
-- DEBUG USER ROLES AND KYC ACCESS
-- ================================================================
-- 
-- Purpose: Diagnose and fix user role issues causing KYC access problems
-- Use this to check why users are getting "This endpoint is only for players"
--
-- ================================================================

-- Step 1: Check current user roles and KYC status
SELECT 
    id,
    email,
    role,
    kyc_status,
    created_at,
    full_name
FROM users 
ORDER BY created_at DESC
LIMIT 10;

-- Step 2: Check for users without roles
SELECT 
    COUNT(*) as users_without_role,
    array_agg(email) as emails
FROM users 
WHERE role IS NULL OR role = '';

-- Step 3: Check role distribution
SELECT 
    role,
    COUNT(*) as user_count,
    COUNT(*) FILTER (WHERE kyc_status = 'verified') as verified_count,
    COUNT(*) FILTER (WHERE kyc_status = 'pending') as pending_count
FROM users 
GROUP BY role
ORDER BY user_count DESC;

-- Step 4: Fix users without roles (set them to 'player' by default)
-- UNCOMMENT BELOW TO APPLY THE FIX:

/*
UPDATE users 
SET role = 'player' 
WHERE role IS NULL OR role = ''
AND email NOT LIKE '%admin%'  -- Don't change admin emails
RETURNING id, email, role;
*/

-- Step 5: Check RLS policies on users table
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies 
WHERE tablename = 'users'
ORDER BY policyname;

-- Step 6: Check if RLS is enabled
SELECT 
    schemaname,
    tablename,
    rowsecurity,
    relowner
FROM pg_tables t
JOIN pg_class c ON c.relname = t.tablename
WHERE tablename = 'users';

-- Step 7: Test user access for specific user (replace with actual user ID)
-- SELECT * FROM users WHERE id = 'your-user-id-here';

-- Step 8: Check players table existence and RLS
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables t
LEFT JOIN pg_class c ON c.relname = t.tablename
WHERE tablename = 'players';

-- If players table exists, check its policies
SELECT 
    policyname,
    cmd,
    roles
FROM pg_policies 
WHERE tablename = 'players';

-- ================================================================
-- COMMON FIXES
-- ================================================================

-- Fix 1: Set default role for users without roles
-- UPDATE users SET role = 'player' WHERE role IS NULL;

-- Fix 2: Enable RLS if not enabled
-- ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Fix 3: Create basic player policy if missing
/*
CREATE POLICY "Users can view their own profile" 
ON users FOR SELECT 
TO authenticated 
USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
ON users FOR UPDATE 
TO authenticated 
USING (auth.uid() = id) 
WITH CHECK (auth.uid() = id);
*/

-- Success message
DO $$ 
BEGIN 
    RAISE NOTICE 'USER ROLE DEBUG COMPLETE!';
    RAISE NOTICE 'Review the results above to identify role issues.';
    RAISE NOTICE 'Uncomment and run the fixes as needed.';
END $$;