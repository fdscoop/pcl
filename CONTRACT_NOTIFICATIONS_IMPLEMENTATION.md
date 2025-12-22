# Contract Notifications & Read Status - Implementation Guide

## Overview
Added unread contract tracking with notification badges and real-time updates.

## Database Changes Required

### 1. Run SQL Migration
Execute [ADD_READ_STATUS_TO_CONTRACTS.sql](ADD_READ_STATUS_TO_CONTRACTS.sql) in Supabase SQL Editor:

```sql
-- Adds these columns to contracts table:
- read_by_club (BOOLEAN, default true)
- read_by_player (BOOLEAN, default false)
- club_read_at (TIMESTAMP)
- player_read_at (TIMESTAMP)

-- Also creates helper functions:
- mark_contract_read_by_player(contract_id)
- mark_contract_read_by_club(contract_id)
```

**Why these defaults?**
- `read_by_club = true`: Club owner created the contract, so they've "read" it
- `read_by_player = false`: Player hasn't seen it yet, so it's unread

### 2. Apply Fixed RLS Policy
Run [FIX_CONTRACT_RLS_POLICIES.sql](FIX_CONTRACT_RLS_POLICIES.sql) to fix the cancellation issue:

```sql
-- This fixes the 403 error when cancelling contracts
-- Allows club owners to update status to 'rejected' or 'terminated'
```

## Features Implemented

### 1. Unread Contract Badge Component
**File:** [/components/UnreadContractBadge.tsx](apps/web/src/components/UnreadContractBadge.tsx)

**Features:**
- Shows red notification badge with count
- Real-time updates via Supabase subscriptions
- Automatically refreshes when contracts change
- Different logic for player vs club owner
- Hides when count is 0

**Usage:**
```tsx
<UnreadContractBadge userType="player" />
<UnreadContractBadge userType="club_owner" />
```

### 2. Dashboard Integration

**Club Owner Dashboard:** [/dashboard/club-owner/page.tsx](apps/web/src/app/dashboard/club-owner/page.tsx#L304-L322)
- Added badge to "Contracts" card
- Shows count of player responses that haven't been viewed

**Player Dashboard:** [/dashboard/player/page.tsx](apps/web/src/app/dashboard/player/page.tsx#L487-L505)
- Added badge to "My Contracts" card
- Shows count of new contract offers

### 3. Debugging Added
**Player Contracts Page:** Added console logging to debug why contracts aren't showing:
```javascript
console.log('Player ID:', playerData.id)
console.log('Player Contracts query result:', { data, error })
```

## Next Steps to Complete

### 1. Mark Contracts as Read
When a user opens a contract in detail view, mark it as read:

**In Club Owner Contracts Page:**
```typescript
// When expandedContract changes, mark as read
useEffect(() => {
  if (expandedContract) {
    markContractReadByClub(expandedContract)
  }
}, [expandedContract])

const markContractReadByClub = async (contractId: string) => {
  const supabase = createClient()
  await supabase
    .from('contracts')
    .update({
      read_by_club: true,
      club_read_at: new Date().toISOString()
    })
    .eq('id', contractId)
}
```

**In Player Contracts Page:**
```typescript
// Similar logic for player
const markContractReadByPlayer = async (contractId: string) => {
  const supabase = createClient()
  await supabase
    .from('contracts')
    .update({
      read_by_player: true,
      player_read_at: new Date().toISOString()
    })
    .eq('id', contractId)
}
```

### 2. Update RLS Policies
The current RLS policies might need updating to allow read status updates:

```sql
-- Allow players to update read status
CREATE POLICY "Players can mark contracts as read"
  ON contracts
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM players
      WHERE players.id = contracts.player_id
      AND players.user_id = auth.uid()
    )
  )
  WITH CHECK (
    -- Only allow updating read fields
    read_by_player = true
    AND read_by_club = (SELECT read_by_club FROM contracts WHERE id = contracts.id)
    AND status = (SELECT status FROM contracts WHERE id = contracts.id)
  );
```

### 3. Add Messaging Feature (Requested)
Create a messaging system between clubs and players:

**Database Schema:**
```sql
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contract_id UUID REFERENCES contracts(id) ON DELETE CASCADE,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('club', 'player')),
  sender_id UUID NOT NULL REFERENCES users(id),
  message TEXT NOT NULL,
  read_by_club BOOLEAN DEFAULT false,
  read_by_player BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**UI Components Needed:**
- Message thread view in contract details
- Send message input
- Unread message badge
- Real-time message updates

### 4. Fix Player Contracts Not Showing
**Debug Steps:**
1. Check browser console for error messages
2. Verify player_id is correct
3. Check RLS policies allow player to SELECT contracts
4. Verify contract data exists in database

**Possible Issues:**
- RLS policy blocking player SELECT
- Player ID mismatch
- No contracts exist for that player

## Testing Checklist

- [ ] Run ADD_READ_STATUS_TO_CONTRACTS.sql migration
- [ ] Run FIX_CONTRACT_RLS_POLICIES.sql
- [ ] Create a test contract from club owner
- [ ] Verify red badge (1) appears on player dashboard
- [ ] Open player contracts page
- [ ] Verify contract appears in list
- [ ] Click "View Details" on contract
- [ ] Implement mark-as-read logic
- [ ] Verify badge count decreases to 0
- [ ] Test real-time updates (open dashboard in 2 tabs)
- [ ] Test club owner view
- [ ] Player accepts contract
- [ ] Verify badge appears for club owner
- [ ] Club owner views updated contract
- [ ] Badge disappears

## Real-Time Subscriptions

The UnreadContractBadge component uses Supabase real-time subscriptions:

```typescript
const channel = supabase
  .channel('contract_changes')
  .on('postgres_changes', {
    event: '*',  // INSERT, UPDATE, DELETE
    schema: 'public',
    table: 'contracts'
  }, () => {
    loadUnreadCount()  // Refresh count when any contract changes
  })
  .subscribe()
```

This means badges update automatically when:
- New contracts are created
- Contract status changes (pending → active)
- Contracts are marked as read

## Summary

**Completed:**
✅ Created UnreadContractBadge component with real-time updates
✅ Added badges to both dashboards
✅ Added debugging to player contracts page
✅ Created SQL migration for read status tracking
✅ Created helper functions for marking contracts as read

**To Do:**
⏳ Implement mark-as-read when viewing contract details
⏳ Test and fix player contracts not showing
⏳ Add messaging feature between clubs and players
⏳ Update RLS policies for read status updates
⏳ Add unread message badges
