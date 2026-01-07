# ✅ Multi-Role Aadhaar Support - ACTION REQUIRED

## Your Question
> "A stadium owner also has a club? He has to use same KYC for separate accounts right? In that case, is this supported?"

## Answer: YES, but needs 1 quick fix! ✅

---

## The Situation

**Example:**
```
Person: John Sharma

Account 1: john.club@email.com
  Role: club_owner
  Owns: Mumbai FC
  Aadhaar: 9876543210123

Account 2: john.stadium@email.com
  Role: stadium_owner
  Owns: Central Stadium
  Aadhaar: 9876543210123 (SAME Aadhaar)
```

**Should this work?** YES! Same person, different roles.

---

## Current State

### ✅ Application Logic: READY
The API already has role-based duplicate checking:
```typescript
// Only blocks same Aadhaar if SAME ROLE
.eq('role', userRole)  // ← Key line!
```

Allows: Club Owner + Stadium Owner = Same Aadhaar ✅
Blocks: Club Owner A + Club Owner B = Same Aadhaar ❌ (fraud)

### ❌ Database Constraint: BLOCKING
Your schema has this:
```sql
aadhaar_number TEXT UNIQUE
```

This means:
- Only 1 user can have each Aadhaar (any role)
- Blocks multi-role verification ❌

---

## The Fix (1 SQL Command)

**File:** `ENABLE_MULTI_ROLE_AADHAAR.sql`

**Run this in Supabase SQL Editor:**
```sql
ALTER TABLE users 
DROP CONSTRAINT IF EXISTS users_aadhaar_key CASCADE;
```

That's it! Now:
- ✅ Same Aadhaar can be used across different user accounts (different roles)
- ✅ API still prevents same Aadhaar across accounts with SAME role (fraud prevention)

---

## After the Fix

### Scenario 1: John with Club + Stadium ✅
```
john.club@email.com [club_owner] → Aadhaar: 123 → ✅ Verified
john.stadium@email.com [stadium_owner] → Aadhaar: 123 → ✅ Verified
(Different roles, same person, same Aadhaar = OK)
```

### Scenario 2: John + Raj with Same Club ❌
```
john.club@email.com [club_owner] → Aadhaar: 123 → ✅ Verified
raj.club@email.com [club_owner] → Aadhaar: 123 → ❌ Blocked!
(Same role, different people = Fraud prevention)
```

---

## Implementation Status

| Component | Status | Details |
|-----------|--------|---------|
| **API Logic** | ✅ Ready | Role-based duplicate check implemented |
| **Database** | ❌ Needs Fix | UNIQUE constraint blocks multi-role |
| **Testing** | ⏳ After fix | Can test once constraint is removed |

---

## Next Steps

1. **Apply the SQL migration:**
   ```sql
   ALTER TABLE users DROP CONSTRAINT IF EXISTS users_aadhaar_key CASCADE;
   ```

2. **Test multi-role verification:**
   - Create Account 1 (club_owner) → Verify Aadhaar
   - Create Account 2 (stadium_owner) → Verify SAME Aadhaar
   - Should both work! ✅

3. **Verify fraud protection:**
   - Create Account 3 (club_owner) with different email → Try SAME Aadhaar
   - Should be BLOCKED ❌

---

## Summary

- ✅ Application logic READY
- ❌ Database constraint BLOCKING
- 🔧 Fix: Drop UNIQUE constraint
- 🚀 Result: Full multi-role support

Run the SQL and you're done! 🎉
