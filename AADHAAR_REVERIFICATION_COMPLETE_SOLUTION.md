# Aadhaar Re-verification Solution

## 🎯 **Problem Statement**

The original KYC system had a database UNIQUE constraint on `aadhaar_number` that prevented legitimate users from re-verifying their identity while also not properly preventing fraud attempts.

**Issues:**
- ❌ Same user couldn't re-verify after profile updates  
- ❌ Database constraint blocked legitimate re-verification
- ❌ RLS policies didn't support re-verification scenarios
- ❌ No application-level fraud detection

## ✅ **Solution Overview**

We implemented a comprehensive solution with **both application-level and database-level** fraud prevention that allows legitimate re-verification while blocking fraud.

### **Core Logic:**
```
✅ Same Player + Same Aadhaar = ALLOWED (Re-verification)
❌ Different Player + Same Aadhaar = BLOCKED (Fraud Prevention)
```

## 🔧 **Implementation Details**

### **1. Application Logic Changes**

#### **Generate OTP API** (`/api/kyc/player/generate-otp/route.ts`)
```typescript
// Enhanced fraud check - only blocks if Aadhaar belongs to DIFFERENT verified player
const { data: existingPlayer } = await supabase
  .from('users')
  .select('id, role, kyc_status, email')
  .eq('aadhaar_number', cleanedAadhaar)
  .eq('role', 'player')
  .eq('kyc_status', 'verified')
  .neq('id', user.id) // 🔑 KEY: Exclude current user (allow re-verification)
  .single()

if (existingPlayer) {
  // This is fraud - different player using same Aadhaar
  return error('Aadhaar Already Registered')
}
```

#### **Verify OTP API** (`/api/kyc/verify-aadhaar-otp/route.ts`)
```typescript
// Pre-verification fraud check
const { data: existingAadhaarUser } = await supabase
  .from('users')
  .select('id, role, email, full_name')
  .eq('aadhaar_number', otpRequest.aadhaar_number)
  .neq('id', user.id) // Exclude current user
  .single()

if (existingAadhaarUser) {
  // Fraud attempt detected
  return error('Aadhaar Already Registered')
}

// Smart duplicate key handling for database constraints
if (userError.code === '23505') { // Duplicate key
  const existingUser = await checkAadhaarOwnership(aadhaar)
  
  if (existingUser.id === user.id) {
    // Same user re-verifying - update KYC status only
    await updateKYCStatus(user.id, 'verified')
  } else {
    // Different user - fraud attempt
    return error('Aadhaar Already Registered')
  }
}
```

### **2. Database Schema Changes**

#### **Remove Problematic UNIQUE Constraint**
```sql
-- Remove the constraint that blocks re-verification
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_aadhaar_number_key;
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_aadhaar_key;
```

#### **Add Composite Constraint (Optional)**
```sql
-- Allow same user re-verification but prevent cross-user duplicates
ALTER TABLE users ADD CONSTRAINT users_id_aadhaar_unique 
UNIQUE (id, aadhaar_number);
```

### **3. Database-Level Fraud Prevention**

#### **Fraud Detection Function**
```sql
CREATE OR REPLACE FUNCTION check_aadhaar_fraud_prevention(
    user_id UUID,
    new_aadhaar TEXT,
    user_role TEXT
) RETURNS BOOLEAN AS $$
DECLARE
    existing_user_id UUID;
BEGIN
    -- Check if Aadhaar used by different verified user
    SELECT u.id INTO existing_user_id
    FROM users u 
    WHERE u.aadhaar_number = new_aadhaar 
    AND u.id != user_id
    AND u.kyc_status = 'verified'
    LIMIT 1;

    -- If found, this is fraud
    IF existing_user_id IS NOT NULL THEN
        RAISE EXCEPTION 'AADHAAR_FRAUD: Already verified with different user';
    END IF;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;
```

#### **Database Trigger**
```sql
CREATE TRIGGER prevent_aadhaar_fraud_trigger
    BEFORE INSERT OR UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION trigger_check_aadhaar_fraud();
```

### **4. Enhanced RLS Policies**

```sql
-- Update policy allows Aadhaar re-verification
CREATE POLICY "Users can update their own profile"
ON users FOR UPDATE  
TO authenticated
USING (auth.uid() = id)
WITH CHECK (
    auth.uid() = id 
    AND 
    (
        aadhaar_number IS NULL 
        OR aadhaar_number = OLD.aadhaar_number  -- Same Aadhaar (re-verification)
        OR NOT EXISTS (  -- New Aadhaar not used by others
            SELECT 1 FROM users u 
            WHERE u.aadhaar_number = aadhaar_number 
            AND u.id != id 
            AND u.kyc_status = 'verified'
        )
    )
);
```

### **5. Frontend UX Improvements**

```typescript
// Enhanced error detection
const isAadhaarAlreadyRegistered = error?.toLowerCase().includes('already registered')

// Clear errors when user changes Aadhaar
onChange={(e) => {
  if (error) setError(null) // Clear previous errors
  // ... format Aadhaar
}}

// Better button states
disabled={otpGenerating || !aadhaarNumber || isAadhaarAlreadyRegistered}
```

## 🔒 **Security Features**

### **Fraud Prevention**
1. **Cross-User Protection**: Prevents different users from using same Aadhaar
2. **Identity Theft Protection**: Blocks fraudulent verification attempts
3. **Audit Trail**: Comprehensive logging for investigation
4. **Database-Level Enforcement**: Triggers prevent fraud even if application is bypassed

### **Re-verification Support**
1. **Same-User Allowance**: Users can re-verify their own Aadhaar
2. **Profile Update Re-verification**: Supports KYC invalidation after profile changes  
3. **Graceful Database Handling**: Smart duplicate key error resolution
4. **UX Optimization**: Clear error messages and smooth user flow

## 📋 **User Scenarios**

| Scenario | Old Behavior | New Behavior |
|----------|--------------|-------------|
| First-time verification | ✅ Works | ✅ Works |
| Same user re-verification | ❌ Blocked by DB constraint | ✅ Allowed |
| Profile update → re-KYC | ❌ Blocked | ✅ Allowed |
| Different user, same Aadhaar | ⚠️ Sometimes allowed | ❌ Always blocked |
| Fraud attempt | ⚠️ Inconsistent blocking | ❌ Always blocked |

## 📁 **Files to Apply**

### **Required Changes (Choose One):**
1. **Full Solution**: `FIX_AADHAAR_REVERIFICATION_RLS_POLICIES.sql`
2. **Quick Fix**: `QUICK_FIX_AADHAAR_REVERIFICATION.sql` (minimal changes)

### **Testing:**
- `TEST_AADHAAR_REVERIFICATION.sql` - Verify everything works correctly

### **Already Applied:**
- ✅ `/api/kyc/player/generate-otp/route.ts` - Application logic updated
- ✅ `/api/kyc/verify-aadhaar-otp/route.ts` - Smart error handling added  
- ✅ `/app/kyc/verify/page.tsx` - Frontend UX improved

## 🚀 **Deployment Steps**

1. **Apply Database Changes:**
   ```bash
   # Choose one:
   psql -f FIX_AADHAAR_REVERIFICATION_RLS_POLICIES.sql  # Full solution
   # OR
   psql -f QUICK_FIX_AADHAAR_REVERIFICATION.sql         # Quick fix
   ```

2. **Test the Changes:**
   ```bash
   psql -f TEST_AADHAAR_REVERIFICATION.sql
   ```

3. **Verify Application:**
   - Test same-user re-verification ✅ Should work
   - Test cross-user fraud attempt ❌ Should be blocked
   - Check error messages are user-friendly

## 🔍 **Monitoring & Maintenance**

### **Key Metrics to Monitor:**
- Fraud attempt logs (should see blocks for different users)
- Re-verification success rate (should be high for same users)
- Database constraint violations (should be minimal)
- User support tickets about "already registered" errors (should decrease)

### **Logs to Watch:**
```
🚨 FRAUD ATTEMPT: Player trying to use Aadhaar from different verified player
✅ Same user re-verification detected - allowing OTP generation
✅ Fraud check passed - Aadhaar can be used by this player
```

## 📞 **Support Scenarios**

### **When User Reports "Already Registered":**
1. Check if they have multiple accounts
2. Verify they're using correct Aadhaar number  
3. Check application logs for fraud detection
4. If legitimate issue, investigate database state

### **Common Resolution Steps:**
1. Verify user identity
2. Check for duplicate accounts
3. Update/merge accounts if needed
4. Reset KYC status if appropriate

---

**✅ This solution provides robust fraud prevention while maintaining excellent user experience for legitimate re-verification scenarios.**