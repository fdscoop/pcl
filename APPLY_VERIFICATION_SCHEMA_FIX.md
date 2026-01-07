# Fix Bank Account Verification Database Schema Error

## Error Details
```
PGRST204: Could not find the 'verification_details' column of 'payout_accounts' in the schema cache
```

## Root Cause
The API is trying to update a `verification_details` column that doesn't exist in the `payout_accounts` table.

## Solution

### Step 1: Apply the Migration in Supabase SQL Editor

1. Go to: https://app.supabase.com/project/_/sql/new
2. Copy and paste the content from `ADD_VERIFICATION_DETAILS_TO_PAYOUT_ACCOUNTS.sql`
3. Click "Run"

**OR** - Run this directly in Supabase SQL Editor:

```sql
-- Add verification_details column to payout_accounts
ALTER TABLE payout_accounts
ADD COLUMN IF NOT EXISTS verification_details JSONB DEFAULT NULL;

-- Add verification_id column for quick lookups
ALTER TABLE payout_accounts
ADD COLUMN IF NOT EXISTS verification_id VARCHAR(255);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_payout_accounts_verification_details 
  ON payout_accounts USING GIN(verification_details);

CREATE INDEX IF NOT EXISTS idx_payout_accounts_verification_id 
  ON payout_accounts(verification_id);
```

### Step 2: Verify the Migration

Run this in Supabase SQL Editor:

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'payout_accounts' 
ORDER BY ordinal_position;
```

You should see:
- ✅ `verification_details` (type: jsonb)
- ✅ `verification_id` (type: character varying)

### Step 3: Restart the Development Server

```bash
pkill -9 node
npm run dev
```

### Step 4: Test Bank Verification

1. Go to: http://localhost:3000/dashboard/stadium-owner/kyc
2. Try bank verification again
3. Should now work! 🎉

## What Was Added

### New Columns:
1. **`verification_details`** (JSONB)
   - Stores Cashfree verification response
   - Contains: reference_id, name_at_bank, name_match_result, account_status, etc.
   - NULL by default

2. **`verification_id`** (VARCHAR 255)
   - Stores Cashfree reference ID for quick lookups
   - Indexed for performance

### New Indexes:
1. **`idx_payout_accounts_verification_details`** (GIN index)
   - Allows efficient JSON queries
   - For searching verification details

2. **`idx_payout_accounts_verification_id`** (B-tree index)
   - Quick lookup by reference ID
   - Useful for status checking

## Files Created
- `ADD_VERIFICATION_DETAILS_TO_PAYOUT_ACCOUNTS.sql` - Migration file

## Files Modified
- `/apps/web/src/app/api/kyc/verify-bank-account/route.ts` - Now uses these columns

---

**Status:** Ready to apply  
**Impact:** Enables bank account verification to store and retrieve verification details  
**Next:** Apply SQL migration in Supabase dashboard
