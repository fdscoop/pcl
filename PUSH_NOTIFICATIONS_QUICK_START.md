# 🚀 Push Notifications - Quick Start

## ⚡ 5-Minute Setup Checklist

### ☑️ Step 1: Get FCM Server Key (CRITICAL)
1. Go to: https://console.firebase.google.com/project/pcl-professional-club-league/settings/cloudmessaging
2. Copy the **Server key** under "Cloud Messaging API (Legacy)"
3. Update line 38 in `apps/web/.env.local`:
   ```
   FCM_SERVER_KEY="YOUR_KEY_HERE"
   ```

### ☑️ Step 2: Create Database Table
1. Go to: https://supabase.com/dashboard/project/uvifkmkdoiohqrdbwgzt/sql
2. Copy/paste content from `CREATE_NOTIFICATION_TOKENS_TABLE.sql`
3. Click **Run**

### ☑️ Step 3: Deploy Edge Function
```bash
cd /Users/bineshbalan/pcl
npx supabase login
npx supabase link --project-ref uvifkmkdoiohqrdbwgzt
npx supabase functions deploy send-push-notification --no-verify-jwt
npx supabase secrets set FCM_SERVER_KEY="YOUR_KEY_HERE"
```

### ☑️ Step 4: Add Permission Prompt
In `apps/web/src/app/dashboard/club-owner/layout.tsx` and `player/layout.tsx`:

```typescript
import PushNotificationPrompt from '@/components/PushNotificationPrompt'

export default function Layout({ children }) {
  return (
    <div>
      {children}
      <PushNotificationPrompt />
    </div>
  )
}
```

### ☑️ Step 5: Update Message Sending
In your messages pages, change the import:

```typescript
// OLD:
import { sendMessage } from '@/services/messageService'

// NEW:
import { sendMessageWithPush as sendMessage } from '@/services/messageServiceWithPush'
```

---

## ✅ That's It!

Now when users send messages, recipients will get push notifications even when the app is closed!

---

## 🧪 Quick Test

1. Open your app in Chrome
2. Log in
3. Wait 3 seconds → Permission prompt appears
4. Click "Enable"
5. Send a message to another user
6. They receive a push notification!

---

## 📖 Full Guide

For detailed information, see [PUSH_NOTIFICATIONS_SETUP_GUIDE.md](PUSH_NOTIFICATIONS_SETUP_GUIDE.md)

---

## 🆘 Common Issues

**"FCM_SERVER_KEY not configured"**
→ Complete Step 1 above

**"Permission denied"**
→ User must click "Allow" in browser

**"No notification received"**
→ Check Edge Function is deployed (Step 3)

---

## ❓ About Capacitor

**Q: Should I install Capacitor now?**
**A: NO.** You have push notifications working via PWA (web). Only install Capacitor later if:
- You have 1000+ active users
- Users specifically request app store presence
- You need native-only features

For now, this web push solution is perfect!

---

**Ready to go? Complete the 5 steps above and you're done! 🎉**
