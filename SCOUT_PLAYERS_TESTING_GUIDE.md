# Scout Players Feature - Testing Guide

## Pre-Testing Setup

### Step 1: Create Test Players
You need at least 3-5 test players with complete profiles and KYC verification.

**For each test player:**

1. **Register as a player**
   - Email: `player1@test.com`
   - Password: Your choice
   - First Name: Test
   - Last Name: Player1

2. **Complete Player Profile** (`/profile/player/complete`)
   - Position: e.g., "Forward"
   - Jersey Number: e.g., 9
   - Height: e.g., 180 cm
   - Weight: e.g., 75 kg
   - Date of Birth: Any date
   - Nationality: "India"
   - Preferred Foot: "Right"
   - Address: "123 Main St"
   - District: "Kasaragod"
   - State: "Kerala"
   - **Upload Photo** (mandatory)

3. **Complete KYC Verification** (`/kyc/verify`)
   - Verify with Aadhaar
   - Enter test Aadhaar number
   - Confirm OTP
   - Status should become "verified"

4. **Repeat** for multiple players with different:
   - Positions (Goalkeeper, Defender, Midfielder, Forward)
   - States (Kerala, Tamil Nadu, Karnataka)
   - Names (different first/last names)

### Step 2: Register as Club Owner
1. Register new account: `club@test.com`
2. Select "Club Owner" role
3. Complete club profile with:
   - Club Name: "Test Club"
   - Club Type: "Professional"
   - Category: "Men"
   - City: "Kochi"
   - State: "Kerala"
   - Country: "India"
   - Email, Phone
   - Upload logo (optional)

## Test Cases

### Test 1: Access Scout Players Page

**Steps:**
1. Log in as club owner
2. Navigate to `/dashboard/club-owner`
3. Find "🔍 Scout Players" card
4. Click "Browse Players" button

**Expected Results:**
- ✅ Page loads without errors
- ✅ All verified players display
- ✅ Player cards show photos
- ✅ Player stats visible
- ✅ No console errors

---

### Test 2: Search Functionality

**Test 2a: Search by Player Name**
1. Go to Scout Players page
2. In search box, type: "Test" (partial match)
3. Observe results update

**Expected:**
- ✅ Only players with "Test" in name show
- ✅ Results counter updates
- ✅ Real-time filtering

**Test 2b: Search by Email**
1. Clear search box
2. Type: "player1@test.com"

**Expected:**
- ✅ Only that specific player shows

**Test 2c: Search by Player ID**
1. Clear search box
2. Type: "PCL-" (partial player ID)

**Expected:**
- ✅ Players with matching IDs show

**Test 2d: Clear Search**
1. Delete all text from search box

**Expected:**
- ✅ All players reappear
- ✅ Results counter shows total count

---

### Test 3: Position Filter

**Test 3a: Filter by Single Position**
1. Go to Scout Players
2. Select "Forward" from Position dropdown
3. Observe results

**Expected:**
- ✅ Only forward players show
- ✅ Results counter reflects count
- ✅ Cards show "Forward" in position field

**Test 3b: Multiple Positions**
1. Select "Goalkeeper"
2. Then select "Forward"

**Expected:**
- ✅ Shows only the last selected position (dropdown behavior)

**Test 3c: Reset to All**
1. Select "All Positions" from dropdown

**Expected:**
- ✅ All verified players show again

**Test 3d: Combine Search + Position Filter**
1. Type "Test" in search
2. Select "Forward" position

**Expected:**
- ✅ Shows only Test players who are forwards
- ✅ Results counter accurate

---

### Test 4: State Filter

**Test 4a: Filter by State**
1. Select "Kerala" from State dropdown

**Expected:**
- ✅ Only Kerala players show
- ✅ All have "Kerala" in state field

**Test 4b: Different State**
1. Select "Tamil Nadu"

**Expected:**
- ✅ Shows Tamil Nadu players (if any exist)

**Test 4c: Reset Filter**
1. Select "All States"

**Expected:**
- ✅ All verified players appear again

**Test 4d: Combine Position + State**
1. Select "Goalkeeper" for position
2. Select "Kerala" for state

**Expected:**
- ✅ Shows Kerala goalkeepers only
- ✅ All three filters working together

---

### Test 5: Results Counter

**Test 5a: Check Counter Accuracy**
1. Note total player count (should match all verified players)
2. Apply filters and verify counter decreases

**Test 5b: Zero Results**
1. Apply filters that match no players
   - Example: Position = "Forward" + State = "Maharashtra" (if no such players)

**Expected:**
- ✅ Counter shows "0 players found"
- ✅ Empty state message displays

---

### Test 6: Player Cards Display

**Test 6a: Player Photo**
1. Look at player cards in grid
2. Check if photos display

**Expected:**
- ✅ Photos load correctly
- ✅ If no photo: shows ⚽ emoji placeholder
- ✅ Photos are square/rounded

**Test 6b: Player Information**
1. Verify each card shows:
   - [ ] Player name
   - [ ] Player ID (PCL-YYYY-XXXXX)
   - [ ] Position
   - [ ] Nationality
   - [ ] Height (cm)
   - [ ] Weight (kg)
   - [ ] Email address

**Test 6c: Player Statistics**
1. Check stats box shows:
   - [ ] Matches played (number)
   - [ ] Goals scored (number)
   - [ ] Assists (number)

**Expected:**
- ✅ All info displays correctly
- ✅ Stats in blue box format
- ✅ Numbers align correctly

---

### Test 7: Contact Button

**Test 7a: Click Contact Player**
1. Click "Contact Player" button on any card

**Expected:**
- ✅ Currently shows alert: "Contact feature coming soon..."
- ✅ No errors in console

**Test 7b: Multiple Cards**
1. Click Contact on different players

**Expected:**
- ✅ Each shows correct player name in alert

---

### Test 8: Responsive Design

**Test 8a: Desktop View (1200px+)**
1. Open page on desktop
2. Check grid layout

**Expected:**
- ✅ 3 columns of player cards
- ✅ Filters in single row
- ✅ Full width search

**Test 8b: Tablet View (768px - 1024px)**
1. Resize browser to tablet width
2. Or use DevTools device emulation (iPad)

**Expected:**
- ✅ 2 columns of player cards
- ✅ Filters fit on one line
- ✅ No horizontal scrolling

**Test 8c: Mobile View (<768px)**
1. Resize browser to mobile width
2. Or use DevTools device emulation (iPhone)

**Expected:**
- ✅ 1 column of player cards
- ✅ Filters stack vertically
- ✅ Touch-friendly buttons
- ✅ No horizontal scrolling

---

### Test 9: Navigation

**Test 9a: Back to Dashboard**
1. Click "Back to Dashboard" button

**Expected:**
- ✅ Navigates to `/dashboard/club-owner`
- ✅ Returns to club dashboard

**Test 9b: Logo/Title Click**
1. Click PCL logo or title

**Expected:**
- ✅ Currently: no navigation (placeholder)

---

### Test 10: Performance

**Test 10a: Load Time**
1. Clear browser cache
2. Open Scout Players page
3. Check time to first content

**Expected:**
- ✅ Page loads in < 2 seconds
- ✅ Player cards appear quickly

**Test 10b: Filter Performance**
1. Apply filters and observe lag

**Expected:**
- ✅ Filters update instantly
- ✅ No noticeable delay
- ✅ Counter updates in real-time

**Test 10c: Image Loading**
1. Scroll through player cards
2. Check image load times

**Expected:**
- ✅ Images load progressively
- ✅ Emoji fallback shows immediately if no photo

---

### Test 11: Error Handling

**Test 11a: Network Error**
1. Open DevTools
2. Go to Network tab
3. Set throttling to "Offline"
4. Try to refresh page

**Expected:**
- ✅ Shows loading state initially
- ✅ Handles error gracefully

**Test 11b: Empty Results**
1. Apply filters that match zero players

**Expected:**
- ✅ Shows "No players found" message
- ✅ Suggests adjusting filters

---

### Test 12: Data Accuracy

**Test 12a: Verify Player Data**
1. Compare displayed data with database
2. Check position matches database
3. Check state matches database
4. Verify stats numbers

**Expected:**
- ✅ All data matches Supabase
- ✅ No missing fields
- ✅ Stats are accurate

**Test 12b: Only Verified Players**
1. Check that ONLY verified players show
2. Try to manually access URL for unverified player

**Expected:**
- ✅ Only KYC verified players appear
- ✅ Unverified players don't show
- ✅ is_available_for_scout = true

---

## Bug Report Template

If you find bugs, report them with:

**Title:** [Component] Issue description

**Steps to Reproduce:**
1. Step 1
2. Step 2
3. Step 3

**Expected Behavior:**
What should happen

**Actual Behavior:**
What actually happened

**Screenshots:**
(if applicable)

**Environment:**
- Browser: Chrome/Safari/Firefox/Edge
- Device: Desktop/Tablet/Mobile
- OS: macOS/Windows/iOS/Android

---

## Checklist Before Going Live

- [ ] At least 5 test players created with verified KYC
- [ ] All search functionality tested
- [ ] All filters tested individually
- [ ] All filters tested together
- [ ] Contact button works (shows alert)
- [ ] Responsive design tested (desktop, tablet, mobile)
- [ ] Images load correctly
- [ ] No console errors
- [ ] Empty state tested
- [ ] Performance acceptable
- [ ] Navigation works
- [ ] Data accuracy verified
- [ ] Error handling verified

---

## Common Issues & Solutions

### Issue: No players showing
**Solution:**
- Verify players have KYC status = "verified"
- Verify `is_available_for_scout` = true
- Check Supabase records directly

### Issue: Player photos not loading
**Solution:**
- Check image URLs in Supabase
- Verify Supabase storage bucket permissions
- Check CORS settings
- Fallback emoji should show if image missing

### Issue: Filters not working
**Solution:**
- Refresh the page
- Clear search box
- Check browser console for errors
- Verify players have the filter field (state, position)

### Issue: Slow performance
**Solution:**
- Check internet connection
- Check browser DevTools Performance tab
- Verify Supabase query performance
- Clear browser cache

---

## Contact Support

For issues or questions:
1. Check browser console for errors
2. Review Supabase logs
3. Verify database records
4. Check internet connection

---

**Last Updated:** December 20, 2025
**Feature Status:** ✅ READY FOR TESTING
