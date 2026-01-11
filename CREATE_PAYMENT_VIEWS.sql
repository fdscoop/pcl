-- =====================================================
-- CREATE VIEWS FOR PAYMENT & BOOKING DASHBOARDS
-- Role-specific views for easy data access
-- =====================================================

-- ========================================
-- STADIUM OWNER VIEW
-- ========================================
CREATE OR REPLACE VIEW stadium_owner_bookings AS
SELECT 
  b.id AS booking_id,
  b.match_id,
  m.match_date,
  m.match_time,
  hc.club_name AS home_club_name,
  ac.club_name AS away_club_name,
  m.status AS match_status,
  s.id AS stadium_id,
  s.stadium_name AS stadium_name,
  s.owner_id AS stadium_owner_id,
  b.amount AS gross_amount,
  b.commission AS pcl_commission,
  b.net_payout AS net_earnings,
  b.status AS booking_status,
  b.payout_status,
  b.payout_date,
  b.created_at AS booking_date,
  b.confirmed_at,
  b.completed_at,
  p.id AS payout_id,
  pay.razorpay_payment_id,
  pay.payment_method,
  pay.completed_at AS payment_date,
  c.club_name AS paying_club_name,
  c.id AS paying_club_id
FROM bookings b
JOIN matches m ON b.match_id = m.id
JOIN stadiums s ON b.resource_id = s.id
LEFT JOIN teams ht ON m.home_team_id = ht.id
LEFT JOIN teams at ON m.away_team_id = at.id
LEFT JOIN clubs hc ON ht.club_id = hc.id
LEFT JOIN clubs ac ON at.club_id = ac.id
LEFT JOIN payouts p ON b.payout_id = p.id
LEFT JOIN payments pay ON b.payment_id = pay.id
LEFT JOIN clubs c ON pay.club_id = c.id
WHERE b.booking_type = 'stadium'
ORDER BY m.match_date DESC;

COMMENT ON VIEW stadium_owner_bookings IS 'Stadium owner dashboard view with bookings, earnings, and payout status';


-- ========================================
-- REFEREE VIEW
-- ========================================
CREATE OR REPLACE VIEW referee_bookings AS
SELECT 
  b.id AS booking_id,
  b.match_id,
  m.match_date,
  m.match_time,
  hc.club_name AS home_club_name,
  ac.club_name AS away_club_name,
  m.status AS match_status,
  s.stadium_name AS stadium_name,
  s.location AS stadium_location,
  b.resource_id AS referee_user_id,
  u.email AS referee_email,
  b.amount AS gross_fee,
  b.commission AS pcl_commission,
  b.net_payout AS net_earnings,
  b.status AS booking_status,
  b.payout_status,
  b.payout_date,
  b.booking_details,
  b.created_at AS booking_date,
  b.confirmed_at,
  b.completed_at,
  p.id AS payout_id,
  pay.razorpay_payment_id,
  pay.completed_at AS payment_date,
  c.club_name AS paying_club_name
FROM bookings b
JOIN matches m ON b.match_id = m.id
JOIN stadiums s ON m.stadium_id = s.id
LEFT JOIN teams ht ON m.home_team_id = ht.id
LEFT JOIN teams at ON m.away_team_id = at.id
LEFT JOIN clubs hc ON ht.club_id = hc.id
LEFT JOIN clubs ac ON at.club_id = ac.id
LEFT JOIN auth.users u ON b.resource_id = u.id
LEFT JOIN payouts p ON b.payout_id = p.id
LEFT JOIN payments pay ON b.payment_id = pay.id
LEFT JOIN clubs c ON pay.club_id = c.id
WHERE b.booking_type = 'referee'
ORDER BY m.match_date DESC;

COMMENT ON VIEW referee_bookings IS 'Referee dashboard view with match assignments, fees, and payout status';


-- ========================================
-- STAFF VIEW
-- ========================================
CREATE OR REPLACE VIEW staff_bookings AS
SELECT 
  b.id AS booking_id,
  b.match_id,
  m.match_date,
  m.match_time,
  hc.club_name AS home_club_name,
  ac.club_name AS away_club_name,
  m.status AS match_status,
  s.stadium_name AS stadium_name,
  s.location AS stadium_location,
  b.resource_id AS staff_user_id,
  u.email AS staff_email,
  b.amount AS gross_fee,
  b.commission AS pcl_commission,
  b.net_payout AS net_earnings,
  b.status AS booking_status,
  b.payout_status,
  b.payout_date,
  b.booking_details,
  b.created_at AS booking_date,
  b.confirmed_at,
  b.completed_at,
  p.id AS payout_id,
  pay.razorpay_payment_id,
  pay.completed_at AS payment_date,
  c.club_name AS paying_club_name
FROM bookings b
JOIN matches m ON b.match_id = m.id
JOIN stadiums s ON m.stadium_id = s.id
LEFT JOIN teams ht ON m.home_team_id = ht.id
LEFT JOIN teams at ON m.away_team_id = at.id
LEFT JOIN clubs hc ON ht.club_id = hc.id
LEFT JOIN clubs ac ON at.club_id = ac.id
LEFT JOIN auth.users u ON b.resource_id = u.id
LEFT JOIN payouts p ON b.payout_id = p.id
LEFT JOIN payments pay ON b.payment_id = pay.id
LEFT JOIN clubs c ON pay.club_id = c.id
WHERE b.booking_type = 'staff'
ORDER BY m.match_date DESC;

COMMENT ON VIEW staff_bookings IS 'Staff dashboard view with match assignments, fees, and payout status';


-- ========================================
-- ADMIN FINANCIAL OVERVIEW
-- ========================================
CREATE OR REPLACE VIEW admin_financial_overview AS
SELECT 
  m.match_date,
  COUNT(DISTINCT m.id) AS total_matches,
  COUNT(DISTINCT b.id) AS total_bookings,
  COUNT(DISTINCT CASE WHEN b.booking_type = 'stadium' THEN b.id END) AS stadium_bookings,
  COUNT(DISTINCT CASE WHEN b.booking_type = 'referee' THEN b.id END) AS referee_bookings,
  COUNT(DISTINCT CASE WHEN b.booking_type = 'staff' THEN b.id END) AS staff_bookings,
  
  -- Revenue
  SUM(pay.amount) AS total_revenue,
  SUM(b.amount) AS total_booking_value,
  SUM(b.commission) AS total_commission_earned,
  SUM(b.net_payout) AS total_payout_liability,
  
  -- Payout status
  SUM(CASE WHEN b.payout_status = 'completed' THEN b.net_payout ELSE 0 END) AS amount_paid_out,
  SUM(CASE WHEN b.payout_status = 'pending' THEN b.net_payout ELSE 0 END) AS pending_payouts,
  SUM(CASE WHEN b.payout_status = 'processing' THEN b.net_payout ELSE 0 END) AS processing_payouts,
  
  -- Payment status
  COUNT(DISTINCT CASE WHEN pay.status = 'completed' THEN pay.id END) AS completed_payments,
  COUNT(DISTINCT CASE WHEN pay.status = 'refunded' THEN pay.id END) AS refunded_payments,
  SUM(CASE WHEN pay.status = 'refunded' THEN pay.refunded_amount ELSE 0 END) AS total_refunds
  
FROM matches m
LEFT JOIN payments pay ON m.payment_id = pay.id
LEFT JOIN bookings b ON pay.id = b.payment_id
WHERE pay.status = 'completed' OR pay.status = 'refunded'
GROUP BY m.match_date
ORDER BY match_date DESC;

COMMENT ON VIEW admin_financial_overview IS 'Admin dashboard financial overview with daily aggregated metrics';


-- ========================================
-- CLUB PAYMENT HISTORY
-- ========================================
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
  s.stadium_name AS stadium_name,
  pay.amount_breakdown
FROM payments pay
JOIN clubs c ON pay.club_id = c.id
LEFT JOIN matches m ON pay.match_id = m.id
LEFT JOIN teams ht ON m.home_team_id = ht.id
LEFT JOIN teams at ON m.away_team_id = at.id
LEFT JOIN clubs hc ON ht.club_id = hc.id
LEFT JOIN clubs ac ON at.club_id = ac.id
LEFT JOIN stadiums s ON m.stadium_id = s.id
ORDER BY pay.created_at DESC;

COMMENT ON VIEW club_payment_history IS 'Club dashboard view with complete payment history';


-- ========================================
-- PENDING PAYOUTS SUMMARY
-- ========================================
CREATE OR REPLACE VIEW pending_payouts_summary AS
SELECT 
  b.resource_id AS user_id,
  b.booking_type,
  CASE b.booking_type
    WHEN 'stadium' THEN 'stadium_owner'
    WHEN 'referee' THEN 'referee'
    WHEN 'staff' THEN 'staff'
  END AS user_role,
  u.email,
  COUNT(b.id) AS pending_booking_count,
  SUM(b.net_payout) AS total_pending_payout,
  MIN(m.match_date) AS earliest_match_date,
  MAX(m.match_date) AS latest_match_date,
  ARRAY_AGG(b.id) AS booking_ids
FROM bookings b
JOIN auth.users u ON b.resource_id = u.id
JOIN matches m ON b.match_id = m.id
WHERE b.payout_status = 'pending'
  AND b.status = 'completed'
  AND m.status = 'completed'
  AND m.match_date < CURRENT_DATE - INTERVAL '7 days' -- Cooling period
GROUP BY b.resource_id, b.booking_type, u.email
HAVING SUM(b.net_payout) > 0
ORDER BY total_pending_payout DESC;

COMMENT ON VIEW pending_payouts_summary IS 'Summary of pending payouts ready to be processed (after cooling period)';
