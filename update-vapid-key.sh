#!/bin/bash
# Script to update VAPID key everywhere

echo "🔧 VAPID Key Update Script"
echo "=========================="
echo ""
echo "⚠️  IMPORTANT: Delete and regenerate the key in Firebase Console first!"
echo "   Go to: https://console.firebase.google.com/project/pcl-professional-club-league/settings/cloudmessaging"
echo "   Click 'Delete key pair', then 'Generate key pair'"
echo ""
echo -n "Paste your NEW VAPID key from Firebase Console: "
read NEW_VAPID_KEY

# Validate key
if [ ${#NEW_VAPID_KEY} -ne 88 ]; then
  echo "❌ Error: VAPID key should be exactly 88 characters. You entered ${#NEW_VAPID_KEY} characters."
  exit 1
fi

if [[ ! $NEW_VAPID_KEY =~ ^[A-Za-z0-9_-]+$ ]]; then
  echo "❌ Error: VAPID key contains invalid characters"
  exit 1
fi

echo ""
echo "✅ VAPID key format looks correct"
echo "📝 Updating files..."
echo ""

# Update .env.local
cd /Users/bineshbalan/pcl/apps/web
if grep -q "NEXT_PUBLIC_FIREBASE_VAPID_KEY" .env.local; then
  sed -i '' "s|NEXT_PUBLIC_FIREBASE_VAPID_KEY=.*|NEXT_PUBLIC_FIREBASE_VAPID_KEY=\"$NEW_VAPID_KEY\"|" .env.local
  echo "✅ Updated .env.local"
else
  echo "NEXT_PUBLIC_FIREBASE_VAPID_KEY=\"$NEW_VAPID_KEY\"" >> .env.local
  echo "✅ Added to .env.local"
fi

# Update firebase config fallback
if grep -q "BBkiBTx3DpjcPOquqJRQQG24PRBZrBWL0hlhxcgRigdggG5coUNoqWxnaeoEqCGTiTJvwK4l5Wqj4ntS2xxIZPk" src/lib/firebase/config.ts; then
  sed -i '' "s|BBkiBTx3DpjcPOquqJRQQG24PRBZrBWL0hlhxcgRigdggG5coUNoqWxnaeoEqCGTiTJvwK4l5Wqj4ntS2xxIZPk|$NEW_VAPID_KEY|g" src/lib/firebase/config.ts
  echo "✅ Updated firebase/config.ts"
fi

echo ""
echo "🔄 Committing changes..."
cd /Users/bineshbalan/pcl
git add apps/web/.env.local apps/web/src/lib/firebase/config.ts
git commit -m "fix: Update VAPID key - regenerated from Firebase Console"
git push origin main

echo ""
echo "✅ Code updated and pushed to GitHub"
echo ""
echo "📋 Next steps:"
echo "1. Go to Vercel: https://vercel.com/fdscoop/pcl/settings/environment-variables"
echo "2. Find NEXT_PUBLIC_FIREBASE_VAPID_KEY"
echo "3. Edit and update to: $NEW_VAPID_KEY"
echo "4. Save"
echo "5. Go to Deployments and click 'Redeploy'"
echo ""
echo "Or use Vercel CLI:"
echo "  vercel env rm NEXT_PUBLIC_FIREBASE_VAPID_KEY production"
echo "  vercel env add NEXT_PUBLIC_FIREBASE_VAPID_KEY production"
echo "  (paste key when prompted)"
echo "  vercel --prod"
echo ""
