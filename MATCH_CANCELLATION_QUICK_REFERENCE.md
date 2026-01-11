# MATCH CANCELLATION - QUICK REFERENCE GUIDE

## ✨ What's New

### **Database** (Supabase)
```
matches table + 3 columns:
├─ canceled_at (TIMESTAMP) - When canceled
├─ canceled_by (UUID) - Who canceled it
└─ cancellation_reason (TEXT) - Why
```

### **User Experience**
```
MATCHES PAGE                  STATISTICS PAGE
└─ Canceled matches: HIDDEN  └─ Canceled matches: VISIBLE in card
```

---

## 🎯 Feature Overview

| Aspect | Detail |
|--------|--------|
| **What Happens** | Match marked as canceled, not deleted |
| **Upcoming List** | Hidden using `.is('canceled_at', null)` filter |
| **Statistics** | Shows in new "Canceled Matches" card |
| **Data** | ALL original match data preserved |
| **Tracking** | Who canceled, when, why |
| **Notifications** | 4 groups: Opponent club, stadium, both teams |
| **Query** | `.is('canceled_at', null)` = active only |

---

## 📊 Frontend Implementation

### **Matches Page Filter**
```typescript
.is('canceled_at', null)  // Only active matches
```

### **Statistics Page Categorization**
```typescript
if (match.canceled_at) {
  canceled.push(match);  // Canceled section
} else if (match.status === 'completed' || date < now) {
  past.push(match);      // Past section
} else {
  upcoming.push(match);  // Upcoming section
}
```

---

## 🔄 Complete Flow

```
User Cancels
    ↓
Database Updated
├─ canceled_at = NOW()
├─ canceled_by = user_id
└─ cancellation_reason = reason
    ↓
Notifications Sent (4 groups)
    ↓
Frontend Refreshes
├─ Matches Page: Hidden (filtered out)
└─ Statistics: Shown in card
```

---

## 📁 Files Changed

```
supabase/migrations/018_add_match_cancellation_fields.sql
    ↓ Add columns + index

apps/web/src/app/api/matches/cancel/route.ts
    ↓ Update with cancellation fields

apps/web/src/app/dashboard/club-owner/matches/page.tsx
    ↓ Add .is('canceled_at', null) filter

apps/web/src/app/dashboard/club-owner/statistics/page.tsx
    ↓ Add canceled matches state & card
```

---

## ✅ Deployment

### **1. Apply Migration (Supabase SQL Editor)**
```sql
ALTER TABLE matches ADD COLUMN IF NOT EXISTS canceled_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE matches ADD COLUMN IF NOT EXISTS canceled_by UUID REFERENCES users(id);
ALTER TABLE matches ADD COLUMN IF NOT EXISTS cancellation_reason TEXT;
CREATE INDEX IF NOT EXISTS idx_matches_canceled_at ON matches(canceled_at) WHERE canceled_at IS NOT NULL;
```

### **2. Deploy Code**
All files ready - no breaking changes

### **3. Test**
- Cancel match → Disappears from upcoming ✅
- Check statistics → Appears in canceled card ✅

---

## 🎯 Query Differences

### **Get Only ACTIVE Matches** (Matches Page)
```sql
SELECT * FROM matches 
WHERE canceled_at IS NULL 
  AND match_date >= TODAY
```

### **Get ALL Matches** (Statistics)
```sql
SELECT * FROM matches 
WHERE match_date >= DATE_TRUNC('year', NOW() - '1 year'::interval)
-- No canceled_at filter
```

---

## 🔐 Soft Delete Logic

```
HARD DELETE ❌      SOFT DELETE ✅ (Ours)
Data lost           Data preserved
No history          Full audit trail
No statistics       Statistics intact
No compliance       Compliance-ready
```

---

## 📱 Notifications

All 4 groups notified immediately:
1. **Opponent Club Owner** - Direct notification
2. **Stadium Owner** - If applicable
3. **Home Team Players** - All contracted players
4. **Away Team Players** - All contracted players

---

## 💡 Database Record Lifecycle

```
CREATE MATCH
├─ canceled_at = NULL
├─ canceled_by = NULL
└─ cancellation_reason = NULL
     ↓
SHOWN: ✅ Upcoming, ✅ Statistics

MATCH CANCELED
├─ canceled_at = 2026-01-11T19:30:45Z
├─ canceled_by = user-uuid
└─ cancellation_reason = "Stadium unavailable"
     ↓
SHOWN: ❌ Upcoming, ✅ Statistics (Canceled section)
```

---

## 📊 Statistics Display

### **Card Shows:**
- Total canceled count
- Last 3 canceled with dates & reasons
- "+X more" if > 3

### **Query:**
- ALL matches fetched (no filter)
- Categorized in JavaScript
- Displays in 3 sections: Upcoming, Past, Canceled

---

## 🚀 Key Benefits

✅ **No Data Loss** - Everything preserved
✅ **Statistics Accurate** - Includes historical data
✅ **Clean UI** - Hidden from upcoming
✅ **Full Audit Trail** - Who, when, why
✅ **Compliance Ready** - Data retention for audits
✅ **Performance** - Indexed for fast queries
✅ **Notifications** - All stakeholders informed

---

## 📈 Future Possibilities

Once deployed, you can:
- Generate cancellation reports
- Analyze cancellation patterns
- Un-cancel matches (add feature)
- Calculate reliability scores
- Track cancellation trends
- Notify spectators/fans
- Penalty system for frequent cancellations

---

## 🎯 Summary

**Before:** Canceled matches deleted, statistics lost
**After:** Canceled matches preserved, statistics complete, UI clean

**Status:** ✅ READY FOR DEPLOYMENT