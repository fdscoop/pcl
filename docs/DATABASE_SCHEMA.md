# PCL Database Schema Documentation

## Overview

The Professional Club League (PCL) database is designed using PostgreSQL with Supabase. It supports a multi-tenant architecture for various user types and sports management functionality.

## Database Tables

### Authentication & Users

#### `users`
Core user accounts table with authentication information.

**Columns:**
- `id` (UUID, PK) - Unique user identifier
- `email` (TEXT, UNIQUE) - User email address
- `phone` (TEXT) - Phone number
- `first_name` (TEXT) - First name
- `last_name` (TEXT) - Last name
- `profile_photo_url` (TEXT) - Profile photo URL
- `bio` (TEXT) - User biography
- `role` (user_role) - User role: player, club_owner, referee, staff, stadium_owner, admin
- `kyc_status` (kyc_status) - KYC verification status: pending, verified, rejected
- `kyc_verified_at` (TIMESTAMP) - When KYC was verified
- `is_active` (BOOLEAN) - Account active status
- `last_login` (TIMESTAMP) - Last login timestamp
- `created_at` (TIMESTAMP) - Record creation time
- `updated_at` (TIMESTAMP) - Last update time
- `deleted_at` (TIMESTAMP) - Soft delete timestamp

**Indexes:**
- email (unique)
- role
- kyc_status

### Club & Team Management

#### `clubs`
Represents a club in the PCL platform.

**Columns:**
- `id` (UUID, PK)
- `owner_id` (UUID, FK) - References users table
- `club_name` (TEXT) - Official club name
- `slug` (TEXT, UNIQUE) - URL-friendly identifier
- `description` (TEXT)
- `logo_url` (TEXT)
- `registration_status` (registration_status) - registered, unregistered, pending
- `registered_at` (TIMESTAMP) - When club was registered with PCL
- `city`, `state`, `country` (TEXT) - Location details
- `founded_year` (INTEGER) - Year club was founded
- `official_website` (TEXT)
- `contact_email`, `contact_phone` (TEXT)
- `total_members` (INTEGER) - Current member count
- `is_active` (BOOLEAN)
- `created_at`, `updated_at`, `deleted_at` (TIMESTAMP)

**Rules:**
- Only registered clubs can use official club names
- Unregistered clubs cannot use existing club names

#### `teams`
Teams within a club.

**Columns:**
- `id` (UUID, PK)
- `club_id` (UUID, FK) - Parent club
- `team_name` (TEXT) - Team name
- `slug` (TEXT) - URL-friendly identifier
- `description` (TEXT)
- `logo_url` (TEXT)
- `formation` (TEXT) - Playing formation (e.g., "4-3-3")
- `total_players` (INTEGER)
- `is_active` (BOOLEAN)
- `created_at`, `updated_at`, `deleted_at` (TIMESTAMP)

**Constraint:** Unique combination of club_id and slug

### Player Management

#### `players`
Player profiles and statistics.

**Columns:**
- `id` (UUID, PK)
- `user_id` (UUID, FK, UNIQUE) - References users table (one player per user)
- `unique_player_id` (TEXT, UNIQUE) - PCL-assigned unique ID
- `jersey_number` (INTEGER)
- `position` (TEXT) - Playing position
- `height_cm` (DECIMAL)
- `weight_kg` (DECIMAL)
- `date_of_birth` (DATE)
- `nationality` (TEXT)
- `preferred_foot` (TEXT) - left, right, or both
- `current_club_id` (UUID, FK) - Current club assignment
- `is_available_for_scout` (BOOLEAN) - Available for scouting (KYC verified)
- `total_matches_played` (INTEGER)
- `total_goals_scored` (INTEGER)
- `total_assists` (INTEGER)
- `created_at`, `updated_at`, `deleted_at` (TIMESTAMP)

**Rules:**
- Only KYC verified players appear in scout list
- Players can only have one active contract per club
- KYC verification required before scouting

#### `contracts`
Player-Club employment contracts.

**Columns:**
- `id` (UUID, PK)
- `player_id` (UUID, FK)
- `club_id` (UUID, FK)
- `status` (contract_status) - active, terminated, amended, pending, rejected
- `contract_start_date` (DATE)
- `contract_end_date` (DATE)
- `salary_monthly` (DECIMAL)
- `position_assigned` (TEXT)
- `jersey_number` (INTEGER)
- `terms_conditions` (TEXT)
- `created_by` (UUID, FK) - User who created contract
- `created_at`, `updated_at` (TIMESTAMP)
- `terminated_at` (TIMESTAMP)
- `terminated_by` (UUID, FK) - User who terminated
- `termination_reason` (TEXT)
- `deleted_at` (TIMESTAMP)

**Constraints:**
- Only one active contract per player per club
- contract_end_date > contract_start_date

#### `contract_amendments`
Track changes to contracts.

**Columns:**
- `id` (UUID, PK)
- `contract_id` (UUID, FK)
- `amendment_type` (TEXT) - Type of change
- `old_value` (JSONB) - Previous value
- `new_value` (JSONB) - New value
- `reason` (TEXT)
- `created_by` (UUID, FK)
- `created_at`, `updated_at` (TIMESTAMP)

### Match Officials

#### `referees`
Referee profiles and statistics.

**Columns:**
- `id` (UUID, PK)
- `user_id` (UUID, FK, UNIQUE)
- `unique_referee_id` (TEXT, UNIQUE) - PCL-assigned ID
- `certification_level` (TEXT)
- `certified_at` (TIMESTAMP)
- `experience_years` (INTEGER)
- `total_matches_refereed` (INTEGER)
- `is_available` (BOOLEAN)
- `created_at`, `updated_at`, `deleted_at` (TIMESTAMP)

#### `staff`
Staff and volunteer profiles.

**Columns:**
- `id` (UUID, PK)
- `user_id` (UUID, FK, UNIQUE)
- `unique_staff_id` (TEXT, UNIQUE) - PCL-assigned ID
- `role_type` (TEXT) - Type of staff role
- `specialization` (TEXT)
- `experience_years` (INTEGER)
- `is_available` (BOOLEAN)
- `created_at`, `updated_at`, `deleted_at` (TIMESTAMP)

### Stadium Management

#### `stadiums`
Stadium information and details.

**Columns:**
- `id` (UUID, PK)
- `owner_id` (UUID, FK) - Stadium owner
- `stadium_name` (TEXT)
- `slug` (TEXT, UNIQUE)
- `description` (TEXT)
- `location` (TEXT) - Full address
- `city`, `state`, `country` (TEXT)
- `capacity` (INTEGER) - Stadium capacity
- `amenities` (TEXT[]) - Array of amenities
- `hourly_rate` (DECIMAL) - Booking rate per hour
- `photo_urls` (TEXT[]) - Stadium photos
- `is_active` (BOOLEAN)
- `created_at`, `updated_at`, `deleted_at` (TIMESTAMP)

#### `stadium_slots`
Booking slots and availability.

**Columns:**
- `id` (UUID, PK)
- `stadium_id` (UUID, FK)
- `slot_date` (DATE)
- `start_time` (TIME)
- `end_time` (TIME)
- `is_available` (BOOLEAN)
- `booked_by` (UUID, FK) - Club that booked
- `booking_date` (TIMESTAMP)
- `created_at`, `updated_at` (TIMESTAMP)

**Constraint:** No overlapping time slots for same stadium/date

### Tournaments & Matches

#### `tournaments`
Tournament configuration and information.

**Columns:**
- `id` (UUID, PK)
- `organizer_id` (UUID, FK)
- `tournament_name` (TEXT)
- `slug` (TEXT, UNIQUE)
- `description` (TEXT)
- `league_structure` (league_structure) - friendly, hobby, tournament, amateur, intermediate, professional
- `match_format` (match_format) - friendly, 5-a-side, 7-a-side, 11-a-side
- `start_date`, `end_date` (DATE)
- `location` (TEXT)
- `max_teams` (INTEGER)
- `entry_fee` (DECIMAL)
- `status` (TEXT) - draft, active, completed, cancelled
- `prize_pool` (TEXT)
- `rules` (TEXT)
- `created_at`, `updated_at`, `deleted_at` (TIMESTAMP)

#### `tournament_registrations`
Team registrations in tournaments.

**Columns:**
- `id` (UUID, PK)
- `tournament_id` (UUID, FK)
- `team_id` (UUID, FK)
- `registration_date` (TIMESTAMP)
- `status` (TEXT) - pending, approved, rejected
- `paid_amount` (DECIMAL)
- `payment_date` (TIMESTAMP)
- `created_at`, `updated_at` (TIMESTAMP)

**Constraint:** Unique team per tournament

#### `matches`
Individual match records.

**Columns:**
- `id` (UUID, PK)
- `tournament_id` (UUID, FK) - Nullable for friendly matches
- `home_team_id` (UUID, FK)
- `away_team_id` (UUID, FK)
- `match_format` (match_format)
- `match_date` (DATE)
- `match_time` (TIME)
- `stadium_id` (UUID, FK)
- `status` (match_status) - scheduled, ongoing, completed, cancelled
- `home_team_score`, `away_team_score` (INTEGER)
- `match_summary` (TEXT)
- `created_by` (UUID, FK)
- `created_at`, `updated_at`, `deleted_at` (TIMESTAMP)
- `started_at`, `ended_at` (TIMESTAMP)

**Constraint:** home_team_id ≠ away_team_id

#### `match_requirements`
Minimum staff/referee requirements by format.

**Columns:**
- `id` (UUID, PK)
- `match_format` (match_format, UNIQUE)
- `min_referees` (INTEGER)
- `min_staff` (INTEGER)
- `created_at`, `updated_at` (TIMESTAMP)

**Data:**
| Format | Min Referees | Min Staff |
|--------|------------|-----------|
| friendly | 1 | 1 |
| 5-a-side | 1 | 1 |
| 7-a-side | 2 | 2 |
| 11-a-side | 3 | 3 |

#### `match_assignments`
Referee and staff assignments to matches.

**Columns:**
- `id` (UUID, PK)
- `match_id` (UUID, FK)
- `referee_id` (UUID, FK) - Nullable
- `staff_id` (UUID, FK) - Nullable
- `assignment_type` (TEXT) - main_referee, assistant_referee, linesman, etc.
- `status` (TEXT) - pending, confirmed, completed
- `confirmed_at` (TIMESTAMP)
- `created_at`, `updated_at` (TIMESTAMP)

**Constraint:** At least one of referee_id or staff_id must be set

#### `match_events`
Events during a match (goals, cards, etc.).

**Columns:**
- `id` (UUID, PK)
- `match_id` (UUID, FK)
- `player_id` (UUID, FK)
- `event_type` (TEXT) - goal, card, substitution, own_goal, etc.
- `minute` (INTEGER)
- `description` (TEXT)
- `created_at` (TIMESTAMP)

### Club Interactions

#### `club_challenges`
Challenge/invitation system between clubs.

**Columns:**
- `id` (UUID, PK)
- `challenger_team_id` (UUID, FK)
- `opponent_team_id` (UUID, FK)
- `proposed_date` (DATE)
- `proposed_time` (TIME)
- `message` (TEXT)
- `status` (TEXT) - pending, accepted, rejected, completed
- `match_id` (UUID, FK) - Created match if accepted
- `created_by` (UUID, FK)
- `created_at`, `updated_at` (TIMESTAMP)
- `responded_at` (TIMESTAMP)

**Constraint:** challenger_team_id ≠ opponent_team_id

## Enums

```sql
-- User roles
CREATE TYPE user_role AS ENUM ('player', 'club_owner', 'referee', 'staff', 'stadium_owner', 'admin');

-- KYC verification status
CREATE TYPE kyc_status AS ENUM ('pending', 'verified', 'rejected');

-- Contract status
CREATE TYPE contract_status AS ENUM ('active', 'terminated', 'amended', 'pending', 'rejected');

-- Match format
CREATE TYPE match_format AS ENUM ('friendly', '5-a-side', '7-a-side', '11-a-side');

-- League structure
CREATE TYPE league_structure AS ENUM ('friendly', 'hobby', 'tournament', 'amateur', 'intermediate', 'professional');

-- Match status
CREATE TYPE match_status AS ENUM ('scheduled', 'ongoing', 'completed', 'cancelled');

-- Registration status
CREATE TYPE registration_status AS ENUM ('registered', 'unregistered', 'pending');
```

## Key Relationships

### User Hierarchies
- User (1) → (1) Player OR Club → (multiple) Teams
- User (1) → (1) Referee
- User (1) → (1) Staff
- User (1) → (multiple) Clubs (as owner)
- User (1) → (multiple) Stadiums (as owner)

### Match Management
- Tournament (1) → (multiple) Matches
- Match (1) → (multiple) match_assignments
- match_assignments (1) → (1) Referee OR Staff

### Contract Management
- Player (1) → (multiple) Contracts (one active at a time)
- Contract (1) → (multiple) Amendments

## Security Considerations

1. **Soft Deletes**: All tables use `deleted_at` for data retention
2. **Unique Constraints**: Prevent duplicate profiles and registrations
3. **Referential Integrity**: Foreign keys enforce data consistency
4. **Role-Based Access**: User roles define permissions
5. **KYC Verification**: Required for player scouting visibility
6. **Contract Constraints**: Ensures single active contract per player-club pair

## Performance Optimization

- Indexes on frequently queried columns (email, role, status fields)
- Clustered indexes on foreign keys
- UNIQUE constraints for alternative keys
- Trigger-based `updated_at` timestamps

## Future Extensions

- Player statistics aggregation tables
- Match replay/video URLs
- Player injury tracking
- Sponsorship management
- Ticket sales system
- Performance analytics
