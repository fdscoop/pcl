# Club Profile Dashboard - Major Update

## What Changed

The dashboard has been completely redesigned to show **CLUB PROFILE** instead of personal data.

### Key Changes:

1. **One Club Per Owner** - Each club owner can only create ONE club profile
2. **Club-Centric Dashboard** - Shows club information prominently
3. **Onboarding Flow** - If no club exists, shows setup wizard
4. **Club Profile Header** - Large logo, name, badges, and details

## Before You Test

### IMPORTANT: Run This SQL First

```sql
-- Update the database constraint
-- Run this in Supabase SQL Editor
```

Go to: https://supabase.com/dashboard/project/uvifkmkdoiohqrdbwgzt/sql/new

Copy and run the contents of: `UPDATE_CLUB_CONSTRAINT_ONE_PER_OWNER.sql`

This will:
- Remove old constraint (multiple clubs per owner)
- Add new constraint (one club per owner)

## New Dashboard Experience

### Scenario 1: No Club Yet (First Login)

```
┌──────────────────────────────────────────┐
│  Welcome to PCL! 🏆                      │
│  Create your club profile to get started │
│                                          │
│  ┌──────────────────────────────┐       │
│  │ Create Your Club Profile     │       │
│  │                               │       │
│  │ Note: Each account can create │       │
│  │ one club profile.             │       │
│  │                               │       │
│  │ [Create Club Profile]         │       │
│  └──────────────────────────────┘       │
└──────────────────────────────────────────┘
```

### Scenario 2: Club Already Created

```
┌──────────────────────────────────────────────────────┐
│ [Logo]  Mumbai City FC                 [Edit Profile]│
│  96x96  [Registered] [Professional] [Active]         │
│         📍 Mumbai, Maharashtra, India                │
│         📧 contact@mumbai.com • 📞 +91 9876543210   │
│                                                       │
│ ┌─────────────────────────────────────────────────┐ │
│ │ Founded in 2020, competing in regional leagues  │ │
│ └─────────────────────────────────────────────────┘ │
│                                                       │
│ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐   │
│ │Founded  │ │Teams    │ │Players  │ │Matches  │   │
│ │2020     │ │0        │ │0        │ │0        │   │
│ └─────────┘ └─────────┘ └─────────┘ └─────────┘   │
│                                                       │
│ [Manage Teams] [Scout Players] [Matches]            │
│                                                       │
│ Recent Activity                                      │
│ ┌───────────────────────────────────────────────┐   │
│ │ No recent activity                            │   │
│ └───────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────┘
```

## What Happens Now

### First Time User Flow

```
1. Sign up as club owner
   ↓
2. Complete onboarding
   ↓
3. Redirected to dashboard
   ↓
4. See "Welcome to PCL" screen
   ↓
5. Click "Create Club Profile"
   ↓
6. Fill club details + upload logo
   ↓
7. Submit
   ↓
8. Redirected to dashboard
   ↓
9. See CLUB PROFILE displayed
```

### Returning User Flow

```
1. Log in
   ↓
2. Go to dashboard
   ↓
3. Immediately see CLUB PROFILE
   - Club logo and name
   - Founded year, location
   - Stats: Teams, Players, Matches
   - Quick actions
```

### Trying to Create Second Club

```
1. Already have a club
   ↓
2. Try to access /club/create
   ↓
3. Fill form and submit
   ↓
4. Get error: "You have already created a club.
               Each account can only create one club profile."
   ↓
5. Redirect to dashboard to edit existing club
```

## Key Features

### 1. One Club Per Owner ✅

- Database constraint ensures uniqueness
- Clear error message if trying to create second club
- Onboarding screen explains this upfront

### 2. Club Profile Header ✅

Shows prominently:
- **Logo** (96x96, larger than before)
- **Club Name** (h1, prominent)
- **Badges**: Type, Category, Status
- **Location** with icon
- **Contact Info**: Email and phone
- **Description** (if provided)
- **Edit Profile** button

### 3. Stats Dashboard ✅

Four key metrics:
- **Founded**: Year club was established
- **Teams**: Number of teams (placeholder: 0)
- **Players**: Total players (placeholder: 0)
- **Matches**: Matches played (placeholder: 0)

### 4. Quick Actions ✅

Three main actions (coming soon):
- 👥 Manage Teams
- 🔍 Scout Players
- ⚽ Matches

### 5. Activity Feed ✅

- Recent Activity section
- Shows notifications and updates
- Currently empty (placeholder)

## Database Changes

### Old Constraint
```sql
CONSTRAINT unique_club_name_owner UNIQUE(club_name, owner_id)
```
**Allowed**: Multiple clubs per owner (different names)

### New Constraint
```sql
CONSTRAINT unique_club_per_owner UNIQUE(owner_id)
```
**Allows**: ONE club per owner only

## Files Modified

### Updated Files

1. **apps/web/src/app/dashboard/club-owner/page.tsx**
   - Changed from `clubs[]` array to single `club` object
   - Added onboarding screen for users without club
   - Redesigned to show club profile prominently
   - Updated stats to show club-specific metrics
   - Removed "Create Club" button from main view

2. **apps/web/src/components/forms/ClubCreationForm.tsx**
   - Added error handling for duplicate club attempt
   - Shows clear message if trying to create second club

3. **CREATE_CLUBS_TABLE.sql**
   - Updated constraint to `unique_club_per_owner`

### New Files

- ✅ `UPDATE_CLUB_CONSTRAINT_ONE_PER_OWNER.sql` - Database update script
- ✅ `CLUB_PROFILE_DASHBOARD_UPDATE.md` - This documentation

## Testing Steps

### Test 1: New User (No Club)

- [ ] Sign up as club owner
- [ ] Go to dashboard
- [ ] See "Welcome to PCL!" screen
- [ ] See note: "Each account can create one club profile"
- [ ] Click "Create Club Profile"
- [ ] Create club successfully
- [ ] Redirected to dashboard
- [ ] See club profile displayed

### Test 2: Existing User (Has Club)

- [ ] Log in as club owner who already created club
- [ ] Go to dashboard
- [ ] Immediately see club profile (not onboarding)
- [ ] See club logo, name, badges
- [ ] See founded year stat
- [ ] See Edit Profile button
- [ ] Click Edit Profile (will 404 for now, page not created yet)

### Test 3: Try Creating Second Club

- [ ] Already have a club
- [ ] Try to access `/club/create` directly
- [ ] Fill form
- [ ] Submit
- [ ] See error: "You have already created a club..."
- [ ] Cannot create second club

### Test 4: Database Constraint

Run in Supabase SQL:
```sql
-- Try to insert second club for same owner (should fail)
INSERT INTO clubs (club_name, club_type, category, owner_id, ...)
VALUES ('Second Club', 'Registered', 'Professional', 'same-user-id', ...);

-- Should get error:
-- duplicate key value violates unique constraint "unique_club_per_owner"
```

## Migration for Existing Users

If you already have multiple clubs in database:

```sql
-- Find users with multiple clubs
SELECT owner_id, COUNT(*) as club_count
FROM clubs
GROUP BY owner_id
HAVING COUNT(*) > 1;

-- Keep only the most recent club for each owner
-- (Do this manually for each affected user)
```

## What's Next

### Coming Soon Features:

1. **Edit Club Profile** - `/club/[id]/edit` page
2. **Team Management** - Create and manage teams under club
3. **Player Scouting** - Browse and invite players
4. **Match Scheduling** - Organize matches and tournaments
5. **Activity Feed** - Real activity tracking

## Summary

✅ **One club per owner** - Database enforced
✅ **Club profile displayed** - Not personal data
✅ **Onboarding for new users** - Clear setup flow
✅ **Edit Profile button** - Ready for future feature
✅ **Clean, professional UI** - Focused on club management

The dashboard now truly represents the **CLUB** instead of the owner's personal account!
