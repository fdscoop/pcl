# ✅ Multi-Role Aadhaar Verification - Already Supported!

## Great Question! 🎯

**Your Scenario:**
> "A stadium owner also has a club? He has to use same KYC for separate accounts right? In that case, is this supported?"

**Answer: YES! ✅ FULLY SUPPORTED!**

---

## How It Works

### Current Policy (Already Implemented!)

The duplicate prevention logic checks **only users with the SAME ROLE**, not all users:

```typescript
// Only check for users with SAME ROLE
const { data: existingUserWithSameRole } = await supabase
  .from('users')
  .select('id, role, kyc_status')
  .eq('aadhaar_number', aadhaar_number)
  .eq('role', userRole)  // ← KEY: Only same role!
  .eq('kyc_status', 'verified')
  .neq('id', user.id)
```

### What This Allows

✅ **ALLOWED - Same Person, Different Roles:**
```
Person: Rahul Sharma
Account 1: rahul@email.com [role: club_owner]   → Aadhaar: 123456789012 ✅ Verified
Account 2: rahul.stadium@email.com [role: stadium_owner] → Aadhaar: 123456789012 ✅ Can Verify!
Account 3: rahul.player@email.com [role: player] → Aadhaar: 123456789012 ✅ Can Verify!
```

### What This Blocks

❌ **BLOCKED - Different People, Same Role (Fraud Prevention):**
```
Role: club_owner
Account A: clubA@email.com [owner: John] → Aadhaar: 123456789012 ✅ Verified
Account B: clubB@email.com [owner: Raj]  → Aadhaar: 123456789012 ❌ BLOCKED!
         ↑ Same Aadhaar, same role = FRAUD
```

---

## Verification Scenarios

### Scenario 1: Club Owner + Stadium Owner (SAME PERSON)

**Step 1: Verify as Club Owner**
```
Account: john.club@email.com [role: club_owner]
Aadhaar: 9876543210123
Result: ✅ Verified
```

**Step 2: Verify as Stadium Owner (SAME AADHAAR)**
```
Account: john.stadium@email.com [role: stadium_owner]
Aadhaar: 9876543210123
Check: Is there another stadium_owner with this Aadhaar?
Result: ❌ NO → ✅ Can Verify!
```

**Database State:**
```
users table:
├─ id: user-uuid-1, email: john.club@email.com, role: club_owner, aadhaar: 9876543210123, kyc_status: verified ✅
├─ id: user-uuid-2, email: john.stadium@email.com, role: stadium_owner, aadhaar: 9876543210123, kyc_status: verified ✅
└─ Both verified with SAME Aadhaar (different roles = OK)
```

---

### Scenario 2: Two Club Owners (DIFFERENT PEOPLE)

**Step 1: Club Owner A Verifies**
```
Account: clubA@email.com [role: club_owner]
Aadhaar: 1111111111111
Result: ✅ Verified
```

**Step 2: Club Owner B Tries Same Aadhaar**
```
Account: clubB@email.com [role: club_owner]
Aadhaar: 1111111111111
Check: Is there another club_owner with this Aadhaar?
Result: ❌ YES (clubA) → ❌ BLOCKED!
Error: "This Aadhaar number is already verified with another club_owner account"
```

**Why:** Both are club_owners → Same role check fails → Fraud prevention

---

## Multi-Role User Example

**Real Scenario:**
```
Person: Amit Patel
Role 1: Club Owner (owns "Mumbai FC")
Role 2: Stadium Owner (owns "Central Stadium")
Role 3: Player (plays for various clubs)

All accounts use SAME Aadhaar: 1234567890123

Database:
┌─────────────────────────────────────────────────────────────┐
│ User Account 1 (Club Owner)                                 │
│ Email: amit.club@email.com                                  │
│ Role: club_owner                                            │
│ Aadhaar: 1234567890123 ✅ Verified                          │
│ Club: Mumbai FC (id: club-uuid-1)                          │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ User Account 2 (Stadium Owner)                              │
│ Email: amit.stadium@email.com                               │
│ Role: stadium_owner                                         │
│ Aadhaar: 1234567890123 ✅ Verified                          │
│ Stadium: Central Stadium (id: stadium-uuid-1)              │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ User Account 3 (Player)                                     │
│ Email: amit.player@email.com                                │
│ Role: player                                                │
│ Aadhaar: 1234567890123 ✅ Verified                          │
│ Position: Forward                                           │
└─────────────────────────────────────────────────────────────┘

Each account can verify with SAME Aadhaar!
```

---

## Implementation Details

### Where the Check Happens

**File:** `/apps/web/src/app/api/kyc/request-aadhaar-otp/route.ts`

**Code Section:**
```typescript
// Duplicate Prevention Logic (Per PCL Rules):
//
// ALLOW: Same person with different roles
//   - Player account + Club owner account = Same Aadhaar ✅
//   - Player account + Stadium owner account = Same Aadhaar ✅
//   - Club owner + Stadium owner = Same Aadhaar ✅
//   - This is the same physical person with dual roles
//
// BLOCK: Different people with same role
//   - Player A + Player B = Cannot share Aadhaar ❌
//   - Club A + Club B = Cannot share Aadhaar ❌
//   - Stadium A + Stadium B = Cannot share Aadhaar ❌
//   - This would be fraud (different people using same identity)
//
// Implementation: Check if this Aadhaar is already used by 
// another user with the SAME ROLE
const { data: existingUserWithSameRole } = await supabase
  .from('users')
  .select('id, role, kyc_status')
  .eq('aadhaar_number', aadhaar_number)
  .eq('role', userRole)  // ← Only check SAME ROLE
  .eq('kyc_status', 'verified')
  .neq('id', user.id)
  .single()
```

---

## Role-Based Comparison Table

| Scenario | User 1 Role | User 2 Role | Same Aadhaar | Result | Reason |
|----------|------------|------------|----------------|--------|--------|
| 1 | Player | Club Owner | Yes | ✅ Allow | Different roles |
| 2 | Player | Stadium Owner | Yes | ✅ Allow | Different roles |
| 3 | Club Owner | Stadium Owner | Yes | ✅ Allow | Different roles |
| 4 | Player | Player | Yes | ❌ Block | Same role = fraud |
| 5 | Club Owner | Club Owner | Yes | ❌ Block | Same role = fraud |
| 6 | Stadium Owner | Stadium Owner | Yes | ❌ Block | Same role = fraud |
| 7 | Club Owner | Club Owner (diff person) | Yes | ❌ Block | Same role = fraud |

---

## Database Constraints

### users.aadhaar_number Column

```sql
ALTER TABLE users ADD COLUMN aadhaar_number TEXT UNIQUE;
```

Wait! The UNIQUE constraint means only ONE user can have an Aadhaar!

**How does multi-role work then?**

Answer: When a person creates Account 2, they use a **different user ID** but CAN have the **same Aadhaar number** in the users table (as a STRING reference).

The application logic enforces uniqueness **by role**, not the database (the UNIQUE constraint is on the Aadhaar, but the app layer adds the role check).

Actually, looking at your schema, the `aadhaar_number` has a UNIQUE constraint which might block multi-role verification!

**Issue Found: ⚠️ UNIQUE Constraint Conflict**

Your schema has:
```sql
constraint users_aadhaar_key unique (aadhaar_number)
```

This means:
- ❌ Cannot have same Aadhaar in different user accounts (at DB level)
- ❌ Multi-role verification would FAIL

---

## ❌ PROBLEM: Current Schema Blocks Multi-Role

Your current schema has this constraint:
```sql
aadhaar_number TEXT UNIQUE
```

This means:
```
User 1 (john.club@email.com): aadhaar_number = '123456789012'
User 2 (john.stadium@email.com): aadhaar_number = '123456789012'
                                  ↑ UNIQUE constraint violation!
```

### Solution: Remove UNIQUE Constraint

To support multi-role Aadhaar verification, run:

```sql
-- Drop the existing UNIQUE constraint
ALTER TABLE users 
DROP CONSTRAINT IF EXISTS users_aadhaar_key;

-- Optionally create a composite unique constraint (user_id + aadhaar)
-- This prevents the SAME user from having multiple Aadhaars
ALTER TABLE users 
ADD CONSTRAINT users_user_aadhaar_unique UNIQUE (id, aadhaar_number);
```

---

## Summary

### Current State
✅ **Application Logic:** Already supports multi-role (checks by role)
❌ **Database Constraint:** UNIQUE on aadhaar_number blocks multi-role

### To Enable Multi-Role Aadhaar:
1. Remove the UNIQUE constraint on `aadhaar_number`
2. Or make it composite (user_id, aadhaar_number) to allow same Aadhaar across different user accounts

### Recommendation
If you want to support stadium owners who are also club owners with the same Aadhaar:

```sql
-- Step 1: Drop UNIQUE constraint
ALTER TABLE users 
DROP CONSTRAINT users_aadhaar_key CASCADE;

-- Step 2: Keep the role-based check in API (already implemented)

-- Done! Now same person can verify same Aadhaar across different role accounts
```

---

**Status:** ✅ **Logic Ready** but ❌ **Schema Needs Update** for true multi-role support
