# Aadhaar Multi-Account Policy

## PCL Business Model

In PCL, the same **person** can have multiple **accounts** with different roles:

```
Same Person (John Doe)
├── Account 1: john.player@example.com (role: player)
│   └── Uses Aadhaar: 123456789012
└── Account 2: john.owner@example.com (role: club_owner)
    └── Uses Aadhaar: 123456789012
```

**Key Principle**:
- Aadhaar represents a **PERSON** (physical identity)
- Email represents an **ACCOUNT** (system identity)
- One person = Multiple accounts allowed ✅
- One Aadhaar = Can be used across all accounts of the same person ✅

---

## Why Allow Aadhaar Reuse?

### 1. Aadhaar = Person, Not Account
An Aadhaar card belongs to a **person**, not to an email account. The same person can have:
- Personal email (for playing)
- Professional email (for club management)
- Multiple clubs (each requiring verification)

### 2. PCL Business Rules
Per PCL guidelines:
> "Players can create their own clubs if they want to be the owner of the club."

This implies:
- Same person can be both player and club owner ✅
- May use different accounts for different purposes ✅
- Should verify both with their real identity (Aadhaar) ✅

### 3. Practical Scenarios

**Scenario 1: Player Creates Club**
```
1. Rahul signs up as player (rahul.player@gmail.com)
2. Completes player KYC with Aadhaar 123456789012 ✅
3. Later, wants to create a club for coaching
4. Creates club owner account (rahul.coach@gmail.com)
5. Completes club KYC with SAME Aadhaar 123456789012 ✅
```

**Scenario 2: Club Owner Plays**
```
1. Priya creates club owner account (priya@fckerala.com)
2. Completes club KYC with Aadhaar 987654321098 ✅
3. Also wants to play in tournaments
4. Creates player account (priya.personal@gmail.com)
5. Completes player KYC with SAME Aadhaar 987654321098 ✅
```

**Scenario 3: Multiple Clubs**
```
1. Amit owns 3 clubs in different districts
2. Each club might be registered under different business emails
3. All clubs verified with SAME Aadhaar (Amit's) ✅
```

---

## Technical Implementation

### No Duplicate Aadhaar Check

**Files Updated**:
1. [apps/web/src/app/api/kyc/player/generate-otp/route.ts:108-120](apps/web/src/app/api/kyc/player/generate-otp/route.ts#L108-L120)
2. [apps/web/src/app/api/kyc/request-aadhaar-otp/route.ts:95-107](apps/web/src/app/api/kyc/request-aadhaar-otp/route.ts#L95-L107)

**Old Logic** (❌ Blocked):
```typescript
// Check if Aadhaar already used by another user
const { data: existingUser } = await supabase
  .from('users')
  .select('id')
  .eq('aadhaar_number', aadhaar_number)
  .neq('id', user.id)  // Different user = BLOCKED
  .single()

if (existingUser) {
  return 'Aadhaar already registered' ❌
}
```

**New Logic** (✅ Allows):
```typescript
// Note: Per PCL rules, a person can have multiple accounts.
// Aadhaar represents a PERSON, not an account.
// We allow the same Aadhaar across multiple accounts.

// NO DUPLICATE CHECK - Person can use their Aadhaar on all their accounts
```

---

## Database State Example

### Same Person, Multiple Accounts

**Users Table**:
| id | email | role | kyc_status | aadhaar_number | full_name |
|----|-------|------|------------|----------------|-----------|
| user-123 | john.player@gmail.com | player | verified | 123456789012 | John Doe |
| user-456 | john.owner@gmail.com | club_owner | verified | 123456789012 | John Doe |

**Players Table**:
| id | user_id | state | district | nationality |
|----|---------|-------|----------|-------------|
| player-789 | user-123 | Kerala | Idukki | India |

**Clubs Table**:
| id | owner_id | club_name | state | district | country |
|----|----------|-----------|-------|----------|---------|
| club-101 | user-456 | FC Kerala | Kerala | Idukki | India |

**KYC Documents**:
| id | user_id | club_id | document_type | aadhaar_number | verified_at |
|----|---------|---------|---------------|----------------|-------------|
| kyc-1 | user-123 | NULL | aadhaar | 123456789012 | 2024-01-15 |
| kyc-2 | user-456 | club-101 | aadhaar | 123456789012 | 2024-02-20 |

**Observation**:
- ✅ Same Aadhaar (123456789012) used twice
- ✅ Same person (John Doe) verified
- ✅ Different accounts (player vs club owner)
- ✅ Not fraud - legitimate dual role

---

## Fraud Prevention

### What We DON'T Prevent Programmatically

**Cannot detect**: Different people using the same Aadhaar
```
❌ Cannot programmatically detect if:
   User A (alice@example.com) uses Aadhaar 123456789012
   User B (bob@example.com) also uses Aadhaar 123456789012

   Are they the same person? We can't tell programmatically.
```

### What We DO Verify

1. **Aadhaar Ownership** (via Cashfree OTP)
   - OTP sent to Aadhaar-registered mobile ✅
   - Only person with access to that phone can verify ✅

2. **Name & DOB Validation**
   - Aadhaar name must match user profile ✅
   - Aadhaar DOB must match user profile ✅
   - Ensures person is using their own Aadhaar ✅

3. **One Aadhaar Per Physical Person** (Government Rule)
   - UIDAI ensures one Aadhaar per person ✅
   - If someone has the Aadhaar and can receive OTP, they're the legitimate owner ✅

### Manual Fraud Detection

If fraud is suspected (different people sharing Aadhaar), it can be detected through:
- Admin review of KYC documents
- Name mismatches across accounts
- Suspicious activity patterns
- User reports

---

## Security Measures Still In Place

Even without duplicate Aadhaar checks, we still have:

### 1. OTP Verification ✅
- OTP sent to Aadhaar-registered mobile
- Only legitimate Aadhaar owner can verify

### 2. Name & DOB Validation ✅
- Aadhaar name must match profile
- Prevents using someone else's Aadhaar

### 3. Cashfree API Verification ✅
- Real-time verification with UIDAI
- Ensures Aadhaar is valid and active

### 4. One-Time OTP ✅
- Each OTP is single-use
- Prevents replay attacks

### 5. Rate Limiting ✅
- Prevents brute force OTP attempts
- Cashfree enforces API rate limits

---

## User Experience

### Before Fix (Blocked):
```
User: john.player@gmail.com (verified with Aadhaar 123456789012)
  ↓
Creates club owner account: john.owner@gmail.com
  ↓
Tries to verify club with SAME Aadhaar 123456789012
  ↓
❌ ERROR: "Aadhaar already registered with another account"
  ↓
😞 User frustrated - it's their OWN Aadhaar!
```

### After Fix (Allowed):
```
User: john.player@gmail.com (verified with Aadhaar 123456789012)
  ↓
Creates club owner account: john.owner@gmail.com
  ↓
Verifies club with SAME Aadhaar 123456789012
  ↓
✅ SUCCESS: "KYC verified successfully!"
  ↓
😊 User happy - can use their identity across accounts!
```

---

## Policy Justification

### Why This Makes Sense

1. **Aadhaar Design**
   - Aadhaar is a **person identifier**, not account identifier
   - Government allows using Aadhaar for multiple services
   - Same logic: Same person, multiple PCL accounts

2. **Business Flexibility**
   - Users may want separation between player/owner roles
   - Professional email for club, personal email for playing
   - Multiple clubs under same owner

3. **User Trust**
   - We verify the PERSON is legitimate (via OTP)
   - Name/DOB validation ensures they're using their own Aadhaar
   - Blocking legitimate users damages trust

4. **Cannot Detect Sharing Anyway**
   - Even with duplicate checks, we can't truly detect if two users are the same person
   - If someone shares Aadhaar maliciously, name/DOB validation will catch it
   - Manual admin review is better for suspected fraud

---

## Edge Cases

### Case 1: Person Forgets Which Account They Used
```
Problem: User has 3 emails, forgot which one they used for KYC
Solution: They can verify all 3 with same Aadhaar ✅
```

### Case 2: Person Changes Email
```
Problem: Player changes from personal to professional email
Solution: Can verify new account with same Aadhaar ✅
```

### Case 3: Person Has Multiple Clubs
```
Problem: Owner has 5 clubs, each needs verification
Solution: All clubs verified with owner's single Aadhaar ✅
```

### Case 4: Suspected Fraud (Different People)
```
Problem: Two accounts with same Aadhaar but different names
Detection: Name validation will flag mismatch
Action: Admin review, potential account suspension
```

---

## Comparison with Other Platforms

### Banking Apps
- Same Aadhaar can be linked to multiple bank accounts ✅
- Person can have savings, current, salary accounts
- All verified with same Aadhaar

### Telecom
- Same Aadhaar can register multiple SIM cards ✅
- Person may have personal, work, family numbers
- All verified with same Aadhaar

### Government Services
- Same Aadhaar used across services ✅
- PAN, Passport, Driving License, etc.
- All verified with same Aadhaar

### PCL (Our Policy)
- Same Aadhaar can verify multiple accounts ✅
- Person may have player, club owner roles
- All verified with same Aadhaar

---

## Conclusion

**Policy**: We allow the same Aadhaar to be used across multiple accounts by the same person.

**Rationale**:
- ✅ Aadhaar represents a person, not an account
- ✅ Aligns with PCL business model (dual roles)
- ✅ Matches how Aadhaar is used elsewhere
- ✅ We verify the PERSON is legitimate, not limit account usage
- ✅ Fraud detection through name/DOB validation + manual review

**Result**: Better user experience while maintaining security through OTP verification and profile validation.

---

## Files Modified

1. **Player KYC Generation**: [apps/web/src/app/api/kyc/player/generate-otp/route.ts](apps/web/src/app/api/kyc/player/generate-otp/route.ts)
   - Removed duplicate Aadhaar check
   - Added explanatory comments

2. **Club KYC Generation**: [apps/web/src/app/api/kyc/request-aadhaar-otp/route.ts](apps/web/src/app/api/kyc/request-aadhaar-otp/route.ts)
   - Removed duplicate Aadhaar check
   - Added explanatory comments

3. **Documentation**:
   - [AADHAAR_MULTI_ACCOUNT_POLICY.md](AADHAAR_MULTI_ACCOUNT_POLICY.md) (this file)
   - [FIX_DUAL_ROLE_KYC.md](FIX_DUAL_ROLE_KYC.md) (updated)
