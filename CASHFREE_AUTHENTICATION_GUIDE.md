# Cashfree API Authentication Guide

## Two Different Authentication Methods

Cashfree uses different authentication for different API products:

### 1. Payouts API (Money Transfer)
**Requires:** RSA Signature with Public Key

```typescript
Headers:
- x-client-id: YOUR_CLIENT_ID
- x-cf-signature: ENCRYPTED_SIGNATURE
- x-api-version: 2022-09-01
```

**Signature Generation:**
```typescript
// 1. Create string: clientId + "." + epochTimestamp
const data = `${clientId}.${Math.floor(Date.now() / 1000)}`

// 2. Encrypt with RSA-OAEP-SHA1 using Cashfree public key
const encrypted = crypto.publicEncrypt({
  key: publicKey,
  padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
  oaepHash: 'sha1'
}, Buffer.from(data))

// 3. Base64 encode
const signature = encrypted.toString('base64')
```

### 2. Verification API (Aadhaar/KYC)
**Requires:** Client ID + Client Secret (Direct Authentication)

```typescript
Headers:
- x-client-id: YOUR_CLIENT_ID
- x-client-secret: YOUR_CLIENT_SECRET
- x-api-version: 2022-09-01
```

**No signature required for Verification API!**

## Current Implementation Status

### ✅ Verification API (What you're using)
Your current implementation is **CORRECT** for the Verification API:

```typescript
// apps/web/src/app/api/kyc/request-aadhaar-otp/route.ts
headers: {
  'Content-Type': 'application/json',
  'x-client-id': keyId,
  'x-client-secret': secretKey,
  'x-api-version': '2022-09-01'
}
```

### 📝 Signature Utility (For future use)
Created [cashfree-signature.ts](apps/web/src/lib/cashfree-signature.ts) with RSA signature generation for when/if you need Payouts API.

## IP Whitelisting vs Signature

These are **TWO SEPARATE SECURITY LAYERS**:

### IP Whitelisting (Required for Verification API)
- ✅ Prevents unauthorized servers from accessing API
- ❌ Still required even with signature
- 📍 Solution: Deploy on server with static IP

### Signature (Required for Payouts API ONLY)
- ✅ Prevents request tampering
- ✅ No IP whitelisting needed for Payouts
- 🔑 Uses RSA public key encryption

## Documentation Links

1. **Payouts API (with signature):**
   https://www.cashfree.com/docs/api-reference/payouts/v1/getting-started-with-payouts-apis#generate-signature

2. **Verification API (no signature, needs IP):**
   https://docs.cashfree.com/docs/verification-api
   https://docs.cashfree.com/reference/aadhaar-verification-api

## What You Need to Do

### For Verification API (Current Use Case):
1. ✅ Use `x-client-id` and `x-client-secret` headers (already done)
2. ❌ **NO signature needed**
3. ⚠️ **YES IP whitelisting needed**
4. 🚀 Solution: Deploy on AWS/DO with static IP

### If You Later Need Payouts API:
1. ✅ Use signature generation utility already created
2. ✅ Get public key from Cashfree dashboard
3. ✅ Store public key in environment variables
4. ❌ **NO IP whitelisting needed** for Payouts

## Environment Variables

### Current (Verification API):
```bash
NEXT_PUBLIC_CASHFREE_KEY_ID=your_client_id
CASHFREE_SECRET_KEY=your_client_secret
```

### Future (If using Payouts API):
```bash
CASHFREE_CLIENT_ID=your_client_id
CASHFREE_PUBLIC_KEY="-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA...
-----END PUBLIC KEY-----"
```

## Testing Without IP Whitelisting

Unfortunately, **there's no way around IP whitelisting** for the Verification API. Options:

### Option 1: Whitelist Your Development IP (Temporary)
```bash
# Get your public IP
curl ifconfig.me

# Add to Cashfree dashboard → Settings → IP Whitelisting
```

### Option 2: Use ngrok (Temporary for testing)
```bash
# Install ngrok
npm install -g ngrok

# Start your app
npm run dev

# Create tunnel (in another terminal)
ngrok http 3000

# Whitelist the ngrok IP shown in output
```

### Option 3: Production Deployment (Permanent)
- Deploy on AWS EC2 with Elastic IP
- Deploy on Digital Ocean with Reserved IP
- Whitelist that single IP

## Common Errors & Solutions

### Error: "IP not whitelisted"
**Problem:** Your server IP is not in Cashfree's whitelist
**Solution:** Add your server's public IP in Cashfree dashboard

### Error: "Invalid signature"
**Problem:** Using signature for Verification API (not needed!)
**Solution:** Remove signature, use client-secret instead

### Error: "Unauthorized"
**Problem:** Wrong credentials or environment (test vs production)
**Solution:** Verify credentials match the environment

## Summary

| Feature | Verification API | Payouts API |
|---------|-----------------|-------------|
| **Auth Method** | x-client-id + x-client-secret | x-client-id + x-cf-signature |
| **Signature Required** | ❌ No | ✅ Yes (RSA) |
| **IP Whitelisting** | ✅ Required | ❌ Not required |
| **Your Status** | ✅ Implemented correctly | 📝 Utility ready if needed |

## Next Steps

1. ✅ **Code is correct** - No changes needed for Verification API
2. ⏳ **Choose deployment platform** - AWS EC2 or Digital Ocean
3. 🔧 **Deploy with static IP** - One-time setup
4. ✅ **Whitelist production IP** - In Cashfree dashboard
5. 🚀 **Test with real users** - Will work globally

The signature generation code you shared is for **Payouts API**, not **Verification API**. Your current implementation for Aadhaar verification is already correct!
