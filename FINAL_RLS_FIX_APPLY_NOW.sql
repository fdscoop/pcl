-- ============================================================================
-- FINAL RLS FIX - APPLY THIS NOW TO FIX CONTRACT PAGES
-- ============================================================================
-- This fixes the 500 errors AND allows club data to show in contract cards
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard → Your Project → SQL Editor

-- ============================================================================
-- STEP 1: Clean up all problematic policies
-- ============================================================================

-- Drop ALL existing policies on clubs table (clean slate)
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'clubs')
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON clubs';
    END LOOP;
END $$;

-- Drop potentially conflicting policies on players table
DROP POLICY IF EXISTS "Users can read their own player profile" ON players;
DROP POLICY IF EXISTS "users_read_own_player" ON players;
DROP POLICY IF EXISTS "Players can read their own data" ON players;

-- Drop potentially conflicting policies on contracts table
DROP POLICY IF EXISTS "Players can view their own contracts" ON contracts;
DROP POLICY IF EXISTS "Club owners can view their club contracts" ON contracts;
DROP POLICY IF EXISTS "players_read_own_contracts" ON contracts;
DROP POLICY IF EXISTS "club_owners_read_club_contracts" ON contracts;

-- ============================================================================
-- STEP 2: Create simple, working policies
-- ============================================================================

-- Policy 1: Allow ALL authenticated users to read clubs
-- This is safe because club information is public data
CREATE POLICY "authenticated_read_clubs"
ON clubs
FOR SELECT
TO authenticated
USING (true);

-- Policy 2: Allow club owners to manage their clubs
CREATE POLICY "owners_manage_clubs"
ON clubs
FOR ALL
TO authenticated
USING (owner_id = auth.uid())
WITH CHECK (owner_id = auth.uid());

-- ============================================================================
-- STEP 3: Fix players table policies
-- ============================================================================

-- Allow users to read their own player profile
CREATE POLICY "read_own_player"
ON players
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Allow users to update their own player profile
CREATE POLICY "update_own_player"
ON players
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- ============================================================================
-- STEP 4: Fix contracts table policies
-- ============================================================================

-- Allow players to read their contracts
CREATE POLICY "players_read_contracts"
ON contracts
FOR SELECT
TO authenticated
USING (
  player_id IN (
    SELECT id FROM players WHERE user_id = auth.uid()
  )
);

-- Allow club owners to read their club's contracts
CREATE POLICY "clubs_read_contracts"
ON contracts
FOR SELECT
TO authenticated
USING (
  club_id IN (
    SELECT id FROM clubs WHERE owner_id = auth.uid()
  )
);

-- Allow club owners to create contracts for their clubs
CREATE POLICY "clubs_create_contracts"
ON contracts
FOR INSERT
TO authenticated
WITH CHECK (
  club_id IN (
    SELECT id FROM clubs WHERE owner_id = auth.uid()
  )
);

-- Allow both players and club owners to update contracts
CREATE POLICY "update_contracts"
ON contracts
FOR UPDATE
TO authenticated
USING (
  player_id IN (SELECT id FROM players WHERE user_id = auth.uid())
  OR club_id IN (SELECT id FROM clubs WHERE owner_id = auth.uid())
)
WITH CHECK (
  player_id IN (SELECT id FROM players WHERE user_id = auth.uid())
  OR club_id IN (SELECT id FROM clubs WHERE owner_id = auth.uid())
);

-- ============================================================================
-- STEP 5: Verify the fix
-- ============================================================================

-- Check that policies were created successfully
SELECT
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename IN ('clubs', 'players', 'contracts')
ORDER BY tablename, policyname;

-- Success message
SELECT 'RLS policies fixed! Your contract pages should now work properly.' AS message;
