# 🔍 Push Notification Debug Guide

**Error:** "Failed to get FCM token: AbortError: Registration failed - push service error"

## Root Cause

This error typically occurs when:
1. **Service worker is cached with bad configuration**
2. **Firebase configuration mismatch between web app and service worker**
3. **Browser blocking push service connection**
4. **Network/firewall blocking FCM endpoints**

## ✅ Fixes Applied

### 1. Enhanced Service Worker Registration
- ✅ Added complete service worker cleanup (unregisters ALL workers)
- ✅ Added `updateViaCache: 'none'` to prevent caching issues
- ✅ Added wait for service worker to be truly active before token request
- ✅ Added detailed error logging at each step

### 2. Better Error Messages
- ✅ Specific error messages for different failure types
- ✅ Console logging with emojis for easy scanning
- ✅ Stack trace capture for debugging

### 3. Service Worker Improvements
- ✅ Added try-catch for Firebase script imports
- ✅ Added try-catch for Firebase initialization
- ✅ Added console logs at every step
- ✅ Wrapped messaging handlers in existence check

## 🧪 Testing Steps

### Step 1: Clear Everything (CRITICAL)
```javascript
// Open DevTools Console and run:

// 1. Unregister all service workers
navigator.serviceWorker.getRegistrations().then(registrations => {
  registrations.forEach(reg => reg.unregister());
  console.log('✅ All service workers unregistered');
});

// 2. Clear all caches
caches.keys().then(names => {
  names.forEach(name => caches.delete(name));
  console.log('✅ All caches cleared');
});

// 3. Clear localStorage and sessionStorage
localStorage.clear();
sessionStorage.clear();
console.log('✅ Storage cleared');

// 4. Hard reload
location.reload(true);
```

### Step 2: Check Service Worker Logs
```javascript
// In DevTools Console:

// Check if service worker file loads
fetch('/firebase-messaging-sw.js')
  .then(r => r.text())
  .then(text => {
    console.log('Service worker file size:', text.length);
    console.log('Contains Firebase init:', text.includes('firebase.initializeApp'));
  });
```

### Step 3: Manual Registration Test
```javascript
// In DevTools Console:

navigator.serviceWorker.register('/firebase-messaging-sw.js', {
  scope: '/',
  updateViaCache: 'none'
})
.then(registration => {
  console.log('✅ Service worker registered:', registration);
  return navigator.serviceWorker.ready;
})
.then(() => {
  console.log('✅ Service worker is ready');
})
.catch(error => {
  console.error('❌ Registration failed:', error);
});
```

### Step 4: Check Firebase Connection
```javascript
// In DevTools Console:

// Test if Firebase scripts can be loaded
fetch('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js')
  .then(r => {
    console.log('✅ Firebase scripts accessible:', r.status === 200);
  })
  .catch(e => {
    console.error('❌ Cannot reach Firebase CDN:', e);
  });

// Test FCM endpoint
fetch('https://fcm.googleapis.com/fcm/send', { method: 'HEAD' })
  .then(r => {
    console.log('✅ FCM endpoint reachable');
  })
  .catch(e => {
    console.error('❌ FCM endpoint blocked:', e);
  });
```

## 🚀 Quick Fix Commands

### Option 1: Restart Dev Server (Recommended)
```bash
cd /Users/bineshbalan/pcl/apps/web
# Stop current dev server (Ctrl+C)
npm run dev
```

### Option 2: Hard Refresh Browser
1. Close ALL browser tabs with localhost:3000
2. Clear browser data (Cmd+Shift+Delete on Mac)
3. Check: "Cached images and files" and "Cookies and site data"
4. Click "Clear data"
5. Reopen browser and go to localhost:3000

### Option 3: Use Incognito Mode
```
1. Open Chrome/Edge in Incognito/Private mode
2. Go to http://localhost:3000
3. Test push notifications
4. No cached data interference
```

## 🔧 Advanced Debugging

### Check Service Worker Status
```javascript
// DevTools → Application → Service Workers
// Should show:
// Status: activated and is running
// Source: /firebase-messaging-sw.js
// Update on reload: checked
```

### Check Console for These Messages
```
✅ Good signs:
- [firebase-messaging-sw.js] Service worker script loaded
- [firebase-messaging-sw.js] Firebase scripts imported successfully
- [firebase-messaging-sw.js] Firebase initialized successfully
- [firebase-messaging-sw.js] Messaging instance created
- 🔄 Cleaning up old service workers...
- 📝 Registering new service worker...
- ✅ Service worker registered and ready
- 🔑 Requesting FCM token...
- ✅ FCM token obtained successfully

❌ Bad signs:
- Failed to import Firebase scripts
- Failed to initialize Firebase
- Service worker registration failed
- AbortError
- push service error
```

### Network Tab Check
```
1. Open DevTools → Network tab
2. Filter: JS
3. Look for:
   - firebase-messaging-sw.js (should be 200 OK)
   - firebase-app-compat.js (should be 200 OK)
   - firebase-messaging-compat.js (should be 200 OK)
```

## 🎯 Common Solutions

### Solution 1: Browser Blocking
```
1. Check if browser has push notifications enabled
2. Chrome: Settings → Privacy and security → Site Settings → Notifications
3. Ensure localhost:3000 is not blocked
4. Reset to default if needed
```

### Solution 2: VPN/Firewall
```
If you're using a VPN or corporate network:
1. Temporarily disable VPN
2. Check if firewall is blocking:
   - fcm.googleapis.com
   - www.gstatic.com
3. Add to allowed list if needed
```

### Solution 3: Browser Extension Interference
```
1. Disable ALL browser extensions
2. Test again
3. Re-enable one by one to find culprit
4. Common culprits:
   - Ad blockers
   - Privacy extensions
   - Content blockers
```

### Solution 4: Corrupted Browser Profile
```
1. Create new Chrome profile
2. Test in new profile
3. If it works, old profile is corrupted
4. Export bookmarks and switch to new profile
```

## 📊 Expected Behavior After Fix

### When You Click "Enable Notifications"
```
Console should show:
1. "🔄 Cleaning up old service workers..."
2. "Found X service worker(s) to unregister"
3. "✓ Unregistered service worker: ..."
4. "📝 Registering new service worker..."
5. "[firebase-messaging-sw.js] Service worker script loaded"
6. "[firebase-messaging-sw.js] Firebase scripts imported successfully"
7. "[firebase-messaging-sw.js] Firebase initialized successfully"
8. "[firebase-messaging-sw.js] Messaging instance created"
9. "✅ Service worker registered and ready"
10. "🔑 Requesting FCM token..."
11. "✅ FCM token obtained successfully"
12. "✅ Successfully subscribed to push notifications"
```

### In Supabase Dashboard
```
1. Go to Table Editor → notification_tokens
2. Should see new row with:
   - user_id: Your user ID
   - token: Long string (FCM token)
   - device_type: 'web'
   - is_active: true
   - last_used_at: Current timestamp
```

## 🔄 If Issue Persists

### Try Different Browser
```
Test in order:
1. Chrome Incognito
2. Firefox Private
3. Edge InPrivate
4. Safari Private

If it works in any browser, the issue is browser-specific.
```

### Check Firebase Console
```
1. Go to: https://console.firebase.google.com
2. Select project: pcl-professional-club-league
3. Navigate to: Cloud Messaging
4. Check if API is enabled
5. Verify Web Push certificates are configured
```

### Verify Environment Variables
```bash
cd /Users/bineshbalan/pcl/apps/web
cat .env.local | grep FIREBASE

# Should show all these:
NEXT_PUBLIC_FIREBASE_API_KEY="..."
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="..."
NEXT_PUBLIC_FIREBASE_PROJECT_ID="..."
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="..."
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="..."
NEXT_PUBLIC_FIREBASE_APP_ID="..."
NEXT_PUBLIC_FIREBASE_VAPID_KEY="..."
```

## 📝 Commit Changes

All fixes have been applied. Commit them:

```bash
cd /Users/bineshbalan/pcl
git add -A
git commit -m "fix: Enhanced push notification error handling and service worker registration

- Added unregisterAllServiceWorkers() to clean ALL workers before registration
- Added waitForServiceWorkerReady() to ensure SW is truly active
- Added updateViaCache: 'none' to prevent caching issues
- Enhanced error messages for AbortError and other FCM errors
- Added detailed console logging at every step
- Improved service worker error handling and logging
- Wrapped messaging handlers in existence check

Fixes 'Registration failed - push service error' issue"

git push origin main
```

## 🎯 Next Steps

1. **Restart dev server** (if not already done)
2. **Hard refresh browser** (Cmd+Shift+R)
3. **Clear service workers** in DevTools
4. **Try registration** again
5. **Check console** for detailed logs
6. **Report results** with console logs if still failing

---

**Need Help?** Share:
1. Full console logs (from clicking "Enable Notifications")
2. DevTools → Application → Service Workers screenshot
3. Browser name and version
4. Any VPN/firewall you're using
