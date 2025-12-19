# PCL API Specification

## Overview

The PCL API is built using Next.js API Routes and Supabase. All endpoints are RESTful and return JSON responses.

## Base URL

```
Development: http://localhost:3000/api
Production: https://pcl.vercel.app/api
```

## Authentication

All endpoints (except public routes) require authentication via JWT token in cookies (managed by Supabase Auth).

### Headers
```
Content-Type: application/json
```

### Response Codes
- `200 OK` - Request successful
- `201 Created` - Resource created
- `400 Bad Request` - Invalid request
- `401 Unauthorized` - Not authenticated
- `403 Forbidden` - Not authorized
- `404 Not Found` - Resource not found
- `409 Conflict` - Resource already exists
- `500 Internal Server Error` - Server error

---

## Endpoints

### Authentication

#### POST /api/auth/signup
Register a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!",
  "first_name": "John",
  "last_name": "Doe",
  "role": "player"
}
```

**Response:**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "user_metadata": {
      "first_name": "John",
      "last_name": "Doe"
    }
  },
  "session": {
    "access_token": "jwt_token",
    "refresh_token": "refresh_token"
  }
}
```

---

#### POST /api/auth/login
Authenticate user and get session.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}
```

**Response:**
```json
{
  "user": { /* user object */ },
  "session": { /* session object */ }
}
```

---

#### POST /api/auth/logout
Logout current user (destroys session).

**Response:**
```json
{
  "message": "Logged out successfully"
}
```

---

#### GET /api/auth/user
Get current authenticated user.

**Response:**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "user_metadata": { /* metadata */ }
  }
}
```

---

### Users & Profiles

#### GET /api/user
Get current user profile.

**Response:**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "phone": "+1234567890",
  "first_name": "John",
  "last_name": "Doe",
  "role": "player",
  "kyc_status": "pending",
  "profile_photo_url": "https://...",
  "is_active": true,
  "created_at": "2024-01-01T00:00:00Z"
}
```

---

#### PUT /api/user
Update user profile.

**Request Body:**
```json
{
  "phone": "+1234567890",
  "first_name": "John",
  "last_name": "Doe",
  "bio": "Professional player"
}
```

---

#### POST /api/user/kyc
Submit KYC verification.

**Request Body:**
```json
{
  "document_type": "passport",
  "document_number": "ABC123456",
  "date_of_birth": "1990-01-15",
  "nationality": "India"
}
```

---

### Players

#### POST /api/players
Create player profile.

**Request Body:**
```json
{
  "position": "Forward",
  "jersey_number": 10,
  "height_cm": 180,
  "weight_kg": 75,
  "preferred_foot": "right",
  "nationality": "India"
}
```

**Response:**
```json
{
  "id": "uuid",
  "user_id": "uuid",
  "unique_player_id": "PLAYER-ABC123",
  "position": "Forward",
  "current_club_id": null,
  "is_available_for_scout": false,
  "total_matches_played": 0,
  "total_goals_scored": 0,
  "total_assists": 0,
  "created_at": "2024-01-01T00:00:00Z"
}
```

---

#### GET /api/players
Get list of available players (paginated).

**Query Parameters:**
- `page` (int, default: 1)
- `limit` (int, default: 20)
- `position` (string, optional)
- `nationality` (string, optional)
- `available_only` (boolean, default: false)

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "unique_player_id": "PLAYER-ABC123",
      "position": "Forward",
      /* ... more player data */
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100
  }
}
```

---

#### GET /api/players/{playerId}
Get specific player details.

---

#### PUT /api/players/{playerId}
Update player profile.

---

### Clubs

#### POST /api/clubs
Create new club.

**Request Body:**
```json
{
  "club_name": "Manchester United",
  "registration_status": "unregistered",
  "description": "Professional football club",
  "city": "Manchester",
  "country": "United Kingdom",
  "founded_year": 1878,
  "official_website": "https://manutd.com"
}
```

**Response:**
```json
{
  "id": "uuid",
  "owner_id": "uuid",
  "club_name": "Manchester United",
  "slug": "manchester-united",
  "registration_status": "unregistered",
  "total_members": 0,
  "is_active": true,
  "created_at": "2024-01-01T00:00:00Z"
}
```

---

#### GET /api/clubs
Get clubs (with filters).

**Query Parameters:**
- `registration_status` (registered/unregistered)
- `city` (string)
- `owner_id` (uuid, for own clubs)

---

#### GET /api/clubs/{clubId}
Get club details.

---

#### PUT /api/clubs/{clubId}
Update club information (owner only).

---

#### DELETE /api/clubs/{clubId}
Delete club (owner only, soft delete).

---

### Teams

#### POST /api/clubs/{clubId}/teams
Create team in club.

**Request Body:**
```json
{
  "team_name": "Man Utd First Team",
  "formation": "4-3-3",
  "description": "Main team"
}
```

---

#### GET /api/clubs/{clubId}/teams
Get all teams in club.

---

#### GET /api/teams/{teamId}
Get team details.

---

#### PUT /api/teams/{teamId}
Update team (club owner only).

---

### Contracts

#### POST /api/contracts
Create contract offer.

**Request Body:**
```json
{
  "player_id": "uuid",
  "club_id": "uuid",
  "contract_start_date": "2024-02-01",
  "contract_end_date": "2025-02-01",
  "salary_monthly": 50000,
  "position_assigned": "Forward",
  "jersey_number": 10,
  "terms_conditions": "Standard contract terms"
}
```

**Response:**
```json
{
  "id": "uuid",
  "player_id": "uuid",
  "club_id": "uuid",
  "status": "pending",
  "contract_start_date": "2024-02-01",
  "contract_end_date": "2025-02-01",
  "salary_monthly": 50000,
  "created_at": "2024-01-01T00:00:00Z"
}
```

---

#### GET /api/contracts
Get user's contracts.

**Query Parameters:**
- `status` (active/pending/terminated)
- `player_id` (uuid)
- `club_id` (uuid)

---

#### GET /api/contracts/{contractId}
Get contract details.

---

#### PATCH /api/contracts/{contractId}/accept
Accept contract offer (player only).

---

#### PATCH /api/contracts/{contractId}/reject
Reject contract offer.

---

#### PATCH /api/contracts/{contractId}/terminate
Terminate contract.

**Request Body:**
```json
{
  "reason": "Mutual agreement"
}
```

---

#### POST /api/contracts/{contractId}/amendments
Propose amendment to contract.

**Request Body:**
```json
{
  "amendment_type": "salary_increase",
  "new_value": {
    "salary_monthly": 60000
  },
  "reason": "Performance bonus"
}
```

---

### Matches

#### POST /api/matches
Schedule a new match.

**Request Body:**
```json
{
  "home_team_id": "uuid",
  "away_team_id": "uuid",
  "match_format": "7-a-side",
  "match_date": "2024-02-15",
  "match_time": "14:00",
  "stadium_id": "uuid",
  "tournament_id": "uuid (optional)"
}
```

**Response:**
```json
{
  "id": "uuid",
  "home_team_id": "uuid",
  "away_team_id": "uuid",
  "match_format": "7-a-side",
  "match_date": "2024-02-15",
  "match_time": "14:00",
  "status": "scheduled",
  "created_at": "2024-01-01T00:00:00Z"
}
```

---

#### GET /api/matches
Get matches with filters.

**Query Parameters:**
- `status` (scheduled/ongoing/completed/cancelled)
- `date_from`, `date_to` (YYYY-MM-DD)
- `team_id` (uuid)
- `tournament_id` (uuid)

---

#### GET /api/matches/{matchId}
Get match details.

---

#### PATCH /api/matches/{matchId}
Update match (admin/creator only).

**Request Body:**
```json
{
  "status": "completed",
  "home_team_score": 3,
  "away_team_score": 2,
  "match_summary": "Exciting match"
}
```

---

#### POST /api/matches/{matchId}/assignments
Assign referee or staff to match.

**Request Body:**
```json
{
  "referee_id": "uuid (optional)",
  "staff_id": "uuid (optional)",
  "assignment_type": "main_referee"
}
```

---

#### POST /api/matches/{matchId}/events
Record match event (goal, card, etc).

**Request Body:**
```json
{
  "player_id": "uuid",
  "event_type": "goal",
  "minute": 35,
  "description": "Penalty goal"
}
```

---

### Tournaments

#### POST /api/tournaments
Create tournament.

**Request Body:**
```json
{
  "tournament_name": "Spring Cup 2024",
  "league_structure": "tournament",
  "match_format": "5-a-side",
  "start_date": "2024-03-01",
  "end_date": "2024-03-15",
  "location": "Mumbai",
  "max_teams": 16,
  "entry_fee": 5000,
  "prize_pool": "1,00,000"
}
```

---

#### GET /api/tournaments
Get tournaments with filters.

**Query Parameters:**
- `league_structure` (friendly/hobby/tournament)
- `status` (draft/active/completed)
- `city` (string)

---

#### GET /api/tournaments/{tournamentId}
Get tournament details.

---

#### POST /api/tournaments/{tournamentId}/register
Register team in tournament.

**Request Body:**
```json
{
  "team_id": "uuid"
}
```

---

### Stadiums

#### POST /api/stadiums
List stadium (owner only).

**Request Body:**
```json
{
  "stadium_name": "Sports Arena",
  "description": "Professional stadium",
  "capacity": 1000,
  "amenities": ["parking", "restroom", "canteen"],
  "hourly_rate": 5000,
  "city": "Mumbai",
  "country": "India"
}
```

---

#### GET /api/stadiums
Get available stadiums.

**Query Parameters:**
- `city` (string)
- `date` (YYYY-MM-DD)
- `max_rate` (number)

---

#### GET /api/stadiums/{stadiumId}
Get stadium details and availability.

---

#### POST /api/stadiums/{stadiumId}/slots
Add availability slots.

**Request Body:**
```json
{
  "slot_date": "2024-02-15",
  "start_time": "14:00",
  "end_time": "15:00"
}
```

---

#### POST /api/stadiums/{stadiumId}/book
Book stadium slot (club owner only).

**Request Body:**
```json
{
  "slot_id": "uuid",
  "match_id": "uuid"
}
```

---

### Referees

#### POST /api/referees
Create referee profile.

**Request Body:**
```json
{
  "certification_level": "Level 2",
  "experience_years": 5
}
```

---

#### GET /api/referees
Get available referees.

**Query Parameters:**
- `available_only` (boolean)
- `experience_min` (number)

---

#### PATCH /api/referees/{refereeId}/availability
Update referee availability.

**Request Body:**
```json
{
  "is_available": true
}
```

---

### Staff

#### POST /api/staff
Create staff profile.

**Request Body:**
```json
{
  "role_type": "medic",
  "specialization": "Sports Medicine",
  "experience_years": 3
}
```

---

#### GET /api/staff
Get available staff members.

---

#### PATCH /api/staff/{staffId}/availability
Update staff availability.

---

## Error Handling

All errors follow this format:

```json
{
  "error": {
    "code": "INVALID_REQUEST",
    "message": "Descriptive error message",
    "details": {
      "field": "email",
      "reason": "Invalid format"
    }
  }
}
```

### Common Error Codes
- `INVALID_REQUEST` - Bad request format
- `UNAUTHORIZED` - Not authenticated
- `FORBIDDEN` - Not authorized
- `NOT_FOUND` - Resource not found
- `CONFLICT` - Resource already exists
- `VALIDATION_ERROR` - Data validation failed
- `DATABASE_ERROR` - Database operation failed
- `INTERNAL_ERROR` - Server error

---

## Pagination

List endpoints support pagination:

**Query Parameters:**
- `page` (int, default: 1)
- `limit` (int, default: 20, max: 100)

**Response Format:**
```json
{
  "data": [ /* items */ ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "pages": 8
  }
}
```

---

## Rate Limiting

- 100 requests per minute per authenticated user
- 10 requests per minute per IP (public endpoints)

Headers returned:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

---

## WebSocket (Future)

Real-time features will use WebSocket for live match updates, notifications, and chat.

---

## API Versioning

Current version: v1

Future versions will use URL prefix: `/api/v2`

---

## Testing API

### Using cURL
```bash
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"pass123"}'
```

### Using Postman
1. Import Postman collection (future: add collection file)
2. Set base URL
3. Set environment variables
4. Run requests

### Using JavaScript
```javascript
const response = await fetch('/api/auth/signup', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password })
});
const data = await response.json();
```

---

## Changelog

### v1.0.0 (Current)
- Initial API release
- Authentication endpoints
- Player management
- Club management
- Contract system
- Match scheduling
- Tournament management
- Stadium booking
- Referee & Staff assignment

---

For more information, see API implementation in `apps/web/src/app/api/`
