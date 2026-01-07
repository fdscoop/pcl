# Stadium Owner Aadhaar Verification - Complete Fix

## Problem
Stadium owner KYC page was getting "Missing required fields" error (400) when trying to send Aadhaar OTP because the API was expecting `club_id` which stadium owners don't have.

## Root Cause
The Aadhaar OTP APIs (`/api/kyc/request-aadhaar-otp` and `/api/kyc/verify-aadhaar-otp`) were hardcoded for club owners only:
- Required `club_id` parameter (line 71 in request-aadhaar-otp)
- Validated club ownership
- Only checked for duplicate Aadhaar among club owners

## Solution Applied

### 1. ✅ Updated API: `/api/kyc/request-aadhaar-otp/route.ts`

**Changes:**
- Made `club_id` and `stadium_id` **optional** (only `aadhaar_number` is required)
- Added role-based duplicate checking (checks for same role, not just club owners)
- Added stadium ownership verification for stadium owners
- Updated database insert to support both `club_id` and `stadium_id`

**Key Code Changes:**
```typescript
// Before:
const { aadhaar_number, club_id } = await request.json()
if (!aadhaar_number || !club_id) { ... }

// After:
const { aadhaar_number, club_id, stadium_id } = await request.json()
if (!aadhaar_number) { ... }  // Only aadhaar_number required
```

**Duplicate Prevention Logic:**
- ✅ **ALLOWED:** Same person with different roles (Player + Club Owner + Stadium Owner = Same Aadhaar)
- ❌ **BLOCKED:** Different people with same role (Club A + Club B = Cannot share Aadhaar)

### 2. ✅ Updated API: `/api/kyc/verify-aadhaar-otp/route.ts`

**Changes:**
- Made `club_id` and `stadium_id` **optional** (only `request_id` and `otp` required)
- Removed validation that required `club_id`

**Key Code Changes:**
```typescript
// Before:
const { request_id, otp, club_id } = await request.json()
if (!request_id || !otp || !club_id) { ... }

// After:
const { request_id, otp, club_id, stadium_id } = await request.json()
if (!request_id || !otp) { ... }  // club_id/stadium_id are optional
```

### 3. ✅ Database Migration: `ADD_STADIUM_ID_TO_KYC_REQUESTS.sql`

**What it does:**
- Adds `stadium_id` column to `kyc_aadhaar_requests` table (nullable, references stadiums table)
- Ensures `club_id` is nullable (for player/stadium owner KYC)
- Creates index for fast queries on `stadium_id`
- Updates RLS policies to support all user roles

**To Apply:**
1. Open Supabase Dashboard → SQL Editor
2. Paste the contents of `ADD_STADIUM_ID_TO_KYC_REQUESTS.sql`
3. Click "Run"

✅ **Already copied to clipboard** - Just paste and run!

### 4. ✅ Updated Frontend: `/apps/web/src/app/dashboard/stadium-owner/kyc/page.tsx`

**Changes:**
- Replaced simplified Aadhaar component with **production-ready version** from club owner KYC
- Component now includes:
  - ✨ Enhanced error handling with detailed mismatch messages
  - 🔒 "Already registered" Aadhaar detection
  - 📱 Resend OTP functionality
  - 🎨 Professional UI with gradients, animations, loading states
  - ✏️ Profile update prompts when data doesn't match
  - ✅ Success state with auto-reload

**API Calls:**
```typescript
// Request OTP - No club_id/stadium_id needed!
fetch('/api/kyc/request-aadhaar-otp', {
  method: 'POST',
  body: JSON.stringify({
    aadhaar_number: aadhaarNumber
  })
})

// Verify OTP - No club_id/stadium_id needed!
fetch('/api/kyc/verify-aadhaar-otp', {
  method: 'POST',
  body: JSON.stringify({
    request_id: requestId,
    otp: otp
  })
})
```

The API automatically detects the user from the session and determines their role!

## How It Works Now

### For Stadium Owners:
1. User opens `/dashboard/stadium-owner/kyc`
2. Enters 12-digit Aadhaar number
3. API receives `aadhaar_number` only (no club_id/stadium_id)
4. API gets user from session → checks user role → validates for stadium_owner
5. Checks if Aadhaar already used by another stadium owner (different person)
6. Sends OTP via Cashfree API
7. User enters OTP
8. API verifies OTP and updates user profile
9. Success! ✅

### For Club Owners:
1. User opens `/dashboard/club-owner/kyc`
2. Enters Aadhaar + provides club_id
3. API validates club ownership
4. Same flow as stadium owner

### For Players:
1. User opens player KYC page
2. Enters Aadhaar (no club_id/stadium_id)
3. Same flow as stadium owner

## Database Schema

### `kyc_aadhaar_requests` Table:
```sql
- id (UUID, primary key)
- user_id (UUID, NOT NULL, references auth.users)
- club_id (UUID, NULL, references clubs)          ← Optional for club KYC
- stadium_id (UUID, NULL, references stadiums)    ← NEW! Optional for stadium KYC
- aadhaar_number (VARCHAR(12), NOT NULL)
- request_id (VARCHAR(255), NOT NULL, UNIQUE)
- status (VARCHAR(50), default 'otp_sent')
- created_at, verified_at, expires_at (TIMESTAMPS)
```

## Testing Checklist

### ✅ Before Testing:
1. Run the SQL migration in Supabase (`ADD_STADIUM_ID_TO_KYC_REQUESTS.sql`)
2. Ensure `ADD_BANK_PAN_KYC_FIELDS.sql` migration is applied
3. Clear browser cache and reload

### ✅ Test Flow:
1. **Request OTP:**
   - Enter valid 12-digit Aadhaar
   - Check browser console for API response
   - Should see: "OTP sent to registered mobile number"

2. **Verify OTP:**
   - Enter 6-digit OTP from SMS
   - Check browser console for API response
   - Should see success message and auto-reload

3. **Error Handling:**
   - Try invalid Aadhaar (less than 12 digits) → Should show validation error
   - Try wrong OTP → Should show "Invalid OTP" error
   - Try duplicate Aadhaar → Should show "Already registered" error

4. **Data Mismatch:**
   - If Aadhaar name ≠ profile name → Should show detailed mismatch error
   - Should display "Update Profile" button
   - Click button → Should redirect to settings page

## Production Cashfree Integration

✅ **Already configured!** The stadium owner KYC now uses the exact same production Cashfree credentials as club/player dashboards.

**Environment Variables Required:**
```env
NEXT_PUBLIC_CASHFREE_KEY_ID=your_key_id
CASHFREE_SECRET_KEY=your_secret_key
CASHFREE_PUBLIC_KEY=your_public_key (for e-signature)
```

## Files Modified

### Backend (API):
1. `/apps/web/src/app/api/kyc/request-aadhaar-otp/route.ts` - Made multi-role compatible
2. `/apps/web/src/app/api/kyc/verify-aadhaar-otp/route.ts` - Made multi-role compatible

### Frontend:
1. `/apps/web/src/app/dashboard/stadium-owner/kyc/page.tsx` - Production Aadhaar component

### Database:
1. `ADD_STADIUM_ID_TO_KYC_REQUESTS.sql` - New migration
2. `ADD_BANK_PAN_KYC_FIELDS.sql` - Existing migration for bank/PAN fields

## Next Steps

1. **Apply Database Migration:**
   ```
   The SQL is already in your clipboard!
   Open Supabase → SQL Editor → Paste → Run
   ```

2. **Test the Flow:**
   - Go to http://localhost:3000/dashboard/stadium-owner/kyc
   - Try Aadhaar verification with a valid Aadhaar number
   - Complete the full OTP flow

3. **Implement Bank & PAN Verification:**
   - Bank account verification (similar to Aadhaar)
   - PAN verification (may need separate API or manual verification)

## Error Reference

### "Missing required fields" (400)
- **Cause:** API expected `club_id` but stadium owner doesn't have one
- **Fixed:** ✅ Made `club_id` optional, added `stadium_id` support

### "Aadhaar Already Registered"
- **Cause:** Another user with same role already verified this Aadhaar
- **Expected:** This prevents fraud (different people sharing Aadhaar)

### Data Mismatch
- **Cause:** Aadhaar name/DOB doesn't match user profile
- **Solution:** User must update profile to match Aadhaar exactly

## Support

If you encounter any issues:
1. Check browser console for detailed error logs
2. Check Supabase logs (Logs & Analytics → API Logs)
3. Verify database migrations are applied
4. Contact support@professionalclubleague.com

---

**Status:** ✅ **COMPLETE - READY FOR TESTING**

All code changes applied, SQL migration ready, production-ready component integrated!
