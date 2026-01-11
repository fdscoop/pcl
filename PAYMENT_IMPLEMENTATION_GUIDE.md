# Implementation Guide: Payment & Booking System

## 🚀 Quick Start: Apply All Migrations

Run these SQL files in your Supabase SQL Editor in this order:

### Step 1: Create Core Tables
```sql
-- 1. Create payments table
-- Run: CREATE_PAYMENTS_TABLE.sql

-- 2. Create bookings table (depends on payments and payouts)
-- Run: CREATE_BOOKINGS_TABLE.sql

-- 3. Create payouts table
-- Run: CREATE_PAYOUTS_TABLE.sql

-- 4. Add payment fields to matches
-- Run: ADD_PAYMENT_FIELDS_TO_MATCHES.sql

-- 5. Create views for dashboards
-- Run: CREATE_PAYMENT_VIEWS.sql

-- 6. Add RLS policies
-- Run: ADD_PAYMENT_RLS_POLICIES.sql
```

### Step 2: Add Webhook Secret to Environment

```bash
# .env.local
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret_from_razorpay_dashboard
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### Step 3: Configure Razorpay Webhook

1. Go to Razorpay Dashboard → Settings → Webhooks
2. Add webhook URL: `https://yourdomain.com/api/webhooks/razorpay`
3. Select events:
   - ✅ payment.captured
   - ✅ payment.failed
   - ✅ refund.processed
4. Copy the webhook secret to your `.env.local`

---

## 📋 Implementation Checklist

### Backend Setup ✅

- [x] Created `payments` table with Razorpay tracking
- [x] Created `bookings` table for individual resource bookings
- [x] Created `payouts` table for vendor payments
- [x] Added payment fields to `matches` table
- [x] Created dashboard views for all roles
- [x] Added RLS policies for data security
- [x] Created webhook handler at `/api/webhooks/razorpay`
- [x] Created payment calculation service

### Frontend Integration (TODO)

- [ ] Update match creation Step 6 to calculate payment breakdown
- [ ] Integrate payment calculation service
- [ ] Display breakdown to user before payment
- [ ] Update payment success handler
- [ ] Create stadium owner dashboard booking view
- [ ] Create referee dashboard booking view
- [ ] Create staff dashboard booking view
- [ ] Create admin payout management interface
- [ ] Add cancellation/refund UI

---

## 🔄 Match Creation Flow (Updated)

### Step 6: Payment Integration

```typescript
// In your match creation wizard, Step 6

import { getMatchPaymentDetails } from '@/services/paymentCalculationService'

// Get pricing from your state/database
const stadiumFee = 5000 // ₹5,000
const refereeFee = 2000 // ₹2,000
const staffFee = 1000   // ₹1,000

// Calculate breakdown
const paymentDetails = getMatchPaymentDetails(
  stadiumFee,
  refereeFee,
  staffFee
)

// Show breakdown to user
console.log(paymentDetails.display)
// Output:
// {
//   items: [
//     { label: 'Stadium Fee', amount: '₹5000.00' },
//     { label: 'Referee Fee', amount: '₹2000.00' },
//     { label: 'Staff Fee', amount: '₹1000.00' }
//   ],
//   total: '₹8000.00',
//   commission: '₹800.00'
// }

// When user clicks "Pay"
const paymentData = {
  amount: paymentDetails.razorpayAmount, // 800000 paise
  currency: 'INR',
  receipt: `MATCH_${Date.now()}`,
  customer: {
    name: user.name,
    email: user.email,
    contact: user.phone
  },
  description: `Match: ${homeTeam} vs ${awayTeam}`,
  notes: {
    match_id: matchId,
    club_id: clubId,
    stadium_id: stadiumId,
    referee_id: refereeId,
    staff_ids: staffIds
  }
}

// Store breakdown in payment record
const { data: payment } = await supabase
  .from('payments')
  .insert({
    club_id: clubId,
    paid_by: userId,
    match_id: matchId,
    amount: paymentDetails.razorpayAmount,
    amount_breakdown: paymentDetails.breakdown,
    status: 'created',
    receipt: paymentData.receipt
  })
  .select()
  .single()

// Create Razorpay order
const orderResponse = await fetch('/api/razorpay/create-order', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(paymentData)
})

const order = await orderResponse.json()

// Update payment with order ID
await supabase
  .from('payments')
  .update({ razorpay_order_id: order.id })
  .eq('id', payment.id)

// Open Razorpay checkout
await razorpayService.processPayment(
  paymentData,
  async (response) => {
    // Success - webhook will handle the rest
    console.log('Payment successful:', response)
    router.push(`/match/${matchId}?payment=success`)
  },
  (error) => {
    // Error
    console.error('Payment failed:', error)
  }
)
```

---

## 📊 Dashboard Integration Examples

### Stadium Owner Dashboard

```typescript
// Fetch bookings for stadium owner
const { data: bookings } = await supabase
  .from('stadium_owner_bookings')
  .select('*')
  .eq('stadium_owner_id', userId)
  .order('match_date', { ascending: false })

// Display:
// - Upcoming matches
// - Completed matches
// - Earnings (net_earnings)
// - Pending payouts (payout_status = 'pending')
// - Completed payouts (payout_status = 'completed')
```

### Referee Dashboard

```typescript
// Fetch bookings for referee
const { data: bookings } = await supabase
  .from('referee_bookings')
  .select('*')
  .eq('referee_user_id', userId)
  .order('match_date', { ascending: false })

// Display:
// - Match assignments
// - Fees earned
// - Payout history
```

### Staff Dashboard

```typescript
// Fetch bookings for staff
const { data: bookings } = await supabase
  .from('staff_bookings')
  .select('*')
  .eq('staff_user_id', userId)
  .order('match_date', { ascending: false })

// Similar to referee dashboard
```

### Admin Dashboard - Payout Management

```typescript
// Get pending payouts summary
const { data: pendingPayouts } = await supabase
  .from('pending_payouts_summary')
  .select('*')
  .order('total_pending_payout', { ascending: false })

// For each user ready for payout:
// 1. Create payout record
// 2. Process via Razorpay Payouts API (or manual bank transfer)
// 3. Update bookings with payout_id
// 4. Update payout status to 'completed'
```

---

## 💰 Payout Processing

### Manual Payout Flow

```typescript
// Admin initiates payout for a user
async function processPayoutForUser(userId: string, userRole: string) {
  // 1. Get pending bookings
  const { data: pendingBookings } = await supabase
    .from('bookings')
    .select('*, matches(*)')
    .eq('resource_id', userId)
    .eq('booking_type', userRole === 'stadium_owner' ? 'stadium' : userRole)
    .eq('payout_status', 'pending')
    .eq('status', 'completed')
    .lte('matches.date', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)) // 7 days cooling
  
  if (!pendingBookings || pendingBookings.length === 0) {
    throw new Error('No pending bookings for payout')
  }
  
  // 2. Calculate total payout
  const totalAmount = pendingBookings.reduce((sum, b) => sum + b.net_payout, 0)
  const bookingIds = pendingBookings.map(b => b.id)
  const matchIds = [...new Set(pendingBookings.map(b => b.match_id))]
  
  // 3. Get user's bank details
  const { data: user } = await supabase
    .from('users')
    .select('bank_account_number, ifsc_code, account_holder_name')
    .eq('id', userId)
    .single()
  
  // 4. Create payout record
  const { data: payout } = await supabase
    .from('payouts')
    .insert({
      user_id: userId,
      user_role: userRole,
      amount: totalAmount,
      booking_ids: bookingIds,
      match_ids: matchIds,
      booking_count: bookingIds.length,
      bank_account_number: user.bank_account_number,
      ifsc_code: user.ifsc_code,
      account_holder_name: user.account_holder_name,
      status: 'pending',
      processed_by: adminUserId,
      processing_method: 'manual'
    })
    .select()
    .single()
  
  // 5. Process payment (via Razorpay Payouts API or manual)
  // ... Razorpay payout API call ...
  
  // 6. Update payout status
  await supabase
    .from('payouts')
    .update({
      status: 'completed',
      razorpay_payout_id: razorpayPayoutId,
      completed_at: new Date().toISOString()
    })
    .eq('id', payout.id)
  
  // 7. Update bookings
  await supabase
    .from('bookings')
    .update({
      payout_status: 'completed',
      payout_id: payout.id,
      payout_date: new Date().toISOString()
    })
    .in('id', bookingIds)
  
  return payout
}
```

---

## 🔧 Testing

### Test Payment Flow

1. Create match as club owner
2. Complete all 6 steps
3. Click "Pay" in Step 6
4. Use Razorpay test card: `4111 1111 1111 1111`
5. Check webhook logs: `console.log` in webhook handler
6. Verify:
   - Payment status = 'completed'
   - Match payment_status = 'paid'
   - 3 booking records created (stadium, referee, staff)
   - Bookings have correct amounts and commissions

### Test Refund Flow

```typescript
// Cancel match and process refund
const { data: payment } = await supabase
  .from('payments')
  .select('*')
  .eq('match_id', matchId)
  .single()

// Calculate refund amount
const refundDetails = calculateRefundAmount(
  payment.amount,
  new Date(match.date),
  new Date()
)

// Process refund via Razorpay API
const refund = await razorpay.payments.refund(payment.razorpay_payment_id, {
  amount: refundDetails.refundAmount,
  notes: {
    reason: refundDetails.reason
  }
})

// Webhook will handle the rest
```

---

## 📈 Next Steps

1. ✅ **Apply all migrations** to your Supabase database
2. ✅ **Configure webhook** in Razorpay dashboard
3. ✅ **Test webhook** using Razorpay test mode
4. 🔄 **Update match creation** UI to show breakdown
5. 🔄 **Create dashboard components** for each role
6. 🔄 **Implement payout management** for admins
7. 🔄 **Add refund processing** UI
8. 🚀 **Deploy and test** end-to-end

---

## 🆘 Support

If you encounter issues:

1. Check webhook logs in Razorpay dashboard
2. Check API logs in Supabase dashboard
3. Verify RLS policies are correct
4. Test with Razorpay test mode first
5. Check that service role key has proper permissions

---

## 🎯 Key Benefits

✅ **Single Payment** - User pays once for everything
✅ **Automatic Booking Creation** - Webhook creates bookings
✅ **Transparent Payouts** - Each role sees their earnings
✅ **Commission Tracking** - Know exactly what you earn
✅ **Easy Refunds** - Cancel match → automatic refund calculation
✅ **Audit Trail** - Complete history of all transactions
✅ **Scalable** - Supports multiple referees/staff per match
✅ **Dashboard Ready** - Views already created for all roles

**Let's get this implemented! 🚀**
