# 🔔 Push Notifications Setup Guide (FCM API V1)

Your app is configured to use **Firebase Cloud Messaging API V1** (the modern, recommended version).

---

## ⚡ Quick Setup (5 Steps)

### Step 1: Download Firebase Service Account JSON ⚠️ **CRITICAL**

1. Go to: https://console.firebase.google.com/project/pcl-professional-club-league/settings/serviceaccounts/adminsdk

2. Click **"Generate new private key"**

3. Click **"Generate key"** in the popup

4. **Save the downloaded JSON file** (e.g., `firebase-service-account.json`)

The file looks like this:
```json
{
  "type": "service_account",
  "project_id": "pcl-professional-club-league",
  "private_key_id": "abc123...",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQIBA...\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-fbsvc@pcl-professional-club-league.iam.gserviceaccount.com",
  "client_id": "123456789...",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/service_accounts/v1/...",
  "universe_domain": "googleapis.com"
}
```

⚠️ **IMPORTANT:** Keep this file secret! Never commit it to git!

---

### Step 2: Create Database Table

1. Go to Supabase SQL Editor: https://supabase.com/dashboard/project/uvifkmkdoiohqrdbwgzt/sql

2. **Copy and paste** the SQL from [CREATE_NOTIFICATION_TOKENS_TABLE.sql](CREATE_NOTIFICATION_TOKENS_TABLE.sql)

3. Click **"Run"**

---

### Step 3: Deploy Supabase Edge Function

Open your terminal and run:

```bash
cd /Users/bineshbalan/pcl

# Login to Supabase (if not already logged in)
npx supabase login

# Link your project
npx supabase link --project-ref uvifkmkdoiohqrdbwgzt

# Deploy the Edge Function
npx supabase functions deploy send-push-notification --no-verify-jwt
```

Now set the service account as a secret:

```bash
# IMPORTANT: Replace the JSON below with your actual service account JSON
# Copy the ENTIRE contents of the JSON file you downloaded in Step 1
# Paste it as a single-line string (keep the newlines in private_key as \n)

npx supabase secrets set FCM_SERVICE_ACCOUNT='{"type":"service_account","project_id":"pcl-professional-club-league","private_key_id":"YOUR_KEY_ID","private_key":"-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n","client_email":"firebase-adminsdk-fbsvc@pcl-professional-club-league.iam.gserviceaccount.com","client_id":"YOUR_CLIENT_ID","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token","auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs","client_x509_cert_url":"YOUR_CERT_URL","universe_domain":"googleapis.com"}'
```

**Tip:** To make it easier, you can do:
```bash
# Read from the downloaded file (easier!)
npx supabase secrets set FCM_SERVICE_ACCOUNT="$(cat ~/Downloads/firebase-service-account.json)"
```

---

### Step 4: Add Permission Prompt to Your Dashboards

#### Club Owner Dashboard:

Edit [apps/web/src/app/dashboard/club-owner/layout.tsx](apps/web/src/app/dashboard/club-owner/layout.tsx):

```typescript
import PushNotificationPrompt from '@/components/PushNotificationPrompt'

export default function ClubOwnerLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <PushNotificationPrompt />
    </>
  )
}
```

#### Player Dashboard:

Edit [apps/web/src/app/dashboard/player/layout.tsx](apps/web/src/app/dashboard/player/layout.tsx):

```typescript
import PushNotificationPrompt from '@/components/PushNotificationPrompt'

export default function PlayerLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <PushNotificationPrompt />
    </>
  )
}
```

---

### Step 5: Enable Push Notifications in Messages

Update your message pages to use the push-enabled service:

#### Club Owner Messages:

Edit [apps/web/src/app/dashboard/club-owner/messages/page.tsx](apps/web/src/app/dashboard/club-owner/messages/page.tsx):

Find this line (around line 17):
```typescript
import { sendMessage } from '@/services/messageService'
```

Replace with:
```typescript
import { sendMessageWithPush as sendMessage } from '@/services/messageServiceWithPush'
```

#### Player Messages:

Edit [apps/web/src/app/dashboard/player/messages/page.tsx](apps/web/src/app/dashboard/player/messages/page.tsx):

Same change as above.

---

## ✅ You're Done!

Push notifications are now fully configured! 🎉

---

## 🧪 Testing

### 1. Test in Browser

1. Open your app in **Chrome** (best FCM support)
2. Log in to your dashboard
3. Wait 3 seconds → You'll see the permission prompt
4. Click **"Enable"**
5. Grant permission when browser asks
6. Open browser console and check for: `✅ Successfully subscribed to push notifications`

### 2. Test Message Notification

1. Log in as **Club Owner** in one browser
2. Log in as **Player** in another browser (or incognito)
3. Send a message from Club Owner to Player
4. Player should receive a notification immediately!

### 3. Test Background Notification

1. After subscribing to notifications
2. **Close the browser completely**
3. Have someone send you a message
4. You'll get a system notification! 🎉

---

## 🔍 Troubleshooting

### Issue: "FCM_SERVICE_ACCOUNT not configured"

**Solution:**
- Make sure you completed Step 3 above
- Check the secret is set:
  ```bash
  npx supabase secrets list
  ```
- Re-deploy the function:
  ```bash
  npx supabase functions deploy send-push-notification
  ```

### Issue: "Permission denied" or "Notification blocked"

**Solution:**
- User must click "Allow" when browser prompts
- If accidentally blocked, reset in browser:
  - **Chrome:** Settings → Privacy and security → Site Settings → Notifications
  - **Firefox:** Preferences → Privacy & Security → Permissions → Notifications

### Issue: "Firebase messaging not supported"

**Solution:**
- Must use **HTTPS** (not HTTP)
- Try **Chrome** or **Firefox** (best support)
- Check browser console for specific errors

### Issue: Edge Function failing

**Solution:**
1. Check Supabase Function logs:
   - Go to: https://supabase.com/dashboard/project/uvifkmkdoiohqrdbwgzt/functions/send-push-notification/logs

2. Common errors:
   - `FCM_SERVICE_ACCOUNT not configured` → Re-run Step 3
   - `Invalid private key` → Check JSON is properly escaped
   - `Token invalid` → User needs to re-subscribe

---

## 🎯 What Works Now

### Automatic Notifications:
- ✅ **New Messages** - Sends push when message is sent
- ⏳ **Events** - Add this yourself (code provided below)
- ⏳ **Contracts** - Add this yourself (code provided below)

---

## 📱 About Capacitor

**Q: Should I install Capacitor now?**

**A: NO.** You have fully functional push notifications via web! Only consider Capacitor if:

- You have 1000+ active users
- Users specifically request App Store/Play Store presence
- You need native-only features (advanced camera, biometrics, etc.)

Your current setup:
- ✅ Push notifications work perfectly
- ✅ Works on mobile browsers
- ✅ Can be installed as PWA
- ✅ $0 cost
- ✅ No app store approval needed

---

## 🚀 Adding More Notifications (Optional)

### For Event Creation:

```typescript
import { sendPushToUsers } from '@/services/sendPushNotification'

// After creating event
const { data: players } = await supabase
  .from('team_members')
  .select('player_id')
  .eq('team_id', teamId)

const playerIds = players?.map(p => p.player_id) || []

await sendPushToUsers(
  playerIds,
  'New Event',
  `${eventName} scheduled for ${eventDate}`,
  `/events/${eventId}`
)
```

### For Contract Signing:

```typescript
import { sendPushToUser } from '@/services/sendPushNotification'

await sendPushToUser(
  playerId,
  'Contract Signed!',
  `Your contract with ${clubName} is now active`,
  '/dashboard/contracts'
)
```

---

## 📊 Monitoring

### Check Active Subscriptions:

```sql
-- Run in Supabase SQL Editor
SELECT
  device_type,
  COUNT(*) as total_tokens,
  COUNT(DISTINCT user_id) as unique_users,
  COUNT(CASE WHEN is_active THEN 1 END) as active_tokens
FROM notification_tokens
GROUP BY device_type;
```

### Check Recent Activity:

```sql
SELECT
  user_id,
  device_type,
  created_at,
  last_used_at,
  is_active
FROM notification_tokens
ORDER BY last_used_at DESC
LIMIT 10;
```

---

## 🎉 Summary

**What's Working:**
- ✅ FCM V1 API integration (modern & secure)
- ✅ Push notifications for messages
- ✅ Permission prompt UI
- ✅ Background notifications (app closed)
- ✅ Web + Mobile browser support

**Cost:** $0 (free forever)

**Time to Setup:** 5-10 minutes

**Result:** Professional push notifications! 🚀

---

## 📚 Files Reference

- **Service Worker:** [apps/web/public/firebase-messaging-sw.js](apps/web/public/firebase-messaging-sw.js)
- **Client Service:** [apps/web/src/services/pushNotificationService.ts](apps/web/src/services/pushNotificationService.ts)
- **Edge Function:** [supabase/functions/send-push-notification/index.ts](supabase/functions/send-push-notification/index.ts)
- **Send Service:** [apps/web/src/services/sendPushNotification.ts](apps/web/src/services/sendPushNotification.ts)
- **Permission Prompt:** [apps/web/src/components/PushNotificationPrompt.tsx](apps/web/src/components/PushNotificationPrompt.tsx)
- **Message Service:** [apps/web/src/services/messageServiceWithPush.ts](apps/web/src/services/messageServiceWithPush.ts)

---

Need help? Check the troubleshooting section or ask! 🆘
