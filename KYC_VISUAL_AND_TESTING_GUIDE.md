# KYC Verification - Visual & Testing Guide

## 🎯 New User Journey

### Dashboard - Player Sees This:

```
┌─────────────────────────────────────────────────────────────┐
│  PCL Dashboard                                              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  🚨 KYC VERIFICATION REQUIRED (Mandatory)                   │
│  ├─ WITHOUT KYC:                                             │
│  │  ❌ Cannot be discovered by clubs                        │
│  │  ❌ No contract offers                                   │
│  │  ❌ Cannot participate in tournaments                    │
│  │  ❌ Cannot be registered as official player              │
│  │                                                          │
│  └─ [Learn More]  [Start Now]                              │
│                                                              │
│  OR CLICK IN QUICK ACTIONS CARD:                            │
│  ┌──────────────────────────────────────┐                   │
│  │ 🔐 Verify Your Identity (REQUIRED)   │                  │
│  ├──────────────────────────────────────┤                   │
│  │ MANDATORY: Complete Aadhaar          │                  │
│  │ verification to get discovered       │                  │
│  │                                      │                  │
│  │ [Learn More]  [Start KYC Now]       │                  │
│  │                                      │                  │
│  │ ⚡ Quick Process:                    │                  │
│  │ • 2-3 minutes                       │                  │
│  │ • Aadhaar OTP                       │                  │
│  │ • Instant approval                  │                  │
│  └──────────────────────────────────────┘                   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 📖 Step 1: View Information Page

**URL:** `http://localhost:3000/kyc/info`

Player clicks "Learn More" and sees:

```
┌─────────────────────────────────────────────────────────────┐
│  🔐 KYC Verification                                        │
│  Verify your identity to unlock professional opportunities │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ⚠️ KYC Verification is MANDATORY                           │
│  All players must complete KYC verification to participate │
│  in PCL tournaments and be discovered by clubs.             │
│                                                              │
│  🎯 Why KYC Verification?                                   │
│  ┌──────────────────────┬──────────────────────┐            │
│  │ ❌ WITHOUT KYC:      │ ✅ WITH KYC:        │            │
│  ├──────────────────────┼──────────────────────┤            │
│  │ • Cannot be found    │ • Get discovered    │            │
│  │ • No offers          │ • Receive offers    │            │
│  │ • No tournaments     │ • Join tournaments  │            │
│  │ • No registration    │ • Official status   │            │
│  │ • Limited visibility │ • Full visibility   │            │
│  └──────────────────────┴──────────────────────┘            │
│                                                              │
│  ⚡ How It Works (Simple 3 Steps)                            │
│                                                              │
│  ┌─┐                                                         │
│  │1│ Enter Aadhaar Number                                   │
│  └─┘ Provide your 12-digit Aadhaar number                  │
│      ⏱️ 30 seconds                                          │
│                                                              │
│  ┌─┐                                                         │
│  │2│ Receive OTP                                            │
│  └─┘ 6-digit OTP sent to your registered mobile             │
│      ⏱️ Instant (1 minute)                                  │
│                                                              │
│  ┌─┐                                                         │
│  │3│ Enter OTP & Verify                                     │
│  └─┘ Instant approval! You're now verified.                 │
│      ⏱️ 1-2 minutes                                         │
│                                                              │
│  ⏱️ Total time: 2-3 minutes | Instant approval              │
│                                                              │
│  🔒 Your Data is Secure                                     │
│  ├─ 🛡️ Bank-Level Encryption                               │
│  ├─ ✅ UIDAI Compliant                                      │
│  ├─ 🚫 No Data Sharing                                      │
│  └─ 📱 OTP Verification Only                                │
│                                                              │
│  ❓ Frequently Asked Questions                               │
│  ├─ Is my Aadhaar stored?                                   │
│  │  → Only verification token, not actual number            │
│  ├─ Will clubs see my Aadhaar?                              │
│  │  → No. Only "KYC Verified" badge                         │
│  ├─ How long does it take?                                  │
│  │  → 2-3 minutes. Instant verification.                    │
│  ├─ Do I need to do this again?                             │
│  │  → No, it's one-time.                                    │
│  └─ What if I don't have Aadhaar?                           │
│     → Contact support@pcl.com                               │
│                                                              │
│  ┌─────────────────────────────────────────────┐            │
│  │ Ready to Get Discovered?                    │            │
│  │ Complete KYC in 2-3 minutes and unlock      │            │
│  │ all professional opportunities              │            │
│  │                                             │            │
│  │ [Start KYC Verification Now →]              │            │
│  └─────────────────────────────────────────────┘            │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔐 Step 2: KYC Verification Form

**URL:** `http://localhost:3000/kyc/verify`

```
┌─────────────────────────────────────────────────────────────┐
│  PCL                                [Back to Dashboard]     │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  📋 KYC Verification                                        │
│  Verify your identity using Aadhaar to become searchable    │
│  by clubs                                                   │
│                                                              │
│  🎯 Why KYC Verification is MANDATORY                       │
│  ├─ Verify your identity for tournament participation      │
│  ├─ Become searchable by verified clubs in your district   │
│  ├─ Receive professional contract offers                   │
│  └─ Participate in DQL and competitive tournaments         │
│                                                              │
│  [FORM SECTION 1: Not OTP Sent]                             │
│  ┌───────────────────────────────────────────┐              │
│  │ Aadhaar Number *                          │              │
│  │ [Enter Aadhaar Number]                    │              │
│  │ Enter your 12-digit Aadhaar number        │              │
│  │                                           │              │
│  │ [Generate OTP]                            │              │
│  │                                           │              │
│  │ ℹ️ Testing Mode: This is dummy             │              │
│  │    implementation. Enter any 12-digit     │              │
│  │    number as Aadhaar. Use OTP: 123456     │              │
│  └───────────────────────────────────────────┘              │
│                                                              │
│  [FORM SECTION 2: After OTP Sent]                           │
│  ┌───────────────────────────────────────────┐              │
│  │ 📱 OTP Sent Successfully                  │              │
│  │ OTP has been sent to your mobile ending   │              │
│  │ in ****[last 4 digits]                    │              │
│  │                                           │              │
│  │ Enter OTP *                               │              │
│  │ [  0  0  0  0  0  0  ]                    │              │
│  │ Enter 6-digit OTP sent to your mobile    │              │
│  │                                           │              │
│  │ [Verify OTP] [Resend OTP]                │              │
│  │                                           │              │
│  │ ℹ️ Testing Mode: Use OTP: 123456         │              │
│  └───────────────────────────────────────────┘              │
│                                                              │
│  🔒 Your Data is Secure & Private                           │
│  Your Aadhaar details are encrypted and stored securely.    │
│  We comply with UIDAI guidelines and never share your       │
│  personal information.                                      │
│                                                              │
│  ✨ After Verification                                      │
│  ├─ Your profile will be marked as verified                 │
│  ├─ You'll become searchable by clubs in your district      │
│  ├─ Clubs can send you contract offers                      │
│  └─ You can participate in tournaments                      │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## ✅ After Successful Verification

**Dashboard shows:**

```
┌─────────────────────────────────────────────────────────────┐
│  ✅ You're All Set! Clubs Can Now Find You                  │
│                                                              │
│  ✓ Profile: Complete                                        │
│  ✓ KYC: Verified                                            │
│  ✓ Scout Status: Searchable                                 │
│  ✓ Player ID: [unique-id]                                   │
│                                                              │
│  KYC Status Card shows:                                     │
│  ┌──────────────────────────────────────┐                   │
│  │ 🔐 Verify Your Identity              │                  │
│  │ Your identity is verified            │                  │
│  │                                      │                  │
│  │ [✓ Verified (Disabled)]              │                  │
│  │                                      │                  │
│  │ Verified on: [Date]                  │                  │
│  └──────────────────────────────────────┘                   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 🧪 Testing Checklist

### Test 1: Dashboard Display
- [ ] Navigate to `/dashboard/player`
- [ ] See RED alert: "🚨 KYC VERIFICATION REQUIRED"
- [ ] See quick action card with red border
- [ ] See "Learn More" and "Start KYC Now" buttons

### Test 2: Info Page
- [ ] Click "Learn More" button
- [ ] Verify URL is `/kyc/info`
- [ ] See all sections: Why, How, Security, FAQ
- [ ] Click "Start KYC Verification Now"
- [ ] Taken to `/kyc/verify`

### Test 3: KYC Form - Generate OTP
- [ ] On `/kyc/verify` page
- [ ] See "Why KYC is MANDATORY" section
- [ ] Enter Aadhaar: `123456789012`
- [ ] Click "Generate OTP"
- [ ] See "OTP Sent Successfully" message
- [ ] OTP input appears

### Test 4: KYC Form - Verify OTP
- [ ] Enter OTP: `123456`
- [ ] Click "Verify OTP"
- [ ] See success message: "KYC Verification Successful!"
- [ ] Redirected to dashboard
- [ ] KYC status shows "✓ Verified"

### Test 5: Error Handling
- [ ] Invalid Aadhaar (less than 12 digits) → Show error
- [ ] Invalid OTP (not 123456) → Show error
- [ ] Network issues → Show error message
- [ ] User can resend OTP → OTP form resets

---

## 📱 Responsive Design

All pages are responsive and work on:
- ✅ Mobile (320px+)
- ✅ Tablet (768px+)
- ✅ Desktop (1024px+)

---

## 🎨 Color Scheme Used

- **Red (#DC2626)** - Mandatory, urgent actions
- **Blue (#2563EB)** - Primary actions, information
- **Green (#16A34A)** - Success, positive outcomes
- **Yellow (#EAB308)** - Testing mode, non-critical warnings

---

## 🚀 Next Steps After Implementation

1. **Deploy to staging** - Test with real users
2. **Monitor completion rate** - Track KYC completion
3. **Gather feedback** - Ask users if they understand KYC requirement
4. **Optimize messaging** - Adjust copy based on feedback
5. **Deploy to production** - Roll out to all players
