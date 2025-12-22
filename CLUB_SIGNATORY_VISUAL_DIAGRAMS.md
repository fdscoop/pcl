# Club Signatory Validation - Visual Diagrams

## 1. Form Validation Flow

```
┌─────────────────────────────────────────────────┐
│         CREATE CONTRACT FORM                    │
├─────────────────────────────────────────────────┤
│                                                 │
│  CONTRACT DETAILS SECTION                       │
│  ├─ Contract Type      [____________]  Required │
│  ├─ Start Date         [_/_/____]      Required │
│  ├─ End Date           [_/_/____]      Required │
│  └─ Annual Salary      [____________]  Required │
│                                                 │
│  FINANCIAL SECTION                              │
│  ├─ Signing Bonus      [____________]  Optional │
│  ├─ Release Clause     [____________]  Optional │
│  └─ ... more fields                             │
│                                                 │
│  ADDITIONAL SECTION                             │
│  ├─ Agent Name         [____________]  Optional │
│  ├─ Terms & Conditions [___________]  Optional │
│  └─ ... more fields                             │
│                                                 │
│  🔴 CLUB AUTHORIZED SIGNATORY * (NEW)          │
│  ├─ SIGNATURE                                   │
│  │  [  Signature Space  ]                       │
│  │                                              │
│  ├─ PRINTED NAME & TITLE *                     │
│  │  [John Smith, Director] ← Validates here   │
│  │  ⚠️ Shows error if empty                    │
│  │                                              │
│  └─ DATE *                                      │
│     [22/12/2025]  ← Validates here             │
│     ⚠️ Shows error if empty or future          │
│                                                 │
│  ┌─────────────────────────────────────────┐   │
│  │  [Create Contract]  [Cancel]            │   │
│  └─────────────────────────────────────────┘   │
│                                                 │
└─────────────────────────────────────────────────┘
```

---

## 2. Validation Decision Tree

```
                    User clicks "Create Contract"
                              │
                              ▼
                  ┌──────────────────────────┐
                  │  VALIDATION PHASE 1      │
                  │  Basic Contract Fields   │
                  └──────────────────────────┘
                              │
        ┌───────────┬─────────┬───────────┬──────────────┐
        ▼           ▼         ▼           ▼              ▼
   Type? Dates? Salary? Other? All Present?
     │       │        │         │            │
     Y       Y        Y         Y            │
     │       │        │         │            │
     └───────┴────────┴─────────┘            │
            │                                │
            ▼                                ▼
    ┌──────────────────────────────┐  ❌ ERROR
    │ VALIDATION PHASE 2  (NEW)    │     │
    │ Club Signatory Fields        │     ▼
    └──────────────────────────────┘  Show Error
            │                          Highlight
            ▼                          invalid
    Name provided? ────┐
            │          │
            Y          N
            │          │
            ▼          ▼
    Date provided? ❌ ERROR: Name required
            │          │
            Y          ▼
            │      Show red border
            │      on name field
            ▼
    Date not future?
            │
        ┌───┴───┐
        Y       N
        │       │
        ▼       ▼
    ✅ VALID  ❌ ERROR: Future date
        │         │
        │         ▼
        │     Show red border
        │     on date field
        │
        ▼
    ┌─────────────────────────┐
    │ CONTRACT CREATION       │
    ├─────────────────────────┤
    │ ✅ Create Contract      │
    │ ✅ Store Signatory Data │
    │ ✅ Show Success Message │
    │ ✅ Close Modal          │
    └─────────────────────────┘
```

---

## 3. Form State Lifecycle

```
┌─────────────────────────────────────────────────────────────┐
│                    FORM STATE LIFECYCLE                     │
└─────────────────────────────────────────────────────────────┘

[1] INITIAL STATE
    ┌─────────────────────────────┐
    │ formData:                   │
    │  clubSignatoryName: ""      │
    │  clubSignatoryDate: ""      │
    │                             │
    │ touched:                    │
    │  clubSignatoryName: false   │
    │  clubSignatoryDate: false   │
    │                             │
    │ UI: Normal input fields     │
    └─────────────────────────────┘

[2] USER FOCUSES ON FIELD
    ┌─────────────────────────────┐
    │ formData: unchanged         │
    │ touched: unchanged          │
    │                             │
    │ UI: Blue focus ring         │
    └─────────────────────────────┘

[3] USER TYPES NAME
    ┌─────────────────────────────┐
    │ formData:                   │
    │  clubSignatoryName: "John"  │
    │                             │
    │ touched: unchanged          │
    │                             │
    │ UI: Blue border (valid)     │
    └─────────────────────────────┘

[4] USER LEAVES EMPTY FIELD
    ┌─────────────────────────────┐
    │ formData:                   │
    │  clubSignatoryName: ""      │
    │                             │
    │ touched:                    │
    │  clubSignatoryName: TRUE    │
    │                             │
    │ UI: Red border + error      │
    └─────────────────────────────┘

[5] USER CORRECTS FIELD
    ┌─────────────────────────────┐
    │ formData:                   │
    │  clubSignatoryName: "John"  │
    │                             │
    │ touched: TRUE (still)       │
    │                             │
    │ UI: Blue border (valid)     │
    │     Error disappears        │
    └─────────────────────────────┘

[6] USER SUBMITS FORM
    ┌─────────────────────────────┐
    │ All fields validated        │
    │ All rules passed            │
    │                             │
    │ Contract created            │
    │ Data stored in database     │
    │ Form reset                  │
    │ Modal closed                │
    └─────────────────────────────┘
```

---

## 4. UI State Transitions

```
╔════════════════════════════════════════════════════════════════╗
║                    INPUT FIELD STATES                          ║
╚════════════════════════════════════════════════════════════════╝

EMPTY & NOT TOUCHED
┌──────────────────────────────┐
│ PRINTED NAME & TITLE         │
│ [_____________________]       │ Gray border
│                              │ Normal background
│ No error message             │
└──────────────────────────────┘

FOCUSED (Any state)
┌──────────────────────────────┐
│ PRINTED NAME & TITLE         │
│ |cursor here______________|   │ Blue border
│                              │ Blue focus ring
└──────────────────────────────┘

EMPTY & TOUCHED
┌──────────────────────────────┐
│ PRINTED NAME & TITLE         │
│ [_____________________]       │ RED border ❌
│ ⚠️ Club signatory name and    │ RED background ❌
│ title is required            │ RED error text ❌
└──────────────────────────────┘

VALID & TOUCHED
┌──────────────────────────────┐
│ PRINTED NAME & TITLE         │
│ [John Smith, Director]       │ Blue border ✅
│                              │ Normal background
│ No error message             │
└──────────────────────────────┘

ALL FIELDS VALID
┌──────────────────────────────┐
│ CLUB AUTHORIZED SIGNATORY *  │ Green checkmark
│ ✅ All requirements met      │
│                              │
│ [Create Contract] ENABLED    │
└──────────────────────────────┘

MISSING REQUIRED FIELD
┌──────────────────────────────┐
│ CLUB AUTHORIZED SIGNATORY *  │ Red X
│ ❌ Missing: Name or Date     │
│                              │
│ [Create Contract] DISABLED   │
└──────────────────────────────┘
```

---

## 5. Error Display Hierarchy

```
┌──────────────────────────────────────────────────┐
│  ERROR DISPLAYED AT MULTIPLE LEVELS              │
└──────────────────────────────────────────────────┘

LEVEL 1: INLINE FIELD ERROR
┌────────────────────────────────┐
│ PRINTED NAME & TITLE *         │
│ [_____________________]         │  ← Red border indicates error
│ ⚠️ Club signatory name and      │  ← Specific field message
│ title is required              │
└────────────────────────────────┘

LEVEL 2: FORM ALERT BOX
┌──────────────────────────────────────────────┐
│ ⚠️  Missing Signatory Information           │
│                                              │
│ Please provide the club authorized          │
│ signatory name and title                    │
│                                              │
│  [OK]                                        │
└──────────────────────────────────────────────┘

LEVEL 3: TOAST NOTIFICATION
┌──────────────────────────────────────────────┐
│ ❌  Missing Signatory Information            │
│  Please provide the club authorized          │
│  signatory name and title                    │
│  [X]                                         │
└──────────────────────────────────────────────┘
     (Top right corner, auto-dismisses)

USER CAN FIX AT ANY LEVEL:
  • Fix inline field → Error disappears
  • Dismiss toast → Can still fix form
  • Dismiss alert → Can still fix form
```

---

## 6. Contract Data Flow

```
┌────────────────────────────────────────────────────────────┐
│               CONTRACT DATA FLOW                           │
└────────────────────────────────────────────────────────────┘

USER INPUT
    │
    ├─ Contract Type: "1 Year Professional"
    ├─ Start Date: "2025-12-23"
    ├─ End Date: "2026-12-23"
    ├─ Annual Salary: "500000"
    ├─ ... other contract fields ...
    ├─ Club Signatory Name: "John Smith, Director"
    └─ Club Signatory Date: "2025-12-22"
            │
            ▼
    ┌──────────────────────────────┐
    │  FORM STATE (formData)       │
    │  clubSignatoryName: "John"   │
    │  clubSignatoryDate: "2025..."│
    └──────────────────────────────┘
            │
            ▼
    ┌──────────────────────────────┐
    │  VALIDATION CHECKS           │
    │  ✅ Name not empty           │
    │  ✅ Date provided            │
    │  ✅ Date not future          │
    └──────────────────────────────┘
            │
            ▼
    ┌──────────────────────────────┐
    │  CONTRACT OBJECT             │
    │  {                           │
    │    contract_type: "1 Year"   │
    │    start_date: "2025-12-23"  │
    │    end_date: "2026-12-23"    │
    │    annual_salary: 500000     │
    │    ...                       │
    │    club_signature_name: ..   │
    │    club_signature_timestamp: │
    │  }                           │
    └──────────────────────────────┘
            │
            ▼
    ┌──────────────────────────────┐
    │  DATABASE INSERTION          │
    │  INSERT INTO contracts       │
    │  VALUES (...)                │
    └──────────────────────────────┘
            │
            ▼
    ┌──────────────────────────────┐
    │  DATABASE STORAGE            │
    │  id: b1aee4fa-...            │
    │  club_signature_name:        │
    │    "John Smith, Director"    │
    │  club_signature_timestamp:   │
    │    "2025-12-22T00:00:00Z"    │
    │  status: "pending"           │
    └──────────────────────────────┘
            │
            ▼
    ✅ CONTRACT CREATED SUCCESSFULLY
```

---

## 7. User Journey Map

```
╔════════════════════════════════════════════════════════════════╗
║                      USER JOURNEY                              ║
╚════════════════════════════════════════════════════════════════╝

START: Scout Player Page
    │
    ▼
[Click "Create Contract" button on a player]
    │
    ▼
CREATE CONTRACT MODAL OPENS
    │
    ├─ Sees required fields marked with *
    ├─ Sees "Club Authorized Signatory *" section
    │
    ▼
USER FILLS FORM
    │
    ├─ Contract Type: [selected]
    ├─ Dates: [entered]
    ├─ Salary: [entered]
    ├─ Other fields: [optional]
    │
    ▼
USER REACHES CLUB SIGNATORY SECTION
    │
    ├─ Sees label: "Club Authorized Signatory *"
    ├─ Sees red asterisk (*) = required
    ├─ Sees "PRINTED NAME & TITLE *" with input
    ├─ Sees "DATE *" with date picker
    │
    ▼
SCENARIO A: USER LEAVES FIELDS EMPTY
    │
    ├─ Clicks "Create Contract"
    ├─ Validation runs
    ├─ Checks: Name empty? YES
    ├─ Red border appears on name field
    ├─ Error message: "⚠️ Club signatory name is required"
    ├─ Toast shows: "Missing Signatory Information"
    ├─ Contract NOT created
    │
    ▼
USER CORRECTS
    │
    ├─ Clicks on name field
    ├─ Types: "John Smith, Director"
    ├─ Field turns blue (valid)
    ├─ Error message disappears
    ├─ Clicks on date field
    ├─ Selects: 22/12/2025 (today)
    ├─ Field turns blue (valid)
    │
    ▼
[Goes to SCENARIO B]

───────────────────────────────────────────────

SCENARIO B: ALL FIELDS VALID
    │
    ├─ Clicks "Create Contract"
    ├─ Validation runs:
    │  ✅ Name: "John Smith, Director" ✓
    │  ✅ Date: "2025-12-22" ✓
    │  ✅ Not future: true ✓
    │  ✅ All contract fields valid ✓
    │
    ▼
CONTRACT CREATED SUCCESSFULLY
    │
    ├─ Green success message appears
    ├─ Toast: "Contract Created"
    ├─ Database stores:
    │   - club_signature_name: "John Smith, Director"
    │   - club_signature_timestamp: "2025-12-22T00:00:00Z"
    ├─ Form resets
    ├─ Modal closes after 1.5 seconds
    │
    ▼
RETURN TO SCOUT PAGE
    │
    ├─ Contract now visible in list
    ├─ User can share with player
    ├─ Player can sign
    │
    ▼
END: Contract workflow continues
```

---

## 8. Validation Rules Matrix

```
┌─────────────────────────────────────────────────────────────────┐
│                    VALIDATION RULES                             │
└─────────────────────────────────────────────────────────────────┘

FIELD: Club Signatory Name
├─ Rule 1: Must be provided (not empty)
├─ Rule 2: Cannot be whitespace only
├─ Rule 3: Minimum 2 characters (implicit)
│
├─ Examples:
│  ✅ "John Smith, Director" → PASS
│  ✅ "J.D." → PASS
│  ❌ "" (empty) → FAIL
│  ❌ "   " (spaces) → FAIL
│  ❌ "J" → PASS (even 1 char, but unlikely)
│
└─ Error Message:
   "⚠️ Club signatory name and title is required"

───────────────────────────────────────────────

FIELD: Club Signatory Date
├─ Rule 1: Must be provided (not empty)
├─ Rule 2: Cannot be in the future
├─ Rule 3: Format must be valid date
│
├─ Examples:
│  ✅ Today (22/12/2025) → PASS
│  ✅ Yesterday (21/12/2025) → PASS
│  ✅ Any past date → PASS
│  ❌ Tomorrow (23/12/2025) → FAIL
│  ❌ Any future date → FAIL
│  ❌ Empty field → FAIL
│
└─ Error Messages:
   "⚠️ Signature date is required"
   OR
   "Club signatory date cannot be in the future"

───────────────────────────────────────────────

VALIDATION EXECUTION
├─ ON BLUR (when user leaves field):
│  • Check if field empty
│  • Check if date in future
│  • Mark field as "touched"
│  • Show error if invalid
│
├─ ON SUBMIT (when clicking Create):
│  • Check ALL fields (basic + signatory)
│  • Mark ALL fields as touched
│  • Show specific error for first failure
│  • Prevent submission if ANY invalid
│
└─ Logic:
   if (!value || !value.trim()) → Show error
   if (date > today) → Show error
   → Cannot submit
```

---

## Summary

✅ **Clear Visual Flow** - Users understand the validation process
✅ **Multiple Error Levels** - Errors shown at field, form, and notification levels
✅ **Complete Data Flow** - From input to database storage
✅ **User Journey** - Shows both success and error scenarios
✅ **Validation Rules** - All rules documented with examples

All diagrams show why the validation exists and how it prevents problems!
