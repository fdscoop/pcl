# How to Start KYC Verification - Visual Guide

## Where to Find the KYC Verification Button

### Option 1: Player Dashboard Card (Recommended)

```
┌──────────────────────────────────────────────────────┐
│  PLAYER DASHBOARD                                    │
├──────────────────────────────────────────────────────┤
│                                                      │
│  Welcome back, John! ⚽                              │
│                                                      │
│  ┌────────────────────┐  ┌────────────────────┐    │
│  │ 📝 Update Profile  │  │ ✅ Verify Identity │    │
│  │                    │  │                    │    │
│  │ Position: Forward  │  │ Complete Aadhaar   │    │
│  │ Height: 175 cm     │  │ verification       │    │
│  │                    │  │                    │    │
│  │ [Edit Profile]     │  │ [Verify with       │    │
│  │                    │  │  Aadhaar]  👈 CLICK│    │
│  │                    │  │                    │    │
│  │                    │  │ ⚡ Instant         │    │
│  │                    │  │ verification via   │    │
│  │                    │  │ Aadhaar OTP        │    │
│  └────────────────────┘  └────────────────────┘    │
│                                                      │
└──────────────────────────────────────────────────────┘
```

**Steps:**
1. Log in as a player
2. You'll land on your dashboard automatically
3. Look for the "✅ Verify Your Identity" card (right side)
4. Click the **"Verify with Aadhaar"** button
5. You'll be taken to `/kyc/verify`

---

### Option 2: Yellow Alert Banner (If Profile Complete)

If you've completed your profile but haven't verified KYC, you'll see:

```
┌──────────────────────────────────────────────────────┐
│  ⏳ Complete KYC Verification to Become Searchable   │
├──────────────────────────────────────────────────────┤
│                                                      │
│  Complete Aadhaar verification to appear in scout   │
│  searches and receive contract offers from clubs.   │
│                                                      │
│  [Verify with Aadhaar →]  👈 CLICK THIS             │
│                                                      │
│  ⚡ Instant verification via Aadhaar OTP            │
│                                                      │
└──────────────────────────────────────────────────────┘
```

**Steps:**
1. Click the **"Verify with Aadhaar →"** button in the yellow banner
2. You'll be taken to `/kyc/verify`

---

### Option 3: Direct URL

If you can't find the button, just navigate directly:

```
http://localhost:3000/kyc/verify
```

Or in production:
```
https://your-domain.com/kyc/verify
```

---

## What Happens When You Click?

```
Player Dashboard
    ↓
Click "Verify with Aadhaar"
    ↓
Redirected to: /kyc/verify
    ↓
See KYC Verification Page
    ↓
┌──────────────────────────────────────────┐
│  KYC Verification                        │
├──────────────────────────────────────────┤
│  ℹ️ Why KYC Verification?               │
│  • Verify identity for tournaments       │
│  • Become searchable by clubs           │
│  • Receive contract offers              │
│                                          │
│  Aadhaar Number *                        │
│  [    -     -     ]                     │
│                                          │
│  [Generate OTP]                          │
│                                          │
│  🧪 Testing Mode: Enter any 12 digits   │
└──────────────────────────────────────────┘
```

---

## Button States

### Not Verified (Initial State)

```
┌────────────────────────┐
│ ✅ Verify Your Identity│
├────────────────────────┤
│ Complete Aadhaar       │
│ verification           │
│                        │
│ [Verify with Aadhaar]  │ ← Green, clickable
│                        │
│ ⚡ Instant verification│
│ via Aadhaar OTP        │
└────────────────────────┘
```

### Under Review (Pending)

```
┌────────────────────────┐
│ ✅ Verify Your Identity│
├────────────────────────┤
│ Complete Aadhaar       │
│ verification           │
│                        │
│ [⏳ Under Review]      │ ← Gray, disabled
│                        │
└────────────────────────┘
```

### Verified (Completed)

```
┌────────────────────────┐
│ ✅ Verify Your Identity│
├────────────────────────┤
│ Complete Aadhaar       │
│ verification           │
│                        │
│ [✓ Verified]           │ ← Gray, disabled
│                        │
│ Verified on 19/12/2024 │
└────────────────────────┘
```

---

## Full Flow (Step by Step)

### 1. Login
```
http://localhost:3000/auth/login
    ↓
Enter email & password
    ↓
Click "Sign In"
```

### 2. Navigate to Dashboard
```
After login, you're at:
http://localhost:3000/dashboard/player
```

### 3. Find KYC Card
```
Look at the bottom section:
"Quick Actions" → Second card → "✅ Verify Your Identity"
```

### 4. Click Button
```
Click: "Verify with Aadhaar"
```

### 5. Complete Verification
```
/kyc/verify page opens
    ↓
Enter Aadhaar: 123456789012 (testing)
    ↓
Click "Generate OTP"
    ↓
Enter OTP: 123456
    ↓
Click "Verify OTP"
    ↓
✅ Verified!
    ↓
Redirected back to dashboard
```

---

## Troubleshooting

### "I don't see the button"

**Possible causes:**

1. **Not logged in as player**
   - Solution: Make sure you're logged in with a player account (not club owner or admin)

2. **Profile not completed**
   - Solution: Complete your player profile first (upload photo, enter details)
   - Then the KYC button will appear

3. **Already verified**
   - If you see "✓ Verified" instead of a button, you're already done!

4. **Page not loaded**
   - Solution: Refresh the page (Cmd/Ctrl + R)

### "Button is disabled/grayed out"

This means one of:
- **"⏳ Under Review"** - Your KYC is pending (shouldn't happen with Aadhaar system)
- **"✓ Verified"** - You're already verified (congratulations!)

### "Button says 'Start KYC Process' and goes to /kyc/upload"

This means the dashboard wasn't updated. Check:
- Make sure you're using the latest code
- Refresh the browser with cache clear (Cmd/Ctrl + Shift + R)
- The button should say "Verify with Aadhaar" and go to `/kyc/verify`

---

## Visual Checklist

Before looking for the button, make sure:

- [ ] ✅ Database is set up (ran CREATE_PLAYERS_TABLE.sql)
- [ ] ✅ Player profile is complete (photo uploaded, all fields filled)
- [ ] ✅ Logged in as a player (not admin/club owner)
- [ ] ✅ On player dashboard (/dashboard/player)
- [ ] ✅ KYC not already verified

If all checked, you should see the "Verify with Aadhaar" button!

---

## Quick Reference

### URLs
- **Dashboard:** `/dashboard/player`
- **KYC Page:** `/kyc/verify`

### Button Location
- **Section:** Quick Actions (bottom of dashboard)
- **Card:** Second card (right side)
- **Title:** "✅ Verify Your Identity"
- **Button Text:** "Verify with Aadhaar"

### Button Colors
- **Not Verified:** Green/Blue button (clickable)
- **Pending:** Gray button (disabled)
- **Verified:** Gray button with checkmark (disabled)

---

## Still Can't Find It?

### Direct Navigation

Just type this in your browser:
```
http://localhost:3000/kyc/verify
```

You'll skip straight to the KYC verification page!

### Check Console

Open browser console (F12) and check for errors:
- If you see 400 errors, database might not be set up
- If you see 404 errors, route might not exist
- Check network tab for failed requests

---

## Screenshots Reference

**What you should see on dashboard:**

```
┌─────────────────────────────────────────────────────┐
│  PCL                                   John Doe  △   │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Welcome back, John! ⚽                             │
│  Manage your player profile, contracts, stats      │
│                                                     │
│  [Profile photo]                                   │
│                                                     │
│  ⏳ Complete KYC Verification to Become Searchable │
│  Complete Aadhaar verification to appear in scout  │
│  searches and receive contract offers.             │
│  [Verify with Aadhaar →]  👈👈👈 THIS BUTTON       │
│  ⚡ Instant verification via Aadhaar OTP          │
│                                                     │
│  ┌──────────────┐ ┌──────────────┐ ┌─────────────┐│
│  │ KYC Status   │ │ Goals/Assists│ │ Matches     ││
│  │ pending      │ │ 0 / 0        │ │ 0           ││
│  └──────────────┘ └──────────────┘ └─────────────┘│
│                                                     │
│  Quick Actions:                                    │
│  ┌────────────────┐ ┌────────────────────────────┐│
│  │ 📝 Update      │ │ ✅ Verify Your Identity    ││
│  │ Profile        │ │                            ││
│  │                │ │ [Verify with Aadhaar] 👈  ││
│  │ [Edit Profile] │ │ ⚡ Instant verification    ││
│  └────────────────┘ └────────────────────────────┘│
└─────────────────────────────────────────────────────┘
```

---

**Now you know exactly where to find the KYC verification button!** 🎯

Click "Verify with Aadhaar" and follow the simple 2-step process to get verified instantly!
