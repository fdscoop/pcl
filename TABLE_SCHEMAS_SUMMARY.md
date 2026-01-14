# Table Schemas Summary - Matches, Payments, Payouts

## 1. MATCHES TABLE

### Current Schema (from migration 008)
```sql
CREATE TABLE matches (
  id UUID PRIMARY KEY,
  
  -- Team References
  tournament_id UUID REFERENCES tournaments(id),
  home_team_id UUID NOT NULL REFERENCES teams(id),
  away_team_id UUID NOT NULL REFERENCES teams(id),
  
  -- Match Details
  match_format match_format NOT NULL,
  match_date DATE NOT NULL,
  match_time TIME NOT NULL,
  
  -- Stadium Reference
  stadium_id UUID REFERENCES stadiums(id),
  
  -- Match Status & Results
  status match_status DEFAULT 'scheduled',
  home_team_score INTEGER,
  away_team_score INTEGER,
  match_summary TEXT,
  
  -- Match Classification (MISSING from migration but used in code)
  match_type TEXT,        -- 'friendly' vs 'official' (NOT IN SCHEMA)
  league_structure TEXT,  -- 'friendly', 'hobby', 'tournament', etc (NOT IN SCHEMA)
  
  -- Creator
  created_by UUID NOT NULL REFERENCES users(id),
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  started_at TIMESTAMP,
  ended_at TIMESTAMP,
  deleted_at TIMESTAMP,
  
  -- Additional fields from 018_add_match_cancellation_fields.sql
  canceled_at TIMESTAMP WITH TIME ZONE,
  canceled_by UUID REFERENCES users(id),
  cancellation_reason TEXT
);
```

### Missing Columns (Referenced in Code but Not in Schema)
```sql
-- MISSING: payment_id
-- The code tries to insert this but column doesn't exist:
-- INSERT INTO matches (..., payment_id: paymentRecord.id, ...)
payment_id UUID REFERENCES payments(id),

-- MISSING: match_type
-- Used in code to distinguish 'friendly' from 'official'
match_type TEXT,

-- MISSING: league_structure  
-- Used in code to specify match tier/format
league_structure TEXT
```

### Existing Migrations
- Migration 008: Initial creation
- Migration 018: Added cancellation fields (canceled_at, canceled_by, cancellation_reason)

### Needed Migration
⚠️ **Need to add:**
- `payment_id UUID REFERENCES payments(id) ON DELETE SET NULL`
- `match_type TEXT` - for distinguishing friendly vs official matches
- `league_structure TEXT` - already used in code but column missing

---

## 2. PAYMENTS TABLE

### Complete Schema (from CREATE_PAYMENTS_TABLE.sql)
```sql
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Razorpay Details
  razorpay_order_id TEXT NOT NULL UNIQUE,
  razorpay_payment_id TEXT UNIQUE,
  razorpay_signature TEXT,
  
  -- Payment Info
  amount INTEGER NOT NULL,           -- in paise (₹1 = 100 paise)
  currency TEXT DEFAULT 'INR',
  status TEXT NOT NULL DEFAULT 'created',
  -- Values: 'created', 'processing', 'completed', 'failed', 'refunded'
  
  -- Payer Details
  club_id UUID REFERENCES clubs(id) ON DELETE SET NULL,
  paid_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Match Reference
  match_id UUID REFERENCES matches(id) ON DELETE SET NULL,
  
  -- Amount Breakdown
  amount_breakdown JSONB,
  -- Example: {
  --   "stadium": 500000,
  --   "stadium_commission": 50000,
  --   "referee": 200000,
  --   "referee_commission": 20000,
  --   "staff": 100000,
  --   "staff_commission": 10000,
  --   "total_commission": 80000
  -- }
  
  -- Metadata
  receipt TEXT,
  notes JSONB,
  payment_method TEXT,  -- 'upi', 'card', 'netbanking', etc.
  
  -- Refund Tracking
  refund_status TEXT,           -- null, 'partial', 'full'
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
  webhook_received_at TIMESTAMPTZ
);
```

### Indexes
- idx_payments_match_id
- idx_payments_club_id
- idx_payments_paid_by
- idx_payments_status
- idx_payments_razorpay_order
- idx_payments_razorpay_payment
- idx_payments_created_at

### Status Flow
```
'created' 
  ↓
'processing' (optional)
  ├─ completed ✅
  ├─ failed ❌
  └─ refunded
```

---

## 3. PAYOUTS TABLE

### Complete Schema (from CREATE_PAYOUTS_TABLE.sql)
```sql
CREATE TABLE payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Recipient Details
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_role TEXT NOT NULL,
  -- Values: 'stadium_owner', 'referee', 'staff'
  
  -- Payout Financial Details (in paise)
  amount INTEGER NOT NULL,
  currency TEXT DEFAULT 'INR',
  
  -- Payout Status
  status TEXT NOT NULL DEFAULT 'pending',
  -- Values: 'pending', 'processing', 'completed', 'failed', 'cancelled'
  
  -- Razorpay Payout Details (for Razorpay Payouts API)
  razorpay_payout_id TEXT UNIQUE,
  razorpay_fund_account_id TEXT,
  razorpay_transfer_id TEXT,
  
  -- Bank Details (snapshot from KYC)
  bank_account_number TEXT,
  ifsc_code TEXT,
  account_holder_name TEXT,
  bank_name TEXT,
  
  -- Payout Period
  payout_period_start DATE,
  payout_period_end DATE,
  
  -- Booking References (JSONB array)
  booking_ids JSONB NOT NULL,     -- ["uuid1", "uuid2", "uuid3"]
  booking_count INTEGER DEFAULT 0,
  
  -- Match References
  match_ids JSONB,                -- ["match_uuid1", "match_uuid2"]
  
  -- Error Tracking
  failure_reason TEXT,
  failure_code TEXT,
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  
  -- Processing Details
  processed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
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
  internal_reference TEXT
);
```

### Indexes
- idx_payouts_user_id
- idx_payouts_user_role
- idx_payouts_status
- idx_payouts_razorpay_id
- idx_payouts_period
- idx_payouts_created_at
- idx_payouts_completed_at
- idx_payouts_user_status (composite)
- idx_payouts_role_status (composite)

### Status Flow
```
'pending'
  ↓
'processing'
  ├─ completed ✅
  ├─ failed ❌
  └─ cancelled
```

### Auto-Triggers
- ✅ `trigger_update_payouts_updated_at` - Updates updated_at on every update
- ✅ `trigger_set_payout_completed_at` - Auto-sets completed_at when status → 'completed'
- ✅ `trigger_set_payout_failed_at` - Auto-sets failed_at when status → 'failed'

---

## Data Relationships

```
clubs (1) ←─────────────┐
                        │ club_id
                        │
                    payments (1) ←─────────────┐
                        │ match_id            │
                        │                     │
                    matches (1)      payment_id (⚠️ MISSING)
                        │
         ┌──────────────┴──────────────┐
         │                             │
    match_assignments            payouts
         ├─ referee_id            ├─ user_id (stadium_owner)
         └─ staff_id              ├─ user_id (referee)
                                  └─ user_id (staff)
```

---

## 🔴 CRITICAL ISSUES

### Issue 1: Missing payment_id in matches table
- **Location:** matches table is missing `payment_id` column
- **Impact:** Code tries to insert payment_id but column doesn't exist → **INSERT will fail**
- **Status:** ⚠️ **Not yet migrated**
- **Fix Needed:** Add migration to add column

### Issue 2: Missing match_type in matches table
- **Location:** matches table schema
- **Code Usage:** Line 1207 in create-friendly-enhanced.tsx
- **Impact:** Cannot distinguish friendly vs official matches
- **Fix Needed:** Add migration to add column

### Issue 3: Missing league_structure in matches table
- **Location:** matches table schema
- **Code Usage:** Line 1208 in create-friendly-enhanced.tsx
- **Impact:** Cannot store league tier/structure
- **Fix Needed:** Add migration to add column

### Issue 4: No automatic payout creation
- **Location:** Database triggers
- **Impact:** When payment completes, no payout records are created
- **Status:** ⚠️ **Not implemented**
- **Fix Needed:** Create trigger on payments table

---

## Migration Checklist

- [ ] Add `payment_id UUID REFERENCES payments(id)` to matches
- [ ] Add `match_type TEXT` to matches
- [ ] Add `league_structure TEXT` to matches
- [ ] Create trigger to auto-create payouts when payment completes
- [ ] Add RLS policies for club_owner role on matches/payments
- [ ] Test match creation with new payment_id column

