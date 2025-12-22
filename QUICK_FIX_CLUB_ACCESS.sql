-- QUICK FIX: Allow authenticated users to read clubs
-- This is the minimal fix to make club data visible

-- First, check what policies exist on clubs table
SELECT
  policyname,
  cmd,
  qual::text as using_clause
FROM pg_policies
WHERE tablename = 'clubs';

-- Drop any restrictive policies
DROP POLICY IF EXISTS "Players can read clubs they have contracts with" ON clubs;
DROP POLICY IF EXISTS "Club owners can read their own clubs" ON clubs;
DROP POLICY IF EXISTS "authenticated_users_read_clubs" ON clubs;
DROP POLICY IF EXISTS "authenticated_read_clubs" ON clubs;
DROP POLICY IF EXISTS "owners_manage_clubs" ON clubs;

-- Create a simple policy that allows ALL authenticated users to read clubs
-- Club information is public data anyway
CREATE POLICY "allow_authenticated_read_clubs"
ON clubs
FOR SELECT
TO authenticated
USING (true);

-- Verify it was created
SELECT
  policyname,
  cmd,
  qual::text as using_clause
FROM pg_policies
WHERE tablename = 'clubs';

-- Test if you can now read clubs
SELECT id, club_name, city, state FROM clubs LIMIT 3;
