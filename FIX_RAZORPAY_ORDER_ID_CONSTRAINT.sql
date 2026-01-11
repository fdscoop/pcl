-- =====================================================
-- FIX RAZORPAY_ORDER_ID CONSTRAINT - ALLOW NULL INITIALLY
-- =====================================================

-- The create-order API needs to create payment record first, then create Razorpay order,
-- then update the payment record with the order_id. But current schema has NOT NULL constraint.

-- Remove NOT NULL constraint from razorpay_order_id to allow initial null values
ALTER TABLE payments 
ALTER COLUMN razorpay_order_id DROP NOT NULL;

-- Keep the UNIQUE constraint but allow nulls temporarily during payment creation
-- The webhook will update this field once the order is created

COMMENT ON COLUMN payments.razorpay_order_id 
IS 'Razorpay order ID - initially null during payment creation, updated after order creation';