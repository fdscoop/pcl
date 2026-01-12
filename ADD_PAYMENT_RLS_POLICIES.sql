-- =====================================================
-- ROW LEVEL SECURITY POLICIES
-- For payments, bookings, and payouts tables
-- =====================================================

-- Enable RLS
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE payouts ENABLE ROW LEVEL SECURITY;

-- ========================================
-- PAYMENTS POLICIES
-- ========================================

-- Admins can view all payments
CREATE POLICY "Admins can view all payments"
  ON payments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Club owners can view their own club's payments
CREATE POLICY "Club owners can view their club payments"
  ON payments FOR SELECT
  TO authenticated
  USING (
    club_id IN (
      SELECT id FROM clubs
      WHERE owner_id = auth.uid()
    )
    OR paid_by = auth.uid()
  );

-- Clubs can insert payments (for creating orders)
CREATE POLICY "Clubs can create payment records"
  ON payments FOR INSERT
  TO authenticated
  WITH CHECK (
    paid_by = auth.uid()
    AND club_id IN (
      SELECT id FROM clubs
      WHERE owner_id = auth.uid()
    )
  );

-- Service accounts can update payments (for webhooks)
CREATE POLICY "Service can update payments"
  ON payments FOR UPDATE
  TO service_role
  USING (true);

-- Admins can update payments
CREATE POLICY "Admins can update payments"
  ON payments FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Club owners can update their own payment records
CREATE POLICY "Club owners can update their payment records"
  ON payments FOR UPDATE
  TO authenticated
  USING (
    paid_by = auth.uid()
    AND club_id IN (
      SELECT id FROM clubs
      WHERE owner_id = auth.uid()
    )
  )
  WITH CHECK (
    paid_by = auth.uid()
    AND club_id IN (
      SELECT id FROM clubs
      WHERE owner_id = auth.uid()
    )
  );


-- ========================================
-- BOOKINGS POLICIES
-- ========================================

-- Admins can view all bookings
CREATE POLICY "Admins can view all bookings"
  ON bookings FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Stadium owners can view their stadium bookings
CREATE POLICY "Stadium owners can view their bookings"
  ON bookings FOR SELECT
  TO authenticated
  USING (
    booking_type = 'stadium'
    AND resource_id IN (
      SELECT id FROM stadiums
      WHERE owner_id = auth.uid()
    )
  );

-- Referees can view their bookings
CREATE POLICY "Referees can view their bookings"
  ON bookings FOR SELECT
  TO authenticated
  USING (
    booking_type = 'referee'
    AND resource_id = auth.uid()
  );

-- Staff can view their bookings
CREATE POLICY "Staff can view their bookings"
  ON bookings FOR SELECT
  TO authenticated
  USING (
    booking_type = 'staff'
    AND resource_id = auth.uid()
  );

-- Club owners can view bookings for their payments
CREATE POLICY "Club owners can view match bookings"
  ON bookings FOR SELECT
  TO authenticated
  USING (
    payment_id IN (
      SELECT id FROM payments
      WHERE club_id IN (
        SELECT id FROM clubs
        WHERE owner_id = auth.uid()
      )
    )
  );

-- Service role can insert bookings (via webhooks)
CREATE POLICY "Service can insert bookings"
  ON bookings FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Service role can update bookings
CREATE POLICY "Service can update bookings"
  ON bookings FOR UPDATE
  TO service_role
  USING (true);

-- Admins can update bookings
CREATE POLICY "Admins can update bookings"
  ON bookings FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );


-- ========================================
-- PAYOUTS POLICIES
-- ========================================

-- Admins can view all payouts
CREATE POLICY "Admins can view all payouts"
  ON payouts FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Users can view their own payouts
CREATE POLICY "Users can view their own payouts"
  ON payouts FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Admins can insert payouts
CREATE POLICY "Admins can create payouts"
  ON payouts FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Admins can update payouts
CREATE POLICY "Admins can update payouts"
  ON payouts FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Service role can update payouts (for automated processing)
CREATE POLICY "Service can update payouts"
  ON payouts FOR UPDATE
  TO service_role
  USING (true);


-- ========================================
-- GRANT PERMISSIONS
-- ========================================

-- Grant service role full access (for webhooks and automated tasks)
GRANT ALL ON payments TO service_role;
GRANT ALL ON bookings TO service_role;
GRANT ALL ON payouts TO service_role;

-- Grant authenticated users appropriate access
GRANT SELECT ON payments TO authenticated;
GRANT INSERT ON payments TO authenticated;
GRANT UPDATE ON payments TO authenticated;

GRANT SELECT ON bookings TO authenticated;
GRANT UPDATE ON bookings TO authenticated;

GRANT SELECT ON payouts TO authenticated;

-- Grant access to views
GRANT SELECT ON stadium_owner_bookings TO authenticated;
GRANT SELECT ON referee_bookings TO authenticated;
GRANT SELECT ON staff_bookings TO authenticated;
GRANT SELECT ON club_payment_history TO authenticated;
GRANT SELECT ON admin_financial_overview TO authenticated;
GRANT SELECT ON pending_payouts_summary TO authenticated;
