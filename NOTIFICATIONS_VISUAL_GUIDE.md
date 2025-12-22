# Notification System - Visual Guide & Flow Diagrams

## 1. User Flow - Contract Signing to Notification

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          PLAYER SIGNS CONTRACT                          │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  Player Dashboard                                                       │
│  ┌─────────────────────────────────┐                                  │
│  │ Contract View Page              │                                  │
│  │                                 │                                  │
│  │ [Sign Contract Button]   ◄──────┼─── Filled with name, date       │
│  │                                 │                                  │
│  └────────────┬────────────────────┘                                  │
│               │                                                        │
│               ▼ POST /api/contracts/sign                               │
│  ┌──────────────────────────────────────────────────────────┐         │
│  │ contractService.signContractAsPlayer()                  │         │
│  ├──────────────────────────────────────────────────────────┤         │
│  │ 1. Update contract with signature data                  │         │
│  │ 2. Regenerate HTML with "Digitally signed by" text     │         │
│  │ 3. Mark contract as read_by_player = true              │         │
│  │ 4. Set player.is_available_for_scout = false           │         │
│  │ 5. Create notification for club                         │         │
│  │                                                          │         │
│  │    ↓ INSERT INTO notifications                          │         │
│  │    {                                                     │         │
│  │      club_id: "...",                                     │         │
│  │      notification_type: "contract_signed",              │         │
│  │      title: "✅ Contract Signed by Player",             │         │
│  │      message: "John Doe has signed the contract",       │         │
│  │      contract_id: "...",                                │         │
│  │      action_url: "/dashboard/club-owner/contracts/.." │         │
│  │    }                                                     │         │
│  └──────┬───────────────────────────────────────────────────┘         │
│         │                                                              │
│         ▼ All operations complete                                      │
│  ┌──────────────────────────────────────────────────────────┐         │
│  │ Return success to Player                                 │         │
│  │ "✅ Contract signed successfully!"                      │         │
│  └──────────────────────────────────────────────────────────┘         │
│                                                                        │
│                             [REAL-TIME EVENT]                         │
│                                   ↓                                   │
│  Club Owner Dashboard                                                 │
│  ┌─────────────────────────────────┐                                  │
│  │ Contracts Page                  │                                  │
│  │                                 │                                  │
│  │ Navbar: [🔔 1] ◄────────────────┼─── Notification bell appears    │
│  │                                 │    with unread count (1)         │
│  │                                 │                                  │
│  └─────────────────────────────────┘                                  │
│                                                                        │
└─────────────────────────────────────────────────────────────────────────┘
```

## 2. Notification Center UI Layout

```
┌─────────────────────────────────────────────────────┐
│ Club Dashboard                                      │
├─────────────────────────────────────────────────────┤
│                                                     │
│ ┌─────────────────────────────────────────────────┐ │
│ │ Logo  PCL | Club Name      [🔔 1] [← Dashboard]│ │  ◄─ Navbar
│ └─────────────────────────────────────────────────┘ │
│                                                     │
│ Click bell icon → Dropdown appears:                │
│                                                     │
│ ┌───────────────────────────────────┐             │
│ │ Notifications              [✕]    │             │
│ ├───────────────────────────────────┤             │
│ │ [Mark all as read]                │             │
│ ├───────────────────────────────────┤             │
│ │ ┌─────────────────────────────────┐ │           │
│ │ │ [✓] ✅ Contract Signed by Player│ │ UNREAD   │
│ │ │      John Doe signed contract  │ │           │
│ │ │      2 minutes ago             │ │           │
│ │ └─────────────────────────────────┘ │           │
│ ├───────────────────────────────────┤             │
│ │ ┌─────────────────────────────────┐ │           │
│ │ │    ✅ Contract Signed by Player│ │ READ     │
│ │ │      Jane Smith signed contract │ │           │
│ │ │      1 hour ago                │ │           │
│ │ └─────────────────────────────────┘ │           │
│ ├───────────────────────────────────┤             │
│ │ ┌─────────────────────────────────┐ │           │
│ │ │    ✅ Contract Signed by Player│ │ READ     │
│ │ │      Mike Johnson signed contract│ │          │
│ │ │      5 hours ago               │ │           │
│ │ └─────────────────────────────────┘ │           │
│ └───────────────────────────────────┘             │
│                                                     │
└─────────────────────────────────────────────────────┘
```

## 3. Notification Item Details

```
UNREAD Notification:
┌──────────────────────────────────────────┐
│ Background: Light blue (#EFF6FF)         │
│ ┌──────────────────────────────────────┐ │
│ │ [✓✓✓]  ✅ Contract Signed by Player │ │
│ │ Green check circle icon              │ │
│ │                                      │ │
│ │ John Doe has signed the contract    │ │
│ │                                      │ │
│ │ 2 minutes ago          [●] ◄─ Unread│
│ │                           dot       │ │
│ └──────────────────────────────────────┘ │
│                                          │
│ On click: Navigate to contract page      │
│          Mark notification as read       │
└──────────────────────────────────────────┘

READ Notification:
┌──────────────────────────────────────────┐
│ Background: White                        │
│ ┌──────────────────────────────────────┐ │
│ │ [✓✓✓]  ✅ Contract Signed by Player │ │
│ │ Green check circle icon              │ │
│ │                                      │ │
│ │ Jane Smith has signed the contract  │ │
│ │                                      │ │
│ │ 1 hour ago                           │ │
│ └──────────────────────────────────────┘ │
│                                          │
│ On click: Navigate to contract page      │
└──────────────────────────────────────────┘
```

## 4. Database Schema Relationship

```
┌─────────────────────────┐
│      users              │
├─────────────────────────┤
│ id                      │
│ first_name              │
│ last_name               │
│ email                   │
└──────────┬──────────────┘
           │
           │ owns
           │
┌──────────▼──────────────┐
│      clubs              │
├─────────────────────────┤
│ id                      │
│ owner_id (→ users)      │
│ club_name               │
│ logo_url                │
└──────────┬──────────────┘
           │
           │ has
           │
┌──────────▼──────────────────────┐
│      contracts                  │
├─────────────────────────────────┤
│ id                              │
│ club_id (→ clubs)               │
│ player_id (→ players)           │
│ status                          │
│ player_signature_timestamp      │
│ contract_html                   │
└──────────┬──────────────────────┘
           │
           │ references
           │
┌──────────▼────────────────────────┐
│    notifications (NEW)            │
├───────────────────────────────────┤
│ id                                │
│ club_id (→ clubs)                 │ ◄─ Club owner sees only their notifications
│ contract_id (→ contracts)         │
│ player_id (→ players)             │
│ notification_type: 'contract_...' │
│ title: "✅ Contract Signed..."    │
│ message: "[Player] has signed..." │
│ is_read: false                    │
│ read_at: null                     │
│ action_url: "/dashboard/club-.."  │
│ created_at                        │
└───────────────────────────────────┘
```

## 5. Real-Time Flow (Supabase Realtime)

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│  CONTRACT SIGNING (Player)        NOTIFICATION (Club)  │
│                                                         │
│  1. Player clicks "Sign"                               │
│     ↓                                                   │
│  2. Contract updated in DB ─────┐                      │
│     ↓                           │                      │
│  3. Notification INSERT ────────┼──→ Supabase Channel │
│                                 │                      │
│                    Broadcast Event (postgres_changes)   │
│                            ↓                            │
│                     Club Dashboard                     │
│                     useClubNotifications hook          │
│                            ↓                            │
│                     notifications state updated        │
│                            ↓                            │
│                     Component re-renders               │
│                            ↓                            │
│                     Bell icon updates (+1)             │
│                     Dropdown refreshes                 │
│                            ↓                            │
│                     Club owner sees notification       │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

## 6. Notification States & Transitions

```
NOTIFICATION LIFECYCLE:

1. CREATED (is_read: false)
   ↓
   [User views notification dropdown]
   ↓
2. READ (is_read: true, read_at: timestamp)
   
   OR

2. AUTO-READ (is_read: true, read_at: timestamp)
   [User clicks on notification → navigates to contract]


BADGE STATES:

No notifications:     No badge
1 notification:       [1]
5 notifications:      [5]
10+ notifications:    [9+]


UNREAD INDICATOR:

Unread:   Light blue background + blue dot
Read:     White background
All read: No "Mark all as read" button


TIME DISPLAY:

< 1 minute:   "just now"
< 60 minutes: "5m ago", "15m ago"
< 24 hours:   "2h ago", "6h ago"
≥ 24 hours:   "Dec 20", "Dec 19"
```

## 7. API Flow - Complete Sequence

```
SEQUENCE DIAGRAM:

Player              App             Server          Database
  │                 │                 │                │
  │─ Click Sign ──→ │                 │                │
  │                 │─ POST /api ────→ │                │
  │                 │ signContractAsPlayer()          │
  │                 │                 │                │
  │                 │                 │─ SELECT ──────→│
  │                 │                 │ Get contract   │
  │                 │                 │←─ contract ────│
  │                 │                 │                │
  │                 │                 │─ UPDATE ──────→│
  │                 │                 │ Contract       │
  │                 │                 │ + signature    │
  │                 │                 │                │
  │                 │                 │─ UPDATE ──────→│
  │                 │                 │ Players table  │
  │                 │                 │ is_available=F │
  │                 │                 │                │
  │                 │                 │─ INSERT ──────→│
  │                 │                 │ Notification   │
  │                 │                 │                │
  │                 │←─ success ──────│                │
  │←─ "Signed!" ───│                 │                │
  │                 │                                  │
  │                                                   │
  └─────────────────────────────────────────────────┘
  
Club Owner          App             Server        Database/Realtime
  │                 │                 │                │
  │─ Load Page ────→ │                 │                │
  │                 │─ useClub      │                │
  │                 │  Notifications() │              │
  │                 │                 │─ SELECT ──────→│
  │                 │                 │ notifications  │
  │                 │                 │←─ data ────────│
  │                 │←─ data ────────│                │
  │                 │                 │                │
  │                 │ Subscribe to realtime events     │
  │                 │ postgres_changes on notifications│
  │                 │                 │                │
  │ [Sees bell] ←───│← Notification appears           │
  │                 │ (notification_type=contract_...) │
  │                 │                 │                │
  │─ Click Bell ──→ │                 │                │
  │                 │ Dropdown shows notification      │
  │                 │ markAsRead(notification_id)      │
  │                 │                 │─ UPDATE ──────→│
  │                 │                 │ is_read=true   │
  │                 │                 │ read_at=now    │
  │                 │←─ updated ─────│                │
  │                 │                 │                │
  │─ Click Notif. ──→ Navigate to:    │                │
  │                 │ /dashboard/club-owner/contracts/
  │                 │ [contract_id]/view              │
  │                 │                 │                │
  └─────────────────────────────────────────────────┘
```

## 8. Key Features Summary

```
┌─────────────────────────────────────────────────────────────┐
│                  NOTIFICATION FEATURES                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ ✅ Real-time Updates                                        │
│    • Notifications appear instantly without page refresh    │
│    • Uses Supabase Realtime channels                        │
│                                                             │
│ ✅ Visual Indicators                                        │
│    • Bell icon with unread count badge                      │
│    • Light blue highlight for unread notifications         │
│    • Green checkmark for "contract signed" type            │
│                                                             │
│ ✅ User Interactions                                        │
│    • Click notification → navigate to contract              │
│    • Auto-mark as read on click                            │
│    • Mark single notification as read                      │
│    • Mark ALL notifications as read at once                │
│                                                             │
│ ✅ Time Formatting                                          │
│    • "just now" (< 1 min)                                  │
│    • "5m ago" (< 1 hour)                                   │
│    • "2h ago" (< 24 hours)                                 │
│    • "Dec 20" (≥ 24 hours)                                 │
│                                                             │
│ ✅ Security                                                 │
│    • RLS policies: each club owner sees only their notif.   │
│    • Secured database functions                            │
│    • User authentication required                          │
│                                                             │
│ ✅ Error Handling                                           │
│    • Graceful degradation (doesn't block signing)          │
│    • Console logging for debugging                         │
│    • Retry mechanisms available                            │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## 9. Testing the Feature

### Manual Test Steps:

```
1. Login as Club Owner
   └─ Navigate to: /dashboard/club-owner/contracts

2. Create a Contract
   └─ Send contract to a player
   
3. Login as Player
   └─ Navigate to: /dashboard/player/contracts
   └─ Click on pending contract

4. Sign the Contract
   └─ Fill in name and date
   └─ Agree to terms
   └─ Click "Sign Contract"
   
5. Check Club Dashboard
   └─ Notice notification bell in navbar
   └─ Badge shows "1" unread
   
6. Click Bell Icon
   └─ Dropdown shows notification:
      "✅ Contract Signed by Player - [Player Name]"
   └─ Background is light blue (unread)
   
7. Click Notification
   └─ Redirected to contract view
   └─ Notification now marked as read (white background)
   └─ Unread badge decreases
   
8. Verify Contract Status
   └─ Status should be "ACTIVE"
   └─ Signature fields should show player signature
   └─ Display should show "✅ Digitally signed by [Name], [Date]"
```

### Automated Tests (Future):

```javascript
// Test: Notification creation on signing
test('should create notification when player signs contract', async () => {
  // 1. Get contract
  // 2. Sign it
  // 3. Query notifications table
  // 4. Assert notification exists with correct data
})

// Test: Real-time subscription
test('should receive real-time notification update', async () => {
  // 1. Subscribe to notifications
  // 2. Sign contract in another session
  // 3. Assert notification received in subscriber
})

// Test: Mark as read
test('should mark notification as read', async () => {
  // 1. Get unread notification
  // 2. Call markAsRead()
  // 3. Assert is_read = true, read_at is set
})
```
