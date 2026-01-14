-- Drop and recreate the trigger with the updated logic (Option B: Three-part allocation)
DROP TRIGGER IF EXISTS trigger_create_pending_payout_summaries ON payments;

-- Create OR REPLACE function (from migration 025)
-- Allocates stadium_net to stadium owner, and proportionally splits remaining to referees/staff
CREATE OR REPLACE FUNCTION create_pending_payout_summaries_from_payment()
RETURNS TRIGGER AS $$
DECLARE
  v_stadium_owner_id UUID;
  v_net_amount INTEGER;
  v_platform_commission INTEGER;
  v_payment_date DATE;
  v_match RECORD;
  v_referee_id UUID;
  v_staff_id UUID;
  v_referee_count INTEGER;
  v_staff_count INTEGER;
  v_referee_share INTEGER;
  v_staff_share INTEGER;
  v_stadium_percentage DECIMAL := 0.60;  -- Stadium gets 60% of net_amount
  v_referee_percentage DECIMAL := 0.25;  -- Referees share 25% of net_amount
  v_staff_percentage DECIMAL := 0.15;    -- Staff share 15% of net_amount
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

  -- Extract net amount and commission from amount_breakdown
  IF NEW.amount_breakdown IS NOT NULL THEN
    v_net_amount := COALESCE((NEW.amount_breakdown->>'net_amount')::INTEGER, 0);
    v_platform_commission := COALESCE((NEW.amount_breakdown->>'platform_commission')::INTEGER, 0);
  END IF;

  IF v_net_amount = 0 THEN
    RETURN NEW;  -- No amount to allocate
  END IF;

  -- Get match details (referees and staff)
  IF NEW.match_id IS NOT NULL THEN
    SELECT *
    INTO v_match
    FROM matches
    WHERE id = NEW.match_id;
  END IF;

  -- ===== STADIUM OWNER PAYOUT =====
  -- Stadium owner gets 60% of net_amount
  IF NEW.stadium_id IS NOT NULL THEN
    SELECT s.owner_id
    INTO v_stadium_owner_id
    FROM stadiums s
    WHERE s.id = NEW.stadium_id;

    IF v_stadium_owner_id IS NOT NULL THEN
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
        FLOOR(v_net_amount * v_stadium_percentage),
        1,
        NOW()
      )
      ON CONFLICT (user_id, payout_period_start, payout_period_end) DO UPDATE
      SET 
        total_pending_amount = pending_payouts_summary.total_pending_amount + FLOOR(v_net_amount * v_stadium_percentage),
        total_pending_count = pending_payouts_summary.total_pending_count + 1,
        last_updated = NOW();
    END IF;
  END IF;

  -- ===== REFEREE PAYOUTS =====
  -- Referees share 25% of net_amount (split equally)
  IF v_match.referee_ids IS NOT NULL AND array_length(v_match.referee_ids, 1) > 0 THEN
    v_referee_count := array_length(v_match.referee_ids, 1);
    v_referee_share := FLOOR((v_net_amount * v_referee_percentage) / v_referee_count);

    FOREACH v_referee_id IN ARRAY v_match.referee_ids
    LOOP
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
        v_referee_id,
        'referee',
        v_payment_date,
        v_payment_date,
        v_referee_share,
        1,
        NOW()
      )
      ON CONFLICT (user_id, payout_period_start, payout_period_end) DO UPDATE
      SET 
        total_pending_amount = pending_payouts_summary.total_pending_amount + v_referee_share,
        total_pending_count = pending_payouts_summary.total_pending_count + 1,
        last_updated = NOW();
    END LOOP;
  END IF;

  -- ===== STAFF PAYOUTS =====
  -- Staff share 15% of net_amount (split equally)
  IF v_match.staff_ids IS NOT NULL AND array_length(v_match.staff_ids, 1) > 0 THEN
    v_staff_count := array_length(v_match.staff_ids, 1);
    v_staff_share := FLOOR((v_net_amount * v_staff_percentage) / v_staff_count);

    FOREACH v_staff_id IN ARRAY v_match.staff_ids
    LOOP
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
        v_staff_id,
        'staff',
        v_payment_date,
        v_payment_date,
        v_staff_share,
        1,
        NOW()
      )
      ON CONFLICT (user_id, payout_period_start, payout_period_end) DO UPDATE
      SET 
        total_pending_amount = pending_payouts_summary.total_pending_amount + v_staff_share,
        total_pending_count = pending_payouts_summary.total_pending_count + 1,
        last_updated = NOW();
    END LOOP;
  END IF;

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
COMMENT ON FUNCTION create_pending_payout_summaries_from_payment() IS 'Automatically populates pending_payouts_summary table when a payment is completed - allocates net_amount proportionally: 60% stadium, 25% referees, 15% staff';
COMMENT ON TRIGGER trigger_create_pending_payout_summaries ON payments IS 'Populates pending_payouts_summary table from completed payments using proportional three-part allocation (stadium/referee/staff)';
