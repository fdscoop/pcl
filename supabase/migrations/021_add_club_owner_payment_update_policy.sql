-- Migration: Add policy for club owners to update their own payment records
-- Purpose: Allow club owners to update match_id and stadium_id after match creation
-- Issue: Club owners were blocked from updating payments due to missing RLS policy

-- Add policy for club owners to update their own payments
CREATE POLICY "Club owners can update their payment records"
  ON payments FOR UPDATE
  TO authenticated
  USING (
    -- Only allow updates to payments they created
    paid_by = auth.uid()
    AND club_id IN (
      SELECT id FROM clubs
      WHERE owner_id = auth.uid()
    )
  )
  WITH CHECK (
    -- Ensure they can only update to maintain ownership
    paid_by = auth.uid()
    AND club_id IN (
      SELECT id FROM clubs
      WHERE owner_id = auth.uid()
    )
  );

-- Add comment explaining the policy
COMMENT ON POLICY "Club owners can update their payment records" ON payments 
IS 'Allows club owners to update payment records they created for their clubs, enabling match_id and stadium_id linking after match creation';
