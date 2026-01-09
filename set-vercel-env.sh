#!/bin/bash
# Script to set Vercel environment variables

echo "Setting Firebase environment variables in Vercel..."

vercel env add NEXT_PUBLIC_FIREBASE_API_KEY production <<< "AIzaSyARrEFN63VRJEJBVtNVEibqziegEQta7gQ"
vercel env add NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN production <<< "pcl-professional-club-league.firebaseapp.com"
vercel env add NEXT_PUBLIC_FIREBASE_PROJECT_ID production <<< "pcl-professional-club-league"
vercel env add NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET production <<< "pcl-professional-club-league.firebasestorage.app"
vercel env add NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID production <<< "605135281202"
vercel env add NEXT_PUBLIC_FIREBASE_APP_ID production <<< "1:605135281202:web:1ba4184f4057b13495702b"
vercel env add NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID production <<< "G-DXCFBH7967"
vercel env add NEXT_PUBLIC_FIREBASE_VAPID_KEY production <<< "BBkiBTx3DpjcPOquqJRQQG24PRBZrBWL0hlhxcgRigdggG5coUNoqWxnaeoEqCGTiTJvwK4l5Wqj4ntS2xxIZPk"

echo "✅ Environment variables set!"
echo "Now redeploy: vercel --prod"
