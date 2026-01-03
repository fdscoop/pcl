# 🔧 Copy-Paste Implementation Guide

## Ready to Deploy? Follow These Exact Steps

---

## Step 1️⃣: Run Database Migration

**Go to**: [Supabase Dashboard](https://supabase.com/dashboard) → Your Project → SQL Editor

**Paste this entire SQL** (just copy and click Run):

```sql
-- Create kyc_aadhaar_requests table to track OTP requests for Aadhaar verification

CREATE TABLE IF NOT EXISTS kyc_aadhaar_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  aadhaar_number VARCHAR(12) NOT NULL,
  request_id VARCHAR(255) NOT NULL UNIQUE,
  status VARCHAR(50) NOT NULL DEFAULT 'otp_sent',
  otp_attempts INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  verified_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '10 minutes')
);

CREATE INDEX IF NOT EXISTS idx_kyc_aadhaar_requests_user_id ON kyc_aadhaar_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_kyc_aadhaar_requests_club_id ON kyc_aadhaar_requests(club_id);
CREATE INDEX IF NOT EXISTS idx_kyc_aadhaar_requests_request_id ON kyc_aadhaar_requests(request_id);
CREATE INDEX IF NOT EXISTS idx_kyc_aadhaar_requests_status ON kyc_aadhaar_requests(status);

ALTER TABLE kyc_aadhaar_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own kyc aadhaar requests"
  ON kyc_aadhaar_requests FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own kyc aadhaar requests"
  ON kyc_aadhaar_requests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own kyc aadhaar requests"
  ON kyc_aadhaar_requests FOR UPDATE
  USING (auth.uid() = user_id);

COMMENT ON TABLE kyc_aadhaar_requests IS 'Tracks Aadhaar OTP verification requests from Cashfree';
COMMENT ON COLUMN kyc_aadhaar_requests.status IS 'Status of the OTP request: otp_sent, otp_expired, verified, failed';
COMMENT ON COLUMN kyc_aadhaar_requests.request_id IS 'Request ID returned from Cashfree API';
COMMENT ON COLUMN kyc_aadhaar_requests.otp_attempts IS 'Number of OTP verification attempts';
COMMENT ON COLUMN kyc_aadhaar_requests.expires_at IS 'OTP expiration time (typically 10 minutes)';
```

**Expected result**: `✓ Query successful` message

✅ **Done with Step 1!**

---

## Step 2️⃣: Update Environment Variables

**File**: `/Users/bineshbalan/pcl/apps/web/.env.local`

**Find this section** (it already exists):
```env
# Cashfree KYC Configuration
NEXT_PUBLIC_CASHFREE_KEY_ID="your_cashfree_key_id_here"
CASHFREE_SECRET_KEY="your_cashfree_secret_key_here"
NEXT_PUBLIC_CASHFREE_MODE="sandbox"
```

**Get your credentials**:
1. Go to [Cashfree Merchant Dashboard](https://merchant.cashfree.com/)
2. Login
3. Navigate to: **Settings** → **API Keys**
4. Copy the **API Key ID** and **API Secret**

**Replace with your actual values**:
```env
# Cashfree KYC Configuration
NEXT_PUBLIC_CASHFREE_KEY_ID="ACTUAL_KEY_ID_FROM_CASHFREE"
CASHFREE_SECRET_KEY="ACTUAL_SECRET_FROM_CASHFREE"
NEXT_PUBLIC_CASHFREE_MODE="sandbox"
```

Save file (Cmd+S)

✅ **Done with Step 2!**

---

## Step 3️⃣: Uncomment Real Cashfree API Calls

### File A: `/apps/web/src/app/api/kyc/request-aadhaar-otp/route.ts`

**Find line ~105-120** (search for "TODO: Replace with actual"):

```typescript
// CURRENT CODE (MOCK):
async function requestAadhaarOTP(aadhaarNumber: string): Promise<string | null> {
  try {
    const cashfreeMode = process.env.NEXT_PUBLIC_CASHFREE_MODE || 'sandbox'
    const baseUrl = cashfreeMode === 'sandbox' 
      ? 'https://api-sandbox.cashfree.com'
      : 'https://api.cashfree.com'

    // TODO: Replace with actual Cashfree API call
    // const response = await axios.post(`${baseUrl}/v2/kyc/aadhaar/request_otp`, {
    //   aadhaar_number: aadhaarNumber,
    //   consent: 'Y'
    // }, {
    //   headers: {
    //     'X-CF-API-KEY': process.env.NEXT_PUBLIC_CASHFREE_KEY_ID!,
    //     'X-CF-API-SECRET': process.env.CASHFREE_SECRET_KEY!,
    //     'Content-Type': 'application/json'
    //   }
    // })

    // For demo purposes, generate a mock request ID
    const requestId = `REQ_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    console.log(`Mock: OTP request created for Aadhaar ending with ${aadhaarNumber.slice(-4)}`)
    console.log(`Mock: Request ID: ${requestId}`)

    return requestId
  } catch (error) {
    console.error('Cashfree OTP request error:', error)
    return null
  }
}
```

**Replace with this** (uncomment the API call):
```typescript
async function requestAadhaarOTP(aadhaarNumber: string): Promise<string | null> {
  try {
    const cashfreeMode = process.env.NEXT_PUBLIC_CASHFREE_MODE || 'sandbox'
    const baseUrl = cashfreeMode === 'sandbox' 
      ? 'https://api-sandbox.cashfree.com'
      : 'https://api.cashfree.com'

    const response = await axios.post(`${baseUrl}/v2/kyc/aadhaar/request_otp`, {
      aadhaar_number: aadhaarNumber,
      consent: 'Y'
    }, {
      headers: {
        'X-CF-API-KEY': process.env.NEXT_PUBLIC_CASHFREE_KEY_ID!,
        'X-CF-API-SECRET': process.env.CASHFREE_SECRET_KEY!,
        'Content-Type': 'application/json'
      }
    })

    return response.data?.request_id || null
  } catch (error) {
    console.error('Cashfree OTP request error:', error)
    return null
  }
}
```

Save file (Cmd+S)

✅ **Done with File A!**

---

### File B: `/apps/web/src/app/api/kyc/verify-aadhaar-otp/route.ts`

**Find line ~140-160** (search for "TODO: Replace with actual"):

```typescript
// CURRENT CODE (MOCK):
async function verifyAadhaarOTP(requestId: string, otp: string): Promise<boolean> {
  try {
    const cashfreeMode = process.env.NEXT_PUBLIC_CASHFREE_MODE || 'sandbox'
    const baseUrl = cashfreeMode === 'sandbox'
      ? 'https://api-sandbox.cashfree.com'
      : 'https://api.cashfree.com'

    // TODO: Replace with actual Cashfree API call
    // const response = await axios.post(`${baseUrl}/v2/kyc/aadhaar/verify_otp`, {
    //   request_id: requestId,
    //   otp: otp
    // }, {
    //   headers: {
    //     'X-CF-API-KEY': process.env.NEXT_PUBLIC_CASHFREE_KEY_ID!,
    //     'X-CF-API-SECRET': process.env.CASHFREE_SECRET_KEY!,
    //     'Content-Type': 'application/json'
    //   }
    // })

    // For demo purposes, verify OTP (in production, this would call Cashfree)
    // In sandbox, we accept any 6-digit OTP for testing
    const isValid = /^\d{6}$/.test(otp)
    
    if (isValid) {
      console.log(`Mock: OTP ${otp} verified for request ${requestId}`)
      return true
    }

    return false
  } catch (error) {
    console.error('Cashfree OTP verification error:', error)
    return false
  }
}
```

**Replace with this** (uncomment the API call):
```typescript
async function verifyAadhaarOTP(requestId: string, otp: string): Promise<boolean> {
  try {
    const cashfreeMode = process.env.NEXT_PUBLIC_CASHFREE_MODE || 'sandbox'
    const baseUrl = cashfreeMode === 'sandbox'
      ? 'https://api-sandbox.cashfree.com'
      : 'https://api.cashfree.com'

    const response = await axios.post(`${baseUrl}/v2/kyc/aadhaar/verify_otp`, {
      request_id: requestId,
      otp: otp
    }, {
      headers: {
        'X-CF-API-KEY': process.env.NEXT_PUBLIC_CASHFREE_KEY_ID!,
        'X-CF-API-SECRET': process.env.CASHFREE_SECRET_KEY!,
        'Content-Type': 'application/json'
      }
    })

    return response.data?.success === true
  } catch (error) {
    console.error('Cashfree OTP verification error:', error)
    return false
  }
}
```

Save file (Cmd+S)

✅ **Done with File B!**

---

## ✅ All Done!

You now have:
- ✅ Database migration applied
- ✅ Cashfree credentials configured
- ✅ Real API calls enabled

Your system is **live with real Cashfree OTP verification**! 🚀

---

## 🧪 Test It

1. Restart dev server (if running)
2. Navigate to: http://localhost:3003/dashboard/club-owner/kyc
3. Enter Aadhaar number (12 digits)
4. Click "Send OTP"
5. Check your phone for real OTP from Cashfree
6. Enter OTP
7. Click "Verify OTP"
8. ✅ See success message!

---

## 🚀 Ready for Production?

Change this line in `.env.local`:
```env
NEXT_PUBLIC_CASHFREE_MODE="production"  # Change from "sandbox"
```

And update credentials to your production API keys from Cashfree.

---

## 📞 Quick Reference

| What | Where |
|------|-------|
| SQL to run | Above ☝️ |
| Credentials source | [Cashfree Dashboard](https://merchant.cashfree.com/) → Settings → API Keys |
| File A | `/apps/web/src/app/api/kyc/request-aadhaar-otp/route.ts` |
| File B | `/apps/web/src/app/api/kyc/verify-aadhaar-otp/route.ts` |
| Test page | http://localhost:3003/dashboard/club-owner/kyc |

That's literally all you need to do! ✨
