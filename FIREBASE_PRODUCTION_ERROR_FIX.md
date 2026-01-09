# 🔧 Firebase Production Error Fix

## Error Analysis

You're getting `AbortError: Registration failed - push service error` on **production** (www.professionalclubleague.com).

### Key Observations from Console:
```
✅ FCM connectivity check passed
✅ Service worker registered and ready
❌ FCM token request fails (all 3 attempts)
```

This means:
- ✅ Network is fine
- ✅ Service worker is working
- ❌ Firebase is rejecting the token request

## Most Likely Cause: VAPID Key Not Registered in Firebase Console

The VAPID key needs to be explicitly added to your Firebase project's **Web Push certificates**.

---

## 🎯 Fix Steps

### Step 1: Verify VAPID Key in Firebase Console

1. Go to: https://console.firebase.google.com
2. Select project: **pcl-professional-club-league**
3. Click ⚙️ Settings → **Project settings**
4. Go to **Cloud Messaging** tab
5. Scroll down to **Web configuration**
6. Look for **Web Push certificates**

### Step 2: Check if Key Exists

**If you see a key pair:**
- Copy the public key
- Compare with your .env.local value
- They MUST match exactly

**Current VAPID key in .env.local:**
```
BBkiBTx3DpjcPOquqJRQQG24PRBZrBWL0hlhxcgRigdggG5coUNoqWxnaeoEqCGTiTJvwK4l5Wqj4ntS2xxIZPk
```

### Step 3A: If Key Exists but Different

1. Copy the key from Firebase Console
2. Update .env.local:
   ```bash
   NEXT_PUBLIC_FIREBASE_VAPID_KEY="<paste-key-here>"
   ```
3. Rebuild and redeploy

### Step 3B: If No Key Exists (MOST LIKELY)

1. In Firebase Console → Cloud Messaging → Web Push certificates
2. Click **Generate key pair**
3. Copy the generated public key
4. Update .env.local with this new key
5. Rebuild and redeploy

---

## 🚀 Quick Fix Commands

### Option 1: Check Current Firebase Config
```bash
# Go to Firebase Console manually and check Web Push certificates
# https://console.firebase.google.com/project/pcl-professional-club-league/settings/cloudmessaging
```

### Option 2: Regenerate Everything (If Stuck)

**In Firebase Console:**
1. Generate new Web Push certificate key pair
2. Copy the public key

**Update Code:**
```bash
cd /Users/bineshbalan/pcl/apps/web

# Update .env.local with new VAPID key
nano .env.local
# Update: NEXT_PUBLIC_FIREBASE_VAPID_KEY="<new-key>"

# Rebuild
npm run build

# Deploy to Vercel
git add .env.local
git commit -m "fix: Update VAPID key from Firebase Console"
git push origin main
```

---

## 🔍 Alternative Issue: API Key Restrictions

If VAPID key is correct, check if your Firebase API key has restrictions:

1. Go to: https://console.cloud.google.com/apis/credentials
2. Select project: **pcl-professional-club-league**
3. Find your API key: `AIzaSyARrEFN63VRJEJBVtNVEibqziegEQta7gQ`
4. Click Edit
5. Check **Application restrictions**:
   - Should be: **None** OR
   - HTTP referrers: `https://professionalclubleague.com/*` AND `https://*.vercel.app/*`
6. Check **API restrictions**:
   - Should include: **Firebase Cloud Messaging API**

---

## 🧪 Test After Fix

### Step 1: Clear Cache
```javascript
// In browser console on production
navigator.serviceWorker.getRegistrations().then(regs => {
  regs.forEach(r => r.unregister());
  console.log('✅ Cleared');
});

// Hard refresh
location.reload(true);
```

### Step 2: Try Again
1. Go to dashboard
2. Click "Enable Notifications"
3. Check console logs

### Expected Success Output:
```
✅ Service worker registered and ready
🔑 Requesting FCM token (attempt 1/3)...
✅ FCM token obtained successfully
✅ Successfully subscribed to push notifications
```

---

## 📊 Debugging Commands

### Check if VAPID Key is Valid
```javascript
// In browser console
const vapidKey = "BBkiBTx3DpjcPOquqJRQQG24PRBZrBWL0hlhxcgRigdggG5coUNoqWxnaeoEqCGTiTJvwK4l5Wqj4ntS2xxIZPk";
console.log('VAPID Key length:', vapidKey.length); // Should be 88
console.log('Starts with B:', vapidKey.startsWith('B')); // Should be true
```

### Check Service Worker Console
```
1. F12 → Application tab → Service Workers
2. Click "firebase-messaging-sw.js" 
3. Look for error messages in service worker console
```

### Get Detailed Error
```javascript
// In browser console after enabling notifications
// Look for the full error object details
```

---

## 🎯 Most Likely Solution

Based on the symptoms, I believe:

1. ❌ **VAPID key is NOT registered** in Firebase Console
2. ✅ Everything else is configured correctly

**Action:** Go to Firebase Console and generate/verify Web Push certificate.

---

## 📝 Update Code with Better Logging

I've already updated the code to log more details. After you deploy the new code, you'll see:

```javascript
❌ Failed to get FCM token: {
  name: "AbortError",
  message: "Registration failed - push service error",
  code: "messaging/...", // This will tell us the exact issue
  stack: "..."
}
```

---

## 🔄 Commit and Deploy

```bash
cd /Users/bineshbalan/pcl

# Commit the better logging
git add apps/web/src/services/pushNotificationService.ts
git add apps/web/public/firebase-messaging-sw.js
git commit -m "fix: Enhanced FCM error logging for production debugging"
git push origin main

# Wait for Vercel to deploy (auto-deploys on push)
# Check deployment: https://vercel.com/fdscoop/pcl
```

---

## ✅ Next Steps

1. **Go to Firebase Console** → Cloud Messaging → Web Push certificates
2. **Generate key pair** if none exists
3. **Update .env.local** with the correct VAPID key
4. **Redeploy** to production
5. **Test** on www.professionalclubleague.com

The error message will be much more detailed now, which will help us pinpoint the exact issue!

---

**Priority:** Check Firebase Console for Web Push certificates FIRST. That's the most common cause of this error on production.
