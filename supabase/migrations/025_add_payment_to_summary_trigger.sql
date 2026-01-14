-- Migration: Add trigger to populate pending_payouts_summary from payments
-- Purpose: Auto-create pending payout summaries when payment is completed via webhook

-- Function to calculate and insert pending payout summaries from a completed payment
CREATE OR REPLACE FUNCTION create_pending_payout_summaries_from_payment()
RETURNS TRIGGER AS $$
DECLARE
  v_stadium_owner_id UUID;
  v_stadium_amount INTEGER;
  v_stadium_commission INTEGER;
  v_stadium_net INTEGER;
  v_referee_id UUID;
  v_referee_amount INTEGER;
  v_referee_commission INTEGER;
  v_referee_net INTEGER;
  v_staff_ids UUID[];
  v_staff_amount INTEGER;
  v_staff_commission INTEGER;
  v_staff_net INTEGER;
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
  -- Get stadium owner from match->stadium relationship
  IF NEW.match_id IS NOT NULL THEN
    SELECT s.owner_id
    INTO v_stadium_owner_id
    FROM matches m
    JOIN stadiums s ON m.stadium_id = s.id
    WHERE m.id = NEW.match_id;

    -- Extract stadium amounts from amount_breakdown
    IF NEW.amount_breakdown IS NOT NULL THEN
      v_stadium_amount := COALESCE((NEW.amount_breakdown->>'stadium')::INTEGER, 0);
      v_stadium_commission := COALESCE((NEW.amount_breakdown->>'stadium_commission')::INTEGER, 0);
      v_stadium_net := v_stadium_amount - v_stadium_commission;

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
  -- Get referee from match_assignments
  IF NEW.match_id IS NOT NULL THEN
    SELECT ma.referee_id
    INTO v_referee_id
    FROM match_assignments ma
    WHERE ma.match_id = NEW.match_id
    AND ma.referee_id IS NOT NULL
    LIMIT 1;

    -- Extract referee amounts from amount_breakdown
    IF NEW.amount_breakdown IS NOT NULL AND v_referee_id IS NOT NULL THEN
      v_referee_amount := COALESCE((NEW.amount_breakdown->>'referee')::INTEGER, 0);
      v_referee_commission := COALESCE((NEW.amount_breakdown->>'referee_commission')::INTEGER, 0);
      v_referee_net := v_referee_amount - v_referee_commission;

      -- Create/update pending payout summary for referee
      IF v_referee_net > 0 THEN
        -- Get referee's user_id from referees table
        SELECT user_id INTO v_referee_id FROM referees WHERE id = v_referee_id;
        
        IF v_referee_id IS NOT NULL THEN
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
            v_referee_net,
            1,
            NOW()
          )
          ON CONFLICT (user_id, payout_period_start, payout_period_end) DO UPDATE
          SET 
            total_pending_amount = pending_payouts_summary.total_pending_amount + v_referee_net,
            total_pending_count = pending_payouts_summary.total_pending_count + 1,
            last_updated = NOW();
        END IF;
      END IF;
    END IF;
  END IF;

  -- ===== STAFF PAYOUT =====
  -- Get staff from match_assignments
  IF NEW.match_id IS NOT NULL THEN
    SELECT ARRAY_AGG(ma.staff_id)
    INTO v_staff_ids
    FROM match_assignments ma
    WHERE ma.match_id = NEW.match_id
    AND ma.staff_id IS NOT NULL;

    -- Extract staff amounts from amount_breakdown
    IF NEW.amount_breakdown IS NOT NULL AND v_staff_ids IS NOT NULL THEN
      v_staff_amount := COALESCE((NEW.amount_breakdown->>'staff')::INTEGER, 0);
      v_staff_commission := COALESCE((NEW.amount_breakdown->>'staff_commission')::INTEGER, 0);
      v_staff_net := v_staff_amount - v_staff_commission;

      -- Divide staff payout equally among all staff
      IF v_staff_net > 0 AND ARRAY_LENGTH(v_staff_ids, 1) > 0 THEN
        v_staff_net := v_staff_net / ARRAY_LENGTH(v_staff_ids, 1);
        
        -- Create/update pending payout summary for each staff member
        FOR i IN 1..ARRAY_LENGTH(v_staff_ids, 1) LOOP
          DECLARE
            v_staff_user_id UUID;
          BEGIN
            -- Get staff's user_id from staff table
            SELECT user_id INTO v_staff_user_id FROM staff WHERE id = v_staff_ids[i];
            
            IF v_staff_user_id IS NOT NULL THEN
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
                v_staff_user_id,
                'staff',
                v_payment_date,
                v_payment_date,
                v_staff_net,
                1,
                NOW()
              )
              ON CONFLICT (user_id, payout_period_start, payout_period_end) DO UPDATE
              SET 
                total_pending_amount = pending_payouts_summary.total_pending_amount + v_staff_net,
                total_pending_count = pending_payouts_summary.total_pending_count + 1,
                last_updated = NOW();
            END IF;
          END;
        END LOOP;
      END IF;
    END IF;
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
COMMENT ON FUNCTION create_pending_payout_summaries_from_payment() IS 'Automatically populates pending_payouts_summary table when a payment is completed - calculates stadium owner, referee, and staff shares';
COMMENT ON TRIGGER trigger_create_pending_payout_summaries ON payments IS 'Populates pending_payouts_summary table from completed payments';
