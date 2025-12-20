# PCL Tournament Filtering System

## Overview
The PCL platform implements a hierarchical tournament structure with intelligent filtering based on the competition level. This document explains the filtering strategy and rollout plan.

## Rollout Strategy

### Phase 1: Kasaragod District (Pilot)
**Status:** Active ✅

**Features Available:**
- ✅ Full tournament system (DQL)
- ✅ Friendly matches
- ✅ Official matches
- ✅ Stadium registration
- ✅ Referee/staff onboarding
- ✅ Club creation and management
- ✅ Player scouting

**Purpose:** Test and refine the complete tournament ecosystem before nationwide expansion.

### Phase 2: Other Districts (Expansion)
**Status:** Limited Access 🟡

**Features Available:**
- ✅ Friendly matches
- ✅ Official matches (non-tournament)
- ✅ Stadium registration
- ✅ Referee/staff onboarding
- ✅ Club creation
- ✅ Player profiles
- ❌ Official tournaments (coming soon)

**Purpose:** Build infrastructure and community engagement while preparing for tournament expansion.

---

## Tournament Structure Overview

**Important:** DQL is NOT a tournament type - it's a separate qualifying stage BEFORE the main tournament hierarchy.

```
FRIENDLY MATCHES (Casual)
        ↓
    DQL (District Qualifier Level)
        ↓ (Top 4 teams)
    AMATEUR LEAGUE
        ↓ (Top 2 teams)
    INTERMEDIATE LEAGUE
        ↓ (Top teams)
    PROFESSIONAL LEAGUE
```

---

## Tournament Levels & Filtering

### 1. Friendly Matches
**Filter Type:** District-based

**Logic:**
```javascript
filterType: 'district'
options: All Districts | Specific District
```

**Use Case:**
- Clubs organize casual matches within their district
- Build local rivalries and community
- Practice and preparation for DQL and tournaments

**Statistics Shown:**
- Top clubs per district
- Top players per district
- Match counts and win rates

**UI Indicators:**
- 🎯 "Pilot District" badge for Kasaragod
- ⚽ "Friendly Matches Only" badge for other districts

**Promotion:** None (casual matches)

---

### 2. DQL (District Qualifier Level)
**Filter Type:** District-based

**Logic:**
```javascript
filterType: 'district'
options: Kasaragod (currently) | Other districts (future)
restriction: Only districts with active DQL
```

**Eligibility:**
- ✅ Kasaragod: Full access (Pilot)
- 🔒 Other districts: Coming soon

**Purpose:**
- **Qualifying stage** for Amateur League (NOT a tournament itself)
- Entry point to the tournament pyramid
- All clubs in the district can participate
- District-level competition to identify top teams

**Use Case:**
- District championship with local pride
- Teams compete to qualify for state-level Amateur League
- Foundation of the entire tournament system

**Statistics Shown:**
- Club standings (MP, W, D, L, GF, GA, GD, Pts)
- **Top 4 teams highlighted in green** (promotion zone)
- Green ↑ arrow and "Q" badge for qualifying teams
- District-specific leaderboards

**Visual Indicators:**
- 🏆 "Top 4 teams → Amateur League" badge
- Green background for top 4 teams
- Promotion pathway: **DQL** → Amateur → Intermediate → Professional

**Progression:**
- **Top 4 teams → Amateur League** (State Level)

---

### 3. Amateur League
**Filter Type:** State-based

**Logic:**
```javascript
filterType: 'state'
options: All States | Kerala | Karnataka | Tamil Nadu | etc.
```

**Eligibility:**
- **ONLY Top 4 teams from each district's DQL**
- Must have qualified through DQL competition
- Promoted teams from district level

**Purpose:**
- State-level tournament (first actual tournament in the pyramid)
- Best district teams compete
- State championship title

**Use Case:**
- Higher quality competitive matches
- Cross-district rivalries within the state
- State champion crowned

**Statistics Shown:**
- State-wide club standings
- Filter by state to see specific state competition
- **Top 2 teams highlighted in green** (promotion zone)
- Shows which district each team qualified from

**Visual Indicators:**
- 🏆 "Top 2 teams → Intermediate League" badge
- Green background for top 2 teams
- Promotion pathway: DQL → **Amateur** → Intermediate → Professional

**Progression:**
- **Top 2 teams per state → Intermediate League**

---

### 4. Intermediate League
**Filter Type:** Regional/Multi-state

**Logic:**
```javascript
filterType: 'region'
options: All States | South India | North India | East | West
```

**Eligibility:**
- **ONLY Top 2 teams from each state's Amateur League**
- Must have qualified through Amateur League
- Promoted teams from state level

**Purpose:**
- Regional/multi-state tournament
- Interstate competition
- Regional championship title

**Use Case:**
- Interstate rivalries
- Semi-professional level play
- Higher stakes competition
- Regional champion crowned

**Statistics Shown:**
- Regional standings
- Filter by region or view all states
- **Top 4 teams highlighted in green** (promotion zone)
- Shows which state each team qualified from
- State representation tracking

**Visual Indicators:**
- 🏆 "Top teams → Professional League" badge
- Green background for qualifying teams
- Promotion pathway: DQL → Amateur → **Intermediate** → Professional

**Progression:**
- **Top teams from each region → Professional League**

---

### 5. Professional League
**Filter Type:** National (No filtering)

**Logic:**
```javascript
filterType: 'national'
options: None (shows all)
display: "🇮🇳 National Level - All India Championship"
```

**Eligibility:**
- **ONLY Top teams from Intermediate League**
- Elite teams that have progressed through entire pyramid
- Must have qualified through DQL → Amateur → Intermediate

**Purpose:**
- National championship (highest level)
- Professional-level tournament
- Crown the national champion

**Use Case:**
- Highest level of PCL competition
- Best teams from entire country
- Professional-level play
- National pride and glory

**Statistics Shown:**
- National standings (no filters needed)
- Best teams from entire country
- Shows complete journey (district → state → region → national)
- **No promotion zones** (this is the top level)

**Visual Indicators:**
- 🇮🇳 "National Level - All India Championship" badge
- Premium presentation
- Promotion pathway: DQL → Amateur → Intermediate → **Professional**

**Special Features:**
- Media coverage and broadcasting
- Sponsorship opportunities
- Prize money and awards
- National recognition
- Player scouting by professional clubs

**Progression:**
- **None** (top of the pyramid)

---

## Filter Implementation

### Frontend UI Components

**District Filter (Friendly & Tournament):**
```tsx
<select value={selectedDistrict}>
  <option value="all">All Districts</option>
  <option value="kasaragod">Kasaragod (Pilot)</option>
  <option value="kannur">Kannur</option>
  {/* All Kerala districts */}
</select>
```

**State Filter (Amateur & Intermediate):**
```tsx
<select value={selectedState}>
  <option value="all">All States</option>
  <option value="kerala">Kerala</option>
  <option value="karnataka">Karnataka</option>
  <option value="tamil-nadu">Tamil Nadu</option>
  {/* Other states */}
</select>
```

**National Display (Professional):**
```tsx
<div className="national-badge">
  🇮🇳 National Level - All India Championship
</div>
```

---

## Database Schema Requirements

### Clubs Table
```sql
CREATE TABLE clubs (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  district TEXT NOT NULL,
  state TEXT NOT NULL,
  -- other fields
);

-- Indexes for filtering
CREATE INDEX idx_clubs_district ON clubs(district);
CREATE INDEX idx_clubs_state ON clubs(state);
CREATE INDEX idx_clubs_district_state ON clubs(district, state);
```

### Tournaments Table
```sql
CREATE TABLE tournaments (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT CHECK (type IN ('friendly', 'dql', 'amateur', 'intermediate', 'professional')),
  district TEXT, -- Required for 'friendly' and 'dql'
  state TEXT,    -- Required for 'amateur' and 'intermediate'
  region TEXT,   -- Optional for 'intermediate'
  status TEXT DEFAULT 'upcoming',
  -- other fields
);

-- Indexes for filtering
CREATE INDEX idx_tournaments_type ON tournaments(type);
CREATE INDEX idx_tournaments_district ON tournaments(district);
CREATE INDEX idx_tournaments_state ON tournaments(state);
CREATE INDEX idx_tournaments_region ON tournaments(region);
```

### Matches Table
```sql
CREATE TABLE matches (
  id UUID PRIMARY KEY,
  tournament_id UUID REFERENCES tournaments(id),
  home_club_id UUID REFERENCES clubs(id),
  away_club_id UUID REFERENCES clubs(id),
  match_type TEXT CHECK (match_type IN ('friendly', 'tournament')),
  district TEXT,
  state TEXT,
  -- other fields
);

-- Indexes for filtering
CREATE INDEX idx_matches_district ON matches(district);
CREATE INDEX idx_matches_state ON matches(state);
CREATE INDEX idx_matches_type ON matches(match_type);
```

---

## API Endpoints

### Get Tournament Statistics
```typescript
GET /api/tournaments/statistics
Query Parameters:
  - level: 'friendly' | 'tournament' | 'amateur' | 'intermediate' | 'professional'
  - district?: string (for friendly & tournament)
  - state?: string (for amateur & intermediate)
  - region?: string (for intermediate)

Response:
{
  standings: Club[],
  topPlayers: Player[],
  topScorers: Player[],
  filters: {
    availableDistricts: string[],
    availableStates: string[],
    availableRegions: string[]
  }
}
```

### Get Club Standings
```typescript
GET /api/clubs/standings
Query Parameters:
  - level: 'friendly' | 'dql' | 'amateur' | 'intermediate' | 'professional'
  - district?: string
  - state?: string
  - region?: string
  - limit?: number
  - offset?: number

Response:
{
  clubs: {
    id: string,
    name: string,
    mp: number,  // matches played
    w: number,   // wins
    d: number,   // draws
    l: number,   // losses
    gf: number,  // goals for
    ga: number,  // goals against
    gd: number,  // goal difference
    pts: number  // points
  }[],
  pagination: {
    total: number,
    page: number,
    limit: number
  }
}
```

---

## Business Rules

### Match Restrictions

**Friendly Matches:**
- ✅ Any club can organize
- ✅ Can be inter-district
- ✅ Can be inter-state
- ✅ No qualification requirements
- ✅ Optional statistics tracking

**Tournament Matches (DQL):**
- 🔒 Only in approved districts (currently Kasaragod)
- ✅ Must be registered clubs in that district
- ✅ Mandatory statistics tracking
- ✅ Results affect qualification for Amateur League
- ✅ Strict scheduling and rules

**Amateur League:**
- 🔒 Only qualified teams (Top 4 from DQL)
- ✅ State-level competition
- ✅ Professional referees required
- ✅ Venue must meet standards

**Intermediate League:**
- 🔒 Only qualified teams (Top 2 from Amateur)
- ✅ Regional/multi-state
- ✅ Higher venue standards
- ✅ Media coverage

**Professional League:**
- 🔒 Only qualified teams from Intermediate
- ✅ National level
- ✅ Premium venues
- ✅ Broadcast coverage
- ✅ Prize money

---

## Expansion Roadmap

### Quarter 1: Kasaragod Pilot
- ✅ Complete DQL tournament
- ✅ Gather feedback
- ✅ Refine processes

### Quarter 2: Kerala State Expansion
- 🎯 Launch DQL in all Kerala districts
- 🎯 First Amateur League (Kerala)
- 🎯 Establish state championship

### Quarter 3: South India Expansion
- 🎯 Karnataka districts
- 🎯 Tamil Nadu districts
- 🎯 First Intermediate League (South India)

### Quarter 4: National Launch
- 🎯 Pan-India expansion
- 🎯 First Professional League
- 🎯 National Championship

---

## User Experience

### Visual Indicators

**Kasaragod (Pilot District):**
- 🎯 Green badge: "Pilot District"
- Full tournament access
- Featured in homepage

**Other Districts:**
- ⚽ Amber badge: "Friendly Matches Only"
- Limited tournament features
- "Coming Soon" messaging

**State Level:**
- 🏛️ State name displayed
- Filter by state
- State championship branding

**National Level:**
- 🇮🇳 India flag icon
- "All India Championship" label
- No filtering needed
- Premium presentation

---

## Implementation Checklist

### Frontend
- [x] Tournament Statistics component
- [x] Dynamic filtering based on level
- [x] District dropdown (14 Kerala districts)
- [x] State dropdown (multiple states)
- [x] Visual badges and indicators
- [ ] Connect to real API endpoints
- [ ] Add loading states
- [ ] Add error handling
- [ ] Add empty states

### Backend
- [ ] Create tournaments table
- [ ] Create matches table
- [ ] Add district/state columns to clubs
- [ ] Implement filtering API endpoints
- [ ] Add tournament eligibility checks
- [ ] Implement qualification logic
- [ ] Add statistics aggregation
- [ ] Set up cron jobs for standings updates

### Database
- [ ] Run CREATE_PLAYERS_TABLE.sql
- [ ] Create clubs table
- [ ] Create tournaments table
- [ ] Create matches table
- [ ] Add indexes for performance
- [ ] Set up RLS policies

### Business Logic
- [ ] Tournament registration system
- [ ] Match scheduling system
- [ ] Qualification rules engine
- [ ] Statistics calculation
- [ ] Ranking algorithm

---

## Future Enhancements

1. **Live Match Tracking**
   - Real-time score updates
   - Live standings updates
   - Push notifications

2. **Advanced Analytics**
   - Team performance trends
   - Player statistics
   - Head-to-head records

3. **Mobile App**
   - Native iOS/Android apps
   - Push notifications
   - Offline mode

4. **Social Features**
   - Match highlights
   - Fan engagement
   - Team following

5. **E-commerce**
   - Ticket sales
   - Merchandise
   - Sponsorship marketplace

---

## Support & Resources

**Documentation:** `/docs/tournaments`
**API Reference:** `/docs/api`
**Support:** support@pclchampionship.com
**Developer Portal:** https://developers.pclchampionship.com

---

*Last Updated: December 19, 2025*
*Version: 1.0.0*
