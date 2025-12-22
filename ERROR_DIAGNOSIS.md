# 📊 Error Diagnosis & Fix

## Current State (❌ Broken)

```
Frontend Code (React)
      ↓
  Browser makes API call to Supabase
      ↓
  Supabase tries to query notifications table
      ↓
  ❌ TABLE DOESN'T EXIST
      ↓
  Returns 500 Error
      ↓
  Browser console shows error
```

## After Fix (✅ Working)

```
Frontend Code (React)
      ↓
  Browser makes API call to Supabase
      ↓
  Supabase queries notifications table
      ↓
  ✅ TABLE EXISTS with correct schema
      ↓
  Returns data successfully
      ↓
  Dashboard displays notifications
```

---

## Error Analysis

### Error in Browser Console
```javascript
// What you see:
Failed to load resource: 
  https://uvifkmkdoiohqrdbwgzt.supabase.co/rest/v1/notifications?...

Status: 500 Internal Server Error

Error loading notifications: Object
Error loading contracts: Object
```

### Why It Happens
```
Club Owner Dashboard (page.tsx)
  ↓
  useClubNotifications(clubId) hook
    ↓
    supabase.from('notifications').select(...)
      ↓
      ❌ Notifications table doesn't exist!
        ↓
        Supabase returns 500
```

---

## Your Database Schema (Current)

### ✅ Exists
- `users` - Login profiles
- `clubs` - Club information
- `players` - Player profiles
- `contracts` - Contract documents
- `teams` - Team rosters
- `stadiums` - Stadium info
- `referees` - Referee profiles
- `staff` - Staff members
- `tournaments` - Tournament info
- `matches` - Match records

### ❌ Missing (CAUSING YOUR ERRORS)
- `notifications` - **YOU NEED TO CREATE THIS**

---

## Notifications Table Schema

```sql
notifications {
  id: UUID (primary key)
  club_id: UUID (who gets the notification - club owner)
  player_id: UUID (who gets the notification - player)
  notification_type: TEXT ('contract_signed', 'contract_created', etc.)
  title: TEXT ('New Contract Offer')
  message: TEXT ('Club XYZ sent you a contract...')
  contract_id: UUID (which contract this is about)
  related_user_id: UUID (who created the notification)
  is_read: BOOLEAN (legacy field)
  read_by_club: BOOLEAN (has club owner seen it?)
  read_by_player: BOOLEAN (has player seen it?)
  club_read_at: TIMESTAMP (when club read it)
  player_read_at: TIMESTAMP (when player read it)
  action_url: TEXT (link to click on notification)
  created_at: TIMESTAMP (when created)
  updated_at: TIMESTAMP (last update time)
}
```

---

## Where Errors Come From

### Club Owner Dashboard
**File:** `apps/web/src/app/dashboard/club-owner/page.tsx`

```tsx
const { 
  notifications, 
  unreadCount, 
  loading: notificationsLoading,
  markAsRead,
  markAllAsRead
} = useClubNotifications(clubId)  // ← TRIES TO FETCH NOTIFICATIONS HERE
```

### Player Dashboard
**File:** `apps/web/src/app/dashboard/player/page.tsx`

```tsx
const {
  notifications,
  unreadCount,
  loading: notificationsLoading,
  markAsRead,
  markAllAsRead
} = usePlayerNotifications(playerId)  // ← TRIES TO FETCH NOTIFICATIONS HERE
```

### Notification Hooks
**Files:** 
- `apps/web/src/hooks/useClubNotifications.ts`
- `apps/web/src/hooks/usePlayerNotifications.ts`

Both call:
```tsx
supabase.from('notifications').select(...)  // ← TABLE DOESN'T EXIST!
```

---

## The Fix (3 Steps)

### Step 1: Create the Table
Run SQL migration to add `notifications` table to Supabase

### Step 2: Set Up Permissions
RLS policies allow:
- Club owners to see their notifications
- Players to see their notifications
- System to insert notifications

### Step 3: Reload App
Browser cache might have old error response
- Hard refresh: `Cmd+Shift+R` (Mac) or `Ctrl+Shift+R` (Windows)

---

## Verification Checklist

After running the migration, verify:

- [ ] Go to Supabase Dashboard → Table Editor
- [ ] See `notifications` table in the list
- [ ] Click it and see these columns:
  - [ ] `id` (UUID)
  - [ ] `club_id` (UUID)
  - [ ] `player_id` (UUID)
  - [ ] `notification_type` (TEXT)
  - [ ] `title` (TEXT)
  - [ ] `message` (TEXT)
  - [ ] `is_read` (BOOLEAN)
  - [ ] `read_by_club` (BOOLEAN)
  - [ ] `read_by_player` (BOOLEAN)
  - [ ] `created_at` (TIMESTAMP)
  - [ ] `updated_at` (TIMESTAMP)

- [ ] Reload app in browser
- [ ] No more 500 errors in console!
- [ ] Dashboards load successfully

---

## Still Getting Errors?

### Check Database Logs
1. Supabase Dashboard → Logs
2. Look for error messages about `notifications` table

### Check Frontend Logs
1. Open browser DevTools: `F12`
2. Go to Console tab
3. Look for exact error message
4. Screenshot and search for solution

### Nuclear Option (Reset Everything)
```bash
# This will DELETE all data and recreate from migrations
supabase db reset

# Then push all migrations
supabase db push
```

---

## Files Changed
- ✅ Created: `supabase/migrations/004_create_notifications_table.sql`
- 📄 Documentation: `FIX_500_ERRORS_NOTIFICATIONS.md`
- 📄 This file: `QUICK_FIX_500_ERRORS.md`

No changes to your app code needed - just add the table!
