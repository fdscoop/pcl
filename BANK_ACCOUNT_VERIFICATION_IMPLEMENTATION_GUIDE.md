# Bank Account Verification - Implementation Guide

## 🎯 Your Questions Answered

| Question | Answer |
|----------|--------|
| **Create separate table?** | ✅ **YES** - See `CREATE_PAYOUT_ACCOUNTS_TABLE.sql` |
| **Keep past accounts?** | ✅ **YES** - Soft delete keeps history, see `deleted_at` column |
| **Auto-verify on save?** | ❌ **NO** - Status starts as `pending`, admin verifies |
| **Multiple accounts?** | ✅ **YES** - User can have multiple, but only 1 `is_active` |
| **Track history?** | ✅ **YES** - Full audit trail with timestamps |

---

## 📋 Implementation Checklist

### Phase 1: Database Setup ✅ Ready to Deploy
- [ ] Run `CREATE_PAYOUT_ACCOUNTS_TABLE.sql` migration
- [ ] Verify table created with all indexes
- [ ] Test RLS policies work

### Phase 2: Frontend Component ✅ Ready to Deploy
- [ ] Replace old `BankAccountVerification` component with `UPDATED_BankAccountVerification_COMPONENT.tsx`
- [ ] Test form submission
- [ ] Test account history view
- [ ] Test activate/deactivate functionality

### Phase 3: Data Migration (Optional but Recommended) ⏳ After Phase 1
- [ ] Uncomment migration in `CREATE_PAYOUT_ACCOUNTS_TABLE.sql` (lines 128-163)
- [ ] Run migration to copy existing bank accounts to new table
- [ ] Verify data migration worked

### Phase 4: Keep Old users Table Fields (Optional) ⏳ For Backward Compatibility
- [ ] Optionally add `primary_payout_account_id` to users table (see SQL comment lines 168-171)
- [ ] Update any other code that reads from users.bank_account_* fields

---

## 📁 Files Created

### 1. `CREATE_PAYOUT_ACCOUNTS_TABLE.sql`
**What it does:**
- Creates new `payout_accounts` table with verification workflow
- Adds RLS policies (users can only see/edit their own)
- Creates indexes for performance
- Includes helper view for getting user's active account

**Key columns:**
- `verification_status`: pending, verifying, verified, rejected, failed
- `is_active`: TRUE for primary account, FALSE for others
- `deleted_at`: NULL = active, timestamp = deleted (soft delete)
- Full audit trail: created_at, updated_at, verified_at

**Run this first!**

---

### 2. `UPDATED_BankAccountVerification_COMPONENT.tsx`
**What it does:**
- 2-tab interface: "Add Bank Account" and "My Accounts"
- Form validation (IFSC format, account number length)
- Saves with status = `pending` (NOT verified)
- Shows account history with status badges
- Allows user to activate verified accounts
- Allows soft delete (keeps history)

**Key improvements from old version:**
```diff
- Direct update to users table → + Uses payout_accounts table
- No verification status → + Shows pending/verified/rejected status
- No history → + Full account history with timestamps
- Auto-verified → + Admin must verify, status = pending initially
- No multiple accounts → + Support for multiple accounts
```

**User flow:**
1. User submits bank details → Status: "⏳ Pending Verification"
2. Admin reviews and verifies → Status: "✅ Verified"
3. User can "Make Active" to use for payouts
4. Old accounts preserved with soft delete

---

### 3. `BANK_ACCOUNT_VERIFICATION_STRATEGY.md`
**What it is:**
- Comprehensive explanation of why separate table is better
- Comparison table: Old vs New approach
- Data retention strategy
- Migration path

---

## 🚀 Quick Start (5 Steps)

### Step 1: Create Table
```bash
# Copy contents of CREATE_PAYOUT_ACCOUNTS_TABLE.sql
# Paste into Supabase SQL Editor
# Click "Run"
```

### Step 2: Replace Component
```bash
# In your project:
# 1. Open /apps/web/src/app/dashboard/stadium-owner/kyc/page.tsx
# 2. Find BankAccountVerification component (lines 719-850)
# 3. Replace with code from UPDATED_BankAccountVerification_COMPONENT.tsx
```

### Step 3: Test
- Navigate to Stadium Owner > KYC > Bank Account tab
- Try adding a new bank account
- Verify it shows "⏳ Pending Verification"
- Check "My Accounts" tab shows the new account

### Step 4: (Optional) Migrate Existing Data
- Uncomment migration code in SQL file (lines 128-163)
- Run to copy existing bank accounts from users table

### Step 5: (Optional) Update Other Code
- Search codebase for direct reads of `users.bank_account_*` fields
- Update to query `payout_accounts` table instead

---

## 📊 How It Works

### Before (Old - ❌ Problem)
```
User fills form
    ↓
Direct update to users.bank_account_number
    ↓
Auto-marked as verified ❌
    ↓
No history ❌
    ↓
No admin verification ❌
```

### After (New - ✅ Solution)
```
User fills form
    ↓
INSERT into payout_accounts
    ↓
Status = "pending" ✅
    ↓
History preserved ✅
    ↓
Admin verifies later ✅
    ↓
User can activate when verified ✅
```

---

## 🔑 Key Features

### 1. ✅ Proper Verification Workflow
```typescript
// OLD (❌ Wrong)
await supabase.from('users').update({
  bank_account_number: accountNumber,
  bank_ifsc_code: ifscCode
})
// Auto-verified! No verification step!

// NEW (✅ Correct)
await supabase.from('payout_accounts').insert({
  account_number: accountNumber,
  ifsc_code: ifscCode,
  verification_status: 'pending' // ← Admin must verify
})
```

### 2. ✅ Soft Delete (Keep History)
```typescript
// User deletes account
await supabase.from('payout_accounts').update({
  deleted_at: new Date().toISOString()
})
// Account still in database! History preserved!

// View active accounts only
const { data } = await supabase
  .from('payout_accounts')
  .select('*')
  .eq('user_id', userId)
  .is('deleted_at', null) // ← Only non-deleted accounts

// View full history (including deleted)
const { data } = await supabase
  .from('payout_accounts')
  .select('*')
  .eq('user_id', userId) // ← All accounts, deleted or not
```

### 3. ✅ Multiple Accounts
```typescript
// User has 3 accounts
// Account 1: is_active = TRUE (currently used for payouts)
// Account 2: is_active = FALSE (verified but not active)
// Account 3: is_active = FALSE (pending verification)

// When user activates Account 2:
// 1. Set Account 1: is_active = FALSE
// 2. Set Account 2: is_active = TRUE
// Now Account 2 is used for payouts!
```

### 4. ✅ Audit Trail
```typescript
// Every account has:
// - created_at: When user submitted
// - verified_at: When admin verified
// - deleted_at: When user deleted (NULL if active)
// - updated_at: Last change time

// Perfect for compliance/audit!
```

---

## 💾 Database Schema Reference

```sql
CREATE TABLE payout_accounts (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,               -- Who owns this account
  
  -- Account Details
  account_number VARCHAR(20),
  ifsc_code VARCHAR(11),
  account_holder VARCHAR(255),
  bank_name TEXT,
  
  -- Verification Status
  verification_status VARCHAR(50),      -- pending, verified, rejected, etc.
  verified_at TIMESTAMP,                -- When admin verified
  verification_method VARCHAR(50),      -- manual, micro_deposit, etc.
  
  -- Account Status
  is_active BOOLEAN,                    -- Used for payouts?
  is_primary BOOLEAN,                   -- Primary account
  
  -- Audit Trail
  created_at TIMESTAMP,                 -- When user submitted
  updated_at TIMESTAMP,                 -- Last update
  deleted_at TIMESTAMP                  -- When deleted (NULL = active)
)
```

---

## 🔐 RLS Policies (Security)

```sql
-- Users can ONLY see their own accounts
SELECT * FROM payout_accounts
WHERE user_id = auth.uid()  -- ✅ User can see
  AND deleted_at IS NULL    -- ✅ Only active

-- Users CANNOT see:
- Other users' accounts ❌
- Deleted accounts ❌ (unless querying with deleted_at)
```

---

## 📝 Admin Verification Flow

After user submits bank account, admin sees it with `verification_status = 'pending'`.

### Admin Steps:
```typescript
// 1. List pending accounts
const { data: pending } = await supabase
  .from('payout_accounts')
  .select('*')
  .eq('verification_status', 'pending')

// 2. Verify IFSC code and account holder name
const { data: ifscData } = await fetchFromIFSCDatabase(ifscCode)
// Verify: account_holder matches ifscData.accountName

// 3. If valid, mark as verified
await supabase
  .from('payout_accounts')
  .update({
    verification_status: 'verified',
    verified_at: new Date().toISOString(),
    verification_method: 'manual'
  })
  .eq('id', accountId)

// 4. If invalid, reject
await supabase
  .from('payout_accounts')
  .update({
    verification_status: 'rejected',
    verification_method: 'manual'
  })
  .eq('id', accountId)
```

**Note:** You'll need to create an admin dashboard for verification. This guide covers the component side only.

---

## ✅ Validation Built-In

### Client-Side Validation (Component)
```typescript
// Account holder: Required, any text
if (!accountHolder.trim()) toast.error('Required')

// Account number: 9-20 digits
if (accountNumber.length < 9 || accountNumber.length > 20)
  toast.error('9-20 digits required')

// IFSC: Standard format (4 letters + 0 + 6 alphanumeric)
if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifscCode))
  toast.error('Invalid IFSC format')

// Duplicate account: Database UNIQUE constraint
// (if added to schema)
```

---

## 🎨 UI/UX Features

### Status Badges
```
✅ Verified        → Green badge
⏳ Pending         → Yellow badge
🔄 Verifying      → Blue badge
❌ Rejected/Failed → Red badge
```

### Active Account Indicator
```
User sees: "Active Account: John Doe • XXXX...7890 • HDFC0000001"
Only one account can be active at a time
```

### Account Masking
```
Account number hidden by default: XXXX...7890
User can view full number with eye icon
Secure!
```

### Two-Tab Interface
```
Tab 1: "Add Bank Account" → Form to submit new account
Tab 2: "My Accounts (3)" → History of all accounts
```

---

## 🚨 Important Notes

### 1. Remove Old Code
- Remove `bank_account_number`, `bank_ifsc_code`, `bank_account_holder` updates from users table
- Don't delete these columns yet (for backward compatibility)
- Eventually deprecate them

### 2. Soft Delete Philosophy
```
Deleted ≠ Destroyed
Soft delete keeps account in database with deleted_at timestamp
Perfect for:
- Audit trails
- Compliance
- Recovering accounts
- Tracing transactions
```

### 3. One Active Account per User
```sql
CONSTRAINT unique_active_per_user UNIQUE (user_id, is_active) 
  WHERE is_active = TRUE
```
This ensures only 1 account per user has `is_active = TRUE`

### 4. Verification Required
Account can be activated ONLY if `verification_status = 'verified'`

```typescript
if (account.verification_status !== 'verified') {
  toast.error('Can only activate verified accounts')
  return
}
```

---

## 📱 Component Props

```typescript
interface BankAccountVerificationProps {
  userId: string        // User's UUID
  userData: any         // User data (for display)
}

// Usage in stadium-owner/kyc/page.tsx:
<BankAccountVerification 
  userId={user.id} 
  userData={userData}
/>
```

---

## 🔗 Related Documentation

- `BANK_ACCOUNT_VERIFICATION_STRATEGY.md` - Detailed strategy
- `CREATE_PAYOUT_ACCOUNTS_TABLE.sql` - Database migration
- `UPDATED_BankAccountVerification_COMPONENT.tsx` - Updated React component

---

## 🎓 Learning Resources

### Why Soft Delete?
- Preserves audit trail
- GDPR compliant (data retention)
- Reversible (can restore)
- Industry standard

### Why Separate Table?
- Scalability (multiple accounts per user)
- Verification workflow
- History tracking
- Clear separation of concerns

### Why `is_active` Flag?
- Fast queries (don't need complex logic)
- Only one account for payouts at a time
- Easy to switch accounts
- Clean UI/UX

---

## 🔄 Migration Checklist

After deploying this solution:

- [ ] Create `payout_accounts` table
- [ ] Replace BankAccountVerification component
- [ ] Test adding new bank account
- [ ] Test account history view
- [ ] Test activate/deactivate
- [ ] Test soft delete
- [ ] Optionally: Migrate existing data from users table
- [ ] Optionally: Create admin verification dashboard
- [ ] Optionally: Add email notification when verified
- [ ] Optionally: Deprecate old users.bank_account_* fields

---

## 📞 Support

If you have questions:
1. Check `BANK_ACCOUNT_VERIFICATION_STRATEGY.md`
2. Review SQL comments in `CREATE_PAYOUT_ACCOUNTS_TABLE.sql`
3. Check component comments in `UPDATED_BankAccountVerification_COMPONENT.tsx`

Good to go! 🚀
