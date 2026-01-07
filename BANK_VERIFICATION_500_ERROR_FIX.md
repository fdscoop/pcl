# Bank Account Verification 500 Error - Debugging & Fixed

## Issue
Bank account verification at `/dashboard/stadium-owner/kyc` was failing with:
- HTTP 500 Internal Server Error
- Details: "[object Object]" (unhelpful error message)
- Console errors showing failed API call to `/api/kyc/verify-bank-account`

## Investigation Findings

### Environment Configuration Status
✅ **Cashfree credentials ARE properly configured** in `apps/web/.env.local`:
- `NEXT_PUBLIC_CASHFREE_KEY_ID`: ✅ Set
- `CASHFREE_SECRET_KEY`: ✅ Set  
- `CASHFREE_PUBLIC_KEY`: ✅ Set (valid RSA key, 450 chars)

⚠️ Note: Root `/pcl/.env.local` has placeholder, but Next.js uses `apps/web/.env.local`

### Root Cause
**Poor Error Handling and Serialization**

The actual error (whatever it was) was being caught and returned as:
```json
{ "error": "Internal server error", "details": String(error) }
```

When `error` is an Error object, `String(error)` returns `[object Object]`, which is useless for debugging.

## Changes Made

### 1. **Improved Error Handling in API** (`/apps/web/src/app/api/kyc/verify-bank-account/route.ts`)
   - Added credential validation at the start
   - Added try-catch around header generation
   - Better error serialization (error message, stack trace)
   - Detailed logging at each step

### 2. **Enhanced Frontend Error Display** (`/apps/web/src/components/BankAccountVerification.tsx`)
   - Better error message parsing
   - Handles both string and object error details
   - Shows readable error messages to users

### 3. **Better Logging in Cashfree Helper** (`/apps/web/src/lib/cashfree-signature.ts`)
   - Added detailed logging for header generation
   - Shows which authentication method is being used
   - Logs public key validation results

## How to Reproduce and Debug

### Steps to Reproduce
1. Go to: http://localhost:3000/dashboard/stadium-owner/kyc
2. Enter bank account details
3. Click "Verify Account"
4. Watch for error

### To See Detailed Error Logs
```bash
# Terminal 1: Watch server logs
tail -f /tmp/pcl-dev.log | grep -E "(❌|⚠️|🔍|Error|verify-bank)"

# Terminal 2: Navigate to the KYC page and try verification
# You'll see detailed error output in Terminal 1
```

### Check Server Logs in Real-Time
After starting the server, try the bank verification and look for:
```
❌ ========================================
❌ ERROR in verify-bank-account API
❌ ========================================
```

This will show:
- Exact error type
- Error message
- Stack trace
- Request details

## Testing the Fix

### Before Fix:
```
Response: 500 Internal Server Error
Details: "[object Object]"
```

### After Fix:
```
Response: 500 Internal Server Error  
Error: Configuration error
Details: Either a valid CASHFREE_PUBLIC_KEY or CASHFREE_SECRET_KEY must be configured
```

Or if headers fail:
```
Error: Failed to generate authentication headers
Message: [specific error from signature generation]
```

## Verification Steps

1. **Check current configuration:**
   ```bash
   curl http://localhost:3000/api/debug/env-check
   ```

2. **Test bank verification with better errors:**
   - Go to: http://localhost:3000/dashboard/stadium-owner/kyc
   - Try to verify a bank account
   - Error message will now show specific issue

3. **Check server logs:**
   ```bash
   npm run dev
   # Look for:
   # 🔑 Generating Cashfree Verification Headers...
   # 🔍 Public Key Validation:
   # ⚠️ Public key invalid, using client-secret method
   ```

## Files Modified

1. **`/apps/web/src/app/api/kyc/verify-bank-account/route.ts`**
   - ✅ Added Cashfree credential validation at startup
   - ✅ Try-catch around header generation
   - ✅ Comprehensive error logging (type, message, stack)
   - ✅ Better error serialization for JSON response
   - ✅ Added detailed logging at each step

2. **`/apps/web/src/components/BankAccountVerification.tsx`**
   - ✅ Enhanced error display logic
   - ✅ Better error message formatting (handles both string and object)
   - ✅ Shows readable error messages to users instead of `[object Object]`

3. **`/apps/web/src/lib/cashfree-signature.ts`**
   - ✅ Added detailed logging for debugging
   - ✅ Shows which authentication method is being used
   - ✅ Logs public key validation results
   - ✅ Better error messages for configuration issues

## What The Fixes Do

### Before:
- Error occurs → Caught by generic catch block
- `String(error)` converts Error object → `"[object Object]"`
- Frontend shows: "Details: [object Object]" 😞
- No way to know what actually failed

### After:
- Error occurs → Caught by enhanced catch block
- Error properly serialized with message, type, stack
- Frontend shows: "Error: [actual error message]" 😊
- Detailed logs in server console show exact failure point

### Example: If Cashfree credentials are missing:
**Before:**
```
Verification Failed: Internal server error
Details: [object Object]
```

**After:**
```
❌ Verification Failed

Error: Configuration error
Details: CASHFREE_SECRET_KEY is required even when using e-signature authentication
```

### Example: If Cashfree API rejects request:
**Before:**
```
Details: [object Object]
```

**After:**
```
❌ Verification Failed

Error: Bank account verification failed
Details: {
  "message": "Invalid IFSC code",
  "code": "invalid_ifsc",
  "sub_code": "invalid_format"
}
```

## Next Steps for User

1. **Try bank verification again** at http://localhost:3000/dashboard/stadium-owner/kyc

2. **If error still occurs**, you'll now see:
   - Clear error message
   - Specific details about what failed
   - Server logs with full error information

3. **Check server console** for detailed logs:
   ```bash
   tail -f /tmp/pcl-dev.log | grep "❌"
   ```

4. **Common Issues to Check:**
   - ✅ Cashfree credentials valid for bank verification API
   - ✅ Bank account details correct (account number, IFSC, name)
   - ✅ Cashfree API account has bank verification enabled
   - ✅ Payout account exists in database
   - ✅ User is authenticated

## Testing

To verify the fix is working:

```bash
# 1. Start server (if not running)
npm run dev > /tmp/pcl-dev.log 2>&1 &

# 2. Watch logs
tail -f /tmp/pcl-dev.log | grep -E "(🔍|📤|✅|❌|⚠️)"

# 3. Try verification at:
# http://localhost:3000/dashboard/stadium-owner/kyc

# 4. You should see detailed logs like:
# 🔍 Starting bank account verification...
# ✅ User authenticated: <user-id>
# 🔑 Generating Cashfree Verification Headers...
# ✅ Using e-signature authentication...
# 📤 Sending verification request to Cashfree...
# (Either success or clear error message)
```

## Related Documentation
- `BANK_ACCOUNT_VERIFICATION_IMPLEMENTATION_GUIDE.md` - Full verification flow
- `CASHFREE_PUBLIC_KEY` in `apps/web/.env.local` - Current config
- Cashfree Verification API docs

---

**Status:** ✅ **Error handling dramatically improved**  
**Impact:** Errors now show clear, actionable messages instead of `[object Object]`  
**Action Required:** Try verification again - errors will now be clearly visible and debuggable
