# Debug: "Failed to Update User" Error

## Your Schema Status
✅ **All KYC columns exist in users table:**
- kyc_status
- kyc_verified_at
- full_name
- date_of_birth
- aadhaar_number (UNIQUE constraint)
- aadhaar_verified
- city, district, state
- bank_account_*, pan_*

## Possible Causes

### 1. ❌ Duplicate Aadhaar (Most Likely)
**The `aadhaar_number` column has a UNIQUE constraint**

If you're trying to verify the same Aadhaar twice → Duplicate key error → 500 status

**Symptom:**
```
Error code: 23505 (PostgreSQL duplicate key error)
Error message: "duplicate key value violates unique constraint"
```

**Solution:**
- Try with a different Aadhaar number
- OR clear the aadhaar_number for your test account and try again

**To clear Aadhaar from your test account in Supabase SQL Editor:**
```sql
UPDATE users 
SET aadhaar_number = NULL, 
    aadhaar_verified = FALSE 
WHERE email = 'your-test@email.com';
```

---

### 2. ❌ RLS Policy Blocking Update
**The update might be blocked by Row Level Security (RLS)**

**Symptom:**
```
Error code: 42501 (Permission denied)
Error message: "permission denied for schema public"
```

**Solution:**
- Make sure you're logged in (authenticated)
- Check RLS policies allow UPDATE on users table

---

### 3. ❌ Invalid Data in Aadhaar Response
**The Aadhaar data from Cashfree might have invalid format**

**Example:** If `full_name` contains special characters or is too long

**Solution:**
- Check the Aadhaar data being returned from Cashfree
- Sanitize/validate the data

---

## How to Find the Real Error

### Method 1: Check Browser Console
1. Open DevTools (F12)
2. Go to Console tab
3. Look for the exact error message
4. Copy the error code if shown

### Method 2: Check Supabase Logs
1. Open Supabase Dashboard
2. Click "Logs & Analytics" → "API Logs"
3. Search for: `/api/kyc/verify-aadhaar-otp`
4. Look for the latest failed request
5. Click to see full error details

### Method 3: Check with Test Query
Run this in Supabase SQL Editor to test the update:

```sql
-- Check if your test user exists
SELECT id, email, aadhaar_number, aadhaar_verified 
FROM users 
WHERE email = 'your-email@example.com';

-- Try to update it manually
UPDATE users 
SET kyc_status = 'verified', 
    full_name = 'Test Name', 
    date_of_birth = '1990-01-15'::date
WHERE id = 'your-user-id';
-- If this succeeds, the issue is in the API logic
-- If this fails, it's a schema/RLS issue
```

---

## Next Steps

### 1. Check the Error Code
After trying Aadhaar verification again:
- Check browser console (F12)
- Note the error code (23505, 42501, etc.)
- Share the error code for diagnosis

### 2. Clear Test Data (if needed)
If you're testing with the same Aadhaar:
```sql
UPDATE users 
SET aadhaar_number = NULL, 
    aadhaar_verified = FALSE,
    kyc_status = 'pending'
WHERE id = 'your-user-id';
```

### 3. Try Again with Different Data
- Use a different Aadhaar number
- Ensure Aadhaar data is valid

### 4. If Still Stuck
Share:
- Error code from browser console
- Error message
- Whether it's the same Aadhaar as before

---

## Technical Details: What the API Does

```typescript
// 1. Validate Aadhaar data
// 2. Check for duplicate Aadhaar (same role)
// 3. Verify OTP with Cashfree
// 4. Get Aadhaar data from Cashfree
// 5. Compare with user profile
// 6. UPDATE users table ← ERROR HAPPENS HERE
// 7. Update club/stadium table
// 8. Store in kyc_documents
// 9. Mark OTP request as verified
```

The error "Failed to update user" at step 6 means the database UPDATE query failed.

**Most likely:** Duplicate `aadhaar_number` (UNIQUE constraint violation)

---

## Quick Fix

Try a different Aadhaar number that you haven't used before.

If that works → The issue was duplicate Aadhaar
If it still fails → Check error code in Supabase logs
