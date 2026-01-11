# Payment & Booking Architecture for PCL

## Overview
Comprehensive payment, booking, and payout system for match creation workflow.

## Database Schema Design

### 1. Core Payment Table

```sql
-- Main payments table (Razorpay transactions)
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Razorpay Details
  razorpay_order_id TEXT NOT NULL UNIQUE,
  razorpay_payment_id TEXT UNIQUE,
  razorpay_signature TEXT,
  
  -- Payment Info
  amount INTEGER NOT NULL, -- Total amount in paise
  currency TEXT DEFAULT 'INR',
  status TEXT NOT NULL, -- 'created', 'processing', 'completed', 'failed', 'refunded'
  
  -- Payer Details
  club_id UUID REFERENCES clubs(id) ON DELETE SET NULL,
  paid_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Match Reference
  match_id UUID REFERENCES matches(id) ON DELETE SET NULL,
  
  -- Breakdown (stored as JSONB for flexibility)
  amount_breakdown JSONB, -- {stadium: 5000, referee: 2000, staff: 1000, commission: 500}
  
  -- Metadata
  receipt TEXT,
  notes JSONB,
  payment_method TEXT, -- 'upi', 'card', 'netbanking', etc.
  
  -- Refund tracking
  refund_status TEXT, -- null, 'partial', 'full'
  refunded_amount INTEGER DEFAULT 0,
  refund_reason TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  refunded_at TIMESTAMPTZ,
  
  -- Webhook tracking
  webhook_received BOOLEAN DEFAULT FALSE,
  webhook_data JSONB
);

CREATE INDEX idx_payments_match_id ON payments(match_id);
CREATE INDEX idx_payments_club_id ON payments(club_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_razorpay_order ON payments(razorpay_order_id);
```

### 2. Booking Records Table

```sql
-- Individual bookings linked to payments
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Core References
  payment_id UUID REFERENCES payments(id) ON DELETE CASCADE,
  match_id UUID REFERENCES matches(id) ON DELETE CASCADE,
  
  -- Booking Type & Target
  booking_type TEXT NOT NULL, -- 'stadium', 'referee', 'staff'
  resource_id UUID NOT NULL, -- stadium_id, referee_user_id, or staff_user_id
  
  -- Financial Details
  amount INTEGER NOT NULL, -- Amount allocated for this booking in paise
  commission INTEGER DEFAULT 0, -- PCL commission for this booking
  net_payout INTEGER, -- Amount to be paid out (amount - commission)
  
  -- Status
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'confirmed', 'cancelled', 'completed'
  
  -- Payout tracking
  payout_status TEXT DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
  payout_id UUID REFERENCES payouts(id) ON DELETE SET NULL,
  payout_date TIMESTAMPTZ,
  
  -- Cancellation & Refund
  cancellation_reason TEXT,
  cancelled_at TIMESTAMPTZ,
  refund_processed BOOLEAN DEFAULT FALSE,
  
  -- Metadata
  booking_details JSONB, -- Store role-specific details
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_bookings_payment_id ON bookings(payment_id);
CREATE INDEX idx_bookings_match_id ON bookings(match_id);
CREATE INDEX idx_bookings_resource_id ON bookings(resource_id);
CREATE INDEX idx_bookings_type ON bookings(booking_type);
CREATE INDEX idx_bookings_payout_status ON bookings(payout_status);
```

### 3. Payouts Table

```sql
-- Track payouts to service providers
CREATE TABLE payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Recipient
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  user_role TEXT NOT NULL, -- 'stadium_owner', 'referee', 'staff'
  
  -- Payout Details
  amount INTEGER NOT NULL, -- Total payout amount in paise
  currency TEXT DEFAULT 'INR',
  
  -- Status
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
  
  -- Razorpay Payout Details (if using Razorpay Payouts API)
  razorpay_payout_id TEXT UNIQUE,
  razorpay_fund_account_id TEXT,
  
  -- Bank Details (from user's KYC)
  bank_account_number TEXT,
  ifsc_code TEXT,
  account_holder_name TEXT,
  
  -- Period (for batch payouts)
  payout_period_start DATE,
  payout_period_end DATE,
  
  -- Booking References (JSONB array of booking IDs)
  booking_ids JSONB, -- ["uuid1", "uuid2", ...]
  
  -- Error tracking
  failure_reason TEXT,
  retry_count INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  
  -- Metadata
  notes TEXT,
  admin_notes TEXT
);

CREATE INDEX idx_payouts_user_id ON payouts(user_id);
CREATE INDEX idx_payouts_status ON payouts(status);
CREATE INDEX idx_payouts_period ON payouts(payout_period_start, payout_period_end);
```

### 4. Match Updates (Add Payment Reference)

```sql
-- Add payment tracking to matches table
ALTER TABLE matches 
  ADD COLUMN IF NOT EXISTS payment_id UUID REFERENCES payments(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending', -- 'pending', 'paid', 'refunded'
  ADD COLUMN IF NOT EXISTS total_cost INTEGER, -- Total match cost in paise
  ADD COLUMN IF NOT EXISTS cost_breakdown JSONB; -- Detailed breakdown

CREATE INDEX idx_matches_payment_id ON matches(payment_id);
CREATE INDEX idx_matches_payment_status ON matches(payment_status);
```

## Payment Flow Architecture

### Flow 1: Match Creation with Payment

```
1. Club creates match (6-step wizard)
2. Step 6: Payment calculation
   - Stadium fee: ₹5,000 (from stadium pricing)
   - Referee fee: ₹2,000 (from platform config)
   - Staff fee: ₹1,000 (from platform config)
   - PCL Commission: 10% = ₹800
   - Total: ₹8,800

3. Create Razorpay order via API
4. User completes payment
5. Webhook receives payment.captured event

6. Webhook Processing:
   a. Update payments table (status = 'completed')
   b. Create match record
   c. Create 3 booking records:
      - Stadium booking (amount: 5000, commission: 500, net: 4500)
      - Referee booking (amount: 2000, commission: 200, net: 1800)
      - Staff booking (amount: 1000, commission: 100, net: 900)
   d. Update match.payment_status = 'paid'
```

### Flow 2: Match Cancellation & Refunds

```
1. Match cancelled by club/admin
2. Calculate refund based on cancellation policy:
   - 24+ hours before: 90% refund
   - 12-24 hours: 50% refund
   - <12 hours: No refund

3. Process refund via Razorpay API
4. Update records:
   - payments.status = 'refunded'
   - payments.refunded_amount = calculated amount
   - bookings.status = 'cancelled'
   - bookings.refund_processed = true
   - match.payment_status = 'refunded'
```

### Flow 3: Payout Processing (Weekly/Monthly)

```
1. Admin triggers payout batch (or automated cron)
2. Query completed bookings without payouts:
   - Match completed (status = 'completed')
   - Booking payout_status = 'pending'
   - Payment status = 'completed'
   - Match date > 7 days ago (cooling period)

3. Group by user_id and user_role
4. Calculate total payout per user
5. Create payout records
6. Process via Razorpay Payouts API
7. Update booking.payout_status = 'completed'
8. Link booking.payout_id to payout record
```

## Webhook Implementation

### Required Webhooks

1. **payment.captured** - Payment successful
2. **payment.failed** - Payment failed
3. **refund.processed** - Refund completed
4. **payout.processed** - Payout to vendor completed (if using Razorpay Payouts)

### Webhook Endpoint

```typescript
// /api/webhooks/razorpay

import crypto from 'crypto'

export async function POST(request: Request) {
  const body = await request.text()
  const signature = request.headers.get('x-razorpay-signature')
  
  // Verify webhook signature
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET!)
    .update(body)
    .digest('hex')
  
  if (signature !== expectedSignature) {
    return Response.json({ error: 'Invalid signature' }, { status: 401 })
  }
  
  const event = JSON.parse(body)
  
  switch (event.event) {
    case 'payment.captured':
      await handlePaymentCaptured(event.payload.payment.entity)
      break
    case 'payment.failed':
      await handlePaymentFailed(event.payload.payment.entity)
      break
    case 'refund.processed':
      await handleRefundProcessed(event.payload.refund.entity)
      break
    default:
      console.log('Unhandled event:', event.event)
  }
  
  return Response.json({ status: 'ok' })
}

async function handlePaymentCaptured(payment: any) {
  const { id, order_id, amount, method } = payment
  
  // 1. Update payment record
  await supabase
    .from('payments')
    .update({
      razorpay_payment_id: id,
      status: 'completed',
      payment_method: method,
      completed_at: new Date().toISOString(),
      webhook_received: true,
      webhook_data: payment
    })
    .eq('razorpay_order_id', order_id)
  
  // 2. Get payment record to access match_id and breakdown
  const { data: paymentRecord } = await supabase
    .from('payments')
    .select('*, matches(*)')
    .eq('razorpay_order_id', order_id)
    .single()
  
  if (!paymentRecord) return
  
  // 3. Create booking records
  const breakdown = paymentRecord.amount_breakdown
  const bookings = []
  
  // Stadium booking
  if (breakdown.stadium) {
    bookings.push({
      payment_id: paymentRecord.id,
      match_id: paymentRecord.match_id,
      booking_type: 'stadium',
      resource_id: paymentRecord.matches.stadium_id,
      amount: breakdown.stadium,
      commission: breakdown.stadium_commission || 0,
      net_payout: breakdown.stadium - (breakdown.stadium_commission || 0),
      status: 'confirmed'
    })
  }
  
  // Referee booking(s)
  if (breakdown.referee && paymentRecord.matches.referee_id) {
    bookings.push({
      payment_id: paymentRecord.id,
      match_id: paymentRecord.match_id,
      booking_type: 'referee',
      resource_id: paymentRecord.matches.referee_id,
      amount: breakdown.referee,
      commission: breakdown.referee_commission || 0,
      net_payout: breakdown.referee - (breakdown.referee_commission || 0),
      status: 'confirmed'
    })
  }
  
  // Staff booking(s)
  if (breakdown.staff && paymentRecord.matches.staff_ids) {
    const staffIds = paymentRecord.matches.staff_ids
    const amountPerStaff = Math.floor(breakdown.staff / staffIds.length)
    
    staffIds.forEach((staffId: string) => {
      bookings.push({
        payment_id: paymentRecord.id,
        match_id: paymentRecord.match_id,
        booking_type: 'staff',
        resource_id: staffId,
        amount: amountPerStaff,
        commission: Math.floor((breakdown.staff_commission || 0) / staffIds.length),
        net_payout: amountPerStaff - Math.floor((breakdown.staff_commission || 0) / staffIds.length),
        status: 'confirmed'
      })
    })
  }
  
  // Insert bookings
  await supabase.from('bookings').insert(bookings)
  
  // 4. Update match payment status
  await supabase
    .from('matches')
    .update({ payment_status: 'paid' })
    .eq('id', paymentRecord.match_id)
}
```

## Dashboard Integrations

### Stadium Owner Dashboard

```sql
-- View: Stadium bookings and payouts
CREATE OR REPLACE VIEW stadium_owner_bookings AS
SELECT 
  b.id,
  b.match_id,
  m.date AS match_date,
  m.home_team_name,
  m.away_team_name,
  s.name AS stadium_name,
  b.amount,
  b.commission,
  b.net_payout,
  b.status,
  b.payout_status,
  p.completed_at AS payout_date,
  pay.razorpay_payment_id
FROM bookings b
JOIN matches m ON b.match_id = m.id
JOIN stadiums s ON b.resource_id = s.id
LEFT JOIN payouts p ON b.payout_id = p.id
LEFT JOIN payments pay ON b.payment_id = pay.id
WHERE b.booking_type = 'stadium'
ORDER BY m.date DESC;
```

### Referee Dashboard

```sql
-- View: Referee bookings and earnings
CREATE OR REPLACE VIEW referee_bookings AS
SELECT 
  b.id,
  b.match_id,
  m.date AS match_date,
  m.home_team_name,
  m.away_team_name,
  s.name AS stadium_name,
  b.amount AS referee_fee,
  b.commission,
  b.net_payout AS earnings,
  b.status,
  b.payout_status,
  p.completed_at AS payout_date
FROM bookings b
JOIN matches m ON b.match_id = m.id
JOIN stadiums s ON m.stadium_id = s.id
LEFT JOIN payouts p ON b.payout_id = p.id
WHERE b.booking_type = 'referee'
ORDER BY m.date DESC;
```

### Staff Dashboard

```sql
-- View: Staff bookings and earnings
CREATE OR REPLACE VIEW staff_bookings AS
SELECT 
  b.id,
  b.match_id,
  m.date AS match_date,
  m.home_team_name,
  m.away_team_name,
  s.name AS stadium_name,
  b.amount AS staff_fee,
  b.commission,
  b.net_payout AS earnings,
  b.status,
  b.payout_status,
  p.completed_at AS payout_date
FROM bookings b
JOIN matches m ON b.match_id = m.id
JOIN stadiums s ON m.stadium_id = s.id
LEFT JOIN payouts p ON b.payout_id = p.id
WHERE b.booking_type = 'staff'
ORDER BY m.date DESC;
```

### Admin Dashboard

```sql
-- View: All bookings with financials
CREATE OR REPLACE VIEW admin_financial_overview AS
SELECT 
  DATE(m.date) AS match_date,
  COUNT(DISTINCT b.id) AS total_bookings,
  COUNT(DISTINCT CASE WHEN b.booking_type = 'stadium' THEN b.id END) AS stadium_bookings,
  COUNT(DISTINCT CASE WHEN b.booking_type = 'referee' THEN b.id END) AS referee_bookings,
  COUNT(DISTINCT CASE WHEN b.booking_type = 'staff' THEN b.id END) AS staff_bookings,
  SUM(b.amount) AS total_booking_value,
  SUM(b.commission) AS total_commission_earned,
  SUM(b.net_payout) AS total_payout_liability,
  SUM(CASE WHEN b.payout_status = 'completed' THEN b.net_payout ELSE 0 END) AS paid_out,
  SUM(CASE WHEN b.payout_status = 'pending' THEN b.net_payout ELSE 0 END) AS pending_payouts
FROM bookings b
JOIN matches m ON b.match_id = m.id
WHERE pay.status = 'completed'
GROUP BY DATE(m.date)
ORDER BY match_date DESC;
```

## Commission Structure Recommendation

```typescript
// Define commission rates
const COMMISSION_RATES = {
  stadium: 0.10,  // 10% commission on stadium bookings
  referee: 0.10,  // 10% commission on referee fees
  staff: 0.10,    // 10% commission on staff fees
}

// Calculate breakdown
function calculatePaymentBreakdown(
  stadiumFee: number,
  refereeFee: number,
  staffFee: number
) {
  const stadiumCommission = Math.round(stadiumFee * COMMISSION_RATES.stadium)
  const refereeCommission = Math.round(refereeFee * COMMISSION_RATES.referee)
  const staffCommission = Math.round(staffFee * COMMISSION_RATES.staff)
  
  const totalAmount = stadiumFee + refereeFee + staffFee
  
  return {
    stadium: stadiumFee,
    stadium_commission: stadiumCommission,
    stadium_net: stadiumFee - stadiumCommission,
    
    referee: refereeFee,
    referee_commission: refereeCommission,
    referee_net: refereeFee - refereeCommission,
    
    staff: staffFee,
    staff_commission: staffCommission,
    staff_net: staffFee - staffCommission,
    
    total: totalAmount,
    total_commission: stadiumCommission + refereeCommission + staffCommission,
    total_payout: totalAmount - (stadiumCommission + refereeCommission + staffCommission)
  }
}
```

## Key Benefits of This Architecture

1. ✅ **Single Payment** covers all costs (stadium + referee + staff + commission)
2. ✅ **Automatic Booking Creation** via webhook when payment succeeds
3. ✅ **Role-Specific Tracking** - separate booking records for each role
4. ✅ **Flexible Payouts** - batch processing with cooling period
5. ✅ **Refund Support** - handles cancellations and partial refunds
6. ✅ **Commission Tracking** - transparent commission per booking type
7. ✅ **Dashboard Ready** - views for each user role
8. ✅ **Audit Trail** - complete payment and booking history
9. ✅ **Scalable** - supports multiple referees/staff per match
10. ✅ **No Duplicate Bookings** - matches drive everything

## Next Steps

1. Create migration files for the new tables
2. Set up Razorpay webhook endpoint
3. Update match creation flow to calculate breakdown
4. Create dashboard components for each role
5. Implement payout processing (manual/automated)
6. Add RLS policies for data security

Would you like me to create the migration files?
