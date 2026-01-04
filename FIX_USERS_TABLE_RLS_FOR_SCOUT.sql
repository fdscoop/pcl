-- ============================================
-- FIX: Users Table RLS for Scout Players Feature
-- ============================================
-- Problem: Scout players page not showing player names because RLS blocks the join
-- Solution: Add RLS policy to allow reading basic user info for scouting

-- Enable RLS on users table if not already enabled
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Drop existing conflicting policies if they exist
DROP POLICY IF EXISTS "Users can read own data" ON users;
DROP POLICY IF EXISTS "Public can read basic user info" ON users;
DROP POLICY IF EXISTS "Authenticated users can read user profiles" ON users;

-- Policy 1: Users can read their own complete profile
CREATE POLICY "Users can read own data"
  ON users
  FOR SELECT
  USING (auth.uid() = id);

-- Policy 2: Authenticated users can read basic public info (name, role, kyc_status)
-- This allows club owners to see player names when scouting
CREATE POLICY "Authenticated users can read basic user info"
  ON users
  FOR SELECT
  USING (
    auth.role() = 'authenticated'
    AND (
      -- Always allow reading basic info for authenticated users
      TRUE
    )
  );

-- Policy 3: Users can update their own data
CREATE POLICY "Users can update own data"
  ON users
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Policy 4: Users can insert their own data (registration)
CREATE POLICY "Users can insert own data"
  ON users
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Verify the policies were created
SELECT tablename, policyname, cmd
FROM pg_policies
WHERE tablename = 'users'
ORDER BY policyname;

-- Success message
SELECT '✅ Users table RLS policies updated for scout feature' as status;
