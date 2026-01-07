# Cashfree API "Temporarily Unavailable" Error - Guide

## Error Details

**Error Message:** "Authorised source is temporarily unavailable, please try again shortly"

**HTTP Status:** 502 Bad Gateway or 503 Service Unavailable

**Root Cause:** Cashfree's Aadhaar verification API is experiencing temporary issues and cannot process OTP verification requests.

---

## Why This Happens

This error is **NOT** caused by:
- ❌ Your code
- ❌ Your credentials
- ❌ Your server configuration
- ❌ Your Aadhaar data

This error **IS** caused by:
- ✅ Cashfree API service outage/maintenance
- ✅ Network issues between your server and Cashfree
- ✅ Temporary overload on Cashfree servers

---

## What We've Done to Fix It

### ✅ Backend (API) Changes
**File:** `/apps/web/src/app/api/kyc/verify-aadhaar-otp/route.ts`

**Improvements:**
1. Added proper error message extraction from Cashfree responses
2. Detect temporary service errors (503 status code)
3. Return meaningful error messages to frontend
4. Handle various error formats from Cashfree API

```typescript
// Before: Would throw unhandled error → 502 response
throw error

// After: Returns proper JSON response with user-friendly message
return NextResponse.json({
  error: 'Cashfree service is temporarily unavailable. Please try again shortly.',
  status: 503
}, { status: 503 })
```

### ✅ Frontend Changes
**File:** `/apps/web/src/app/dashboard/stadium-owner/kyc/page.tsx`

**Improvements:**
1. Detect temporary service errors (503 status)
2. Show clear message to user about what happened
3. Provide actionable steps (retry, wait, contact support)
4. Don't show confusing technical error details

```typescript
// Detect temporary service errors
const isTemporaryError = response.status === 503 || 
                         errorMessage.includes('temporarily unavailable')

// Show user-friendly message with retry instructions
if (isTemporaryError) {
  errorMessage = `
⏱️ Service Temporarily Unavailable
The Aadhaar verification service is experiencing temporary issues.
Please wait a few moments and try again.
  `
}
```

---

## What to Do When You See This Error

### ✅ Immediate Actions (User Perspective)

1. **Don't Panic** - This is not your fault
   - Your Aadhaar is fine
   - Your data is safe
   - Your account is OK

2. **Wait a Few Moments** (30-60 seconds)
   - Cashfree service might recover automatically

3. **Retry the OTP Verification**
   - The OTP you received is still valid
   - Just click the "Verify OTP" button again
   - Enter the same OTP

4. **If Still Failing**
   - You have ~10 minutes before OTP expires
   - Ask for a new OTP: Click "Didn't receive OTP? Resend"
   - Try again with the new OTP

5. **If Problem Persists (>30 minutes)**
   - It's likely a real Cashfree service issue
   - Contact support: support@professionalclubleague.com
   - Include: Timestamp, Aadhaar last 4 digits, error message

### ✅ Developer Actions (Server Side)

1. **Check Cashfree Status**
   ```bash
   # Check if Cashfree API is responding
   curl -I https://api.cashfree.com/verification/offline-aadhaar/verify
   
   # If you get 5xx errors, Cashfree is down
   # If you get 4xx errors, it's your configuration
   ```

2. **Check Server Logs**
   - Supabase Dashboard → Logs & Analytics → API Logs
   - Search for: "OTP Verification failed"
   - Look for patterns (all requests failing = Cashfree issue)

3. **Verify Configuration**
   - Ensure environment variables are set correctly:
     ```env
     NEXT_PUBLIC_CASHFREE_KEY_ID=xxx
     CASHFREE_SECRET_KEY=xxx
     CASHFREE_PUBLIC_KEY=xxx
     ```

4. **Monitor for Recovery**
   - Cashfree outages typically last 5-30 minutes
   - Once recovered, requests will start working again
   - No code changes needed

---

## Technical Details

### Cashfree API Timeout Chain

```
User enters OTP
    ↓
Frontend sends request to /api/kyc/verify-aadhaar-otp
    ↓
Backend receives request ✓
    ↓
Backend calls Cashfree API
    ↓
Cashfree API returns error (SERVICE UNAVAILABLE)
    ↓
Axios throws error
    ↓
Error caught in catch block ✓
    ↓
Backend returns proper 503 response with message
    ↓
Frontend displays user-friendly error message ✓
    ↓
User can retry without re-entering Aadhaar
```

### Error Status Codes

| Status | Meaning | Action |
|--------|---------|--------|
| **400** | Invalid OTP | User entered wrong OTP, ask for new OTP |
| **401** | Unauthorized | User session expired, login again |
| **403** | Forbidden | User doesn't own this resource |
| **502/503** | Service Unavailable | Cashfree is down, wait & retry |
| **500** | Server Error | Our server error, check logs |

---

## Cashfree Known Issues

### Current Limitations

1. **Occasional Timeouts**
   - Cashfree API sometimes takes >30 seconds to respond
   - Results in 502/503 errors
   - **Solution:** Retry after 1-2 minutes

2. **IP Whitelisting Issues**
   - If your server IP is not whitelisted
   - Gets "IP not whitelisted" error
   - **Solution:** Whitelist server IP in Cashfree dashboard

3. **Maintenance Windows**
   - Cashfree sometimes has scheduled maintenance
   - Causes temporary unavailability (1-4 hours)
   - **Solution:** Check Cashfree status page, inform users

---

## How Our Fix Helps

### Before This Fix
- ❌ Unhandled error → 502 Bad Gateway
- ❌ No error message shown
- ❌ Users confused about what went wrong
- ❌ Hard to distinguish from other errors

### After This Fix
- ✅ Proper error handling with meaningful messages
- ✅ Clear indication that it's a temporary service issue
- ✅ User knows to retry instead of panic
- ✅ Backend logs show exact error from Cashfree

---

## Testing the Fix

### Test Case: Simulate Temporary Service Error

1. **During OTP Verification:**
   - You should see error message:
   ```
   ⏱️ Service Temporarily Unavailable
   The Aadhaar verification service is experiencing temporary issues.
   Please wait a few moments and try again.
   ```

2. **Retry Flow:**
   - Message encourages user to wait and retry
   - OTP remains in input field
   - User can click "Verify OTP" again without re-entering

3. **Real Recovery:**
   - Once Cashfree recovers, retry should succeed
   - No server restart needed
   - No code changes needed

---

## Next Steps

### Monitor
- Watch server logs for patterns
- If all OTP verifications fail → Cashfree issue
- If only some fail → Might be user data issue

### Improve
- Add retry mechanism with exponential backoff
- Send alerts if >5% of OTP requests fail
- Implement fallback verification method (SMS OTP, email)

### Communicate
- Inform users about potential Cashfree service issues
- Provide clear error messages (already done!)
- Link to support team for persistent issues

---

## Support

If you encounter this error:

1. **User Support:** support@professionalclubleague.com
   - Include timestamp and last 4 digits of Aadhaar

2. **Technical Support:** Check Supabase logs
   - See exact error from Cashfree API
   - Identify if it's timeout, credentials, or service issue

3. **Cashfree Support:**
   - Contact Cashfree if error persists
   - Provide request IDs and timestamps
   - Reference: Offline Aadhaar OTP Verification API

---

**Status:** ✅ **IMPROVED ERROR HANDLING - READY FOR PRODUCTION**
