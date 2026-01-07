# Bank Account Verification - Complete Fix Checklist

## 🔴 Current Error
```
PGRST204: Could not find the 'verification_details' column of 'payout_accounts' in the schema cache
```

This means the database schema is missing required columns for storing bank verification details.

---

## ✅ Fix Checklist

### Step 1: Apply Database Migration
**Status: REQUIRED ⚠️**

1. Open Supabase Dashboard: https://app.supabase.com
2. Go to your project
3. Navigate to: **SQL Editor** → **New Query**
4. Copy this SQL:

```sql
-- Add verification_details and verification_id columns
ALTER TABLE payout_accounts
ADD COLUMN IF NOT EXISTS verification_details JSONB DEFAULT NULL;

ALTER TABLE payout_accounts
ADD COLUMN IF NOT EXISTS verification_id VARCHAR(255);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_payout_accounts_verification_details 
  ON payout_accounts USING GIN(verification_details);

CREATE INDEX IF NOT EXISTS idx_payout_accounts_verification_id 
  ON payout_accounts(verification_id);
```

5. Click **Run**
6. Wait for success message ✅

**Verify migration:**
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'payout_accounts' 
ORDER BY ordinal_position;
```

Should show:
- ✅ verification_details (jsonb)
- ✅ verification_id (character varying)
- ✅ All other existing columns

---

### Step 2: Restart Development Server
**Status: REQUIRED ⚠️**

```bash
# Terminal
pkill -9 node
npm run dev
```

Wait for: `✓ Ready in 2000ms`

---

### Step 3: Test Bank Verification
**Status: VERIFY 🧪**

1. Open: http://localhost:3000/dashboard/stadium-owner/kyc
2. Add a test bank account:
   - Account Holder: Test User
   - Account Number: 9876543210123
   - IFSC Code: HDFC0000123
3. Click "Verify Account"
4. Expected result:
   - ✅ Verification completes (success or clear error)
   - ✅ No "PGRST204" error
   - ✅ Clear error message shown

---

### Step 4: Check Server Logs
**Status: DIAGNOSTIC 🔍**

In another terminal:
```bash
tail -f /tmp/pcl-dev.log | grep -E "(verification|❌|✅|Error)"
```

Expected logs:
```
🔍 Starting bank account verification...
✅ User authenticated: <user-id>
🔑 Generating Cashfree Verification Headers...
✅ Using e-signature authentication...
📤 Sending verification request to Cashfree...
```

---

## 📋 What Changed

### Database Schema Updates:
```sql
-- NEW COLUMN 1: verification_details (JSONB)
ALTER TABLE payout_accounts
ADD COLUMN IF NOT EXISTS verification_details JSONB;

-- NEW COLUMN 2: verification_id (VARCHAR)
ALTER TABLE payout_accounts
ADD COLUMN IF NOT EXISTS verification_id VARCHAR(255);

-- NEW INDEX 1: GIN index for JSON queries
CREATE INDEX idx_payout_accounts_verification_details 
ON payout_accounts USING GIN(verification_details);

-- NEW INDEX 2: B-tree index for quick lookups
CREATE INDEX idx_payout_accounts_verification_id 
ON payout_accounts(verification_id);
```

### API Changes:
- ✅ Better error handling for schema errors
- ✅ Detects if verification_details column is missing
- ✅ Provides clear error message with migration instructions
- ✅ Still works if column doesn't exist (backward compatible)

### Frontend Changes:
- ✅ Better error message display
- ✅ Shows detailed error information instead of `[object Object]`

---

## 🆘 Troubleshooting

### Issue: "PGRST204" error persists after migration
**Solution:**
1. Check migration ran successfully in Supabase SQL Editor
2. Verify columns exist: Run verification SQL query above
3. Check you're using correct Supabase project
4. Try restarting dev server: `pkill -9 node && npm run dev`

### Issue: "403 Forbidden" from Supabase
**Solution:**
1. Make sure you're logged into correct Supabase account
2. Check you have editor role in project settings
3. Try refreshing Supabase dashboard

### Issue: Bank verification still fails after fix
**Solution:**
1. Check Cashfree credentials in `apps/web/.env.local`
2. Verify account details (IFSC code, account number format)
3. Check Cashfree API is enabled for your account
4. See: `BANK_VERIFICATION_500_ERROR_FIX.md`

---

## 📊 Success Indicators

✅ Migration completed in Supabase  
✅ Columns exist in database (verified)  
✅ Dev server restarted  
✅ No "PGRST204" error on verification  
✅ Clear error messages displayed  
✅ Server logs show verification flow  

---

## 📁 Related Files

- **Migration file:** `ADD_VERIFICATION_DETAILS_TO_PAYOUT_ACCOUNTS.sql`
- **API Route:** `apps/web/src/app/api/kyc/verify-bank-account/route.ts`
- **Component:** `apps/web/src/components/BankAccountVerification.tsx`
- **Full guide:** `BANK_VERIFICATION_500_ERROR_FIX.md`

---

## ⏱️ Time Required

- Migration: < 1 minute
- Restart: < 30 seconds
- Testing: 2-3 minutes
- **Total: ~5 minutes**

---

**Next Action: Apply the SQL migration in Supabase Dashboard →**
