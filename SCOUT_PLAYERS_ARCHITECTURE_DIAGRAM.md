# Scout Players Feature - User Flow & Architecture

## User Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                      CLUB OWNER JOURNEY                         │
└─────────────────────────────────────────────────────────────────┘

                          ┌──────────────┐
                          │ Club Owner   │
                          │  Dashboard   │
                          └──────┬───────┘
                                 │
                                 │ Click "Scout Players"
                                 │
                                 ▼
                    ┌─────────────────────────┐
                    │   Scout Players Page    │
                    │    (/scout/players)     │
                    └─────────────────────────┘
                                 │
                    ┌────────────┬────────────┐
                    │            │            │
                    ▼            ▼            ▼
              ┌──────────┐  ┌──────────┐  ┌──────────┐
              │  Search  │  │ Position │  │  State   │
              │   Box    │  │ Filter   │  │ Filter   │
              └────┬─────┘  └────┬─────┘  └────┬─────┘
                   │             │             │
                   └──────┬──────┴─────┬───────┘
                          │            │
                    Real-Time Filtering
                          │            │
                          ▼            ▼
                    ┌─────────────────────────┐
                    │  Player Cards Grid      │
                    │  (3 cols desktop)       │
                    └─────────────────────────┘
                                 │
                                 │
                    ┌────────────┬────────────┐
                    │            │            │
                    ▼            ▼            ▼
              ┌──────────┐  ┌──────────┐  ┌──────────┐
              │ Player 1 │  │ Player 2 │  │ Player 3 │
              │          │  │          │  │          │
              │ [Photo]  │  │ [Photo]  │  │ [Photo]  │
              │ Stats    │  │ Stats    │  │ Stats    │
              │ [Contact]│  │ [Contact]│  │ [Contact]│
              └──────────┘  └──────────┘  └──────────┘
                    │            │            │
                    └──────┬──────┴────────────┘
                           │
                    Click "Contact Player"
                           │
                           ▼
            (Future: Contact Flow Coming Soon)


┌─────────────────────────────────────────────────────────────────┐
│                      PLAYER VISIBILITY FLOW                     │
└─────────────────────────────────────────────────────────────────┘

    ┌──────────────┐
    │ Player User  │
    └──────┬───────┘
           │
           │ 1. Register & Create Player Profile
           │
           ▼
    ┌──────────────────────────┐
    │ Player Profile Created   │
    │ (incomplete - hidden)    │
    └──────┬───────────────────┘
           │
           │ 2. Complete Player Profile
           │    - Position, Height, Weight
           │    - Nationality, D.O.B
           │    - Upload Photo (MANDATORY)
           │
           ▼
    ┌──────────────────────────┐
    │ Profile Completed        │
    │ (still hidden)           │
    └──────┬───────────────────┘
           │
           │ 3. Start KYC Verification
           │    - Select Aadhaar option
           │    - Enter Aadhaar details
           │    - Verify with OTP
           │
           ▼
    ┌──────────────────────────┐
    │ KYC Status: verified     │
    │ is_available_for_scout:  │
    │        TRUE              │
    └──────┬───────────────────┘
           │
           │ Auto-triggered:
           │ is_available_for_scout = true
           │
           ▼
    ┌──────────────────────────────────┐
    │ ✅ VISIBLE TO CLUB SCOUTS!       │
    │                                  │
    │ Now appears in:                  │
    │ - Scout Players page             │
    │ - Club owner searches            │
    │ - Can be contacted by clubs      │
    └──────────────────────────────────┘


┌─────────────────────────────────────────────────────────────────┐
│                    DATA FLOW ARCHITECTURE                       │
└─────────────────────────────────────────────────────────────────┘

Club Owner Browser (Frontend)
    │
    │ 1. Load Scout Players Page
    │
    ▼
Next.js App Router
    │
    ├─ /scout/players route
    │
    ▼
Scout Players Component
    │
    ├─ useEffect: loadData()
    │
    ▼
Supabase Client
    │
    └─ Query: GET players WHERE is_available_for_scout = true
        JOIN users (first_name, last_name, email)
        ORDER BY created_at DESC
    │
    ▼
Supabase Database
    │
    ├─ players table
    │  ├─ id, user_id, unique_player_id
    │  ├─ photo_url, position, nationality
    │  ├─ height_cm, weight_kg
    │  ├─ total_matches_played, total_goals_scored, total_assists
    │  └─ is_available_for_scout (filter: TRUE)
    │
    └─ users table
       ├─ first_name, last_name
       ├─ email, state
       └─ (joined via user_id)
    │
    ▼
Response: Array of Players
    │
    ├─ Player {
    │   ├─ id, unique_player_id, photo_url
    │   ├─ position, nationality
    │   ├─ height_cm, weight_kg
    │   ├─ total_matches_played, goals, assists
    │   └─ users: { first_name, last_name, email }
    │ }
    │
    ▼
Store in React State (setPlayers)
    │
    ▼
Render Player Cards
    │
    ├─ Search Filter (client-side)
    ├─ Position Filter (client-side)
    ├─ State Filter (client-side)
    │
    ▼
Display Filtered Results
    │
    └─ Update Results Counter


┌─────────────────────────────────────────────────────────────────┐
│                   COMPONENT HIERARCHY                           │
└─────────────────────────────────────────────────────────────────┘

ScoutPlayersPage (Root Component)
│
├─ Navigation Bar
│  ├─ Logo
│  ├─ Title
│  └─ Buttons
│
├─ Page Header
│  ├─ Title: "🔍 Scout Players"
│  └─ Subtitle
│
├─ Filter Card
│  ├─ Search Input
│  ├─ Position Dropdown
│  ├─ State Dropdown
│  └─ Results Counter
│
└─ Players Grid Container
   ├─ Player Card 1
   │  ├─ Card Header
   │  │  ├─ Photo/Image
   │  │  ├─ Name
   │  │  └─ ID
   │  │
   │  └─ Card Content
   │     ├─ Info Grid (2 cols)
   │     │  ├─ Position | Nationality
   │     │  └─ Height | Weight
   │     │
   │     ├─ Stats Box
   │     │  ├─ Matches
   │     │  ├─ Goals
   │     │  └─ Assists
   │     │
   │     ├─ Email
   │     │
   │     └─ Contact Button
   │
   ├─ Player Card 2 (same structure)
   │
   └─ Player Card 3 (same structure)


┌─────────────────────────────────────────────────────────────────┐
│                      STATE MANAGEMENT                           │
└─────────────────────────────────────────────────────────────────┘

Local State:
    │
    ├─ club: { club info from Supabase }
    ├─ players: [ all verified players ]
    ├─ filteredPlayers: [ filtered results ]
    ├─ loading: boolean
    ├─ searchTerm: string (from search input)
    ├─ selectedPosition: string (from position dropdown)
    └─ selectedState: string (from state dropdown)

Effects:
    │
    ├─ useEffect([]) 
    │  └─ Load players on page mount
    │
    └─ useEffect([players, searchTerm, selectedPosition, selectedState])
       └─ Re-filter on any change


┌─────────────────────────────────────────────────────────────────┐
│                    FILTERING LOGIC FLOW                         │
└─────────────────────────────────────────────────────────────────┘

User Input → State Update → filterPlayers() → setFilteredPlayers()

                            │
                    ┌───────┴────────┐
                    │                │
                    ▼                ▼
            Start with all      Apply Search
              players               │
                │                   │
                │         ┌─────────┴─────────┐
                │         │                   │
                │         ▼                   ▼
                │    Match first_name    Match email
                │         OR             OR
                │    Match last_name     Match player_id
                │
                └─────────┬─────────┘
                          │
                          ▼
                Apply Position Filter
                    (if selected)
                          │
                          ▼
                Apply State Filter
                    (if selected)
                          │
                          ▼
                Return Filtered Results
                          │
                          ▼
                Update filteredPlayers
                          │
                          ▼
                Render Cards + Update Counter


┌─────────────────────────────────────────────────────────────────┐
│                    ERROR HANDLING FLOW                          │
└─────────────────────────────────────────────────────────────────┘

Load Players
    │
    ├─ Success
    │  └─ Display players
    │
    └─ Error
       ├─ Log to console
       ├─ Set players = []
       └─ Show empty state

Get User Auth
    │
    ├─ Authenticated
    │  └─ Continue loading data
    │
    └─ Not Authenticated
       └─ Redirect to /auth/login

Get Club Data
    │
    ├─ Club exists
    │  └─ Display club name
    │
    └─ Club not exists
       └─ (continue, optional field)

Filter Players
    │
    ├─ Matches found
    │  └─ Show player cards
    │
    └─ No matches
       └─ Show "No players found" message
