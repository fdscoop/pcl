// Firebase Configuration
// This file initializes Firebase for the web app

import { initializeApp, getApps } from 'firebase/app'
import { getMessaging, getToken, onMessage, isSupported } from 'firebase/messaging'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyARrEFN63VRJEJBVtNVEibqziegEQta7gQ",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "pcl-professional-club-league.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "pcl-professional-club-league",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "pcl-professional-club-league.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "605135281202",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:605135281202:web:1ba4184f4057b13495702b",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-DXCFBH7967"
}

// Log config for debugging (hide sensitive values)
if (typeof window !== 'undefined') {
  console.log('🔥 Firebase config loaded:', {
    projectId: firebaseConfig.projectId,
    appId: firebaseConfig.appId,
    messagingSenderId: firebaseConfig.messagingSenderId,
    hasApiKey: !!firebaseConfig.apiKey,
    apiKeySource: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? 'env' : 'fallback'
  })
}

// Initialize Firebase (only once)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]

// Get Firebase Cloud Messaging instance
let messaging: ReturnType<typeof getMessaging> | null = null

export const getFirebaseMessaging = async () => {
  if (typeof window === 'undefined') {
    return null
  }

  const supported = await isSupported()
  if (!supported) {
    console.warn('Firebase Messaging is not supported in this browser')
    return null
  }

  if (!messaging) {
    messaging = getMessaging(app)
  }

  return messaging
}

export { app, onMessage }

// VAPID Key for Web Push
export const VAPID_KEY = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY || "BBkiBTx3DpjcPOquqJRQQG24PRBZrBWL0hlhxcgRigdggG5coUNoqWxnaeoEqCGTiTJvwK4l5Wqj4ntS2xxIZPk"

// Log VAPID key source for debugging
if (typeof window !== 'undefined') {
  console.log('🔑 VAPID key source:', process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY ? 'env' : 'fallback')
}
