# ⚡ Quick Vercel Environment Variables Setup

## 🎯 The Problem
Your Vercel build is failing because `SUPABASE_SERVICE_ROLE_KEY` is not set in Vercel's environment variables.

## ✅ The Solution (3 Steps)

### Step 1: Get Supabase Service Role Key (2 minutes)

1. Go to: **https://supabase.com/dashboard/project/uvifkmkdoiohqrdbwgzt**
2. Click **Settings** (bottom left sidebar)
3. Click **API** tab
4. Look for **Service Role Key** (should be a long JWT starting with `eyJ...`)
5. **Copy it** (click the copy icon)

Save this somewhere - you'll use it in the next step.

---

### Step 2: Add to Vercel Environment Variables (3 minutes)

1. Go to: **https://vercel.com/fdscoop-projects/pcl/settings/environment-variables**
2. Click **Add New Environment Variable**
3. Fill in:
   - **Name**: `SUPABASE_SERVICE_ROLE_KEY`
   - **Value**: Paste the key you copied from Supabase
   - **Environments**: Select both **Production** ✓ and **Preview** ✓
4. Click **Add**

✅ **Done!** The variable is now in Vercel.

---

### Step 3: Redeploy (2 minutes)

1. Go to: **https://vercel.com/fdscoop-projects/pcl/deployments**
2. Find the latest failed deployment (with the red X)
3. Click the **three dots (...)** menu
4. Click **Redeploy**
5. Watch the build log - it should now succeed! ✅

---

## 📋 What You're Adding

| Variable | Value |
|----------|-------|
| `SUPABASE_SERVICE_ROLE_KEY` | Your service role key from Supabase |

That's it! Just this one variable fixes the build.

---

## 🔧 Other Variables (Optional - for later)

When you're ready, add these too:

**Razorpay:**
- `RAZORPAY_WEBHOOK_SECRET` - Get from Razorpay Dashboard → Webhooks

**Already set (don't change):**
- `NEXT_PUBLIC_RAZORPAY_KEY_ID`
- `RAZORPAY_SECRET_KEY`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- All Firebase variables
- All Cashfree variables

---

## 🐛 If Build Still Fails

1. Make sure you selected **both Production AND Preview** environments
2. The `SUPABASE_SERVICE_ROLE_KEY` value starts with `eyJ`
3. Click **Redeploy** (not just pushing code)
4. Wait 2-3 minutes for build to complete

---

## ✨ Expected Result

After redeploy:
- ✅ Build completes in ~2 minutes
- ✅ No "supabaseKey is required" error
- ✅ Website deploys successfully
- ✅ https://www.professionalclubleague.com works

---

**Let me know when you've added the variable and redeployed!** 🚀
