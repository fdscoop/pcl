-- Migration: Add stadium_id to payments table
-- Purpose: Track which stadium the payment is associated with
-- This enables direct stadium revenue tracking and reporting

-- Add stadium_id column to payments table
ALTER TABLE payments 
ADD COLUMN IF NOT EXISTS stadium_id UUID REFERENCES stadiums(id) ON DELETE SET NULL;

-- Add index for better query performance on stadium_id
CREATE INDEX IF NOT EXISTS idx_payments_stadium_id ON payments(stadium_id);

-- Add comment to explain the new column
COMMENT ON COLUMN payments.stadium_id IS 'Reference to the stadium for which payment was made; linked through match when applicable';

-- Backfill stadium_id for existing payments that have a match_id
UPDATE payments
SET stadium_id = m.stadium_id
FROM matches m
WHERE payments.match_id = m.id
AND payments.stadium_id IS NULL;

-- Log the migration
COMMENT ON TABLE payments IS 'Tracks all Razorpay payment transactions with match and stadium references for revenue tracking';
