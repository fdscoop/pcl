-- =====================================================
-- COMPREHENSIVE PAYMENT TABLE FIX - FINAL MIGRATION
-- =====================================================

-- This migration fixes all identified issues with the payments table

-- STEP 1: Add missing payment_gateway column (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payments' AND column_name = 'payment_gateway') THEN
        ALTER TABLE payments ADD COLUMN payment_gateway TEXT DEFAULT 'razorpay';
        COMMENT ON COLUMN payments.payment_gateway IS 'Payment gateway used for this transaction (razorpay, cashfree, etc.)';
    END IF;
END $$;

-- STEP 2: Fix razorpay_order_id constraint (allow null initially)
ALTER TABLE payments ALTER COLUMN razorpay_order_id DROP NOT NULL;
COMMENT ON COLUMN payments.razorpay_order_id IS 'Razorpay order ID - initially null during payment creation, updated after order creation';

-- STEP 3: Fix status constraint (ensure 'pending' is allowed)
-- First check if constraint exists and what values are allowed
DO $$
BEGIN
    -- Drop existing check constraint if it exists
    IF EXISTS (SELECT 1 FROM information_schema.check_constraints WHERE constraint_name = 'valid_status') THEN
        ALTER TABLE payments DROP CONSTRAINT valid_status;
    END IF;
    
    -- Add updated constraint with 'pending' status
    ALTER TABLE payments ADD CONSTRAINT valid_status 
    CHECK (status IN ('created', 'pending', 'processing', 'completed', 'failed', 'refunded'));
END $$;

-- STEP 4: Fix RLS policies for service_role access
DROP POLICY IF EXISTS "Service role can insert payments" ON payments;
DROP POLICY IF EXISTS "Service role can select payments" ON payments;
DROP POLICY IF EXISTS "Service role can update payments" ON payments;

CREATE POLICY "Service role can insert payments"
  ON payments FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "Service role can select payments"
  ON payments FOR SELECT
  TO service_role
  USING (true);

CREATE POLICY "Service role can update payments"
  ON payments FOR UPDATE
  TO service_role
  USING (true);

-- Add comments for documentation
COMMENT ON POLICY "Service role can insert payments" ON payments 
IS 'Allows payment APIs to create payment records via service role';

COMMENT ON POLICY "Service role can select payments" ON payments 
IS 'Allows payment APIs to query payment records via service role';

COMMENT ON POLICY "Service role can update payments" ON payments 
IS 'Allows payment APIs to update payment records via service role';

-- STEP 5: Verify the fixes
SELECT 
    'payment_gateway column exists' as check_name,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'payments' AND column_name = 'payment_gateway'
    ) THEN '✅ PASS' ELSE '❌ FAIL' END as result
    
UNION ALL

SELECT 
    'razorpay_order_id nullable' as check_name,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'payments' AND column_name = 'razorpay_order_id' AND is_nullable = 'YES'
    ) THEN '✅ PASS' ELSE '❌ FAIL' END as result
    
UNION ALL

SELECT 
    'service_role policies exist' as check_name,
    CASE WHEN (
        SELECT COUNT(*) FROM pg_policies 
        WHERE tablename = 'payments' AND roles @> '{service_role}'
    ) >= 3 THEN '✅ PASS' ELSE '❌ FAIL' END as result;