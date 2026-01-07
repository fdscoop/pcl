# Bank Account Verification - PGRST204 Schema Error FIX

## 🔴 Error Message
```
Verification Failed

Error:
{"code":"PGRST204","details":null,"hint":null,"message":"Could not find the 'verification_details' column of 'payout_accounts' in the schema cache"}

Details:
{
  "code": "PGRST204",
  "details": null,
  "hint": null,
  "message": "Could not find the 'verification_details' column of 'payout_accounts' in the schema cache"
}
```

---

## 🎯 Root Cause

The `payout_accounts` table is missing two required columns for bank verification:

1. **`verification_details`** (JSONB) - Stores Cashfree verification response
2. **`verification_id`** (VARCHAR) - Stores Cashfree reference ID for lookups

---

## ✅ QUICK FIX (5 minutes)

### Step 1: Open Supabase SQL Editor

1. Go to: https://app.supabase.com
2. Select your project
3. Click: **SQL Editor** → **New Query**

### Step 2: Copy & Run Migration

Copy this SQL and run it:

```sql
-- Add missing columns to payout_accounts table
ALTER TABLE payout_accounts
ADD COLUMN IF NOT EXISTS verification_details JSONB DEFAULT NULL;

ALTER TABLE payout_accounts
ADD COLUMN IF NOT EXISTS verification_id VARCHAR(255);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_payout_accounts_verification_details 
  ON payout_accounts USING GIN(verification_details);

CREATE INDEX IF NOT EXISTS idx_payout_accounts_verification_id 
  ON payout_accounts(verification_id);
```

**Expected Result:** `Query executed successfully` ✅

### Step 3: Verify Migration

Run this verification query:

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'payout_accounts' 
ORDER BY ordinal_position;
```

**You should see these new columns:**
- ✅ `verification_details` (jsonb)
- ✅ `verification_id` (character varying)

### Step 4: Restart Dev Server

```bash
pkill -9 node
npm run dev
```

### Step 5: Test It

1. Go to: http://localhost:3000/dashboard/stadium-owner/kyc
2. Try bank verification
3. Should work now! 🎉

---

## 📊 What Gets Stored

### `verification_details` (JSONB Object)
```json
{
  "reference_id": "12345",
  "name_at_bank": "John Doe",
  "bank_name": "HDFC Bank",
  "name_match_score": "95",
  "name_match_result": "GOOD_MATCH",
  "account_status": "VALID",
  "city": "Mumbai",
  "branch": "Marine Drive",
  "ifsc_details": {
    "bank": "HDFC Bank",
    "ifsc": "HDFC0000001",
    "branch": "Marine Drive",
    "city": "Mumbai",
    "state": "Maharashtra"
  }
}
```

### `verification_id` (Text)
- Stores reference ID from Cashfree
- Allows quick lookups
- Example: "12345"

---

## 🔍 How It Works

### Before Migration (❌ Error)
```
API tries to update verification_details
→ Column doesn't exist
→ PGRST204 error
→ User sees: "Error: [object Object]"
```

### After Migration (✅ Works)
```
API tries to update verification_details
→ Column exists
→ JSONB data stored successfully
→ User sees: "✅ Account verified!" or clear error message
```

---

## 📁 Related Files

- **API:** `apps/web/src/app/api/kyc/verify-bank-account/route.ts`
- **Component:** `apps/web/src/components/BankAccountVerification.tsx`
- **Migration:** `ADD_VERIFICATION_DETAILS_TO_PAYOUT_ACCOUNTS.sql`
- **Checklist:** `BANK_VERIFICATION_SCHEMA_FIX_CHECKLIST.md`

---

## 🆘 Troubleshooting

| Issue | Solution |
|-------|----------|
| "PGRST204" still appears | Verify migration ran in Supabase; check columns exist; restart dev server |
| Can't access Supabase SQL | Login to https://app.supabase.com; select correct project |
| Columns don't show in query | Try running: `TRUNCATE TABLE information_schema.schemata; ANALYZE;` |
| Dev server won't start | Kill processes: `pkill -9 node`; then `npm run dev` |

---

## ✨ Code Changes

The API was already updated to handle this gracefully:

```typescript
// If verification_details column doesn't exist yet, 
// the API detects it and provides helpful error message
if (updateError.message?.includes('verification_details')) {
  return NextResponse.json(
    { 
      error: 'Database schema error', 
      message: 'Bank verification database schema needs update',
      details: 'Run migration: ADD_VERIFICATION_DETAILS_TO_PAYOUT_ACCOUNTS.sql'
    },
    { status: 500 }
  )
}
```

---

## 📋 Complete Status

| Item | Status | Notes |
|------|--------|-------|
| Error identified | ✅ Complete | PGRST204 schema error |
| Root cause found | ✅ Complete | Missing columns |
| Migration created | ✅ Complete | `ADD_VERIFICATION_DETAILS_TO_PAYOUT_ACCOUNTS.sql` |
| API updated | ✅ Complete | Better error handling |
| Ready to apply | ✅ Ready | Follow 5-minute fix above |

---

**Next: Apply the SQL migration in Supabase Dashboard** →
