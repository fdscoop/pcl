# Edge Function Environment Variables Configuration

Follow these steps to complete the webhook setup:

## 1. 🔧 Set Environment Variables in Supabase Dashboard

Go to: **Supabase Dashboard → Your Project → Edge Functions → razorpay-webhook → Settings**

Set these environment variables:

```bash
RAZORPAY_WEBHOOK_SECRET=your_razorpay_webhook_secret_here
SUPABASE_URL=https://uvifkmkdoiohqrdbwgzt.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

## 2. 🔗 Configure Razorpay Webhook URL

In **Razorpay Dashboard → Webhooks**, set the webhook URL to:

```
https://uvifkmkdoiohqrdbwgzt.supabase.co/functions/v1/razorpay-webhook
```

**Enable these events:**
- ✅ payment.captured
- ✅ payment.failed  
- ✅ refund.processed

## 3. 🧪 Test Webhook Integration

After configuration, test the full flow:

1. Create a match with payment
2. Complete payment in Razorpay checkout
3. Verify webhook processes payment
4. Confirm match is created successfully

## 4. 📝 Environment Variable Values

**RAZORPAY_WEBHOOK_SECRET**: Found in Razorpay Dashboard → Webhooks → Your Webhook → Secret

**SUPABASE_SERVICE_ROLE_KEY**: Found in Supabase Dashboard → Project Settings → API → service_role secret

## 5. 🔍 Monitor Webhook Activity

Check Edge Function logs in:
**Supabase Dashboard → Edge Functions → razorpay-webhook → Logs**

Look for:
- ✅ "Webhook signature verified"  
- ✅ "Payment updated successfully"
- ✅ "Match confirmed for match_id"

---

## ⚡ FULL WEBHOOK MODE ACTIVE!

✅ **Removed verify-payment API dependency**
✅ **Frontend polls webhook-updated payment records** 
✅ **Match creation uses reliable order_id lookup**
✅ **No more RLS UPDATE policy conflicts**
✅ **Cleaner, more reliable architecture**