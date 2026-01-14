-- ====================================================================
-- DIRECT DATA INSPECTION - See exactly what's in the payments table
-- ====================================================================

-- 1. Show ALL completed payments with ALL their data
SELECT 
  'PAYMENTS' as source,
  id,
  razorpay_payment_id,
  match_id,
  stadium_id,
  status,
  amount_breakdown,
  completed_at
FROM payments 
WHERE status = 'completed'
ORDER BY completed_at DESC;

-- 2. Check if ANY stadiums have owner_id set
SELECT 
  'STADIUMS' as source,
  id,
  stadium_name,
  owner_id,
  CASE WHEN owner_id IS NULL THEN '❌ NO OWNER' ELSE '✅ HAS OWNER' END as owner_status
FROM stadiums
ORDER BY created_at DESC
LIMIT 10;

-- 3. Cross-check: payments with their stadiums
SELECT 
  'PAYMENT+STADIUM' as source,
  p.razorpay_payment_id,
  p.stadium_id,
  s.stadium_name,
  s.owner_id,
  p.amount_breakdown
FROM payments p
LEFT JOIN stadiums s ON p.stadium_id = s.id
WHERE p.status = 'completed'
ORDER BY p.completed_at DESC;

-- 4. Check the exact structure of amount_breakdown
SELECT 
  'AMOUNT_BREAKDOWN' as source,
  razorpay_payment_id,
  jsonb_pretty(amount_breakdown) as breakdown_pretty,
  amount_breakdown->>'stadium' as stadium_key,
  amount_breakdown->>'stadium_commission' as stadium_commission_key
FROM payments 
WHERE status = 'completed' AND amount_breakdown IS NOT NULL
ORDER BY completed_at DESC
LIMIT 1;
