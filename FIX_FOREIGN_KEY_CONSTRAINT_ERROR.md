# 🔴 REAL BUG FOUND: Foreign Key Constraint Error

## The Error You're Getting

```
Error code: 23503
"Key is not present in table \"users\"."
"insert or update on table \"notifications\" violates foreign key constraint \"fk_user\""
```

## Root Cause

In `contractService.ts` line 151, the code was inserting a **player_id** into the `related_user_id` field:

```typescript
// ❌ WRONG:
related_user_id: existingContract.player_id,  // This is a player ID!
```

But `related_user_id` is a **foreign key** that references the `users` table, not the `players` table!

### The Data Structure

```
users table:
  id: UUID (auth user ID)
  first_name, last_name, email
  role (player, club_owner, etc.)

players table:
  id: UUID (player record ID) 
  user_id: UUID (links to users table)
  position, height, weight, etc.

notifications table:
  related_user_id: UUID (must reference users.id, not players.id)
```

### The Mistake

```
players.id:        1c1968f6-f436-4621-870b-95d89a5b9dc6  ← Player record ID
users.id:          97375890-aba6-4aa8-8996-ae8f04c01333  ← Auth user ID (different!)

You were inserting:
  related_user_id: 1c1968f6-f436-4621-870b-95d89a5b9dc6

But this ID doesn't exist in users table!
PostgreSQL rejected it: Foreign key constraint violation (23503)
```

---

## The Fix

You need to get the **player's user_id** and use that instead:

```typescript
// ✅ CORRECT:
const playerInfo = await supabase
  .from('players')
  .select('id, user_id, ...')  // Get the user_id!
  .eq('id', existingContract.player_id)
  .single()

const { error: notificationInsertError } = await supabase
  .from('notifications')
  .insert({
    club_id: existingContract.club_id,
    player_id: existingContract.player_id,
    related_user_id: playerInfo.data?.user_id,  // ✅ Use user_id!
    notification_type: 'contract_signed',
    title: '✅ Contract Signed',
    message: `${playerFullName} has signed the contract for ${clubName}`,
    contract_id: payload.contractId,
    action_url: `/dashboard/club-owner/contracts/${payload.contractId}/view`,
    is_read: false,
    read_by_club: false
  })
```

---

## What Was Fixed

**File:** `apps/web/src/services/contractService.ts`

**Line:** 151

**Change:**
```diff
- related_user_id: existingContract.player_id,
+ related_user_id: playerInfo.data?.user_id,  // ✅ Use user_id from players table
```

Now when creating the notification, it correctly references the player's auth user ID instead of the player record ID.

---

## Why This Matters

The `related_user_id` field is designed to track **who triggered the action**:

- When a player signs a contract, `related_user_id` should be the **player's auth user ID**
- When a club terminates, `related_user_id` should be the **club owner's auth user ID**
- This allows queries like: "Show me all notifications created by user X"

---

## Testing the Fix

After this fix is applied:

1. **As Player:** Sign a contract
2. **Check browser console:**
   - Should see: `✅ Notification created for club owner` (GREEN)
   - Should NOT see: "23503" error or "Key is not present" error
3. **As Club Owner:** Check bell icon
   - Should see: "✅ Contract Signed - [PlayerName] has signed..."
4. **In Database:** Run query:
   ```sql
   SELECT * FROM notifications 
   WHERE notification_type = 'contract_signed' 
   ORDER BY created_at DESC LIMIT 1;
   ```
   - `club_id` should be NOT NULL ✅
   - `player_id` should be NOT NULL ✅
   - `related_user_id` should be NOT NULL ✅
   - All should have valid UUIDs ✅

---

## Summary

✅ **Problem:** Using player_id instead of user_id for foreign key
✅ **Error:** 23503 Foreign Key Constraint Violation
✅ **Fix:** Change `related_user_id: existingContract.player_id` to `related_user_id: playerInfo.data?.user_id`
✅ **Status:** Already applied to contractService.ts

Now reload browser and test again! 🚀
