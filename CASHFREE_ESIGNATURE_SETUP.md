# Cashfree E-Signature Authentication Setup

## Problem: IP Whitelisting Error

When using Cashfree Verification API, you may encounter this error:

```
IP_NOT_WHITELISTED: Your server IP needs to be whitelisted in Cashfree dashboard
```

**Why this happens:**
- Cashfree requires either IP whitelisting OR e-signature authentication
- IP whitelisting only works for fixed server IPs
- In serverless environments (Vercel, AWS Lambda), IPs change dynamically
- Users accessing from different IPs cannot be whitelisted

**Solution:** Use **E-Signature Authentication** instead of IP whitelisting.

---

## How E-Signature Authentication Works

Instead of whitelisting IPs, Cashfree accepts RSA-encrypted signatures:

1. **Generate Signature**: Encrypt `clientId.epoch` using Cashfree's public key
2. **Send in Header**: Include `x-cf-signature` instead of `x-client-secret`
3. **Works from Any IP**: No IP restrictions

---

## Setup Instructions

### Step 1: Get Your Cashfree Public Key

1. Log in to **Cashfree Dashboard**
2. Navigate to **Developers** → **API Keys**
3. Download your **Public Key PEM file** (e.g., `verification_public_key.pem`)
4. Open the file and copy the FULL content including BEGIN/END lines:

```
-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAuTeLSSgPYx2DpdXiufpB
TDQf+QKBiAwDYcPZHl6phqjjx2CVpwI/BHdraywh8b07Q8V0wXhzA1UVT64xY+Yf
...
-----END PUBLIC KEY-----
```

### Step 2: Add to Environment Variables

Update your `.env.local` file:

```bash
# Cashfree Credentials
NEXT_PUBLIC_CASHFREE_KEY_ID="CF435412D4AL97MJR8BC73EJNPEG"

# Option 1: Use E-Signature (Recommended - works from any IP)
CASHFREE_PUBLIC_KEY="-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAuTeLSSgPYx2DpdXiufpB
TDQf+QKBiAwDYcPZHl6phqjjx2CVpwI/BHdraywh8b07Q8V0wXhzA1UVT64xY+Yf
V9+qI6ja8wb0Q3UABIxpKpX95ZVLuZhBCRtwFNudoOjfJ9apIGR3EsGKA9whjEWo
3M4+QyD7Yp/0ZB3reBeeJVzDlxj2+oDqrsnbPBdgSDpO+PC5l2eIFDiuCx4UA2jr
9iyIbxHolGih7Bjna553HJezCYWjEqFSy6I7raj4RwvURckIE3+YvW50k2EHCJNY
WGj1lH3qOo9p+rQAynFtE6Iq+Rx2L8W1QFueu02iU3yQCuL2bQDZSKn1E2MuqcRG
zQIDAQAB
-----END PUBLIC KEY-----"

# Option 2: Use Client Secret (Only if IP is whitelisted)
# CASHFREE_SECRET_KEY="your_secret_key"
```

**Important Notes:**
- The public key must include `-----BEGIN PUBLIC KEY-----` and `-----END PUBLIC KEY-----`
- Preserve all line breaks and formatting
- Use double quotes to wrap multi-line values

### Step 3: Deploy to Vercel

Add the environment variable to Vercel:

1. Go to your Vercel project
2. Navigate to **Settings** → **Environment Variables**
3. Add `CASHFREE_PUBLIC_KEY` with the full PEM content
4. Redeploy your application

---

## How It Works in Code

### Authentication Priority

The system automatically chooses the best authentication method:

```typescript
// 1. Prefers E-Signature (if PUBLIC_KEY is set)
if (publicKey) {
  headers['x-cf-signature'] = generateSignature(clientId, publicKey)
}

// 2. Falls back to Client Secret (if IP is whitelisted)
else if (secretKey) {
  headers['x-client-secret'] = secretKey
}
```

### Signature Generation

The signature is generated using RSA-OAEP encryption:

```typescript
import { generateCashfreeSignature } from '@/lib/cashfree-signature'

// Generate signature
const { epoch, signature } = generateCashfreeSignature(clientId, publicKeyPem)

// Use in headers
const headers = {
  'x-client-id': clientId,
  'x-cf-signature': signature,
  'x-api-version': '2022-09-01'
}
```

### Encryption Details

- **Algorithm**: RSA-OAEP with SHA-1
- **Payload**: `clientId.epochTimestamp` (e.g., `CF123.1704326400`)
- **Output**: Base64-encoded encrypted bytes

Matches Cashfree's Java requirement:
```java
Cipher.getInstance("RSA/ECB/OAEPWithSHA-1AndMGF1Padding")
```

---

## Updated API Routes

All KYC API routes now support e-signature:

### Player KYC
- [apps/web/src/app/api/kyc/player/generate-otp/route.ts](apps/web/src/app/api/kyc/player/generate-otp/route.ts)
- [apps/web/src/app/api/kyc/player/verify-otp/route.ts](apps/web/src/app/api/kyc/player/verify-otp/route.ts)

### Club KYC
- [apps/web/src/app/api/kyc/request-aadhaar-otp/route.ts](apps/web/src/app/api/kyc/request-aadhaar-otp/route.ts)
- [apps/web/src/app/api/kyc/verify-aadhaar-otp/route.ts](apps/web/src/app/api/kyc/verify-aadhaar-otp/route.ts)

---

## Testing

### Test E-Signature Authentication

1. Add `CASHFREE_PUBLIC_KEY` to `.env.local`
2. Remove `CASHFREE_SECRET_KEY` (if present)
3. Run the application:
   ```bash
   npm run dev
   ```
4. Try to generate OTP for KYC verification
5. Check console logs:
   ```
   🔐 Generating Aadhaar OTP with Cashfree...
   📝 Using e-signature authentication (x-cf-signature)
   ✅ OTP Generation successful!
   ```

### Verify Headers

The request should include:
```json
{
  "x-client-id": "CF435412D4AL97MJR8BC73EJNPEG",
  "x-cf-signature": "dGVzdC1lbmNyeXB0ZWQtc2lnbmF0dXJl...",
  "x-api-version": "2022-09-01"
}
```

**NOT:**
```json
{
  "x-client-secret": "..."  // ❌ This requires IP whitelisting
}
```

---

## Troubleshooting

### Error: "Failed to generate signature"

**Cause**: Invalid public key format

**Solution**: Ensure your public key:
- Starts with `-----BEGIN PUBLIC KEY-----`
- Ends with `-----END PUBLIC KEY-----`
- Contains valid base64 content between the headers
- Has no extra characters or spaces

### Error: "Either clientSecret or publicKey must be provided"

**Cause**: Neither authentication method is configured

**Solution**: Add either:
- `CASHFREE_PUBLIC_KEY` (recommended)
- `CASHFREE_SECRET_KEY` (requires IP whitelisting)

### Error: "IP_NOT_WHITELISTED"

**Cause**: Using `x-client-secret` without whitelisted IP

**Solution**: Switch to e-signature by adding `CASHFREE_PUBLIC_KEY`

---

## Benefits of E-Signature

✅ **Works from Any IP**: No need to whitelist server IPs
✅ **Serverless Compatible**: Works with Vercel, AWS Lambda, etc.
✅ **User-Agnostic**: All users can complete KYC regardless of location
✅ **More Secure**: RSA encryption instead of shared secrets
✅ **Dynamic IPs**: Handles changing IPs in cloud environments

---

## Reference

- **Cashfree Documentation**: [Verification API Authentication](https://docs.cashfree.com/reference/verification-api-authentication)
- **Signature Implementation**: [apps/web/src/lib/cashfree-signature.ts](apps/web/src/lib/cashfree-signature.ts)
- **Node.js Crypto**: [crypto.publicEncrypt](https://nodejs.org/api/crypto.html#cryptopublicencryptkey-buffer)

---

## Summary

1. **Get** Cashfree public key from dashboard
2. **Add** `CASHFREE_PUBLIC_KEY` to environment variables
3. **Deploy** to Vercel (or restart local server)
4. **Test** KYC verification - should work from any IP

No more IP whitelisting issues! 🎉
