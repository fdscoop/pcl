# 🚀 Deploy Push Notifications - Manual Steps

Since automated deployment encountered auth issues, here's how to complete the setup manually:

---

## ✅ Step 1: Create Database Table

1. Go to: https://supabase.com/dashboard/project/uvifkmkdoiohqrdbwgzt/sql

2. Click "New query"

3. Copy and paste this SQL:

```sql
-- Create notification_tokens table for push notifications
CREATE TABLE IF NOT EXISTS notification_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  device_type TEXT NOT NULL DEFAULT 'web',
  device_info JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_notification_tokens_user_id ON notification_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_tokens_is_active ON notification_tokens(is_active);
CREATE INDEX IF NOT EXISTS idx_notification_tokens_device_type ON notification_tokens(device_type);

-- Enable RLS
ALTER TABLE notification_tokens ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can insert their own tokens"
  ON notification_tokens FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own tokens"
  ON notification_tokens FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own tokens"
  ON notification_tokens FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tokens"
  ON notification_tokens FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all tokens"
  ON notification_tokens FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- Auto-update last_used_at
CREATE OR REPLACE FUNCTION update_token_last_used()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_used_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_token_last_used
  BEFORE UPDATE ON notification_tokens
  FOR EACH ROW EXECUTE FUNCTION update_token_last_used();

-- Cleanup function
CREATE OR REPLACE FUNCTION cleanup_inactive_tokens()
RETURNS void AS $$
BEGIN
  DELETE FROM notification_tokens WHERE last_used_at < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql;

-- Comments
COMMENT ON TABLE notification_tokens IS 'Stores FCM tokens for push notifications';
COMMENT ON COLUMN notification_tokens.token IS 'FCM registration token unique to each device/browser';
```

4. Click **"Run"** or press **Cmd/Ctrl + Enter**

5. You should see: "Success. No rows returned"

---

## ✅ Step 2: Deploy Edge Function via Supabase Dashboard

### Option A: Deploy via Dashboard (Easiest)

1. Go to: https://supabase.com/dashboard/project/uvifkmkdoiohqrdbwgzt/functions

2. Click **"Create a new function"**

3. Name it: `send-push-notification`

4. Copy the code from: `supabase/functions/send-push-notification/index.ts`

5. Paste it into the editor

6. Click **"Deploy function"**

### Option B: Deploy via CLI (If you have access)

```bash
cd /Users/bineshbalan/pcl

# Login first
npx supabase login

# Link project
npx supabase link --project-ref uvifkmkdoiohqrdbwgzt

# Deploy function
npx supabase functions deploy send-push-notification --no-verify-jwt
```

---

## ✅ Step 3: Set Edge Function Secrets

1. Go to: https://supabase.com/dashboard/project/uvifkmkdoiohqrdbwgzt/settings/functions

2. Click on **"Secrets"** tab

3. Click **"Add new secret"**

4. Name: `FCM_SERVICE_ACCOUNT`

5. Value: Copy from your `.env.local` file (line 38) - the entire JSON string starting with `{"type":"service_account"...}`

6. Click **"Save"**

---

## ✅ Step 4: Test Edge Function

1. Go to: https://supabase.com/dashboard/project/uvifkmkdoiohqrdbwgzt/functions/send-push-notification

2. Click **"Invoke function"**

3. Use this test payload:

```json
{
  "user_id": "YOUR_USER_ID_HERE",
  "title": "Test Notification",
  "body": "This is a test push notification",
  "action_url": "/dashboard"
}
```

4. Click **"Invoke"**

5. If successful, you'll see: `{"success":true,"sent_count":0,"error_count":0}`
   (0 sent because user hasn't subscribed to notifications yet - that's fine!)

---

## ✅ Step 5: Complete Frontend Setup

Now that the backend is ready, complete the frontend:

### A. Run SQL Migration
✅ Already done in Step 1

### B. Add Permission Prompt to Layouts

Edit `apps/web/src/app/dashboard/club-owner/layout.tsx`:

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

Edit `apps/web/src/app/dashboard/player/layout.tsx`:

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

### C. Update Message Service

In both message pages:
- `apps/web/src/app/dashboard/club-owner/messages/page.tsx`
- `apps/web/src/app/dashboard/player/messages/page.tsx`

Change line ~17:
```typescript
// FROM:
import { sendMessage } from '@/services/messageService'

// TO:
import { sendMessageWithPush as sendMessage } from '@/services/messageServiceWithPush'
```

---

## ✅ Step 6: Deploy to Production

```bash
cd /Users/bineshbalan/pcl

# Commit changes
git add .
git commit -m "Add push notifications with FCM V1"

# Push to GitHub/deploy
git push
```

⚠️ **IMPORTANT:** Also add the `FCM_SERVICE_ACCOUNT` environment variable to Vercel:

1. Go to: https://vercel.com/fdscoop-projects/pcl/settings/environment-variables

2. Add new variable:
   - Name: `FCM_SERVICE_ACCOUNT`
   - Value: Copy from `.env.local` line 38
   - Select all environments (Production, Preview, Development)

3. Click **"Save"**

4. Redeploy your app

---

## 🧪 Testing

Once deployed:

1. Open your app in Chrome
2. Log in
3. Wait 3 seconds → Permission prompt appears
4. Click "Enable"
5. Grant browser permission
6. Send a test message
7. Receive push notification! 🎉

---

## 🎉 You're Done!

Push notifications are now live! Users will receive notifications for:
- ✅ New messages (automatic)
- ⏳ Events (add code when needed)
- ⏳ Contracts (add code when needed)

---

## 📚 Documentation

- **Full Guide:** [FCM_V1_SETUP_GUIDE.md](FCM_V1_SETUP_GUIDE.md)
- **Quick Start:** [PUSH_NOTIFICATIONS_QUICK_START.md](PUSH_NOTIFICATIONS_QUICK_START.md)
- **Complete Docs:** [PUSH_NOTIFICATIONS_SETUP_GUIDE.md](PUSH_NOTIFICATIONS_SETUP_GUIDE.md)

---

## 🆘 Troubleshooting

### Database table not created
- Check SQL Editor for errors
- Make sure you're in the correct project
- Try running the SQL again

### Edge Function not working
- Check function logs: https://supabase.com/dashboard/project/uvifkmkdoiohqrdbwgzt/functions/send-push-notification/logs
- Verify `FCM_SERVICE_ACCOUNT` secret is set
- Make sure the JSON is valid (no extra spaces/newlines)

### No notifications received
- Check browser console for errors
- Make sure user granted permission
- Verify FCM token is saved in database:
  ```sql
  SELECT * FROM notification_tokens ORDER BY created_at DESC LIMIT 10;
  ```

---

Good luck! 🚀
