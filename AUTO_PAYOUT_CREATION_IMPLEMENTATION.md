# Auto-Payout Creation Implementation

## Overview
Implemented automatic payout creation in the Razorpay webhook handler. When a payment is successfully captured, payouts are automatically created for all recipients (stadium owner, referees, staff).

## Changes Made

### File: `apps/web/src/app/api/webhooks/razorpay/route.ts`

#### 1. Updated `handlePaymentCaptured()` function
Added call to create payouts after match payment status is updated:
```typescript
// 5. Create payouts automatically
await createAutomaticPayouts(paymentRecord, match, breakdown)
```

#### 2. New function: `createAutomaticPayouts()`
Automatically creates payout records for:
- **Stadium Owner** - Gets net amount (stadium fee - commission)
- **Referee** - Gets net amount (referee fee - commission)
- **Staff Members** - Gets split amount (staff fee - commission ÷ number of staff)

**Features:**
- Determines payout period (current month)
- Calculates net amounts after commission deductions
- Links payouts to match and payment records
- Inserts all payouts in single database operation
- Auto-updates `pending_payouts_summary` table via triggers

## Flow Diagram

```
Payment Webhook (payment.captured)
    ↓
1. Update payment record to 'completed'
    ↓
2. Create booking records (stadium, referee, staff)
    ↓
3. Update match payment status to 'paid'
    ↓
4. ✨ CREATE PAYOUTS AUTOMATICALLY ✨
    ├── Get payment breakdown (stadium fee, referee fee, staff fee)
    ├── Create payout for stadium owner (net amount)
    ├── Create payout for referee (net amount)
    ├── Create payouts for each staff member (split amount)
    ↓
5. Trigger fires: pending_payouts_summary auto-updates
    └── Inserts/updates summary table with pending payout totals
```

## Payout Record Structure

Each payout record includes:
```typescript
{
  user_id: UUID,                    // Recipient's user ID
  user_role: 'stadium_owner' | 'referee' | 'staff',
  amount: INTEGER,                  // Net amount in paise (after commission)
  status: 'pending',                // Initial status
  payout_period_start: DATE,        // Start of payout period (1st of month)
  payout_period_end: DATE,          // End of payout period (last day of month)
  match_ids: [UUID],                // Associated match ID
  booking_ids: [],                  // Associated booking IDs
  payment_id: UUID,                 // Source payment ID
  notes: STRING,                    // Description of payout
  created_at: TIMESTAMP,            // Creation timestamp
  updated_at: TIMESTAMP             // Last update timestamp
}
```

## Automatic Updates

When payouts are created with `status = 'pending'`:
1. Database trigger `trigger_create_pending_payouts_summary` fires
2. Function `create_pending_payouts_summary_entry()` executes
3. Function calls `refresh_pending_payouts_summary()` 
4. `pending_payouts_summary` table auto-populates with:
   - `total_pending_amount` - Sum of all pending amounts for user/period
   - `total_pending_count` - Count of pending payouts

## Testing Flow

1. **Create match** → Club owner pays for match
2. **Razorpay webhook** → Payment marked as 'completed'
3. **Webhook handler** → Automatically creates payouts
4. **Database triggers** → `pending_payouts_summary` auto-updates
5. **Admin dashboard** → Can view pending payouts

## Commission Handling

Commissions are deducted from gross amounts:
```
Stadium: breakdown.stadium - breakdown.stadium_commission
Referee: breakdown.referee - breakdown.referee_commission
Staff (per person): (breakdown.staff - breakdown.staff_commission) / staff_count
```

## Error Handling

- Logs errors if user/referee/staff records not found
- Continues processing even if some recipients missing
- Throws error on database insertion failure
- Webhook handler catches and logs all errors

## Deployment Status

✅ Code changes committed
⏳ Ready for testing in development
📋 No database migration needed (pending_payouts_summary already exists)

## Next Steps

1. **Test the flow:**
   - Create a match with payment
   - Verify payouts created in database
   - Verify pending_payouts_summary auto-populated

2. **Monitor webhook logs:**
   - Check for errors in payout creation
   - Verify commission calculations
   - Confirm trigger execution

3. **Build admin UI:**
   - Dashboard to view pending payouts
   - Approve/process payouts for Razorpay Payouts API
