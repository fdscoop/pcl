# ⚠️ CRITICAL FIX: Verification API vs Payout API

## The Problem You Had

You were using **Payout API code** instead of **Verification API code**. These are **completely different APIs** from Cashfree!

### Payout API (Wrong - What you had)
- **Purpose**: Money transfers, payouts
- **Base URL**: `https://payout-api.cashfree.com` or `https://payout-gamma.cashfree.com`
- **Endpoint**: `/payout/v1/authorize` (for token generation)
- **Auth**: Bearer token first, then signature
- **Use Case**: Sending money to users

### Verification API (Correct - Updated now)
- **Purpose**: KYC verification (Aadhaar, PAN, Bank)
- **Base URL**: `https://api.cashfree.com`
- **Endpoint**: `/verification/aadhaar/otp` (no token needed)
- **Auth**: Direct X-Client-Id and X-Client-Secret headers
- **Use Case**: Verifying user identity via Aadhaar

---

## What Changed

### Authentication Method

**BEFORE (Payout API):**
```typescript
const token = await getAuthToken(); // Need to get token first
headers: {
  'Authorization': `Bearer ${token}`, // Token-based auth
  'Content-Type': 'application/json'
}
```

**AFTER (Verification API):**
```typescript
headers: {
  'X-Client-Id': keyId,           // Direct header-based auth
  'X-Client-Secret': secretKey,   // No token needed!
  'Content-Type': 'application/json',
  'X-Request-Id': `req_${Date.now()}`, // Request ID for tracking
  'X-API-VERSION': '2023-08-01'   // API version
}
```

### Endpoints

**BEFORE (Payout API):**
```
POST /payout/v1/authorize                    (Get token)
POST /verification/aadhaar/otp               (Request OTP)
POST /verification/aadhaar/otp/verify        (Verify OTP)
```

**AFTER (Verification API):**
```
POST /verification/aadhaar/otp               (Request OTP)
POST /verification/aadhaar/otp/verify        (Verify OTP)
(No token endpoint needed!)
```

### Request/Response Format

**BEFORE:**
```typescript
// Payout API expects:
{
  clientId: CLIENT_ID,           // camelCase
  clientSecret: CLIENT_SECRET
}
```

**AFTER:**
```typescript
// Verification API expects:
{
  aadhaar_number: "123456789012"  // snake_case
}
```

---

## Environment Variables You Already Have

Your credentials format for **Verification API**:

```env
NEXT_PUBLIC_CASHFREE_KEY_ID="CF****************************"
CASHFREE_SECRET_KEY="cfsk_ma_prod_********************************"
NEXT_PUBLIC_CASHFREE_MODE="production"
```

These are NOT Payout API credentials. They're **Verification API credentials**.
**Important:** Store actual values in `.env.local` (never commit to git)

---

## Why You Got 404 Errors

1. **Wrong auth method**: Payout API uses Bearer tokens, Verification API uses direct headers
2. **Missing signature**: Payout API requires HMAC SHA256 signatures (you had the code for this)
3. **Wrong headers**: Payout API uses `Authorization: Bearer`, Verification API uses `X-Client-Id/Secret`

Now you're using the **correct Verification API** implementation.

---

## Testing

The API routes are now correctly implemented:

### Request OTP:
```bash
curl -X POST http://localhost:3000/api/kyc/request-aadhaar-otp \
  -H "Content-Type: application/json" \
  -d '{
    "aadhaar_number": "123456789012",
    "club_id": "your-club-id"
  }'
```

**Expected response:**
```json
{
  "success": true,
  "message": "OTP sent to registered mobile number",
  "request_id": "req_...",
  "ref_id": "..."
}
```

### Verify OTP:
```bash
curl -X POST http://localhost:3000/api/kyc/verify-aadhaar-otp \
  -H "Content-Type: application/json" \
  -d '{
    "request_id": "req_...",
    "otp": "123456",
    "club_id": "your-club-id"
  }'
```

**Expected response:**
```json
{
  "success": true,
  "message": "Aadhaar verified successfully",
  "data": {
    "name": "John Doe",
    "dob": "01/01/1990",
    "address": "...",
    "status": "pending_review" // or "active"
  }
}
```

---

## Key Differences Summary

| Feature | Payout API | Verification API |
|---------|-----------|-----------------|
| **Base URL** | payout-api.cashfree.com | api.cashfree.com |
| **Token Required** | Yes | No |
| **Headers** | Authorization: Bearer | X-Client-Id/Secret |
| **Signature** | Required | Optional |
| **Use Case** | Money transfers | KYC verification |
| **Response** | Contains token, transaction data | Contains verified user data |

---

## What to do now

1. **Test the OTP flow** in your frontend
2. **Check browser console** for detailed error messages
3. **Check terminal** for server logs with 🔄, ✅, and ❌ emojis
4. **Verify database updates** when OTP is verified

The implementation is now **correct and ready to test!**
