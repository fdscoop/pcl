# E-Signature Integration Status

## ✅ Integration Complete

All KYC API routes have been successfully updated to support e-signature authentication.

---

## Updated Routes

### Player KYC ✅
1. **Generate OTP**: [apps/web/src/app/api/kyc/player/generate-otp/route.ts:4,27](apps/web/src/app/api/kyc/player/generate-otp/route.ts)
   - ✅ Imports `getCashfreeVerificationHeaders`
   - ✅ Uses e-signature authentication

2. **Verify OTP**: [apps/web/src/app/api/kyc/player/verify-otp/route.ts:4,28](apps/web/src/app/api/kyc/player/verify-otp/route.ts)
   - ✅ Imports `getCashfreeVerificationHeaders`
   - ✅ Uses e-signature authentication

### Club KYC ✅
1. **Request Aadhaar OTP**: [apps/web/src/app/api/kyc/request-aadhaar-otp/route.ts:4,28](apps/web/src/app/api/kyc/request-aadhaar-otp/route.ts)
   - ✅ Imports `getCashfreeVerificationHeaders`
   - ✅ Uses e-signature authentication

2. **Verify Aadhaar OTP**: [apps/web/src/app/api/kyc/verify-aadhaar-otp/route.ts:4,28](apps/web/src/app/api/kyc/verify-aadhaar-otp/route.ts)
   - ✅ Imports `getCashfreeVerificationHeaders`
   - ✅ Uses e-signature authentication

---

## Environment Configuration

### ✅ Updated Files

1. **[.env.example](.env.example)**
   - Added `CASHFREE_PUBLIC_KEY` template

2. **[.env.local](.env.local)**
   - Added `CASHFREE_PUBLIC_KEY` placeholder
   - Includes instructions for getting the public key

---

## How It Works

All routes now follow this pattern:

```typescript
import { getCashfreeVerificationHeaders } from '@/lib/cashfree-signature'

async function generateOTP/verifyOTP(...) {
  const keyId = process.env.NEXT_PUBLIC_CASHFREE_KEY_ID
  const secretKey = process.env.CASHFREE_SECRET_KEY
  const publicKey = process.env.CASHFREE_PUBLIC_KEY  // ← NEW

  // Generate headers with automatic authentication method selection
  const headers = getCashfreeVerificationHeaders(keyId, secretKey, publicKey)

  const config = { headers }

  // Make API request with e-signature or client-secret
  const response = await axios.post(url, requestBody, config)
}
```

### Authentication Priority

The system automatically selects the best authentication method:

1. **If `CASHFREE_PUBLIC_KEY` is set** → Use e-signature (x-cf-signature)
2. **Else if `CASHFREE_SECRET_KEY` is set** → Use IP whitelisting (x-client-secret)
3. **Else** → Throw error

---

## Next Steps

### For Local Development

1. Get your Cashfree public key from [Cashfree Dashboard](https://merchant.cashfree.com/merchants/login):
   - Navigate to **Developers** → **API Keys**
   - Download **verification_public_key.pem**

2. Open the `.pem` file and copy the FULL content

3. Update [.env.local](.env.local):
   ```bash
   CASHFREE_PUBLIC_KEY="-----BEGIN PUBLIC KEY-----
   MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA...
   -----END PUBLIC KEY-----"
   ```

4. Restart your development server:
   ```bash
   npm run dev
   ```

### For Production (Vercel)

1. Go to your Vercel project
2. Navigate to **Settings** → **Environment Variables**
3. Add new variable:
   - **Name**: `CASHFREE_PUBLIC_KEY`
   - **Value**: Your full PEM content (including BEGIN/END lines)
   - **Environment**: Production, Preview, Development (all)
4. Redeploy your application

---

## Testing

### Verify E-Signature is Working

1. Try to generate OTP for KYC verification
2. Check server console logs:

**Expected Output:**
```
🔐 Generating Aadhaar OTP with Cashfree...
📝 Using e-signature authentication
✅ OTP Generation successful!
```

**Expected Headers:**
```json
{
  "x-client-id": "CF1159838D58OK743AJJC738HCFQ0",
  "x-cf-signature": "dGVzdC1lbmNyeXB0ZWQtc2lnbmF0dXJl...",
  "x-api-version": "2022-09-01"
}
```

### Fallback Behavior

If `CASHFREE_PUBLIC_KEY` is not set, the system will:
1. Try using `CASHFREE_SECRET_KEY` (IP whitelisting)
2. If IP is not whitelisted → Error: `IP_NOT_WHITELISTED`
3. Solution: Add `CASHFREE_PUBLIC_KEY` to environment variables

---

## Benefits

✅ **No IP Whitelisting Required**: Works from any server IP
✅ **Serverless Compatible**: Perfect for Vercel, AWS Lambda, etc.
✅ **User-Agnostic**: All users can complete KYC regardless of location
✅ **Dynamic IPs**: Handles cloud providers with changing IPs
✅ **More Secure**: RSA encryption instead of shared secrets
✅ **Backward Compatible**: Still supports client-secret for whitelisted IPs

---

## Implementation Details

### Signature Generation

**File**: [apps/web/src/lib/cashfree-signature.ts](apps/web/src/lib/cashfree-signature.ts)

**Algorithm**: RSA-OAEP with SHA-1 (matches Cashfree's Java requirement)

**Process**:
1. Create payload: `clientId.epochTimestamp`
2. Encrypt with Cashfree's public key using RSA-OAEP
3. Base64 encode the encrypted bytes
4. Send as `x-cf-signature` header

**Code**:
```typescript
export function generateCashfreeSignature(clientId: string, publicKeyPem: string): string {
  const epochTimestamp = Math.floor(Date.now() / 1000)
  const clientIdWithTimestamp = `${clientId}.${epochTimestamp}`

  const encryptedData = crypto.publicEncrypt(
    {
      key: publicKeyFormatted,
      padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
      oaepHash: 'sha1'
    },
    Buffer.from(clientIdWithTimestamp)
  )

  return encryptedData.toString('base64')
}
```

---

## Troubleshooting

### Error: "Either clientSecret or publicKey must be provided"

**Cause**: Missing both authentication methods

**Solution**: Add `CASHFREE_PUBLIC_KEY` to `.env.local`

### Error: "IP_NOT_WHITELISTED"

**Cause**: Using `x-client-secret` without whitelisted IP

**Solution**: Add `CASHFREE_PUBLIC_KEY` to switch to e-signature

### Error: "Failed to generate signature"

**Cause**: Invalid public key format

**Solution**: Ensure the public key:
- Starts with `-----BEGIN PUBLIC KEY-----`
- Ends with `-----END PUBLIC KEY-----`
- Contains valid base64 content
- Has no extra characters

---

## Summary

✅ All 4 KYC API routes updated
✅ E-signature library implemented
✅ Environment variables configured
✅ Documentation created
✅ Backward compatible with IP whitelisting

**Status**: Ready for deployment! Just add your `CASHFREE_PUBLIC_KEY` and test.

---

## Reference Documentation

- [CASHFREE_ESIGNATURE_SETUP.md](CASHFREE_ESIGNATURE_SETUP.md) - Detailed setup guide
- [Cashfree Verification API Docs](https://docs.cashfree.com/reference/verification-api-authentication)
- [Node.js Crypto Module](https://nodejs.org/api/crypto.html#cryptopublicencryptkey-buffer)
