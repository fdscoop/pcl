# 🚨 URGENT: Configure Webhook Environment Variables

## The Issue
Payment completed successfully (`pay_S2cjuDTDgRXxKR`) but polling fails because:
- Payment record exists: `541c397b-8926-4351-b758-1e620ead2c38`
- Status is still `pending` (should be `completed`)
- `razorpay_payment_id` is still `null` (webhook should populate this)

**The webhook hasn't fired because environment variables aren't configured!**

---

## 🔧 STEP 1: Set Edge Function Environment Variables

Go to: **Supabase Dashboard → Your Project → Edge Functions**

1. Click **`razorpay-webhook`**
2. Click **Settings** tab  
3. Add these environment variables:

```bash
RAZORPAY_WEBHOOK_SECRET=your_razorpay_webhook_secret_from_dashboard
SUPABASE_URL=https://uvifkmkdoiohqrdbwgzt.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_from_api_settings
```

### 📍 **Where to Find Values:**

**RAZORPAY_WEBHOOK_SECRET**:
- Go to Razorpay Dashboard → Settings → Webhooks
- Create/Edit webhook → Copy the **Secret** value

**SUPABASE_SERVICE_ROLE_KEY**:
- Go to Supabase Dashboard → Project Settings → API
- Copy the **service_role** secret (NOT anon key)

---

## 🔧 STEP 2: Configure Razorpay Webhook URL

Go to: **Razorpay Dashboard → Settings → Webhooks**

1. Click **+ Add New Webhook** (or edit existing)
2. Set **Webhook URL**:
   ```
   https://uvifkmkdoiohqrdbwgzt.supabase.co/functions/v1/razorpay-webhook
   ```

3. Enable these events:
   - ✅ **payment.captured** (main success event)
   - ✅ **payment.failed** (handle failures)  
   - ✅ **refund.processed** (handle refunds)

4. Set **Secret** (copy this to RAZORPAY_WEBHOOK_SECRET above)
5. Click **Create Webhook**

---

## 🧪 STEP 3: Test the Fix

After configuration:

1. **Make another test payment** (the old one won't retrigger)
2. **Watch webhook logs**: Supabase Dashboard → Edge Functions → razorpay-webhook → Logs
3. **Verify payment updates**: Check if `razorpay_payment_id` gets populated and `status` becomes `completed`

---

## 🎯 Expected Result After Configuration

**Before (current)**:
```json
{
  "id": "541c397b-8926-4351-b758-1e620ead2c38",
  "status": "pending",
  "razorpay_payment_id": null,
  "razorpay_order_id": "order_S2cjj4ehuR6blE"
}
```

**After webhook fires**:
```json
{
  "id": "541c397b-8926-4351-b758-1e620ead2c38", 
  "status": "completed",
  "razorpay_payment_id": "pay_S2cjuDTDgRXxKR",
  "razorpay_order_id": "order_S2cjj4ehuR6blE"
}
```

Then the polling will find the `completed` payment and match creation will succeed! 🎉