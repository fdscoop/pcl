-- =====================================================
-- FIX CLUB PAYMENT HISTORY VIEW
-- Update view to show stadium_id from payments table when available
-- =====================================================

-- Drop and recreate the view with improved stadium logic
DROP VIEW IF EXISTS club_payment_history;

CREATE OR REPLACE VIEW club_payment_history AS
SELECT 
  pay.id AS payment_id,
  pay.razorpay_order_id,
  pay.razorpay_payment_id,
  pay.amount AS total_amount,
  pay.status AS payment_status,
  pay.payment_method,
  pay.created_at AS payment_created,
  pay.completed_at AS payment_completed,
  pay.refund_status,
  pay.refunded_amount,
  pay.refund_reason,
  c.id AS club_id,
  c.club_name AS club_name,
  m.id AS match_id,
  m.match_date,
  hc.club_name AS home_club_name,
  ac.club_name AS away_club_name,
  m.status AS match_status,
  
  -- ✅ IMPROVED: Use stadium_id from payments table first, then fallback to match.stadium_id
  COALESCE(pay.stadium_id, m.stadium_id) AS stadium_id,
  COALESCE(ps.stadium_name, ms.stadium_name) AS stadium_name,
  
  pay.amount_breakdown
FROM payments pay
JOIN clubs c ON pay.club_id = c.id
LEFT JOIN matches m ON pay.match_id = m.id
LEFT JOIN teams ht ON m.home_team_id = ht.id
LEFT JOIN teams at ON m.away_team_id = at.id
LEFT JOIN clubs hc ON ht.club_id = hc.id
LEFT JOIN clubs ac ON at.club_id = ac.id

-- ✅ JOIN stadiums table TWICE: once for payment.stadium_id, once for match.stadium_id
LEFT JOIN stadiums ps ON pay.stadium_id = ps.id  -- Payment's stadium
LEFT JOIN stadiums ms ON m.stadium_id = ms.id    -- Match's stadium

ORDER BY pay.created_at DESC;

-- Add comment explaining the improved logic
COMMENT ON VIEW club_payment_history IS 'Club dashboard view with complete payment history. Uses stadium_id from payments table when available, falls back to match.stadium_id for legacy records.';

-- =====================================================
-- TEST THE IMPROVED VIEW
-- =====================================================

-- Check if the latest payment now shows stadium info
SELECT 
  payment_id,
  razorpay_payment_id,
  match_id,
  stadium_id,
  stadium_name,
  CASE 
    WHEN stadium_id IS NOT NULL AND stadium_name IS NOT NULL THEN '✅ Stadium info available'
    WHEN stadium_id IS NOT NULL AND stadium_name IS NULL THEN '⚠️ Stadium ID exists but name missing'
    ELSE '❌ No stadium info'
  END as stadium_status
FROM club_payment_history
WHERE razorpay_payment_id = 'pay_S2oDaLyYAG2Eem'
LIMIT 1;

-- =====================================================
-- VERIFY ALL RECENT PAYMENTS
-- =====================================================

-- Check the last 5 payments to see improvement
SELECT 
  razorpay_payment_id,
  match_id,
  stadium_id,
  stadium_name,
  payment_created,
  CASE 
    WHEN stadium_name IS NOT NULL THEN '✅ Has stadium'
    ELSE '❌ Missing stadium'
  END as stadium_status
FROM club_payment_history
ORDER BY payment_created DESC
LIMIT 5;

-- Expected: Should show stadium info for payments that have stadium_id set