# Professional Contract System - Visual Guide

## 🎯 Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                   PROFESSIONAL CONTRACT SYSTEM               │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────┐
│  Player Dashboard   │
│   (Real-time       │
│   Notification)    │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────────────────────────┐
│  Contracts Page                         │
│  /dashboard/player/contracts            │
│  ├─ View all contracts                  │
│  ├─ Filter by status                    │
│  └─ 📋 View Contract Button      ──────┐
└─────────────────────────────────────────┘  │
                                             │
                                             ▼
                         ┌───────────────────────────────────────┐
                         │  Contract Viewer Page                 │
                         │  /dashboard/player/contracts/[id]/view│
                         │  └─ ProfessionalContractViewer        │
                         │     ├─ Contract Display               │
                         │     ├─ Signature Panel                │
                         │     └─ Sign Contract Button           │
                         └───────────────┬───────────────────────┘
                                         │
                         ┌───────────────┴──────────────┐
                         ▼                              ▼
                    ┌──────────┐              ┌─────────────────┐
                    │  Sign    │              │ View Signatures │
                    │ Contract │              │ (When Signed)   │
                    └────┬─────┘              └─────────────────┘
                         │
                         ▼
           ┌─────────────────────────────┐
           │  Update in Supabase         │
           │  - Set signatures           │
           │  - Update status to 'active'│
           │  - Timestamp tracking       │
           └─────────────────────────────┘
```

---

## 📊 Component Hierarchy

```
ProfessionalContractViewer
├── Header Section
│   ├── Club Logo / Icon
│   ├── Club Name
│   └── Contract Title & ID
│
├── Player Highlight
│   ├── Player Name
│   ├── Player ID
│   └── Jersey/Position
│
├── Contract Content
│   ├── Contract Parties
│   │   ├── Club Info Box
│   │   └── Player Info Box
│   │
│   ├── Contract Terms
│   │   ├── Duration
│   │   ├── Position
│   │   └── Status
│   │
│   ├── Financial Terms (Gradient)
│   │   ├── Total Value
│   │   └── Monthly Salary
│   │
│   ├── Financial Breakdown
│   │   ├── Base Compensation
│   │   └── Contract Terms
│   │
│   ├── Policy Sections
│   │   ├── General Terms & Conditions
│   │   └── 🚫 Anti-Drug Policy [RED HIGHLIGHT]
│   │
│   └── Signature Section
│       ├── Club Signature Block
│       └── Player Signature Block
│
└── Signing Panel (Conditional)
    ├── Name Input
    ├── Date Picker
    └── Sign Button
```

---

## 🔄 Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                      PLAYER VIEWS CONTRACT                   │
└─────────────────────────────────────────────────────────────┘

1. LOAD PHASE
   User clicks "View Contract"
         │
         ▼
   Load Player Auth
         │
         ▼
   Load Player Profile (Supabase)
         │
         ▼
   Load Contract by ID (Supabase)
         │
         ▼
   Load Club Info (Supabase)
         │
         ▼
   Validate Access (Player owns contract)
         │
         ├─ YES → Continue to display
         └─ NO  → Show error page


2. DISPLAY PHASE
   Contract Data
         │
         ├─ contractGenerator.formatDate()
         ├─ contractGenerator.formatCurrency()
         ├─ contractGenerator.calculateContractDuration()
         │
         ▼
   ProfessionalContractViewer Component
         │
         ├─ Render Header
         ├─ Render Financial Section
         ├─ Render Policy Sections
         ├─ Render Signature Areas
         │
         └─ Check contract status
            ├─ Pending & Unsigned → Show Sign Button
            └─ Signed → Show Signature Badges


3. SIGNING PHASE (When Player Clicks Sign)
   User enters name
         │
         ▼
   Validation (name not empty)
         │
         ▼
   Call useContractSigning.signContract()
         │
         ▼
   Supabase Update:
   - player_signature_timestamp = NOW()
   - player_signature_data = { name, timestamp, method }
   - signing_status = 'fully_signed'
   - status = 'active'
         │
         ▼
   Refresh Contract Data
         │
         ▼
   Show Updated Signature Display
   "✓ Digitally Signed by [Player]"
```

---

## 🎨 Visual Layout - Professional Contract

```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃  [LOGO] Riverside Wanderers FC                            ┃
┃         Professional Football Club                        ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

  ┌────────────────────────────────────────────────────────┐
  │  Professional Football Player Contract                │
  │  Contract ID: ABC123...                               │
  │  Date: 15 January 2025                               │
  └────────────────────────────────────────────────────────┘

████████████████████████████████████████████████████████████
█ 🆔 PLAYER: John Smith | ID: player-uuid-12345...        █
████████████████████████████████████████████████████████████

┌──────────────────────┬──────────────────────┐
│ THE CLUB             │ THE PLAYER           │
│                      │                      │
│ Riverside Wanderers  │ John Smith           │
│ Professional Club    │ Player ID: ...       │
│ Mumbai, Maharashtra  │ Position: Forward    │
│ Email: ...           │ Jersey Number: #9    │
│ Phone: ...           │                      │
└──────────────────────┴──────────────────────┘

Contract Terms
├─ Type: Professional
├─ Duration: 15 Jan 2025 to 31 Dec 2026 (24 months)
├─ Position: Forward
└─ Status: PENDING

╔══════════════════════════════════════════════════════════╗
║  FINANCIAL TERMS                                         ║
║  ₹2,400,000.00                                          ║
║  Total Contract Value | Monthly: ₹100,000              ║
╚══════════════════════════════════════════════════════════╝

Financial Breakdown
┌──────────────────────┬──────────────────────┐
│ Base Compensation    │ Terms                │
│                      │                      │
│ Monthly: ₹100,000    │ Type: Professional   │
│ Total: ₹2,400,000    │ Status: Pending      │
└──────────────────────┴──────────────────────┘

General Terms & Conditions
├─ 1. Contract Binding...
├─ 2. Medical Requirements...
├─ 3. Training & Discipline...
├─ 4. Code of Conduct...
├─ 5. Anti-Drug Policy...
└─ ...

╔══════════════════════════════════════════════════════════╗
║  🚫 ANTI-DRUG POLICY & COMPLIANCE                       ║
║  ZERO TOLERANCE POLICY: ...                             ║
║  INDIAN GOVERNMENT COMPLIANCE: ...                       ║
║  MANDATORY TESTING: ...                                  ║
║  BREACH CONSEQUENCES: ...                                ║
╚══════════════════════════════════════════════════════════╝

Contract Signatures
┌──────────────────────┬──────────────────────┐
│ Club Signature       │ Player Signature     │
│                      │                      │
│ ________________     │ ________________     │
│                      │                      │
│ River...FC           │ John Smith           │
│ Club Representative  │ Professional Player  │
└──────────────────────┴──────────────────────┘

═══════════════════════════════════════════════════════════
  Generated on 15 January 2025 | Contract ID: ABC123
  Professional Club League © 2025 | Drug-Free Sport
═══════════════════════════════════════════════════════════
```

---

## 📱 Signing Panel Layout

```
┌──────────────────────────────────────────┐
│  Sign Contract                           │
│  By signing this contract, you acknowledge
│  and accept all terms and conditions     │
└──────────────────────────────────────────┘

┌──────────────────────────────────────────┐
│ Your Name (Digital Signature)            │
│                                          │
│ ┌──────────────────────────────────────┐│
│ │ Type your full name here...        ││
│ └──────────────────────────────────────┘│
└──────────────────────────────────────────┘

┌──────────────────────────────────────────┐
│ Signing Date                             │
│                                          │
│ ┌──────────────────────────────────────┐│
│ │ 15 January 2025                    ││
│ └──────────────────────────────────────┘│
└──────────────────────────────────────────┘

┌──────────────────────────────────────────┐
│ ⚠️ Important:                            │
│ By signing this contract, you confirm   │
│ that you have read and understand all   │
│ terms, including the anti-drug policy. │
│ This signature is legally binding.      │
└──────────────────────────────────────────┘

┌──────────────────┬──────────────────────┐
│ ✓ Sign & Accept  │ Cancel               │
└──────────────────┴──────────────────────┘
```

---

## 🎯 Status Progression

```
Contract Lifecycle
────────────────

CREATION
   │
   ├─ Status: pending
   ├─ signing_status: unsigned
   ├─ Player receives notification
   └─ Player sees "View Contract" button

        │
        ▼

REVIEW PHASE
   │
   ├─ Player views contract
   ├─ Reads all terms
   ├─ Sees anti-drug policy
   └─ Can sign or reject

        │
        ├─ REJECT → Status: rejected
        │
        └─ SIGN ──┐
                  │
                  ▼

SIGNING PHASE
   │
   ├─ Player clicks "Sign Contract"
   ├─ Enters name in panel
   ├─ Confirms date
   └─ Clicks "✓ Sign & Accept Contract"

        │
        ▼

SIGNED STATE
   │
   ├─ player_signature_timestamp: NOW()
   ├─ player_signature_data: { name, timestamp }
   ├─ signing_status: fully_signed
   ├─ Status: active
   ├─ Shows "✓ Digitally Signed by John Smith"
   ├─ Timestamp displayed
   └─ Contract is now active
```

---

## 🔄 File Dependencies

```
ProfessionalContractViewer.tsx
├─ Uses: React, Next.js, Tailwind CSS
├─ Props from: [id]/view/page.tsx
├─ Imports: UI components (Button, Card, Badge)
└─ Calls: onSign callback function

[id]/view/page.tsx
├─ Uses: Next.js App Router, React
├─ Imports:
│  ├─ createClient (Supabase)
│  ├─ ProfessionalContractViewer
│  ├─ useContractSigning hook
│  └─ UI components
└─ Displays: ProfessionalContractViewer

useContractSigning.ts
├─ Uses: React hooks, Supabase
├─ Imports: contractGenerator
├─ Functions:
│  ├─ signContract
│  ├─ generateAndStoreHTML
│  ├─ fetchContractHTML
│  └─ Utilities
└─ Returns: Hook interface

contractGenerator.ts
├─ Utility functions
├─ No external dependencies (pure TS)
├─ Exports:
│  ├─ generateContractHTML
│  ├─ getDefaultPCLPolicies
│  └─ Format utilities
└─ Self-contained
```

---

## 🎨 Color Reference

### Primary Blue
```
Hex: #1e3a8a
Usage: Headers, club text, borders, professional feel
```

### Secondary Orange
```
Hex: #f97316
Usage: Player highlights, financial sections, energy
```

### Warning Red
```
Hex: #dc2626
Usage: Anti-drug policy background, warnings
```

### Success Green
```
Hex: #22c55e
Usage: Signature badges, confirmation states
```

### Neutral Gray
```
#f8fafc - Backgrounds
#e2e8f0 - Borders
#64748b - Secondary text
#334155 - Regular text
#1e293b - Primary text
```

---

## 📊 Data Model

### Contract Object
```typescript
{
  // Core
  id: "uuid",
  player_id: "uuid",
  club_id: "uuid",
  
  // Status
  status: "pending" | "active" | "rejected" | "terminated",
  signing_status: "unsigned" | "club_signed" | "fully_signed",
  
  // Dates
  contract_start_date: "2025-01-15",
  contract_end_date: "2026-12-31",
  created_at: "2025-01-15T10:30:00Z",
  
  // Signature
  club_signature_timestamp?: "2025-01-15T11:00:00Z",
  club_signature_name?: "Manager Name",
  player_signature_timestamp?: "2025-01-15T12:00:00Z",
  player_signature_data?: {
    name: "John Smith",
    timestamp: "2025-01-15T12:00:00Z",
    signedAt: "15 Jan 2025 at 12:00 PM",
    method: "digital",
    ipAddress?: "192.168.1.1"
  },
  
  // Financial
  salary_monthly?: 100000,
  position_assigned?: "Forward",
  jersey_number?: 9,
  
  // Terms
  terms_conditions?: "Text of terms",
  contract_html?: "<html>...</html>",
  
  // Relations
  clubs: {
    id: "uuid",
    club_name: "Riverside Wanderers FC",
    logo_url?: "https://...",
    city: "Mumbai",
    state: "Maharashtra",
    contact_email?: "contact@club.com",
    contact_phone?: "+91..."
  }
}
```

---

## 🔐 Security Flow

```
User Requests /dashboard/player/contracts/[id]/view
         │
         ▼
Check Authentication
├─ Valid JWT Token → Continue
└─ No Token → Redirect to login

         │
         ▼
Load Player Profile
├─ Get user_id from Auth
└─ Fetch player data

         │
         ▼
Load Contract
├─ Fetch by contract ID
└─ Validate player_id matches

         │
         ├─ Match → Show contract
         └─ No match → Show access denied

         │
         ▼
Display ProfessionalContractViewer
├─ All data validated
├─ Player can only see own contracts
└─ Signing updates are player-specific
```

---

## 📈 Performance Metrics

### Expected Load Times
- Contract page initial load: < 500ms
- Contract viewer load: < 300ms (contract in DB)
- Contract signing: < 1000ms (DB update)
- HTML generation: < 200ms (one-time)

### Database Operations
- Select contracts: 1 query
- Select clubs: 1 query
- Sign contract: 1 update query
- Fetch templates: 1 query

### Memory Usage
- ProfessionalContractViewer: ~50KB
- Contract HTML (full): ~30KB
- Component state: <10KB

---

## ✨ Feature Highlights

### For Players
✅ Beautiful contract display
✅ Easy to understand terms
✅ Clear signature process
✅ Timestamp verification
✅ Print-ready contracts

### For Clubs
✅ Professional presentation
✅ Signature tracking
✅ Status visibility
✅ Audit trail ready
✅ Compliance documented

### For Admin
✅ Template management
✅ Policy control
✅ Signature audit
✅ Status reporting
✅ Compliance verification

---

This visual guide provides a complete overview of the professional contract system architecture, data flow, and user experience.
