# Payment Record Update Verification Guide

## Issue: match_id and stadium_id Not Updating to Payments Table

**Root Cause:** Missing RLS (Row Level Security) policy preventing club owners from updating payment records.

**Fix:** Migration 021 adds the required RLS policy.

---

## 🔧 Required Migrations

### Migration 020: Add stadium_id Column
```sql
ALTER TABLE payments 
ADD COLUMN IF NOT EXISTS stadium_id UUID REFERENCES stadiums(id) ON DELETE SET NULL;
```

### Migration 021: Add RLS Policy for Updates
```sql
CREATE POLICY "Club owners can update their payment records"
  ON payments FOR UPDATE
  TO authenticated
  USING (
    paid_by = auth.uid()
    AND club_id IN (
      SELECT id FROM clubs WHERE owner_id = auth.uid()
    )
  )
  WITH CHECK (
    paid_by = auth.uid()
    AND club_id IN (
      SELECT id FROM clubs WHERE owner_id = auth.uid()
    )
  );
```

**Status:** 
- ✅ Migration files created
- ⏳ **PENDING: Apply to production database**

---

## 📋 Step-by-Step Verification Process

### Step 1: Apply Migrations to Production

**Option A: Using Supabase CLI**
```bash
cd /Users/bineshbalan/pcl
npx supabase db push
```

**Option B: Using Supabase Dashboard**
1. Go to Supabase Dashboard → SQL Editor
2. Copy content from `supabase/migrations/020_add_stadium_id_to_payments.sql`
3. Run the query
4. Copy content from `supabase/migrations/021_add_club_owner_payment_update_policy.sql`
5. Run the query

**Option C: Manual SQL Execution**
```sql
-- First, add stadium_id column (if not exists)
ALTER TABLE payments 
ADD COLUMN IF NOT EXISTS stadium_id UUID REFERENCES stadiums(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_payments_stadium_id ON payments(stadium_id);

-- Then, add the RLS policy
CREATE POLICY "Club owners can update their payment records"
  ON payments FOR UPDATE
  TO authenticated
  USING (
    paid_by = auth.uid()
    AND club_id IN (
      SELECT id FROM clubs WHERE owner_id = auth.uid()
    )
  )
  WITH CHECK (
    paid_by = auth.uid()
    AND club_id IN (
      SELECT id FROM clubs WHERE owner_id = auth.uid()
    )
  );
```

### Step 2: Verify RLS Policy is Active

Run this query in Supabase SQL Editor:
```sql
-- Check if the policy exists
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'payments'
ORDER BY policyname;
```

**Expected Result:** You should see:
- ✅ "Admins can update payments"
- ✅ "Service can update payments"
- ✅ "Club owners can update their payment records" ← **NEW**

### Step 3: Test Match Creation Flow

1. **Login as club owner**
2. **Create a new match** with Razorpay payment
3. **Watch the browser console** for these logs:

#### ✅ Success Indicators:
```javascript
// Before update
📝 Updating payment record: {
  payment_id: "xxx",
  match_id: "xxx",
  stadium_id: "xxx"
}

// After update (from .select())
✅ Payment record successfully updated: {
  payment_id: "xxx",
  match_id: "xxx",
  stadium_id: "xxx",
  razorpay_payment_id: "pay_xxx",
  verified: true  ← Should be TRUE
}

// Verification query
✅ VERIFIED: Payment record in database has match_id and stadium_id: {
  payment_id: "xxx",
  match_id: "xxx",
  stadium_id: "xxx",
  club_id: "xxx"
}
```

#### ❌ Failure Indicators:
```javascript
❌ CRITICAL: Failed to update payment record with match_id and stadium_id: {
  error: {...},
  message: 'This may be an RLS policy issue. Check if migration 021 is applied.'
}
```

OR

```javascript
❌ VERIFICATION FAILED: Payment record is missing match_id or stadium_id
```

### Step 4: Verify in Database

After creating a match, run this query:
```sql
SELECT 
  id,
  razorpay_payment_id,
  match_id,
  stadium_id,
  club_id,
  status,
  created_at
FROM payments
WHERE razorpay_payment_id = 'pay_YOUR_PAYMENT_ID'  -- Replace with actual payment ID
ORDER BY created_at DESC
LIMIT 1;
```

**Expected Result:**
- ✅ `match_id` should **NOT be NULL**
- ✅ `stadium_id` should **NOT be NULL**

### Step 5: Verify in Club Payment History View

```sql
SELECT 
  payment_id,
  razorpay_payment_id,
  match_id,
  match_date,
  home_club_name,
  away_club_name,
  stadium_name,
  payment_status
FROM club_payment_history
WHERE club_id = 'YOUR_CLUB_ID'  -- Replace with your club ID
ORDER BY payment_created DESC
LIMIT 5;
```

**Expected Result:**
- ✅ Latest payment should have `match_id` populated
- ✅ `stadium_name` should be displayed (joined from stadiums table)
- ✅ `home_club_name` and `away_club_name` should be displayed

---

## 🐛 Troubleshooting

### Issue 1: Update Still Fails After Applying Migration 021

**Check 1: Verify RLS is enabled on payments table**
```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'payments';
```
Expected: `rowsecurity` = `true`

**Check 2: Verify policy was created**
```sql
SELECT COUNT(*) 
FROM pg_policies 
WHERE tablename = 'payments' 
AND policyname = 'Club owners can update their payment records';
```
Expected: Count = 1

**Check 3: Verify user's club ownership**
```sql
-- Replace with actual user ID
SELECT id, club_name, owner_id 
FROM clubs 
WHERE owner_id = 'YOUR_USER_ID';
```

### Issue 2: match_id is NULL in club_payment_history

**Possible Causes:**
1. Migration 021 not applied → Update is blocked by RLS
2. `formData.stadiumId` is undefined → Check form validation
3. Payment record not found → Check `paymentRecord.id`

**Debug Steps:**
1. Check browser console for error logs
2. Verify payment record exists: `SELECT * FROM payments WHERE id = 'payment_id'`
3. Test update manually with service_role key

### Issue 3: stadium_id Column Doesn't Exist

**Solution:** Run migration 020 first
```sql
ALTER TABLE payments 
ADD COLUMN IF NOT EXISTS stadium_id UUID REFERENCES stadiums(id) ON DELETE SET NULL;
```

---

## 📊 Current vs Expected State

### BEFORE Fix (All payments have null match_id/stadium_id)
```json
{
  "payment_id": "a94109d8-4e66-4988-9f96-1244b0425b4e",
  "match_id": null,  ❌
  "stadium_name": null,  ❌
  "home_club_name": null,
  "away_club_name": null
}
```

### AFTER Fix (New payments have populated match_id/stadium_id)
```json
{
  "payment_id": "new-payment-id",
  "match_id": "cd4d197b-49ae-4797-81d2-51dfa3d16984",  ✅
  "stadium_name": "Example Stadium",  ✅
  "home_club_name": "Tulunadu FC",
  "away_club_name": "Opponent FC"
}
```

---

## 🔄 Backfill Existing Payments (Optional)

If you want to fix old payments that already have matches:

```sql
-- Backfill match_id and stadium_id for existing completed payments
-- This finds payments that have webhook_data containing match information

UPDATE payments p
SET 
  match_id = m.id,
  stadium_id = m.stadium_id
FROM matches m
WHERE p.match_id IS NULL
  AND p.status = 'completed'
  AND p.club_id = m.home_club_id  -- Assuming club_id matches home team's club
  AND p.created_at::date = m.match_date::date  -- Match by date
  AND NOT EXISTS (
    SELECT 1 FROM payments p2 
    WHERE p2.match_id = m.id AND p2.id != p.id
  );  -- Avoid duplicate matches

-- Verify the backfill
SELECT 
  COUNT(*) as total_payments,
  COUNT(match_id) as with_match_id,
  COUNT(stadium_id) as with_stadium_id,
  COUNT(CASE WHEN match_id IS NULL AND status = 'completed' THEN 1 END) as missing_match_id
FROM payments;
```

---

## ✅ Success Checklist

- [ ] Migration 020 applied (stadium_id column exists)
- [ ] Migration 021 applied (RLS policy exists)
- [ ] Created new match after migrations
- [ ] Browser console shows "✅ VERIFIED: Payment record in database has match_id and stadium_id"
- [ ] Database query confirms match_id and stadium_id are NOT NULL
- [ ] club_payment_history view shows stadium_name and match details
- [ ] No errors in browser console during match creation

---

## 📝 Notes

- The update happens **after successful payment and match creation**
- The update is **non-blocking** - match is created even if update fails
- Enhanced logging added to help diagnose issues
- RLS policies protect data while allowing legitimate updates
- The `club_payment_history` view automatically joins stadium and match data

---

## 🚀 Quick Test Command

After applying migrations, test with this one-liner:
```sql
-- Check latest payment has both match_id and stadium_id
SELECT 
  razorpay_payment_id,
  match_id IS NOT NULL as has_match_id,
  stadium_id IS NOT NULL as has_stadium_id,
  status,
  created_at
FROM payments
ORDER BY created_at DESC
LIMIT 1;
```

Expected: Both `has_match_id` and `has_stadium_id` should be `true` for new payments.
