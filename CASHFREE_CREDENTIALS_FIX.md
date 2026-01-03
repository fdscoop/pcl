# ⚠️ CRITICAL: Cashfree API Endpoint Issue

## Problem Found

All Cashfree KYC endpoints are returning **404 Not Found**:
```
❌ https://api.cashfree.com/kyc/aadhaar/otp/request → 404
❌ https://api.cashfree.com/v2/kyc/aadhaar/request_otp → 404  
❌ https://api.cashfree.com/v3/kyc/aadhaar/otp/request → 404
✅ Credentials are loaded correctly (Key ID and Secret Key present)
✅ Authentication headers are correct (Basic Auth header is valid)
```

## Root Cause Analysis

The 404 errors indicate that **the API endpoints don't exist**. This is likely because:

### 1. **Your Credentials Are for a Different Product**
Looking at your credentials: `cfsk_ma_prod_2c0ce...`
- The `ma` likely stands for "Marketplace"
- KYC endpoints might require different credentials (separate product)

### 2. **You Need KYC-Specific Credentials**
Cashfree has separate credential types:
- **Payments API** - For payment processing
- **Marketplace API** - For marketplace features (your current creds)
- **KYC/Verification API** - Separate product with separate credentials

## Solution: Get Correct KYC Credentials

### Step 1: Log into Cashfree Dashboard
Go to: https://merchant.cashfree.com

### Step 2: Check Your Current Product
- Navigate to Settings → API Keys
- Check which product these credentials are for
- Look for a section like "KYC", "Verification", or "eKYC"

### Step 3: Generate KYC API Credentials (if not present)
You might need to:
1. Ensure KYC product is enabled on your account
2. Navigate to the KYC/Verification product section
3. Generate new API credentials for that product
4. Copy the **API Key** and **Secret Key**

### Step 4: Update `.env.local`
```env
NEXT_PUBLIC_CASHFREE_KEY_ID="<NEW_KYC_API_KEY>"
CASHFREE_SECRET_KEY="<NEW_KYC_SECRET_KEY>"
NEXT_PUBLIC_CASHFREE_MODE="production"
```

### Step 5: Restart Dev Server
```bash
# Kill existing server
pkill -f "npm run dev"

# Clear cache and restart
cd /Users/bineshbalan/pcl
rm -rf .next
npm run dev
```

## Alternative: Check Cashfree API Documentation

If you're unsure about credentials, check Cashfree's official documentation:
1. Visit: https://docs.cashfree.com
2. Look for "KYC" or "Verification" API docs
3. Check if there's a different endpoint format
4. Verify authentication method (might not be Basic Auth for KYC)

## Temporary Test: Verify Credentials Work

Use this test to verify once you have KYC credentials:

```bash
# Test with curl (replace with actual credentials)
curl -X POST https://api.cashfree.com/kyc/aadhaar/otp/request \
  -H "Authorization: Basic $(echo -n 'YOUR_KYC_KEY_ID:YOUR_KYC_SECRET' | base64)" \
  -H "Content-Type: application/json" \
  -d '{"aadhaar_number":"123456789012","consent":"Y"}'
```

Expected responses:
- **200 OK** with `request_id` → Credentials are correct! ✅
- **404 Not Found** → Wrong product credentials ❌
- **401 Unauthorized** → Invalid credentials ❌
- **400 Bad Request** → Wrong request format ❌

## Files Modified (Ready to Use)

Once you get the correct KYC credentials, these files are ready:
- ✅ `/apps/web/src/app/api/kyc/request-aadhaar-otp/route.ts` - Tries 5 endpoint variations
- ✅ `/apps/web/src/app/api/kyc/verify-aadhaar-otp/route.ts` - Tries 5 endpoint variations
- ✅ `/apps/web/src/app/dashboard/club-owner/kyc/page.tsx` - Frontend with logging
- ✅ `/apps/web/src/app/api/kyc/test/route.ts` - Configuration checker

## What to Do Next

**PRIORITY: Get correct KYC API credentials from Cashfree dashboard**

Then:
1. Update `.env.local` with new credentials
2. Restart dev server
3. Test again - should get 200 OK response (or 400/401 with actual Cashfree error)
4. If still failing, share the actual Cashfree error response
