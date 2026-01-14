-- Migration: Create pending_payouts_summary table
-- Purpose: Denormalized summary table for quick dashboard queries on pending payouts
-- This avoids expensive GROUP BY queries on the payouts table
-- Note: If pending_payouts_summary exists as a view, it will be replaced with a table

-- Drop existing view if it exists (so we can create the table)
DROP VIEW IF EXISTS pending_payouts_summary CASCADE;

-- Create pending_payouts_summary table
CREATE TABLE IF NOT EXISTS pending_payouts_summary (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Recipient Details
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_role TEXT NOT NULL,
  -- Values: 'stadium_owner', 'referee', 'staff'
  
  -- Period Information
  payout_period_start DATE,
  payout_period_end DATE,
  
  -- Summary Statistics (in paise)
  total_pending_amount INTEGER NOT NULL DEFAULT 0,
  total_pending_count INTEGER NOT NULL DEFAULT 0,
  
  -- Timestamps
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_user_role CHECK (user_role IN ('stadium_owner', 'referee', 'staff')),
  CONSTRAINT positive_amount CHECK (total_pending_amount >= 0),
  CONSTRAINT positive_count CHECK (total_pending_count >= 0),
  CONSTRAINT unique_user_period UNIQUE (user_id, payout_period_start, payout_period_end)
);

-- Indexes for Performance
CREATE INDEX idx_pending_payouts_summary_user_id ON pending_payouts_summary(user_id);
CREATE INDEX idx_pending_payouts_summary_user_role ON pending_payouts_summary(user_role);
CREATE INDEX idx_pending_payouts_summary_period ON pending_payouts_summary(payout_period_start, payout_period_end);
CREATE INDEX idx_pending_payouts_summary_last_updated ON pending_payouts_summary(last_updated DESC);

-- Function to refresh pending payouts summary
CREATE OR REPLACE FUNCTION refresh_pending_payouts_summary(
  p_user_id UUID,
  p_period_start DATE,
  p_period_end DATE
)
RETURNS void AS $$
DECLARE
  v_total_amount INTEGER;
  v_total_count INTEGER;
BEGIN
  -- Calculate pending payouts for the user and period
  SELECT 
    COALESCE(SUM(amount), 0),
    COALESCE(COUNT(*), 0)
  INTO v_total_amount, v_total_count
  FROM payouts
  WHERE user_id = p_user_id
    AND status = 'pending'
    AND (
      (payout_period_start IS NULL AND payout_period_end IS NULL)
      OR (payout_period_start = p_period_start AND payout_period_end = p_period_end)
      OR (payout_period_start >= p_period_start AND payout_period_start <= p_period_end)
    );
  
  -- Upsert into summary table
  INSERT INTO pending_payouts_summary (user_id, user_role, payout_period_start, payout_period_end, total_pending_amount, total_pending_count, last_updated)
  SELECT
    p_user_id,
    user_role,
    p_period_start,
    p_period_end,
    v_total_amount,
    v_total_count,
    NOW()
  FROM (
    SELECT DISTINCT user_role FROM payouts WHERE user_id = p_user_id LIMIT 1
  ) sub
  ON CONFLICT (user_id, payout_period_start, payout_period_end) DO UPDATE
  SET 
    total_pending_amount = v_total_amount,
    total_pending_count = v_total_count,
    last_updated = NOW();
END;
$$ LANGUAGE plpgsql;

-- Function to update summary when payout status changes
CREATE OR REPLACE FUNCTION update_pending_payouts_summary_on_payout_change()
RETURNS TRIGGER AS $$
BEGIN
  -- If status changed to/from 'pending', refresh the summary
  IF (NEW.status = 'pending' AND OLD.status != 'pending') 
     OR (OLD.status = 'pending' AND NEW.status != 'pending') THEN
    PERFORM refresh_pending_payouts_summary(
      NEW.user_id,
      NEW.payout_period_start,
      NEW.payout_period_end
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update summary when payouts change
CREATE TRIGGER trigger_update_pending_payouts_summary
  AFTER UPDATE ON payouts
  FOR EACH ROW
  EXECUTE FUNCTION update_pending_payouts_summary_on_payout_change();

-- Trigger to update summary when new payout is created
CREATE OR REPLACE FUNCTION create_pending_payouts_summary_entry()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'pending' THEN
    PERFORM refresh_pending_payouts_summary(
      NEW.user_id,
      NEW.payout_period_start,
      NEW.payout_period_end
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_create_pending_payouts_summary
  AFTER INSERT ON payouts
  FOR EACH ROW
  EXECUTE FUNCTION create_pending_payouts_summary_entry();

-- Comments
COMMENT ON TABLE pending_payouts_summary IS 'Denormalized summary of pending payouts by user and period - auto-updated via triggers for efficient dashboard queries';
COMMENT ON COLUMN pending_payouts_summary.total_pending_amount IS 'Sum of all pending payout amounts in paise for this user and period';
COMMENT ON COLUMN pending_payouts_summary.total_pending_count IS 'Count of pending payouts for this user and period';
COMMENT ON FUNCTION refresh_pending_payouts_summary(UUID, DATE, DATE) IS 'Updates or creates pending payouts summary for a user and period';

