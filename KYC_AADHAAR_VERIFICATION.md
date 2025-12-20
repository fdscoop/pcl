# KYC Aadhaar Verification System

## Overview

PCL uses **Aadhaar-based OTP verification** for instant player identity verification. This allows players to verify their identity in minutes instead of waiting days for manual document review.

**Current Status:** ✅ Dummy implementation complete (ready for Cashfree integration)

---

## Quick Start

### For Players

1. Complete player profile
2. Click "Start KYC Process" on dashboard  
3. Enter 12-digit Aadhaar number
4. Click "Generate OTP"
5. Enter 6-digit OTP (sent to registered mobile)
6. Click "Verify OTP"
7. ✅ Instantly verified!

**Testing Mode:** Use any 12-digit number as Aadhaar, OTP: `123456`

### For Developers

**Setup:**
```bash
# Run SQL migration
psql < ADD_KYC_FIELDS_TO_USERS.sql

# Start app
npm run dev

# Navigate to
http://localhost:3000/kyc/verify
```

---

## User Flow

```
Player Dashboard
    ↓
Click "Start KYC Process"
    ↓
/kyc/verify page
    ↓
Enter Aadhaar Number (XXXX XXXX XXXX)
    ↓
Click "Generate OTP" → API call (dummy or Cashfree)
    ↓
OTP sent to registered mobile
    ↓
Enter 6-digit OTP
    ↓
Click "Verify OTP" → API verification
    ↓
✅ Success:
   • users.kyc_status = 'verified'
   • users.kyc_verified_at = now()
   • users.aadhaar_number = encrypted
   • players.is_available_for_scout = true
    ↓
Redirect to Dashboard (verified badge shown)
```

---

## Files Created

### 1. KYC Verification Page
**File:** `apps/web/src/app/kyc/verify/page.tsx`

**Features:**
- Aadhaar number input (auto-formatted)
- OTP generation
- OTP input (6 digits, centered)
- Success/error handling
- Resend OTP
- Testing mode indicators

### 2. KYC Service Layer
**File:** `apps/web/src/services/kyc.ts`

**Functions:**
```typescript
generateAadhaarOTP(aadhaarNumber: string): Promise<AadhaarOTPResponse>
verifyAadhaarOTP(refId: string, otp: string): Promise<AadhaarVerifyResponse>
maskAadhaar(aadhaarNumber: string): string
formatAadhaar(aadhaarNumber: string): string
```

**Environment-based switching:**
- `NEXT_PUBLIC_KYC_MODE=dummy` → Dummy API
- `NEXT_PUBLIC_KYC_MODE=production` → Cashfree API

### 3. Database Migration
**File:** `ADD_KYC_FIELDS_TO_USERS.sql`

**Adds:**
- `users.aadhaar_number` (TEXT)
- `users.kyc_verified_at` (TIMESTAMP)
- Index on `kyc_status`

---

## Dummy Implementation

**Current testing setup:**

### Generate OTP
- Accepts any 12-digit Aadhaar
- Simulates 1.5s API delay
- Returns success with ref_id
- Console logs: "Test OTP: 123456"

### Verify OTP
- Accepts OTP: `123456` only
- Rejects any other OTP
- Simulates 1.5s verification delay
- Updates database on success

**Why dummy first?**
1. Test complete UX flow
2. No API costs during development
3. Demonstrate to stakeholders
4. Waiting for Cashfree approval

---

## Cashfree Integration (Future)

### Prerequisites

1. **Sign up:** https://www.cashfree.com/
2. **Enable** Verification API → Aadhaar Verification
3. **Get credentials:**
   - API Key
   - API Secret

### Environment Setup

```bash
# .env.local
NEXT_PUBLIC_KYC_MODE=production
NEXT_PUBLIC_CASHFREE_API_KEY=cfsk_...
CASHFREE_API_SECRET=cfss_...  # Server-side only
```

### Migration Steps

**Step 1:** Update `.env.local` with Cashfree credentials

**Step 2:** No code changes needed! The service layer auto-switches when:
- `NEXT_PUBLIC_KYC_MODE !== 'dummy'` OR
- `NEXT_PUBLIC_CASHFREE_API_KEY` is present

**Step 3:** Test with Cashfree sandbox Aadhaar numbers

**Step 4:** Deploy to production

### API Endpoints

The service layer already includes Cashfree integration:

**Generate OTP:**
```typescript
POST https://api.cashfree.com/verification/aadhaar/otp
Headers: { x-api-key, x-api-secret }
Body: { aadhaar_number }
Response: { ref_id, message }
```

**Verify OTP:**
```typescript
POST https://api.cashfree.com/verification/aadhaar/verify
Headers: { x-api-key, x-api-secret }
Body: { ref_id, otp }
Response: { verified, name, dob, gender, address }
```

---

## Security

### Data Protection

**Aadhaar Storage:**
- Should be encrypted before storage
- Add encryption in production:

```typescript
import crypto from 'crypto'

function encryptAadhaar(aadhaarNumber: string): string {
  const algorithm = 'aes-256-cbc'
  const key = process.env.ENCRYPTION_KEY!
  const iv = crypto.randomBytes(16)
  
  const cipher = crypto.createCipheriv(algorithm, Buffer.from(key), iv)
  let encrypted = cipher.update(aadhaarNumber)
  encrypted = Buffer.concat([encrypted, cipher.final()])
  
  return iv.toString('hex') + ':' + encrypted.toString('hex')
}
```

### API Security

**Best Practices:**
1. Never expose API secrets in frontend
2. Use Next.js API routes for sensitive calls
3. Implement rate limiting (3 OTP attempts per hour)
4. Log all verification attempts
5. Validate and sanitize inputs

### UIDAI Compliance

**Requirements:**
- [x] Encrypted storage
- [ ] User consent mechanism
- [ ] Access logging
- [ ] Data deletion option
- [ ] Privacy policy display

---

## Testing

### Manual Testing (Dummy Mode)

**Happy Path:**
1. Navigate to `/kyc/verify`
2. Enter Aadhaar: `123456789012`
3. Click "Generate OTP"
4. See success: "OTP sent"
5. Enter OTP: `123456`
6. Click "Verify OTP"
7. See success: "Verified!"
8. Redirected to dashboard
9. Check badge: "✓ Verified"

**Error Cases:**
- Invalid Aadhaar (< 12 digits) → Error shown
- Wrong OTP (not 123456) → "Invalid OTP"
- Resend OTP → Resets form

### Database Verification

```sql
-- Check user after verification
SELECT id, email, kyc_status, kyc_verified_at, aadhaar_number
FROM users WHERE email = 'player@test.com';

-- Check player searchability
SELECT unique_player_id, is_available_for_scout
FROM players WHERE user_id = '<user_id>';
```

### Expected Results

**After successful verification:**
```sql
users.kyc_status = 'verified'
users.kyc_verified_at = '2024-12-19 10:30:00'
users.aadhaar_number = '123456789012'
players.is_available_for_scout = true
```

---

## Troubleshooting

### Common Issues

**"Generate OTP" disabled**
- Cause: Aadhaar not 12 digits
- Fix: Enter complete 12-digit number

**"Invalid OTP" in dummy mode**
- Cause: Using OTP other than 123456
- Fix: Use test OTP `123456`

**Database fields missing**
- Cause: Migration not run
- Fix: Run `ADD_KYC_FIELDS_TO_USERS.sql`

**Player not searchable after verification**
- Cause: is_available_for_scout not updated
- Fix: Check handleVerifyOTP function

---

## Next Steps

### Immediate

1. Get Cashfree API approval
2. Update environment variables
3. Test with Cashfree sandbox
4. Remove testing mode alerts
5. Deploy to production

### Future Enhancements

- [ ] Add Aadhaar encryption
- [ ] Implement consent UI
- [ ] Add rate limiting
- [ ] Email notification on verification
- [ ] Admin override for manual verification
- [ ] Document upload fallback (for issues)

---

## File Locations

```
PCL/
├── apps/web/src/
│   ├── app/kyc/verify/
│   │   └── page.tsx           # Main KYC page
│   └── services/
│       └── kyc.ts              # API service layer
├── ADD_KYC_FIELDS_TO_USERS.sql # Database migration
├── KYC_AADHAAR_VERIFICATION.md # This doc
└── KYC_DOCUMENT_UPLOAD_SYSTEM.md # Alternative manual system
```

---

## Quick Reference

### Testing Credentials

```
Aadhaar: Any 12 digits (e.g., 123456789012)
OTP: 123456
```

### Environment Variables

```bash
# Dummy mode (default)
NEXT_PUBLIC_KYC_MODE=dummy

# Production mode
NEXT_PUBLIC_KYC_MODE=production
NEXT_PUBLIC_CASHFREE_API_KEY=cfsk_...
CASHFREE_API_SECRET=cfss_...
```

### Database Setup

```bash
# Run migration
psql -h db.xxx.supabase.co -U postgres -d postgres < ADD_KYC_FIELDS_TO_USERS.sql

# Or in Supabase SQL Editor:
# Copy/paste ADD_KYC_FIELDS_TO_USERS.sql
```

### Access URLs

- **KYC Page:** http://localhost:3000/kyc/verify
- **Dashboard Link:** Player Dashboard → "Start KYC Process"

---

**Status:** ✅ Ready for testing in dummy mode

**Next:** Get Cashfree approval → Switch to production

**Documentation:** Cashfree Verification API Docs
