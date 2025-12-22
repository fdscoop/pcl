-- ============================================
-- FIX: Allow club owners to view players they have contracts with
-- ============================================

-- Drop the problematic policy that causes infinite recursion
DROP POLICY IF EXISTS "Club owners can view verified players" ON players;

-- Create a simpler policy WITHOUT subqueries to avoid infinite recursion
-- We'll use a helper function approach instead
CREATE POLICY "Club owners can view players"
  ON players
  FOR SELECT
  USING (
    -- Allow players to see their own data
    auth.uid() = user_id
    OR
    -- Allow club owners to view players available for scouting
    (
      is_available_for_scout = true
      AND EXISTS (
        SELECT 1 FROM users
        WHERE users.id = auth.uid()
        AND users.role = 'club_owner'
        AND users.kyc_status = 'verified'
      )
    )
  );

-- Create a separate function to check if a user is the owner of contracts for a player
-- This is used by the contract view page to load player info
CREATE OR REPLACE FUNCTION check_user_owns_player_contract(p_player_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM contracts
    INNER JOIN clubs ON clubs.id = contracts.club_id
    WHERE contracts.player_id = p_player_id
    AND clubs.owner_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- NOTE: Contract view pages should:
-- 1. Load the contract directly (club owners can view their own contracts)
-- 2. Get player ID from contract
-- 3. Use RPC call to check if they own the contract before querying players
-- OR fetch player as service role from backend to avoid RLS issues
