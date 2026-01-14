-- Debug script to check why pending_payouts_summary isn't populating

-- 1. Check if trigger exists and is enabled
SELECT 
  tgname as trigger_name,
  tgenabled as enabled,
  tgtype as trigger_type
FROM pg_trigger 
WHERE tgname = 'trigger_create_pending_payout_summaries';

-- 2. Check recent completed payments
SELECT 
  id,
  razorpay_payment_id,
  match_id,
  stadium_id,
  status,
  amount_breakdown,
  completed_at
FROM payments 
WHERE status = 'completed'
ORDER BY completed_at DESC
LIMIT 3;

-- 3. Check if any records exist in pending_payouts_summary
SELECT COUNT(*) as total_records FROM pending_payouts_summary;

-- 4. Check the structure of amount_breakdown from a recent payment
SELECT 
  razorpay_payment_id,
  amount_breakdown,
  jsonb_pretty(amount_breakdown) as breakdown_formatted
FROM payments 
WHERE status = 'completed' 
  AND amount_breakdown IS NOT NULL
ORDER BY completed_at DESC
LIMIT 1;

-- 5. Test manual trigger execution on the last completed payment
-- This will show any errors
DO $$
DECLARE
  v_payment_record payments%ROWTYPE;
  v_result TEXT;
BEGIN
  -- Get the most recent completed payment
  SELECT * INTO v_payment_record
  FROM payments
  WHERE status = 'completed'
  ORDER BY completed_at DESC
  LIMIT 1;
  
  -- Try to manually simulate the trigger
  RAISE NOTICE 'Testing trigger logic for payment: %', v_payment_record.razorpay_payment_id;
  RAISE NOTICE 'Match ID: %', v_payment_record.match_id;
  RAISE NOTICE 'Stadium ID: %', v_payment_record.stadium_id;
  RAISE NOTICE 'Amount breakdown: %', v_payment_record.amount_breakdown;
  
  -- Check if match exists
  IF v_payment_record.match_id IS NOT NULL THEN
    RAISE NOTICE 'Match exists in database';
    
    -- Check if stadium owner exists
    PERFORM s.owner_id
    FROM matches m
    JOIN stadiums s ON m.stadium_id = s.id
    WHERE m.id = v_payment_record.match_id;
    
    IF FOUND THEN
      RAISE NOTICE 'Stadium owner found for match';
    ELSE
      RAISE NOTICE 'WARNING: No stadium owner found for match';
    END IF;
  ELSE
    RAISE NOTICE 'WARNING: match_id is NULL';
  END IF;
  
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'ERROR: %', SQLERRM;
END $$;

-- 6. Check if there are any stadium owners
SELECT COUNT(*) as stadiums_with_owners
FROM stadiums
WHERE owner_id IS NOT NULL;

-- 7. Check match_assignments table for the most recent match
SELECT 
  m.id as match_id,
  ma.referee_id,
  ma.staff_id,
  r.user_id as referee_user_id,
  s.user_id as staff_user_id
FROM matches m
LEFT JOIN match_assignments ma ON m.id = ma.match_id
LEFT JOIN referees r ON ma.referee_id = r.id
LEFT JOIN staff s ON ma.staff_id = s.id
WHERE m.id IN (
  SELECT match_id FROM payments WHERE status = 'completed' ORDER BY completed_at DESC LIMIT 1
);
