# Testing Bank Account Sync Verification 🚀

## Quick Start

### Step 1: Server is Running
Dev server is running on `http://localhost:3002` (or 3000/3001 if ports are available)

### Step 2: Navigate to KYC Page
1. Go to **Settings → KYC → Bank Accounts**
2. Or directly: `http://localhost:3002/dashboard/stadium-owner/kyc`

### Step 3: Add Bank Account
Fill in the form with test bank account details:
```
Account Holder:     John Doe
Account Number:     26291800001191
IFSC Code:         YESB0000001
```

Or try any valid Indian bank account you have access to.

### Step 4: Click "Verify Now"
This will:
1. Call `/api/kyc/verify-bank-account` (POST)
2. Send request to Cashfree: `POST /verification/bank-account/sync`
3. Get instant result (1-2 seconds)
4. Display result with bank details

---

## Expected Behavior

### Console Logs (Open DevTools - F12)

When you click "Verify Now", you should see:

```
🔍 Verifying bank account with Cashfree Bank Account Sync...
📤 Sending verification request to Cashfree Sync endpoint...
✅ Bank account sync verification successful: {
  referenceId: 34,
  nameAtBank: "BHARATHTEST GKUMARUT",
  nameMatchScore: "90.00",
  accountStatus: "VALID"
}
```

### Alert Messages

**If Verified (✅):**
```
✅ Your bank account has been verified!

Bank: YES BANK
Branch: SANTACRUZ, MUMBAI
Name Match: GOOD_PARTIAL_MATCH
```

**If Failed (❌):**
```
❌ Verification Failed

The name or account details do not match our records.
Name at Bank: BHARATHTEST GKUMARUT
Account Status: INVALID
```

**If Pending Review (⏳):**
```
⏳ Your account is pending manual review.
We will verify your account shortly.
```

---

## Server Logs

Check the terminal where dev server is running (`npm run dev`):

```
@pcl/web:dev:  ✓ Compiled /api/kyc/verify-bank-account in 251ms
@pcl/web:dev: 🔍 Verifying bank account with Cashfree Bank Account Sync...
@pcl/web:dev: 📤 Sending verification request to Cashfree Sync endpoint...
@pcl/web:dev: ✅ Bank account sync verification successful: {
@pcl/web:dev:   referenceId: 34,
@pcl/web:dev:   nameAtBank: 'BHARATHTEST GKUMARUT',
@pcl/web:dev:   nameMatchScore: '90.00',
@pcl/web:dev:   accountStatus: 'VALID'
@pcl/web:dev: }
@pcl/web:dev: POST /api/kyc/verify-bank-account 200 in 1234ms
```

---

## Database Check

After verification, check the database:

```sql
SELECT 
  id,
  account_number,
  verification_status,
  verification_method,
  verification_id,
  verified_at,
  verification_details
FROM payout_accounts
WHERE user_id = 'YOUR_USER_ID'
ORDER BY created_at DESC;
```

You should see:
- `verification_status`: 'verified' | 'failed' | 'pending_review'
- `verification_method`: 'cashfree_bank_sync'
- `verification_id`: reference_id from response (e.g., '34')
- `verified_at`: timestamp (if verified)
- `verification_details`: Full JSON response with bank info

---

## Differences from Before

### Old Flow (Penny Drop) ❌
```
POST /api/kyc/verify-bank-account
  → GET /verification/remitter/status (Cashfree)
  → POST /verification/reverse-penny-drop (Cashfree)
  → Return payment links to user
  → User pays ₹1
  → Frontend polls for status
  → Eventually verified

Logs showed:
  "Step 1: Getting verification context..."
  "Step 1 failed - Initiate penny drop error..."
```

### New Flow (Bank Sync) ✅
```
POST /api/kyc/verify-bank-account
  → POST /verification/bank-account/sync (Cashfree)
  → Get instant result
  → Update database immediately
  → Return result to user

Logs show:
  "🔍 Verifying bank account with Cashfree Bank Account Sync..."
  "📤 Sending verification request to Cashfree Sync endpoint..."
  "✅ Bank account sync verification successful"
```

---

## Common Issues

### Issue 1: Still Seeing Old "Penny Drop" Logs
**Solution:** Hard refresh browser cache
```
Ctrl+Shift+R (Windows/Linux)
Cmd+Shift+R (Mac)
```

### Issue 2: "Reverse Penny Drop is not enabled"
**Expected behavior** - This is what we're trying to avoid!
If you see this error:
1. The dev server didn't reload properly
2. Kill the server: `pkill -f "next dev"`
3. Restart: `npm run dev`
4. Clear browser cache
5. Try again

### Issue 3: No Response / Timeout
Possible causes:
1. Server not running (port 3000/3001/3002 not available)
2. Cashfree credentials not set in `.env.local`
3. Network issue

Check: `echo $NEXT_PUBLIC_CASHFREE_KEY_ID` (should show API key)

### Issue 4: 401 Unauthorized
**Problem:** You're not logged in
**Solution:** 
1. Log out: Go to Settings → Sign Out
2. Log in with your credentials
3. Try again

---

## Testing Different Scenarios

### Test 1: Valid Account (Should Verify)
```
Name: Match the account holder name exactly
Account: Valid account number
IFSC: Valid IFSC code for your bank
```
**Expected Result:** ✅ Verified

### Test 2: Invalid Name (Should Fail)
```
Name: Different name than on account
Account: Valid account number
IFSC: Valid IFSC code
```
**Expected Result:** ❌ Failed - "Name does not match"

### Test 3: Invalid Account (Should Fail)
```
Name: Any name
Account: Invalid/closed account number
IFSC: Valid IFSC code
```
**Expected Result:** ❌ Failed - "Account invalid/closed"

### Test 4: Name Variation (Should Succeed)
```
Name: "John Doe" (on account: "JOHN DOE" or "Doe, John")
Account: Valid
IFSC: Valid
```
**Expected Result:** ✅ Verified - GOOD_PARTIAL_MATCH

---

## Files Modified

1. **`/apps/web/src/app/api/kyc/verify-bank-account/route.ts`**
   - Switched from Penny Drop to Bank Sync
   - Single API call instead of two
   - Simple headers (no RSA signature)
   - Instant response handling

2. **`/apps/web/src/components/BankAccountVerification.tsx`**
   - Updated `handleVerifyAccount()` function
   - Better error messages with bank details
   - Alerts showing verification result
   - Improved console logging with emojis

---

## What's Not Needed Anymore

❌ **Removed/Not Used:**
- `/api/kyc/check-bank-verification` endpoint (polling)
- Payment links (UPI QR codes)
- User paying ₹1
- Polling mechanism
- RSA signature generation
- `getCashfreeVerificationHeaders()` function

---

## Summary

✅ **Bank Account Verification Now Uses Cashfree Bank Account Sync**
- Instant results (1-2 seconds)
- No payment needed
- Simple single API call
- NBIN database backed
- Name matching with score
- Better error messages

🚀 **Ready to test!** Navigate to KYC page and verify a bank account.

---

## Troubleshooting Commands

```bash
# Check if dev server is running
lsof -i :3000 | grep -v COMMAND

# Kill dev server
pkill -f "next dev"

# Start fresh
cd /Users/bineshbalan/pcl && npm run dev

# Check environment variables
grep -E "CASHFREE|SUPABASE" .env.local

# Monitor API logs
tail -f /var/log/app.log  # if you have logging
```

---

## Next Steps

After testing Bank Account Sync, you can:

1. **PAN Verification** - Similar flow for PAN cards
2. **Document Upload** - KYC documents (Aadhar, PAN)
3. **Payment Activation** - Activate payout once verified
4. **Multi-Account Support** - Handle multiple verified accounts

See: `/CASHFREE_BANK_ACCOUNT_SYNC_VERIFICATION.md` for complete API reference
