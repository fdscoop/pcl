-- =====================================================
-- ADD PAYMENT FIELDS TO MATCHES TABLE
-- Link matches with payment records
-- =====================================================

-- Add payment tracking columns to matches
ALTER TABLE matches 
  ADD COLUMN IF NOT EXISTS payment_id UUID REFERENCES payments(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS total_cost INTEGER,
  ADD COLUMN IF NOT EXISTS cost_breakdown JSONB;

-- Add constraints
ALTER TABLE matches
  ADD CONSTRAINT valid_payment_status CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded', 'partially_refunded'));

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_matches_payment_id ON matches(payment_id);
CREATE INDEX IF NOT EXISTS idx_matches_payment_status ON matches(payment_status);

-- Comments
COMMENT ON COLUMN matches.payment_id IS 'Reference to the payment record for this match';
COMMENT ON COLUMN matches.payment_status IS 'Payment status: pending, paid, failed, refunded, partially_refunded';
COMMENT ON COLUMN matches.total_cost IS 'Total cost in paise (stadium + referee + staff + commission)';
COMMENT ON COLUMN matches.cost_breakdown IS 'JSONB breakdown: {"stadium": 500000, "referee": 200000, "staff": 100000, "commission": 80000, "total": 880000}';

-- Function to update match payment status when payment completes
CREATE OR REPLACE FUNCTION update_match_payment_status()
RETURNS TRIGGER AS $$
BEGIN
  -- When payment status changes to completed, update match
  IF NEW.status = 'completed' AND OLD.status != 'completed' AND NEW.match_id IS NOT NULL THEN
    UPDATE matches
    SET payment_status = 'paid'
    WHERE id = NEW.match_id;
  END IF;
  
  -- When payment status changes to refunded, update match
  IF NEW.status = 'refunded' AND OLD.status != 'refunded' AND NEW.match_id IS NOT NULL THEN
    UPDATE matches
    SET payment_status = CASE 
      WHEN NEW.refunded_amount = NEW.amount THEN 'refunded'
      ELSE 'partially_refunded'
    END
    WHERE id = NEW.match_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_match_payment_status
  AFTER UPDATE ON payments
  FOR EACH ROW
  EXECUTE FUNCTION update_match_payment_status();
