# Razorpay Webhook Deployment Guide

## Overview
This guide covers deploying the new server-side webhook solution that eliminates timing issues and RLS problems with payment record creation.

## Architecture Changes
- **OLD**: Frontend creates Razorpay order → Payment success → Verify endpoint creates payment record
- **NEW**: Create-order API pre-creates payment record → Includes payment_id in Razorpay notes → Webhook updates existing record

## Step-by-Step Deployment

### 1. Deploy Supabase Edge Function

First, ensure you're in the project root and logged into Supabase:

```bash
cd /Users/bineshbalan/pcl
supabase login
```

Deploy the webhook function:

```bash
supabase functions deploy razorpay-webhook --project-ref YOUR_PROJECT_REF
```

**Required Environment Variables** for the Edge Function:
- `RAZORPAY_WEBHOOK_SECRET`: Your Razorpay webhook secret
- `SUPABASE_URL`: Your Supabase project URL  
- `SUPABASE_SERVICE_ROLE_KEY`: Service role key (not anon key)

Set these via Supabase dashboard:
1. Go to Edge Functions → razorpay-webhook → Settings
2. Add the environment variables above

### 2. Update Vercel Production Environment

**CRITICAL**: Update the production `SUPABASE_SERVICE_ROLE_KEY` in Vercel:

1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Find `SUPABASE_SERVICE_ROLE_KEY`
3. Update with your real service role key (starts with `eyJ...`)
4. Trigger a new deployment

**Note**: The create-order API now uses the service role key to create payment records.

### 3. Apply Database Migration

Run the SQL migration in Supabase Dashboard → SQL Editor:

```sql
-- Contents of FIX_PAYMENT_SERVICE_ROLE_POLICIES.sql
-- Grant service_role INSERT and SELECT permissions on payments table

-- Allow service_role to insert payments
CREATE POLICY "Allow service_role to insert payments" 
ON payments FOR INSERT 
TO service_role
WITH CHECK (true);

-- Allow service_role to select payments  
CREATE POLICY "Allow service_role to select payments"
ON payments FOR SELECT
TO service_role
USING (true);

-- Allow service_role to update payments
CREATE POLICY "Allow service_role to update payments"
ON payments FOR UPDATE
TO service_role
USING (true);
```

### 4. Configure Razorpay Webhook

1. Go to Razorpay Dashboard → Settings → Webhooks
2. Create new webhook with URL: `https://YOUR_PROJECT_REF.supabase.co/functions/v1/razorpay-webhook`
3. Select events:
   - `payment.captured`
   - `payment.failed`  
   - `refund.processed`
4. Set the webhook secret (same as `RAZORPAY_WEBHOOK_SECRET` above)

### 5. Test the Integration

#### Test Payment Flow:
1. Create a match/booking in the app
2. Complete Razorpay payment
3. Check webhook logs in Supabase Dashboard → Edge Functions → razorpay-webhook → Logs
4. Verify payment record is updated in Database → Table Editor → payments
5. Confirm match is created successfully

#### Debug Commands:
```bash
# Check Edge Function logs
supabase functions logs razorpay-webhook --project-ref YOUR_PROJECT_REF

# Test webhook locally (optional)
supabase functions serve razorpay-webhook
```

## Key Changes Made

### Frontend (`razorpayService.ts`)
- Updated `RazorpayOrderData` interface to include `payment_id`
- Frontend now receives and uses the payment_id from create-order response

### Backend APIs

#### `create-order/route.ts`
- **NEW FLOW**: Creates payment record FIRST in database
- Includes `payment_id` in Razorpay order notes
- Updates payment record with `razorpay_order_id` after Razorpay order creation

#### `verify-payment/route.ts`  
- Changed from INSERT/UPSERT to UPDATE operation
- Updates existing payment record using `razorpay_order_id`
- Eliminates duplicate payment records

### Webhook (`razorpay-webhook/index.ts`)
- Server-side execution with service_role permissions (bypasses RLS)
- HMAC-SHA256 signature verification
- Updates payment records using `notes.payment_id` (reliable mapping)
- Automatic match confirmation/cancellation based on payment status

## Expected Results

✅ **No more HTTP 406 errors** - Service role bypasses RLS issues
✅ **No more UUID constraint violations** - Payment records exist before verification
✅ **Reliable webhook processing** - Server-side execution with proper permissions  
✅ **Successful match creation** - Payment records available immediately after payment

## Troubleshooting

### If webhook not receiving events:
- Check Razorpay webhook URL configuration
- Verify webhook secret matches environment variable
- Check Edge Function logs for errors

### If payment records not updating:
- Verify service role key is correct in Vercel
- Check database policies are applied
- Ensure Edge Function has proper environment variables

### If matches still not creating:
- Check payment record exists in database after payment
- Verify payment status is 'completed' 
- Check match creation logic for any remaining issues

## Files Changed
- ✅ `/supabase/functions/razorpay-webhook/index.ts` (NEW)
- ✅ `/apps/web/src/app/api/razorpay/create-order/route.ts` (REFACTORED)
- ✅ `/apps/web/src/app/api/razorpay/verify-payment/route.ts` (UPDATED)  
- ✅ `/apps/web/src/services/razorpayService.ts` (INTERFACE UPDATED)
- ⏳ `FIX_PAYMENT_SERVICE_ROLE_POLICIES.sql` (NEEDS DEPLOYMENT)