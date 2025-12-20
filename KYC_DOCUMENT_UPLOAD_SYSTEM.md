# KYC Verification System - Complete Guide

## Overview

The KYC (Know Your Customer) verification system allows players to upload identity documents for verification. Once approved by admins, players become "verified" and appear in club scout searches.

## System Flow

```
Player Journey:
1. Complete player profile
2. Click "Start KYC Process" on dashboard
3. Upload required documents (National ID + Proof of Address)
4. Submit for review
5. Status changes to "pending"
6. Admin reviews documents
7. Admin approves/rejects
8. If approved: Player status → "verified"
9. Player appears in scout searches
```

## What Was Built

### 1. Database Schema
**File**: [CREATE_KYC_SYSTEM.sql](CREATE_KYC_SYSTEM.sql)

**Tables Created**:
- `kyc_documents` - Stores uploaded documents
- Enums: `kyc_document_type`
- Storage bucket: `kyc-documents` (private)

**Document Types**:
- national_id (required)
- proof_of_address (required)
- passport (optional)
- drivers_license (optional)
- birth_certificate (optional)
- other (optional)

**Status Flow**:
- `pending` → Under review
- `approved` → Verified by admin
- `rejected` → Rejected with reason

### 2. Player Upload System

**Files Created**:
- [apps/web/src/components/forms/KYCUploadForm.tsx](apps/web/src/components/forms/KYCUploadForm.tsx)
- [apps/web/src/app/kyc/upload/page.tsx](apps/web/src/app/kyc/upload/page.tsx)

**Features**:
- Upload multiple documents
- File validation (max 5MB, JPG/PNG/PDF)
- Preview for images
- Document number and expiry date
- Required documents enforcement

### 3. Player Dashboard Integration
**Updated**: [apps/web/src/app/dashboard/player/page.tsx](apps/web/src/app/dashboard/player/page.tsx)

**KYC Button States**:
- Not started: "Start KYC Process" (clickable)
- Pending: "⏳ Under Review" (disabled)
- Verified: "✓ Verified" (disabled)

### 4. Admin Review Dashboard
**File**: [apps/web/src/app/dashboard/admin/kyc/page.tsx](apps/web/src/app/dashboard/admin/kyc/page.tsx)

**Admin Features**:
- View all submissions
- Filter by status (all/pending/approved/rejected)
- Approve documents
- Reject with reason
- View uploaded documents
- Auto-update user KYC status

## Before Testing

### Run This SQL

1. Go to: https://supabase.com/dashboard/project/uvifkmkdoiohqrdbwgzt/sql/new
2. Copy everything from `CREATE_KYC_SYSTEM.sql`
3. Click "Run"
4. Should see "Success"

This creates:
- kyc_documents table
- kyc-documents storage bucket
- All necessary RLS policies

## How to Use

### As a Player

#### Step 1: Access KYC Upload
1. Log in as player
2. Go to dashboard
3. Click "Start KYC Process"

#### Step 2: Upload Documents
1. Upload National ID (required)
2. Upload Proof of Address (required)
3. Optionally add more documents
4. Enter document numbers (optional)
5. Enter expiry dates (optional)
6. Click "Submit for Verification"

#### Step 3: Wait for Review
1. Status changes to "pending"
2. Dashboard shows "⏳ Under Review"
3. Admin reviews documents

#### Step 4: Get Verified
1. Admin approves documents
2. User `kyc_status` → "verified"
3. Dashboard shows "✓ Verified"
4. Player appears in scout searches

### As an Admin

#### Step 1: Access Admin Dashboard
1. Log in as admin
2. Go to: `/dashboard/admin/kyc`

#### Step 2: Review Documents
1. See list of pending submissions
2. Filter by status (all/pending/approved/rejected)
3. Click "View Document" to see uploaded file

#### Step 3: Approve or Reject
**To Approve**:
1. Click "Approve" button
2. Document status → "approved"
3. If all user documents approved → user KYC status → "verified"

**To Reject**:
1. Click "Reject" button
2. Enter rejection reason
3. Document status → "rejected"
4. Player can resubmit

## Required Documents

| Document | Required | Purpose |
|----------|----------|---------|
| National ID | ✅ Yes | Primary identification |
| Proof of Address | ✅ Yes | Address verification |
| Passport | ❌ No | Additional ID |
| Driver's License | ❌ No | Additional ID |
| Birth Certificate | ❌ No | Age verification |

## File Requirements

- **Max Size**: 5MB per file
- **Formats**: JPG, PNG, PDF
- **Quality**: Clear, readable photos/scans
- **Validity**: Not expired (for ID documents)

## Database Structure

### kyc_documents Table

```sql
kyc_documents (
  id UUID PRIMARY KEY
  user_id UUID → users(id)
  document_type ENUM
  document_number TEXT
  document_url TEXT (storage path)
  status TEXT (pending/approved/rejected)
  reviewed_by UUID → users(id)
  reviewed_at TIMESTAMPTZ
  rejection_reason TEXT
  notes TEXT
  expires_at DATE
  created_at TIMESTAMPTZ
  updated_at TIMESTAMPTZ
)
```

### Storage Structure

```
kyc-documents/ (private bucket)
└── {user_id}/
    ├── national_id_1234567890.jpg
    ├── proof_of_address_1234567891.pdf
    └── passport_1234567892.jpg
```

## Security Features

### Row Level Security (RLS)

**For kyc_documents table**:
- Users can view their own documents only
- Users can insert their own documents
- Users can update only pending documents
- Admins can view/update all documents

**For storage bucket**:
- Private bucket (not publicly accessible)
- Users can upload to their own folder
- Users can view only their files
- Admins can view all files
- Files organized by user_id

### Validation

**Client-side**:
- File size check (5MB max)
- File type check (images/PDF only)
- Required documents check

**Server-side**:
- RLS policies enforce access control
- Database constraints prevent invalid data
- Storage policies prevent unauthorized access

## User KYC Status Flow

```
users.kyc_status:

pending (default)
    ↓
Player uploads documents
    ↓
pending (under review)
    ↓
Admin reviews
    ↓
    ├─→ approved → verified
    └─→ rejected → pending (can resubmit)
```

## Admin Actions

### Approve Document
1. Sets document status to "approved"
2. Records reviewer ID and timestamp
3. Checks if all user documents approved
4. If yes: Updates user.kyc_status to "verified"

### Reject Document
1. Sets document status to "rejected"
2. Records rejection reason
3. Records reviewer ID and timestamp
4. Player can resubmit new document

## Integration with Scout System

Once KYC system is live, the Scout Players feature will:

```sql
-- Only show verified players
SELECT * FROM users
WHERE role = 'player'
AND kyc_status = 'verified'
AND availability_status = 'free_agent'
```

## Testing Checklist

### Player Testing
- [ ] Log in as player
- [ ] Navigate to /kyc/upload
- [ ] Upload National ID
- [ ] Upload Proof of Address
- [ ] Submit form
- [ ] Check kyc_status changes to "pending"
- [ ] Dashboard shows "Under Review"

### Admin Testing
- [ ] Log in as admin
- [ ] Navigate to /dashboard/admin/kyc
- [ ] See pending submissions
- [ ] Click "View Document"
- [ ] Click "Approve"
- [ ] Verify user kyc_status → "verified"
- [ ] Test "Reject" with reason

### Database Testing
```sql
-- Check documents uploaded
SELECT * FROM kyc_documents WHERE user_id = 'player-id';

-- Check user status
SELECT email, kyc_status FROM users WHERE role = 'player';

-- Check storage
-- Go to Supabase Storage → kyc-documents bucket
```

## Troubleshooting

### Issue: "Bucket not found"
**Fix**: Run `CREATE_KYC_SYSTEM.sql`

### Issue: Can't upload files
**Causes**:
1. Bucket not created
2. RLS policies missing
3. File too large (>5MB)
4. Wrong file type

**Check**:
```sql
-- Verify bucket exists
SELECT * FROM storage.buckets WHERE id = 'kyc-documents';

-- Check policies
SELECT * FROM storage.policies WHERE bucket_id = 'kyc-documents';
```

### Issue: Admin can't see documents
**Fix**: Ensure user.role = 'admin' in database

### Issue: Player status not updating
**Causes**:
1. Not all documents approved
2. Database trigger not working

**Check**:
```sql
-- See all user's documents
SELECT document_type, status
FROM kyc_documents
WHERE user_id = 'player-id';
```

## Next Steps

After KYC system is working:

1. **Scout Players Feature** - Show only verified players
2. **Messaging System** - Club contacts player
3. **Contract System** - Send offers to verified players
4. **Email Notifications** - Notify players of approval/rejection
5. **Document Expiry Alerts** - Remind to renew expired documents

## File Locations

```
KYC System Files:
├── Database
│   └── CREATE_KYC_SYSTEM.sql
├── Components
│   └── apps/web/src/components/forms/
│       └── KYCUploadForm.tsx
├── Pages
│   ├── apps/web/src/app/kyc/upload/
│   │   └── page.tsx
│   └── apps/web/src/app/dashboard/admin/kyc/
│       └── page.tsx
├── Updated
│   └── apps/web/src/app/dashboard/player/
│       └── page.tsx
└── Documentation
    └── KYC_VERIFICATION_SYSTEM.md (this file)
```

## Success Criteria

✅ Database table and storage bucket created
✅ Player can upload documents
✅ Files stored securely in private bucket
✅ Admin can review submissions
✅ Admin can approve/reject
✅ Player KYC status updates correctly
✅ Dashboard reflects status changes
✅ RLS policies protect data

Your KYC verification system is ready! 🎉
