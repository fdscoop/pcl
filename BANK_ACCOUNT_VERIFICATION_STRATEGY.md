# Bank Account Verification Strategy - Complete Analysis

## Your Question
> "When I save bank account data it directly updates bank_account_verified to true. Instead we need to save it. What if creating a separate payout accounts table? Should I keep past bank account numbers?"

**Answer:** YES! Create a separate `payout_accounts` table. This is the best practice.

---

## Current Problem

**File:** `/apps/web/src/app/dashboard/stadium-owner/kyc/page.tsx`

Current flow:
```typescript
const { error: updateError } = await supabase
  .from('users')
  .update({
    bank_account_number: accountNumber,
    bank_ifsc_code: ifscCode.toUpperCase(),
    bank_account_holder: accountHolder
    // bank_verified NOT updated! (stays false)
  })
  .eq('id', userId)
```

**Issues:**
1. ❌ Data saved without verification
2. ❌ No history of past accounts
3. ❌ No way to switch between accounts
4. ❌ No verification status tracking
5. ❌ No audit trail

---

## Recommended Solution: Separate `payout_accounts` Table

### Database Schema

```sql
CREATE TABLE payout_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Account Details
  account_number VARCHAR(20) NOT NULL,
  ifsc_code VARCHAR(11) NOT NULL,
  account_holder VARCHAR(255) NOT NULL,
  bank_name TEXT,
  
  -- Verification Status
  verification_status VARCHAR(50) DEFAULT 'pending', 
  -- pending, verifying, verified, failed, rejected
  verified_at TIMESTAMP WITH TIME ZONE,
  verification_method VARCHAR(50), -- manual, micro_deposit, etc
  
  -- Account Status
  is_active BOOLEAN DEFAULT FALSE, -- Only one active account per user
  is_primary BOOLEAN DEFAULT FALSE, -- For multiple accounts
  
  -- Audit Trail
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE, -- Soft delete for history
  
  CONSTRAINT unique_active_per_user UNIQUE (user_id, is_active) 
    WHERE is_active = TRUE
);

-- Indexes
CREATE INDEX idx_payout_accounts_user_id ON payout_accounts(user_id);
CREATE INDEX idx_payout_accounts_status ON payout_accounts(verification_status);
CREATE INDEX idx_payout_accounts_active ON payout_accounts(user_id, is_active);

-- RLS Policies
ALTER TABLE payout_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own payout accounts"
  ON payout_accounts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own payout accounts"
  ON payout_accounts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own payout accounts"
  ON payout_accounts FOR UPDATE
  USING (auth.uid() = user_id);
```

---

## Benefits of Separate Table

### 1. ✅ History Tracking
```
User John changes bank accounts:
- Account 1: HDFC 1234567890 (verified 2026-01-01)
- Account 2: ICICI 9876543210 (verified 2026-01-07)
- All history preserved with soft delete
```

### 2. ✅ Multiple Active Accounts
```
Stadium owner has:
- Primary account: For payouts
- Secondary account: For emergency transfers
- Backup account: For redundancy
```

### 3. ✅ Verification Workflow
```
User submits account → Status: "pending"
Admin reviews → Status: "verifying"
Micro-deposit sent → Status: "verifying"
User verifies amount → Status: "verified"
Account ready for payouts → is_active: TRUE
```

### 4. ✅ Audit Trail
```
When account was added: created_at
When account was verified: verified_at
When account was deleted: deleted_at
```

### 5. ✅ Keep Old Accounts (Soft Delete)
```
Users can see history of past accounts
If account is compromised, can trace transactions
Compliance: Keep records for tax/legal purposes
```

---

## New Bank Account Verification Flow

### Step 1: Save (Don't Verify Yet)
```typescript
// Step 1: User submits bank details
const { data: payoutAccount, error: insertError } = await supabase
  .from('payout_accounts')
  .insert({
    user_id: userId,
    account_number: accountNumber,
    ifsc_code: ifscCode.toUpperCase(),
    account_holder: accountHolder,
    bank_name: extractBankName(ifscCode),
    verification_status: 'pending', // ← NOT verified yet!
    is_active: false
  })
  .select()
  .single()

if (insertError) throw insertError
showMessage('Bank account saved. Awaiting verification.')
```

### Step 2: Verify (Admin Action)
```typescript
// Step 2: Admin verifies the account
const { error: updateError } = await supabase
  .from('payout_accounts')
  .update({
    verification_status: 'verified',
    verified_at: new Date().toISOString(),
    verification_method: 'manual'
  })
  .eq('id', accountId)
```

### Step 3: Activate (Make Primary)
```typescript
// Step 3: Set as active/primary account
const { error: activateError } = await supabase
  .from('payout_accounts')
  .update({
    is_active: true,
    is_primary: true
  })
  .eq('id', accountId)
```

---

## Data Retention Strategy

### Keep Past Accounts (Yes!)
```sql
-- Option 1: Soft delete (recommended)
-- Mark deleted_at but keep the row
UPDATE payout_accounts 
SET deleted_at = NOW() 
WHERE id = 'old-account-id';

-- Option 2: Archive table
-- Copy to archive, then delete

-- Option 3: Audit log table
-- Separate table for all changes
CREATE TABLE payout_accounts_audit {
  account_id UUID,
  action VARCHAR(50), -- created, verified, deleted, activated
  old_values JSONB,
  new_values JSONB,
  changed_at TIMESTAMP
}
```

### Who Can See Old Accounts?
- ✅ User: Can see their own history
- ✅ Admin: Can see for audit/compliance
- ❌ Others: Cannot see

---

## Migration Path

### Phase 1: Create Table
```sql
-- Create new table (as shown above)
CREATE TABLE payout_accounts (...)
```

### Phase 2: Copy Existing Data
```sql
-- Move existing bank data to new table
INSERT INTO payout_accounts (
  user_id, 
  account_number, 
  ifsc_code, 
  account_holder,
  verification_status,
  is_active,
  created_at
)
SELECT 
  id,
  bank_account_number,
  bank_ifsc_code,
  bank_account_holder,
  CASE WHEN bank_account_number IS NOT NULL THEN 'verified' ELSE 'pending' END,
  TRUE,
  COALESCE(kyc_verified_at, NOW())
FROM users
WHERE bank_account_number IS NOT NULL;
```

### Phase 3: Update Frontend
- Remove bank fields from users table update
- Use payout_accounts table for bank operations
- Add verification status UI

### Phase 4: Keep users Table Fields (Optional)
```sql
-- Keep for backward compatibility
ALTER TABLE users ADD COLUMN IF NOT EXISTS 
  primary_payout_account_id UUID REFERENCES payout_accounts(id);
```

---

## Comparison: Old vs New

| Aspect | Users Table Only | Separate payout_accounts Table |
|--------|------------------|-------------------------------|
| **History** | ❌ No | ✅ Yes (soft delete) |
| **Multiple Accounts** | ❌ No | ✅ Yes (is_primary) |
| **Verification** | ❌ Manual tracking | ✅ Built-in status field |
| **Audit Trail** | ❌ No | ✅ created_at, verified_at, deleted_at |
| **Active/Inactive** | ❌ No | ✅ is_active flag |
| **Soft Delete** | ❌ Permanent | ✅ Preserved with deleted_at |
| **Compliance** | ❌ Limited | ✅ Full audit trail |

---

## Implementation Recommendation

### ✅ Best Practice (Recommended)
1. Create `payout_accounts` table
2. Move bank verification to this table
3. Keep full history (soft delete)
4. Allow multiple accounts per user
5. Track verification status
6. Support admin verification workflow

### Why This is Better
- ✅ Scalable for future features (e.g., multiple payouts)
- ✅ Compliance ready (audit trail)
- ✅ Better UX (show verification status)
- ✅ Secure (versioning)
- ✅ Professional (industry standard)

---

## Should You Keep Past Bank Accounts?

### YES ✅ - Keep Them (Soft Delete)
**Reasons:**
1. **Compliance:** Tax/legal requirements
2. **Audit:** Trace payout history
3. **Recovery:** In case of disputes
4. **Fraud:** Track suspicious changes
5. **User:** May want to revert to old account

**Example:**
```
2026-01-01: Account A verified and used (10 payouts)
2026-01-15: Account B verified and used (5 payouts)
2026-02-01: Account A deleted (soft delete)
           → But can see past payouts were to Account A
```

### How to Store Old Accounts
```sql
-- Soft delete approach
UPDATE payout_accounts 
SET deleted_at = NOW() 
WHERE id = 'account-id';

-- Query active accounts only
SELECT * FROM payout_accounts 
WHERE user_id = 'user-id' 
AND deleted_at IS NULL;

-- Query all accounts (with history)
SELECT * FROM payout_accounts 
WHERE user_id = 'user-id';
```

---

## Summary

| Question | Answer |
|----------|--------|
| Create separate table? | ✅ YES (best practice) |
| Keep past accounts? | ✅ YES (use soft delete) |
| Verification needed? | ✅ YES (set status field) |
| Multiple accounts? | ✅ YES (is_primary flag) |
| Audit trail? | ✅ YES (timestamps) |

**Recommendation:** Implement the full `payout_accounts` table with soft delete and verification workflow. It's the professional, scalable approach!

---

**Files to Create:**
1. `CREATE_PAYOUT_ACCOUNTS_TABLE.sql` - Migration
2. Updated `BankAccountVerification` component - Use payout_accounts
3. Updated API endpoints - Handle verification workflow
