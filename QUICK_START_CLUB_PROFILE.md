# Quick Start: Club Profile Dashboard

## Major Change: Club Profile, Not Personal Data

The dashboard now shows your **CLUB PROFILE** instead of personal information.

## Before Testing

### Run This SQL (IMPORTANT)

1. Go to: https://supabase.com/dashboard/project/uvifkmkdoiohqrdbwgzt/sql/new
2. Copy contents of `UPDATE_CLUB_CONSTRAINT_ONE_PER_OWNER.sql`:

```sql
ALTER TABLE clubs DROP CONSTRAINT IF EXISTS unique_club_name_owner;
ALTER TABLE clubs ADD CONSTRAINT unique_club_per_owner UNIQUE(owner_id);
```

3. Click "Run"
4. Should see "Success"

This ensures **one club per owner**.

## What You'll See

### If You Don't Have a Club Yet

```
Welcome to PCL! 🏆
Create your club profile to get started

[Create Your Club Profile]

Note: Each account can create one club profile
```

### If You Already Have a Club

```
[Club Logo]  Your Club Name              [Edit Profile]
             [Registered] [Professional] [Active]
             📍 City, State, Country
             📧 email • 📞 phone

Founded  Teams  Players  Matches
2020     0      0        0

[Manage Teams] [Scout Players] [Matches]
```

## Key Changes

1. **One Club Only** ✅
   - Each account = ONE club profile
   - Can't create second club
   - Clear error if you try

2. **Club Profile Displayed** ✅
   - Shows club info, not personal data
   - Logo front and center
   - Founded year, location, contacts

3. **Onboarding for New Users** ✅
   - Clear setup screen
   - Explains one-club policy
   - Single button to create

4. **Club Stats** ✅
   - Founded year
   - Teams, Players, Matches (placeholders)

## Testing

### Test 1: First Time User
1. Log in as club owner (no club yet)
2. See "Welcome to PCL!" screen
3. Click "Create Club Profile"
4. Fill form + upload logo
5. Submit
6. Dashboard shows YOUR CLUB PROFILE

### Test 2: Existing Club Owner
1. Log in (already have club)
2. Dashboard immediately shows club profile
3. See club name, logo, details
4. No "create club" button

### Test 3: Try Second Club
1. Already have a club
2. Go to `/club/create`
3. Try to submit
4. Get error: "You have already created a club..."

## What If I Have Multiple Clubs?

After running the SQL update, you might get an error if you already have multiple clubs.

**To fix:**
1. Go to Supabase dashboard → Table Editor → clubs
2. Keep the club you want
3. Delete the others
4. Now the constraint will work

## Quick Reference

| Scenario | What You See |
|----------|--------------|
| No club | Onboarding screen with "Create Club Profile" |
| Have club | Club profile with logo, stats, actions |
| Try 2nd club | Error: "already created a club" |

## Files Changed

- ✅ Club Owner Dashboard - Shows club profile
- ✅ Club Creation Form - Blocks second club
- ✅ Database - One club per owner constraint

## Success Criteria

After update, you should:
- ✅ See club profile on dashboard (not personal data)
- ✅ See club logo prominently displayed
- ✅ See founded year in stats
- ✅ Be unable to create second club
- ✅ See "Edit Profile" button

Perfect! Your dashboard is now **club-centric**. 🏆
