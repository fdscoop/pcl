-- Allow players to read club information for clubs they have contracts with
-- This enables the contract view page to display complete club details

-- Create a policy that allows players to read clubs they have contracts with
CREATE POLICY "Players can read clubs they have contracts with"
ON clubs
FOR SELECT
TO authenticated
USING (
  id IN (
    SELECT club_id
    FROM contracts
    WHERE player_id IN (
      SELECT id
      FROM players
      WHERE user_id = auth.uid()
    )
  )
);

-- Also allow club owners to read their own clubs (if not already allowed)
CREATE POLICY "Club owners can read their own clubs"
ON clubs
FOR SELECT
TO authenticated
USING (owner_id = auth.uid());
