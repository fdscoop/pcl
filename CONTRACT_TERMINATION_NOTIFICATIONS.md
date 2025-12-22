# Contract Termination & Cancellation Notifications

## Overview

When a club owner **terminates** or **cancels** a contract, the player **automatically receives a notification** so they are immediately informed about the status change.

## What Happens

### When Contract is Cancelled (Pending Status)
```
Club Owner Action: Click "Cancel Offer"
    ↓
System executes:
  1. Update contract status to "rejected"
  2. Create notification for player:
     - Type: contract_cancelled
     - Title: "Contract Offer Cancelled"
     - Message: "Your contract offer from [Club Name] has been cancelled."
     - Link: /dashboard/player/contracts
  3. Show toast: "Contract Cancelled"
    ↓
Player sees:
  ✅ Notification in their notification center
  ✅ Contract status updated to CANCELLED
  ✅ Can accept offers from other clubs
```

### When Contract is Terminated (Active Status)
```
Club Owner Action: Click "Terminate Contract"
    ↓
System executes:
  1. Update contract status to "terminated"
  2. Update player status:
     - is_available_for_scout = true
     - current_club_id = null
  3. Create notification for player:
     - Type: contract_terminated
     - Title: "Contract Terminated"
     - Message: "Your contract with [Club Name] has been terminated. 
               You are now available for new opportunities."
     - Link: /dashboard/player/contracts
  4. Show toast: "Contract Terminated and player notified"
    ↓
Player sees:
  ✅ Notification in their notification center
  ✅ Contract status updated to TERMINATED
  ✅ Scout status restored (searchable again)
  ✅ Can be recruited by other clubs
```

## Notifications Table Schema

```sql
Column                  Type            Purpose
─────────────────────────────────────────────────────
id                      UUID            Unique notification ID
player_id               UUID            Which player receives this notification
club_id                 UUID            NULL (only player gets notified)
notification_type       TEXT            'contract_cancelled' or 'contract_terminated'
title                   TEXT            Display title in UI
message                 TEXT            Full notification message
contract_id             UUID            Reference to the contract
related_user_id         UUID            Club owner who triggered action
action_url              TEXT            Link: /dashboard/player/contracts
read_by_player          BOOLEAN         Whether player has read it
player_read_at          TIMESTAMP       When player read it
created_at              TIMESTAMP       When notification was created
```

## Implementation Code

### File: `apps/web/src/app/dashboard/club-owner/contracts/page.tsx`

Location: `handleConfirmAction()` function, lines 220-240

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

### Key Features

1. **Automatic Creation** - Notification is created immediately when action is confirmed
2. **Descriptive Message** - Includes the club name and context (cancelled vs terminated)
3. **Action Link** - Player can click notification to go directly to their contracts page
4. **Error Handling** - If notification fails, it doesn't block the contract action
5. **Player-Specific** - Only the player receives notification, not the club

## Notification Types

### contract_cancelled
- **When**: Club owner cancels a pending contract offer
- **Title**: "Contract Offer Cancelled"
- **Message**: Includes club name and "offer has been cancelled"
- **Status**: Player no longer sees pending contract
- **Next Step**: Player can receive offers from other clubs

### contract_terminated
- **When**: Club owner terminates an active contract
- **Title**: "Contract Terminated"
- **Message**: Includes club name and "You are now available for new opportunities"
- **Status**: Player marked as available for scout again
- **Next Step**: Player can be recruited by other clubs immediately

## Player Experience

### Player sees in Notification Center:
1. Title: "Contract Terminated" or "Contract Offer Cancelled"
2. Message: Full context about what happened
3. Timestamp: When the notification was created
4. Read Status: Can mark as read/unread
5. Click to Action: Takes them to their contracts page

### Player's Dashboard Impact:
- **Contracts Page**: Shows updated contract status
- **Scout Status**: Available for scouting again (for terminated contracts)
- **Search Results**: Appears in club scout searches (for terminated contracts)

## Testing Checklist

- [ ] Apply code changes to club owner contracts page
- [ ] Test: Cancel a pending contract offer
  - [ ] Player receives "Contract Offer Cancelled" notification
  - [ ] Notification has correct club name
  - [ ] Player can see contract status changed
- [ ] Test: Terminate an active contract
  - [ ] Player receives "Contract Terminated" notification
  - [ ] Player appears in scout searches again
  - [ ] Notification mentions "available for new opportunities"
  - [ ] Clicking notification takes player to contracts page
- [ ] Test: Multiple notifications
  - [ ] Player can receive multiple notifications
  - [ ] Each notification is separate
  - [ ] Player can mark individual notifications as read

## Related Files

- `apps/web/src/app/dashboard/club-owner/contracts/page.tsx` - Creates notifications
- `supabase/migrations/004_create_notifications_table.sql` - Notifications table schema
- `apps/web/src/components/NotificationCenter.tsx` - Displays notifications to users
- `apps/web/src/hooks/useClubNotifications.ts` - Fetches club notifications
- `apps/web/src/hooks/usePlayerNotifications.ts` - Fetches player notifications

## Troubleshooting

### Notification Not Appearing

**Check 1: RLS Policy**
```sql
-- Verify player can see their notifications
SELECT * FROM notifications 
WHERE player_id = [player-uuid]
LIMIT 5;
```

**Check 2: Browser Console**
Look for warning: "Could not create notification:"

**Check 3: Notification Center**
- Player must refresh dashboard to see new notifications
- Or navigate away and back to dashboard

### Notification Created But Not Showing

Possible causes:
1. Player hasn't refreshed dashboard yet
2. Notification center isn't polling for updates
3. RLS policy blocking player from reading their own notification

## Future Enhancements

- [ ] Email notification to player when contract is terminated
- [ ] SMS notification for important contract changes
- [ ] In-app push notification with sound/badge
- [ ] Notification preferences (which types to receive)
- [ ] Notification templates for different contract scenarios
- [ ] Admin ability to resend notifications
