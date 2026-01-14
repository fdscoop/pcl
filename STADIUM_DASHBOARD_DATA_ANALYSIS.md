# Stadium Dashboard - Dynamic Data Analysis & Missing Connections

## Executive Summary
**Total Dynamic Data Points:** 45+ 
**Database Tables Connected:** 9 ✅
**Data Points Missing Database Connection:** 5-7 ⚠️

---

## Dynamic Data Breakdown by Page

### 1. **Main Dashboard** (`/dashboard/stadium-owner`)

#### Displaying:

| Data Point | Source | Status | Data Type |
|-----------|--------|--------|-----------|
| User first name | users table | ✅ Live | Text |
| Total stadiums count | stadiums table | ✅ Live | Number |
| Active stadiums count | stadiums table (is_active) | ✅ Live | Number |
| Total bookings | matches table | ✅ Live | Number |
| Monthly revenue | payments table + amount_breakdown | ✅ Live | Currency |
| Today's bookings | matches table (match_date) | ✅ Live | Number |
| Pending bookings | NOT IMPLEMENTED | ❌ Missing | Number |
| Recent 5 bookings | matches + teams + clubs | ✅ Live | Objects |
| Booking details (date, time, teams) | matches + related | ✅ Live | Mixed |
| KYC Status - Aadhaar verified | users table | ✅ Live | Boolean |
| KYC Status - Bank verified | payout_accounts table | ✅ Live | Boolean |
| KYC Status - Documents verified | stadium_documents_verification table | ✅ Live | Boolean |
| KYC Status - Documents pending | stadium_documents table | ✅ Live | Boolean |

#### Sample Rendered Output:
```
Welcome back, Binesh! 🏟️
- Total Stadiums: 2
- Active Stadiums: 2
- Total Bookings: 15
- Monthly Revenue: ₹45,000
- Today's Bookings: 0
- Recent Bookings: [List of 5 matches]
- KYC Progress: 75% (3/4 steps)
```

**Missing Data:**
- ❌ **Pending Bookings** - Not calculated (set to 0)
- ❌ **Revenue Forecast** - No prediction logic
- ❌ **Performance Trends** - No week-over-week comparison

---

### 2. **Bookings Page** (`/dashboard/stadium-owner/bookings`)

#### Displaying:

| Data Point | Source | Status | Data Type |
|-----------|--------|--------|-----------|
| Total bookings count | matches table | ✅ Live | Number |
| Upcoming bookings count | matches (date >= today) | ✅ Live | Number |
| Completed bookings count | matches (date < today OR status=completed) | ✅ Live | Number |
| Booking list (all fields) | matches + joins | ✅ Live | Objects |
| Stadium name | stadiums table | ✅ Live | Text |
| Stadium location | stadiums table | ✅ Live | Text |
| Stadium city | stadiums table | ✅ Live | Text |
| Home team name | teams table | ✅ Live | Text |
| Away team name | teams table | ✅ Live | Text |
| Home club name | clubs table | ✅ Live | Text |
| Away club name | clubs table | ✅ Live | Text |
| Club logos | clubs table | ✅ Live | URL |
| Match date | matches table | ✅ Live | Date |
| Match time | matches table | ✅ Live | Time |
| Match status | matches table | ✅ Live | Status |
| Match format | matches table | ✅ Live | Text |

#### Sample Rendered Output:
```
BOOKINGS
Total: 15 | Upcoming: 5 | Completed: 10

[Booking Cards showing:]
- 24 Jan, 2026 at 18:00
- Vs Manchester City vs Liverpool
- Status: Scheduled
- Format: 11-a-side
```

**Real-time Features:**
- ✅ Realtime subscription to matches table
- ✅ Auto-reload on INSERT/UPDATE/DELETE
- ✅ Toast notifications on new bookings

**Missing Data:**
- ❌ **Payment Status per Booking** - Could show if paid/unpaid
- ❌ **Booking Revenue** - Individual match revenue breakdown
- ❌ **Stadium Occupancy per Slot** - Double booking prevention visual
- ❌ **Booking Cancellation Reason** - If cancelled

---

### 3. **Statistics Page** (`/dashboard/stadium-owner/statistics`)

#### Displaying:

| Data Point | Source | Status | Data Type |
|-----------|--------|--------|-----------|
| Total stadiums | stadiums table | ✅ Live | Number |
| Active stadiums | stadiums table (is_active) | ✅ Live | Number |
| Total bookings | matches table | ✅ Live | Number |
| Upcoming bookings | matches (date >= today) | ✅ Live | Number |
| Completed bookings | matches (date < today OR status=completed) | ✅ Live | Number |
| Total revenue (calculated) | matches + stadiums.hourly_rate | ⚠️ Estimated | Currency |
| Monthly revenue (current) | matches (current month) + hourly_rate | ⚠️ Estimated | Currency |
| Occupancy rate (calculated) | Total booked / (stadiums × 30 × 12) | ❌ Hardcoded | Percentage |
| Most popular stadium | matches grouped by stadium | ✅ Live | Text |
| Revenue by month (6 months) | matches + hourly_rate | ⚠️ Estimated | Array |
| Bookings by stadium | matches grouped by stadium | ✅ Live | Array |

#### Sample Rendered Output:
```
STATISTICS
- Total Stadiums: 2
- Active Stadiums: 2  
- Total Bookings: 15
- Upcoming: 5
- Completed: 10
- Total Revenue: ₹34,000 (estimated from hourly rate)
- Monthly Revenue: ₹8,500
- Occupancy Rate: 0.21%
- Most Popular: Stadium A (8 bookings)

[Charts showing:]
- Revenue by Month (Last 6 months)
- Bookings by Stadium (Pie chart)
```

**Critical Issues:**
- ⚠️ **Revenue Calculation Fallback** - Uses hardcoded hourly_rate * duration instead of actual payment data
- ⚠️ **Occupancy Rate Wrong** - Formula assumes 12 slots/day for 30 days which is unrealistic
- ❌ **No Commission Applied** - Shows gross revenue, not stadium owner's actual earnings

---

### 4. **Stadiums Page** (`/dashboard/stadium-owner/stadiums`)

#### Displaying:

| Data Point | Source | Status | Data Type |
|-----------|--------|--------|-----------|
| Stadium name | stadiums table | ✅ Live | Text |
| Stadium slug | stadiums table | ✅ Live | Text |
| Stadium description | stadiums table | ✅ Live | Text |
| Stadium location | stadiums table | ✅ Live | Text |
| City | stadiums table | ✅ Live | Text |
| State | stadiums table | ✅ Live | Text |
| Country | stadiums table | ✅ Live | Text |
| Capacity | stadiums table | ✅ Live | Number |
| Amenities | stadiums table | ✅ Live | Array |
| Hourly rate | stadiums table | ✅ Live | Currency |
| Is active | stadiums table | ✅ Live | Boolean |
| Creation date | stadiums table | ✅ Live | Date |
| Photos | stadium_photos table | ✅ Live | Images |
| Photo count | stadium_photos table | ✅ Live | Number |
| Photo navigation | stadium_photos table | ✅ Live | UI |

#### Operations Supported:
- ✅ CREATE - Insert new stadium
- ✅ READ - Display stadiums
- ✅ UPDATE - Edit stadium details
- ✅ DELETE - Remove stadium

#### Sample Rendered Output:
```
MY STADIUMS
[Stadium Cards showing:]
- Stadium Photo Gallery (with arrows for navigation)
- Stadium A
  Capacity: 5000
  City: Mumbai
  Hourly Rate: ₹2000
  Status: Active
  [Edit] [Delete]
```

**Missing Data:**
- ❌ **Booking Count per Stadium** - How many bookings each stadium has
- ❌ **Revenue per Stadium** - Total revenue generated by each
- ❌ **Occupancy Status** - Real-time availability slots
- ❌ **Ratings/Reviews** - If clubs rate stadiums
- ❌ **Maintenance Schedule** - When stadium is unavailable

---

### 5. **Payouts Page** (`/dashboard/stadium-owner/payouts`)

#### Displaying:

| Data Point | Source | Status | Data Type |
|-----------|--------|--------|-----------|
| Net earnings | payments table (amount_breakdown.stadium - 10%) | ✅ Live | Currency |
| Gross revenue | payments table (amount_breakdown.stadium) | ✅ Live | Currency |
| Platform fee / Commission | Calculated (10% of gross) | ✅ Live | Currency |
| Pending payout | payments table (unpaid matches) | ✅ Live | Currency |
| Completed payout | payments table (paid matches) | ✅ Live | Currency |
| Pending payments count | payments (status != completed) | ✅ Live | Number |
| Completed payments count | payments (status = completed) | ✅ Live | Number |
| Payout account holder | payout_accounts table | ✅ Live | Text |
| Account number (masked) | payout_accounts table | ✅ Live | Text |
| Bank name | payout_accounts table | ✅ Live | Text |
| IFSC code | payout_accounts table | ✅ Live | Text |
| Verification status | payout_accounts table | ✅ Live | Status |
| Verified date | payout_accounts table | ✅ Live | Date |
| Is active | payout_accounts table | ✅ Live | Boolean |
| Recent booking records | payments + matches + stadiums | ✅ Live | Array |

#### Sample Rendered Output:
```
PAYOUTS
- Net Earnings: ₹30,600 (After 10% commission)
- Gross Revenue: ₹34,000 (Before commission)
- Pending Payout: ₹8,500 (2 payments pending)

Payout Account:
✓ Bank account verified
- Account Holder: Binesh Balan
- Bank: HDFC Bank
- Account: •••• 4567
- IFSC: HDFC0000123

Recent Payouts:
[List of recent booking payments]
```

**Missing Data:**
- ❌ **Payout History** - Past payouts made (dates, amounts)
- ❌ **Payout Request Status** - When can they request payout
- ❌ **Tax Information** - TDS, GST calculations
- ❌ **Transaction Receipts** - Downloadable payout proofs
- ❌ **Refund Tracking** - If matches are cancelled/refunded

---

### 6. **KYC Page** (`/dashboard/stadium-owner/kyc`)

#### Displaying:

| Data Point | Source | Status | Data Type |
|-----------|--------|--------|-----------|
| User first name | users table | ✅ Live | Text |
| User last name | users table | ✅ Live | Text |
| Email | users table | ✅ Live | Text |
| Phone | users table | ✅ Live | Text |
| Aadhaar verified status | users table | ✅ Live | Boolean |
| Bank verified status | payout_accounts table | ✅ Live | Boolean |
| Documents verified status | stadium_documents_verification table | ✅ Live | Boolean |
| Overall KYC status | users table | ✅ Live | Status |
| KYC verified date | users table | ✅ Live | Date |
| Bank account details | payout_accounts table | ✅ Live | Object |
| Document upload status | stadium_documents table | ✅ Live | Status |

#### Sample Rendered Output:
```
KYC VERIFICATION
Tab 1: Aadhaar
✓ Aadhaar Verified - Status: Verified

Tab 2: Bank Account
✓ Bank Verified - Using BankAccountVerification component

Tab 3: Documents
✓ Documents Verified - Using StadiumDocumentsVerification component
```

**Missing Data:**
- ❌ **Verification Timestamps** - When each was verified
- ❌ **Rejection Reasons** - If any verification was rejected
- ❌ **Resubmission Status** - If can re-upload documents
- ❌ **Support Contact Info** - Who to contact for KYC issues

---

### 7. **Settings Page** (`/dashboard/stadium-owner/settings`)

#### Displaying:

| Data Point | Source | Status | Data Type |
|-----------|--------|--------|-----------|
| First name | users table | ✅ Live | Text |
| Last name | users table | ✅ Live | Text |
| Email | users table | ✅ Live | Text |
| Phone | users table | ✅ Live | Text |
| Bio | users table | ✅ Live | Text |
| Profile photo URL | users table | ✅ Live | URL |
| Notification preferences | NOT IN DB | ❌ Missing | Booleans |
| Email notifications | NOT IN DB | ❌ Missing | Boolean |
| Booking alerts | NOT IN DB | ❌ Missing | Boolean |
| Payout notifications | NOT IN DB | ❌ Missing | Boolean |
| Marketing emails | NOT IN DB | ❌ Missing | Boolean |

#### Operations:
- ✅ UPDATE user profile
- ✅ UPLOAD profile photo
- ❌ UPDATE notification preferences (not saved)

---

## Missing Database Connections - Priority List

### 🔴 **Critical** (Break functionality)

#### 1. **Match Revenue Data in Statistics** ⚠️
**Current Issue:** Statistics page uses hardcoded fallback calculation:
```typescript
const stadiumRevenue = hourly_rate * matchDuration  // ESTIMATED
```

**Should Use:**
```typescript
const stadiumRevenue = payments.amount_breakdown.stadium / 100  // ACTUAL
```

**Tables Needed:** payments, amount_breakdown (JSONB)
**Impact:** Revenue shown is INACCURATE

---

#### 2. **Occupancy Rate Calculation** ⚠️
**Current Issue:**
```typescript
const totalPossibleSlots = stadiumCount * 30 * 12  // Hardcoded, unrealistic
const occupancyRate = (totalBookings / totalPossibleSlots) * 100
```

**Should Be:** 
- Either use actual stadium_slots table data
- Or calculate from booked hours vs available hours per day

**Tables Needed:** stadium_slots (if exists) or match rules
**Impact:** Occupancy rate is MEANINGLESS (shows ~0%)

---

#### 3. **Pending vs Completed Bookings** ⚠️
**Current Issue:** Dashboard sets `pendingBookings: 0` hardcoded

**Should Use:**
```typescript
const pendingBookings = matches.filter(m => m.status === 'scheduled').length
const completedBookings = matches.filter(m => m.status === 'completed').length
```

**Tables Needed:** matches.status
**Impact:** Dashboard metric is FAKE

---

### 🟠 **Important** (Feature incomplete)

#### 4. **Notification Settings Storage** ❌
**Current State:** Settings page shows notification toggles but doesn't save them
```typescript
const [notifications, setNotifications] = useState({
  emailNotifications: true,
  bookingAlerts: true,
  payoutNotifications: true,
  marketingEmails: false
})
// ... these are never saved to database
```

**Solution:** 
- Create `notification_preferences` table OR
- Add columns to `users` table for notification settings

**Tables Needed:** notification_preferences (new) OR users.notification_*
**Impact:** User preferences are LOST on page reload

---

#### 5. **Stadium Performance Metrics** ❌
**Missing from Stadiums Page:**
- Booking count per stadium
- Revenue per stadium
- Last booking date
- Occupancy percentage

**Query Needed:**
```typescript
const stadiumStats = await supabase
  .from('stadiums')
  .select(`
    *,
    bookingCount: matches(count),
    totalRevenue: payments.amount_breakdown->stadium,
    lastBooking: matches(match_date)
  `)
  .eq('owner_id', userId)
```

**Tables Needed:** matches, payments (with joins)
**Impact:** Stadium list lacks actionable metrics

---

### 🟡 **Nice to Have** (Enhancement)

#### 6. **Booking Revenue Breakdown** ⚠️
**Missing:** Payment status and amount per individual booking
- Currently bookings page shows match info but not payment status
- Should show: "Paid ₹5000" or "Pending ₹5000" per booking

**Query Update:**
```typescript
.select(`
  *,
  payment:payments!match_id(id, amount, status, amount_breakdown)
`)
```

---

#### 7. **Payout History** ❌
**Missing Table/Feature:**
- Track when payouts were made
- Track amounts, dates, status
- Show transaction receipts

**Needs:**
```sql
CREATE TABLE payout_transactions (
  id UUID PRIMARY KEY,
  payout_account_id UUID REFERENCES payout_accounts(id),
  amount INTEGER,
  status TEXT,
  initiated_at TIMESTAMP,
  completed_at TIMESTAMP,
  razorpay_payout_id TEXT,
  ...
)
```

---

#### 8. **Stadium Ratings/Reviews** ❌
**Missing:** If clubs rate stadiums, show in stadium list
**Needs:** reviews table with aggregated ratings

---

## Summary Table

| Feature | Implemented | Data Source | Issue |
|---------|------------|------------|-------|
| Dashboard Stats | ✅ Partial | stadiums, matches, payments | Pending bookings hardcoded to 0 |
| Bookings List | ✅ Full | matches, teams, clubs | Missing payment status per booking |
| Real-time Updates | ✅ Full | PostgreSQL realtime | Working well |
| Statistics Charts | ⚠️ Fallback | stadiums.hourly_rate | Should use actual payment data |
| Occupancy Rate | ⚠️ Broken | Hardcoded formula | Shows meaningless 0% |
| Stadium Management | ✅ Full | stadiums, stadium_photos | Missing performance metrics |
| Payout Tracking | ✅ Partial | payout_accounts, payments | Missing payout history/transactions |
| Settings | ⚠️ Incomplete | users | Notification prefs not saved |
| KYC Status | ✅ Full | users, payout_accounts, stadium_documents | Works correctly |

---

## Recommended Action Plan

### Phase 1 - Critical Fixes (This week)
1. ✅ Fix Statistics revenue calculation to use actual payment data
2. ✅ Fix occupancy rate or remove until proper calculation
3. ✅ Fix pending bookings count
4. ✅ Add payment status to bookings

### Phase 2 - Feature Completion (Next week)
1. Save notification preferences
2. Add payout history tracking
3. Add stadium performance metrics
4. Add booking revenue column

### Phase 3 - Enhancements (Later)
1. Stadium ratings/reviews
2. Advanced analytics
3. Forecasting
4. Tax calculations

---

## Database Schema Updates Needed

### New Tables:
```sql
CREATE TABLE notification_preferences (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  email_notifications BOOLEAN DEFAULT true,
  booking_alerts BOOLEAN DEFAULT true,
  payout_notifications BOOLEAN DEFAULT true,
  marketing_emails BOOLEAN DEFAULT false,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

CREATE TABLE payout_transactions (
  id UUID PRIMARY KEY,
  payout_account_id UUID REFERENCES payout_accounts(id),
  amount INTEGER NOT NULL,
  status TEXT DEFAULT 'pending',
  initiated_at TIMESTAMP,
  completed_at TIMESTAMP,
  razorpay_payout_id TEXT UNIQUE,
  created_at TIMESTAMP
);

CREATE TABLE stadium_ratings (
  id UUID PRIMARY KEY,
  stadium_id UUID REFERENCES stadiums(id),
  club_id UUID REFERENCES clubs(id),
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  created_at TIMESTAMP
);
```

### Columns to Add:
```sql
ALTER TABLE stadiums ADD COLUMN IF NOT EXISTS rating DECIMAL(3, 2);
ALTER TABLE stadiums ADD COLUMN IF NOT EXISTS total_bookings INTEGER DEFAULT 0;
ALTER TABLE stadiums ADD COLUMN IF NOT EXISTS total_revenue_earned INTEGER DEFAULT 0;

-- Add indexes for performance
CREATE INDEX idx_payments_stadium_id_status ON payments(stadium_id, status);
CREATE INDEX idx_matches_stadium_id_status ON matches(stadium_id, status);
```
