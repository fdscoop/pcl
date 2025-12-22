# Quick Start: Professional Contract System Setup

## 🎯 What's New

A complete professional contract display and signing system that shows contracts beautifully with digital signatures, professional formatting, and automatic PCL policy inclusion.

## ⚡ 5-Minute Setup

### Step 1: Run Database SQL (2 minutes)

Open Supabase SQL Editor and run this file:
**File:** `/ADD_CONTRACT_SIGNATURES_AND_TEMPLATES.sql`

This adds:
- 5 new columns to contracts table for signatures
- contract_templates table for policy storage
- 2 default PCL policies (anti-drug, general terms)

### Step 2: Verify Files Exist (1 minute)

Check these files are in your workspace:

```
✅ /apps/web/src/components/ProfessionalContractViewer.tsx
✅ /apps/web/src/utils/contractGenerator.ts
✅ /apps/web/src/hooks/useContractSigning.ts
✅ /apps/web/src/app/dashboard/player/contracts/[id]/view/page.tsx
✅ /apps/web/src/app/dashboard/player/contracts/page.tsx (updated)
```

### Step 3: Test the Feature (2 minutes)

1. **As Club Owner:**
   - Create a new contract for a player
   - Complete all required fields
   - Submit contract

2. **As Player:**
   - Go to dashboard
   - Click blue alert "You Have 1 New Contract Offer!"
   - Click "View Contracts"
   - Click "📋 View Contract" button
   - See professional contract display
   - Click "Sign Contract"
   - Enter your name
   - Click "✓ Sign & Accept Contract"
   - See signature appear with timestamp

## 🎨 What Players See

### Contract Viewer Page
- Professional HTML document
- Club logo and branding
- Player information highlighted
- Complete contract terms
- Financial breakdown
- **Anti-Drug Policy** (prominent red section)
- General terms & conditions
- Signature areas
- Print button

### Signing Panel
- Name input field
- Date picker
- Confirmation message
- "Sign & Accept Contract" button
- Signature stored immediately

## 📊 Database Changes

**New columns on contracts table:**
```
- club_signature_timestamp (when club signed)
- player_signature_timestamp (when player signed)
- player_signature_data (JSON with signature details)
- contract_html (stored professional HTML)
- signing_status ('unsigned', 'club_signed', 'fully_signed')
```

**New contract_templates table:**
```
- Stores reusable policy templates
- Pre-loaded with PCL defaults
- Anti-drug and general terms included
```

## 🔄 Player Flow

```
Dashboard (Blue Alert)
    ↓
View Contracts Page
    ↓
Click "📋 View Contract"
    ↓
Professional Contract Viewer
    ├─ View all terms and policies
    └─ Sign Contract → Signature stored
```

## 🚀 Features Included

### Professional Display
✅ Club logo and branding
✅ Player information highlighting
✅ Financial terms gradient background
✅ Professional typography and spacing
✅ Print-ready formatting
✅ Responsive design

### Signing System
✅ Digital signature capture
✅ Automatic status updates
✅ Timestamp tracking
✅ Signature data storage (JSON)
✅ Already-signed indicator with badge

### Compliance
✅ Anti-drug policy (red highlight)
✅ General terms & conditions
✅ Government of India compliance
✅ Medical requirements
✅ Code of conduct
✅ Termination clauses

### Auto-Loading
✅ Default PCL policies auto-populated
✅ Professional HTML auto-generated
✅ Template system ready
✅ Policy versions tracked

## 📱 UI Updates

### Player Contracts Page
- Added blue "📋 View Contract" button
- Available on all contracts
- Navigates to professional viewer
- Print functionality available

### Contract Viewer Page
- Sticky navigation bar
- Back button
- Print button
- All Contracts navigation
- Error handling
- Loading states

## ✨ Design Highlights

### Header
- Club logo (if available)
- Club name and type
- Contract ID
- Creation date

### Financial Section
- Large gradient background (blue → orange)
- Total contract value prominent
- Monthly salary clear
- Professional currency formatting

### Anti-Drug Policy
- **Bright red background** - demands attention
- Yellow triangle warning icon
- Prominent placement
- Government compliance noted
- Zero-tolerance clearly stated

### Signature Areas
- Club signature block
- Player signature block
- Digital signature badges (when signed)
- Timestamps
- Professional borders

## 🔐 Security

✅ Players can only view own contracts
✅ Signature validation before signing
✅ Cannot re-sign already signed contracts
✅ Timestamp and IP tracking available
✅ RLS policies enforce access control

## 🧪 Testing Checklist

- [ ] Database SQL executed
- [ ] Create test contract as club
- [ ] Login as player
- [ ] See blue alert on dashboard
- [ ] Navigate to contracts page
- [ ] Click "View Contract"
- [ ] Verify professional display
- [ ] Sign contract with name
- [ ] Verify signature timestamp appears
- [ ] Verify status changes to 'active'
- [ ] Print contract (click print button)
- [ ] Back navigation works

## 🐛 Troubleshooting

**Contract not loading?**
- Run `ADD_CONTRACT_SIGNATURES_AND_TEMPLATES.sql`
- Run `FIX_CLUBS_RLS_FOR_CONTRACTS.sql` (if not done)
- Check player has own contract

**Signing fails?**
- Ensure contract status is 'pending'
- Check `signing_status` is 'unsigned'
- Verify database columns were added

**Professional viewer not showing?**
- Verify all 3 new files exist
- Check imports are correct
- Ensure hook is being called
- Test in browser console

## 📞 Quick Reference

**View a Contract:**
```
1. Dashboard → Contracts
2. Click "📋 View Contract"
3. See professional HTML display
```

**Sign a Contract:**
```
1. Professional viewer opens
2. Click "Sign Contract"
3. Enter name
4. Click "✓ Sign & Accept Contract"
5. Signature stored with timestamp
```

**Print a Contract:**
```
1. In professional viewer
2. Click "🖨️ Print" button
3. Choose print options
4. Print professional PDF
```

## 🎯 Next Features (Future)

- PDF download of signed contracts
- Email contract to player
- Contract amendment workflow
- Multi-stage signing (club, player, witness)
- Contract expiration alerts
- Renewal contract proposals
- Contract history/archive

## ✅ Completion Status

**Code:** 100% Complete
**Database Schema:** Added (pending SQL execution)
**Testing:** Ready for manual testing
**Documentation:** Complete

---

**All files created and ready to use!** 🎉

Just run the SQL file and start testing.
