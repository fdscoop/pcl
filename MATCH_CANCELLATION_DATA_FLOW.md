# Match Cancellation: Complete Data Flow & What Happens to Matches Data

## 📊 Complete Data Journey When a Match is Canceled

### **STEP 1: Cancel Action Triggered**
```
User clicks "Cancel Match" button 
    ↓
Cancel dialog appears (white background)
    ↓
User enters cancellation reason
    ↓
User confirms cancellation
```

### **STEP 2: Database Update (Matches Table)**
When cancellation is confirmed, the following data is written to the `matches` table:

```javascript
// What gets updated in the matches table:
{
  canceled_at: "2026-01-11T19:30:00.000Z",        // ← Exact timestamp of cancellation
  canceled_by: "uuid-of-club-owner",              // ← User ID of who canceled
  cancellation_reason: "Stadium not available"    // ← Reason provided by user
}
```

**Database Column Details:**
| Column | Data Type | Purpose |
|--------|-----------|---------|
| `canceled_at` | TIMESTAMP WITH TIME ZONE | Stores exact moment match was canceled |
| `canceled_by` | UUID (Foreign Key to users) | Tracks which club owner canceled it |
| `cancellation_reason` | TEXT | Stores the cancellation reason |

**Other match data remains UNCHANGED:**
- ✅ `id` - Match ID unchanged
- ✅ `home_team_id` - Home team unchanged
- ✅ `away_team_id` - Away team unchanged
- ✅ `match_date` - Date unchanged
- ✅ `match_time` - Time unchanged
- ✅ `match_format` - Format unchanged
- ✅ `stadium_id` - Stadium unchanged
- ✅ `status` - Status field NOT used for cancellation (uses `canceled_at` instead)

### **STEP 3: Parallel Notifications Sent**
At the same time, the system sends notifications to all stakeholders:

```
Cancel API Call
    ↓
Database Updated
    ↓
Parallel Notifications Sent:
├─ 📱 Opponent Club Owner → "Your scheduled match was canceled"
├─ 📱 Stadium Owner → "Match cancellation at your stadium"
├─ 📱 ALL Home Team Players → "Match canceled - opponent canceled"
└─ 📱 ALL Away Team Players → "Match canceled - opponent canceled"
```

### **STEP 4: UI Updates**
After successful cancellation:

```
Success Toast Shown: "Match Canceled - All stakeholders notified"
    ↓
Frontend reloads match data via loadData()
    ↓
Match query filters: .is('canceled_at', null)  // ← Only shows non-canceled
    ↓
Canceled match DISAPPEARS from "Upcoming Matches" list
```

---

## 🔍 Match Query Filter Logic

### **Before Cancellation:**
```sql
-- Query fetches all matches where:
WHERE 
  (home_team_id = club_team_id OR away_team_id = club_team_id)
  AND match_date >= TODAY
  AND canceled_at IS NULL  ← ✅ Shows this match
```

### **After Cancellation:**
```sql
-- Same query, but now:
WHERE 
  (home_team_id = club_team_id OR away_team_id = club_team_id)
  AND match_date >= TODAY
  AND canceled_at IS NOT NULL  ← ❌ This match is hidden
```

---

## 📋 Database Record Comparison

### **BEFORE Cancellation:**
```json
{
  "id": "match-123",
  "home_team_id": "team-456",
  "away_team_id": "team-789",
  "match_date": "2026-01-15",
  "match_time": "18:00",
  "match_format": "11-a-side",
  "stadium_id": "stadium-001",
  "canceled_at": null,
  "canceled_by": null,
  "cancellation_reason": null,
  "created_at": "2026-01-10T10:00:00Z"
}
```

### **AFTER Cancellation:**
```json
{
  "id": "match-123",
  "home_team_id": "team-456",
  "away_team_id": "team-789",
  "match_date": "2026-01-15",
  "match_time": "18:00",
  "match_format": "11-a-side",
  "stadium_id": "stadium-001",
  "canceled_at": "2026-01-11T19:30:45.123Z",  ← ✅ Updated
  "canceled_by": "user-abc-xyz",               ← ✅ Updated
  "cancellation_reason": "Stadium not available",  ← ✅ Updated
  "created_at": "2026-01-10T10:00:00Z"         ← Unchanged
}
```

---

## ✨ Key Points About Match Data

### **What Happens to Match Data:**
1. ✅ **Match record is NOT deleted** - Data persists in database
2. ✅ **Match is soft-deleted** - Hidden from UI via `canceled_at IS NULL` filter
3. ✅ **Cancellation is tracked** - All details stored (who, when, why)
4. ✅ **Original data preserved** - All match info can be reviewed later
5. ✅ **Audit trail created** - `canceled_by` shows who made the decision

### **Frontend Behavior:**
- ❌ Match disappears from "Upcoming Matches" list
- ❌ Cancel button no longer visible for that match
- ✅ Can still view match in database/history if needed
- ✅ Notifications ensure all parties are informed

### **Why Use `canceled_at` Instead of Status?**
- More flexible - distinguishes between different match states
- Better for reporting - can query by cancellation date
- Preserves audit trail - shows exact cancellation timestamp
- Allows soft-deletion - match data remains for history/records
- Better RLS policies - can control access based on cancellation status

---

## 🔐 Authorization Check

Before any data is updated, the API verifies:
```typescript
// Match can only be canceled by its own club owner
if (userClub.id !== (isHomeClub ? match.home_team.club_id : match.away_team.club_id)) {
  return 401 Unauthorized
}

// Only scheduled or pending matches can be canceled
if (match.status !== 'pending' && match.status !== 'scheduled') {
  return 400 Bad Request - "Cannot cancel completed or ongoing matches"
}
```

---

## 📊 Summary Table

| Aspect | Details |
|--------|---------|
| **Match Record** | NOT deleted, still exists in database |
| **Match Visibility** | Hidden from "Upcoming Matches" via filter |
| **Data Persistence** | All original match data preserved |
| **Cancellation Record** | Tracked with timestamp, user ID, reason |
| **Notifications** | Sent to both clubs and all their players |
| **Audit Trail** | `canceled_by` and `canceled_at` columns store who/when |
| **Reversibility** | Match data can theoretically be restored (manual DB operation) |
| **Historical Access** | Can query canceled matches with `canceled_at IS NOT NULL` |

This design ensures **complete data integrity** while providing **clear audit trails** of all cancellations! 🎯