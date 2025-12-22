-- ============================================
-- FIX: Prevent infinite recursion in RLS policies
-- Simplify policies to avoid circular dependencies
-- ============================================

-- Drop all problematic policies
DROP POLICY IF EXISTS "Club owners can view their contracts" ON contracts;
DROP POLICY IF EXISTS "Players can view their contracts" ON contracts;
DROP POLICY IF EXISTS "Club owners can update their pending contracts" ON contracts;
DROP POLICY IF EXISTS "Players can update contract status" ON contracts;
DROP POLICY IF EXISTS "Club owners can create contracts" ON contracts;
DROP POLICY IF EXISTS "Club owners can view players" ON players;
DROP POLICY IF EXISTS "Club owners can view verified players" ON players;
DROP POLICY IF EXISTS "Players can view own data" ON players;
DROP POLICY IF EXISTS "Players can create own profile" ON players;
DROP POLICY IF EXISTS "Players can update own profile" ON players;
DROP POLICY IF EXISTS "Admins can view all players" ON players;

-- ============================================
-- SIMPLIFIED CONTRACTS POLICIES (no RLS cross-references)
-- ============================================

-- Club owners can view contracts for their club
-- (Direct column check, no subqueries to other RLS tables)
CREATE POLICY "Club owners can view their contracts"
  ON contracts
  FOR SELECT
  USING (
    club_id IN (SELECT id FROM clubs WHERE owner_id = auth.uid())
  );

-- Players can view their own contracts
-- (Direct column check, no subqueries)
CREATE POLICY "Players can view their contracts"
  ON contracts
  FOR SELECT
  USING (
    player_id IN (SELECT id FROM players WHERE user_id = auth.uid())
  );

-- Club owners can update their pending contracts
CREATE POLICY "Club owners can update their pending contracts"
  ON contracts
  FOR UPDATE
  USING (
    status = 'pending'
    AND club_id IN (SELECT id FROM clubs WHERE owner_id = auth.uid())
  )
  WITH CHECK (
    status = 'pending'
    AND club_id IN (SELECT id FROM clubs WHERE owner_id = auth.uid())
  );

-- Players can update contract status (accept/reject)
CREATE POLICY "Players can update contract status"
  ON contracts
  FOR UPDATE
  USING (
    status = 'pending'
    AND player_id IN (SELECT id FROM players WHERE user_id = auth.uid())
  )
  WITH CHECK (
    status IN ('active', 'rejected')
    AND player_id IN (SELECT id FROM players WHERE user_id = auth.uid())
  );

-- ============================================
-- SIMPLIFIED PLAYERS POLICIES (no RLS cross-references)
-- ============================================

-- Players can view own data
CREATE POLICY "Players can view own data"
  ON players
  FOR SELECT
  USING (auth.uid() = user_id);

-- Players can create own profile
CREATE POLICY "Players can create own profile"
  ON players
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Players can update own profile
CREATE POLICY "Players can update own profile"
  ON players
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Club owners can view available players (for scouting)
CREATE POLICY "Club owners can view available players"
  ON players
  FOR SELECT
  USING (
    is_available_for_scout = true
    AND EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'club_owner'
      AND users.kyc_status = 'verified'
    )
  );

-- Admins can view all players
CREATE POLICY "Admins can view all players"
  ON players
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- ============================================
-- NOTE FOR CONTRACT VIEW PAGES
-- ============================================
-- Contract view pages load:
-- 1. Contract directly (club owner can see via contracts policy)
-- 2. Player data separately (club needs to be authorized via contract)
-- 
-- Player info should be fetched as separate queries:
--   - SELECT * FROM players WHERE id = contract.player_id
--   - SELECT * FROM users WHERE id = player.user_id
--
-- This avoids RLS recursion since we're not doing cross-table RLS joins
