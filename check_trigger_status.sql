-- ====================================================================
-- COMPREHENSIVE TRIGGER DEBUG SCRIPT
-- Run this in Supabase SQL Editor to diagnose why pending_payouts_summary
-- is not being populated automatically
-- ====================================================================

-- 1. Check if trigger exists and is enabled
SELECT 
  'TRIGGER CHECK' as check_type,
  tgname as trigger_name,
  CASE tgenabled 
    WHEN 'O' THEN '✅ Enabled'
    WHEN 'D' THEN '❌ Disabled'
    ELSE '⚠️ Unknown: ' || tgenabled::text
  END as status
FROM pg_trigger 
WHERE tgname = 'trigger_create_pending_payout_summaries';

-- 2. Check if function exists (look for stadium_id in the code)
SELECT 
  'FUNCTION CHECK' as check_type,
  proname as function_name,
  CASE 
    WHEN pg_get_functiondef(oid) LIKE '%NEW.stadium_id%' THEN '✅ Has stadium_id fix'
    WHEN pg_get_functiondef(oid) LIKE '%m.stadium_id%' THEN '❌ OLD version (joins matches)'
    ELSE '⚠️ Unknown version'
  END as version_status
FROM pg_proc 
WHERE proname = 'create_pending_payout_summaries_from_payment';

-- 3. Check recent completed payments and their data
SELECT 
  'RECENT PAYMENTS' as check_type,
  p.razorpay_payment_id,
  p.match_id,
  p.stadium_id,
  CASE 
    WHEN p.stadium_id IS NULL THEN '❌ No stadium_id'
    ELSE '✅ Has stadium_id'
  END as stadium_check,
  CASE 
    WHEN p.amount_breakdown IS NULL THEN '❌ No amount_breakdown'
    WHEN p.amount_breakdown->>'stadium' IS NULL THEN '❌ No stadium key'
    ELSE '✅ Has stadium: ' || (p.amount_breakdown->>'stadium')::text
  END as breakdown_check,
  s.owner_id,
  CASE 
    WHEN s.owner_id IS NULL THEN '❌ Stadium has no owner'
    ELSE '✅ Owner: ' || s.owner_id::text
  END as owner_check,
  p.completed_at
FROM payments p
LEFT JOIN stadiums s ON p.stadium_id = s.id
WHERE p.status = 'completed'
ORDER BY p.completed_at DESC
LIMIT 3;

-- 4. Check if any records exist in pending_payouts_summary
SELECT 
  'SUMMARY TABLE' as check_type,
  COUNT(*) as total_records,
  CASE 
    WHEN COUNT(*) = 0 THEN '❌ Table is empty - trigger not firing'
    ELSE '✅ Has ' || COUNT(*)::text || ' records'
  END as status
FROM pending_payouts_summary;

-- 5. Show existing pending_payouts_summary records if any
SELECT 
  'SUMMARY RECORDS' as check_type,
  user_id,
  user_role,
  total_pending_amount / 100.0 as amount_inr,
  total_pending_count,
  payout_period_start,
  created_at
FROM pending_payouts_summary 
ORDER BY created_at DESC 
LIMIT 5;

-- 6. Manually test the trigger logic for debugging
DO $$
DECLARE
  v_test_payment_id UUID;
  v_stadium_id UUID;
  v_owner_id UUID;
  v_amount_breakdown JSONB;
  v_stadium_amount INTEGER;
  v_stadium_commission INTEGER;
  v_stadium_net INTEGER;
BEGIN
  -- Get the most recent completed payment
  SELECT id, stadium_id, amount_breakdown
  INTO v_test_payment_id, v_stadium_id, v_amount_breakdown
  FROM payments
  WHERE status = 'completed'
  ORDER BY completed_at DESC
  LIMIT 1;
  
  RAISE NOTICE '=== TRIGGER DEBUG ===';
  RAISE NOTICE 'Payment ID: %', v_test_payment_id;
  RAISE NOTICE 'Stadium ID: %', v_stadium_id;
  RAISE NOTICE 'Amount breakdown: %', v_amount_breakdown;
  
  -- Check if stadium owner exists
  IF v_stadium_id IS NOT NULL THEN
    SELECT owner_id INTO v_owner_id FROM stadiums WHERE id = v_stadium_id;
    RAISE NOTICE 'Stadium Owner ID: %', v_owner_id;
    
    IF v_owner_id IS NULL THEN
      RAISE NOTICE '❌ ERROR: Stadium has no owner_id!';
    END IF;
  ELSE
    RAISE NOTICE '❌ ERROR: Payment has no stadium_id!';
  END IF;
  
  -- Check amount_breakdown parsing
  IF v_amount_breakdown IS NOT NULL THEN
    v_stadium_amount := COALESCE((v_amount_breakdown->>'stadium')::INTEGER, 0);
    v_stadium_commission := COALESCE((v_amount_breakdown->>'stadium_commission')::INTEGER, 0);
    v_stadium_net := v_stadium_amount - v_stadium_commission;
    
    RAISE NOTICE 'Stadium amount: %', v_stadium_amount;
    RAISE NOTICE 'Stadium commission: %', v_stadium_commission;
    RAISE NOTICE 'Stadium net: %', v_stadium_net;
    
    IF v_stadium_net = 0 THEN
      RAISE NOTICE '❌ ERROR: Stadium net amount is 0!';
    END IF;
  ELSE
    RAISE NOTICE '❌ ERROR: amount_breakdown is NULL!';
  END IF;
  
END $$;
