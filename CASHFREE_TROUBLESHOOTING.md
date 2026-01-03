# Cashfree API Troubleshooting Guide

## Current Setup
- **Mode**: Production (`NEXT_PUBLIC_CASHFREE_MODE=production`)
- **Base URL**: `https://api.cashfree.com`
- **Endpoints**:
  - Request OTP: `https://api.cashfree.com/kyc/aadhaar/otp/request`
  - Verify OTP: `https://api.cashfree.com/kyc/aadhaar/otp/verify`
- **Authentication**: HTTP Basic Auth

## Common Issues & Solutions

### 1. **404 Error**
**Cause**: Endpoint path is wrong or doesn't exist
**Solution**: Try these alternative endpoints:
```
- /v2/kyc/aadhaar/request_otp
- /v3/kyc/aadhaar/request_otp
- /kyc/aadhaar/request_otp (with underscore instead of /otp/)
- /kyc/aadhaar/otp/request (current)
```

### 2. **401 Unauthorized**
**Cause**: Credentials are invalid, expired, or authentication method is wrong
**Solution**:
- Verify credentials in `.env.local`
- Check if Basic Auth is the correct method (might need custom headers)
- Ensure credentials are for production, not sandbox

### 3. **400 Bad Request**
**Cause**: Request payload format is wrong
**Solution**: Try these field variations:
```javascript
// Current format
{ aadhaar_number: "123456789012", consent: "Y" }

// Alternative formats
{ aadhaar: "123456789012", consent: "Y" }
{ aadhaarNumber: "123456789012", consent: "Y" }
```

### 4. **500 Internal Server Error**
**Cause**: Server-side issue with credentials or API processing
**Solution**:
- Check server logs for detailed error message
- Verify credentials are correct
- Try sandbox mode first to isolate the issue

## Debugging Steps

1. **Check Environment Variables**
   ```bash
   curl http://localhost:3000/api/kyc/test
   ```

2. **Check Server Logs**
   - Look for: `Cashfree OTP request error details:`
   - Check status, statusText, response data

3. **Test with cURL**
   ```bash
   curl -X POST https://api.cashfree.com/kyc/aadhaar/otp/request \
     -H "Authorization: Basic YOUR_BASE64_CREDS" \
     -H "Content-Type: application/json" \
     -d '{"aadhaar_number":"123456789012","consent":"Y"}'
   ```

## Next Steps if Still Failing

1. Contact Cashfree support with the exact error response
2. Verify credentials on Cashfree merchant dashboard
3. Check Cashfree API documentation for your account type
4. Try sandbox mode with sandbox credentials first
