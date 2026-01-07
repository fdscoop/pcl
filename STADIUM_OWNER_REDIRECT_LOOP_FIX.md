# 🔄 Stadium Owner Dashboard Redirect Loop - FIXED

## Problem
When logging in as a stadium owner and accessing `/dashboard/stadium-owner`, the page would:
1. Redirect to `/dashboard` (generic dashboard)
2. Which would redirect back to `/dashboard/stadium-owner`
3. Creating an infinite redirect loop

## Root Cause
The issue was in `/apps/web/src/app/dashboard/stadium-owner/layout.tsx`:

```tsx
// OLD CODE - PROBLEMATIC
const checkStadiumOwner = async () => {
  try {
    // ...
    const { data: stadiumData, error } = await supabase
      .from('stadiums')
      .select('*')
      .eq('owner_id', user.id)
      .eq('is_active', true)
      .single()  // ❌ REQUIRES a stadium to exist

    if (error || !stadiumData) {
      // ❌ Redirects to /dashboard when NO stadium exists
      router.push('/dashboard')
      return
    }
    // ...
  }
}
```

**The Problem:**
- Used `.single()` which throws an error if NO stadium exists
- If the user hasn't created a stadium yet, it redirects to `/dashboard`
- `/dashboard` redirects back to `/dashboard/stadium-owner` (based on role)
- Creates an infinite loop

## Solution
Changed the logic to:

```tsx
// NEW CODE - FIXED
const checkStadiumOwner = async () => {
  try {
    // 1. First verify user authentication
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/auth/login')
      return
    }

    // 2. Verify user role is stadium_owner
    const { data: userData } = await supabase
      .from('users')
      .select('role, is_active')
      .eq('id', user.id)
      .single()

    if (userData.role !== 'stadium_owner') {
      router.push('/dashboard')
      return
    }

    // 3. Try to get stadium (optional - use .maybeSingle())
    const { data: stadiumData } = await supabase
      .from('stadiums')
      .select('*')
      .eq('owner_id', user.id)
      .eq('is_active', true)
      .maybeSingle()  // ✅ Returns NULL if not found (no error)

    setStadium(stadiumData)  // null is okay, dashboard handles it
  } catch (error) {
    console.error('Error checking stadium owner:', error)
    router.push('/auth/login')
  } finally {
    setLoading(false)
  }
}
```

## Key Changes
1. **Verification Order**: Check auth → verify role → fetch stadium
2. **Used `.maybeSingle()`**: Returns `null` instead of error if no stadium exists
3. **Allow NULL stadium**: Dashboard page gracefully handles stadium owner without a registered stadium
4. **Better error handling**: Only redirects on auth errors, not on missing stadium

## What Happens Now
- ✅ Stadium owner CAN access `/dashboard/stadium-owner` even without a stadium
- ✅ Dashboard shows "No stadiums yet" message instead of infinite loop
- ✅ User can click "List Stadium" button to create their first stadium
- ✅ Once stadium is created, sidebar shows the stadium name

## Testing
1. Create a stadium owner account
2. Don't create any stadium yet
3. Go to `http://localhost:3005/dashboard/stadium-owner`
4. **Expected**: Dashboard loads with "No stadiums listed yet" message
5. **Before Fix**: Would loop between `/dashboard` and `/dashboard/stadium-owner`

## Files Modified
- ✅ `/apps/web/src/app/dashboard/stadium-owner/layout.tsx` - Fixed `checkStadiumOwner()` function
