-- ============================================
-- ROW LEVEL SECURITY POLICIES FOR CONTRACTS
-- Run this AFTER the main migration
-- ============================================

-- Enable RLS on contracts table
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Club owners can create contracts" ON contracts;
DROP POLICY IF EXISTS "Club owners can view their contracts" ON contracts;
DROP POLICY IF EXISTS "Players can view their contracts" ON contracts;
DROP POLICY IF EXISTS "Club owners can update their pending contracts" ON contracts;

-- Policy 1: Club owners can create contracts for their club
CREATE POLICY "Club owners can create contracts"
  ON contracts
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM clubs
      WHERE clubs.id = contracts.club_id
      AND clubs.owner_id = auth.uid()
    )
  );

-- Policy 2: Club owners can view contracts for their club
CREATE POLICY "Club owners can view their contracts"
  ON contracts
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM clubs
      WHERE clubs.id = contracts.club_id
      AND clubs.owner_id = auth.uid()
    )
  );

-- Policy 3: Players can view their own contracts
CREATE POLICY "Players can view their contracts"
  ON contracts
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM players
      WHERE players.id = contracts.player_id
      AND players.user_id = auth.uid()
    )
  );

-- Policy 4: Club owners can update their pending contracts
CREATE POLICY "Club owners can update their pending contracts"
  ON contracts
  FOR UPDATE
  USING (
    status = 'pending'
    AND EXISTS (
      SELECT 1 FROM clubs
      WHERE clubs.id = contracts.club_id
      AND clubs.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    status = 'pending'
    AND EXISTS (
      SELECT 1 FROM clubs
      WHERE clubs.id = contracts.club_id
      AND clubs.owner_id = auth.uid()
    )
  );

-- Policy 5: Players can update contract status (accept/reject)
CREATE POLICY "Players can update contract status"
  ON contracts
  FOR UPDATE
  USING (
    status = 'pending'
    AND EXISTS (
      SELECT 1 FROM players
      WHERE players.id = contracts.player_id
      AND players.user_id = auth.uid()
    )
  )
  WITH CHECK (
    status IN ('active', 'rejected')
    AND EXISTS (
      SELECT 1 FROM players
      WHERE players.id = contracts.player_id
      AND players.user_id = auth.uid()
    )
  );

-- Verify policies
SELECT schemaname, tablename, policyname, permissive, cmd
FROM pg_policies
WHERE tablename = 'contracts'
ORDER BY policyname;
