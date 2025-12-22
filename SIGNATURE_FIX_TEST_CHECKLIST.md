# ✅ Quick Test Checklist - Contract Signature Display Fix

## 🎯 Issue Fixed
Contract now shows "✅ Digitally signed by" when club signs, instead of showing empty lines.

---

## ✅ Testing Checklist

### Test 1: Create Contract with Club Signature ✅
- [ ] Go to Scout → Players
- [ ] Click "Create Contract"
- [ ] Fill all contract details
- [ ] **Key Step:** Fill "Club Authorized Signatory Name" and "Signatory Date"
  - Name: `John Smith, Director` (or any name)
  - Date: `21/12/2025` (or today's date)
- [ ] Click "Save Contract"
- [ ] **Expected:** Contract created successfully
- [ ] Open the contract you just created
- [ ] **Expected Result:** See:
  ```
  ✅ Digitally signed by
  [Club Name]
  Signed by: John Smith, Director
  Club Representative
  Signed on: 21/12/2025
  ```

---

### Test 2: Player Views Club-Signed Contract ✅
- [ ] Sign out as club
- [ ] Sign in as player
- [ ] Go to Player Dashboard → Contracts
- [ ] Click on the contract created in Test 1
- [ ] Scroll to "Contract Signatures" section
- [ ] **Expected Result:**
  ```
  Club Representative:
  ✅ Digitally signed by
  [Club Name]
  Signed by: [Signatory Name]
  Signed on: [Date]
  
  Professional Player:
  _________________
  [Player Name]
  Professional Player
  Awaiting signature...
  ```

---

### Test 3: Club Views Own Contract ✅
- [ ] Sign out as player
- [ ] Sign in as club owner
- [ ] Go to Club Dashboard → Contracts
- [ ] Click on the same contract
- [ ] Scroll to "Contract Signatures"
- [ ] **Expected Result:** See club signature with ✅ and player pending

---

### Test 4: Player Signs Contract ✅
- [ ] Sign back in as player
- [ ] Go to Player Dashboard → Contracts
- [ ] View the contract
- [ ] Scroll to "Contract Signatures"
- [ ] Click "Sign Contract" button
- [ ] Fill in signing details
- [ ] Click "Sign & Accept"
- [ ] **Expected Result:**
  ```
  Club Representative:
  ✅ Digitally signed by
  [Club Name]
  Signed by: [Signatory Name]
  Signed on: [Date]
  
  Professional Player:
  ✅ Digitally signed by
  [Player Name]
  Signed by: [Player Name]
  Signed on: [Today's Date]
  ```

---

### Test 5: Verify Fresh Load ✅
- [ ] After Test 4, sign out
- [ ] Sign back in
- [ ] Go to Contracts
- [ ] Open the same contract
- [ ] **Expected:** Both signatures still visible (✅ for both parties)
- [ ] **This confirms:** Not relying on stored HTML, regenerating with current data

---

## 🔍 What to Look For

### ✅ Success Indicators
- [ ] Club signature shows "✅ Digitally signed by" in green
- [ ] Club signatory name and date visible
- [ ] Player signature updates to ✅ after signing
- [ ] Player name and date visible after signing
- [ ] Signatures persist after refreshing page
- [ ] No error messages in browser console

### ❌ Problems to Watch For
- [ ] Empty signature lines (old behavior)
- [ ] Missing signatory name
- [ ] Missing signature date
- [ ] Signatures not updating after signing
- [ ] Signatures disappearing on refresh
- [ ] Console errors

---

## 📱 Browser Check

### Console Check
1. Open browser Developer Tools (F12)
2. Go to Console tab
3. While viewing contract:
   - [ ] No error messages
   - [ ] No warnings about regeneration
   - Should see: "Error regenerating HTML:" only if there's an actual error

### Network Check
1. Go to Network tab
2. Refresh contract page
3. [ ] Contract data loads
4. [ ] HTML regenerates properly
5. [ ] No failed requests

---

## 📊 Expected Database State

After Test 4, contract should have:
```sql
SELECT 
  id,
  club_signature_name,
  club_signature_timestamp,
  player_signature_timestamp,
  player_signature_data,
  contract_html
FROM contracts
WHERE id = '[contract-id]'
```

**Should show:**
- `club_signature_name`: "John Smith, Director" (or what you entered)
- `club_signature_timestamp`: "2025-12-21T..." (ISO format)
- `player_signature_timestamp`: "2025-12-22T..." (when player signed)
- `player_signature_data`: JSON with player signature details
- `contract_html`: HTML with ✅ for both signatures

---

## 🎯 Success Criteria

All tests pass if:
- ✅ Club signature displays when signed
- ✅ Shows "Digitally signed by" text
- ✅ Shows signatory name and date
- ✅ Player can see club's signature
- ✅ Player signature displays after signing
- ✅ Signatures persist on page refresh
- ✅ No console errors
- ✅ Database has all signature data

---

## 📝 Notes

### What Changed
- Contract view pages now **always regenerate HTML** with current signature data
- This ensures signatures are always current
- Falls back to stored HTML if regeneration fails

### Files Modified
1. `/apps/web/src/app/dashboard/player/contracts/[id]/view/page.tsx`
2. `/apps/web/src/app/dashboard/club-owner/contracts/[id]/view/page.tsx`

### Performance
- Minimal impact (regeneration is fast)
- Only happens when viewing contract
- Much better than stale data

---

## 🚀 Next Steps

1. **Run Test 1-5** in order
2. **Report results** - Do signatures show correctly?
3. **Check browser console** - Any errors?
4. **If all tests pass** ✅ Fix is complete!
5. **If tests fail** - Check error messages and console logs

---

## 💬 Quick Reference

**Expected after club signs:**
```
✅ Digitally signed by
Tulunadu FC
Signed by: John Smith, Director
Club Representative
Signed on: 21/12/2025
```

**Expected after player signs:**
```
✅ Digitally signed by
Tulunadu FC
Signed by: John Smith, Director
Club Representative
Signed on: 21/12/2025

✅ Digitally signed by
Binesh Balan
Signed by: Binesh Balan
Professional Player
Signed on: 22/12/2025
```

---

**Ready to test! 🎯**
