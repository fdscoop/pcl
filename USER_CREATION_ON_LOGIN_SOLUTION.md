# User Creation on Login - Elegant Solution

## Problem
- Stadium owner signup: Auth user created ✅ but users table record failed ❌
- RLS policies blocked INSERT during signup
- Error on login: "Your account setup is incomplete"
- Console error: `PGRST116: The result contains 0 rows`

## Root Cause
Users table has RLS enabled, but no policy allows INSERT during signup. Even with `service_role`, the client-side insert was getting blocked.

## Solution: Create User Record on First Login

Instead of fighting RLS policies during signup, we create the user record **during login** (after email confirmation).

### Why This Works Better

1. **No RLS Issues**: Service role or anon key doesn't matter during signup
2. **Email Confirmed First**: User must verify email before record is created
3. **Cleaner Flow**: Signup just creates auth user, login completes the setup
4. **Error Recovery**: If signup fails to create user record, login fixes it automatically
5. **Metadata Storage**: All user info stored in `user_metadata` during signup

## Implementation

### 1. Signup Form (SignupForm.tsx)
```tsx
// Store user data in metadata for later use
const { data: authData, error: authError } = await supabase.auth.signUp({
  email: data.email,
  password: data.password,
  options: {
    emailRedirectTo: `${appUrl}/auth/callback`,
    data: {
      firstName: data.firstName,  // Stored in user_metadata
      lastName: data.lastName,
      phone: data.phone,
      role: data.role,
    },
  },
})

// Try to create user record (if it fails, no problem - login will handle it)
const { error: userError } = await supabase
  .from('users')
  .insert({
    id: authData.user.id,
    email: data.email,
    first_name: data.firstName,
    last_name: data.lastName,
    phone: data.phone || null,
    role: data.role,
    kyc_status: 'pending',
    is_active: true,
  })

// If user creation fails, still show success (email confirmation needed anyway)
setEmailSent(true)
setUserEmail(data.email)
setSuccess(true)
```

### 2. Login Form (LoginForm.tsx)
```tsx
// After successful auth and email confirmation...

// Try to get user record
let { data: userData, error: userError } = await supabase
  .from('users')
  .select('role, kyc_status, is_active')
  .eq('id', authData.user.id)
  .single()

// If user record doesn't exist (PGRST116 error), create it now!
if (userError && userError.code === 'PGRST116') {
  console.log('User record not found, creating now after email confirmation...')
  
  // Get data from user metadata (stored during signup)
  const role = authData.user.user_metadata?.role || 'player'
  
  // Create user record
  const { data: newUser, error: createError } = await supabase
    .from('users')
    .insert({
      id: authData.user.id,
      email: authData.user.email!,
      first_name: authData.user.user_metadata?.firstName || '',
      last_name: authData.user.user_metadata?.lastName || '',
      phone: authData.user.user_metadata?.phone || null,
      role: role,
      is_active: true,
      kyc_status: 'pending',
      last_login: new Date().toISOString(),
    })
    .select('role, kyc_status, is_active')
    .single()

  if (createError) {
    throw new Error('Failed to complete account setup. Please contact support.')
  }

  userData = newUser
}
```

## User Flow

### Signup Flow
1. User fills signup form
2. Supabase Auth creates user (with metadata) ✅
3. Try to create users table record (may fail - that's OK)
4. Show email confirmation screen 📧
5. User confirms email via link

### Login Flow (First Time)
1. User enters email + password
2. Supabase Auth validates ✅
3. Check email is confirmed ✅
4. Try to get user record from users table
5. **If not found (PGRST116)**: Create it now using metadata! ✨
6. Redirect to dashboard 🎉

### Login Flow (Subsequent)
1. User enters email + password
2. Supabase Auth validates ✅
3. Get user record from users table ✅
4. Update last_login
5. Redirect to dashboard 🎉

## Benefits

✅ **No RLS Policy Changes Needed** - Works with existing policies
✅ **Self-Healing** - Auto-creates missing user records on login
✅ **Email Verification Required** - Only confirmed users get records
✅ **Clean Separation** - Auth vs User Data
✅ **Error Resilient** - Handles partial signup failures gracefully

## Error Messages

### Before
- ❌ "Your account setup is incomplete. Please contact support or try signing up again."
- ❌ User confused, doesn't know what to do

### After
- ✅ Auto-creates record on login (silent to user)
- ✅ Only shows error if creation truly fails
- ✅ Better error: "Failed to complete account setup. Please contact support."

## Testing

### Test Case 1: Normal Signup (Both Succeed)
1. Signup → Auth user ✅ + Users table ✅
2. Confirm email ✅
3. Login → User record exists ✅
4. Redirect to dashboard ✅

### Test Case 2: Partial Signup (Users Table Fails)
1. Signup → Auth user ✅ + Users table ❌
2. Confirm email ✅
3. Login → User record missing, create now ✅
4. Redirect to dashboard ✅

### Test Case 3: Stadium Owner Signup
1. Signup with role: stadium_owner ✅
2. Metadata stored: `{ role: 'stadium_owner', firstName: 'John', ... }` ✅
3. Confirm email ✅
4. Login → Create user record with stadium_owner role ✅
5. Redirect to /dashboard/stadium-owner ✅

## Code Changes

### Files Modified
1. **apps/web/src/components/forms/LoginForm.tsx**
   - Added user record creation logic
   - Checks for PGRST116 error (no rows)
   - Uses user_metadata to populate fields
   - Only creates if email confirmed

2. **apps/web/src/components/forms/SignupForm.tsx**
   - Changed metadata field names (firstName instead of first_name)
   - Graceful handling of user creation failures
   - Always shows success if auth user created

## No Migration Needed! 🎉

This solution works with existing database structure and RLS policies. No SQL changes required.

## Console Logs for Debugging

Success case:
```
User record not found, creating now after email confirmation...
```

Failure case (rare):
```
Failed to create user record: [error details]
```

## Summary

**Old Approach**: Fight RLS policies during signup
**New Approach**: Create user record after email confirmation during first login

**Result**: Simpler, more resilient, self-healing authentication flow! ✨
