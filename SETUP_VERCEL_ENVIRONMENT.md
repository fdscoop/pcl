# Setup Vercel Environment Variables

## 🎯 Required Environment Variables

Your Vercel deployment needs these environment variables set in the dashboard.

### 📍 Where to Add Them
1. Go to: https://vercel.com/fdscoop-projects/pcl/settings/environment-variables
2. Add each variable below
3. Set them for: **Production** and **Preview** environments

---

## 🔧 Environment Variables List

### **Supabase** (Database)
```
NEXT_PUBLIC_SUPABASE_URL=https://uvifkmkdoiohqrdbwgzt.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV2aWZrbWtkb2lvaHFyZGJ3Z3p0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYwNTA0MjMsImV4cCI6MjA4MTYyNjQyM30.fbFwh2HBKd4pjImw88hhG4-VuBxWaLDoIpcpZvjHD3o
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY_HERE
```

**⚠️ IMPORTANT:** Get `SUPABASE_SERVICE_ROLE_KEY` from:
- Supabase Dashboard: https://supabase.com/dashboard/project/uvifkmkdoiohqrdbwgzt
- Settings → API → Copy the **service_role** key (NOT anon key)

---

### **Razorpay** (Payment Gateway)
```
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_S2J0LeOfybI0jg
RAZORPAY_SECRET_KEY=1V0OWq0JzMThyiQYboFjum3X
NEXT_PUBLIC_RAZORPAY_MODE=test
RAZORPAY_WEBHOOK_SECRET=YOUR_WEBHOOK_SECRET_HERE
```

**⚠️ IMPORTANT:** Get `RAZORPAY_WEBHOOK_SECRET` from:
- Razorpay Dashboard: https://dashboard.razorpay.com/app/webhooks
- Create webhook for: `https://www.professionalclubleague.com/api/webhooks/razorpay`
- Copy the webhook secret after creating it

---

### **Firebase** (Push Notifications)
```
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyARrEFN63VRJEJBVtNVEibqziegEQta7gQ
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=pcl-professional-club-league.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=pcl-professional-club-league
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=pcl-professional-club-league.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=605135281202
NEXT_PUBLIC_FIREBASE_APP_ID=1:605135281202:web:1ba4184f4057b13495702b
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-DXCFBH7967
NEXT_PUBLIC_FIREBASE_VAPID_KEY=BBkiBTx3DpjcPOquqJRQQG24PRBZrBWL0hlhxcgRigdggG5coUNoqWxnaeoEqCGTiTJvwK4l5Wqj4ntS2xxIZPk
```

---

### **Cashfree** (KYC Verification)
```
NEXT_PUBLIC_CASHFREE_KEY_ID=CF1159838D58OK743AJJC738HCFQ0
CASHFREE_SECRET_KEY=cfsk_ma_prod_2c0ce22d9072b71b7f40140c65636bf6_0af7d5a5
NEXT_PUBLIC_CASHFREE_MODE=production
CASHFREE_PUBLIC_KEY=-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA3UZSfWb0hrlZ2F5XaL3P
cCmfi0nAUVdVq4jFn6b2j4crsgsCm8VwqqQFp6vzG9LRb5/xBYb8GUsZdE+5UxED
wH0yrNIbKx6+pIoELm8k5CsCa3Ih++iJkvDP9+9LW3ULPu9wEk/mbv1Rl1BQAjXu
V4IN7b7TH6QBZky+d1zwa+kSZnYEeYsraoMzCNpdZ075yxRIHJoFFJTNfRgPf77R
VU1nCJRwKVv6yrymQf6cAwzUzlh4OG2+bzzd2Jp3dpLPl9mHPfYghTEAhde2Dc/F
nKX1F6Vhe6od/Zth3a3Kd0C2Movo9vaKmt8QYkgl0xqNjnA5VhFQ5AjN1J2ASHt+
zwIDAQAB
-----END PUBLIC KEY-----
```

---

### **Firebase Service Account** (Backend Only - For Push Notifications)
```
FCM_SERVICE_ACCOUNT={"type":"service_account","project_id":"pcl-professional-club-league",...}
```

(Keep the same value from `.env.local`)

---

### **App Configuration**
```
NEXT_PUBLIC_APP_URL=https://www.professionalclubleague.com
```

---

## ✅ Checklist

- [ ] Copy all variables to Vercel dashboard
- [ ] Set for **Production** environment
- [ ] Set for **Preview** environment
- [ ] Replace `SUPABASE_SERVICE_ROLE_KEY` with real value
- [ ] Replace `RAZORPAY_WEBHOOK_SECRET` with real value
- [ ] Trigger new deployment after adding variables
- [ ] Verify build succeeds

---

## 🚀 Next Steps

1. **Add Supabase Service Role Key**
   - Go to https://supabase.com/dashboard/project/uvifkmkdoiohqrdbwgzt
   - Settings → API
   - Copy `service_role` key
   - Add as `SUPABASE_SERVICE_ROLE_KEY` in Vercel

2. **Create Razorpay Webhook**
   - Go to https://dashboard.razorpay.com/app/webhooks
   - Click "Add New Webhook"
   - URL: `https://www.professionalclubleague.com/api/webhooks/razorpay`
   - Events: `payment.captured`, `payment.failed`, `refund.processed`
   - Copy webhook secret
   - Add as `RAZORPAY_WEBHOOK_SECRET` in Vercel

3. **Trigger Deployment**
   - After adding variables, go to Vercel Deployments
   - Click "Redeploy" on the latest deployment
   - Watch build progress at: https://vercel.com/fdscoop-projects/pcl/deployments

---

## 🐛 Troubleshooting

**Build still fails with "supabaseKey is required"?**
- Make sure `SUPABASE_SERVICE_ROLE_KEY` is set in Vercel
- Not in `.env.local` - it must be in Vercel dashboard
- Redeploy after adding the variable

**Webhook errors?**
- Make sure webhook secret matches in both Razorpay and Vercel
- Check webhook URL is correct: `https://www.professionalclubleague.com/api/webhooks/razorpay`

---

**See `.env.local` for reference values - but always add to Vercel dashboard for production!**
