# 🏁⚽ REFEREE & STAFF COMPLETE IMPLEMENTATION GUIDE

## 📋 Overview

Complete solution for referee and staff management with:
- ✅ Profile creation and management
- ✅ KYC verification (Aadhaar, PAN, Bank Account, Documents)
- ✅ Certification management (AIFF, State FA, District, etc.)
- ✅ Match invitation acceptance/rejection
- ✅ Availability calendar management
- ✅ Match result updates (referee) and confirmation (staff)
- ✅ Match events management
- ✅ Payout tracking
- ✅ Mobile app ready (Capacitor)

---

## 🗄️ DATABASE CHANGES

### Step 1: Apply Database Migrations

```bash
# Run in Supabase SQL Editor
```

**File 1: `ENHANCE_REFEREE_STAFF_TABLES.sql`**
- Adds KYC fields to referees and staff tables
- Creates referee_certifications table
- Creates staff_certifications table  
- Creates referee_documents_verification table
- Creates staff_documents_verification table
- Creates match_result_updates table
- Enhances match_assignments with invitations

**File 2: `ADD_REFEREE_STAFF_RLS_POLICIES.sql`**
- RLS policies for all new tables
- Storage bucket policies for certifications
- Admin access policies

### Step 2: Verify Tables

```sql
-- Check new tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN (
    'referee_certifications',
    'staff_certifications', 
    'referee_documents_verification',
    'staff_documents_verification',
    'match_result_updates'
  );

-- Check referee table columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'referees' 
  AND column_name IN ('kyc_status', 'badge_level', 'hourly_rate');

-- Check staff table columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'staff' 
  AND column_name IN ('kyc_status', 'can_update_match_events');
```

---

## 📱 MOBILE APP STRUCTURE

### Referee Dashboard Pages

1. **Profile Page** - Create/Edit profile
2. **KYC Verification** - Aadhaar, PAN, Bank, Documents
3. **Certifications** - Upload AIFF/State FA/District certificates
4. **Match Invitations** - Accept/Reject match assignments
5. **My Matches** - Upcoming and past matches
6. **Match Management** - Update results, events
7. **Availability** - Set available dates
8. **Payouts** - Track earnings

### Staff Dashboard Pages

1. **Profile Page** - Create/Edit profile
2. **KYC Verification** - Aadhaar, PAN, Bank, Documents  
3. **Certifications** - Upload First Aid, Event Management, etc.
4. **Match Invitations** - Accept/Reject assignments
5. **My Matches** - Upcoming and past matches
6. **Match Management** - Confirm results, update events
7. **Availability** - Set available dates
8. **Payouts** - Track earnings

---

## 🎯 FEATURES BY ROLE

### REFEREE Features

| Feature | Description | Permission |
|---------|-------------|------------|
| Create Profile | Bio, location, experience, hourly rate | ✅ All |
| KYC Verification | Aadhaar, PAN, Bank Account | ✅ All |
| Upload Certifications | AIFF, State FA, District licenses | ✅ All |
| Accept Match Invitations | Accept/Reject with reason | ✅ KYC Verified |
| Update Availability | Set available dates | ✅ All |
| **Update Match Results** | Submit scores, winner | ✅ Assigned Referee |
| Record Match Events | Goals, cards, substitutions | ✅ Assigned Referee |
| View Payouts | Track match earnings | ✅ Bank Verified |
| Request Withdrawal | Initiate payout | ✅ Bank Verified |

### STAFF Features

| Feature | Description | Permission |
|---------|-------------|------------|
| Create Profile | Bio, role type, specialization | ✅ All |
| KYC Verification | Aadhaar, PAN, Bank Account | ✅ All |
| Upload Certifications | First Aid, Event Management, etc. | ✅ All |
| Accept Match Invitations | Accept/Reject with reason | ✅ KYC Verified |
| Update Availability | Set available dates | ✅ All |
| **Confirm Match Results** | Verify referee's results | ✅ Match Commissioner |
| Update Match Events | Add/edit goals, cards | ✅ Match Commissioner |
| View Payouts | Track match earnings | ✅ Bank Verified |
| Request Withdrawal | Initiate payout | ✅ Bank Verified |

---

## 🔐 KYC VERIFICATION FLOW

### For Both Referee & Staff

**Step 1: Aadhaar Verification**
- Enter Aadhaar number
- Request OTP
- Verify OTP
- System extracts name, address from Aadhaar
- Mark `aadhaar_verified = true`

**Step 2: PAN Verification** (Optional but recommended)
- Enter PAN number
- System validates PAN format
- Mark `pan_verified = true`

**Step 3: Bank Account Verification**
- Enter account number, IFSC, account holder name
- Creates entry in `payout_accounts` table
- Admin verifies (or auto-verify via Cashfree)
- Mark `bank_verified = true`

**Step 4: Document Verification**

**For Referee:**
- Upload at least 1 certification (REQUIRED)
- Options: AIFF License, State FA, District Certificate
- Admin verifies certification
- Updates `badge_level` based on certification
- Mark `documents_verified = true`

**For Staff:**
- Upload certifications (OPTIONAL)
- Options: First Aid, Sports Medicine, Event Management, etc.
- Admin verifies if uploaded
- Mark `documents_verified = true` (even if no certs)

**Step 5: Overall KYC Status**
```typescript
const kycVerified = 
  aadhaar_verified && 
  bank_verified && 
  documents_verified;

if (kycVerified) {
  kyc_status = 'verified'
  can_accept_matches = true
}
```

---

## 📋 CERTIFICATION TYPES

### Referee Certifications

| Type | Badge Level | Issuing Authority |
|------|-------------|-------------------|
| AIFF Referee License | AIFF | All India Football Federation |
| State FA License | State | State Football Association |
| District Certificate | District | District Football Association |
| International License | International | FIFA/AFC |

**Badge Hierarchy:**
```
International > AIFF > State > District
```

Higher badge allows officiating all lower level matches.

### Staff Certifications

| Type | Purpose |
|------|---------|
| First Aid Certificate | Medical emergencies |
| Sports Medicine | Injury assessment |
| Event Management | Match operations |
| Match Commissioner | Can confirm results, update events |
| Safety Officer | Ground safety |

---

## 🎮 MATCH INVITATION WORKFLOW

### Club Owner Creates Match
1. Selects match format (5-a-side, 7-a-side, 11-a-side)
2. System shows minimum referee/staff requirements
3. Club owner selects available referees/staff
4. Sets hourly rate for each assignment
5. Creates match with assignments

### Referee/Staff Receives Invitation
```typescript
// match_assignments table
{
  match_id: "uuid",
  referee_id: "uuid", // or staff_id
  assignment_type: "main_referee",
  invitation_status: "pending",
  invited_at: "2026-01-15T10:00:00Z",
  hourly_rate_agreed: 500,
  total_hours: 2,
  payout_amount: 1000
}
```

### Accept/Reject Flow

**Accept:**
```typescript
UPDATE match_assignments
SET 
  invitation_status = 'accepted',
  responded_at = NOW()
WHERE id = assignment_id;
```

**Reject:**
```typescript
UPDATE match_assignments
SET 
  invitation_status = 'rejected',
  responded_at = NOW(),
  rejection_reason = 'Not available on this date'
WHERE id = assignment_id;
```

### Club Owner Notifications
- Notified when referee/staff accepts
- Can find replacement if rejected
- Match cannot start until minimum requirements met

---

## ⚽ MATCH RESULT WORKFLOW

### During Match

**Referee Records Events:**
```typescript
// Insert into match_events
{
  match_id: "uuid",
  player_id: "uuid",
  event_type: "goal", // or "yellow_card", "red_card", "substitution"
  minute: 34,
  description: "Header from corner kick"
}
```

### After Match

**Step 1: Referee Submits Result**
```typescript
// Insert into match_result_updates
{
  match_id: "uuid",
  updated_by_referee_id: "uuid",
  update_type: "result_submitted",
  home_team_score: 3,
  away_team_score: 1,
  winner_team_id: "home_team_uuid",
  match_status: "completed",
  confirmed: false
}

// Update matches table
UPDATE matches
SET 
  home_team_score = 3,
  away_team_score = 1,
  winner_team_id = home_team_uuid,
  status = 'completed',
  ended_at = NOW()
WHERE id = match_id;
```

**Step 2: Staff Confirms Result** (if Match Commissioner assigned)
```typescript
// Update match_result_updates
UPDATE match_result_updates
SET 
  confirmed = true,
  confirmed_by_staff_id = staff_uuid,
  confirmed_at = NOW()
WHERE match_id = match_id
  AND update_type = 'result_submitted';

// Update match_assignments to mark payout ready
UPDATE match_assignments
SET payout_status = 'processing'
WHERE match_id = match_id
  AND invitation_status = 'accepted';
```

**Step 3: Payout Processing**
- Admin reviews payouts
- Initiates bank transfer
- Marks `payout_status = 'completed'`

---

## 📅 AVAILABILITY CALENDAR

### Set Availability

```typescript
// Update referee or staff table
{
  availability_calendar: {
    "2026-01-15": true,  // Available
    "2026-01-16": false, // Not available
    "2026-01-17": true,
    // ... more dates
  }
}
```

### Club Owner Filters
- When creating match, only shows referees/staff available on match date
- Checks `is_available = true` AND `availability_calendar[match_date] = true`

---

## 💰 PAYOUT TRACKING

### Earnings Dashboard

**Query for Referee:**
```sql
SELECT 
  ma.match_id,
  m.match_date,
  m.match_time,
  ma.hourly_rate_agreed,
  ma.total_hours,
  ma.payout_amount,
  ma.payout_status,
  t1.name as home_team,
  t2.name as away_team
FROM match_assignments ma
JOIN matches m ON m.id = ma.match_id
JOIN teams t1 ON t1.id = m.home_team_id
JOIN teams t2 ON t2.id = m.away_team_id
WHERE ma.referee_id = referee_id
  AND ma.invitation_status = 'accepted'
ORDER BY m.match_date DESC;
```

**Summary:**
```sql
SELECT 
  COUNT(*) as total_matches,
  SUM(payout_amount) as total_earnings,
  SUM(CASE WHEN payout_status = 'completed' THEN payout_amount ELSE 0 END) as paid,
  SUM(CASE WHEN payout_status = 'pending' THEN payout_amount ELSE 0 END) as pending
FROM match_assignments
WHERE referee_id = referee_id
  AND invitation_status = 'accepted';
```

---

## 🔔 NOTIFICATIONS

### Referee/Staff Should Be Notified When:

1. **Match Invitation Received**
   - "You've been invited to referee a 11-a-side match on Jan 15, 2026"
   - Shows match details, hourly rate, estimated payout
   - Action: Accept / Reject

2. **Match Reminder** (1 day before)
   - "Match reminder: You're officiating tomorrow at 3 PM"
   - Shows stadium location, teams

3. **Match Started**
   - "Match has started. You can now record events and results"

4. **Result Confirmed** (for referee when staff confirms)
   - "Your match result has been confirmed by Match Commissioner"

5. **Payout Processed**
   - "₹1,000 has been transferred to your account for match on Jan 15"

---

## 📁 FILE STRUCTURE

```
apps/web/src/
├── app/
│   └── dashboard/
│       ├── referee/
│       │   ├── layout.tsx
│       │   ├── page.tsx (Dashboard)
│       │   ├── profile/
│       │   │   └── page.tsx (Create/Edit Profile)
│       │   ├── kyc/
│       │   │   └── page.tsx (KYC Verification - 4 tabs)
│       │   ├── certifications/
│       │   │   └── page.tsx (Upload/Manage Certifications)
│       │   ├── invitations/
│       │   │   └── page.tsx (Match Invitations)
│       │   ├── matches/
│       │   │   ├── page.tsx (List matches)
│       │   │   └── [id]/
│       │   │       └── page.tsx (Match details, update result)
│       │   ├── availability/
│       │   │   └── page.tsx (Calendar)
│       │   └── payouts/
│       │       └── page.tsx (Earnings, withdrawals)
│       │
│       └── staff/
│           ├── layout.tsx
│           ├── page.tsx (Dashboard)
│           ├── profile/page.tsx
│           ├── kyc/page.tsx
│           ├── certifications/page.tsx
│           ├── invitations/page.tsx
│           ├── matches/
│           │   ├── page.tsx
│           │   └── [id]/page.tsx (Confirm results, update events)
│           ├── availability/page.tsx
│           └── payouts/page.tsx
│
├── components/
│   ├── referee/
│   │   ├── RefereeCertificationUpload.tsx
│   │   ├── RefereeDocumentsVerification.tsx
│   │   ├── MatchResultForm.tsx
│   │   ├── MatchEventRecorder.tsx
│   │   └── RefereeAvailabilityCalendar.tsx
│   │
│   └── staff/
│       ├── StaffCertificationUpload.tsx
│       ├── StaffDocumentsVerification.tsx
│       ├── MatchResultConfirmation.tsx
│       ├── MatchEventEditor.tsx
│       └── StaffAvailabilityCalendar.tsx
│
└── types/
    └── referee-staff.ts (✅ Created)
```

---

## 📱 CAPACITOR SETUP FOR MOBILE

### Install Capacitor

```bash
cd apps/web
npm install @capacitor/core @capacitor/cli
npm install @capacitor/android @capacitor/ios
npx cap init
```

### Configuration

**capacitor.config.ts:**
```typescript
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.pcl.app',
  appName: 'PCL - Premier Cricket League',
  webDir: 'out',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert']
    }
  }
};

export default config;
```

### Add Platforms

```bash
npx cap add android
npx cap add ios
```

### Build & Sync

```bash
npm run build
npx cap sync
```

### Open in Native IDE

```bash
# Android
npx cap open android

# iOS
npx cap open ios
```

---

## 🎨 COMPONENT EXAMPLES

### Match Invitation Card

```tsx
<Card>
  <CardHeader>
    <CardTitle>Match Invitation</CardTitle>
    <CardDescription>
      {match.home_team_name} vs {match.away_team_name}
    </CardDescription>
  </CardHeader>
  <CardContent>
    <div className="space-y-2">
      <p><strong>Date:</strong> {match.match_date}</p>
      <p><strong>Time:</strong> {match.match_time}</p>
      <p><strong>Stadium:</strong> {match.stadium_name}</p>
      <p><strong>Role:</strong> {assignment.assignment_type}</p>
      <p><strong>Rate:</strong> ₹{assignment.hourly_rate_agreed}/hour</p>
      <p><strong>Duration:</strong> {assignment.total_hours} hours</p>
      <p><strong>Total:</strong> ₹{assignment.payout_amount}</p>
    </div>
  </CardContent>
  <CardFooter className="flex gap-2">
    <Button onClick={handleAccept} variant="default">
      Accept
    </Button>
    <Button onClick={handleReject} variant="outline">
      Reject
    </Button>
  </CardFooter>
</Card>
```

### Match Result Form

```tsx
<form onSubmit={handleSubmitResult}>
  <div className="grid grid-cols-2 gap-4">
    <div>
      <Label>Home Team Score</Label>
      <Input type="number" min="0" value={homeScore} onChange={...} />
    </div>
    <div>
      <Label>Away Team Score</Label>
      <Input type="number" min="0" value={awayScore} onChange={...} />
    </div>
  </div>
  
  <div className="mt-4">
    <Label>Match Notes</Label>
    <Textarea placeholder="Any additional notes..." value={notes} />
  </div>
  
  <Button type="submit" className="mt-4">
    Submit Match Result
  </Button>
</form>
```

---

## 🚀 DEPLOYMENT CHECKLIST

### Database
- [ ] Run `ENHANCE_REFEREE_STAFF_TABLES.sql`
- [ ] Run `ADD_REFEREE_STAFF_RLS_POLICIES.sql`
- [ ] Verify all tables created
- [ ] Verify RLS policies active
- [ ] Create storage buckets

### Frontend
- [ ] Install Capacitor dependencies
- [ ] Create referee dashboard pages
- [ ] Create staff dashboard pages
- [ ] Create reusable components
- [ ] Add navigation
- [ ] Test on web
- [ ] Build mobile app
- [ ] Test on Android/iOS

### Testing
- [ ] Referee can create profile
- [ ] Referee can complete KYC
- [ ] Referee can upload certifications
- [ ] Referee receives match invitations
- [ ] Referee can accept/reject invitations
- [ ] Referee can update match results
- [ ] Staff can confirm match results
- [ ] Payout tracking works
- [ ] Notifications work
- [ ] Mobile app works

---

## 📞 NEXT STEPS

1. **Apply SQL migrations** in Supabase
2. **Create referee dashboard pages** (I'll provide code)
3. **Create staff dashboard pages** (I'll provide code)
4. **Setup Capacitor** for mobile
5. **Test end-to-end flow**

Ready to proceed? I can generate:
1. Complete referee dashboard pages
2. Complete staff dashboard pages
3. Reusable components
4. API integration code
5. Mobile app configuration

Which would you like me to create first?
