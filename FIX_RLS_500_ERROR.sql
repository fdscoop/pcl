-- Fix 500 errors caused by RLS policy conflicts
-- This script drops the problematic policies and recreates them safely

-- First, drop the policies we just created that are causing the 500 error
DROP POLICY IF EXISTS "Players can read clubs they have contracts with" ON clubs;
DROP POLICY IF EXISTS "Club owners can read their own clubs" ON clubs;

-- Check what policies currently exist on clubs table
-- Run this separately to see: SELECT * FROM pg_policies WHERE tablename = 'clubs';

-- Create a simpler policy that doesn't cause recursion
-- Allow authenticated users to read basic club info (this is safe for public club data)
CREATE POLICY "Allow authenticated users to read clubs"
ON clubs
FOR SELECT
TO authenticated
USING (true);

-- If you want to restrict it, you can use this instead:
-- CREATE POLICY "Allow users to read clubs for their contracts or owned clubs"
-- ON clubs
-- FOR SELECT
-- TO authenticated
-- USING (
--   owner_id = auth.uid()
--   OR EXISTS (
--     SELECT 1 FROM contracts c
--     INNER JOIN players p ON c.player_id = p.id
--     WHERE c.club_id = clubs.id
--     AND p.user_id = auth.uid()
--   )
-- );

-- Note: The above commented policy might still cause issues if the contracts
-- or players tables also have complex RLS policies. The simpler "true" policy
-- is safer for now since club information is generally public anyway.
