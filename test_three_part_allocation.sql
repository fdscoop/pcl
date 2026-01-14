-- Test script for three-part fee allocation
-- This tests the trigger with a realistic payment scenario

-- Setup: Get a real match with stadium, referees, and staff
WITH test_data AS (
  SELECT 
    m.id as match_id,
    m.stadium_id,
    m.referee_ids,
    m.staff_ids,
    s.owner_id as stadium_owner_id
  FROM matches m
  LEFT JOIN stadiums s ON m.stadium_id = s.id
  WHERE m.referee_ids IS NOT NULL
  AND m.referee_ids != '{}' 
  AND m.staff_ids IS NOT NULL
  AND m.staff_ids != '{}'
  LIMIT 1
)
-- Insert test payment and trigger allocation
INSERT INTO payments (
  amount,
  currency,
  status,
  payment_gateway,
  club_id,
  paid_by,
  match_id,
  stadium_id,
  receipt,
  amount_breakdown,
  completed_at
)
SELECT
  43800 as amount,  -- ₹438
  'INR' as currency,
  'completed' as status,
  'razorpay' as payment_gateway,
  (SELECT club_id FROM test_data LIMIT 1),
  (SELECT owner_id FROM users WHERE user_type = 'club_owner' LIMIT 1) as paid_by,
  (SELECT match_id FROM test_data),
  (SELECT stadium_id FROM test_data),
  'TEST_' || now()::text as receipt,
  jsonb_build_object(
    'total_amount', 43800,
    'platform_commission', 4380,
    'payment_gateway_fee', 876,
    'net_amount', 38544,
    'currency', 'INR'
  ) as amount_breakdown,
  NOW() as completed_at
FROM test_data
RETURNING id, match_id, stadium_id, amount_breakdown;

-- After trigger executes, check the results
SELECT 
  'STADIUM OWNER' as recipient_type,
  user_id,
  user_role,
  total_pending_amount,
  total_pending_count
FROM pending_payouts_summary
WHERE user_role = 'stadium_owner'
AND payout_period_start >= CURRENT_DATE - INTERVAL '1 day'
UNION ALL
SELECT 
  'REFEREES' as recipient_type,
  user_id,
  user_role,
  total_pending_amount,
  total_pending_count
FROM pending_payouts_summary
WHERE user_role = 'referee'
AND payout_period_start >= CURRENT_DATE - INTERVAL '1 day'
UNION ALL
SELECT 
  'STAFF' as recipient_type,
  user_id,
  user_role,
  total_pending_amount,
  total_pending_count
FROM pending_payouts_summary
WHERE user_role = 'staff'
AND payout_period_start >= CURRENT_DATE - INTERVAL '1 day'
ORDER BY recipient_type, user_id;

-- Verify allocation math
-- Net amount: ₹38,544 (38544 paise)
-- Stadium (60%): ₹23,126.40 (23126 paise)
-- Referees (25%): ₹9,636 (9636 paise) - split equally
-- Staff (15%): ₹5,781.60 (5781 paise) - split equally
SELECT
  'Expected Allocation Summary' as verification,
  jsonb_build_object(
    'net_amount', 38544,
    'stadium_60_percent', FLOOR(38544 * 0.60),
    'referees_25_percent', FLOOR(38544 * 0.25),
    'staff_15_percent', FLOOR(38544 * 0.15),
    'total_allocated', FLOOR(38544 * 0.60) + FLOOR(38544 * 0.25) + FLOOR(38544 * 0.15)
  ) as breakdown;
