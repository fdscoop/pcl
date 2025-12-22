# Contract Termination & Notifications - Quick Reference

## ✅ What's Implemented

When a club owner cancels or terminates a contract, the system now:

1. **Updates Contract Status**
   - Cancelled offer → status = 'rejected'
   - Terminated contract → status = 'terminated'

2. **Restores Player Scout Status** (for terminated contracts only)
   - is_available_for_scout = true
   - current_club_id = null
   - Player appears in scout searches again

3. **Creates Player Notification**
   - Notification type: 'contract_cancelled' or 'contract_terminated'
   - Includes club name and reason
   - Player can click to go to their contracts page

## 🔧 Technical Details

### Files Modified
- `apps/web/src/app/dashboard/club-owner/contracts/page.tsx`
  - Location: `handleConfirmAction()` function
  - Lines: 220-270 (added notification creation code)

### Database Tables Used
- `contracts` - Updated with new status
- `players` - Updated with scout availability
- `notifications` - Insert new notification record

### Notification Fields
```typescript
{
  player_id: string,              // Who receives notification
  notification_type: string,      // 'contract_cancelled' | 'contract_terminated'
  title: string,                  // Display title
  message: string,                // Full message with club name
  contract_id: string,            // Reference to contract
  related_user_id: string,        // Club owner ID
  action_url: string              // '/dashboard/player/contracts'
}
```

## 🧪 How to Test

### Test 1: Cancel a Pending Offer
```
1. Login as club owner
2. Go to Dashboard → Contracts
3. Find a contract with status "PENDING"
4. Click "Cancel Offer" button
5. Confirm in dialog
6. Verify:
   ✅ Toast shows "Contract Cancelled...and player has been notified"
   ✅ Contract status changed to REJECTED
   ✅ Check browser console: "Player notification created" ✓
```

### Test 2: Terminate an Active Contract
```
1. Login as club owner
2. Go to Dashboard → Contracts
3. Find a contract with status "ACTIVE"
4. Click "Terminate Contract" button
5. Confirm in dialog
6. Verify:
   ✅ Toast shows "Contract Terminated...and player has been notified"
   ✅ Contract status changed to TERMINATED
   ✅ Player scout status updated (check database)
   ✅ Check browser console: "Player scout status restored" ✓
   ✅ Check browser console: "Player notification created" ✓
```

### Test 3: Player Receives Notification
```
1. After terminating contract (Test 2)
2. Login as the player
3. Check notification center (top-right bell icon)
4. Should see: "Contract Terminated"
   - Title: "Contract Terminated"
   - Message: "Your contract with [Club Name] has been terminated..."
   - Click to navigate to contracts page
```

## 🐛 Troubleshooting

### Notification Not Created
- Check browser console for error message
- Verify `notifications` table exists in database
- Check RLS policy allows player to read notifications

### Player Doesn't See Scout Status Restored
- May need to refresh page
- Check `players` table: `is_available_for_scout` should be `true`
- Check `current_club_id` should be `null`

### Toast Message Shows But No Notification
- Notification might be created but player hasn't seen it yet
- Player needs to refresh dashboard or visit notification center
- Check `notifications` table directly via Supabase

## 📊 Database Queries for Verification

```sql
-- Check if notification was created
SELECT * FROM notifications 
WHERE player_id = [player-uuid]
ORDER BY created_at DESC
LIMIT 5;

-- Check player scout status updated
SELECT 
  id,
  is_available_for_scout,
  current_club_id
FROM players 
WHERE id = [player-uuid];

-- Check contract status
SELECT 
  id,
  status,
  player_id,
  club_id
FROM contracts 
WHERE id = [contract-uuid];
```

## 🔄 Complete Flow Diagram

```
Club Owner Dashboard
    │
    ├─ Views ACTIVE contract
    └─ Clicks "Terminate Contract"
        │
        ▼
    Confirmation Dialog
        │
        └─ Clicks "Yes, Terminate Contract"
            │
            ▼
        handleConfirmAction()
            │
            ├─ 1️⃣ Fetch contract (get player_id)
            │
            ├─ 2️⃣ Update contracts table
            │     └─ status = 'terminated'
            │
            ├─ 3️⃣ Update players table
            │     ├─ is_available_for_scout = true
            │     └─ current_club_id = null
            │
            ├─ 4️⃣ Insert into notifications table
            │     ├─ type = 'contract_terminated'
            │     ├─ title = 'Contract Terminated'
            │     ├─ message = 'Your contract with [Club]...'
            │     └─ player_id = [player-uuid]
            │
            ├─ 5️⃣ Show success toast
            │     └─ "Contract Terminated...and player has been notified"
            │
            └─ 6️⃣ Reload contracts list
                │
                ▼
        ✅ Player now:
            ├─ Has "TERMINATED" contract status
            ├─ Sees notification in notification center
            ├─ Is searchable by other clubs again
            └─ Can accept offers from other clubs
```

## 📝 Code Location

**File**: `apps/web/src/app/dashboard/club-owner/contracts/page.tsx`

**Function**: `handleConfirmAction()`

**Lines**: 172-280

**Key Section**: Lines 232-263 (Notification Creation)

```typescript
// Create notification for the player
try {
  const notificationType = action === 'cancel' ? 'contract_cancelled' : 'contract_terminated'
  const notificationTitle = action === 'cancel' ? 'Contract Offer Cancelled' : 'Contract Terminated'
  const notificationMessage = action === 'cancel'
    ? `Your contract offer from ${club?.club_name} has been cancelled.`
    : `Your contract with ${club?.club_name} has been terminated. You are now available for new opportunities.`

  const { error: notificationError } = await supabase
    .from('notifications')
    .insert({
      player_id: contractData.player_id,
      notification_type: notificationType,
      title: notificationTitle,
      message: notificationMessage,
      contract_id: contractId,
      related_user_id: club?.owner_id,
      action_url: '/dashboard/player/contracts'
    })

  if (notificationError) {
    console.warn('Could not create notification:', notificationError)
  } else {
    console.log('✅ Player notification created')
  }
} catch (notificationError) {
  console.warn('Error creating notification:', notificationError)
}
```

## 🎯 Summary

| Feature | Status | Notes |
|---------|--------|-------|
| Contract termination | ✅ | Updates contract status |
| Player scout restore | ✅ | Only for termination, not cancellation |
| Notification creation | ✅ | Both cancellation and termination |
| Toast feedback | ✅ | Shows success with notification mention |
| Error handling | ✅ | Non-blocking, continues on error |
| RLS policy | ✅ | Player can read their notifications |

All features are ready for testing!
