# Stadium Dashboard - Database Tables Connection Map

## Overview
Complete mapping of all database tables connected to the stadium owner dashboard and its pages.

---

## Dashboard Pages & Connected Tables

### 1. **Main Dashboard** (`/dashboard/stadium-owner`)

#### Tables Queried:
1. **users**
   - Query: `SELECT * FROM users WHERE id = current_user`
   - Purpose: Load stadium owner profile (name, email, phone)
   - Used for: Display owner name, check role

2. **stadiums**
   - Query: `SELECT * FROM stadiums WHERE owner_id = current_user`
   - Purpose: Get all stadiums owned by the user
   - Used for: Display stadiums list, count total/active stadiums

3. **matches**
   - Query: `SELECT * FROM matches WHERE stadium_id IN [stadium_ids]`
   - Purpose: Get all bookings/matches at user's stadiums
   - Used for: Calculate total bookings, upcoming bookings, today's bookings

4. **payments**
   - Query: `SELECT * FROM payments WHERE match_id IN [match_ids]`
   - Purpose: Get payment data for matches
   - Used for: Calculate monthly revenue, payment status

#### Sample Queries:
```typescript
// Get stadiums
const { data: stadiumsData } = await supabase
  .from('stadiums')
  .select('*')
  .eq('owner_id', userId)
  .order('created_at', { ascending: false })

// Get recent matches at stadiums
const { data: matches } = await supabase
  .from('matches')
  .select('*')
  .in('stadium_id', stadiumIds)
  .order('match_date', { ascending: false })
  .limit(10)

// Get payments for matches
const { data: payments } = await supabase
  .from('payments')
  .select('*')
  .in('match_id', matchIds)
```

---

### 2. **Bookings Page** (`/dashboard/stadium-owner/bookings`)

#### Tables Queried:
1. **stadiums**
   - Get: All stadiums owned by user
   - Fields: `id`

2. **matches**
   - Query: `SELECT * FROM matches WHERE stadium_id IN [stadium_ids]`
   - Joins:
     - `stadium:stadiums(stadium_name, location, city, hourly_rate)`
     - `home_team:teams(id, team_name, club(id, club_name, logo_url))`
     - `away_team:teams(id, team_name, club(id, club_name, logo_url))`
   - Purpose: Get all matches/bookings with full details
   - Used for: Display bookings list, filter by status

#### Related Components:
```typescript
const { data: stadiums } = await supabase
  .from('stadiums')
  .select('id')
  .eq('owner_id', userId)

const { data: matches } = await supabase
  .from('matches')
  .select(`
    *,
    stadium:stadiums(stadium_name, location, city, hourly_rate),
    home_team:teams!matches_home_team_id_fkey(
      id, team_name,
      club:clubs(id, club_name, logo_url)
    ),
    away_team:teams!matches_away_team_id_fkey(
      id, team_name,
      club:clubs(id, club_name, logo_url)
    )
  `)
  .in('stadium_id', stadiumIds)
```

#### Real-time Subscription:
```typescript
// Realtime updates on match changes
supabase
  .channel('matches_channel')
  .on(
    'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: 'matches',
      filter: `stadium_id=in.(${stadiumIds.join(',')})`
    },
    reload
  )
```

#### Tables in This Page:
| Table | Purpose | Fields Used |
|-------|---------|------------|
| stadiums | Get stadium IDs | id |
| matches | Booking data | *, stadium_id, match_date, status |
| teams | Team information | id, team_name |
| clubs | Club information | id, club_name, logo_url |

---

### 3. **Statistics Page** (`/dashboard/stadium-owner/statistics`)

#### Tables Queried:
1. **stadiums**
   - Get all stadiums with their details
   - Fields: `*`

2. **matches**
   - Query: `SELECT * FROM matches WHERE stadium_id IN [stadium_ids]`
   - Purpose: Calculate statistics (bookings, occupancy)
   - Used for: Total bookings, upcoming vs completed

3. **payments** (via stadiumPaymentService)
   - Query: Revenue calculations
   - Purpose: Calculate revenue by month/stadium

#### Calculations Performed:
```typescript
const totalStadiums = stadiums?.length
const activeStadiums = stadiums?.filter(s => s.is_active).length
const totalBookings = matches?.length
const upcomingBookings = matches?.filter(m => new Date(m.match_date) >= today)
const completedBookings = matches?.filter(m => new Date(m.match_date) < today || m.status === 'completed')

// Revenue calculation
const matchDuration = getMatchDuration(format) // Based on match_format
const stadiumRevenue = hourly_rate * matchDuration
const occupancyRate = (completedBookings / totalBookings) * 100
```

#### Chart Data Generated:
- Revenue by Month (using payments.created_at)
- Bookings by Stadium (using matches grouped by stadium)
- Occupancy Rate (completed vs total matches)

#### Tables in This Page:
| Table | Purpose | Fields Used |
|-------|---------|------------|
| stadiums | Count & status | id, is_active, hourly_rate |
| matches | Booking stats | match_date, status, stadium_id, match_format |
| payments | Revenue data | amount, amount_breakdown, created_at, match_id |

---

### 4. **Stadiums Page** (`/dashboard/stadium-owner/stadiums`)

#### Tables Queried:
1. **stadiums**
   - Query: `SELECT * FROM stadiums WHERE owner_id = current_user`
   - Purpose: Get all stadiums managed by user
   - Used for: Display stadium cards, CRUD operations

2. **stadium_photos**
   - Query: `SELECT photo_data FROM stadium_photos WHERE stadium_id = ?`
   - Purpose: Get photos for each stadium
   - Used for: Display stadium image gallery

#### Sample Queries:
```typescript
const { data: stadiums } = await supabase
  .from('stadiums')
  .select('*')
  .eq('owner_id', userId)
  .order('created_at', { ascending: false })

// For each stadium, get photos
const { data: photoData } = await supabase
  .from('stadium_photos')
  .select('photo_data')
  .eq('stadium_id', stadiumId)
  .order('display_order', { ascending: true })
```

#### Operations:
- **Create Stadium**: INSERT into stadiums
- **Edit Stadium**: UPDATE stadiums
- **Delete Stadium**: DELETE from stadiums (soft delete with deleted_at)
- **Upload Photos**: INSERT into stadium_photos

#### Tables in This Page:
| Table | Purpose | Fields Used |
|-------|---------|------------|
| stadiums | Stadium management | * (all fields) |
| stadium_photos | Photo management | stadium_id, photo_data, display_order |

---

### 5. **Payouts Page** (`/dashboard/stadium-owner/payouts`)

#### Tables Queried:
1. **payout_accounts**
   - Query: `SELECT * FROM payout_accounts WHERE user_id = current_user AND is_active = true`
   - Purpose: Get verified bank account for payouts
   - Fields: `id, account_holder, account_number, ifsc_code, bank_name, verification_status, is_active, verified_at`

2. **stadiums**
   - Query: Get all stadium IDs
   - Purpose: Filter matches for payout calculation

3. **matches**
   - Query: Get all matches at stadiums
   - Purpose: Calculate revenue

4. **payments**
   - Query: `SELECT * FROM payments WHERE match_id IN [match_ids]`
   - Purpose: Get payment breakdown for revenue calculation
   - Used for: Calculate stadium portion, commission, net payout

#### Payment Data Hook:
Uses `useStadiumPaymentData()` hook which queries:
```typescript
// From stadiumPaymentService.ts
const { data: stadiums } = await supabase
  .from('stadiums')
  .select('id')
  .eq('owner_id', userId)

const { data: matches } = await supabase
  .from('matches')
  .select('*')
  .in('stadium_id', stadiumIds)

const { data: payments } = await supabase
  .from('payments')
  .select('*')
  .in('match_id', matchIds)
```

#### Payout Calculation:
```typescript
// From amount_breakdown in payments
const stadiumGross = amount_breakdown.stadium // e.g., 5000 paise
const commission = stadiumGross * 0.10 // 10% commission
const netPayout = stadiumGross - commission

// Payment status based on match status
if (match.status === 'completed') {
  payout = 'available'
} else if (match.status === 'scheduled') {
  payout = 'pending'
}
```

#### Tables in This Page:
| Table | Purpose | Fields Used |
|-------|---------|------------|
| payout_accounts | Bank account info | user_id, account_*, verification_status, is_active |
| stadiums | Get stadium IDs | id |
| matches | Match status | id, status, match_date |
| payments | Revenue calculation | amount_breakdown, match_id, status |

---

### 6. **KYC Page** (`/dashboard/stadium-owner/kyc`)

#### Tables Queried:
1. **users**
   - Query: `SELECT * FROM users WHERE id = current_user`
   - Purpose: Get user data for KYC verification
   - Fields: `kyc_status, kyc_verified_at, pan_number, aadhaar_verified`

2. **payout_accounts**
   - Query: `SELECT * FROM payout_accounts WHERE user_id = current_user`
   - Purpose: Check bank verification status
   - Fields: `verification_status, verified_at`

3. **stadiums**
   - Query: `SELECT id FROM stadiums WHERE owner_id = current_user`
   - Purpose: Check for stadium documents verification

4. **stadium_documents** (if exists)
   - Query: Get documents for stadiums
   - Purpose: Check documents verification status

#### KYC Components Used:
- BankAccountVerification (links to payout_accounts)
- StadiumDocumentsVerification (links to stadium_documents)

#### Tables in This Page:
| Table | Purpose | Fields Used |
|-------|---------|------------|
| users | User KYC | kyc_status, kyc_verified_at, aadhaar_verified |
| payout_accounts | Bank verification | user_id, verification_status, verified_at |
| stadiums | Check existence | owner_id, id |
| stadium_documents | Document verification | stadium_id, document_type, verified_at |

---

### 7. **Settings Page** (`/dashboard/stadium-owner/settings`)

#### Tables Queried:
1. **users**
   - Query: `SELECT * FROM users WHERE id = current_user`
   - Purpose: Get and update user profile settings
   - Fields: `first_name, last_name, email, phone, bio, profile_photo_url`

#### Operations:
- **Read**: Get current user profile
- **Update**: Update profile information, notification preferences
- **Upload Photo**: Store profile_photo_url

#### Tables in This Page:
| Table | Purpose | Fields Used |
|-------|---------|------------|
| users | Profile settings | first_name, last_name, email, phone, bio, profile_photo_url |

---

## Complete Database Table Summary

### Tables Used by Stadium Dashboard:
1. ✅ **users** - Profile, KYC, settings
2. ✅ **stadiums** - Stadium management
3. ✅ **matches** - Booking/match data
4. ✅ **teams** - Team info (for match bookings)
5. ✅ **clubs** - Club info (for match bookings)
6. ✅ **payments** - Revenue tracking
7. ✅ **payout_accounts** - Bank account for payouts
8. ✅ **stadium_photos** - Stadium photos
9. ⚠️ **stadium_documents** - Stadium KYC documents (if needed)

### Tables NOT Connected:
- contracts, players, referees, staff - Not relevant to stadium owner
- tournaments, tournament_registrations - Not shown in stadium dashboard

---

## Data Flow Architecture

```
Stadium Owner Login
    ↓
Load User Profile (users table)
    ↓
├─→ Fetch Stadiums (stadiums table)
│       ↓
│       ├─→ Fetch Matches (matches table → stadium_id)
│       │       ↓
│       │       ├─→ Fetch Payments (payments table → match_id)
│       │       │       ↓
│       │       │       Calculate Revenue Stats
│       │       │
│       │       └─→ Calculate Booking Stats
│       │
│       └─→ Fetch Photos (stadium_photos table → stadium_id)
│
├─→ Check KYC Status (users + payout_accounts tables)
│
├─→ Fetch Payout Accounts (payout_accounts table)
│
└─→ Load Notification Settings (users table)
```

---

## Performance Notes

### Indexes Used:
```sql
CREATE INDEX idx_stadiums_owner_id ON stadiums(owner_id);
CREATE INDEX idx_matches_stadium_id ON matches(stadium_id);
CREATE INDEX idx_matches_status ON matches(status);
CREATE INDEX idx_payments_match_id ON payments(match_id);
CREATE INDEX idx_payments_stadium_id ON payments(stadium_id);
CREATE INDEX idx_payout_accounts_user_id ON payout_accounts(user_id);
CREATE INDEX idx_payout_accounts_active ON payout_accounts(user_id, is_active);
CREATE INDEX idx_stadium_photos_stadium_id ON stadium_photos(stadium_id);
```

### Real-time Subscriptions:
- Bookings page subscribes to `matches` table changes
- Updates trigger on match create/update/delete

---

## Related Services

### stadiumPaymentService.ts
Located at: `apps/web/src/services/stadiumPaymentService.ts`

Functions:
- `getStadiumPaymentStats()` - Queries stadiums → matches → payments
- `getStadiumRecentBookings()` - Queries matches → payments
- `getStadiumMonthlyStats()` - Monthly breakdown of payments

### Hooks
Located at: `apps/web/src/hooks/useStadiumPayments.ts`

Hooks:
- `useStadiumPaymentStats()` - Payment stats hook
- `useStadiumMonthlyStats()` - Monthly stats hook
- `useStadiumRecentBookings()` - Recent bookings hook
- `useStadiumPaymentData()` - Combined hook

---

## RLS Policies

### Stadium Owner Access:
```sql
-- Users can view their own stadiums
CREATE POLICY "Users can view their own stadiums"
  ON stadiums FOR SELECT
  USING (owner_id = auth.uid());

-- Users can view matches at their stadiums
CREATE POLICY "Stadium owners can view matches at their stadiums"
  ON matches FOR SELECT
  USING (stadium_id IN (
    SELECT id FROM stadiums WHERE owner_id = auth.uid()
  ));

-- Users can view payments for their stadiums
CREATE POLICY "Stadium owners can view payments"
  ON payments FOR SELECT
  USING (stadium_id IN (
    SELECT id FROM stadiums WHERE owner_id = auth.uid()
  ));

-- Users can view their own payout accounts
CREATE POLICY "Users can view their own payout accounts"
  ON payout_accounts FOR SELECT
  USING (auth.uid() = user_id);
```

---

## Summary Table

| Page | Primary Table | Related Tables | Purpose |
|------|--------------|-----------------|---------|
| Main Dashboard | stadiums, matches, payments | users | Overview stats |
| Bookings | matches | stadiums, teams, clubs | View/manage bookings |
| Statistics | matches | stadiums, payments | Analytics & charts |
| Stadiums | stadiums | stadium_photos | CRUD stadiums |
| Payouts | payout_accounts | matches, payments | Manage payouts |
| KYC | users, payout_accounts | stadium_documents | Verification |
| Settings | users | - | Profile management |
