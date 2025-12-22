-- ============================================
-- FIX CLUBS RLS POLICIES FOR CONTRACT VIEWING
-- Allow players to view clubs they have contracts with
-- ============================================

-- Enable RLS on clubs table (if not already enabled)
ALTER TABLE clubs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Club owners can view their own clubs" ON clubs;
DROP POLICY IF EXISTS "Everyone can view public club info" ON clubs;
DROP POLICY IF EXISTS "Players can view clubs with their contracts" ON clubs;

-- Policy 1: Club owners can see their own clubs
CREATE POLICY "Club owners can view their own clubs"
  ON clubs
  FOR SELECT
  USING (
    owner_id = auth.uid()
  );

-- Policy 2: Players can view clubs they have contracts with
-- This allows players to see club details when loading their contracts
CREATE POLICY "Players can view clubs with their contracts"
  ON clubs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM contracts
      INNER JOIN players ON contracts.player_id = players.id
      WHERE contracts.club_id = clubs.id
      AND players.user_id = auth.uid()
    )
  );

-- Policy 3: Anonymous/public can view basic club information
-- This makes clubs discoverable for scouting and other public features
CREATE POLICY "Public can view clubs"
  ON clubs
  FOR SELECT
  USING (true);

-- Verify the policies
SELECT schemaname, tablename, policyname, permissive, cmd
FROM pg_policies
WHERE tablename = 'clubs'
ORDER BY policyname;
