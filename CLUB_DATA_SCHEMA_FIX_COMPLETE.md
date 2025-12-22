# Club Data Schema Fix - Complete

## Problem Identified

The error was: **`column clubs.contact_email does not exist`**

This was NOT an RLS issue - it was a schema mismatch!

### Your Actual Database Schema:
```
email          (not contact_email)
phone          (not contact_phone)
website        (not official_website)
```

### What the Code Was Trying to Fetch:
```
contact_email
contact_phone
official_website
```

## Files Fixed

I've updated all references to match your actual database schema:

### 1. Contract View Page
**File**: `apps/web/src/app/dashboard/player/contracts/[id]/view/page.tsx`

**Changes**:
- Line 220: Changed query from `contact_email, contact_phone, official_website` to `email, phone, website`
- Lines 22-34: Updated Contract interface `clubs` object
- Lines 239-250: Updated fallback object
- Lines 280-281: Updated contract HTML generation parameters
- Lines 605-619: Updated UI display to use `email` and `phone`

### 2. Contract List Page
**File**: `apps/web/src/app/dashboard/player/contracts/page.tsx`

**Changes**:
- Line 109: Changed query from `contact_email, contact_phone` to `email, phone`
- Lines 35-44: Updated Contract interface `clubs` object
- Lines 579, 584: Updated UI display to use `email` and `phone`

## What's Fixed Now

✅ **Database query matches actual schema**
- Queries now use `email`, `phone`, `website` (correct column names)

✅ **TypeScript interfaces updated**
- Contract interfaces now match the actual database schema

✅ **UI displays corrected**
- Club profile cards now reference the correct field names

✅ **Contract HTML generation fixed**
- Contract generator receives the correct field names

## Test Your App Now

1. **Refresh your browser**: http://localhost:3006/dashboard/player/contracts
2. **Click on a contract** to view it
3. **Check the console** - you should now see:
   ```
   Club data loaded successfully: {
     club_name: "Your Club Name",
     email: "club@email.com",
     phone: "+1234567890",
     ...
   }
   ```

## Expected Results

### Contract List Page:
```
✅ Club names display correctly
✅ Club logos show
✅ Club location shows (city, state)
✅ Club contact info in expanded details (email, phone)
✅ No errors in console
```

### Contract View Page:
```
✅ Player Profile Card shows all player data
✅ Club Profile Card shows:
   - Club name
   - Club logo
   - Club location
   - Club email (if exists in database)
   - Club phone (if exists in database)
✅ Contract HTML generated with correct club data
✅ No errors in console
```

## If Club Contact Info Shows "N/A"

This is normal if your clubs don't have email/phone data yet. To add it:

```sql
UPDATE clubs
SET
  email = 'info@yourclub.com',
  phone = '+1234567890'
WHERE id = 'your-club-id';
```

## Summary

The issue was a simple schema mismatch - your database uses `email`, `phone`, `website` but the code was trying to fetch `contact_email`, `contact_phone`, `official_website`.

All code has been updated to match your actual database schema. The app should now work correctly!

---

**Refresh your browser now and check if club data loads!**
