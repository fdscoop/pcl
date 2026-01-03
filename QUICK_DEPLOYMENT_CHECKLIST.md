# Quick Deployment Checklist for Production

## ✅ Your Code is Ready!

All API integration code is complete and correct. You just need to deploy on infrastructure with a static IP.

## 🚀 Production Deployment Steps

### Option A: AWS EC2 (Recommended)

#### 1. Launch EC2 Instance
```bash
# Amazon Linux 2023 or Ubuntu 22.04 LTS
# t3.small or t3.medium (sufficient for most apps)
```

#### 2. Allocate Elastic IP
```bash
# AWS Console → EC2 → Elastic IPs → Allocate
# Associate with your EC2 instance
# This IP never changes, even if instance restarts
```

#### 3. Deploy Your App
```bash
# SSH into instance
ssh -i your-key.pem ec2-user@your-elastic-ip

# Install Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Clone your repo
git clone your-repo-url
cd your-app

# Install dependencies
npm install

# Build
npm run build

# Install PM2 for process management
npm install -g pm2

# Start app
pm2 start npm --name "pcl-app" -- start

# Set up PM2 to restart on reboot
pm2 startup
pm2 save
```

#### 4. Configure Nginx (Optional but recommended)
```bash
sudo apt install nginx

# Create Nginx config
sudo nano /etc/nginx/sites-available/pcl

# Add:
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

# Enable site
sudo ln -s /etc/nginx/sites-available/pcl /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

#### 5. Get Your Public IP
```bash
# Your Elastic IP is shown in AWS Console
# Or run on the instance:
curl ifconfig.me
```

#### 6. Whitelist IP in Cashfree
1. Login to Cashfree Dashboard
2. Go to Settings → API Settings
3. Add your Elastic IP to whitelist
4. Save

#### 7. Test
```bash
# Your app should now work for all users worldwide!
```

**Monthly Cost:** ~$10-20 USD (t3.small with Elastic IP)

---

### Option B: Digital Ocean Droplet

#### 1. Create Droplet
```bash
# Ubuntu 22.04 LTS
# Basic plan: $12/month (2 GB RAM, 1 vCPU)
```

#### 2. Create Reserved IP
```bash
# Digital Ocean Console → Networking → Reserved IPs
# Create and assign to your droplet
# This IP is yours forever (as long as assigned)
```

#### 3. Deploy Your App
```bash
# SSH into droplet
ssh root@your-reserved-ip

# Update system
apt update && apt upgrade -y

# Install Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt-get install -y nodejs

# Install Git
apt install git

# Clone and deploy (same as AWS steps above)
git clone your-repo-url
cd your-app
npm install
npm run build

# Install PM2
npm install -g pm2
pm2 start npm --name "pcl-app" -- start
pm2 startup
pm2 save
```

#### 4. Get Your Public IP
```bash
# Your Reserved IP is shown in DO Console
# Or:
curl ifconfig.me
```

#### 5. Whitelist in Cashfree
Same as AWS step 6 above

**Monthly Cost:** $12 USD (includes everything)

---

### Option C: Vercel + Proxy (Hybrid)

Keep Vercel deployment but route Cashfree requests through a proxy server with static IP.

#### 1. Set up small proxy server
```bash
# Use cheapest VPS (AWS/DO ~$5/month)
# Install this simple proxy:

npm install express http-proxy-middleware
```

#### 2. Proxy server code
```javascript
// proxy-server.js
const express = require('express')
const { createProxyMiddleware } = require('http-proxy-middleware')

const app = express()

// Only proxy Cashfree requests
app.use('/cashfree', createProxyMiddleware({
  target: 'https://api.cashfree.com',
  changeOrigin: true,
  pathRewrite: { '^/cashfree': '' }
}))

app.listen(8080)
```

#### 3. Update your API routes
```typescript
// Instead of calling Cashfree directly:
const CASHFREE_API = 'https://api.cashfree.com'

// Call through your proxy:
const CASHFREE_API = 'https://your-proxy-ip:8080/cashfree'
```

**Monthly Cost:** ~$5 USD (smallest VPS for proxy)

---

## 🎯 Recommended Choice

**Choose AWS EC2** if:
- ✅ You want enterprise-grade reliability
- ✅ You plan to scale significantly
- ✅ You're comfortable with AWS ecosystem

**Choose Digital Ocean** if:
- ✅ You want simplicity
- ✅ You prefer flat, predictable pricing
- ✅ You're new to infrastructure management

**Choose Vercel + Proxy** if:
- ✅ You love Vercel's deployment workflow
- ✅ You want minimal changes to current setup
- ✅ Cost is a major concern

---

## 📋 Environment Variables for Production

Make sure these are set on your production server:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Cashfree
NEXT_PUBLIC_CASHFREE_KEY_ID=your_client_id
CASHFREE_SECRET_KEY=your_client_secret

# App URL
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

---

## 🔍 How to Verify It's Working

1. Deploy on server with static IP
2. Whitelist that IP in Cashfree dashboard
3. Test from your local browser (different IP)
4. Aadhaar verification should work!

**The key insight:** Your server makes the Cashfree API call, not the user's browser. So only YOUR server's IP needs whitelisting, and all users worldwide can use the feature!

---

## 💡 Quick Start (30 minutes)

1. **Create Digital Ocean account** (easiest)
2. **Create $12/month droplet** with Ubuntu
3. **Create and assign Reserved IP**
4. **SSH and deploy** (copy commands from Option B above)
5. **Whitelist IP** in Cashfree dashboard
6. **Test!**

---

## 🆘 Need Help?

Contact: support@professionalclubleague.com

Include:
- Deployment platform chosen
- Server IP address
- Any error messages

---

## 📊 Cost Comparison

| Platform | Monthly Cost | Setup Time | Difficulty |
|----------|-------------|------------|------------|
| AWS EC2 | $10-20 | 1-2 hours | Medium |
| Digital Ocean | $12 | 30 mins | Easy |
| Vercel + Proxy | $5-12 | 1 hour | Medium |

All options work equally well for Cashfree IP whitelisting!
