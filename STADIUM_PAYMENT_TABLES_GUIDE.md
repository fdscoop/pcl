# Payment Tables Related to Stadium Page

## Overview
The stadium page uses several interconnected payment-related tables to manage bookings, revenue tracking, and payouts for stadium owners.

---

## Core Payment Tables

### 1. **payments** (Primary Table)
Stores all match payment transactions processed through Razorpay.

| Column | Type | Purpose |
|--------|------|---------|
| id | UUID | Primary Key |
| **razorpay_order_id** | TEXT | Razorpay order tracking |
| razorpay_payment_id | TEXT | Payment confirmation from Razorpay |
| razorpay_signature | TEXT | Payment verification signature |
| **amount** | INTEGER | Total payment in paise (all services combined) |
| currency | TEXT | Always 'INR' |
| **status** | TEXT | 'created', 'processing', 'completed', 'failed', 'refunded' |
| **club_id** | UUID | FK → clubs(id) - Club that paid |
| paid_by | UUID | FK → users(id) - User who initiated payment |
| **match_id** | UUID | FK → matches(id) - Match being paid for |
| **stadium_id** | UUID | FK → stadiums(id) - Added in Migration 020 |
| **amount_breakdown** | JSONB | `{stadium: 5000, referee: 2000, staff: 1000, commission: 500}` |
| payment_method | TEXT | 'upi', 'card', 'netbanking' |
| refund_status | TEXT | 'partial', 'full', null |
| refunded_amount | INTEGER | Amount refunded in paise |
| created_at | TIMESTAMP | Payment creation time |
| completed_at | TIMESTAMP | Payment completion time |

**Key Indexes:**
```sql
CREATE INDEX idx_payments_match_id ON payments(match_id);
CREATE INDEX idx_payments_club_id ON payments(club_id);
CREATE INDEX idx_payments_stadium_id ON payments(stadium_id);
CREATE INDEX idx_payments_status ON payments(status);
```

---

### 2. **payout_accounts** (Bank Details)
Stores verified bank accounts for stadium owners to receive payouts.

| Column | Type | Purpose |
|--------|------|---------|
| id | UUID | Primary Key |
| **user_id** | UUID | FK → users(id) - Stadium owner |
| account_number | VARCHAR(20) | Bank account number |
| ifsc_code | VARCHAR(11) | Bank IFSC code |
| account_holder | VARCHAR(255) | Account holder name |
| bank_name | TEXT | Bank name |
| verification_status | VARCHAR(50) | 'pending', 'verifying', 'verified', 'failed', 'rejected' |
| verification_id | UUID | Link to verification record |
| verification_details | JSONB | Additional verification info |
| verified_at | TIMESTAMP | When account was verified |
| is_active | BOOLEAN | Only one active account per user |
| is_primary | BOOLEAN | Primary account flag |
| created_at | TIMESTAMP | Account registration time |
| updated_at | TIMESTAMP | Last update time |

**Key Constraint:**
```sql
CONSTRAINT unique_active_per_user UNIQUE (user_id, is_active) WHERE is_active = TRUE
```

---

### 3. **matches** (Related Table)
Stores match details including stadium booking information.

| Column | Type | Purpose |
|--------|------|---------|
| id | UUID | Primary Key |
| home_club_id | UUID | FK → clubs(id) |
| away_club_id | UUID | FK → clubs(id) |
| **stadium_id** | UUID | FK → stadiums(id) - Links to stadium |
| match_date | TIMESTAMP | Match date/time |
| **status** | match_status | 'scheduled', 'ongoing', 'completed', 'cancelled' |
| format | match_format | '5-a-side', '7-a-side', '11-a-side', 'friendly' |
| home_score | INTEGER | Final home team score |
| away_score | INTEGER | Final away team score |
| is_paid | BOOLEAN | Whether payment completed |
| cancelled_reason | TEXT | If match cancelled |

---

### 4. **stadiums** (Resource Table)
Stadium information referenced by matches and payments.

| Column | Type | Purpose |
|--------|------|---------|
| id | UUID | Primary Key |
| **owner_id** | UUID | FK → users(id) - Stadium owner |
| stadium_name | TEXT | Stadium name |
| slug | TEXT | URL slug |
| city | TEXT | Location city |
| district | TEXT | Location district |
| state | TEXT | Location state |
| capacity | INTEGER | Stadium capacity |
| surface_type | TEXT | Pitch type (grass, artificial) |
| contact_email | TEXT | Contact info |
| contact_phone | TEXT | Contact info |
| kyc_status | kyc_status | 'pending', 'verified', 'rejected' |

---

## Related Data Flow

### Stadium Owner Revenue Tracking

```
Stadium Owner Dashboard
    ↓
Query: stadiums WHERE owner_id = current_user
    ↓
Get all stadium IDs → [stadium_1, stadium_2]
    ↓
Query: matches WHERE stadium_id IN [stadium_1, stadium_2]
    ↓
Get match IDs → [match_1, match_2, match_3]
    ↓
Query: payments WHERE match_id IN [match_1, match_2, match_3]
    ↓
Extract stadium portion from amount_breakdown.stadium
    ↓
Calculate: Total - Commission (10%) = Net Payout
```

### Payment Breakdown Structure

```json
{
  "stadium": 5000,    // Stadium rental fee (in paise)
  "referee": 2000,    // Referee fee (in paise)
  "staff": 1000,      // Staff fee (in paise)
  "commission": 500   // PCL commission 10% (in paise)
}
```

**Total Payment = stadium + referee + staff + commission = 8500 paise**

**Stadium Owner Gets = stadium - (stadium * 0.10 commission) = 4500 paise**

---

## Stadium Payment Service

Located at: [apps/web/src/services/stadiumPaymentService.ts](apps/web/src/services/stadiumPaymentService.ts)

### Key Functions:

1. **getStadiumPaymentStats(userId)**
   - Gets total revenue, pending payouts, completed payments
   - Returns: StadiumPaymentStats interface

2. **getStadiumBookingRecords(userId)**
   - Gets individual match payment records
   - Returns: Array of StadiumBookingRecord

3. **getStadiumMonthlyStats(userId, month, year)**
   - Gets monthly breakdown of revenue
   - Returns: StadiumMonthlyStats interface

4. **calculateStadiumEarnings()**
   - Computes net payout after commission
   - Formula: `(payment.amount * 0.6) - commission`

---

## RLS Policies

### Stadium Owners
```sql
-- Can view their own stadiums
CREATE POLICY "Users can view their own stadiums"
  ON stadiums FOR SELECT
  USING (owner_id = auth.uid());

-- Can view payments for their stadiums
CREATE POLICY "Stadium owners can view payments for their stadiums"
  ON payments FOR SELECT
  USING (
    stadium_id IN (
      SELECT id FROM stadiums WHERE owner_id = auth.uid()
    )
  );
```

### Payout Accounts
```sql
-- Can manage their own payout accounts
CREATE POLICY "Users can view their own payout accounts"
  ON payout_accounts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own payout accounts"
  ON payout_accounts FOR UPDATE
  USING (auth.uid() = user_id);
```

---

## Data Storage

### Commission Rates
```typescript
const COMMISSION_RATES = {
  stadium: 0.10,   // 10% commission on stadium revenue
  referee: 0.10,   // 10% commission on referee fees
  staff: 0.10,     // 10% commission on staff fees
}
```

### Currency Conversion
```typescript
// All amounts stored in paise in database
// Display to users in rupees
paiseToRupees = (paise: number) => Math.round(paise / 100)
rupeesToPaise = (rupees: number) => rupees * 100
```

---

## Stadium Page Workflow

### 1. Dashboard Load
```
Stadium Owner Login
  ↓
Fetch stadiums WHERE owner_id = user_id
  ↓
Get payment stats using stadiumPaymentService
  ↓
Display:
  - Total Revenue (from payments.amount_breakdown.stadium)
  - Commission (10% deduction)
  - Net Payout (revenue - commission)
  - Pending Matches (not yet completed)
  - Completed Matches (with payment received)
```

### 2. Match Creation
```
Club Owner Creates Match
  ↓
Selects stadium_id
  ↓
Initiates payment (Razorpay)
  ↓
Payment record created with amount_breakdown
  ↓
match_id + stadium_id linked in payments table (Migration 020)
  ↓
Stadium owner sees in dashboard
```

### 3. Payout Processing
```
Stadium Owner Views Payment History
  ↓
Selects matches to payout
  ↓
Provides verified payout account (from payout_accounts)
  ↓
System calculates net amount
  ↓
Initiates bank transfer
  ↓
Updates payout_accounts.verified_at
```

---

## Recent Migrations

| Migration | Change |
|-----------|--------|
| 020 | Added stadium_id to payments table |
| 021 | Added RLS policy for club owners to update payments |
| ADD_VERIFICATION_DETAILS_TO_PAYOUT_ACCOUNTS | Added verification_details, verification_id to payout_accounts |

---

## Summary

**Stadium payment system uses 4 main tables:**

1. **payments** - Transaction records (linked to stadium_id in Migration 020)
2. **payout_accounts** - Verified bank accounts for stadium owners
3. **matches** - Match scheduling (includes stadium_id)
4. **stadiums** - Stadium resource information

**Payment Flow:**
- Club pays for match → Payment stored with stadium breakdown
- Stadium owner views earnings in dashboard
- System calculates revenue after 10% commission
- Stadium owner can request payout to verified account
