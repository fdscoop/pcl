# PCL Documentation - Master Index

Welcome to the Professional Club League (PCL) documentation! This index will help you find the right documentation for your needs.

---

## 🔥 Getting Errors? Start Here!

**If you're seeing 400 errors or "Bucket not found" errors:**
- 👉 **[FIX_ERRORS_NOW.md](FIX_ERRORS_NOW.md)** - 3-minute setup guide
- 👉 **[QUICK_FIX_SETUP_CHECKLIST.md](QUICK_FIX_SETUP_CHECKLIST.md)** - Detailed troubleshooting

**These errors mean your Supabase database isn't set up yet. The fix takes 3 minutes.**

---

## Quick Navigation

### 🚀 Getting Started
- [SETUP_DATABASE.md](SETUP_DATABASE.md) - Initial database setup guide
- [QUICK_START_LOCATION_FIELDS.md](QUICK_START_LOCATION_FIELDS.md) - Location fields quick start

### 📖 Core Documentation
- [PCL_LEAGUE_STRUCTURE_AND_RULES.md](PCL_LEAGUE_STRUCTURE_AND_RULES.md) - **MAIN RULEBOOK**
- [IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md) - Visual implementation overview

### 📸 Features
- [SETUP_PLAYER_PHOTOS.md](SETUP_PLAYER_PHOTOS.md) - Player photo upload setup
- [PHOTO_MANDATORY_UPDATE.md](PHOTO_MANDATORY_UPDATE.md) - **Photo is now mandatory**

### ✅ KYC Verification
- [HOW_TO_START_KYC_VERIFICATION.md](HOW_TO_START_KYC_VERIFICATION.md) - **👉 Where to find KYC button**
- [KYC_QUICK_START.md](KYC_QUICK_START.md) - Quick start guide (2 minutes)
- [KYC_AADHAAR_VERIFICATION.md](KYC_AADHAAR_VERIFICATION.md) - Complete Aadhaar verification guide

### 🗄️ Database
- [CREATE_PLAYERS_TABLE.sql](CREATE_PLAYERS_TABLE.sql) - Create players table (new installations)
- [ADD_LOCATION_FIELDS_MIGRATION.sql](ADD_LOCATION_FIELDS_MIGRATION.sql) - Add location fields (existing installations)
- [ADD_PLAYER_PHOTO_FIELD.sql](ADD_PLAYER_PHOTO_FIELD.sql) - Add photo field (existing installations)
- [MAKE_PHOTO_MANDATORY_MIGRATION.sql](MAKE_PHOTO_MANDATORY_MIGRATION.sql) - Make photo mandatory (existing installations)
- [ADD_KYC_FIELDS_TO_USERS.sql](ADD_KYC_FIELDS_TO_USERS.sql) - Add Aadhaar KYC fields (existing installations)

---

## Documentation by Role

### For Developers

**Setting Up the System:**
1. [SETUP_DATABASE.md](SETUP_DATABASE.md) - Create database tables
2. [SETUP_PLAYER_PHOTOS.md](SETUP_PLAYER_PHOTOS.md) - Setup Supabase Storage
3. [QUICK_START_LOCATION_FIELDS.md](QUICK_START_LOCATION_FIELDS.md) - Understand location fields

**Understanding the Business Logic:**
1. [PCL_LEAGUE_STRUCTURE_AND_RULES.md](PCL_LEAGUE_STRUCTURE_AND_RULES.md) - Read the complete rulebook
2. [IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md) - Visual overview

**Next Features to Build:**
- KYC Verification System
- Club Registration
- Tournament Management
- Scout Search (district-based filtering)

### For Product Managers

**Understanding PCL:**
1. [IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md) - Quick visual overview
2. [PCL_LEAGUE_STRUCTURE_AND_RULES.md](PCL_LEAGUE_STRUCTURE_AND_RULES.md) - Complete system rules

**Key Sections:**
- Tournament Hierarchy (DQL → Amateur → Intermediate → Professional)
- Kasaragod Pilot Program
- Player Journey
- Expansion Roadmap

### For Business Stakeholders

**Strategic Overview:**
1. [PCL_LEAGUE_STRUCTURE_AND_RULES.md](PCL_LEAGUE_STRUCTURE_AND_RULES.md)
   - See: Overview, League Hierarchy, Kasaragod Pilot Program, Future Expansion

**Key Metrics to Track:**
- Number of registered players (target: 200-500 for Kasaragod pilot)
- Number of registered clubs (target: 8-12 for Kasaragod DQL)
- KYC verification completion rate
- Player-club contract matches
- Tournament participation rates

---

## Feature Status

### ✅ Completed Features

**Player Profile System**
- [x] Player registration with email/password
- [x] Player profile creation
- [x] Photo upload (Supabase Storage)
- [x] Location fields (address, district, state)
- [x] Profile validation
- [x] Dashboard with stats
- [x] Edit profile functionality

**Database Schema**
- [x] Players table with all fields
- [x] Location columns (address, district, state)
- [x] Database indexes for filtering
- [x] RLS policies for security
- [x] Updated_at triggers

**Documentation**
- [x] Complete rulebook (8000+ words)
- [x] Quick start guides
- [x] Database setup guides
- [x] Visual implementation summary
- [x] Master documentation index

### 🚧 In Progress

**KYC Verification**
- [ ] Document upload interface
- [ ] Admin verification dashboard
- [ ] Verification status tracking
- [ ] Automated verification (future)

**Club System**
- [ ] Club registration form
- [ ] Club profile with location
- [ ] Club owner verification
- [ ] Club dashboard

### 📋 Planned Features

**Tournament System**
- [ ] DQL tournament creation
- [ ] Tournament registration
- [ ] Eligibility validation
- [ ] Match scheduling
- [ ] Bracket/standings

**Scout/Search**
- [ ] Club scout search
- [ ] District-based filtering
- [ ] Player discovery
- [ ] Contract offers

**Match Management**
- [ ] Match scheduling
- [ ] Score tracking
- [ ] Statistics recording
- [ ] Live updates

---

## Key Concepts

### Tournament Hierarchy

```
Professional (National) ← Top teams from all states
         ↑
Intermediate (State) ← Top 2 teams per district
         ↑
Amateur (District) ← Top 4 teams from DQL
         ↑
DQL (District) ← Entry point for all clubs
```

### Player Eligibility Rules

| Tournament | District Rule | Example |
|-----------|--------------|---------|
| DQL | Must match club's district | Kasaragod player → Kasaragod club |
| Amateur | Must match club's district | Same as DQL |
| Intermediate | Must match club's state | Kasaragod player → Any Kerala club |
| Professional | No restrictions | Any player → Any club |

### Player Status Flow

```
Registration → Pending KYC → KYC Pending → Verified → Free Agent/Contracted
```

---

## File Structure

```
/Users/bineshbalan/pcl/
│
├── README_PCL_DOCUMENTATION.md (this file)
│
├── DOCUMENTATION/
│   ├── PCL_LEAGUE_STRUCTURE_AND_RULES.md (Main rulebook)
│   ├── IMPLEMENTATION_SUMMARY.md (Visual overview)
│   ├── QUICK_START_LOCATION_FIELDS.md (Location fields guide)
│   ├── SETUP_DATABASE.md (Database setup)
│   └── SETUP_PLAYER_PHOTOS.md (Photo upload setup)
│
├── DATABASE/
│   ├── CREATE_PLAYERS_TABLE.sql (New installations)
│   ├── ADD_LOCATION_FIELDS_MIGRATION.sql (Existing installations)
│   └── ADD_PLAYER_PHOTO_FIELD.sql (Add photo column)
│
└── apps/web/
    └── src/
        ├── components/
        │   ├── forms/
        │   │   └── PlayerProfileForm.tsx (Profile form)
        │   └── ui/
        │       └── image-upload.tsx (Photo upload component)
        └── app/
            ├── dashboard/player/page.tsx (Player dashboard)
            └── profile/player/complete/page.tsx (Profile completion)
```

---

## Database Tables

### Current Schema

**Players Table:**
- Identity: id, user_id, unique_player_id
- Profile: photo_url, position, jersey_number
- Physical: height_cm, weight_kg, date_of_birth, nationality, preferred_foot
- **Location: address, district, state** (NEW!)
- Club: current_club_id, is_available_for_scout
- Stats: total_matches_played, total_goals_scored, total_assists
- Timestamps: created_at, updated_at, deleted_at

**Users Table:**
- Identity: id, email, phone
- Profile: first_name, last_name, bio
- Role: role (player, club_owner, admin)
- Verification: kyc_status (pending, pending, verified, rejected)

### Planned Tables

**Clubs:**
- Club registration and profile
- Location (district, state)
- Owner reference

**Tournaments:**
- Tournament creation
- Type (dql, amateur, intermediate, professional)
- Level (district, state, national)

**Matches:**
- Match scheduling
- Score tracking
- Statistics

**Contracts:**
- Player-club agreements
- Contract terms
- Status tracking

---

## API Endpoints (Planned)

### Players
- `GET /api/players` - List players (with filters)
- `GET /api/players/:id` - Get player details
- `POST /api/players` - Create player profile
- `PATCH /api/players/:id` - Update player profile
- `GET /api/players/search` - Scout search (district filters)

### Clubs
- `GET /api/clubs` - List clubs
- `GET /api/clubs/:id` - Get club details
- `POST /api/clubs` - Register club
- `PATCH /api/clubs/:id` - Update club

### Tournaments
- `GET /api/tournaments` - List tournaments
- `GET /api/tournaments/:id` - Get tournament details
- `POST /api/tournaments` - Create tournament (admin)
- `POST /api/tournaments/:id/register` - Register club for tournament
- `GET /api/tournaments/:id/eligibility` - Check eligibility

---

## Environment Variables

Required environment variables (from `.env.local`):

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Optional: For production
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

---

## Testing Checklist

### Player Registration Flow
- [ ] Sign up with email/password
- [ ] Receive verification email
- [ ] Complete player profile
- [ ] Upload profile photo
- [ ] Fill in district/state
- [ ] Submit KYC documents
- [ ] Wait for KYC verification
- [ ] Profile becomes searchable

### Club Scout Flow
- [ ] Register as club owner
- [ ] Complete club registration
- [ ] Submit club owner KYC
- [ ] Search for players by district
- [ ] Filter by position, height, etc.
- [ ] Send contract offer
- [ ] Player accepts contract
- [ ] Register for DQL tournament

### Tournament Flow
- [ ] Admin creates Kasaragod DQL
- [ ] Club registers for tournament
- [ ] System validates eligibility
- [ ] Tournament starts
- [ ] Matches scheduled
- [ ] Scores recorded
- [ ] Standings updated
- [ ] Top 4 qualify for Amateur League

---

## Support & Contribution

### Getting Help
- Check this documentation index first
- Read the relevant guide for your task
- Review code examples in implementation files

### Reporting Issues
- Create detailed bug reports
- Include steps to reproduce
- Attach relevant error messages
- Reference documentation sections

### Contributing
- Follow existing code patterns
- Update documentation when adding features
- Add comments for complex logic
- Write tests for new features

---

## Roadmap

### Q1 2025: Kasaragod Pilot
- ✅ Player profile system
- 🚧 KYC verification
- 📋 Club registration
- 📋 DQL tournament creation
- 📋 Match scheduling
- 📋 Launch Kasaragod DQL Season 1

### Q2 2025: Kerala Expansion
- Expand to all 14 Kerala districts
- Launch Amateur League in each district
- Create Kerala Intermediate League
- Identify top teams for professional league

### Q3-Q4 2025: South India
- Expand to Tamil Nadu, Karnataka, Goa
- Launch state-level Intermediate Leagues
- Create PCL Professional League (South India)

### 2026+: All India
- Expand to all major states
- Create regional professional leagues
- Launch PCL National Championship
- Partner with AIFF for official recognition

---

## Quick Links

### Supabase Dashboard
- Project: https://supabase.com/dashboard/project/uvifkmkdoiohqrdbwgzt
- SQL Editor: https://supabase.com/dashboard/project/uvifkmkdoiohqrdbwgzt/sql
- Storage: https://supabase.com/dashboard/project/uvifkmkdoiohqrdbwgzt/storage/buckets

### Documentation
- Supabase Docs: https://supabase.com/docs
- Next.js Docs: https://nextjs.org/docs
- React Hook Form: https://react-hook-form.com
- Zod Validation: https://zod.dev

---

## Summary

**What We've Built:**
- Complete player profile system with location fields
- Photo upload functionality
- Comprehensive league structure rulebook
- Database schema with district-based filtering
- Implementation documentation

**What's Next:**
- KYC verification system
- Club registration
- Tournament management
- Scout search with district filters

**Goal:**
Launch Kasaragod DQL Season 1 with 8-12 clubs, 200-500 players, and prove the district-based tournament model works before expanding to all of Kerala and beyond.

---

**For the most comprehensive understanding of PCL, start with:**
1. [IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md) - Visual overview
2. [PCL_LEAGUE_STRUCTURE_AND_RULES.md](PCL_LEAGUE_STRUCTURE_AND_RULES.md) - Complete rulebook

**For development tasks, see:**
1. [SETUP_DATABASE.md](SETUP_DATABASE.md) - Database setup
2. [QUICK_START_LOCATION_FIELDS.md](QUICK_START_LOCATION_FIELDS.md) - Location fields guide

---

**Ready to build the future of grassroots football in India!** ⚽
