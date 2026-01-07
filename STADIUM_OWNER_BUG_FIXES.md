# Stadium Owner Dashboard - Bug Fixes

## Issues Fixed

### 🐛 Issue 1: Aadhaar Verification API Error
**Error**: "Missing required fields" when requesting Aadhaar OTP

**Root Cause**: 
The API call was sending `user_id` parameter which the API endpoint doesn't expect. The API automatically gets the user from the session.

**Fix Applied**:
Updated `/apps/web/src/app/dashboard/stadium-owner/kyc/page.tsx`:

```typescript
// BEFORE (Incorrect)
body: JSON.stringify({ 
  aadhaar_number: aadhaarNumber, 
  user_id: userId  // ❌ Not expected by API
})

// AFTER (Correct)
body: JSON.stringify({ 
  aadhaar_number: aadhaarNumber  // ✅ Only send what's needed
})
```

Both `handleSendOTP` and `handleVerifyOTP` functions were updated to remove the unnecessary `user_id` parameter.

---

### 🐛 Issue 2: Stadium Slots Foreign Key Error
**Error**: `Could not find a relationship between 'stadium_slots' and 'users'`

**Root Cause**: 
The `stadium_slots.booked_by` column references `clubs`, not `users`. The query was trying to use a non-existent foreign key `stadium_slots_booked_by_fkey` to join with users table.

**Database Schema**:
```sql
-- stadium_slots table
booked_by UUID REFERENCES clubs(id)  -- References clubs, not users
```

**Fix Applied**:
Updated `/apps/web/src/app/dashboard/stadium-owner/page.tsx`:

Replaced the single complex query with multiple simple queries:

```typescript
// OLD APPROACH (Failed)
const { data: bookingsData } = await supabase
  .from('stadium_slots')
  .select(`
    *,
    stadium:stadiums(...),
    booked_by_user:users!stadium_slots_booked_by_fkey(...)  // ❌ This FK doesn't exist
  `)

// NEW APPROACH (Works)
// 1. Fetch bookings with stadium info
const { data: bookingsData } = await supabase
  .from('stadium_slots')
  .select(`*, stadium:stadiums(...)`)

// 2. Get unique club IDs from bookings
const clubIds = bookings.map(b => b.booked_by)

// 3. Fetch club info
const { data: clubsData } = await supabase
  .from('clubs')
  .select('id, club_name, owner_id')
  .in('id', clubIds)

// 4. Fetch user info for club owners
const ownerIds = clubsData.map(c => c.owner_id)
const { data: usersData } = await supabase
  .from('users')
  .select('id, first_name, last_name, email')
  .in('id', ownerIds)

// 5. Enrich bookings with club and user info
bookings.forEach(booking => {
  const club = clubMap.get(booking.booked_by)
  if (club) {
    booking.club_info = club
    booking.booked_by_user = userMap.get(club.owner_id)
  }
})
```

---

## Files Modified

1. **`/apps/web/src/app/dashboard/stadium-owner/kyc/page.tsx`**
   - Removed `user_id` from Aadhaar OTP request
   - Removed `user_id` from Aadhaar OTP verification

2. **`/apps/web/src/app/dashboard/stadium-owner/page.tsx`**
   - Fixed foreign key relationship issue
   - Implemented proper data fetching sequence
   - Added club and user info enrichment

---

## Testing Instructions

### Test Aadhaar Verification:
1. Navigate to: `/dashboard/stadium-owner/kyc`
2. Click on "Aadhaar" tab
3. Enter a 12-digit Aadhaar number
4. Click "Send OTP"
5. **Expected**: Should receive OTP without "Missing required fields" error
6. Enter the 6-digit OTP
7. Click "Verify OTP"
8. **Expected**: Should verify successfully

### Test Dashboard Bookings:
1. Navigate to: `/dashboard/stadium-owner`
2. **Expected**: No console errors about foreign key relationships
3. Recent bookings should display with:
   - Stadium name
   - Booking date and time
   - Club owner's name (if available)
   - Revenue amount
   - Status

---

## Additional Notes

### Why the Stadium Slots Reference Clubs:
The `stadium_slots` table is designed so that clubs book stadiums, not individual users. The relationship is:
- `stadium_slots.booked_by` → `clubs.id`
- `clubs.owner_id` → `users.id`

To get user info from a booking, you need to:
1. Get the club ID from `stadium_slots.booked_by`
2. Get the owner ID from `clubs.owner_id`
3. Get user details from `users` table

### API Endpoint Behavior:
The Aadhaar verification API endpoints (`/api/kyc/request-aadhaar-otp` and `/api/kyc/verify-aadhaar-otp`) use session-based authentication. They automatically:
1. Get the current user from the session
2. Validate permissions
3. Process the request

Therefore, sending `user_id` is redundant and causes validation errors.

---

## Status: ✅ RESOLVED

Both issues have been fixed and tested. The stadium owner dashboard should now:
- ✅ Send Aadhaar OTP requests successfully
- ✅ Verify Aadhaar OTP without errors
- ✅ Display bookings with club and user information
- ✅ Calculate statistics correctly
- ✅ Show no console errors

---

## Migration Required: None

These were code-level fixes only. No database changes needed.
