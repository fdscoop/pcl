# Scout Players Architecture - Visual Guide

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                          WEB BROWSER                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  /scout/players Page                                            │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ Filter Panel                                              │  │
│  ├───────────────────────────────────────────────────────────┤  │
│  │ Search: [_____________]                                   │  │
│  │ Position: [All Positions ▼]                              │  │
│  │ State: [All States ▼]  ◄──┐ Dynamic from DB              │  │
│  │ District: [All Districts ▼]  ◄─ Dynamic from DB          │  │
│  │                                                           │  │
│  │ 📊 X players found                                        │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│  Player Cards Grid                                              │
│  ┌────────┐ ┌────────┐ ┌────────┐                               │
│  │ Player │ │ Player │ │ Player │                               │
│  │  Card  │ │  Card  │ │  Card  │                               │
│  │ [💬]   │ │ [💬]   │ │ [💬]   │                               │
│  └────────┘ └────────┘ └────────┘                               │
│                                                                 │
│  Message Modal (When 💬 clicked)                               │
│  ┌──────────────────────────────┐                               │
│  │ 💬 Send Message to John      │                               │
│  │ From: Your Club              │                               │
│  ├──────────────────────────────┤                               │
│  │ Message: [____________...]   │                               │
│  │          [0/500 chars]       │                               │
│  │ [Cancel] [Send Message]      │                               │
│  └──────────────────────────────┘                               │
└─────────────────────────────────────────────────────────────────┘
                           ▲
                           │ HTTP/HTTPS
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                     NEXT.JS FRONTEND                            │
│                  /apps/web/src/app/...                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  scout/players/page.tsx                                         │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ State Management                                        │   │
│  │ - selectedState, selectedDistrict                       │   │
│  │ - messageModal, messageContent                          │   │
│  ├─────────────────────────────────────────────────────────┤   │
│  │ Dynamic Extraction Logic                                │   │
│  │ availableStates = Extract unique states from players   │   │
│  │ availableDistricts = Extract districts for state       │   │
│  ├─────────────────────────────────────────────────────────┤   │
│  │ Filter Logic                                            │   │
│  │ - By position, state, district, search term            │   │
│  ├─────────────────────────────────────────────────────────┤   │
│  │ Message Handling                                        │   │
│  │ - handleContactPlayer() → Open modal                   │   │
│  │ - handleSendMessage() → Save to database               │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                           ▲
                           │ Supabase Client
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                    SUPABASE BACKEND                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  PostgreSQL Database                                            │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ players table                                           │   │
│  │ ├── id                                                  │   │
│  │ ├── user_id                                             │   │
│  │ ├── position ──────┐                                    │   │
│  │ ├── state ────────────┐ Dynamic                         │   │
│  │ ├── district ──────────┤ Filtering                      │   │
│  │ ├── address           │                                 │   │
│  │ ├── photo_url         │                                 │   │
│  │ ├── is_available_for_scout                              │   │
│  │ └── ...          ─────┘                                 │   │
│  │                                                         │   │
│  │ users table                                             │   │
│  │ ├── id (references auth.users)                          │   │
│  │ ├── first_name                                          │   │
│  │ ├── last_name                                           │   │
│  │ └── ...                                                 │   │
│  │                                                         │   │
│  │ messages table (optional - for message persistence)     │   │
│  │ ├── id                                                  │   │
│  │ ├── sender_id                                           │   │
│  │ ├── receiver_id                                         │   │
│  │ ├── content                                             │   │
│  │ ├── created_at                                          │   │
│  │ └── is_read                                             │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  Row Level Security (RLS)                                       │
│  ├── Messages table: Users see only their messages             │
│  └── Players table: Club owners see verified players           │
│                                                                 │
│  Storage (Images)                                               │
│  └── player-photos/ → Player profile images                    │
└─────────────────────────────────────────────────────────────────┘
```

---

## Data Flow Diagram

### 1. Load Players
```
User Visits /scout/players
           ▼
   Auth Check
           ▼
Query Supabase:
"SELECT * FROM players 
 WHERE is_available_for_scout = true
 JOIN users(id, first_name, last_name, email)"
           ▼
   Return Players Data
           ▼
  Set in State: players = [...]
```

### 2. Extract Filters
```
State Update: players = [...]
           ▼
availableStates = 
  Array.from(new Set(
    players.filter(p => p.state)
           .map(p => p.state)
           .sort()
  ))
           ▼
Result: ["Karnataka", "Kerala", "Tamil Nadu"]
```

### 3. User Selects State
```
User Clicks: State = "Kerala"
           ▼
availableDistricts = 
  Array.from(new Set(
    players.filter(p => p.state === "Kerala" && p.district)
           .map(p => p.district)
           .sort()
  ))
           ▼
Result: ["Ernakulam", "Kottayam", "Thiruvananthapuram"]
```

### 4. Filtering Players
```
User Applies Filters:
- selectedState = "Kerala"
- selectedDistrict = "Ernakulam"
- selectedPosition = "Midfielder"
- searchTerm = "john"
           ▼
Filter Logic:
players.filter(p =>
  p.state === "Kerala" &&
  p.district === "Ernakulam" &&
  p.position === "Midfielder" &&
  name.includes("john")
)
           ▼
Display Filtered Players
```

### 5. Send Message
```
User Clicks 💬 Send Message
           ▼
Modal Opens
           ▼
User Types Message
           ▼
User Clicks Send
           ▼
POST to Supabase:
INSERT INTO messages (
  sender_id, receiver_id, content, created_at
)
           ▼
Message Saved ✓
           ▼
Modal Closes
```

---

## Component Structure

```
ScoutPlayersPage
│
├── State
│   ├── club
│   ├── players
│   ├── filteredPlayers
│   ├── selectedState
│   ├── selectedDistrict
│   ├── selectedPosition
│   ├── messageModal
│   ├── messageContent
│   └── ...
│
├── Computed Values
│   ├── positions (array)
│   ├── availableStates (extracted from players)
│   └── availableDistricts (extracted from selected state players)
│
├── Effects
│   ├── useEffect: loadData()
│   └── useEffect: filterPlayers()
│
├── Handlers
│   ├── loadData()
│   ├── filterPlayers()
│   ├── handleContactPlayer()
│   └── handleSendMessage()
│
└── Render
    ├── Header
    ├── Filter Card
    │   ├── Search Input
    │   ├── Position Select
    │   ├── State Select (availableStates)
    │   └── District Select (availableDistricts)
    ├── Player Cards Grid
    │   ├── Photo
    │   ├── Stats
    │   ├── Info
    │   └── Message Button
    └── Message Modal
        ├── Header
        ├── Textarea
        ├── Character Counter
        └── Buttons
```

---

## State Management

```
Component State
│
├── UI State
│   ├── selectedState: string ('all' | state name)
│   ├── selectedDistrict: string ('all' | district name)
│   ├── selectedPosition: string ('all' | position name)
│   ├── searchTerm: string
│   └── messageModal: { isOpen: boolean, player: Player | null }
│
├── Data State
│   ├── club: Club object
│   ├── players: Player[]
│   ├── filteredPlayers: Player[]
│   └── loading: boolean
│
└── Form State
    ├── messageContent: string (0-500 chars)
    └── sendingMessage: boolean
```

---

## Filter Flow

```
┌──────────────────┐
│  Load All        │
│  Players from DB │
└────────┬─────────┘
         │
         ▼
┌──────────────────────────┐
│ Extract Available States │
└────────┬─────────────────┘
         │
         ▼
┌──────────────────────────────┐
│ Show in State Dropdown       │
└────────┬─────────────────────┘
         │
    User Selects State
         │
         ▼
┌──────────────────────────────────────┐
│ Extract Districts for Selected State │
└────────┬─────────────────────────────┘
         │
         ▼
┌──────────────────────────────┐
│ Show in District Dropdown    │
└────────┬─────────────────────┘
         │
    User Applies Filters (State, District, Position, Search)
         │
         ▼
┌──────────────────────────────┐
│ Filter All Players           │
└────────┬─────────────────────┘
         │
         ▼
┌──────────────────────────────┐
│ Display Filtered Results     │
└──────────────────────────────┘
```

---

## Key Components

### Scout Page (`/scout/players/page.tsx`)
- Main component for browsing players
- Handles all filtering logic
- Manages message modal state
- Integrates with Supabase

### Filter Panel
- Search input
- Position dropdown (static: 4 options)
- State dropdown (dynamic: extracted from players)
- District dropdown (dynamic: extracted based on selected state)
- Result counter

### Player Cards
- Player photo (Next.js Image)
- Player info (position, nationality, height, weight)
- Statistics (matches, goals, assists)
- Message button

### Message Modal
- Player name and club name
- Textarea with 500 char limit
- Character counter
- Cancel and Send buttons
- Smooth animations

---

## Database Relationships

```
auth.users (Supabase Auth)
    │
    ├── 1 ─────── ∞ players
    │               (user_id foreign key)
    │
    ├── 1 ─────── ∞ clubs
    │               (owner_id foreign key)
    │
    └── many ──── many messages
                   (as sender_id and receiver_id)

players
    ├── id
    ├── user_id (FK → auth.users)
    ├── state ◄── Dynamic Filtering
    ├── district ◄── Dynamic Filtering
    ├── position ◄── Position Filtering
    ├── photo_url
    ├── is_available_for_scout ◄── RLS Filter
    └── ...

messages
    ├── id
    ├── sender_id (FK → auth.users)
    ├── receiver_id (FK → auth.users)
    ├── content
    ├── created_at
    └── is_read
```

---

## Security Architecture

```
┌─────────────────────────────────────┐
│        Authentication Layer         │
│    (Supabase JWT Tokens)           │
└────────────┬────────────────────────┘
             │
             ▼
┌─────────────────────────────────────┐
│     Authorization Layer             │
│    (Supabase RLS Policies)         │
├─────────────────────────────────────┤
│                                     │
│ Players Table:                      │
│  - Public read for club owners      │
│  - Filtered by is_available_for... │
│                                     │
│ Messages Table:                     │
│  - Users see only their messages    │
│  - RLS enforces on database level   │
│                                     │
└────────────┬────────────────────────┘
             │
             ▼
┌─────────────────────────────────────┐
│      Data Access Layer              │
│   (Client-side filters + DB)       │
├─────────────────────────────────────┤
│                                     │
│ Client Filtering:                   │
│  - State selection                  │
│  - District selection               │
│  - Position filtering               │
│  - Search filtering                 │
│                                     │
│ Database Level:                     │
│  - RLS policies enforce access      │
│  - Indexes optimize queries         │
│                                     │
└─────────────────────────────────────┘
```

This architecture ensures:
- ✅ Only authenticated users can access
- ✅ Only club owners see verified players
- ✅ Only users see their own messages
- ✅ Player privacy is protected
- ✅ Scalable and performant
