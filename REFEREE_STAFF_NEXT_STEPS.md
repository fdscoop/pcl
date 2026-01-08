# ✅ SQL MIGRATIONS APPLIED - NEXT STEPS

## 🎉 COMPLETED

✅ **Database migrations applied successfully!**
- referee & staff tables enhanced
- 5 new tables created (certifications, verifications, match results)
- All indexes and RLS policies added

---

## 🚀 WHAT'S NEXT: BUILD THE FRONTEND

Now we need to create the web pages for referees and staff to use the system.

---

## 📱 APPROACH: Clone & Adapt Existing Pages

You already have a **working Stadium Owner dashboard** with:
- ✅ KYC verification (Aadhaar, PAN, Bank)
- ✅ Document upload system
- ✅ Payout tracking
- ✅ Supabase integration

**We'll clone and adapt these for referee/staff!**

---

## 🎯 PHASE 1: CREATE REFEREE DASHBOARD (Priority)

### Pages to Create:

1. **Layout** (`apps/web/src/app/dashboard/referee/layout.tsx`)
   - Navigation sidebar
   - Mobile menu
   - Already created! ✅

2. **Dashboard Home** (`apps/web/src/app/dashboard/referee/page.tsx`)
   - Stats overview
   - Quick actions
   - KYC status

3. **Profile** (`apps/web/src/app/dashboard/referee/profile/page.tsx`)
   - Bio, location, experience
   - Hourly rate
   - License details

4. **KYC Verification** (`apps/web/src/app/dashboard/referee/kyc/page.tsx`)
   - **Clone from**: `apps/web/src/app/dashboard/stadium-owner/kyc/page.tsx`
   - **Change**: Table names, document types
   - Aadhaar, PAN, Bank, Documents tabs

5. **Certifications** (`apps/web/src/app/dashboard/referee/certifications/page.tsx`)
   - Upload AIFF/State/District certificates
   - View verification status
   - Badge level display

6. **Match Invitations** (`apps/web/src/app/dashboard/referee/invitations/page.tsx`)
   - List pending invitations
   - Accept/Reject buttons
   - Show match details, hourly rate

7. **My Matches** (`apps/web/src/app/dashboard/referee/matches/page.tsx`)
   - List upcoming and past matches
   - Filter by status
   - Click to view details

8. **Match Details** (`apps/web/src/app/dashboard/referee/matches/[id]/page.tsx`)
   - Match information
   - Submit result form
   - Record events (goals, cards)

9. **Availability** (`apps/web/src/app/dashboard/referee/availability/page.tsx`)
   - Calendar view
   - Toggle available/unavailable dates
   - Save to JSONB column

10. **Payouts** (`apps/web/src/app/dashboard/referee/payouts/page.tsx`)
    - **Clone from**: `apps/web/src/app/dashboard/stadium-owner/payouts/page.tsx`
    - **Change**: Query from match_assignments table
    - Earnings summary
    - Payout history

---

## 🎯 PHASE 2: CREATE STAFF DASHBOARD

Same structure as referee, but with:
- Different role types (Match Commissioner, Medic, etc.)
- Can confirm results (if Match Commissioner)
- Can update match events (if Match Commissioner)
- Certifications are optional (not required)

---

## 🎯 PHASE 3: REUSABLE COMPONENTS

Create in `apps/web/src/components/`:

1. **RefereeCertificationUpload.tsx**
   - Similar to StadiumDocumentsVerification
   - Upload AIFF/State/District certs
   - View verification status

2. **MatchInvitationCard.tsx**
   - Display match invitation
   - Accept/Reject buttons
   - Show payout amount

3. **MatchResultForm.tsx**
   - Submit scores
   - Select winner
   - Add notes

4. **AvailabilityCalendar.tsx**
   - Calendar component
   - Toggle dates
   - Save to database

---

## 💡 RECOMMENDED ORDER

### Option A: Do It All at Once (I generate everything)
I can create all 20+ files right now with complete, production-ready code.

### Option B: Step by Step (You test as we go)
1. First: Create referee dashboard (10 files)
2. Test it works
3. Then: Create staff dashboard (10 files)
4. Finally: Setup Capacitor for mobile

### Option C: One Feature at a Time
1. Start with **KYC page** (clone stadium KYC)
2. Then **Certifications page**
3. Then **Match Invitations**
4. etc.

---

## 🎨 CLONING STRATEGY

### To Clone Stadium KYC Page:

**From**: `apps/web/src/app/dashboard/stadium-owner/kyc/page.tsx`  
**To**: `apps/web/src/app/dashboard/referee/kyc/page.tsx`

**Changes needed:**
```tsx
// Old
.from('stadium_documents_verification')

// New
.from('referee_documents_verification')
```

```tsx
// Old
const documentTypes = STADIUM_DOCUMENT_TYPES

// New
const documentTypes = REFEREE_CERTIFICATE_TYPES
```

That's it! The rest stays the same.

---

## 🚀 READY TO BUILD?

**Tell me which approach you prefer:**

**A)** "Create all referee pages now" → I'll generate 10 complete files  
**B)** "Start with KYC page" → I'll clone and adapt the stadium KYC  
**C)** "Show me one page at a time" → I'll guide you through each  
**D)** "I'll do it myself using the templates" → Use REFEREE_STAFF_CODE_TEMPLATES.md

**What would you like to do?**

