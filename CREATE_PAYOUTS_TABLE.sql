-- =====================================================
-- CREATE PAYOUTS TABLE
-- Track payouts to stadium owners, referees, and staff
-- =====================================================

CREATE TABLE IF NOT EXISTS payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Recipient Details
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_role TEXT NOT NULL,
  -- Values: 'stadium_owner', 'referee', 'staff'
  
  -- Payout Financial Details (in paise)
  amount INTEGER NOT NULL, -- Total payout amount
  currency TEXT DEFAULT 'INR',
  
  -- Payout Status
  status TEXT NOT NULL DEFAULT 'pending',
  -- Values: 'pending', 'processing', 'completed', 'failed', 'cancelled'
  
  -- Razorpay Payout Details (if using Razorpay Payouts API)
  razorpay_payout_id TEXT UNIQUE,
  razorpay_fund_account_id TEXT,
  razorpay_transfer_id TEXT,
  
  -- Bank Details (snapshot from user's KYC at time of payout)
  bank_account_number TEXT,
  ifsc_code TEXT,
  account_holder_name TEXT,
  bank_name TEXT,
  
  -- Payout Period (for batch payouts)
  payout_period_start DATE,
  payout_period_end DATE,
  
  -- Booking References (JSONB array of booking IDs included in this payout)
  booking_ids JSONB NOT NULL,
  -- Example: ["uuid1", "uuid2", "uuid3"]
  
  booking_count INTEGER DEFAULT 0, -- Number of bookings in this payout
  
  -- Match References (for quick lookup)
  match_ids JSONB,
  -- Example: ["match_uuid1", "match_uuid2"]
  
  -- Error Tracking
  failure_reason TEXT,
  failure_code TEXT,
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  
  -- Processing Details
  processed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  -- Admin who initiated/approved the payout
  
  processing_method TEXT,
  -- Values: 'razorpay_auto', 'razorpay_manual', 'bank_transfer', 'manual'
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  initiated_at TIMESTAMPTZ,
  processed_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  failed_at TIMESTAMPTZ,
  
  -- Notes
  notes TEXT,
  admin_notes TEXT,
  internal_reference TEXT, -- For accounting/reconciliation
  
  -- Constraints
  CONSTRAINT valid_user_role CHECK (user_role IN ('stadium_owner', 'referee', 'staff')),
  CONSTRAINT valid_payout_status CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
  CONSTRAINT positive_amount CHECK (amount > 0),
  CONSTRAINT valid_retry_count CHECK (retry_count >= 0 AND retry_count <= max_retries),
  CONSTRAINT valid_processing_method CHECK (processing_method IS NULL OR processing_method IN ('razorpay_auto', 'razorpay_manual', 'bank_transfer', 'manual'))
);

-- Indexes for Performance
CREATE INDEX idx_payouts_user_id ON payouts(user_id);
CREATE INDEX idx_payouts_user_role ON payouts(user_role);
CREATE INDEX idx_payouts_status ON payouts(status);
CREATE INDEX idx_payouts_razorpay_id ON payouts(razorpay_payout_id) WHERE razorpay_payout_id IS NOT NULL;
CREATE INDEX idx_payouts_period ON payouts(payout_period_start, payout_period_end);
CREATE INDEX idx_payouts_created_at ON payouts(created_at DESC);
CREATE INDEX idx_payouts_completed_at ON payouts(completed_at DESC) WHERE completed_at IS NOT NULL;

-- Composite indexes
CREATE INDEX idx_payouts_user_status ON payouts(user_id, status);
CREATE INDEX idx_payouts_role_status ON payouts(user_role, status);

-- Updated at trigger
CREATE OR REPLACE FUNCTION update_payouts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_payouts_updated_at
  BEFORE UPDATE ON payouts
  FOR EACH ROW
  EXECUTE FUNCTION update_payouts_updated_at();

-- Auto-set completed_at when status changes to completed
CREATE OR REPLACE FUNCTION set_payout_completed_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    NEW.completed_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_payout_completed_at
  BEFORE UPDATE ON payouts
  FOR EACH ROW
  EXECUTE FUNCTION set_payout_completed_at();

-- Auto-set failed_at when status changes to failed
CREATE OR REPLACE FUNCTION set_payout_failed_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'failed' AND OLD.status != 'failed' THEN
    NEW.failed_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_payout_failed_at
  BEFORE UPDATE ON payouts
  FOR EACH ROW
  EXECUTE FUNCTION set_payout_failed_at();

-- Comments
COMMENT ON TABLE payouts IS 'Payout records for stadium owners, referees, and staff';
COMMENT ON COLUMN payouts.amount IS 'Total payout amount in paise';
COMMENT ON COLUMN payouts.booking_ids IS 'JSONB array of booking UUIDs included in this payout';
COMMENT ON COLUMN payouts.match_ids IS 'JSONB array of match UUIDs for quick reference';
COMMENT ON COLUMN payouts.payout_period_start IS 'Start date of the payout period (for batch payouts)';
COMMENT ON COLUMN payouts.payout_period_end IS 'End date of the payout period (for batch payouts)';
