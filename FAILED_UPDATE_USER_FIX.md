# ✅ "Failed to Update User" Error - FIX GUIDE

## Problem
When verifying Aadhaar OTP, you get "Failed to update user" 500 error. This is because the `users` table is missing necessary KYC columns.

## Root Cause
The Aadhaar verification API tries to update these columns on the `users` table:
- `kyc_status`
- `kyc_verified_at`
- `full_name`
- `date_of_birth`
- `aadhaar_number`
- `city`, `district`, `state`, `country`

If these columns don't exist, the database update fails with a 500 error.

## Solution: Apply Database Migration

### Quick Fix (3 Steps)

**Step 1:** Open Supabase Dashboard
- Go to https://supabase.com
- Select your project
- Click "SQL Editor" in left sidebar

**Step 2:** Copy the Migration SQL
The migration is in file: `COMPLETE_KYC_MIGRATION.sql`

Here's what to paste:

```sql
-- Complete KYC fields migration for users table
-- This ensures all columns needed for Aadhaar verification exist

-- 1. Add kyc_status column (if not exists)
ALTER TABLE users ADD COLUMN IF NOT EXISTS kyc_status VARCHAR(50) DEFAULT 'pending';

-- 2. Add kyc_verified_at column (if not exists)  
ALTER TABLE users ADD COLUMN IF NOT EXISTS kyc_verified_at TIMESTAMP WITH TIME ZONE;

-- 3. Add full_name column (if not exists)
ALTER TABLE users ADD COLUMN IF NOT EXISTS full_name TEXT;

-- 4. Add date_of_birth column (if not exists)
ALTER TABLE users ADD COLUMN IF NOT EXISTS date_of_birth DATE;

-- 5. Add aadhaar_number column (if not exists)
ALTER TABLE users ADD COLUMN IF NOT EXISTS aadhaar_number TEXT UNIQUE;

-- 6. Add aadhaar_verified column (if not exists)
ALTER TABLE users ADD COLUMN IF NOT EXISTS aadhaar_verified BOOLEAN DEFAULT FALSE;

-- 7. Add location columns (if not exist)
ALTER TABLE users ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS district TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS state TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS country TEXT;

-- 8. Add bank account fields (if not exist)
ALTER TABLE users ADD COLUMN IF NOT EXISTS bank_account_number VARCHAR(20);
ALTER TABLE users ADD COLUMN IF NOT EXISTS bank_ifsc_code VARCHAR(11);
ALTER TABLE users ADD COLUMN IF NOT EXISTS bank_account_holder VARCHAR(255);

-- 9. Add PAN fields (if not exist)
ALTER TABLE users ADD COLUMN IF NOT EXISTS pan_number VARCHAR(10);
ALTER TABLE users ADD COLUMN IF NOT EXISTS pan_verified BOOLEAN DEFAULT FALSE;

-- Add useful indexes
CREATE INDEX IF NOT EXISTS idx_users_aadhaar ON users(aadhaar_number);
CREATE INDEX IF NOT EXISTS idx_users_kyc_status ON users(kyc_status);
CREATE INDEX IF NOT EXISTS idx_users_pan_number ON users(pan_number);

-- Add comments for documentation
COMMENT ON COLUMN users.kyc_status IS 'KYC verification status: pending, verified, rejected';
COMMENT ON COLUMN users.kyc_verified_at IS 'Timestamp when KYC was verified';
COMMENT ON COLUMN users.full_name IS 'Full name from Aadhaar';
COMMENT ON COLUMN users.date_of_birth IS 'Date of birth from Aadhaar';
COMMENT ON COLUMN users.aadhaar_number IS 'Verified Aadhaar number';
COMMENT ON COLUMN users.aadhaar_verified IS 'Whether Aadhaar OTP was verified';
COMMENT ON COLUMN users.city IS 'City from Aadhaar address';
COMMENT ON COLUMN users.district IS 'District from Aadhaar address';
COMMENT ON COLUMN users.state IS 'State from Aadhaar address';
COMMENT ON COLUMN users.country IS 'Country (typically India)';
COMMENT ON COLUMN users.bank_account_number IS 'Bank account for payouts';
COMMENT ON COLUMN users.bank_ifsc_code IS 'IFSC code for bank account';
COMMENT ON COLUMN users.bank_account_holder IS 'Name of bank account holder';
COMMENT ON COLUMN users.pan_number IS 'PAN card number';
COMMENT ON COLUMN users.pan_verified IS 'Whether PAN was verified';
```

**Step 3:** Execute in Supabase
1. Paste the SQL above in the SQL Editor
2. Click "RUN" button (green button)
3. Wait for completion message
4. You should see: "Query successful"

### What This Migration Does

✅ **Adds these KYC columns to `users` table:**
- `kyc_status` - Track verification status (pending/verified/rejected)
- `kyc_verified_at` - When KYC was completed
- `full_name` - Name from Aadhaar
- `date_of_birth` - DOB from Aadhaar
- `aadhaar_number` - The verified Aadhaar number
- `aadhaar_verified` - Whether OTP was verified
- `city`, `district`, `state`, `country` - Address from Aadhaar
- `bank_account_number`, `bank_ifsc_code`, `bank_account_holder` - For bank verification
- `pan_number`, `pan_verified` - For PAN verification

✅ **Creates indexes** for fast lookups on:
- `aadhaar_number`
- `kyc_status`
- `pan_number`

✅ **Safe to run multiple times** - Uses `IF NOT EXISTS` so it won't error if columns already exist

---

## After Applying Migration

### Test the Flow

1. **Go to KYC page:**
   ```
   http://localhost:3000/dashboard/stadium-owner/kyc
   ```

2. **Enter Aadhaar number:**
   - Valid 12-digit number
   - Click "Send OTP"

3. **Verify OTP:**
   - Enter 6-digit OTP from SMS
   - Click "Verify OTP"

4. **Expected Results:**
   - ✅ No 500 error
   - ✅ Success message displayed
   - ✅ Page reloads
   - ✅ Aadhaar tab shows "Verified ✓"

---

## Troubleshooting

### Still Getting "Failed to update user"?

1. **Check the migration ran successfully:**
   - Go to Supabase → Table Editor
   - Click `users` table
   - Scroll right to see if new columns exist
   - Look for: `kyc_status`, `full_name`, `date_of_birth`, etc.

2. **Check browser console for error details:**
   - Open DevTools (F12)
   - Go to Console tab
   - Check the exact error message
   - Copy and share if stuck

3. **Check server logs in Supabase:**
   - Go to Supabase Dashboard
   - Click "Logs & Analytics" → "API Logs"
   - Search for "kyc/verify-aadhaar-otp"
   - Look for error details

### If Migration Has Issues

Try a simpler version - run each column one at a time:

```sql
-- Try this one column at a time
ALTER TABLE users ADD COLUMN IF NOT EXISTS kyc_status VARCHAR(50) DEFAULT 'pending';
-- Wait for completion, then next:
ALTER TABLE users ADD COLUMN IF NOT EXISTS kyc_verified_at TIMESTAMP WITH TIME ZONE;
-- And so on...
```

---

## Why This Happens

The Aadhaar OTP verification endpoint tries to save:
1. User's KYC status
2. User's Aadhaar data (name, DOB, address)
3. Timestamp of verification

Without these columns, the database rejects the update with a 500 error.

---

## Next Steps

1. **Apply the migration** (copy-paste in Supabase SQL Editor)
2. **Refresh your browser** (clear cache if needed)
3. **Try Aadhaar verification again**
4. **It should work!** ✅

---

## Commands Reference

### Copy Migration to Clipboard (macOS):
```bash
cat /Users/bineshbalan/pcl/COMPLETE_KYC_MIGRATION.sql | pbcopy
```

Then paste in Supabase SQL Editor and click RUN.

---

**Status:** 🔴 **ACTION REQUIRED** - Apply the migration above to fix the error.

Once done, Aadhaar verification will work! 🚀
