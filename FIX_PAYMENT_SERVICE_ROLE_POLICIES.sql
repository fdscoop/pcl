-- =====================================================
-- FIX PAYMENT RECORD CREATION - ADD SERVICE ROLE INSERT POLICY
-- =====================================================

-- The verify-payment API needs to create payment records via service role
-- but currently only has UPDATE permissions, not INSERT permissions

-- Add service role INSERT policy for payments table
CREATE POLICY "Service role can insert payments"
  ON payments FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Also ensure service role can SELECT to check existing records during upsert
CREATE POLICY "Service role can select payments"
  ON payments FOR SELECT
  TO service_role
  USING (true);

COMMENT ON POLICY "Service role can insert payments" ON payments 
IS 'Allows payment verification API to create payment records via Razorpay webhooks and verification';

COMMENT ON POLICY "Service role can select payments" ON payments 
IS 'Allows payment verification API to query existing records during upsert operations';