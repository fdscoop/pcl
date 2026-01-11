-- =====================================================
-- FIX PAYMENT UPDATE POLICIES
-- =====================================================

-- The verify-payment API is failing to update payment records
-- We need to ensure service_role has proper UPDATE permissions

-- Ensure service_role can update payments (for payment verification)
DROP POLICY IF EXISTS "Service role can update payments" ON payments;
CREATE POLICY "Service role can update payments"
  ON payments FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Ensure service_role has UPDATE permission on the table
GRANT UPDATE ON payments TO service_role;

-- Add comment
COMMENT ON POLICY "Service role can update payments" ON payments 
IS 'Allows verify-payment API to update payment records after Razorpay verification';

-- Check current policies (for debugging)
SELECT policyname, permissive, roles, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'payments' 
ORDER BY policyname;