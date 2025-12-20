# Quick Start: KYC Verification System

## What's Built

✅ **Player KYC Upload** - Upload identity documents
✅ **Admin Review Dashboard** - Approve/reject submissions
✅ **Status Tracking** - pending → verified workflow
✅ **Secure Storage** - Private document storage
✅ **Dashboard Integration** - Shows KYC status

## Before Testing

### Run This SQL (One Time)

1. Go to: https://supabase.com/dashboard/project/uvifkmkdoiohqrdbwgzt/sql/new
2. Copy ALL content from `CREATE_KYC_SYSTEM.sql`
3. Click "Run"
4. Should see "Success"

This creates the kyc_documents table and storage bucket.

## How It Works

### Player Side

```
1. Player Dashboard
   ↓
2. Click "Start KYC Process"
   ↓
3. Upload National ID + Proof of Address
   ↓
4. Submit
   ↓
5. Status: "⏳ Under Review"
```

### Admin Side

```
1. Admin goes to /dashboard/admin/kyc
   ↓
2. See pending submissions
   ↓
3. View documents
   ↓
4. Click "Approve" or "Reject"
   ↓
5. Player status updates
```

## Testing Steps

### Test as Player

1. Log in as player
2. Go to dashboard
3. See "Start KYC Process" button
4. Click it
5. Upload:
   - National ID (required)
   - Proof of Address (required)
6. Click "Submit for Verification"
7. Dashboard now shows "⏳ Under Review"

### Test as Admin

1. Log in as admin (or create admin user)
2. Go to: `/dashboard/admin/kyc`
3. See pending submission
4. Click "View Document" to see file
5. Click "Approve"
6. Player's kyc_status → "verified"

## Required Documents

| Document | Required? |
|----------|-----------|
| National ID | ✅ Yes |
| Proof of Address | ✅ Yes |
| Others | ❌ Optional |

## File Requirements

- **Max size**: 5MB
- **Formats**: JPG, PNG, PDF
- **Quality**: Clear and readable

## Status Meanings

| Status | What It Means |
|--------|---------------|
| pending | Not started OR under review |
| verified | Approved by admin |
| rejected | Rejected (can resubmit) |

## URLs

- **Player Upload**: `/kyc/upload`
- **Admin Review**: `/dashboard/admin/kyc`
- **Player Dashboard**: `/dashboard/player`

## Common Issues

**Problem**: Can't upload files
**Fix**: Run `CREATE_KYC_SYSTEM.sql` first

**Problem**: Admin page empty
**Fix**: Make sure user.role = 'admin' in database

**Problem**: Documents not showing
**Fix**: Check Supabase Storage → kyc-documents bucket exists

## Verify It Worked

### Check Database
```sql
-- See uploaded documents
SELECT * FROM kyc_documents;

-- Check player status
SELECT email, kyc_status FROM users WHERE role = 'player';
```

### Check Storage
1. Go to Supabase Dashboard
2. Click Storage
3. Open `kyc-documents` bucket
4. See user folders with uploaded files

## Next Features

After KYC works:
1. ✅ Players get verified
2. → Scout Players (show only verified)
3. → Messaging (club contacts player)
4. → Contracts (send offers)

## Quick Reference

**Player Journey**:
Sign up → Complete profile → Upload KYC → Get verified → Appear in searches

**Admin Flow**:
Review submission → View documents → Approve/Reject → Status updates

Perfect! Your KYC system is ready to test! 🎉
