# Apply Database Migrations - Step by Step Guide

> ⚠️ **Important:** Apply these migrations in the exact order listed below. Each migration depends on the previous ones.

## Quick Start

1. Go to Supabase SQL Editor: https://supabase.com/dashboard/project/uvifkmkdoiohqrdbwgzt/sql/new
2. Copy-paste each SQL file below in order
3. Click **"Run"** and wait for success message
4. Move to the next migration

---

## Migration 1️⃣: CREATE_PAYMENTS_TABLE.sql

This creates the main payments table that stores all Razorpay transactions.

```sql
-- =====================================================
-- CREATE PAYMENTS TABLE
-- Main table for tracking all Razorpay transactions
-- =====================================================

CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Razorpay Details
  razorpay_order_id TEXT NOT NULL UNIQUE,
  razorpay_payment_id TEXT UNIQUE,
  razorpay_signature TEXT,
  
  -- Payment Info
  amount INTEGER NOT NULL, -- Total amount in paise (₹1 = 100 paise)
  currency TEXT DEFAULT 'INR',
  status TEXT NOT NULL DEFAULT 'created', 
  -- Status values: 'created', 'processing', 'completed', 'failed', 'refunded'
  
  -- Payer Details
  club_id UUID REFERENCES clubs(id) ON DELETE SET NULL,
  paid_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Match Reference
  match_id UUID REFERENCES matches(id) ON DELETE SET NULL,
  
  -- Amount Breakdown (JSONB for flexibility)
  -- Example: {"stadium": 500000, "stadium_commission": 50000, "referee": 200000, "referee_commission": 20000, "staff": 100000, "staff_commission": 10000, "total_commission": 80000}
  amount_breakdown JSONB,
  
  -- Metadata
  receipt TEXT,
  notes JSONB,
  payment_method TEXT, -- 'upi', 'card', 'netbanking', 'wallet', etc.
  
  -- Refund Tracking
  refund_status TEXT, -- null, 'partial', 'full'
  refunded_amount INTEGER DEFAULT 0,
  refund_reason TEXT,
  refund_initiated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  refunded_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Webhook Tracking
  webhook_received BOOLEAN DEFAULT FALSE,
  webhook_data JSONB,
  webhook_received_at TIMESTAMPTZ,
  
  CONSTRAINT valid_status CHECK (status IN ('created', 'processing', 'completed', 'failed', 'refunded')),
  CONSTRAINT valid_refund_status CHECK (refund_status IS NULL OR refund_status IN ('partial', 'full')),
  CONSTRAINT positive_amount CHECK (amount > 0),
  CONSTRAINT valid_refund_amount CHECK (refunded_amount >= 0 AND refunded_amount <= amount)
);

-- Indexes for Performance
CREATE INDEX idx_payments_match_id ON payments(match_id);
CREATE INDEX idx_payments_club_id ON payments(club_id);
CREATE INDEX idx_payments_paid_by ON payments(paid_by);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_razorpay_order ON payments(razorpay_order_id);
CREATE INDEX idx_payments_razorpay_payment ON payments(razorpay_payment_id) WHERE razorpay_payment_id IS NOT NULL;
CREATE INDEX idx_payments_created_at ON payments(created_at DESC);

-- Updated at trigger
CREATE OR REPLACE FUNCTION update_payments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_payments_updated_at
  BEFORE UPDATE ON payments
  FOR EACH ROW
  EXECUTE FUNCTION update_payments_updated_at();

-- Comments
COMMENT ON TABLE payments IS 'Main payments table tracking all Razorpay transactions';
COMMENT ON COLUMN payments.amount IS 'Total payment amount in paise (₹1 = 100 paise)';
COMMENT ON COLUMN payments.amount_breakdown IS 'JSONB breakdown of payment allocation: stadium fee, referee fee, staff fee, and commissions';
COMMENT ON COLUMN payments.webhook_data IS 'Raw webhook payload from Razorpay for audit trail';
```

✅ **Expected Result:** Table `payments` created successfully

---

## Migration 2️⃣: CREATE_BOOKINGS_TABLE.sql

This creates the bookings table that stores individual booking records for stadium, referee, and staff.

```sql
-- =====================================================
-- CREATE BOOKINGS TABLE
-- Individual booking records for stadium, referee, staff
-- =====================================================

CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Core References
  payment_id UUID NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
  match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  
  -- Booking Type & Target Resource
  booking_type TEXT NOT NULL,
  -- Values: 'stadium', 'referee', 'staff'
  
  resource_id UUID NOT NULL,
  -- For stadium: references stadiums(id)
  -- For referee: references auth.users(id) where role = 'referee'
  -- For staff: references auth.users(id) where role = 'staff'
  
  -- Financial Details (all amounts in paise)
  amount INTEGER NOT NULL, -- Gross amount allocated for this booking
  commission INTEGER DEFAULT 0, -- PCL commission for this booking
  net_payout INTEGER NOT NULL, -- Net amount to be paid out (amount - commission)
  
  -- Booking Status
  status TEXT NOT NULL DEFAULT 'pending',
  -- Values: 'pending', 'confirmed', 'active', 'completed', 'cancelled'
  
  -- Payout Tracking
  payout_status TEXT DEFAULT 'pending',
  -- Values: 'pending', 'processing', 'completed', 'failed'
  
  payout_id UUID REFERENCES payouts(id) ON DELETE SET NULL,
  payout_date TIMESTAMPTZ,
  
  -- Cancellation & Refund
  cancellation_reason TEXT,
  cancelled_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  cancelled_at TIMESTAMPTZ,
  refund_processed BOOLEAN DEFAULT FALSE,
  refund_amount INTEGER DEFAULT 0,
  
  -- Metadata
  booking_details JSONB,
  -- Can store role-specific details like:
  -- For referee: {"position": "main", "experience_level": "certified"}
  -- For staff: {"role": "assistant", "duties": ["scorekeeping"]}
  -- For stadium: {"facilities": ["lighting", "parking"]}
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  confirmed_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  
  -- Constraints
  CONSTRAINT valid_booking_type CHECK (booking_type IN ('stadium', 'referee', 'staff')),
  CONSTRAINT valid_status CHECK (status IN ('pending', 'confirmed', 'active', 'completed', 'cancelled')),
  CONSTRAINT valid_payout_status CHECK (payout_status IN ('pending', 'processing', 'completed', 'failed')),
  CONSTRAINT positive_amount CHECK (amount > 0),
  CONSTRAINT non_negative_commission CHECK (commission >= 0),
  CONSTRAINT valid_net_payout CHECK (net_payout >= 0),
  CONSTRAINT commission_not_exceed_amount CHECK (commission <= amount),
  CONSTRAINT valid_refund_amount CHECK (refund_amount >= 0 AND refund_amount <= amount)
);

-- Indexes for Performance
CREATE INDEX idx_bookings_payment_id ON bookings(payment_id);
CREATE INDEX idx_bookings_match_id ON bookings(match_id);
CREATE INDEX idx_bookings_resource_id ON bookings(resource_id);
CREATE INDEX idx_bookings_booking_type ON bookings(booking_type);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_payout_status ON bookings(payout_status);
CREATE INDEX idx_bookings_payout_id ON bookings(payout_id) WHERE payout_id IS NOT NULL;
CREATE INDEX idx_bookings_created_at ON bookings(created_at DESC);

-- Composite indexes for common queries
CREATE INDEX idx_bookings_type_status ON bookings(booking_type, status);
CREATE INDEX idx_bookings_type_payout ON bookings(booking_type, payout_status);
CREATE INDEX idx_bookings_resource_status ON bookings(resource_id, status);

-- Updated at trigger
CREATE OR REPLACE FUNCTION update_bookings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_bookings_updated_at
  BEFORE UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_bookings_updated_at();

-- Auto-set confirmed_at when status changes to confirmed
CREATE OR REPLACE FUNCTION set_booking_confirmed_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'confirmed' AND OLD.status != 'confirmed' THEN
    NEW.confirmed_at = NOW();
  END IF;
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    NEW.completed_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_booking_confirmed_at
  BEFORE UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION set_booking_confirmed_at();

COMMENT ON TABLE bookings IS 'Individual booking records for stadium, referee, and staff linked to payments';
COMMENT ON COLUMN bookings.booking_type IS 'Type of booking: stadium, referee, or staff';
COMMENT ON COLUMN bookings.amount IS 'Gross amount in paise allocated to this booking';
COMMENT ON COLUMN bookings.commission IS 'PCL commission (10% of amount)';
COMMENT ON COLUMN bookings.net_payout IS 'Net payout amount = amount - commission';
```

✅ **Expected Result:** Table `bookings` created successfully

---

## Migration 3️⃣: CREATE_PAYOUTS_TABLE.sql

This creates the payouts table for batch payouts to stadium owners, referees, and staff.

```sql
-- =====================================================
-- CREATE PAYOUTS TABLE
-- Track payouts to stadium owners, referees, and staff
-- =====================================================

CREATE TABLE IF NOT EXISTS payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Recipient Details
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_role TEXT NOT NULL,
  -- Values: 'stadium_owner', 'referee', 'staff'
  
  -- Payout Financial Details (in paise)
  amount INTEGER NOT NULL, -- Total payout amount
  currency TEXT DEFAULT 'INR',
  
  -- Payout Status
  status TEXT NOT NULL DEFAULT 'pending',
  -- Values: 'pending', 'processing', 'completed', 'failed', 'cancelled'
  
  -- Razorpay Payout Details (if using Razorpay Payouts API)
  razorpay_payout_id TEXT UNIQUE,
  razorpay_fund_account_id TEXT,
  razorpay_transfer_id TEXT,
  
  -- Bank Details (snapshot from user's KYC at time of payout)
  bank_account_number TEXT,
  ifsc_code TEXT,
  account_holder_name TEXT,
  bank_name TEXT,
  
  -- Payout Period (for batch payouts)
  payout_period_start DATE,
  payout_period_end DATE,
  
  -- Booking References (JSONB array of booking IDs included in this payout)
  booking_ids JSONB NOT NULL,
  -- Example: ["uuid1", "uuid2", "uuid3"]
  
  booking_count INTEGER DEFAULT 0, -- Number of bookings in this payout
  
  -- Match References (for quick lookup)
  match_ids JSONB,
  -- Example: ["match_uuid1", "match_uuid2"]
  
  -- Error Tracking
  failure_reason TEXT,
  failure_code TEXT,
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  
  -- Processing Details
  processed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  -- Admin who initiated/approved the payout
  
  processing_method TEXT,
  -- Values: 'razorpay_auto', 'razorpay_manual', 'bank_transfer', 'manual'
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  initiated_at TIMESTAMPTZ,
  processed_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  failed_at TIMESTAMPTZ,
  
  -- Notes
  notes TEXT,
  admin_notes TEXT,
  internal_reference TEXT, -- For accounting/reconciliation
  
  -- Constraints
  CONSTRAINT valid_user_role CHECK (user_role IN ('stadium_owner', 'referee', 'staff')),
  CONSTRAINT valid_payout_status CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
  CONSTRAINT positive_amount CHECK (amount > 0),
  CONSTRAINT valid_retry_count CHECK (retry_count >= 0 AND retry_count <= max_retries),
  CONSTRAINT valid_processing_method CHECK (processing_method IS NULL OR processing_method IN ('razorpay_auto', 'razorpay_manual', 'bank_transfer', 'manual'))
);

-- Indexes for Performance
CREATE INDEX idx_payouts_user_id ON payouts(user_id);
CREATE INDEX idx_payouts_user_role ON payouts(user_role);
CREATE INDEX idx_payouts_status ON payouts(status);
CREATE INDEX idx_payouts_razorpay_id ON payouts(razorpay_payout_id) WHERE razorpay_payout_id IS NOT NULL;
CREATE INDEX idx_payouts_period ON payouts(payout_period_start, payout_period_end);
CREATE INDEX idx_payouts_created_at ON payouts(created_at DESC);
CREATE INDEX idx_payouts_completed_at ON payouts(completed_at DESC) WHERE completed_at IS NOT NULL;

-- Composite indexes
CREATE INDEX idx_payouts_user_status ON payouts(user_id, status);
CREATE INDEX idx_payouts_role_status ON payouts(user_role, status);

-- Updated at trigger
CREATE OR REPLACE FUNCTION update_payouts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_payouts_updated_at
  BEFORE UPDATE ON payouts
  FOR EACH ROW
  EXECUTE FUNCTION update_payouts_updated_at();

COMMENT ON TABLE payouts IS 'Payout records to stadium owners, referees, and staff';
COMMENT ON COLUMN payouts.booking_ids IS 'JSONB array of booking IDs included in this payout batch';
COMMENT ON COLUMN payouts.amount IS 'Total payout amount in paise';
```

✅ **Expected Result:** Table `payouts` created successfully

---

## Migration 4️⃣: ADD_PAYMENT_FIELDS_TO_MATCHES.sql

This adds payment tracking fields to the existing matches table.

```sql
-- =====================================================
-- ADD PAYMENT FIELDS TO MATCHES TABLE
-- Link matches with payment records
-- =====================================================

-- Add payment tracking columns to matches
ALTER TABLE matches 
  ADD COLUMN IF NOT EXISTS payment_id UUID REFERENCES payments(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS total_cost INTEGER,
  ADD COLUMN IF NOT EXISTS cost_breakdown JSONB;

-- Add constraints
ALTER TABLE matches
  ADD CONSTRAINT valid_payment_status CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded', 'partially_refunded'));

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_matches_payment_id ON matches(payment_id);
CREATE INDEX IF NOT EXISTS idx_matches_payment_status ON matches(payment_status);

-- Comments
COMMENT ON COLUMN matches.payment_id IS 'Reference to the payment record for this match';
COMMENT ON COLUMN matches.payment_status IS 'Payment status: pending, paid, failed, refunded, partially_refunded';
COMMENT ON COLUMN matches.total_cost IS 'Total cost in paise (stadium + referee + staff + commission)';
COMMENT ON COLUMN matches.cost_breakdown IS 'JSONB breakdown: {"stadium": 500000, "referee": 200000, "staff": 100000, "commission": 80000, "total": 880000}';

-- Function to update match payment status when payment completes
CREATE OR REPLACE FUNCTION update_match_payment_status()
RETURNS TRIGGER AS $$
BEGIN
  -- When payment status changes to completed, update match
  IF NEW.status = 'completed' AND OLD.status != 'completed' AND NEW.match_id IS NOT NULL THEN
    UPDATE matches
    SET payment_status = 'paid'
    WHERE id = NEW.match_id;
  END IF;
  
  -- When payment status changes to refunded, update match
  IF NEW.status = 'refunded' AND OLD.status != 'refunded' AND NEW.match_id IS NOT NULL THEN
    UPDATE matches
    SET payment_status = CASE 
      WHEN NEW.refunded_amount = NEW.amount THEN 'refunded'
      ELSE 'partially_refunded'
    END
    WHERE id = NEW.match_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_match_payment_status
  AFTER UPDATE ON payments
  FOR EACH ROW
  EXECUTE FUNCTION update_match_payment_status();
```

✅ **Expected Result:** Columns added to `matches` table successfully

---

## Migration 5️⃣: CREATE_PAYMENT_VIEWS.sql

This creates dashboard views for stadium owners, referees, staff, and admins.

```sql
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
  AND m.match_date < CURRENT_DATE - INTERVAL '7 days'
GROUP BY b.resource_id, b.booking_type, u.email
HAVING SUM(b.net_payout) > 0
ORDER BY total_pending_payout DESC;

COMMENT ON VIEW pending_payouts_summary IS 'Summary of pending payouts ready to be processed (after cooling period)';
```

✅ **Expected Result:** 6 views created:
- `stadium_owner_bookings`
- `referee_bookings`
- `staff_bookings`
- `admin_financial_overview`
- `club_payment_history`
- `pending_payouts_summary`

---

## Migration 6️⃣: ADD_PAYMENT_RLS_POLICIES.sql

This adds row-level security policies for data protection.

```sql
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
```

✅ **Expected Result:** RLS policies enabled and configured for security

---

## Verification

After applying all migrations, verify in Supabase SQL Editor:

```sql
-- Check tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('payments', 'bookings', 'payouts');

-- Check views exist
SELECT viewname FROM pg_views 
WHERE schemaname = 'public' 
AND viewname LIKE '%booking%' OR viewname LIKE '%payout%';
```

---

## What's Next?

After migrations are applied:

1. ✅ **Webhook Configuration**: Already done (Razorpay webhook created, secret added to Vercel)
2. ✅ **Razorpay Integration**: Already done (payment system working)
3. 🔄 **Test End-to-End**: Create a test match and complete payment to verify bookings are created
4. 🔄 **Build Dashboards**: Use the views to create dashboard components for each user role

---

## Troubleshooting

If you get errors:

1. **"relation 'payments' does not exist"** - Make sure you ran Migration 1 first
2. **"Foreign key constraint violation"** - Ensure migrations are applied in order
3. **"Function already exists"** - Use `CREATE OR REPLACE` which is already in the SQL

If stuck, reach out with the error message!
