# 🔧 Fixed: Multi-Header Authentication for Cashfree KYC API

## What Changed

The API routes now try **3 different header formats** to authenticate with Cashfree:

### 1. **X-Client-Id / X-Client-Secret** (Primary)
```typescript
headers: {
  'X-Client-Id': keyId,
  'X-Client-Secret': secretKey,
  'Content-Type': 'application/json'
}
```

### 2. **X-CF-API-KEY / X-CF-API-SECRET** (Backup)
```typescript
headers: {
  'X-CF-API-KEY': keyId,
  'X-CF-API-SECRET': secretKey,
  'Content-Type': 'application/json'
}
```

### 3. **Basic Auth** (Fallback)
```typescript
headers: {
  'Authorization': `Basic ${Buffer.from(`${keyId}:${secretKey}`).toString('base64')}`,
  'Content-Type': 'application/json'
}
```

## How It Works

The system now:
1. **Tries multiple endpoints** (5 variations) - handles different API versions
2. **For each endpoint, tries all 3 header formats** - finds the right auth method
3. **Returns immediately on success** - as soon as one combination works
4. **Logs each attempt** - shows exactly what's being tried

## Testing Flow

When you click "Send OTP":

```
🔑 Checking credentials: Mode: production, Key ID present: true

🔄 Trying https://api.cashfree.com/kyc/aadhaar/otp/request
   🔐 With X-Client-Id/X-Client-Secret
   ⚠️ X-Client-Id/X-Client-Secret failed with status 404

   🔐 With X-CF-API-KEY/X-CF-API-SECRET
   ⚠️ X-CF-API-KEY/X-CF-API-SECRET failed with status 404

   🔐 With Basic Auth
   ✅ SUCCESS with Basic Auth!
      Status: 200
      Request ID: xyz123
```

## What To Expect

**Console logs will show:**
- ✅ Which header format works first
- ⚠️ Which combinations fail (with HTTP status)
- ❌ If all combinations fail

**Once working:**
- OTP will be sent successfully
- Request ID stored in database
- Frontend moves to OTP entry step
- User can enter OTP to verify

## Files Modified

1. ✅ `/apps/web/src/app/api/kyc/request-aadhaar-otp/route.ts`
   - Multi-header authentication loop
   - Tries 5 endpoints × 3 header formats = up to 15 combinations

2. ✅ `/apps/web/src/app/api/kyc/verify-aadhaar-otp/route.ts`
   - Same multi-header approach for OTP verification
   - Updates all 4 database tables on success

3. ✅ `/apps/web/src/app/dashboard/club-owner/kyc/page.tsx`
   - Frontend logging to browser console
   - Shows exact API response

## Ready to Test!

The system is now configured to handle:
- ✅ Different Cashfree API versions
- ✅ Different header authentication methods
- ✅ Different endpoint path formats
- ✅ Detailed error logging at every step

**Next step**: Test with "Send OTP" button and check:
1. Browser console (F12 → Console tab) for OTP Request Response
2. Terminal for server-side logs showing which header format works
3. If successful: you'll see OTP entry field appear
