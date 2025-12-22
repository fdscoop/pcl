-- ============================================
-- FIX: Allow club owners to view contracted players
-- ============================================

-- Add a policy that allows club owners to view players they have contracts with
CREATE POLICY "Club owners can view contracted players"
  ON players
  FOR SELECT
  USING (
    -- Allow club owners to view players in their contracts
    EXISTS (
      SELECT 1 FROM contracts
      WHERE contracts.player_id = players.id
      AND contracts.club_id IN (
        SELECT id FROM clubs WHERE owner_id = auth.uid()
      )
    )
  );
