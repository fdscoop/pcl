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
    paid_by = auth.uid() OR 
    club_id IN (
      SELECT id FROM clubs WHERE owner_id = auth.uid()
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
IS 'Allows users to view payments they made or for clubs they own';

COMMENT ON POLICY "Anonymous can view payments for verification" ON payments 
IS 'Allows anonymous users to query payments for checkout verification flow';

-- Grant SELECT permissions to anon role on payments table
GRANT SELECT ON payments TO anon;
GRANT SELECT ON payments TO authenticated;