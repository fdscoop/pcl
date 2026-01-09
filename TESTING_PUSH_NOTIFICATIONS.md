# 🧪 Testing Push Notifications - Complete Guide

**Date:** 9 January 2026
**APK Version:** v1.2.1-firebase-fix
**Web Server:** Running at http://localhost:3000

---

## 📱 What Was Fixed

### Firebase Configuration Issues
1. ✅ **Service Worker** - Changed from Android app ID to Web app ID
2. ✅ **Config Fallbacks** - Added fallback values for all Firebase settings
3. ✅ **Service Worker Cleanup** - Auto-unregisters old workers before registering new
4. ✅ **Error Handling** - Better logging and error messages

### Previous Issues Fixed
5. ✅ **406 Errors** - Messages now save to database
6. ✅ **Push Service Integration** - All message sending uses push notifications
7. ✅ **Permission Prompts** - Added to player and club owner dashboards

---

## 🌐 Testing on Web (localhost:3000)

### Step 1: Clear Browser Cache
```
1. Open Chrome DevTools (F12 or Cmd+Option+I)
2. Go to "Application" tab
3. Click "Service Workers" in left sidebar
4. Click "Unregister" on firebase-messaging-sw.js (if exists)
5. Click "Clear storage" in left sidebar
6. Check all boxes and click "Clear site data"
7. Close DevTools
8. Hard refresh: Cmd+Shift+R (Mac) or Ctrl+Shift+F5 (Windows)
```

### Step 2: Login and Test
```
1. Go to http://localhost:3000
2. Login as a player or club owner
3. Go to dashboard
4. Wait 3 seconds for permission prompt to appear
5. Click "Enable Notifications"
6. Grant permission when browser asks
```

### Step 3: Expected Results
✅ No "Registration failed - push service error"
✅ No "Installations: Missing App configuration value: projectId"
✅ Permission prompt appears from browser
✅ Console logs show "Service worker registered successfully"
✅ Console logs show "FCM token obtained: success"

### Step 4: Verify Token Saved
```
1. Go to Supabase Dashboard
2. Navigate to Table Editor → notification_tokens
3. Find your user_id
4. Should see entry with:
   - token: Long string (FCM token)
   - device_type: 'web'
   - is_active: true
   - last_used_at: Current timestamp
```

### Step 5: Test Message with Push
```
1. Open two browser windows/tabs
2. Window 1: Login as club owner
3. Window 2: Login as player (or vice versa)
4. Window 1: Go to Messages or Scout Players
5. Send a message to the player
6. Window 2: Should see push notification popup
```

---

## 📱 Testing on Android

### Step 1: Install New APK
```
File: ~/Downloads/PCL-app-release-v1.2.1-firebase-fix.apk
Size: 4.9 MB
Built: 9 January 2026, 16:17
```

**Install:**
```bash
# Option 1: Transfer to Android device via ADB
adb install ~/Downloads/PCL-app-release-v1.2.1-firebase-fix.apk

# Option 2: Transfer file to phone and install manually
# - Copy APK to phone via USB, email, or cloud storage
# - Open file on Android
# - Tap to install (may need to enable "Unknown sources")
```

### Step 2: First Launch
```
1. Open PCL app
2. Login as player or club owner
3. Go to dashboard
4. Wait for permission prompt (3 seconds)
5. Tap "Enable Notifications"
6. Android will ask for notification permission
7. Tap "Allow"
```

### Step 3: Expected Results
✅ Permission prompt appears
✅ Android notification permission dialog appears
✅ Token is saved to database
✅ No errors in app

### Step 4: Verify Token Saved
```
1. Go to Supabase Dashboard
2. Navigate to Table Editor → notification_tokens
3. Find your user_id
4. Should see entry with:
   - token: Long string (FCM token)
   - device_type: 'android'
   - is_active: true
   - last_used_at: Current timestamp
```

### Step 5: Test Push Notification
```
1. Keep Android app open or in background
2. On another device (web or another phone):
   - Login as club owner
   - Go to Scout Players or Messages
   - Send a message to the player
3. Android device should receive notification
4. Notification should show:
   - Title: "New message from [Club Name]"
   - Body: Message content preview
   - Tapping opens app to messages
```

---

## 🔍 Troubleshooting

### Web: Still Getting "Registration failed"

**Solution 1: Clear Everything**
```
1. Open DevTools → Application
2. Service Workers → Unregister all
3. Clear storage → Clear all
4. Close browser completely
5. Reopen and try again
```

**Solution 2: Check Console**
```
1. Open DevTools → Console
2. Look for Firebase errors
3. Check if service worker loaded
4. Verify Firebase config values
```

**Solution 3: Use Incognito Mode**
```
1. Open browser in incognito/private mode
2. Go to http://localhost:3000
3. Login and test
4. Fresh environment without cache
```

### Android: Not Receiving Notifications

**Check 1: Notification Permission**
```
Settings → Apps → PCL → Notifications → Ensure enabled
```

**Check 2: Battery Optimization**
```
Settings → Battery → Battery optimization
Find PCL → Select "Don't optimize"
```

**Check 3: Token Registration**
```
1. Check Supabase notification_tokens table
2. Verify token exists for your user_id
3. Verify device_type is 'android'
4. Verify is_active is true
```

**Check 4: Test Manually**
```
1. Go to Supabase Dashboard
2. SQL Editor → New query
3. Run test notification query (see below)
```

### Database: Token Not Saving

**Check RLS Policies:**
```sql
-- In Supabase SQL Editor
SELECT * FROM notification_tokens WHERE user_id = 'YOUR_USER_ID';
```

**If empty, check policies:**
```sql
-- Check if RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'notification_tokens';

-- Should show: rowsecurity = true
```

---

## 🧪 Test Scenarios

### Scenario 1: Club Owner → Player Message
```
1. Login as club owner (web or Android)
2. Go to Scout Players
3. Click "💬 Send Message" on a player
4. Type message and send
5. Player should receive:
   - Message in Messages tab
   - Push notification (if enabled)
   - Database entry in messages table
```

### Scenario 2: Player → Club Owner Message
```
1. Login as player (web or Android)
2. Go to Messages tab
3. Select a conversation with club owner
4. Type reply and send
5. Club owner should receive:
   - Message in Messages tab
   - Push notification (if enabled)
   - Database entry in messages table
```

### Scenario 3: Background Notifications (Android)
```
1. Open PCL app on Android
2. Enable notifications
3. Press Home button (app goes to background)
4. From another device, send message to this user
5. Android should show notification
6. Tap notification → Opens app to Messages
```

---

## 📊 Expected Database State

### After Successful Registration

**notification_tokens table:**
```
id: uuid
user_id: [your-user-id]
token: "dXw3S..." (long FCM token string)
device_type: 'web' or 'android'
device_info: { browser, os, platform, userAgent }
created_at: timestamp
last_used_at: timestamp
is_active: true
```

### After Sending Message

**messages table:**
```
id: uuid
sender_id: [sender-user-id]
sender_type: 'club_owner' or 'player'
receiver_id: [receiver-user-id]
receiver_type: 'club_owner' or 'player'
subject: "Message from [Name]"
content: "Message text"
is_read: false
created_at: timestamp
updated_at: timestamp
```

---

## 📝 Test Checklist

### Web Testing
- [ ] Service worker registers without errors
- [ ] FCM token is obtained
- [ ] Token is saved to database
- [ ] Permission prompt appears
- [ ] Browser notification permission works
- [ ] Messages send successfully
- [ ] No 406 errors in console
- [ ] Push notifications received

### Android Testing
- [ ] APK installs successfully
- [ ] App opens without crashes
- [ ] Permission prompt appears
- [ ] Android notification permission granted
- [ ] Token saved to database
- [ ] Messages send successfully
- [ ] Push notifications received in foreground
- [ ] Push notifications received in background
- [ ] Tapping notification opens app

### Both Platforms
- [ ] Messages save to database
- [ ] Messages appear in Messages tab
- [ ] Real-time message updates work
- [ ] Unread count updates
- [ ] No errors in console/logs

---

## 🚀 Success Criteria

✅ **Web:** 
- No Firebase errors
- Token registered
- Notifications work

✅ **Android:**
- APK installs
- Permissions granted
- Notifications work

✅ **Messages:**
- Save to database
- Push notifications sent
- Real-time updates work

---

## 📞 Support

**If issues persist:**
1. Check console logs
2. Verify database entries
3. Check Firebase console for errors
4. Review Supabase Edge Function logs

**Common Issues:**
- Old service worker cached → Clear cache
- Permission denied → Re-request permission
- Token not saving → Check RLS policies
- Notifications not arriving → Check FCM configuration

---

## 🎯 Ready to Test!

**Web:** http://localhost:3000 ✅ Running
**Android APK:** ~/Downloads/PCL-app-release-v1.2.1-firebase-fix.apk ✅ Ready
**Database:** notification_tokens table ✅ Ready
**Edge Function:** send-push-notification ✅ Deployed

Start testing and report any issues! 🚀
