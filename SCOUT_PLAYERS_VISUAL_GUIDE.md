# Scout Players Page - Visual Layout & Component Guide

## Page Structure

```
┌────────────────────────────────────────────────────────────┐
│  NAVIGATION BAR                                             │
│  [PCL Logo] PCL      [Club Name] [Back to Dashboard]       │
└────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────┐
│  PAGE TITLE                                                 │
│  🔍 Scout Players                                           │
│  Find and connect with verified players available for       │
│  recruitment                                                │
└────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────┐
│  FILTERS CARD                                               │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Filter Players                                       │  │
│  ├──────────────────────────────────────────────────────┤  │
│  │ [Search Box]  [Position ▼]  [State ▼]  [Results: N] │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────┐
│  PLAYERS GRID (3 columns on desktop, responsive)           │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │ PLAYER CARD  │  │ PLAYER CARD  │  │ PLAYER CARD  │    │
│  │              │  │              │  │              │    │
│  │ [Photo]      │  │ [Photo]      │  │ [Photo]      │    │
│  │              │  │              │  │              │    │
│  │ Name         │  │ Name         │  │ Name         │    │
│  │ ID: ...      │  │ ID: ...      │  │ ID: ...      │    │
│  │              │  │              │  │              │    │
│  │ Position     │  │ Position     │  │ Position     │    │
│  │ Nationality  │  │ Nationality  │  │ Nationality  │    │
│  │ Height/Weight│  │ Height/Weight│  │ Height/Weight│    │
│  │              │  │              │  │              │    │
│  │ [Stats Box]  │  │ [Stats Box]  │  │ [Stats Box]  │    │
│  │ 25 | 12 | 5  │  │ 25 | 12 | 5  │  │ 25 | 12 | 5  │    │
│  │              │  │              │  │              │    │
│  │ Email        │  │ Email        │  │ Email        │    │
│  │              │  │              │  │              │    │
│  │ [Contact]    │  │ [Contact]    │  │ [Contact]    │    │
│  └──────────────┘  └──────────────┘  └──────────────┘    │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │ PLAYER CARD  │  │ PLAYER CARD  │  │ PLAYER CARD  │    │
│  │              │  │              │  │              │    │
│  │ [Continue...] │  │ [Continue...] │  │ [Continue...] │    │
│  └──────────────┘  └──────────────┘  └──────────────┘    │
└────────────────────────────────────────────────────────────┘
```

## Component Breakdown

### 1. Navigation Bar
```typescript
<nav className="bg-white border-b border-slate-200 shadow-sm">
  - Logo and PCL text
  - Club name display
  - Back to Dashboard button
</nav>
```

### 2. Page Header
```typescript
<header className="mb-8">
  <h1>🔍 Scout Players</h1>
  <p>Find and connect with verified players available for recruitment</p>
</header>
```

### 3. Filter Card
```typescript
<Card className="mb-8">
  - Search Input: "Name, email, or player ID"
  - Position Dropdown: All / Goalkeeper / Defender / Midfielder / Forward
  - State Dropdown: All / Kerala / Tamil Nadu / Karnataka / Telangana / Maharashtra
  - Results Counter: "📊 N players found"
</Card>
```

### 4. Players Grid
```typescript
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
  - Responsive: 1 column on mobile, 2 on tablet, 3 on desktop
  - Gap between cards: 6 units
  - Hover shadow effect
</div>
```

## Player Card Structure

Each player card is a `<Card>` component with:

```
┌─────────────────────────────────┐
│ [CARD HEADER]                   │
│ ┌─────────────────────────────┐ │
│ │     [PLAYER PHOTO]          │ │  <- Full width, 192px height
│ │     or ⚽ Emoji Fallback     │ │
│ └─────────────────────────────┘ │
│                                 │
│ Name Full Name                  │
│ ID: PCL-2025-00123              │
│                                 │
├─────────────────────────────────┤
│ [CARD CONTENT]                  │
│                                 │
│ Info Grid (2 columns):          │
│ ┌──────────────┬──────────────┐ │
│ │ Position     │ Nationality  │ │
│ │ [Value]      │ [Value]      │ │
│ ├──────────────┼──────────────┤ │
│ │ Height       │ Weight       │ │
│ │ [Value]      │ [Value]      │ │
│ └──────────────┴──────────────┘ │
│                                 │
│ Stats Box (Blue background):    │
│ ┌──────────────────────────────┐ │
│ │  Matches | Goals | Assists   │ │
│ │    25    │  12   │    5      │ │
│ └──────────────────────────────┘ │
│                                 │
│ Email Address:                  │
│ player@email.com                │
│                                 │
│ [Contact Player] (Full Width)   │
└─────────────────────────────────┘
```

## Color Scheme

```
Background:
- Page: gradient-to-br from-slate-50 to-slate-100
- Nav: bg-white

Cards:
- Background: white
- Hover: shadow-lg
- Border: slate-200

Stats Box:
- Background: blue-50
- Matches: blue-600
- Goals: green-600
- Assists: purple-600

Text:
- Headings: slate-900
- Secondary: slate-600
- Tertiary: slate-500

Buttons:
- Primary: blue-600 hover:blue-700
- Secondary: outline
```

## Responsive Breakpoints

```
Mobile (< 768px):
- 1 column grid
- Full width cards
- Single line search
- Stacked filters

Tablet (768px - 1024px):
- 2 column grid
- Filters side by side
- Cards optimized

Desktop (> 1024px):
- 3 column grid
- Full filter row
- Best viewing experience
```

## Empty State

When no players match filters:

```
┌────────────────────────────────────┐
│  [Alert Component]                 │
│                                    │
│  No players found. Try adjusting   │
│  your filters or check back later! │
└────────────────────────────────────┘
```

## Loading State

```
┌────────────────────────────────────┐
│  [Full Screen]                     │
│                                    │
│  Loading players...                │
│                                    │
└────────────────────────────────────┘
```

## Filter Behavior

### Search
- Real-time filtering as user types
- Searches: `${firstName} ${lastName}` OR email OR playerID
- Case insensitive
- Updates results counter immediately

### Position Filter
- Dropdown with options
- Default: "All Positions"
- Updates results when changed

### State Filter
- Dropdown with options
- Default: "All States"
- Updates results when changed

### Combined Filtering
- All filters work together
- Example: Search "john" + Position "Forward" + State "Kerala"
- Shows: All forwards named john in Kerala

## Interactive Elements

### Search Input
```typescript
<input type="text" placeholder="Name, email, or player ID" />
```
- Real-time onChange handler
- Updates state and triggers filter

### Dropdowns
```typescript
<select onChange={(e) => setSelectedPosition(e.target.value)}>
  <option value="all">All Positions</option>
  <option value="Goalkeeper">Goalkeeper</option>
  ...
</select>
```

### Contact Button
```typescript
<Button 
  className="w-full bg-blue-600 hover:bg-blue-700"
  onClick={() => handleContactPlayer(player)}
>
  Contact Player
</Button>
```
- Currently shows alert
- Will trigger contact flow (coming soon)

## Image Rendering

Player photos use Next.js `Image` component:
```typescript
<Image
  src={player.photo_url}
  alt={`${player.users?.first_name} ${player.users?.last_name}`}
  fill
  className="object-cover"
/>
```

Benefits:
- Automatic optimization
- Lazy loading
- Responsive sizing
- Fallback to emoji if missing

---

## Related Files
- Component implementation: `/apps/web/src/app/scout/players/page.tsx`
- UI Components: `/apps/web/src/components/ui/`
- Supabase client: `/apps/web/src/lib/supabase/client.ts`
