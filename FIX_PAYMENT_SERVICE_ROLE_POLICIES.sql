-- =====================================================
-- FIX PAYMENT RECORD CREATION - COMPLETE DATABASE FIX
-- =====================================================

-- STEP 1: Add missing payment_gateway column (needed by create-order API)
ALTER TABLE payments 
ADD COLUMN IF NOT EXISTS payment_gateway TEXT DEFAULT 'razorpay';

-- Add comment to document the column
COMMENT ON COLUMN payments.payment_gateway 
IS 'Payment gateway used for this transaction (razorpay, cashfree, etc.)';

-- STEP 2: Fix razorpay_order_id constraint (allow null initially for payment creation flow)
ALTER TABLE payments 
ALTER COLUMN razorpay_order_id DROP NOT NULL;

COMMENT ON COLUMN payments.razorpay_order_id 
IS 'Razorpay order ID - initially null during payment creation, updated after order creation';

-- STEP 3: Fix RLS policies for service_role access

-- Drop existing policies if they exist and recreate them to ensure consistency
DROP POLICY IF EXISTS "Service role can insert payments" ON payments;
DROP POLICY IF EXISTS "Service role can select payments" ON payments;
DROP POLICY IF EXISTS "Service role can update payments" ON payments;

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

-- Add UPDATE policy which is likely missing
CREATE POLICY "Service role can update payments"
  ON payments FOR UPDATE
  TO service_role
  USING (true);

COMMENT ON POLICY "Service role can insert payments" ON payments 
IS 'Allows payment verification API to create payment records via Razorpay webhooks and verification';

COMMENT ON POLICY "Service role can select payments" ON payments 
IS 'Allows payment verification API to query existing records during upsert operations';