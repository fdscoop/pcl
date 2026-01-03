# Testing the KYC OTP Verification Flow

## 🧪 How to Test Locally (Before Production)

### Prerequisites
1. ✅ Database migration applied: `CREATE_KYC_AADHAAR_REQUESTS_TABLE.sql`
2. ✅ Environment variables set (see below)
3. ✅ Dev server running on http://localhost:3003

### Test Steps

#### Step 1: Navigate to KYC Page
```
http://localhost:3003/dashboard/club-owner/kyc
```

#### Step 2: Click "Aadhaar Verification" Tab
Should see:
- Card titled "Verify with Aadhaar"
- Input field for "Aadhaar Number"
- Information about secure verification via Cashfree

#### Step 3: Enter Test Aadhaar Number
- Enter any 12 digits (example: `123456789012`)
- Click "Send OTP" button

Expected response:
```
✓ OTP sent successfully
```

UI changes:
- Input field for Aadhaar becomes hidden
- "Enter OTP" input field appears
- Message: "📱 OTP Sent! We've sent a 6-digit OTP to your registered mobile number."

#### Step 4: Enter Test OTP
- Enter any 6 digits (example: `123456`)
- Click "Verify OTP" button

Expected response:
```
✓ Aadhaar verified successfully!
```

Then either:
- **Registered Club**: "Please upload required documents for review."
- **Unregistered Club**: "Your club is now KYC verified!"

#### Step 5: Verify Database Updates
Check Supabase:

**Users Table:**
```sql
SELECT id, kyc_status, aadhaar_number 
FROM users 
WHERE kyc_status = 'verified' 
LIMIT 1;
```

**Clubs Table:**
```sql
SELECT id, club_type, kyc_verified, document_verification_status 
FROM clubs 
WHERE kyc_verified = true 
LIMIT 1;
```

**KYC Aadhaar Requests Table:**
```sql
SELECT request_id, status, aadhaar_number 
FROM kyc_aadhaar_requests 
ORDER BY created_at DESC 
LIMIT 1;
```

**KYC Documents Table:**
```sql
SELECT club_id, aadhaar_verified, document_status 
FROM kyc_documents 
ORDER BY created_at DESC 
LIMIT 1;
```

---

## 🔐 Production Setup (With Real Cashfree)

### 1. Get Cashfree Credentials

Login to [Cashfree Merchant Dashboard](https://merchant.cashfree.com/):

```
Dashboard → Settings → API Keys
```

Copy these values:
- **API Key ID** (X-CF-API-KEY)
- **API Secret** (X-CF-API-SECRET)

### 2. Update `.env.local`

```env
# Cashfree KYC Configuration
NEXT_PUBLIC_CASHFREE_KEY_ID="your_key_from_cashfree"
CASHFREE_SECRET_KEY="your_secret_from_cashfree"
NEXT_PUBLIC_CASHFREE_MODE="sandbox"  # Use "sandbox" for testing first

# Later, when ready for production:
# NEXT_PUBLIC_CASHFREE_MODE="production"
```

### 3. Replace Mock API Calls

#### File: `/apps/web/src/app/api/kyc/request-aadhaar-otp/route.ts`

Find this section (around line 105):
```typescript
// TODO: Replace with actual Cashfree API call
```

Replace with:
```typescript
const response = await axios.post(
  `${baseUrl}/v2/kyc/aadhaar/request_otp`,
  {
    aadhaar_number: aadhaarNumber,
    consent: 'Y'
  },
  {
    headers: {
      'X-CF-API-KEY': process.env.NEXT_PUBLIC_CASHFREE_KEY_ID!,
      'X-CF-API-SECRET': process.env.CASHFREE_SECRET_KEY!,
      'Content-Type': 'application/json'
    }
  }
)

return response.data?.request_id || null
```

#### File: `/apps/web/src/app/api/kyc/verify-aadhaar-otp/route.ts`

Find this section (around line 140):
```typescript
// TODO: Replace with actual Cashfree API call
```

Replace with:
```typescript
const response = await axios.post(
  `${baseUrl}/v2/kyc/aadhaar/verify_otp`,
  {
    request_id: requestId,
    otp: otp
  },
  {
    headers: {
      'X-CF-API-KEY': process.env.NEXT_PUBLIC_CASHFREE_KEY_ID!,
      'X-CF-API-SECRET': process.env.CASHFREE_SECRET_KEY!,
      'Content-Type': 'application/json'
    }
  }
)

return response.data?.success === true
```

### 4. Test with Cashfree Sandbox

Restart dev server:
```bash
npm run dev
```

Test with real Aadhaar verification:
1. User provides real Aadhaar number
2. Cashfree sends actual OTP to registered mobile
3. User enters OTP
4. Verification complete

### 5. Deploy to Production

When ready:
1. Change `NEXT_PUBLIC_CASHFREE_MODE` to `"production"`
2. Update credentials with production API keys
3. Deploy to Vercel/hosting

---

## 📊 Flow Diagram

```
┌─────────────────────────────────┐
│  User on KYC Verification Page  │
└────────────┬────────────────────┘
             │
             ▼
    ┌────────────────────┐
    │ Step 1: Aadhaar    │
    │ Enter 12 digits    │
    └────────┬───────────┘
             │
             ▼
    ┌────────────────────────────────┐
    │ POST /api/kyc/request-aadhaar- │
    │ otp                            │
    │ - Validate format              │
    │ - Check duplicates             │
    │ - Call Cashfree API            │
    │ - Save request ID              │
    └────────┬───────────────────────┘
             │
             ▼
    ┌────────────────────────────┐
    │ Cashfree sends OTP to      │
    │ registered mobile number   │
    └────────┬───────────────────┘
             │
             ▼
    ┌────────────────────┐
    │ Step 2: OTP        │
    │ Enter 6 digits     │
    └────────┬───────────┘
             │
             ▼
    ┌────────────────────────────────┐
    │ POST /api/kyc/verify-aadhaar-  │
    │ otp                            │
    │ - Validate format              │
    │ - Call Cashfree API            │
    │ - Check club type              │
    │ - Update databases             │
    └────────┬───────────────────────┘
             │
             ▼
    ┌────────────────────────────┐
    │ Is club "Registered"?      │
    └────────┬──────────┬────────┘
             │          │
             ▼          ▼
          YES        NO (Unregistered)
             │          │
             ▼          ▼
    ┌──────────┐  ┌──────────────┐
    │Pending   │  │Auto-Verified │
    │ Review   │  │              │
    └──────────┘  └──────────────┘
```

---

## 🐛 Troubleshooting

### Problem: "Invalid Aadhaar number format"
**Cause**: Aadhaar must be exactly 12 digits
**Fix**: Verify user entered 12 digits

### Problem: "This Aadhaar number is already registered"
**Cause**: Same Aadhaar used for multiple clubs
**Fix**: User must use different Aadhaar or delete old registration

### Problem: "OTP verification failed"
**Cause**: OTP is invalid or expired (10 min timeout)
**Fix**: Click "Didn't receive OTP? Resend"

### Problem: "Club not found or unauthorized"
**Cause**: User doesn't own the club
**Fix**: Ensure logged-in user is the club owner

### Problem: "Internal server error"
**Cause**: Cashfree API call failed
**Fix**: Check Cashfree credentials and API status

---

## ✅ Success Indicators

After completing verification:

1. **Frontend**: See green checkmark "Aadhaar Verified"
2. **Dashboard**: Club shows "✓ Verified" badge
3. **Database**: 
   - `users.kyc_status` = `'verified'`
   - `clubs.kyc_verified` = `true` (unregistered) or `false` (registered)
4. **Next Step**: 
   - Registered: Documents tab opens for upload
   - Unregistered: Full access with "KYC ✓" indicator

---

## 📝 Notes

- OTP expires after 10 minutes
- User can resend OTP unlimited times
- Aadhaar number is unique per club (prevents multi-club fraud)
- All data is encrypted in Cashfree's system
- Registered clubs require admin review before full KYC approval
- Unregistered clubs auto-verify after Aadhaar confirmation
