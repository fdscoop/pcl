-- =====================================================
-- CREATE PAYMENTS TABLE
-- Main table for tracking all Razorpay transactions
-- =====================================================

CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Razorpay Details
  razorpay_order_id TEXT NOT NULL UNIQUE,
  razorpay_payment_id TEXT UNIQUE,
  razorpay_signature TEXT,
  
  -- Payment Info
  amount INTEGER NOT NULL, -- Total amount in paise (₹1 = 100 paise)
  currency TEXT DEFAULT 'INR',
  status TEXT NOT NULL DEFAULT 'created', 
  -- Status values: 'created', 'processing', 'completed', 'failed', 'refunded'
  
  -- Payer Details
  club_id UUID REFERENCES clubs(id) ON DELETE SET NULL,
  paid_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Match Reference
  match_id UUID REFERENCES matches(id) ON DELETE SET NULL,
  
  -- Amount Breakdown (JSONB for flexibility)
  -- Example: {"stadium": 500000, "stadium_commission": 50000, "referee": 200000, "referee_commission": 20000, "staff": 100000, "staff_commission": 10000, "total_commission": 80000}
  amount_breakdown JSONB,
  
  -- Metadata
  receipt TEXT,
  notes JSONB,
  payment_method TEXT, -- 'upi', 'card', 'netbanking', 'wallet', etc.
  
  -- Refund Tracking
  refund_status TEXT, -- null, 'partial', 'full'
  refunded_amount INTEGER DEFAULT 0,
  refund_reason TEXT,
  refund_initiated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  refunded_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Webhook Tracking
  webhook_received BOOLEAN DEFAULT FALSE,
  webhook_data JSONB,
  webhook_received_at TIMESTAMPTZ,
  
  CONSTRAINT valid_status CHECK (status IN ('created', 'processing', 'completed', 'failed', 'refunded')),
  CONSTRAINT valid_refund_status CHECK (refund_status IS NULL OR refund_status IN ('partial', 'full')),
  CONSTRAINT positive_amount CHECK (amount > 0),
  CONSTRAINT valid_refund_amount CHECK (refunded_amount >= 0 AND refunded_amount <= amount)
);

-- Indexes for Performance
CREATE INDEX idx_payments_match_id ON payments(match_id);
CREATE INDEX idx_payments_club_id ON payments(club_id);
CREATE INDEX idx_payments_paid_by ON payments(paid_by);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_razorpay_order ON payments(razorpay_order_id);
CREATE INDEX idx_payments_razorpay_payment ON payments(razorpay_payment_id) WHERE razorpay_payment_id IS NOT NULL;
CREATE INDEX idx_payments_created_at ON payments(created_at DESC);

-- Updated at trigger
CREATE OR REPLACE FUNCTION update_payments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_payments_updated_at
  BEFORE UPDATE ON payments
  FOR EACH ROW
  EXECUTE FUNCTION update_payments_updated_at();

-- Comments
COMMENT ON TABLE payments IS 'Main payments table tracking all Razorpay transactions';
COMMENT ON COLUMN payments.amount IS 'Total payment amount in paise (₹1 = 100 paise)';
COMMENT ON COLUMN payments.amount_breakdown IS 'JSONB breakdown of payment allocation: stadium fee, referee fee, staff fee, and commissions';
COMMENT ON COLUMN payments.webhook_data IS 'Raw webhook payload from Razorpay for audit trail';
