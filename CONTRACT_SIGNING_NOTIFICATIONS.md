# Contract Signing Notifications - Implementation Summary

## Overview
When a player signs a contract, the club owner now receives a real-time notification in their dashboard. This feature includes a notification bell icon in the club dashboard with unread count, a dropdown list of notifications, and the ability to mark notifications as read.

## Components & Files Created

### 1. **Database - Notifications Table** (`CREATE_NOTIFICATIONS_TABLE.sql`)
```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY,
  club_id UUID NOT NULL,
  notification_type TEXT, -- 'contract_signed', 'contract_created', etc.
  title TEXT,
  message TEXT,
  contract_id UUID,
  player_id UUID,
  related_user_id UUID,
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMP,
  action_url TEXT, -- Link to contract
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)
```

**Features:**
- Row-level security (RLS) enabled - club owners see only their notifications
- Indexes for fast queries
- Foreign key constraints to related tables
- Two helper functions:
  - `mark_notification_as_read()` - Mark single notification as read
  - `create_contract_signed_notification()` - Create notification when contract is signed

### 2. **TypeScript Types** (Updated `database.ts`)
```typescript
export interface Notification {
  id: string
  club_id: string
  notification_type: 'contract_signed' | 'contract_created' | 'player_joined' | string
  title: string
  message: string
  contract_id?: string
  player_id?: string
  related_user_id?: string
  is_read: boolean
  read_at?: string
  action_url?: string
  created_at: string
  updated_at: string
}
```

### 3. **Hook - useClubNotifications** (`hooks/useClubNotifications.ts`)
Manages all notification operations:
- Fetches notifications for club
- Real-time subscription using Supabase channels
- Mark single notification as read
- Mark all notifications as read
- Automatic unread count tracking
- Auto-reload on database changes

```typescript
const { notifications, unreadCount, loading, markAsRead, markAllAsRead } = useClubNotifications(clubId)
```

### 4. **Component - NotificationCenter** (`components/NotificationCenter.tsx`)
Beautiful notification UI with:
- Bell icon with red unread badge
- Dropdown list showing last 20 notifications
- Green checkmark icon for "contract_signed" notifications
- Click to mark as read and navigate to contract
- "Mark all as read" button
- Time display (just now, 5m ago, etc.)
- Responsive design

### 5. **Service Updates** (`services/contractService.ts`)
When player signs contract:
1. Update contract with signature data ✅
2. Mark contract as read by player ✅
3. Update player scout status ✅
4. **NEW:** Create notification for club owner

```typescript
await supabase
  .from('notifications')
  .insert({
    club_id: existingContract.club_id,
    notification_type: 'contract_signed',
    title: '✅ Contract Signed by Player',
    message: `${playerFullName} has signed the contract`,
    contract_id: payload.contractId,
    player_id: existingContract.player_id,
    related_user_id: existingContract.player_id,
    action_url: `/dashboard/club-owner/contracts/${payload.contractId}/view`,
    is_read: false
  })
```

### 6. **Dashboard Integration** (Updated `club-owner/contracts/page.tsx`)
- Imports `NotificationCenter` component
- Imports `useClubNotifications` hook
- Displays notification bell in navbar
- Shows unread count badge
- Full notification dropdown functionality

## How It Works

### When a Player Signs:
```
1. Player clicks "Sign Contract" button
   ↓
2. contractService.signContractAsPlayer() executes
   ↓
3. Contract is updated with signature data
   ↓
4. Player status is updated (is_available_for_scout = false)
   ↓
5. NEW: Notification created → club_id, player name, contract link
   ↓
6. Club owner sees notification bell with "1" badge
```

### Club Owner Flow:
```
1. Opens Club Dashboard
2. Clicks notification bell icon (top right)
3. Dropdown shows: "✅ Contract Signed by Player - Player Name"
4. Click notification → redirects to contract view page
5. Notification automatically marked as read
6. Unread count updates in real-time
```

## Real-Time Updates
Using Supabase's real-time channels, the notification list updates instantly when:
- New notification is created (player signs)
- Notification is marked as read
- Any other change to notifications table

## Features

### ✅ Completed
- Notifications table with proper schema
- Real-time subscription to notification changes
- Bell icon with unread count badge
- Notification dropdown with 20 most recent
- Click to navigate to contract
- Auto-mark as read on click
- Mark all as read button
- Time formatting (just now, 5m ago, etc.)
- Responsive design
- RLS policies for security

### 🔄 Optional Enhancements
- Email notifications (set up API endpoint for `/api/notifications/contract-signed`)
- SMS notifications
- Push notifications
- Filter notifications by type
- Archive old notifications
- Notification settings/preferences
- Sound/toast alerts on new notification

## Database Migration Steps

1. **Run the SQL migration:**
```sql
-- Execute the contents of CREATE_NOTIFICATIONS_TABLE.sql in Supabase SQL Editor
```

2. **Verify table creation:**
```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'notifications'
ORDER BY ordinal_position;
```

## Testing Checklist

- [ ] SQL migration applied successfully
- [ ] Can see notification bell in club contracts page
- [ ] Player signs contract
- [ ] Notification appears in club dashboard (unread)
- [ ] Click notification → redirects to contract
- [ ] Notification marked as read (no longer highlighted)
- [ ] Unread count decreases
- [ ] "Mark all as read" button works
- [ ] Real-time update (notification appears without refresh)
- [ ] Multiple notifications display in reverse chronological order
- [ ] Time formatting works (just now, 5m ago, etc.)

## Files Modified

1. `CREATE_NOTIFICATIONS_TABLE.sql` - NEW
2. `apps/web/src/types/database.ts` - UPDATED (Added Notification interface)
3. `apps/web/src/services/contractService.ts` - UPDATED (Added notification creation)
4. `apps/web/src/hooks/useClubNotifications.ts` - NEW
5. `apps/web/src/components/NotificationCenter.tsx` - NEW
6. `apps/web/src/app/dashboard/club-owner/contracts/page.tsx` - UPDATED (Added notification UI)

## Integration Points

**contractService.ts** → Creates notification
**useClubNotifications.ts** → Fetches and manages notifications
**NotificationCenter.tsx** → Displays notifications
**club-owner/contracts/page.tsx** → Shows notification bell

## Error Handling

All operations include graceful error handling:
- If notification creation fails, contract is still signed (doesn't block)
- If mark-as-read fails, user can retry
- If subscription fails, manual reload available
- Console warnings logged for debugging

## Security

- RLS policies ensure club owners only see their own notifications
- Actions URL validated before navigation
- Supabase SECURITY DEFINER functions for database operations
- Auth.uid() used for user verification
