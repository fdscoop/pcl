# 🔔 Push Notifications Setup Guide

Firebase Cloud Messaging (FCM) has been integrated into your PCL app. Follow these steps to complete the setup.

---

## ✅ What's Already Done

1. ✅ Firebase SDK installed (`firebase` v12.7.0)
2. ✅ Firebase configuration created ([src/lib/firebase/config.ts](apps/web/src/lib/firebase/config.ts))
3. ✅ Service worker created ([public/firebase-messaging-sw.js](apps/web/public/firebase-messaging-sw.js))
4. ✅ Push notification service built ([src/services/pushNotificationService.ts](apps/web/src/services/pushNotificationService.ts))
5. ✅ Supabase Edge Function created ([supabase/functions/send-push-notification/index.ts](supabase/functions/send-push-notification/index.ts))
6. ✅ Client service for sending push ([src/services/sendPushNotification.ts](apps/web/src/services/sendPushNotification.ts))
7. ✅ Message service with push integration ([src/services/messageServiceWithPush.ts](apps/web/src/services/messageServiceWithPush.ts))
8. ✅ Notification permission prompt component ([src/components/PushNotificationPrompt.tsx](apps/web/src/components/PushNotificationPrompt.tsx))
9. ✅ Database migration created ([CREATE_NOTIFICATION_TOKENS_TABLE.sql](CREATE_NOTIFICATION_TOKENS_TABLE.sql))
10. ✅ Environment variables configured ([.env.local](apps/web/.env.local))

---

## 🚨 REQUIRED: Complete These Steps

### Step 1: Get FCM Server Key

**YOU MUST DO THIS:**

1. Go to Firebase Console: https://console.firebase.google.com/project/pcl-professional-club-league/settings/cloudmessaging

2. Look for **"Cloud Messaging API (Legacy)"** section

3. Copy the **"Server key"** (starts with `AAAAxxxxxxx:APxxxxxxxxxxxxxxx`)

4. Update [.env.local](apps/web/.env.local) line 38:
   ```bash
   FCM_SERVER_KEY="YOUR_ACTUAL_SERVER_KEY_HERE"
   ```

⚠️ **Without this, push notifications WILL NOT work!**

---

### Step 2: Create Database Table

Run this SQL in your Supabase SQL Editor:

1. Go to: https://supabase.com/dashboard/project/uvifkmkdoiohqrdbwgzt/sql

2. Paste the contents of [CREATE_NOTIFICATION_TOKENS_TABLE.sql](CREATE_NOTIFICATION_TOKENS_TABLE.sql)

3. Click "Run" to create the `notification_tokens` table

---

### Step 3: Deploy Supabase Edge Function

Deploy the push notification Edge Function:

```bash
cd /Users/bineshbalan/pcl

# Login to Supabase (if not already)
npx supabase login

# Link your project (if not already linked)
npx supabase link --project-ref uvifkmkdoiohqrdbwgzt

# Deploy the function
npx supabase functions deploy send-push-notification --no-verify-jwt

# Set the FCM_SERVER_KEY secret
npx supabase secrets set FCM_SERVER_KEY="YOUR_ACTUAL_SERVER_KEY_HERE"
```

---

### Step 4: Add Permission Prompt to Your App

Add the `PushNotificationPrompt` component to your dashboard layouts:

#### For Club Owner Dashboard:

Edit [apps/web/src/app/dashboard/club-owner/layout.tsx](apps/web/src/app/dashboard/club-owner/layout.tsx):

```typescript
import PushNotificationPrompt from '@/components/PushNotificationPrompt'

export default function ClubOwnerLayout({ children }) {
  return (
    <div>
      {children}
      <PushNotificationPrompt />
    </div>
  )
}
```

#### For Player Dashboard:

Edit [apps/web/src/app/dashboard/player/layout.tsx](apps/web/src/app/dashboard/player/layout.tsx):

```typescript
import PushNotificationPrompt from '@/components/PushNotificationPrompt'

export default function PlayerLayout({ children }) {
  return (
    <div>
      {children}
      <PushNotificationPrompt />
    </div>
  )
}
```

---

### Step 5: Update Message Sending to Use Push

Replace your current message sending with the push-enabled version:

#### In [apps/web/src/app/dashboard/club-owner/messages/page.tsx](apps/web/src/app/dashboard/club-owner/messages/page.tsx):

Change line 17:
```typescript
// OLD:
import { sendMessage } from '@/services/messageService'

// NEW:
import { sendMessageWithPush as sendMessage } from '@/services/messageServiceWithPush'
```

#### In [apps/web/src/app/dashboard/player/messages/page.tsx](apps/web/src/app/dashboard/player/messages/page.tsx):

Same change as above.

---

## 🎯 How It Works

### User Flow:

1. **User logs in** → After 3 seconds, sees permission prompt
2. **User clicks "Enable"** → Browser asks for notification permission
3. **User grants permission** → FCM token saved to database
4. **Someone sends message** → Push notification sent automatically
5. **User receives notification** → Even when app is closed!

### Technical Flow:

```
Message Sent → Database Insert → Edge Function Called → FCM API
                                                            ↓
User Device ← Push Notification ← FCM Service ← FCM Token
```

---

## 📱 Testing Push Notifications

### Test 1: Browser Notification Permission

```typescript
// Open browser console on your site
await Notification.requestPermission()
// Should show browser prompt
```

### Test 2: Subscribe to Notifications

```typescript
// In browser console
import { subscribeToNotifications } from '@/services/pushNotificationService'

// Get your user ID from Supabase
const userId = 'your-user-id-here'

// Subscribe
const result = await subscribeToNotifications(userId)
console.log(result)
// Should return: { success: true, token: "..." }
```

### Test 3: Send a Test Push

```typescript
// In browser console or from your app
import { sendPushToUser } from '@/services/sendPushNotification'

await sendPushToUser(
  'receiver-user-id',
  'Test Notification',
  'This is a test message',
  '/dashboard'
)
```

### Test 4: Send a Real Message

1. Log in as Club Owner
2. Go to Messages page
3. Send a message to a player
4. Player should receive push notification (even if app is closed)

---

## 🔧 Troubleshooting

### Issue: "FCM_SERVER_KEY not configured"

**Solution:** Complete Step 1 above. The server key MUST be added to your environment variables.

### Issue: "Firebase messaging not supported"

**Solution:**
- Check that you're using HTTPS (not HTTP)
- Try Chrome or Firefox (Safari has limited support)
- Check browser console for specific errors

### Issue: "Permission denied"

**Solution:**
- User must click "Allow" when browser asks
- If previously denied, user must manually enable in browser settings:
  - Chrome: Settings → Privacy → Site Settings → Notifications
  - Firefox: Preferences → Privacy & Security → Permissions → Notifications

### Issue: "Token not saved to database"

**Solution:**
- Check that you ran the SQL migration (Step 2)
- Check browser console for database errors
- Verify RLS policies allow inserting tokens

### Issue: "Notifications not received"

**Solution:**
1. Check that FCM_SERVER_KEY is correctly set
2. Verify Edge Function is deployed
3. Check Supabase Function logs for errors
4. Test with browser open first (should work in foreground)
5. Then test with browser closed (background notifications)

---

## 🚀 Next Steps (Optional)

### Add Push for Events

When creating an event, notify all players:

```typescript
import { sendPushToUsers } from '@/services/sendPushNotification'

// After creating event
const playerIds = await getTeamPlayerIds(teamId)

await sendPushToUsers(
  playerIds,
  'New Event Created',
  `${eventName} scheduled for ${eventDate}`,
  `/events/${eventId}`
)
```

### Add Push for Contracts

When a contract is signed:

```typescript
import { sendPushToUser } from '@/services/sendPushNotification'

await sendPushToUser(
  playerId,
  'Contract Signed',
  `Your contract with ${clubName} has been signed!`,
  '/dashboard/contracts'
)
```

### Listen for Foreground Messages

Show in-app notifications when app is open:

```typescript
import { listenForForegroundMessages, showBrowserNotification } from '@/services/pushNotificationService'

// In your layout or page component
useEffect(() => {
  const unsubscribe = await listenForForegroundMessages((payload) => {
    // Show in-app notification
    showBrowserNotification(
      payload.notification.title,
      {
        body: payload.notification.body,
        icon: '/logo.png'
      }
    )
  })

  return () => unsubscribe?.()
}, [])
```

---

## 📊 Monitoring & Analytics

### Check Active Subscriptions

```sql
-- Run in Supabase SQL Editor
SELECT
  device_type,
  COUNT(*) as count,
  COUNT(DISTINCT user_id) as unique_users
FROM notification_tokens
WHERE is_active = true
GROUP BY device_type;
```

### Check Notification Delivery

```sql
-- Check Edge Function logs in Supabase Dashboard
-- Go to: Functions → send-push-notification → Logs
```

### Clean Up Old Tokens

```sql
-- Run periodically to remove tokens older than 90 days
SELECT cleanup_inactive_tokens();
```

---

## 🎉 You're Done!

Once you complete Steps 1-5 above, your push notifications will be fully functional!

Users will receive notifications for:
- ✅ New messages
- ⏳ Events (when you add the code)
- ⏳ Contracts (when you add the code)
- ⏳ Any other events you want to notify about

---

## 📚 File Reference

**Core Files:**
- Config: [apps/web/src/lib/firebase/config.ts](apps/web/src/lib/firebase/config.ts)
- Service Worker: [apps/web/public/firebase-messaging-sw.js](apps/web/public/firebase-messaging-sw.js)
- Subscription Service: [apps/web/src/services/pushNotificationService.ts](apps/web/src/services/pushNotificationService.ts)
- Send Service: [apps/web/src/services/sendPushNotification.ts](apps/web/src/services/sendPushNotification.ts)
- Edge Function: [supabase/functions/send-push-notification/index.ts](supabase/functions/send-push-notification/index.ts)
- Permission Prompt: [apps/web/src/components/PushNotificationPrompt.tsx](apps/web/src/components/PushNotificationPrompt.tsx)
- Message Service with Push: [apps/web/src/services/messageServiceWithPush.ts](apps/web/src/services/messageServiceWithPush.ts)

**SQL Files:**
- Migration: [supabase/migrations/016_create_notification_tokens_table.sql](supabase/migrations/016_create_notification_tokens_table.sql)
- Quick Setup: [CREATE_NOTIFICATION_TOKENS_TABLE.sql](CREATE_NOTIFICATION_TOKENS_TABLE.sql)

**Configuration:**
- Environment Variables: [apps/web/.env.local](apps/web/.env.local)

---

## 🆘 Need Help?

If you encounter issues:
1. Check the troubleshooting section above
2. Review browser console logs
3. Check Supabase Edge Function logs
4. Verify all environment variables are set
5. Test in Chrome first (best FCM support)

---

**Remember:** You MUST get the FCM Server Key (Step 1) for this to work!
