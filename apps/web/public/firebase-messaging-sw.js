// Firebase Cloud Messaging Service Worker
// This file runs in the background to receive push notifications

// Import Firebase scripts
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js')

// Initialize Firebase in service worker
// Note: These values will be loaded from environment at build time
firebase.initializeApp({
  apiKey: "AIzaSyCR95bDVUC9MTq746hJRYJWyd3889_mXGw",
  authDomain: "pcl-professional-club-league.firebaseapp.com",
  projectId: "pcl-professional-club-league",
  storageBucket: "pcl-professional-club-league.firebasestorage.app",
  messagingSenderId: "605135281202",
  appId: "1:605135281202:android:eac97e4ace09317a95702b"
})

const messaging = firebase.messaging()

// Handle background messages (when app is closed or in background)
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message:', payload)

  const notificationTitle = payload.notification?.title || 'PCL Notification'
  const notificationOptions = {
    body: payload.notification?.body || 'You have a new notification',
    icon: payload.notification?.icon || '/logo.png',
    badge: '/badge.png',
    tag: payload.data?.tag || 'pcl-notification',
    requireInteraction: false,
    data: {
      url: payload.data?.url || payload.notification?.click_action || '/',
      ...payload.data
    }
  }

  return self.registration.showNotification(notificationTitle, notificationOptions)
})

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  console.log('[firebase-messaging-sw.js] Notification clicked:', event)

  event.notification.close()

  const urlToOpen = event.notification.data?.url || '/'

  event.waitUntil(
    clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Check if there's already a window/tab open
        for (const client of clientList) {
          if (client.url === urlToOpen && 'focus' in client) {
            return client.focus()
          }
        }
        // If no window is open, open a new one
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen)
        }
      })
  )
})

// Optional: Handle push event directly (for more control)
self.addEventListener('push', (event) => {
  console.log('[firebase-messaging-sw.js] Push event received:', event)

  if (event.data) {
    try {
      const payload = event.data.json()
      console.log('[firebase-messaging-sw.js] Push data:', payload)

      // Firebase messaging already handles this, but you can add custom logic here
      // For example: Play a custom sound, vibrate, etc.
    } catch (error) {
      console.error('[firebase-messaging-sw.js] Error parsing push data:', error)
    }
  }
})

// Log service worker activation
self.addEventListener('activate', (event) => {
  console.log('[firebase-messaging-sw.js] Service worker activated')
})

self.addEventListener('install', (event) => {
  console.log('[firebase-messaging-sw.js] Service worker installed')
  self.skipWaiting() // Activate worker immediately
})
