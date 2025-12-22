-- EMERGENCY FIX FOR 500 ERRORS
-- Run this in Supabase SQL Editor immediately

-- Step 1: Drop all problematic policies on clubs table
DROP POLICY IF EXISTS "Players can read clubs they have contracts with" ON clubs;
DROP POLICY IF EXISTS "Club owners can read their own clubs" ON clubs;
DROP POLICY IF EXISTS "Allow authenticated users to read clubs" ON clubs;

-- Step 2: Check existing policies (for reference)
-- SELECT * FROM pg_policies WHERE tablename = 'clubs';

-- Step 3: Create a simple, safe policy for clubs table
-- This allows all authenticated users to read club information
-- Club data is generally public information anyway
CREATE POLICY "authenticated_users_read_clubs"
ON clubs
FOR SELECT
TO authenticated
USING (true);

-- Step 4: Verify players table has correct policies
-- The players table should allow users to read their own player data
DROP POLICY IF EXISTS "Users can read their own player profile" ON players;

CREATE POLICY "users_read_own_player"
ON players
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Step 5: Verify contracts table has correct policies
DROP POLICY IF EXISTS "Players can view their own contracts" ON contracts;
DROP POLICY IF EXISTS "Club owners can view their club contracts" ON contracts;

CREATE POLICY "players_read_own_contracts"
ON contracts
FOR SELECT
TO authenticated
USING (
  player_id IN (
    SELECT id FROM players WHERE user_id = auth.uid()
  )
);

CREATE POLICY "club_owners_read_club_contracts"
ON contracts
FOR SELECT
TO authenticated
USING (
  club_id IN (
    SELECT id FROM clubs WHERE owner_id = auth.uid()
  )
);

-- Success message
SELECT 'RLS policies fixed successfully!' AS message;
