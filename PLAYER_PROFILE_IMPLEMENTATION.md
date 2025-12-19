# Player Profile Completion Feature

## What Was Added

### 1. Player Profile Form Component
**File**: [apps/web/src/components/forms/PlayerProfileForm.tsx](apps/web/src/components/forms/PlayerProfileForm.tsx)

A comprehensive form for players to complete their profile with:
- **Playing Position** (Required): Goalkeeper, Defender, Midfielder, Forward, Winger
- **Jersey Number** (Optional): 1-99
- **Date of Birth** (Required)
- **Nationality** (Required)
- **Height in cm** (Required): 100-250 cm
- **Weight in kg** (Required): 30-150 kg
- **Preferred Foot** (Required): Left, Right, or Both
- **Bio** (Optional): Free text for achievements and playing style

Features:
- Form validation with Zod schema
- Error handling and display
- Loading states
- Updates `profile_completed` flag to `true` on save
- Redirects to player dashboard after successful save

### 2. Profile Completion Page
**File**: [apps/web/src/app/profile/player/complete/page.tsx](apps/web/src/app/profile/player/complete/page.tsx)

Protected page that:
- Checks user authentication (redirects to login if not authenticated)
- Verifies user has 'player' role (redirects if not)
- Checks if profile already completed (redirects to dashboard if yes)
- Shows the PlayerProfileForm component
- Includes PCL logo and consistent navigation

### 3. Dashboard Integration
**Updated**: [apps/web/src/app/dashboard/player/page.tsx](apps/web/src/app/dashboard/player/page.tsx:155-160)

The "Complete Profile" button now navigates to `/profile/player/complete`:
```tsx
<Button
  className="w-full"
  onClick={() => router.push('/profile/player/complete')}
>
  Complete Profile
</Button>
```

### 4. Database Schema Update
**File**: [UPDATE_DATABASE_PLAYER_FIELDS.sql](UPDATE_DATABASE_PLAYER_FIELDS.sql)

SQL script to add player profile fields to the `users` table:
- Creates `playing_position` enum type
- Creates `foot_preference` enum type
- Adds 9 new columns with appropriate constraints
- Creates indexes for performance
- Adds documentation comments

## Next Steps to Make It Work

### Step 1: Update the Database
Run the SQL in Supabase SQL Editor:

1. Go to https://supabase.com/dashboard/project/uvifkmkdoiohqrdbwgzt/sql/new
2. Copy the contents of `UPDATE_DATABASE_PLAYER_FIELDS.sql`
3. Paste and click "Run"
4. Verify success (should see "Success. No rows returned")

### Step 2: Test the Flow

1. Log in as a player account
2. Click "Complete Profile" button on dashboard
3. Fill in all required fields
4. Click "Save Profile"
5. Should redirect back to dashboard

### Step 3: Verify Profile Completion

After completing the profile, the database should show:
- All player fields populated
- `profile_completed = true`

You can verify with this SQL query:
```sql
SELECT
  email,
  first_name,
  position,
  nationality,
  profile_completed
FROM users
WHERE role = 'player';
```

## User Flow Diagram

```
Player Dashboard
    ↓
Click "Complete Profile" button
    ↓
/profile/player/complete page
    ↓
Fill form with player details
    ↓
Submit form
    ↓
Data saved to users table
    ↓
profile_completed set to true
    ↓
Redirect to Player Dashboard
```

## Future Enhancements

1. **Show Profile Completion Status on Dashboard**
   - Display a progress indicator
   - Show which fields are still empty
   - Add "Edit Profile" button after completion

2. **Profile Display Page**
   - Create a public player profile view
   - Show stats and achievements
   - Add profile photo upload

3. **Profile Validation for Scout Searches**
   - Only show players with completed profiles in scout search
   - Require profile completion before receiving contract offers

4. **Additional Player Fields**
   - Previous clubs
   - Career statistics (goals, assists, matches)
   - Awards and achievements
   - Video highlights URL
   - Social media links

## Files Modified/Created

### New Files
- ✅ `/apps/web/src/components/forms/PlayerProfileForm.tsx` (Form component)
- ✅ `/apps/web/src/app/profile/player/complete/page.tsx` (Profile completion page)
- ✅ `/UPDATE_DATABASE_PLAYER_FIELDS.sql` (Database migration)
- ✅ `/PLAYER_PROFILE_IMPLEMENTATION.md` (This documentation)

### Modified Files
- ✅ `/apps/web/src/app/dashboard/player/page.tsx` (Added button navigation)

## Testing Checklist

- [ ] Run database migration SQL
- [ ] Log in as player
- [ ] Click "Complete Profile" button
- [ ] Verify form validation (try submitting empty)
- [ ] Fill all required fields
- [ ] Submit form
- [ ] Verify redirect to dashboard
- [ ] Check database to confirm data saved
- [ ] Try accessing `/profile/player/complete` again (should redirect to dashboard)
- [ ] Log out and log in as different role (should not access player profile page)

## Common Issues

**Issue**: Form submission fails with "column does not exist"
**Solution**: Make sure you ran the database migration SQL

**Issue**: Can't access profile page (redirects immediately)
**Solution**: Check that user is logged in and has 'player' role

**Issue**: Profile already completed but still can access page
**Solution**: Check `profile_completed` value in database

**Issue**: Date picker not working in some browsers
**Solution**: The HTML5 date input has good support in modern browsers. For older browsers, consider adding a date picker library like react-day-picker.
