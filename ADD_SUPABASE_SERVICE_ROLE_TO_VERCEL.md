# 🎯 Add SUPABASE_SERVICE_ROLE_KEY to Vercel (RIGHT NOW!)

You're in the correct Vercel Environment Variables page. Follow these exact steps:

## Step 1: Get Your Supabase Service Role Key

1. Open new tab: https://supabase.com/dashboard/project/uvifkmkdoiohqrdbwgzt
2. Click **Settings** (bottom left)
3. Click **API** tab
4. Find **Service Role Key** (long JWT starting with `eyJ`)
5. Click the **copy icon** next to it
6. **Keep it copied** - you'll paste it in next step

---

## Step 2: Add to Vercel (You're Already Here!)

1. In Vercel, look for the button: **"Add New"** or **"Add Environment Variable"**
   - (Top right of the environment variables section)

2. Fill in the form:
   - **Name (Key):** `SUPABASE_SERVICE_ROLE_KEY`
   - **Value:** Paste the key you copied from Supabase (Ctrl+V or Cmd+V)
   - **Environments:** 
     - Check ✓ **Production**
     - Check ✓ **Preview**
     - Check ✓ **Development** (optional)

3. Click **Save** or **Add**

4. You should see it appear in the list below (like your CASHFREE_SECRET_KEY)

---

## Step 3: Redeploy

1. Go to **Deployments** tab (in Vercel top menu)
2. Find the latest deployment (should have a red ❌)
3. Click the **three dots (...)** menu
4. Click **Redeploy** or **Redeploy Latest Commit**
5. Wait 2-3 minutes for build to complete ✅

---

## ✅ What to Expect

After redeploy:
- Build log shows: **✓ Compiled successfully**
- No "supabaseKey is required" error
- Website deploys to production
- https://www.professionalclubleague.com works! 🎉

---

## 📋 Your Current Environment Variables

Already set (good!):
- ✅ CASHFREE_SECRET_KEY
- ✅ NEXT_PUBLIC_CASHFREE_MODE
- ✅ NEXT_PUBLIC_SUPABASE_ANON_KEY
- ✅ NEXT_PUBLIC_SUPABASE_URL

**Missing (NEEDS TO BE ADDED):**
- ❌ **SUPABASE_SERVICE_ROLE_KEY** ← ADD THIS ONE!

---

## 🆘 Can't Find the Service Role Key?

If you can't find it in Supabase Settings → API:

1. Make sure you're in the correct project: `uvifkmkdoiohqrdbwgzt`
2. Scroll down in the API page - there should be two keys:
   - `anon` (public, already have this)
   - `service_role` (this is what you need!)
3. Copy the `service_role` key

---

**Do this now and let me know when the build succeeds!** 🚀
