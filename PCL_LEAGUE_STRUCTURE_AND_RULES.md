# PCL League Structure & Rules

## Professional Club League (PCL) - Official Rulebook

**Version:** 1.0
**Last Updated:** December 2024
**Pilot Program:** Kasaragod District, Kerala

---

## Table of Contents

1. [Overview](#overview)
2. [League Hierarchy](#league-hierarchy)
3. [District Qualifier Level (DQL)](#district-qualifier-level-dql)
4. [Tournament Progression](#tournament-progression)
5. [Geographic Organization](#geographic-organization)
6. [Player Eligibility](#player-eligibility)
7. [Club Participation Rules](#club-participation-rules)
8. [Match Types](#match-types)
9. [Kasaragod Pilot Program](#kasaragod-pilot-program)
10. [Business Logic & Implementation](#business-logic--implementation)
11. [Future Expansion](#future-expansion)

---

## Overview

The Professional Club League (PCL) is a district-based football tournament system designed to discover and develop grassroots talent across India. The league operates on a pyramid structure, starting from district-level qualifiers and progressing to national-level professional leagues.

### Mission
- Identify talented players at the grassroots level
- Provide structured competitive opportunities
- Create a pathway from amateur to professional football
- Build a sustainable club-based football ecosystem

### Key Principles
- **District-First Approach**: All players and clubs are registered based on their district and state
- **Merit-Based Progression**: Teams advance through tournament levels based on performance
- **KYC Verification**: All participants (players and clubs) must complete KYC for competitive matches
- **Transparent Scouting**: Verified players are searchable by verified clubs

---

## League Hierarchy

PCL operates on a 4-tier tournament structure:

```
┌─────────────────────────────────────────────┐
│  PROFESSIONAL LEAGUE (National Level)       │
│  - Top teams from all states                │
│  - Professional contracts                   │
│  - National recognition                     │
└─────────────────────────────────────────────┘
                    ▲
                    │
┌─────────────────────────────────────────────┐
│  INTERMEDIATE LEAGUE (State Level)          │
│  - Top teams from district qualifiers       │
│  - State-level competition                  │
│  - Semi-professional opportunities          │
└─────────────────────────────────────────────┘
                    ▲
                    │
┌─────────────────────────────────────────────┐
│  AMATEUR LEAGUE (District Level)            │
│  - DQL qualified teams                      │
│  - District champions                       │
│  - Competitive amateur football             │
└─────────────────────────────────────────────┘
                    ▲
                    │
┌─────────────────────────────────────────────┐
│  DISTRICT QUALIFIER LEVEL (DQL)             │
│  - Entry point for all teams                │
│  - Open to all clubs in the district        │
│  - Grassroots talent discovery              │
└─────────────────────────────────────────────┘
```

---

## District Qualifier Level (DQL)

### Purpose
The DQL is the foundation of PCL's tournament structure. It serves as the entry point for all clubs and the primary talent discovery mechanism.

### DQL Structure

**Format**: District-based knockout/league tournament
**Participants**: All registered clubs within a district
**Duration**: 2-3 months per season
**Seasons**: 2 seasons per year (potential)

### DQL Qualification Process

1. **Club Registration**
   - Club must be registered in PCL system
   - Club owner must complete KYC verification
   - Club must have minimum 11 registered players
   - All players must be from the same district

2. **Player Registration**
   - Players must complete profile with district/state information
   - Players must complete KYC verification (for competitive matches)
   - Players can only represent clubs from their registered district

3. **Tournament Entry**
   - Clubs register for DQL tournaments in their district
   - Entry fee: TBD (affordable grassroots level)
   - Registration deadline: 2 weeks before tournament start

### DQL Match Rules

- **Match Duration**: 90 minutes (2 x 45-minute halves)
- **Substitutions**: 5 substitutions allowed
- **Squad Size**: 18 players maximum per match
- **Minimum Players**: 7 players minimum to start a match
- **Referee**: Certified district-level referee
- **Yellow Cards**: 2 yellow cards = 1 match suspension
- **Red Card**: Automatic 1-3 match suspension (based on severity)

### DQL Advancement

- **Top 4 teams** from each district DQL qualify for **Amateur League (District Level)**
- **Top 2 teams** from Amateur League qualify for **Intermediate League (State Level)**

---

## Tournament Progression

### Level 1: District Qualifier Level (DQL)
- **Geographic Scope**: Single district
- **Player Eligibility**: Players registered in that district
- **Club Eligibility**: Clubs registered in that district
- **Tournament Type**: Open entry
- **Prize**: Qualification to Amateur League
- **Status**: Amateur

### Level 2: Amateur League (District Level)
- **Geographic Scope**: Single district
- **Player Eligibility**: Players from the district
- **Club Eligibility**: DQL qualified clubs
- **Tournament Type**: Top 4 from DQL
- **Prize**: District championship + qualification to Intermediate League
- **Status**: Amateur/Semi-professional

### Level 3: Intermediate League (State Level)
- **Geographic Scope**: Entire state
- **Player Eligibility**: Players from the state
- **Club Eligibility**: Amateur League qualified clubs (top 2 per district)
- **Tournament Type**: State championship
- **Prize**: State championship + qualification to Professional League
- **Status**: Semi-professional

### Level 4: Professional League (National Level)
- **Geographic Scope**: All India
- **Player Eligibility**: Any player from any state
- **Club Eligibility**: Intermediate League qualified clubs
- **Tournament Type**: National championship
- **Prize**: National championship title
- **Status**: Professional

---

## Geographic Organization

### District-Based Registration

All players and clubs are registered based on their geographic location:

**Player Registration Requirements:**
- Full address (House/Flat No., Street, Area)
- District (e.g., Kasaragod)
- State (e.g., Kerala)

**Why District Registration Matters:**
- Determines DQL tournament eligibility
- Prevents "super teams" from recruiting across districts at grassroots level
- Ensures local talent development
- Creates community-based football culture

### District Boundaries

**Valid Districts (Kerala - Pilot State):**
- Kasaragod (Pilot District)
- Kannur
- Wayanad
- Kozhikode
- Malappuram
- Palakkad
- Thrissur
- Ernakulam
- Idukki
- Kottayam
- Alappuzha
- Pathanamthitta
- Kollam
- Thiruvananthapuram

**Expansion States:**
- Tamil Nadu (Phase 2)
- Karnataka (Phase 2)
- Goa (Phase 2)
- Maharashtra (Phase 3)
- Additional states (Phase 4+)

---

## Player Eligibility

### Profile Requirements

**Mandatory Fields:**
- First Name, Last Name
- Email (verified)
- Phone Number (verified)
- Date of Birth
- Nationality
- Address (full)
- District (mandatory for DQL participation)
- State (mandatory for state/national level)
- Playing Position
- Height, Weight
- Preferred Foot
- **Profile Photo (MANDATORY - required for player identification and verification)**

**KYC Requirements:**
- Government ID proof (Aadhaar, PAN, Driving License, etc.)
- Address proof (matching district registration)
- Date of birth proof
- Photo verification

### Player Status Levels

```typescript
type PlayerStatus =
  | 'pending_kyc'           // Profile created, KYC not submitted
  | 'kyc_pending'           // KYC submitted, under review
  | 'verified'              // KYC approved, can play competitive matches
  | 'free_agent'            // Not contracted to any club
  | 'contracted'            // Contracted to a club
  | 'on_loan'               // Loaned to another club
  | 'injured'               // Injured, unavailable for selection
  | 'suspended'             // Suspended due to disciplinary action
  | 'retired'               // Retired from competitive football
```

### District-Based Eligibility Rules

**DQL & Amateur League (District Level):**
- Players MUST be registered in the same district as their club
- Players can only play for ONE club per season
- Cross-district transfers NOT allowed at this level
- Example: A player from Kasaragod can only play for Kasaragod-based clubs in DQL

**Intermediate League (State Level):**
- Players MUST be registered in the same state as their club
- Cross-district transfers allowed within the state
- One-time district transfer allowed per season (with 15-day waiting period)
- Example: A Kasaragod player can transfer to a Kottayam club (both Kerala)

**Professional League (National Level):**
- Players can represent any club from any state
- Full transfer market opens
- Standard transfer windows apply (pre-season and mid-season)
- International players allowed (subject to AIFF regulations)

---

## Club Participation Rules

### Club Registration Requirements

**Mandatory Information:**
- Club Name
- Club Logo
- Club Owner (verified user)
- Club Address
- District
- State
- Home Ground Details
- Primary Contact

**KYC Requirements (Club Owner):**
- Government ID proof
- Business registration (optional for grassroots clubs)
- Address proof
- Club constitution/bylaws (for higher levels)

### Club Eligibility by Tournament Level

**DQL Eligibility:**
- Club registered in the district
- Minimum 11 verified players from the same district
- Club owner KYC verified
- Home ground identified

**Amateur League Eligibility:**
- Qualified through DQL (Top 4)
- All DQL eligibility requirements maintained
- Updated player roster (transfers allowed between DQL and Amateur League)

**Intermediate League Eligibility:**
- Qualified through Amateur League (Top 2)
- Minimum 15 verified players from the state
- Club owner KYC verified
- Certified home ground

**Professional League Eligibility:**
- Qualified through Intermediate League
- Minimum 20 verified players
- Professional club infrastructure
- AIFF affiliation (optional initially, mandatory later)

### Match Organization by Clubs

Clubs can organize **friendly matches** with clubs from other districts without PCL involvement:

**Friendly Match Rules:**
- Both clubs must agree on match details
- Matches don't count toward DQL/league standings
- PCL system can be used to track stats (optional)
- No KYC verification required for friendly matches
- Clubs can invite players from any district (not bound by district rules)

**Competitive vs. Friendly:**
- **Competitive Matches**: DQL, Amateur, Intermediate, Professional League matches
  - KYC mandatory
  - District eligibility rules apply
  - Results count toward standings
  - Official referees required

- **Friendly Matches**: Pre-season, mid-season, practice matches
  - KYC optional
  - No district restrictions
  - Results don't affect league standings
  - Self-organized by clubs

---

## Match Types

### 1. DQL Matches
- **Type**: Competitive
- **KYC**: Required for all players
- **District Rule**: Strict (players must be from the district)
- **Recorded**: Yes (stats tracked)
- **Official**: Yes (PCL referees)

### 2. Amateur League Matches
- **Type**: Competitive
- **KYC**: Required for all players
- **District Rule**: Strict (players must be from the district)
- **Recorded**: Yes (stats tracked)
- **Official**: Yes (PCL referees)

### 3. Intermediate League Matches
- **Type**: Competitive
- **KYC**: Required for all players
- **District Rule**: Relaxed (state-level eligibility)
- **Recorded**: Yes (stats tracked)
- **Official**: Yes (PCL referees)

### 4. Professional League Matches
- **Type**: Competitive
- **KYC**: Required for all players
- **District Rule**: None (national-level)
- **Recorded**: Yes (stats tracked)
- **Official**: Yes (PCL/AIFF referees)

### 5. Friendly Matches
- **Type**: Non-competitive
- **KYC**: Optional
- **District Rule**: None
- **Recorded**: Optional
- **Official**: No (clubs arrange own referees)

---

## Kasaragod Pilot Program

### Why Kasaragod?

Kasaragod district in Kerala has been selected as the pilot location for PCL's launch due to:
- Strong grassroots football culture
- Manageable district size for pilot testing
- Active local football community
- Strategic location (border district - can expand to Karnataka)

### Pilot Program Timeline

**Phase 1: Kasaragod Launch (3-6 months)**
- Launch PCL platform in Kasaragod
- Register 10-20 clubs
- Register 200-500 players
- Conduct first DQL tournament
- Crown first district champions

**Phase 2: Kerala Expansion (6-12 months)**
- Expand to all 14 Kerala districts
- Launch Amateur League in each district
- Conduct first Intermediate League (Kerala State)
- Identify top teams for professional league

**Phase 3: South India Expansion (12-18 months)**
- Expand to Tamil Nadu, Karnataka, Goa
- Launch DQL in major districts
- Create state-level Intermediate Leagues
- Launch PCL Professional League (South India)

**Phase 4: All India Expansion (18+ months)**
- Expand to all major states
- Create regional professional leagues
- Launch PCL National Championship

### Kasaragod DQL Structure (Pilot)

**Season 1 Plan:**
- **Timeline**: 8 weeks
- **Format**: Round-robin followed by knockout
- **Teams**: 8-12 clubs
- **Matches**: 2 matches per week
- **Venues**: Rotate between club home grounds
- **Prize**: District Championship Trophy + Qualification to Kerala Amateur League

**Example Schedule:**
- Week 1-4: Round-robin (all teams play each other once)
- Week 5: Quarter-finals (if more than 8 teams)
- Week 6: Semi-finals
- Week 7: Third place match + Final
- Week 8: Awards ceremony + Amateur League draw

---

## Business Logic & Implementation

### Database Schema for Geographic Organization

**Players Table:**
```sql
-- Location fields for district-based tournament system
address TEXT,
district TEXT,
state TEXT,

-- Indexes for efficient filtering
CREATE INDEX idx_players_district ON players(district);
CREATE INDEX idx_players_state ON players(state);
CREATE INDEX idx_players_district_state ON players(district, state);
```

**Clubs Table:**
```sql
-- Geographic registration
address TEXT,
district TEXT NOT NULL,
state TEXT NOT NULL,
home_ground_address TEXT,

-- Indexes
CREATE INDEX idx_clubs_district ON clubs(district);
CREATE INDEX idx_clubs_state ON clubs(state);
```

**Tournaments Table:**
```sql
-- Tournament hierarchy
id UUID PRIMARY KEY,
name TEXT NOT NULL,
tournament_type TEXT CHECK (tournament_type IN ('dql', 'amateur', 'intermediate', 'professional')),
tournament_level TEXT CHECK (tournament_level IN ('district', 'state', 'national')),
district TEXT,  -- NULL for state/national tournaments
state TEXT,     -- NULL for national tournaments
season TEXT,
status TEXT CHECK (status IN ('upcoming', 'ongoing', 'completed', 'cancelled')),
start_date DATE,
end_date DATE,
max_teams INTEGER,
entry_fee DECIMAL(10, 2),
```

### Player Eligibility Validation Logic

```typescript
// Validate player eligibility for a tournament
function validatePlayerEligibility(
  player: Player,
  club: Club,
  tournament: Tournament
): boolean {
  // 1. KYC must be verified for competitive matches
  if (tournament.tournament_type !== 'friendly' && player.kyc_status !== 'verified') {
    return false
  }

  // 2. District-level tournaments (DQL, Amateur League)
  if (tournament.tournament_level === 'district') {
    // Player's district must match tournament's district
    if (player.district !== tournament.district) {
      return false
    }
    // Player's district must match club's district
    if (player.district !== club.district) {
      return false
    }
  }

  // 3. State-level tournaments (Intermediate League)
  if (tournament.tournament_level === 'state') {
    // Player's state must match tournament's state
    if (player.state !== tournament.state) {
      return false
    }
    // Player's state must match club's state
    if (player.state !== club.state) {
      return false
    }
  }

  // 4. National-level tournaments (Professional League)
  // No geographic restrictions

  // 5. Player must not be suspended
  if (player.status === 'suspended') {
    return false
  }

  // 6. Player must not be contracted to another club
  if (player.current_club_id && player.current_club_id !== club.id) {
    return false
  }

  return true
}
```

### Club Scout Search Logic

```typescript
// Search for players as a club owner
function searchPlayers(filters: {
  district?: string
  state?: string
  position?: string
  minHeight?: number
  maxHeight?: number
  ageRange?: [number, number]
  isAvailableForScout?: boolean
}): Player[] {
  let query = supabase
    .from('players')
    .select('*, users!inner(*)')

  // Only show verified players who are available for scouting
  query = query.eq('is_available_for_scout', true)
  query = query.eq('users.kyc_status', 'verified')

  // Filter by district (for DQL scouting)
  if (filters.district) {
    query = query.eq('district', filters.district)
  }

  // Filter by state (for state-level scouting)
  if (filters.state) {
    query = query.eq('state', filters.state)
  }

  // Other filters
  if (filters.position) {
    query = query.eq('position', filters.position)
  }

  return query
}
```

### Tournament Registration Validation

```typescript
// Validate club registration for a tournament
function validateClubTournamentRegistration(
  club: Club,
  tournament: Tournament
): { eligible: boolean; reason?: string } {
  // 1. Club owner must be KYC verified
  if (club.owner.kyc_status !== 'verified') {
    return { eligible: false, reason: 'Club owner KYC not verified' }
  }

  // 2. District-level tournaments
  if (tournament.tournament_level === 'district') {
    // Club must be from the tournament's district
    if (club.district !== tournament.district) {
      return { eligible: false, reason: `Club must be from ${tournament.district} district` }
    }

    // Must have at least 11 verified players from the district
    const eligiblePlayers = club.players.filter(p =>
      p.kyc_status === 'verified' &&
      p.district === tournament.district
    )

    if (eligiblePlayers.length < 11) {
      return {
        eligible: false,
        reason: `Need at least 11 verified players from ${tournament.district}. Currently have ${eligiblePlayers.length}`
      }
    }
  }

  // 3. State-level tournaments
  if (tournament.tournament_level === 'state') {
    // Club must be from the tournament's state
    if (club.state !== tournament.state) {
      return { eligible: false, reason: `Club must be from ${tournament.state} state` }
    }

    // Must have at least 15 verified players from the state
    const eligiblePlayers = club.players.filter(p =>
      p.kyc_status === 'verified' &&
      p.state === tournament.state
    )

    if (eligiblePlayers.length < 15) {
      return {
        eligible: false,
        reason: `Need at least 15 verified players from ${tournament.state}. Currently have ${eligiblePlayers.length}`
      }
    }
  }

  // 4. For qualification-based tournaments, check if club qualified
  if (tournament.requires_qualification) {
    const hasQualified = checkClubQualification(club.id, tournament.id)
    if (!hasQualified) {
      return { eligible: false, reason: 'Club has not qualified for this tournament' }
    }
  }

  return { eligible: true }
}
```

---

## Future Expansion

### Year 1: Kerala Foundation
- Launch Kasaragod pilot
- Expand to all Kerala districts
- Establish DQL in each district
- Launch Kerala Amateur League
- Crown first Kerala State Champions

### Year 2: South India Network
- Expand to Tamil Nadu (10 major districts)
- Expand to Karnataka (8 major districts)
- Expand to Goa (2 districts)
- Launch state-level Intermediate Leagues
- Launch PCL South India Professional League

### Year 3: Multi-Regional Expansion
- Expand to Maharashtra, Telangana, Andhra Pradesh
- Create regional professional leagues (South, West, Central)
- Launch PCL National Championship (top teams from each region)
- Partner with AIFF for sanctioning

### Year 4-5: All India Coverage
- Expand to North India (Punjab, Haryana, Delhi, UP)
- Expand to East India (West Bengal, Odisha, Jharkhand)
- Expand to Northeast (Manipur, Mizoram, Meghalaya)
- Create comprehensive national pyramid
- Establish promotion/relegation system

### Long-term Vision (5+ years)
- 500+ districts covered
- 50,000+ registered players
- 5,000+ registered clubs
- Regional professional leagues with 100+ teams
- National championship with promotion/relegation
- PCL as recognized pathway to Indian national team
- International club friendlies and tournaments

---

## Appendix: Quick Reference

### Tournament Levels Summary

| Level | Type | Scope | Player District Rule | Min Players | KYC Required |
|-------|------|-------|---------------------|-------------|--------------|
| DQL | Entry | District | Strict (same district) | 11 | Yes |
| Amateur | Championship | District | Strict (same district) | 11 | Yes |
| Intermediate | Championship | State | Relaxed (same state) | 15 | Yes |
| Professional | Championship | National | None | 20 | Yes |
| Friendly | Practice | Any | None | 7 | No |

### Player Status Flow

```
Registration → Pending KYC → KYC Pending → Verified → Free Agent/Contracted
                                               ↓
                                          On Loan / Injured / Suspended
```

### Geographic Hierarchy

```
National (All India)
    ↓
State (e.g., Kerala, Tamil Nadu)
    ↓
District (e.g., Kasaragod, Kannur)
    ↓
Club (registered in specific district)
    ↓
Player (registered in specific district)
```

---

**End of Rulebook v1.0**

For questions, clarifications, or rule amendments, contact PCL Administration.
