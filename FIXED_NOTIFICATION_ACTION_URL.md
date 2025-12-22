# ✅ FIXED: Notification Action URL Issue

## The Problem

When you clicked the "Contract Signed" notification, it was:
1. ✅ Showing the notification correctly
2. ❌ But taking you to `/dashboard/club-owner/contracts/[id]/view`
3. ❌ And that page tried to find YOUR club (but you're a player with no club)
4. ❌ Result: "Club not found" error

## The Root Cause

The notification was being sent with BOTH `club_id` AND `player_id`:

```typescript
// ❌ WRONG - sends to both club AND player
{
  club_id: existingContract.club_id,      // Club gets notified
  player_id: existingContract.player_id,  // Player also gets notified!
  action_url: `/dashboard/club-owner/contracts/${id}/view`,  // Points to club page
}
```

When the PLAYER clicked the notification, it took them to a club-owner page (which doesn't work for players).

## The Fix

The notification should ONLY go to the club owner:

```typescript
// ✅ CORRECT - only club owner gets this notification
{
  club_id: existingContract.club_id,      // Only club gets notified
  // No player_id!
  action_url: `/dashboard/club-owner/contracts/${id}/view`,  // Points to club page
}
```

**File:** `apps/web/src/services/contractService.ts` (Line 145)

**Change:** Removed `player_id: existingContract.player_id` from the notification insert

---

## Summary of All Three Notifications

Now each notification goes to the RIGHT person with the RIGHT URL:

| Event | Recipient | What They See | URL |
|-------|-----------|---------------|-----|
| **Club sends offer** | Player | "📋 New Contract Offer" | `/dashboard/player/contracts/[id]/view` |
| **Player signs contract** | Club Owner | "✅ Contract Signed" | `/dashboard/club-owner/contracts/[id]/view` |
| **Club terminates** | Player | "❌ Contract Terminated" | `/dashboard/player/contracts/[id]/view` |

---

## Test It

1. **Reload browser** (Cmd+R)
2. **Send contract offer** as club owner
3. **Sign it as player**
4. **Logged in as club owner**, check notification bell 🔔
5. **Click the "✅ Contract Signed" notification**
6. **Should see** the contract details page (not an error)

Ready to test! 🚀
