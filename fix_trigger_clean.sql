-- Clean implementation of the updated trigger for pending_payouts_summary
-- Uses the existing amount_breakdown structure with net_amount

-- Drop existing trigger and function
DROP TRIGGER IF EXISTS trigger_create_pending_payout_summaries ON payments;
DROP FUNCTION IF EXISTS create_pending_payout_summaries_from_payment();

-- Create the updated function
CREATE OR REPLACE FUNCTION create_pending_payout_summaries_from_payment()
RETURNS TRIGGER AS $$
DECLARE
  v_stadium_owner_id UUID;
  v_stadium_net INTEGER;
  v_payment_date DATE;
BEGIN
  -- Only process completed payments
  IF NEW.status != 'completed' THEN
    RETURN NEW;
  END IF;

  -- Skip if already processed (UPDATE trigger case)
  IF OLD.status IS NOT NULL AND OLD.status = 'completed' THEN
    RETURN NEW;
  END IF;

  -- Extract payment date for period tracking
  v_payment_date := DATE(NEW.completed_at);

  -- ===== STADIUM OWNER PAYOUT =====
  -- Get stadium owner directly from payments.stadium_id
  IF NEW.stadium_id IS NOT NULL THEN
    SELECT s.owner_id
    INTO v_stadium_owner_id
    FROM stadiums s
    WHERE s.id = NEW.stadium_id;

    -- Extract net_amount from the existing amount_breakdown structure
    -- Structure: {"net_amount": 38544, "platform_commission": 4380, ...}
    IF NEW.amount_breakdown IS NOT NULL THEN
      -- Stadium owner gets the full net_amount (platform commission already deducted)
      v_stadium_net := COALESCE((NEW.amount_breakdown->>'net_amount')::INTEGER, 0);

      -- Create/update pending payout summary for stadium owner
      IF v_stadium_owner_id IS NOT NULL AND v_stadium_net > 0 THEN
        INSERT INTO pending_payouts_summary (
          user_id, 
          user_role, 
          payout_period_start, 
          payout_period_end, 
          total_pending_amount, 
          total_pending_count,
          last_updated
        )
        VALUES (
          v_stadium_owner_id,
          'stadium_owner',
          v_payment_date,
          v_payment_date,
          v_stadium_net,
          1,
          NOW()
        )
        ON CONFLICT (user_id, payout_period_start, payout_period_end) DO UPDATE
        SET 
          total_pending_amount = pending_payouts_summary.total_pending_amount + v_stadium_net,
          total_pending_count = pending_payouts_summary.total_pending_count + 1,
          last_updated = NOW();
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
CREATE TRIGGER trigger_create_pending_payout_summaries
  AFTER INSERT OR UPDATE ON payments
  FOR EACH ROW
  WHEN (NEW.status = 'completed')
  EXECUTE FUNCTION create_pending_payout_summaries_from_payment();

-- Add comments
COMMENT ON FUNCTION create_pending_payout_summaries_from_payment() IS 'Automatically populates pending_payouts_summary table when payment is completed - uses net_amount for stadium owner payout';
COMMENT ON TRIGGER trigger_create_pending_payout_summaries ON payments IS 'Creates pending payout summaries from completed payments using net_amount structure';