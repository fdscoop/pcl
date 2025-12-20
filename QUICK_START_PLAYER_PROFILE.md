# Quick Start: Player Profile Feature

## What's Ready

✅ Player profile completion form with validation
✅ Profile completion page at `/profile/player/complete`
✅ Dashboard button linked to profile page
✅ Protected route (only players can access)
✅ Automatic redirect after profile completion

## Before You Test

### Run This SQL in Supabase

1. Go to: https://supabase.com/dashboard/project/uvifkmkdoiohqrdbwgzt/sql/new
2. Copy everything from `UPDATE_DATABASE_PLAYER_FIELDS.sql`
3. Click "Run"
4. You should see: **"Success. No rows returned"**

## How to Test

1. **Log in** as your player account
2. You'll see your dashboard with a **"Complete Profile"** button
3. **Click** the button
4. **Fill in** the form:
   - Position (dropdown)
   - Jersey number (optional, 1-99)
   - Date of birth
   - Nationality
   - Height (cm)
   - Weight (kg)
   - Preferred foot (dropdown)
   - Bio (optional)
5. **Click "Save Profile"**
6. You'll be redirected back to the dashboard

## Form Fields

| Field | Required | Type | Example |
|-------|----------|------|---------|
| Position | ✅ Yes | Dropdown | Midfielder |
| Jersey Number | ❌ No | Number | 10 |
| Date of Birth | ✅ Yes | Date | 1995-06-15 |
| Nationality | ✅ Yes | Text | Indian |
| Height (cm) | ✅ Yes | Number | 175 |
| Weight (kg) | ✅ Yes | Number | 70 |
| Preferred Foot | ✅ Yes | Dropdown | Right |
| Bio | ❌ No | Text area | Experienced midfielder... |

## Available Positions

- Goalkeeper
- Defender
- Midfielder
- Forward
- Winger

## Available Foot Preferences

- Left
- Right
- Both

## File Locations

```
Player Profile Feature Files:
├── apps/web/src/
│   ├── components/forms/
│   │   └── PlayerProfileForm.tsx          (Form component)
│   ├── app/
│   │   ├── profile/player/complete/
│   │   │   └── page.tsx                   (Profile page)
│   │   └── dashboard/player/
│   │       └── page.tsx                   (Updated dashboard)
│
Documentation:
├── UPDATE_DATABASE_PLAYER_FIELDS.sql       (Run this first!)
├── PLAYER_PROFILE_IMPLEMENTATION.md        (Full documentation)
└── QUICK_START_PLAYER_PROFILE.md           (This file)
```

## What Happens Behind the Scenes

1. Form validates your input (Zod schema)
2. Converts string numbers to integers
3. Updates your user record in the `users` table
4. Sets `profile_completed = true`
5. Redirects you to dashboard

## Verify It Worked

Run this in Supabase SQL Editor:

```sql
SELECT
  email,
  first_name,
  last_name,
  position,
  nationality,
  height_cm,
  weight_kg,
  preferred_foot,
  profile_completed
FROM users
WHERE role = 'player';
```

You should see your data populated!

## Next Steps After This Works

1. **Show profile completion status** on dashboard
2. **Add edit profile** functionality
3. **Display player profile** to scouts
4. **Make profile required** for contract offers
5. **Add profile photo upload**

## Troubleshooting

**Error: "column does not exist"**
→ Run the SQL migration from `UPDATE_DATABASE_PLAYER_FIELDS.sql`

**Can't access the profile page**
→ Make sure you're logged in as a player (not club owner, referee, etc.)

**Form won't submit**
→ Check all required fields are filled (marked with *)

**Page redirects immediately**
→ Your profile is already complete! (This is by design)

## Ready to Test?

1. ✅ Run `UPDATE_DATABASE_PLAYER_FIELDS.sql` in Supabase
2. ✅ Refresh your dev server (if needed)
3. ✅ Go to http://localhost:3000
4. ✅ Log in as player
5. ✅ Click "Complete Profile"
6. ✅ Fill and submit!

That's it! 🎉
