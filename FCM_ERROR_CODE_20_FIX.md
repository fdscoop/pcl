# 🔧 FCM Error Code 20 Fix - Complete Guide

## Error Details
```
Error name: AbortError
Error message: Registration failed - push service error
Error code: 20
```

**Error code 20** = `messaging/token-subscribe-failed`

This means the browser's push service rejected the subscription, almost always due to **VAPID key mismatch**.

---

## 🎯 Root Cause

The VAPID public key in your code doesn't match the one registered in Firebase Console, OR the key was regenerated but not updated in your deployment.

---

## ✅ Complete Fix - Step by Step

### Step 1: Get Fresh VAPID Key from Firebase Console

1. Open: https://console.firebase.google.com/project/pcl-professional-club-league/settings/cloudmessaging

2. Scroll to **"Web Push certificates"** section

3. **Option A - If key exists:**
   - Copy the existing public key (starts with "B", 88 characters)
   - This is your VAPID key

4. **Option B - If no key OR if you want to regenerate:**
   - Click **"Generate key pair"**
   - Copy the newly generated public key
   - **IMPORTANT:** This invalidates ALL existing tokens!

### Step 2: Update Local Environment File

```bash
cd /Users/bineshbalan/pcl/apps/web

# Edit .env.local
nano .env.local

# Find and update this line:
NEXT_PUBLIC_FIREBASE_VAPID_KEY="<paste-your-key-from-firebase-console>"

# Save: Ctrl+X, Y, Enter
```

### Step 3: Update Vercel Environment Variables

**Option A: Vercel Dashboard (Recommended)**

1. Go to: https://vercel.com/fdscoop/pcl/settings/environment-variables

2. Find `NEXT_PUBLIC_FIREBASE_VAPID_KEY`
   - If it exists: Click Edit → Update value → Save
   - If it doesn't exist: Click "Add New"

3. Set for **all environments**:
   - ✅ Production
   - ✅ Preview  
   - ✅ Development

4. Click **Save**

**Option B: Vercel CLI**

```bash
# Remove old value
vercel env rm NEXT_PUBLIC_FIREBASE_VAPID_KEY production

# Add new value
vercel env add NEXT_PUBLIC_FIREBASE_VAPID_KEY production
# Paste your key when prompted
```

### Step 4: Update Service Worker

The service worker doesn't use env variables, so if you regenerated the key, you need to update it:

```bash
cd /Users/bineshbalan/pcl/apps/web

# The service worker uses hardcoded values
# It should already have the correct key, but double-check:
cat public/firebase-messaging-sw.js | grep "1:605135281202"

# Should show:
# appId: "1:605135281202:web:1ba4184f4057b13495702b"
```

### Step 5: Commit and Deploy

```bash
cd /Users/bineshbalan/pcl

# Commit the updated .env.local
git add apps/web/.env.local
git commit -m "fix: Update VAPID key from Firebase Console"
git push origin main

# Vercel will auto-deploy
```

### Step 6: Trigger Vercel Redeploy

Even after updating env vars, you need to trigger a new deployment:

1. Go to: https://vercel.com/fdscoop/pcl/deployments
2. Click the ⋮ menu on the latest deployment
3. Click **"Redeploy"**
4. Wait for "Ready" status

### Step 7: Clear Everything and Test

```javascript
// On production site, open DevTools Console and run:

// 1. Clear service workers
navigator.serviceWorker.getRegistrations().then(regs => {
  regs.forEach(r => r.unregister());
  console.log('✅ Service workers cleared');
});

// 2. Clear caches
caches.keys().then(names => {
  names.forEach(name => caches.delete(name));
  console.log('✅ Caches cleared');
});

// 3. Hard reload
location.reload(true);
```

Then try enabling notifications again!

---

## 🔍 Verify Configuration

After the new deployment, check console logs for:

```
🔥 Firebase config loaded: {
  projectId: "pcl-professional-club-league",
  appId: "1:605135281202:web:1ba4184f4057b13495702b",
  apiKeySource: "env" or "fallback" 
}

🔑 VAPID key source: "env" or "fallback"

🔑 VAPID key check: BBkiBTx3Dp...2xxIZPk
```

**IMPORTANT:** 
- `apiKeySource` should be "env" (not "fallback")
- `VAPID key source` should be "env" (not "fallback")

If you see "fallback", it means Vercel env vars are not set!

---

## 🧪 Test Success Criteria

After fix, you should see:

```
✅ Service worker registered and ready
🔑 Requesting FCM token (attempt 1/3)...
✅ FCM token obtained successfully  ← SUCCESS!
✅ Successfully subscribed to push notifications
```

---

## 🚨 If Still Failing

### Check 1: Verify VAPID Key Format

```javascript
// In console:
const key = "BBkiBTx3DpjcPOquqJRQQG24PRBZrBWL0hlhxcgRigdggG5coUNoqWxnaeoEqCGTiTJvwK4l5Wqj4ntS2xxIZPk";

console.log('Length:', key.length); // Should be 88
console.log('Starts with B:', key.startsWith('B')); // Should be true
console.log('All valid chars:', /^[A-Za-z0-9_-]+$/.test(key)); // Should be true
```

### Check 2: Verify Authorized Domains in Firebase

1. Go to: https://console.firebase.google.com/project/pcl-professional-club-league/settings/general
2. Scroll to **"Authorized domains"**
3. Ensure these are listed:
   - `professionalclubleague.com`
   - `vercel.app` (if testing on Vercel preview URLs)
4. Add if missing: Click "Add domain"

### Check 3: Check Google Cloud Console API

1. Go to: https://console.cloud.google.com/apis/dashboard?project=pcl-professional-club-league
2. Search for "Firebase Cloud Messaging API"
3. Ensure it's **ENABLED**
4. If not: Click "Enable API"

### Check 4: Check API Key Restrictions

1. Go to: https://console.cloud.google.com/apis/credentials?project=pcl-professional-club-league
2. Find API key: `AIzaSyARrEFN63VRJEJBVtNVEibqziegEQta7gQ`
3. Click Edit
4. **Application restrictions:**
   - Set to "None" OR
   - Add: `https://professionalclubleague.com/*`
5. **API restrictions:**
   - Should include: "Firebase Cloud Messaging API"

---

## 🎯 Quick Fix Script

```bash
#!/bin/bash
# Run this to quickly update everything

cd /Users/bineshbalan/pcl/apps/web

# Get VAPID key from user
echo "Paste your VAPID key from Firebase Console:"
read VAPID_KEY

# Update .env.local
sed -i '' "s/NEXT_PUBLIC_FIREBASE_VAPID_KEY=.*/NEXT_PUBLIC_FIREBASE_VAPID_KEY=\"$VAPID_KEY\"/" .env.local

# Commit
cd /Users/bineshbalan/pcl
git add apps/web/.env.local
git commit -m "fix: Update VAPID key from Firebase Console"
git push origin main

# Update Vercel (you'll need to do this manually or use CLI)
echo "✅ Code updated and pushed"
echo "Now:"
echo "1. Update Vercel env var: vercel env rm NEXT_PUBLIC_FIREBASE_VAPID_KEY production && vercel env add NEXT_PUBLIC_FIREBASE_VAPID_KEY production"
echo "2. Redeploy: vercel --prod"
```

---

## 📊 Common Scenarios

### Scenario 1: First Time Setup
- Generate key in Firebase Console
- Add to .env.local
- Add to Vercel env vars
- Deploy

### Scenario 2: Key Regenerated
- Delete old key in Firebase Console  
- Generate new key
- Update .env.local
- Update Vercel env vars
- Redeploy
- **All existing user tokens become invalid!**

### Scenario 3: Working Locally, Not on Production
- Vercel env vars not set
- Update Vercel env vars
- Redeploy

---

## ✅ Checklist

Before marking as complete, verify:

- [ ] VAPID key copied from Firebase Console
- [ ] `.env.local` updated with correct key
- [ ] Vercel env vars updated
- [ ] Vercel redeployed
- [ ] Service workers cleared on production
- [ ] Test shows "env" (not "fallback") for VAPID source
- [ ] FCM token obtained successfully
- [ ] Push notification received

---

## 🔄 After Fixing

Once working:

1. **Test sending notification:**
   - Send message from club owner
   - Verify player receives notification

2. **Check database:**
   - Supabase → notification_tokens table
   - Should see token entries with device_type: 'web'

3. **Test on multiple browsers:**
   - Chrome ✅
   - Firefox ✅
   - Edge ✅
   - Safari ⚠️ (limited support)

---

**Most Important:** Make sure Vercel environment variables are set AND deployment is triggered after updating them!
