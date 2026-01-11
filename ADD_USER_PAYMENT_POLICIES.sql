-- =====================================================
-- ADD MISSING USER RLS POLICIES FOR PAYMENTS TABLE
-- =====================================================

-- The frontend needs to query payment records using anon/authenticated role
-- but currently only service_role has access. We need user-specific policies.

-- Allow authenticated users to SELECT their own payment records
DROP POLICY IF EXISTS "Users can view their own payments" ON payments;
CREATE POLICY "Users can view their own payments"
  ON payments FOR SELECT
  TO authenticated
  USING (
    -- Users can view payments they made directly
    paid_by = auth.uid() OR 
    -- Club owners can view payments for their clubs
    club_id IN (
      SELECT id FROM clubs WHERE owner_id = auth.uid()
    ) OR
    -- Stadium owners can view payments for matches at their stadiums
    EXISTS (
      SELECT 1 FROM matches m 
      JOIN stadiums s ON s.id = m.stadium_id 
      WHERE m.payment_id = payments.id 
      AND s.owner_id = auth.uid()
    ) OR
    -- Admins can view all payments
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- Allow anonymous users to SELECT payments (for checkout verification)
-- This is needed for the payment verification flow
DROP POLICY IF EXISTS "Anonymous can view payments for verification" ON payments;
CREATE POLICY "Anonymous can view payments for verification"
  ON payments FOR SELECT
  TO anon
  USING (true);

-- Comments for documentation
COMMENT ON POLICY "Users can view their own payments" ON payments 
IS 'Allows users to view payments: players/referees/staff (their own), club_owners (club payments), stadium_owners (stadium match payments), admins (all payments)';

COMMENT ON POLICY "Anonymous can view payments for verification" ON payments 
IS 'Allows anonymous users to query payments for checkout verification flow';

-- Grant SELECT permissions to anon role on payments table
GRANT SELECT ON payments TO anon;
GRANT SELECT ON payments TO authenticated;