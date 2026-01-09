// Firebase Cloud Messaging Service Worker
// This file runs in the background to receive push notifications

console.log('[firebase-messaging-sw.js] Service worker script loaded')

// Import Firebase scripts with error handling
try {
  importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js')
  importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js')
  console.log('[firebase-messaging-sw.js] Firebase scripts imported successfully')
} catch (error) {
  console.error('[firebase-messaging-sw.js] Failed to import Firebase scripts:', error)
  throw error
}

// Initialize Firebase in service worker
try {
  const firebaseConfig = {
    apiKey: "AIzaSyARrEFN63VRJEJBVtNVEibqziegEQta7gQ",
    authDomain: "pcl-professional-club-league.firebaseapp.com",
    projectId: "pcl-professional-club-league",
    storageBucket: "pcl-professional-club-league.firebasestorage.app",
    messagingSenderId: "605135281202",
    appId: "1:605135281202:web:1ba4184f4057b13495702b"
  }
  
  console.log('[firebase-messaging-sw.js] Initializing Firebase with config:', {
    ...firebaseConfig,
    apiKey: '***' // Hide API key in logs
  })
  
  firebase.initializeApp(firebaseConfig)
  console.log('[firebase-messaging-sw.js] Firebase initialized successfully')
} catch (error) {
  console.error('[firebase-messaging-sw.js] Failed to initialize Firebase:', error)
  throw error
}

// Get messaging instance with error handling
let messaging
try {
  messaging = firebase.messaging()
  console.log('[firebase-messaging-sw.js] Messaging instance created')
  
  // Log messaging configuration for debugging
  console.log('[firebase-messaging-sw.js] Messaging ready to receive tokens')
} catch (error) {
  console.error('[firebase-messaging-sw.js] Failed to get messaging instance:', error)
  console.error('[firebase-messaging-sw.js] Error details:', {
    name: error.name,
    message: error.message,
    code: error.code,
    stack: error.stack
  })
  // Don't throw here, as this will prevent the service worker from installing
}

// Handle background messages (when app is closed or in background)
if (messaging) {
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
} else {
  console.warn('[firebase-messaging-sw.js] Messaging instance not available, background messages will not work')
}

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
