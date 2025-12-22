# Quick Fix: Notifications 400 Error

## The Problem You're Seeing

```
Failed to load resource: status 400
✅ Notification created for player (WRONG - it wasn't!)
```

## The Root Cause

RLS policy on `notifications` table only allows **service role**, not **authenticated users**.

When your client-side code tries to INSERT:
- ❌ RLS blocks it
- ❌ Returns 400 error
- ❌ Error is caught silently
- ❌ Notification is NOT created
- ✅ Code logs success anyway (misleading)

## The Fix (1 Minute)

### Step 1: Apply SQL
```
1. Open Supabase SQL Editor
2. Copy: FIX_NOTIFICATIONS_RLS_INSERT.sql
3. Paste & Execute
4. Done!
```

### What the SQL Does
Drops the service-role-only policy and creates a new one that allows authenticated users to insert notifications.

### Step 2: Reload Browser
```
Ctrl+R (or Cmd+R)
```

## Test It Works

1. Send a contract offer
2. Check browser console
3. Should see: `✅ Notification created for player` (green)
4. OR see: `❌ Error creating notification: [details]` (red)
5. Login as player
6. Check notification bell 🔔
7. Should see the "📋 New Contract Offer" notification

## The New vs Old Policy

**OLD (Blocking)**:
```sql
CREATE POLICY "Service role can insert notifications"
ON notifications FOR INSERT WITH CHECK (true);
```

**NEW (Fixed)**:
```sql
CREATE POLICY "Authenticated users can create notifications"
ON notifications FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
```

## Code Changes (Already Done)

File: `apps/web/src/app/scout/players/page.tsx`

Now properly captures and logs notification errors instead of silently catching them.

## Why It's Safe

- Foreign key constraints validate all IDs
- RLS still protects reading (players only see their own)
- You must be authenticated (`auth.uid() IS NOT NULL`)

## Summary

| Step | Status | Action |
|------|--------|--------|
| Apply SQL | 🔧 Needed | Run `FIX_NOTIFICATIONS_RLS_INSERT.sql` |
| Code fix | ✅ Done | Already updated |
| Test | 📋 Check | Send offer, check console & bell |

After applying the SQL, notifications will be created successfully! 🎉
