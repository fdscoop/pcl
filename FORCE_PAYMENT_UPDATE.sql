-- =====================================================
-- MANUAL UPDATE FOR SPECIFIC PAYMENT
-- Force update the payment record with correct values
-- =====================================================

-- First, verify the payment exists and get the match info
SELECT 
  p.id as payment_id,
  p.razorpay_payment_id,
  p.match_id as current_match_id,
  p.stadium_id as current_stadium_id,
  p.club_id,
  c.club_name,
  'Payment record found' as status
FROM payments p
JOIN clubs c ON p.club_id = c.id
WHERE p.razorpay_payment_id = 'pay_S2oDaLyYAG2Eem';

-- Get the actual match that was created for this payment
-- (From your console logs: Match created: 3012a60b-31f5-4bd3-83b2-50667f5f91ed)
SELECT 
  m.id as match_id,
  m.stadium_id,
  m.match_date,
  m.status,
  s.stadium_name,
  'Match exists and ready to link' as status
FROM matches m
JOIN stadiums s ON m.stadium_id = s.id
WHERE m.id = '3012a60b-31f5-4bd3-83b2-50667f5f91ed';

-- =====================================================
-- FORCE UPDATE AS SERVICE ROLE (This will definitely work)
-- =====================================================

-- Update the payment record with the correct match_id and stadium_id
-- This bypasses all RLS policies since it's run as service_role
UPDATE payments 
SET 
  match_id = '3012a60b-31f5-4bd3-83b2-50667f5f91ed',
  stadium_id = '0f07a24c-c4ba-4c89-ae81-f0ed5ad61a8f',
  updated_at = NOW()
WHERE razorpay_payment_id = 'pay_S2oDaLyYAG2Eem'
RETURNING 
  id,
  razorpay_payment_id,
  match_id,
  stadium_id,
  club_id,
  updated_at,
  '🎉 FORCED UPDATE SUCCESS!' as result;

-- =====================================================
-- VERIFY IN CLUB PAYMENT HISTORY
-- =====================================================

-- After running the view fix and payment update, check the result
SELECT 
  payment_id,
  razorpay_payment_id,
  match_id,
  stadium_id,
  stadium_name,
  home_club_name,
  away_club_name,
  match_date,
  CASE 
    WHEN match_id IS NOT NULL AND stadium_id IS NOT NULL AND stadium_name IS NOT NULL THEN 
      '🎉 PERFECT! All data linked correctly'
    WHEN match_id IS NOT NULL AND stadium_id IS NOT NULL THEN 
      '✅ IDs linked, checking stadium name...'
    ELSE 
      '❌ Still missing data'
  END as final_status
FROM club_payment_history
WHERE razorpay_payment_id = 'pay_S2oDaLyYAG2Eem';

-- =====================================================
-- SUMMARY QUERY
-- =====================================================

-- Final verification showing before/after improvement
SELECT 
  'SUMMARY' as section,
  COUNT(*) as total_payments,
  COUNT(match_id) as payments_with_match,
  COUNT(stadium_id) as payments_with_stadium,
  COUNT(stadium_name) as payments_with_stadium_name,
  ROUND(COUNT(stadium_name) * 100.0 / COUNT(*), 2) as stadium_coverage_percent
FROM club_payment_history
WHERE payment_created >= '2026-01-11'  -- Recent payments
;