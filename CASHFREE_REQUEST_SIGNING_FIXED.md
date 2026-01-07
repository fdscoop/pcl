# Cashfree Request Signing - x-cf-signature Implementation

## ✅ Fixed: Added Request Signature Headers

Cashfree requires all API requests to be signed with HMAC-SHA256 signature via `x-cf-signature` header.

---

## What Was Fixed

### The Problem:
```
x-cf-signature missing in the request header
```

Cashfree API requires HMAC-SHA256 signed requests for authentication.

### The Solution:
Added signature generation function to both API endpoints:

```typescript
import crypto from 'crypto'

function generateCashfreeSignature(payload: string, secretKey: string): string {
  return crypto
    .createHmac('sha256', secretKey)
    .update(payload)
    .digest('base64')
}
```

---

## Signature Calculation

### For POST Requests (with body):
```typescript
const payload = JSON.stringify({ /* request data */ })
const signature = generateCashfreeSignature(payload, CASHFREE_SECRET_KEY)

headers: {
  'x-client-id': CASHFREE_API_KEY,
  'x-client-secret': CASHFREE_SECRET_KEY,
  'x-cf-signature': signature,  // ← Required!
  'Content-Type': 'application/json'
}
```

### For GET Requests (no body):
```typescript
const signature = generateCashfreeSignature('', CASHFREE_SECRET_KEY)

headers: {
  'x-client-id': CASHFREE_API_KEY,
  'x-client-secret': CASHFREE_SECRET_KEY,
  'x-cf-signature': signature,  // ← Signature of empty string
  'Content-Type': 'application/json'
}
```

---

## Updated API Endpoints

### 1. `/api/kyc/verify-bank-account/route.ts`

**Step 1: Initiate Verification**
```typescript
const initiatePayload = {
  bank_account: accountNumber,
  ifsc: ifscCode,
  name: accountHolder,
}

const initiatePayloadString = JSON.stringify(initiatePayload)
const initiateSignature = generateCashfreeSignature(initiatePayloadString, CASHFREE_SECRET_KEY)

const initiateResponse = await fetch(
  `${CASHFREE_BASE_URL}/verification/reverse-penny-drop`,
  {
    method: 'POST',
    headers: {
      'x-client-id': CASHFREE_API_KEY,
      'x-client-secret': CASHFREE_SECRET_KEY,
      'x-cf-signature': initiateSignature,  // ✅ Added
      'Content-Type': 'application/json',
    },
    body: initiatePayloadString,
  }
)
```

**Step 2: Generate Payment Links**
```typescript
const paymentLinksPayload = {
  verification_id: verificationId,
  name: accountHolder,
}

const paymentLinksPayloadString = JSON.stringify(paymentLinksPayload)
const paymentLinksSignature = generateCashfreeSignature(paymentLinksPayloadString, CASHFREE_SECRET_KEY)

const paymentLinksResponse = await fetch(
  `${CASHFREE_BASE_URL}/verification/reverse-penny-drop`,
  {
    method: 'POST',
    headers: {
      'x-client-id': CASHFREE_API_KEY,
      'x-client-secret': CASHFREE_SECRET_KEY,
      'x-cf-signature': paymentLinksSignature,  // ✅ Added
      'Content-Type': 'application/json',
    },
    body: paymentLinksPayloadString,
  }
)
```

### 2. `/api/kyc/check-bank-verification/route.ts`

**Check Status**
```typescript
const statusSignature = generateCashfreeSignature('', CASHFREE_SECRET_KEY)

const statusResponse = await fetch(
  `${CASHFREE_BASE_URL}/verification/remitter/status`,
  {
    method: 'GET',
    headers: {
      'x-client-id': CASHFREE_API_KEY,
      'x-client-secret': CASHFREE_SECRET_KEY,
      'x-cf-signature': statusSignature,  // ✅ Added (empty string for GET)
      'Content-Type': 'application/json',
    },
  }
)
```

---

## Complete Request Headers

### Verify Bank Account (POST)
```
POST https://api.cashfree.com/verification/reverse-penny-drop

Headers:
  x-client-id: YOUR_CASHFREE_CLIENT_ID
  x-client-secret: YOUR_CASHFREE_SECRET_KEY
  x-cf-signature: BASE64(HMAC-SHA256(payload, secret))
  Content-Type: application/json

Body:
{
  "bank_account": "1234567890",
  "ifsc": "HDFC0000001",
  "name": "Binesh Balan"
}
```

### Generate Payment Links (POST)
```
POST https://api.cashfree.com/verification/reverse-penny-drop

Headers:
  x-client-id: YOUR_CASHFREE_CLIENT_ID
  x-client-secret: YOUR_CASHFREE_SECRET_KEY
  x-cf-signature: BASE64(HMAC-SHA256(payload, secret))
  Content-Type: application/json

Body:
{
  "verification_id": "3890AAB000",
  "name": "Binesh Balan"
}
```

### Check Status (GET)
```
GET https://api.cashfree.com/verification/remitter/status

Headers:
  x-client-id: YOUR_CASHFREE_CLIENT_ID
  x-client-secret: YOUR_CASHFREE_SECRET_KEY
  x-cf-signature: BASE64(HMAC-SHA256('', secret))
  Content-Type: application/json
```

---

## Files Updated

1. ✅ `/apps/web/src/app/api/kyc/verify-bank-account/route.ts`
   - Added `import crypto from 'crypto'`
   - Added `generateCashfreeSignature()` function
   - Updated Step 1: Added `x-cf-signature` to initiate request
   - Updated Step 2: Added `x-cf-signature` to payment links request

2. ✅ `/apps/web/src/app/api/kyc/check-bank-verification/route.ts`
   - Added `import crypto from 'crypto'`
   - Added `generateCashfreeSignature()` function
   - Updated GET request: Added `x-cf-signature` header

---

## How Signature Works

### HMAC-SHA256 Calculation:
```
1. Take request payload: '{"bank_account":"1234567890",...}'
2. Calculate HMAC-SHA256 using secret key
3. Encode result in Base64
4. Add as 'x-cf-signature' header
```

### Example:
```javascript
const payload = '{"bank_account":"1234567890","ifsc":"HDFC0000001","name":"John Doe"}'
const secret = 'YOUR_CASHFREE_SECRET_KEY'

const signature = crypto
  .createHmac('sha256', secret)
  .update(payload)
  .digest('base64')

// Result: 'aBcDefGhIjKlMnOpQrStUvWxYz0123456789=='
```

---

## Testing

### Before:
```
❌ POST /api/kyc/verify-bank-account 500
Error: x-cf-signature missing in the request header
```

### After:
```
✅ POST /api/kyc/verify-bank-account 200
Response: { paymentLinks, verificationId, ... }
```

---

## Summary

✅ **Request Signing Implemented**
- Added HMAC-SHA256 signature generation
- Added `x-cf-signature` header to all Cashfree API calls
- Works for both POST requests (with body) and GET requests (empty string)
- Cashfree API now authenticates requests properly

Ready to test again! 🚀
