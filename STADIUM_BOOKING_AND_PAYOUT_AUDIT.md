# Stadium Booking & Payout System Audit

**Date:** 14 January 2026  
**Status:** ⚠️ CRITICAL ISSUES FOUND

---

## Executive Summary

The stadium dashboard has **TWO CRITICAL ISSUES**:

1. ❌ **Stadium Page fetches ALL matches, not just "Scheduled" ones**
2. ✅ **Payout system IS implemented** but uses a dedicated `useStadiumPaymentData` hook that correctly filters payments

---

## Issue #1: Stadium Page Match Filtering ❌

### Problem
The stadiums page (`/dashboard/stadium-owner/stadiums`) is fetching **ALL match records** regardless of their status, not just "Scheduled" bookings.

### Current Code (stadiums/page.tsx - Line 90-98)

```tsx
// ❌ WRONG: Fetches ALL matches
const { data: matchData } = await supabase
 .from('matches')
 .select(`
 id, 
 match_date,
 payments!matches_payment_id_fkey(amount, status, amount_breakdown)
 `)
 .eq('stadium_id', stadium.id)
 // ⚠️ NO STATUS FILTER - Gets all matches including cancelled, completed, etc.
```

### Issues with Current Implementation

| Metric | Issue |
|--------|-------|
| **Booking Count** | Shows ALL matches (scheduled + completed + cancelled) ❌ |
| **Total Revenue** | Includes completed/cancelled matches even if no payment ❌ |
| **Last Booking Date** | Could be from cancelled matches ❌ |

### Expected Behavior
```tsx
// ✅ CORRECT: Only scheduled matches = confirmed bookings
const { data: matchData } = await supabase
 .from('matches')
 .select(`
 id, 
 match_date,
 payments!matches_payment_id_fkey(amount, status, amount_breakdown)
 `)
 .eq('stadium_id', stadium.id)
 .eq('status', 'scheduled')  // ✅ Only scheduled matches
```

---

## Issue #2: Bookings Page Match Filtering ❌

### Problem
The bookings page (`/dashboard/stadium-owner/bookings`) also fetches ALL matches without status filtering.

### Current Code (bookings/page.tsx - Line 97-116)

```tsx
// ❌ WRONG: Fetches ALL matches
const { data, error } = await supabase
 .from('matches')
 .select(`...`)
 .in('stadium_id', stadiumIds)
 .order('match_date', { ascending: true })
 // ⚠️ NO STATUS FILTER
```

### What Should Be Filtered

The page shows matches with filters, but the initial query should respect booking status:
- **Scheduled** = Confirmed bookings (matches with payment received)
- **Completed** = Past matches
- **Cancelled** = Should not show as active bookings

---

## Payout System Status ✅

### Architecture
The payout system IS correctly implemented and uses a dedicated hook/service pattern:

```
useStadiumPaymentData (hook)
    ↓
getStadiumPaymentStats (service)
    ↓
Queries matches + payments tables
    ↓
Calculates net payout = stadium_fee - 10% commission
```

### Implementation Details

#### Service: `stadiumPaymentService.ts`

**Function:** `getStadiumPaymentStats(userId, startDate?, endDate?)`

```typescript
// Key Logic
const payment = match.payments?.[0]
if (payment) {
  const breakdown = payment.amount_breakdown || {}
  
  // Get stadium portion from breakdown
  const stadiumGross = breakdown.stadium || 0
  const stadiumCommission = Math.round(stadiumGross * 0.10)  // 10% fee
  const stadiumNet = stadiumGross - stadiumCommission
  
  // Track payment status
  if (payment.status === 'completed') {
    stats.completedPayments++
    stats.completedPayout += paiseToRupees(stadiumNet)
  }
}
```

**Result:** ✅ Correctly calculates payouts from actual payment records

#### Hook: `useStadiumPaymentData`

```typescript
export function useStadiumPaymentData(userId: string | null) {
  const [allTimeStats, setAllTimeStats] = useState<StadiumPaymentStats | null>(null)
  const [monthlyStats, setMonthlyStats] = useState<StadiumMonthlyStats[]>([])
  const [recentBookings, setRecentBookings] = useState<StadiumBookingRecord[]>([])
  
  const refetchAll = useCallback(async () => {
    // Fetches stats, monthly breakdown, and recent bookings
    // All based on actual payment data
  }, [userId])
}
```

**Result:** ✅ Correctly provides payment-based data to payouts page

---

## Payment Calculation Accuracy ✅

### How Payouts Are Calculated

1. **Data Source:** `payments` table with `amount_breakdown` JSONB
2. **Formula:** 
   ```
   Stadium Fee (from amount_breakdown.stadium)
   - 10% Platform Commission
   = Net Payout to Stadium Owner
   ```
3. **Status Check:** Only counts payments with `status = 'completed'`
4. **Conversion:** Paise to Rupees (÷ 100)

### Example Calculation

```
Payment: ₹1000 (100,000 paise)
  ├─ Stadium Fee: ₹600 (60,000 paise) [from amount_breakdown]
  ├─ Referee Fee: ₹250 (25,000 paise)
  └─ Staff Fee: ₹150 (15,000 paise)

Stadium Payout Calculation:
  ├─ Gross: ₹600
  ├─ Commission (10%): ₹60
  └─ Net Payout: ₹540 ✅
```

---

## Data Consistency Issues

### Mismatch Between Pages

| Page | Data Source | Issues |
|------|-------------|--------|
| **Stadiums** | Direct match query (ALL) | ❌ No status filter, all matches counted |
| **Bookings** | Direct match query (ALL) | ❌ No status filter, all matches shown |
| **Statistics** | Direct match query (ALL) | ❌ No status filter in initial load |
| **Payouts** | useStadiumPaymentData hook | ✅ Correct - uses payment service |

### Root Cause
Pages are using inline queries instead of the `stadiumPaymentService` which has the correct logic.

---

## Recommendations

### Priority 1: CRITICAL (Fix immediately)

#### 1. Update Stadiums Page Query
**File:** `apps/web/src/app/dashboard/stadium-owner/stadiums/page.tsx`

```tsx
// Add status filter
.eq('status', 'scheduled')  // Only confirmed bookings

// Also filter for actual payments
.eq('payment.status', 'completed')  // Only paid bookings
```

#### 2. Update Bookings Page Query
**File:** `apps/web/src/app/dashboard/stadium-owner/bookings/page.tsx`

```tsx
// Add status filter
.eq('status', 'scheduled')  // Show only scheduled matches
```

#### 3. Update Statistics Page Query
**File:** `apps/web/src/app/dashboard/stadium-owner/statistics/page.tsx`

```tsx
// Add status filter
.eq('status', 'scheduled')  // Calculate from scheduled matches only
```

### Priority 2: REFACTOR (Improve code quality)

All pages should use the `useStadiumPaymentData` hook instead of inline queries:

```tsx
// Instead of:
const { data: matchData } = await supabase.from('matches')...

// Use:
const { stats, recentBookings } = useStadiumPaymentData(userId)
```

### Priority 3: TEST (Verify accuracy)

Create test cases:
- ✅ Scheduled match with completed payment → Should count
- ❌ Scheduled match with pending payment → Should not count in revenue
- ❌ Completed match → Should not count as active booking
- ❌ Cancelled match → Should not appear

---

## Status Summary

| Component | Current | Correct | Action |
|-----------|---------|---------|--------|
| Stadiums Page | ❌ Fetches ALL | ✅ Should filter scheduled only | FIX |
| Bookings Page | ❌ Fetches ALL | ✅ Should filter scheduled only | FIX |
| Statistics Page | ⚠️ Partial | ✅ Should be comprehensive | FIX |
| Payouts System | ✅ Correct | ✅ Uses payment data | KEEP |
| Payout Calculation | ✅ Correct | ✅ 10% commission applied | KEEP |

---

## Next Steps

1. **Apply filters** to stadiums and bookings pages
2. **Migrate pages** to use `useStadiumPaymentData` hook
3. **Test data consistency** across all pages
4. **Verify payout accuracy** in payouts page
5. **Document** booking status definitions
