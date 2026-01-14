-- Check the most recent payment status
-- Run this in Supabase SQL Editor to see if webhook processed the payment

SELECT 
  id,
  razorpay_payment_id,
  razorpay_order_id,
  status,
  amount,
  match_id,
  stadium_id,
  amount_breakdown,
  completed_at,
  created_at
FROM payments
WHERE razorpay_payment_id = 'pay_S3tT8LcabjLngu'
OR razorpay_order_id = 'order_S3tSutMDBN7C0t'
OR created_at >= NOW() - INTERVAL '10 minutes'
ORDER BY created_at DESC
LIMIT 5;

-- Check if pending_payouts_summary was populated
SELECT 
  'PENDING PAYOUTS' as table_name,
  user_id,
  user_role,
  total_pending_amount,
  total_pending_count,
  payout_period_start,
  last_updated
FROM pending_payouts_summary
WHERE last_updated >= NOW() - INTERVAL '10 minutes'
ORDER BY last_updated DESC;

-- Check if match was created
SELECT 
  'MATCHES' as table_name,
  id,
  home_team_id,
  stadium_id,
  status,
  created_at
FROM matches
WHERE created_at >= NOW() - INTERVAL '10 minutes'
ORDER BY created_at DESC
LIMIT 3;
