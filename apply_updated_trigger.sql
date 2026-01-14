-- Drop and recreate the trigger with the updated logic
DROP TRIGGER IF EXISTS trigger_create_pending_payout_summaries ON payments;

-- Create OR REPLACE function (from migration 025)
CREATE OR REPLACE FUNCTION create_pending_payout_summaries_from_payment()
RETURNS TRIGGER AS $$
DECLARE
  v_stadium_owner_id UUID;
  v_stadium_amount INTEGER;
  v_stadium_commission INTEGER;
  v_stadium_net INTEGER;
  v_payment_date DATE;
BEGIN
  -- Only process completed payments
  IF NEW.status != 'completed' THEN
    RETURN NEW;
  END IF;

  -- Skip if already processed (UPDATE trigger case)
  IF OLD.status = 'completed' THEN
    RETURN NEW;
  END IF;

  -- Extract payment date for period tracking
  v_payment_date := DATE(NEW.completed_at);

  -- ===== STADIUM OWNER PAYOUT =====
  -- Get stadium owner directly from payments.stadium_id (added in migration 020)
  IF NEW.stadium_id IS NOT NULL THEN
    SELECT s.owner_id
    INTO v_stadium_owner_id
    FROM stadiums s
    WHERE s.id = NEW.stadium_id;

    -- Extract stadium amounts from amount_breakdown
    -- Current structure: {"net_amount": 38544, "platform_commission": 4380, ...}
    -- Stadium owner gets the full net_amount (after platform commission is already deducted)
    IF NEW.amount_breakdown IS NOT NULL THEN
      -- Use net_amount as the stadium payout (platform commission already deducted)
      v_stadium_net := COALESCE((NEW.amount_breakdown->>'net_amount')::INTEGER, 0);
      v_stadium_commission := COALESCE((NEW.amount_breakdown->>'platform_commission')::INTEGER, 0);
      v_stadium_amount := v_stadium_net + v_stadium_commission; -- Total before commission

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

  -- ===== REFEREE PAYOUT =====
  -- Note: Currently no referee/staff breakdown in payment data
  -- Skipping referee and staff allocation for now
  -- Future: Add referee/staff breakdown to amount_breakdown in payment creation

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to create pending payout summaries when payment is completed
CREATE TRIGGER trigger_create_pending_payout_summaries
  AFTER INSERT OR UPDATE ON payments
  FOR EACH ROW
  WHEN (NEW.status = 'completed')
  EXECUTE FUNCTION create_pending_payout_summaries_from_payment();

-- Comment
COMMENT ON FUNCTION create_pending_payout_summaries_from_payment() IS 'Automatically populates pending_payouts_summary table when a payment is completed - uses net_amount from amount_breakdown for stadium owner payout';
COMMENT ON TRIGGER trigger_create_pending_payout_summaries ON payments IS 'Populates pending_payouts_summary table from completed payments using existing amount_breakdown structure';
