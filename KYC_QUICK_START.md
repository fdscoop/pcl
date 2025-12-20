# KYC Aadhaar Verification - Quick Start

## 🚀 Get Started in 2 Minutes

### Step 1: Run Database Migration

```bash
# Go to Supabase SQL Editor
https://supabase.com/dashboard/project/uvifkmkdoiohqrdbwgzt/sql

# Copy and run: ADD_KYC_FIELDS_TO_USERS.sql
```

**What it does:**
- Adds `aadhaar_number` column to users table
- Adds `kyc_verified_at` timestamp
- Creates index on `kyc_status`

---

### Step 2: Test the Flow

**As a Player:**

1. **Start app:** `npm run dev`

2. **Login as player**

3. **Go to:** http://localhost:3000/kyc/verify

4. **Enter Aadhaar:** Any 12 digits (e.g., `123456789012`)

5. **Click:** "Generate OTP"

6. **Enter OTP:** `123456` (testing OTP)

7. **Click:** "Verify OTP"

8. **Result:** ✅ You're verified!

---

## What Happens

```
You enter Aadhaar
    ↓
Click "Generate OTP"
    ↓
Dummy API returns success (1.5s delay)
    ↓
OTP screen appears
    ↓
You enter: 123456
    ↓
Click "Verify OTP"
    ↓
Dummy API verifies (1.5s delay)
    ↓
✅ Success! Database updated:
   • kyc_status = 'verified'
   • kyc_verified_at = now()
   • aadhaar_number = '123456789012'
   • is_available_for_scout = true
    ↓
Redirect to dashboard
    ↓
See "✓ Verified" badge
```

---

## Testing Credentials

```
Aadhaar Number: Any 12 digits
                (e.g., 123456789012)

OTP:            123456
                (only this works in dummy mode)
```

---

## Files You Need

1. **Database:**
   - `ADD_KYC_FIELDS_TO_USERS.sql` ← Run this first

2. **Frontend:**
   - `apps/web/src/app/kyc/verify/page.tsx` ← KYC page (already created)
   - `apps/web/src/services/kyc.ts` ← API service (already created)

3. **Documentation:**
   - `KYC_AADHAAR_VERIFICATION.md` ← Full guide
   - `KYC_QUICK_START.md` ← This file

---

## Verify It Works

### Check Database

```sql
-- After verification, check user
SELECT
  email,
  kyc_status,
  kyc_verified_at,
  aadhaar_number
FROM users
WHERE email = 'your-player-email@example.com';
```

**Expected:**
```
kyc_status: verified
kyc_verified_at: 2024-12-19 10:30:00
aadhaar_number: 123456789012
```

### Check Player Searchability

```sql
SELECT
  unique_player_id,
  is_available_for_scout
FROM players
WHERE user_id = (SELECT id FROM users WHERE email = 'your-player-email@example.com');
```

**Expected:**
```
is_available_for_scout: true
```

---

## Common Issues

### "Column aadhaar_number does not exist"
**Fix:** Run `ADD_KYC_FIELDS_TO_USERS.sql` in Supabase

### "Invalid OTP" error
**Fix:** Use OTP `123456` (dummy mode only accepts this)

### Not redirecting after verification
**Fix:** Check browser console for errors

### Player not searchable
**Fix:** Check `is_available_for_scout` column in players table

---

## Next: Switch to Real Cashfree API

When you get Cashfree approval:

1. **Get credentials** from Cashfree dashboard

2. **Update `.env.local`:**
   ```bash
   NEXT_PUBLIC_KYC_MODE=production
   NEXT_PUBLIC_CASHFREE_API_KEY=cfsk_...
   CASHFREE_API_SECRET=cfss_...
   ```

3. **Restart app:** `npm run dev`

4. **Test with real Aadhaar** (or Cashfree test numbers)

5. **Remove testing alerts** from UI

6. **Deploy!**

No code changes needed - the service layer switches automatically!

---

## Quick Links

- **KYC Page:** http://localhost:3000/kyc/verify
- **Dashboard:** http://localhost:3000/dashboard/player
- **Supabase SQL:** https://supabase.com/dashboard/project/uvifkmkdoiohqrdbwgzt/sql
- **Full Docs:** `KYC_AADHAAR_VERIFICATION.md`

---

**Ready to test?** Run the SQL migration and go to `/kyc/verify`! 🎉
