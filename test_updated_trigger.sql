-- Updated manual trigger test using the correct amount_breakdown structure
-- Run this to test the updated trigger logic

DO $$
DECLARE
  payment_record RECORD;
  v_stadium_owner_id UUID;
  v_stadium_net INTEGER;
  v_payment_date DATE;
BEGIN
  -- Get the most recent completed payment
  SELECT * INTO payment_record
  FROM payments
  WHERE status = 'completed'
  ORDER BY completed_at DESC
  LIMIT 1;
  
  RAISE NOTICE '🔍 Testing with payment: %', payment_record.razorpay_payment_id;
  
  -- Extract payment date
  v_payment_date := DATE(payment_record.completed_at);
  
  -- Get stadium owner
  IF payment_record.stadium_id IS NOT NULL THEN
    SELECT owner_id INTO v_stadium_owner_id 
    FROM stadiums 
    WHERE id = payment_record.stadium_id;
    
    RAISE NOTICE '✅ Stadium owner found: %', v_stadium_owner_id;
    
    -- Extract net_amount from the current structure
    IF payment_record.amount_breakdown IS NOT NULL THEN
      v_stadium_net := COALESCE((payment_record.amount_breakdown->>'net_amount')::INTEGER, 0);
      
      RAISE NOTICE '💰 Net amount for stadium owner: %', v_stadium_net;
      
      -- Try to insert into pending_payouts_summary
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
          
        RAISE NOTICE '✅ SUCCESS! Record inserted/updated in pending_payouts_summary';
      ELSE
        IF v_stadium_owner_id IS NULL THEN
          RAISE NOTICE '❌ FAILED: Stadium has no owner_id';
        END IF;
        IF v_stadium_net <= 0 THEN
          RAISE NOTICE '❌ FAILED: Net amount is 0 or negative';
        END IF;
      END IF;
    ELSE
      RAISE NOTICE '❌ FAILED: amount_breakdown is NULL';
    END IF;
  ELSE
    RAISE NOTICE '❌ FAILED: payment.stadium_id is NULL';
  END IF;
  
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE '❌ ERROR: %', SQLERRM;
END $$;

-- Check if record was created
SELECT 
  'AFTER MANUAL INSERT' as check_type,
  COUNT(*) as total_records
FROM pending_payouts_summary;

-- Show the record if it exists
SELECT * FROM pending_payouts_summary ORDER BY created_at DESC LIMIT 1;
