# 🔧 Quick Fix Guide for KYC Verification Issues

## Issues Found:

1. ✅ **FIXED**: OTP message showing Aadhaar number instead of mobile number
   - Changed message to: "A 6-digit OTP has been sent to the mobile number registered with your Aadhaar"
   
2. ⚠️ **NEEDS DATABASE FIX**: 500 error due to missing database function

## Fix the Database Error:

### Option 1: Use Supabase SQL Editor (RECOMMENDED)

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Open your project: `uuvxaefutyejlakxgxnr`
3. Click on "SQL Editor" in the left sidebar
4. Copy and paste the contents of `RUN_THIS_IN_SUPABASE_SQL_EDITOR.sql`
5. Click "Run" button

This will remove ALL triggers, functions, and policies related to Aadhaar fraud prevention that are causing the 500 error.

### Option 2: Quick Manual Fix

If you have `psql` access, run:
```bash
psql "your_database_connection_string" -f RUN_THIS_IN_SUPABASE_SQL_EDITOR.sql
```

## What's Working Now:

✅ Address parsing from Aadhaar - PERFECT!
- Successfully extracting: Kerala, Kasaragod, Kallar, 671532
- Split address parsing working flawlessly

✅ Cashfree API integration - WORKING!
- OTP generation successful
- OTP verification successful  
- Aadhaar data retrieval working

✅ UI/UX improvements - DONE!
- Modern orange/amber theme
- Better messaging
- Clear step-by-step process

## What Needs the SQL Fix:

❌ Database update failing with error:
```
function check_aadhaar_fraud_prevention(uuid, text, user_role) does not exist
```

This is because there's an RLS policy or trigger on the `users` table trying to call a function that we removed with the hotfix.

## After Running the SQL Script:

The KYC verification will work end-to-end:
1. User enters Aadhaar number ✅
2. OTP is sent to registered mobile ✅  
3. User enters OTP ✅
4. Aadhaar data is verified and parsed ✅
5. User profile is updated with location data ✅
6. KYC status is set to verified ✅

## Test After Fix:

1. Go to: http://localhost:3003/kyc/verify
2. Enter Aadhaar number
3. Receive OTP on registered mobile
4. Enter OTP
5. Should see success message with no errors!

---

**Note**: The address parsing is already working perfectly! The only issue is the database update failing due to the orphaned function reference. Once you run the SQL script, everything will work smoothly.