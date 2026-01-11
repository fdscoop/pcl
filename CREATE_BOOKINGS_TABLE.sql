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
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_booking_confirmed_at
  BEFORE UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION set_booking_confirmed_at();

-- Auto-set completed_at when status changes to completed
CREATE OR REPLACE FUNCTION set_booking_completed_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    NEW.completed_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_booking_completed_at
  BEFORE UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION set_booking_completed_at();

-- Comments
COMMENT ON TABLE bookings IS 'Individual booking records for stadiums, referees, and staff linked to payments';
COMMENT ON COLUMN bookings.booking_type IS 'Type of booking: stadium, referee, or staff';
COMMENT ON COLUMN bookings.resource_id IS 'ID of the resource being booked (stadium_id or user_id)';
COMMENT ON COLUMN bookings.amount IS 'Gross booking amount in paise before commission';
COMMENT ON COLUMN bookings.commission IS 'PCL commission amount in paise';
COMMENT ON COLUMN bookings.net_payout IS 'Net amount to pay out to service provider in paise';
COMMENT ON COLUMN bookings.booking_details IS 'JSONB field for role-specific booking metadata';
