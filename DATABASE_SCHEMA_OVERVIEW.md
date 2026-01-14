# Database Schema Overview - Professional Club League

## Project Info
- **Linked Supabase Project**: `uvifkmkdoiohqrdbwgzt`
- **Total Migrations**: 21
- **Last Updated**: Migration 021 (Club Owner Payment Update Policy)

---

## Enums (Data Types)

### user_role
```
'player', 'club_owner', 'referee', 'staff', 'stadium_owner', 'admin'
```

### kyc_status
```
'pending', 'verified', 'rejected'
```

### contract_status
```
'active', 'terminated', 'amended', 'pending', 'rejected'
```

### match_format
```
'friendly', '5-a-side', '7-a-side', '11-a-side'
```

### league_structure
```
'friendly', 'hobby', 'tournament', 'amateur', 'intermediate', 'professional'
```

### match_status
```
'scheduled', 'ongoing', 'completed', 'cancelled'
```

### registration_status
```
'registered', 'unregistered', 'pending'
```

---

## Core Tables

### 1. **users**
User accounts for all roles in the platform.

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK, DEFAULT uuid_generate_v4() |
| email | TEXT | UNIQUE, NOT NULL |
| phone | TEXT | |
| first_name | TEXT | NOT NULL |
| last_name | TEXT | NOT NULL |
| profile_photo_url | TEXT | |
| bio | TEXT | |
| role | user_role | NOT NULL |
| kyc_status | kyc_status | DEFAULT 'pending' |
| kyc_verified_at | TIMESTAMP | |
| country | TEXT | |
| state | TEXT | |
| city | TEXT | |
| is_active | BOOLEAN | DEFAULT true |
| last_login | TIMESTAMP | |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP |
| deleted_at | TIMESTAMP | |

---

### 2. **clubs**
Sports clubs managed by club owners.

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK, DEFAULT uuid_generate_v4() |
| owner_id | UUID | FK → users(id) |
| club_name | TEXT | NOT NULL |
| slug | TEXT | UNIQUE NOT NULL |
| description | TEXT | |
| logo_url | TEXT | |
| banner_url | TEXT | |
| registration_status | registration_status | DEFAULT 'unregistered' |
| registered_at | TIMESTAMP | |
| city | TEXT | |
| district | TEXT | |
| state | TEXT | |
| country | TEXT | |
| founded_year | INTEGER | CHECK (founded_year > 1800) |
| official_website | TEXT | |
| contact_email | TEXT | |
| contact_phone | TEXT | |
| total_members | INTEGER | DEFAULT 0 |
| kyc_status | kyc_status | DEFAULT 'pending' |
| kyc_verified_at | TIMESTAMP | |
| is_active | BOOLEAN | DEFAULT true |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP |
| deleted_at | TIMESTAMP | |

---

### 3. **teams**
Teams within a club (one club can have multiple teams).

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK, DEFAULT uuid_generate_v4() |
| club_id | UUID | FK → clubs(id) |
| team_name | TEXT | NOT NULL |
| slug | TEXT | NOT NULL |
| description | TEXT | |
| logo_url | TEXT | |
| format | match_format | DEFAULT '11-a-side' |
| formation | TEXT | DEFAULT '4-3-3' |
| formation_data | JSONB | |
| total_players | INTEGER | DEFAULT 0 |
| last_lineup_updated | TIMESTAMP | |
| is_active | BOOLEAN | DEFAULT true |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP |
| deleted_at | TIMESTAMP | |
| **UNIQUE** | (club_id, slug) | |

---

### 4. **players**
Player profiles linked to user accounts.

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK, DEFAULT uuid_generate_v4() |
| user_id | UUID | FK → users(id) |
| unique_player_id | TEXT | UNIQUE NOT NULL |
| jersey_number | INTEGER | |
| position | TEXT | |
| height_cm | DECIMAL(5,2) | |
| weight_kg | DECIMAL(6,2) | |
| date_of_birth | DATE | |
| nationality | TEXT | |
| preferred_foot | TEXT | CHECK ('left', 'right', 'both') |
| photo_url | TEXT | |
| current_club_id | UUID | FK → clubs(id) |
| is_available_for_scout | BOOLEAN | DEFAULT false |
| total_matches_played | INTEGER | DEFAULT 0 |
| total_goals_scored | INTEGER | DEFAULT 0 |
| total_assists | INTEGER | DEFAULT 0 |
| rating | DECIMAL(3,2) | |
| triblings | INTEGER | DEFAULT 0 |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP |
| deleted_at | TIMESTAMP | |

---

### 5. **contracts**
Player contracts with clubs.

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK, DEFAULT uuid_generate_v4() |
| player_id | UUID | FK → players(id) |
| club_id | UUID | FK → clubs(id) |
| status | contract_status | DEFAULT 'pending' |
| contract_type | TEXT | CHECK ('permanent', 'loan', 'trial', 'seasonal') |
| contract_start_date | DATE | NOT NULL |
| contract_end_date | DATE | NOT NULL |
| salary_monthly | DECIMAL(12,2) | |
| annual_salary | DECIMAL(12,2) | |
| signing_bonus | DECIMAL(12,2) | |
| release_clause | DECIMAL(12,2) | |
| goal_bonus | DECIMAL(12,2) | |
| appearance_bonus | DECIMAL(12,2) | |
| medical_insurance | DECIMAL(12,2) | |
| housing_allowance | DECIMAL(12,2) | |
| position_assigned | TEXT | |
| jersey_number | INTEGER | |
| notice_period | INTEGER | |
| training_days_per_week | INTEGER | |
| terms_conditions | TEXT | |
| image_rights | TEXT | |
| agent_name | TEXT | |
| agent_contact | TEXT | |
| created_by | UUID | FK → users(id) |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP |
| terminated_at | TIMESTAMP | |
| terminated_by | UUID | FK → users(id) |
| termination_reason | TEXT | |
| deleted_at | TIMESTAMP | |
| read_status | BOOLEAN | DEFAULT false |
| read_at | TIMESTAMP | |
| read_by_player | BOOLEAN | DEFAULT false |
| read_by_club | BOOLEAN | DEFAULT false |
| signed_at | TIMESTAMP | |
| signature_image_url | TEXT | |
| signed_by | UUID | FK → users(id) |
| contract_document_url | TEXT | |
| html_content | TEXT | |
| **UNIQUE** | (player_id, club_id, status) WHERE status = 'active' | |

---

### 6. **contract_amendments**
Track changes to contracts.

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK, DEFAULT uuid_generate_v4() |
| contract_id | UUID | FK → contracts(id) |
| amendment_type | TEXT | NOT NULL |
| old_value | JSONB | |
| new_value | JSONB | |
| reason | TEXT | |
| created_by | UUID | FK → users(id) |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP |

---

### 7. **team_squads**
Maps players to teams with jersey numbers.

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK, DEFAULT uuid_generate_v4() |
| team_id | UUID | FK → teams(id) |
| player_id | UUID | FK → players(id) |
| jersey_number | INTEGER | CHECK (0-99) |
| position | TEXT | |
| is_available | BOOLEAN | DEFAULT true |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP |

---

### 8. **referees**
Referee profiles and certifications.

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK, DEFAULT uuid_generate_v4() |
| user_id | UUID | FK → users(id) |
| unique_referee_id | TEXT | UNIQUE NOT NULL |
| certification_level | TEXT | |
| certified_at | TIMESTAMP | |
| experience_years | INTEGER | DEFAULT 0 |
| total_matches_refereed | INTEGER | DEFAULT 0 |
| is_available | BOOLEAN | DEFAULT true |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP |
| deleted_at | TIMESTAMP | |

---

### 9. **staff**
Staff members (coaches, physiotherapists, etc.).

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK, DEFAULT uuid_generate_v4() |
| user_id | UUID | FK → users(id) |
| unique_staff_id | TEXT | UNIQUE NOT NULL |
| club_id | UUID | FK → clubs(id) |
| staff_role | TEXT | NOT NULL |
| department | TEXT | |
| experience_years | INTEGER | DEFAULT 0 |
| is_available | BOOLEAN | DEFAULT true |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP |
| deleted_at | TIMESTAMP | |

---

### 10. **stadiums**
Stadiums available for matches.

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK, DEFAULT uuid_generate_v4() |
| owner_id | UUID | FK → users(id) |
| stadium_name | TEXT | NOT NULL |
| slug | TEXT | UNIQUE NOT NULL |
| description | TEXT | |
| city | TEXT | NOT NULL |
| district | TEXT | |
| state | TEXT | NOT NULL |
| country | TEXT | DEFAULT 'India' |
| latitude | DECIMAL(10,8) | |
| longitude | DECIMAL(11,8) | |
| capacity | INTEGER | |
| surface_type | TEXT | |
| contact_email | TEXT | |
| contact_phone | TEXT | |
| registration_status | registration_status | DEFAULT 'unregistered' |
| kyc_status | kyc_status | DEFAULT 'pending' |
| kyc_verified_at | TIMESTAMP | |
| is_active | BOOLEAN | DEFAULT true |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP |
| deleted_at | TIMESTAMP | |

---

### 11. **matches**
Scheduled matches between clubs.

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK, DEFAULT uuid_generate_v4() |
| home_club_id | UUID | FK → clubs(id) |
| away_club_id | UUID | FK → clubs(id) |
| stadium_id | UUID | FK → stadiums(id) |
| match_date | TIMESTAMP | NOT NULL |
| status | match_status | DEFAULT 'scheduled' |
| format | match_format | NOT NULL |
| league_structure | league_structure | |
| home_score | INTEGER | |
| away_score | INTEGER | |
| tournament_id | UUID | FK → tournaments(id) |
| match_type | TEXT | |
| is_friendly | BOOLEAN | |
| is_paid | BOOLEAN | DEFAULT false |
| cancelled_reason | TEXT | |
| cancelled_at | TIMESTAMP | |
| cancelled_by | UUID | FK → users(id) |
| created_by | UUID | FK → users(id) |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP |

---

### 12. **team_lineups**
Playing XI declaration for matches.

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK, DEFAULT uuid_generate_v4() |
| match_id | UUID | FK → matches(id) |
| team_id | UUID | FK → teams(id) |
| lineup_data | JSONB | |
| formation | TEXT | |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP |

---

### 13. **match_assignments**
Assigns referees and staff to matches.

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK, DEFAULT uuid_generate_v4() |
| match_id | UUID | FK → matches(id) |
| referee_id | UUID | FK → referees(id) |
| staff_id | UUID | FK → staff(id) |
| role | TEXT | |
| confirmed | BOOLEAN | DEFAULT false |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP |

---

### 14. **match_events**
Track events during match (goals, cards, substitutions, etc.).

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK, DEFAULT uuid_generate_v4() |
| match_id | UUID | FK → matches(id) |
| event_type | TEXT | NOT NULL |
| player_id | UUID | FK → players(id) |
| minute | INTEGER | |
| description | TEXT | |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP |

---

### 15. **tournaments**
Tournament competitions.

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK, DEFAULT uuid_generate_v4() |
| tournament_name | TEXT | NOT NULL |
| slug | TEXT | UNIQUE NOT NULL |
| description | TEXT | |
| format | match_format | |
| league_structure | league_structure | |
| start_date | DATE | |
| end_date | DATE | |
| created_by | UUID | FK → users(id) |
| is_active | BOOLEAN | DEFAULT true |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP |

---

### 16. **tournament_registrations**
Clubs registering for tournaments.

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK, DEFAULT uuid_generate_v4() |
| tournament_id | UUID | FK → tournaments(id) |
| club_id | UUID | FK → clubs(id) |
| registration_date | TIMESTAMP | |
| status | registration_status | DEFAULT 'pending' |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP |

---

### 17. **stadium_slots**
Available booking slots for stadiums.

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK, DEFAULT uuid_generate_v4() |
| stadium_id | UUID | FK → stadiums(id) |
| slot_date | DATE | NOT NULL |
| start_time | TIME | NOT NULL |
| end_time | TIME | NOT NULL |
| is_available | BOOLEAN | DEFAULT true |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP |

---

### 18. **match_requirements**
Minimum personnel requirements for each match format.

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK, DEFAULT uuid_generate_v4() |
| match_format | match_format | NOT NULL |
| min_referees | INTEGER | |
| min_staff | INTEGER | |

---

### 19. **notifications**
Notifications for users (contract signing, match updates, etc.).

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK, DEFAULT uuid_generate_v4() |
| club_id | UUID | FK → clubs(id) |
| player_id | UUID | FK → players(id) |
| user_id | UUID | FK → users(id) |
| notification_type | TEXT | NOT NULL |
| title | TEXT | NOT NULL |
| message | TEXT | NOT NULL |
| contract_id | UUID | FK → contracts(id) |
| related_user_id | UUID | FK → users(id) |
| is_read | BOOLEAN | DEFAULT false |
| read_at | TIMESTAMP | |
| read_by_club | BOOLEAN | DEFAULT false |
| read_by_player | BOOLEAN | DEFAULT false |
| action_url | TEXT | |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP |

---

### 20. **notification_tokens**
FCM/Push notification tokens for mobile devices.

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK, DEFAULT uuid_generate_v4() |
| user_id | UUID | FK → users(id) |
| token | TEXT | NOT NULL |
| device_type | TEXT | |
| is_active | BOOLEAN | DEFAULT true |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP |

---

### 21. **club_challenges** (if exists)
Club-specific challenges or competitions.

---

## Key Features

✅ **Multi-role support**: player, club_owner, referee, staff, stadium_owner, admin
✅ **KYC verification**: For users, clubs, and stadiums
✅ **Contract management**: Full lifecycle with amendments and signatures
✅ **Match scheduling**: Multiple formats (5, 7, 11-a-side, friendly)
✅ **Team management**: Multiple teams per club with formations
✅ **Notifications**: Real-time updates via push notifications
✅ **Stadium booking**: Slot management and availability
✅ **Tournament support**: Multi-format tournaments with registrations

---

## Recent Migrations

- **021**: Club Owner Payment Update Policy
- **020**: Stadium ID to Payments
- **019**: Lineup Data Column
- **018**: Match Cancellation Fields
- **017**: Notification Role Fields
- **016**: Notification Tokens Table

---

## Next Steps

⚠️ **Migration History Issue**: There's a mismatch between local migrations and remote database.

To fix:
```bash
supabase migration repair --status applied 001
supabase migration repair --status applied 002
# ... (repeat for each migration)
```

Or push your local migrations:
```bash
supabase db push
```
