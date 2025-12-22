# Dashboard Notifications - Visual Guide

## Dashboard Layout with Notifications Bell

### Top Navigation Bar

```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃                                                                ┃
┃  🏆 PCL  |  My Club    [🔔 3]  John Doe    [Sign Out]         ┃
┃  ▲                     ▲       ▲            ▲                 ┃
┃  Logo               Bell Icon  User Name    Button             ┃
┃                     (unread)                                   ┃
┃                                                                ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
```

---

## Bell Icon States

### No Unread Notifications
```
     🔔
   (gray)
   
Just a bell icon, no badge
```

### With Unread Notifications
```
     🔔
    3⚫
   (red)
   
Red badge showing count
Max shows: "9+"
```

### Loading State
```
    🔔 ⟳
  (animated)
  
Spinning indicator
```

---

## Notification Dropdown - Closed

```
User hovers over or clicks bell icon
```

---

## Notification Dropdown - Open

### Full Dropdown View

```
┌─────────────────────────────────────────────────────────────┐
│ Notifications                                            [✕] │
├─────────────────────────────────────────────────────────────┤
│ ⬜ Mark all as read                        (only if unread)  │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ ✅ John Doe Signed Contract                                 │
│    📄 Contract for John Doe                                 │
│    Digitally signed - Valid for 2 years                     │
│    2 hours ago                                    [Read]     │
│                                                              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ 📋 Jane Smith Contract Offer                                │
│    📄 Pending Contract for Jane Smith                       │
│    Awaiting player acceptance                               │
│    1 day ago                                  [UNREAD]      │
│                                                              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ ✓ Mike Johnson Contract Terminated                          │
│    📄 Contract ended with Mike Johnson                      │
│    Scout status: Available again                            │
│    3 days ago                                    [Read]      │
│                                                              │
├─────────────────────────────────────────────────────────────┤
│ 📌 Scroll for more...                                        │
│ (Max 20 notifications visible)                              │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Notification States

### Unread Notification
```
🔵 Blue/highlight background
   Indicates new/unread
   Full content visible
   Can click to navigate
```

### Read Notification
```
⚫ Gray background
   Already seen
   Still clickable
   Still has context
```

### Hovering Over Notification
```
🔆 Slightly highlighted
   Shows cursor pointer
   Ready to click
   Link indicator
```

---

## Notification Icons & Types

### Type 1: Contract Signed
```
Icon: ✅ (Green checkmark)
Title: "John Doe Signed Contract"
Message: "Contract for John Doe - Digitally signed"
Action: Click to view contract details
Location: /dashboard/club-owner/contracts/[id]/view
```

### Type 2: Contract Created (Player receives)
```
Icon: 📋 (Document/form)
Title: "New Contract Offer"
Message: "[Club Name] has sent you a new contract offer"
Action: Click to view offer
Location: /dashboard/player/contracts/[id]/view
```

### Type 3: Contract Terminated
```
Icon: 🔴 (Red circle)
Title: "Contract Terminated"
Message: "Player is now available for scout again"
Action: Click to view history
Location: /dashboard/club-owner/contracts/[id]/view
```

---

## Time Display Examples

```
Just created      → "just now"
5 mins ago        → "5m ago"
45 mins ago       → "45m ago"
2 hours ago       → "2h ago"
1 day ago         → "1d ago"
5 days ago        → "5d ago"
8 days ago        → "12/14/2025"
```

---

## Interaction Flow - Desktop

### Step 1: User sees bell icon
```
┌────────────────────────────────────────┐
│ [🔔 3]                                 │
└────────────────────────────────────────┘
```

### Step 2: User clicks bell icon
```
┌────────────────────────────────────────┐
│ [🔔 3] ← Click here                    │
│   ↓ Dropdown opens below               │
└────────────────────────────────────────┘
```

### Step 3: Dropdown appears
```
┌────────────────────────────────────────┐
│ [🔔 3]                                 │
│   ↓                                    │
│   ┌──────────────────────────────────┐ │
│   │ Notifications            [✕]    │ │
│   ├──────────────────────────────────┤ │
│   │ ⬜ Mark all as read               │ │
│   ├──────────────────────────────────┤ │
│   │ ✅ John Doe Signed...   [2h ago] │ │
│   │ 📋 Jane Smith Offer...   [1d ago] │ │
│   │ 🔴 Mike Johnson Ended... [3d ago] │ │
│   └──────────────────────────────────┘ │
└────────────────────────────────────────┘
```

### Step 4: User clicks notification
```
Navigate to → Contract details page
Update      → Mark as read
Badge       → Decreases to 2
Dropdown    → Stays open (optional: close)
```

---

## Mobile Layout

### Bell Icon on Mobile
```
┌─────────────────────────────────────┐
│ [🔔 3]  John D...  [Sign O...]      │
│         (truncated text)             │
└─────────────────────────────────────┘
```

### Dropdown on Mobile
```
┌──────────────────────────────────┐
│ Notifications             [✕]   │
├──────────────────────────────────┤
│ ⬜ Mark all as read              │
├──────────────────────────────────┤
│ ✅ John Doe Signed               │
│    [2h ago]                      │
│                                  │
├──────────────────────────────────┤
│ 📋 Jane Smith Offer              │
│    [1d ago]                      │
│                                  │
├──────────────────────────────────┤
│ 🔴 Mike Johnson Ended            │
│    [3d ago]                      │
└──────────────────────────────────┘
```

---

## Empty State

### No Notifications
```
┌──────────────────────────────────┐
│ Notifications             [✕]   │
├──────────────────────────────────┤
│                                  │
│           🔔 (faded)             │
│                                  │
│     "No notifications"           │
│                                  │
└──────────────────────────────────┘
```

---

## Loading State

### Fetching Notifications
```
┌──────────────────────────────────┐
│ Notifications             [✕]   │
├──────────────────────────────────┤
│                                  │
│         Loading...               │
│         ⟳ (spinning)             │
│                                  │
└──────────────────────────────────┘
```

---

## Badge Behavior

### Initial Load (3 unread)
```
[🔔 3]
```

### User Marks All as Read
```
[🔔 3] → [🔔]
```

### New Notification Arrives
```
[🔔] → [🔔 1]
```

### Maximum Badge (10+)
```
[🔔 9+]
(Shows 9+ regardless of actual count)
```

---

## Color Scheme

### Icon Colors
```
Bell Icon:    Gray (#6B7280)
Badge:        Red (#DC2626)
Background:   White (#FFFFFF)
Border:       Light Gray (#E5E7EB)
Text:         Dark Gray (#111827)
Hover:        Light Gray (#F3F4F6)
```

### Text Colors
```
Title:        Black (#000000) - 600 weight
Message:      Gray (#6B7280) - normal weight
Time:         Light Gray (#9CA3AF) - small text
Link:         Blue (#3B82F6) - on hover
```

### Notification Types
```
✅ Signed:    Green accent
📋 Created:   Blue accent
🔴 Terminated: Red accent
```

---

## Animation

### Dropdown Open
```
Duration: 150ms
Easing: ease-out
Effect: Fade + Slide down
```

### Mark as Read
```
Duration: 200ms
Effect: Fade out
```

### Badge Update
```
Duration: 300ms
Effect: Scale + fade
```

### Real-time Notification
```
Duration: 200ms
Effect: Slide in from top
```

---

## Keyboard Navigation

### Tab
```
[🔔] ← Focus here via Tab
```

### Enter/Space
```
[🔔] Focused → Press Enter → Dropdown opens
```

### Escape
```
Dropdown open → Press Esc → Dropdown closes
```

### Arrow Keys
```
Dropdown open → Down arrow → Navigate notifications
```

---

## Click Zones

### Bell Icon Click Zone
```
┌─────────┐
│  [🔔 3] │ ← Entire button area clickable
│ ========│
│ 40x40px │
└─────────┘
```

### Notification Click Zone
```
┌────────────────────────────────────┐
│ ✅ John Doe Signed Contract        │
│    📄 Contract for John Doe        │
│    2 hours ago          [Mark Read] │ ← Entire row clickable
│                         except this │
└────────────────────────────────────┘
```

---

## Responsive Design

### Desktop (1024px+)
```
┌──────────────────────────────────────────┐
│ [🔔 3]  User Name  [Sign Out]           │
│ (dropdown: 384px wide)                   │
└──────────────────────────────────────────┘
```

### Tablet (768px - 1023px)
```
┌──────────────────────────────────────┐
│ [🔔 3]  User  [Sign Out]             │
│ (dropdown: 340px wide)                │
└──────────────────────────────────────┘
```

### Mobile (< 768px)
```
┌────────────────────────────────┐
│ [🔔 3]  U  [SO]                │
│ (dropdown: full width - 20px)   │
└────────────────────────────────┘
```

---

## Error States

### Network Error
```
┌──────────────────────────────────┐
│ Notifications             [✕]   │
├──────────────────────────────────┤
│                                  │
│  ⚠️ Unable to load               │
│     Check your connection        │
│                                  │
│  [Retry]                         │
│                                  │
└──────────────────────────────────┘
```

### Permission Denied
```
┌──────────────────────────────────┐
│ Notifications             [✕]   │
├──────────────────────────────────┤
│                                  │
│  🔒 Access denied                │
│     Please sign in again         │
│                                  │
│  [Sign In]                       │
│                                  │
└──────────────────────────────────┘
```

---

## User Scenarios

### Scenario 1: Fresh Dashboard Load
```
1. Dashboard opens
2. Bell icon shows [🔔] (no badge)
3. No notifications exist
4. Empty state ready
5. Real-time listener active
```

### Scenario 2: Player Signs Contract
```
1. Player signs contract
2. Notification created in DB
3. Realtime event fired
4. Bell icon updates [🔔 1]
5. Dropdown auto-updates (if open)
```

### Scenario 3: Multiple Notifications
```
1. Several contracts created
2. Bell shows [🔔 5]
3. User clicks bell
4. Sees all 5 notifications
5. Can mark all as read with one click
```

### Scenario 4: Mark as Read
```
1. User has 3 unread
2. Badge shows [🔔 3]
3. User clicks "Mark all as read"
4. API call sent
5. Badge updates [🔔]
6. All notifications now gray
```

---

## Summary

The notification bell is:
✅ Always visible in navbar
✅ Shows unread count in badge
✅ Opens smooth dropdown
✅ Real-time updates
✅ Easy to manage (mark as read)
✅ Mobile responsive
✅ Accessible (keyboard nav)
✅ Professional UI
✅ Error handled
✅ Production ready

