# Aadhaar OTP Verification - Enhanced Error Handling & Debugging

## What Changed

### 1. **Multi-Endpoint Support** ✅
Both request and verify functions now try multiple endpoint formats automatically:
- Primary: `/kyc/aadhaar/otp/request` (v3 format)
- Fallback: `/v2/kyc/aadhaar/request_otp` (older format)
- Alternative: `/v3/kyc/aadhaar/otp/request` (explicit v3)

This handles potential endpoint changes across different Cashfree API versions.

### 2. **Enhanced Frontend Logging** ✅
The KYC page now logs detailed information to browser console:
```javascript
{
  status: 500,
  statusText: "Internal Server Error",
  data: { error: "..." }
}
```

**How to view**:
1. Open browser DevTools (F12)
2. Go to Console tab
3. When you click "Send OTP", you'll see:
   - `OTP Request Response:` - Full response from server
   - `OTP Request Error:` - If there's an error
   - Full error stack if exception occurs

### 3. **Detailed Server Logging** ✅
Server now logs each step:
```
🔑 Checking credentials:
   - Mode: production
   - Key ID present: true
   - Secret Key present: true

🔄 Trying Cashfree endpoint: https://api.cashfree.com/kyc/aadhaar/otp/request
📝 Request body: { aadhaar_number: "9012..." }

✅ Success on endpoint: https://api.cashfree.com/kyc/aadhaar/otp/request
✅ Status: 200
✅ Response: { request_id: "..." }
```

### 4. **New Test Endpoint** ✅
Check environment variables at: `GET /api/kyc/test`

Response shows:
- Current mode (sandbox/production)
- Whether credentials are loaded
- Base URL being used
- Credential preview (first 10 chars of key ID, first 15 of secret)

## How to Debug

### If You See "Failed to send OTP":

**Step 1**: Check Browser Console
```
Open DevTools (F12) → Console tab → Look for OTP Request Response
```

**Step 2**: Check Server Logs
```
Look for lines starting with:
- ❌ (Error in red)
- ⚠️ (Warning in yellow)
- ✅ (Success in green)
```

**Step 3**: Check Environment Variables
```bash
curl http://localhost:3000/api/kyc/test
```

**Step 4**: Common Errors & Solutions

| Error | Likely Cause | Solution |
|-------|-------------|----------|
| `Missing Cashfree credentials` | Env vars not loaded | Restart dev server, check `.env.local` |
| `Status 401 Unauthorized` | Invalid/expired credentials | Verify keys in Cashfree dashboard |
| `Status 404 Not Found` | Wrong endpoint path | System will try other endpoints automatically |
| `Status 400 Bad Request` | Wrong request format | Check request body in server logs |
| `Status 500 Internal Error` | Cashfree server issue | Check error details in response data |

## Testing Workflow

### 1. **Check Configuration**
```bash
curl http://localhost:3000/api/kyc/test
# Should show: { mode: "production", keyIdPresent: true, ... }
```

### 2. **Open DevTools Console**
- Press F12 → Console tab
- Keep it open while testing

### 3. **Fill Aadhaar Form**
- Enter 12-digit Aadhaar number
- Click "Send OTP"

### 4. **Check Logs**
- Browser console: Look for `OTP Request Response`
- Terminal: Look for Cashfree API logs

### 5. **Interpret Response**
- If `status: 200` + `request_id` present → Success! ✅
- If `status: 401` → Check credentials ❌
- If `status: 404` → System retrying other endpoints ⚠️
- If `status: 500` → Check `data.error` message ❌

## Alert Message Display

The white background alert shows:
1. **Error messages** if Cashfree API fails
2. **Success messages** if OTP is sent
3. **Validation errors** if input format is wrong

Example error messages:
- "This Aadhaar number is already registered with another club"
- "Invalid Aadhaar number format" (not 12 digits)
- "Failed to send OTP - Cashfree API error. Check server logs for details."
- "Club not found or unauthorized"

## Files Modified

1. `/apps/web/src/app/api/kyc/request-aadhaar-otp/route.ts`
   - Multi-endpoint retry logic
   - Enhanced credential checking
   - Detailed logging

2. `/apps/web/src/app/api/kyc/verify-aadhaar-otp/route.ts`
   - Same enhancements as above

3. `/apps/web/src/app/dashboard/club-owner/kyc/page.tsx`
   - Frontend console logging
   - Error response logging

4. `/apps/web/src/app/api/kyc/test/route.ts` (NEW)
   - Configuration test endpoint

## Next Steps if Still Failing

1. **Verify credentials are correct**
   - Log in to Cashfree merchant dashboard
   - Copy exact API Key ID and Secret from settings
   - Paste into `.env.local`
   - Restart dev server

2. **Check Cashfree account status**
   - Ensure account is active (not suspended)
   - Ensure KYC verification is enabled for your account
   - Ensure production credentials match production mode

3. **Try sandbox mode first**
   - Change `NEXT_PUBLIC_CASHFREE_MODE="sandbox"` in `.env.local`
   - Use sandbox credentials from Cashfree dashboard
   - See if it works in sandbox (might be a production credential issue)

4. **Contact Cashfree support**
   - Provide exact error response from server logs
   - Provide full endpoint URL being used
   - Provide HTTP status code and error details
