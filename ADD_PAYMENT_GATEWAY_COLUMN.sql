-- =====================================================
-- ADD MISSING PAYMENT_GATEWAY COLUMN TO PAYMENTS TABLE
-- =====================================================

-- This column is needed by the create-order API but missing from the original schema

ALTER TABLE payments 
ADD COLUMN IF NOT EXISTS payment_gateway TEXT DEFAULT 'razorpay';

-- Add comment to document the column
COMMENT ON COLUMN payments.payment_gateway 
IS 'Payment gateway used for this transaction (razorpay, cashfree, etc.)';

-- Create index for performance if needed
CREATE INDEX IF NOT EXISTS idx_payments_payment_gateway 
ON payments(payment_gateway);