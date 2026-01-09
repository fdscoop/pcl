// Push Notification Service
// Handles FCM subscription, token management, and notification permissions

import { getFirebaseMessaging, VAPID_KEY, onMessage } from '@/lib/firebase/config'
import { getToken } from 'firebase/messaging'
import { createClient } from '@/lib/supabase/client'

export interface DeviceInfo {
  browser: string
  os: string
  platform: string
  userAgent: string
}

/**
 * Get device information for better notification management
 */
function getDeviceInfo(): DeviceInfo {
  if (typeof window === 'undefined') {
    return {
      browser: 'unknown',
      os: 'unknown',
      platform: 'unknown',
      userAgent: 'unknown'
    }
  }

  const ua = navigator.userAgent
  let browser = 'Unknown'
  let os = 'Unknown'

  // Detect browser
  if (ua.indexOf('Firefox') > -1) browser = 'Firefox'
  else if (ua.indexOf('Chrome') > -1) browser = 'Chrome'
  else if (ua.indexOf('Safari') > -1) browser = 'Safari'
  else if (ua.indexOf('Edge') > -1) browser = 'Edge'

  // Detect OS
  if (ua.indexOf('Win') > -1) os = 'Windows'
  else if (ua.indexOf('Mac') > -1) os = 'macOS'
  else if (ua.indexOf('Linux') > -1) os = 'Linux'
  else if (ua.indexOf('Android') > -1) os = 'Android'
  else if (ua.indexOf('iOS') > -1) os = 'iOS'

  return {
    browser,
    os,
    platform: navigator.platform,
    userAgent: ua
  }
}

/**
 * Check if push notifications are supported in this browser
 */
export function isPushNotificationSupported(): boolean {
  if (typeof window === 'undefined') return false
  return 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window
}

/**
 * Get current notification permission status
 */
export function getNotificationPermission(): NotificationPermission {
  if (!isPushNotificationSupported()) return 'denied'
  return Notification.permission
}

/**
 * Request notification permission from user
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!isPushNotificationSupported()) {
    throw new Error('Push notifications are not supported in this browser')
  }

  const permission = await Notification.requestPermission()
  return permission
}

/**
 * Unregister ALL service workers to ensure clean slate
 * This helps fix "Registration failed - push service error"
 */
async function unregisterAllServiceWorkers(): Promise<void> {
  try {
    const registrations = await navigator.serviceWorker.getRegistrations()
    console.log(`Found ${registrations.length} service worker(s) to unregister`)
    
    for (const registration of registrations) {
      const scriptURL = registration.active?.scriptURL || 'unknown'
      await registration.unregister()
      console.log('✓ Unregistered service worker:', scriptURL)
    }
    
    // Wait a bit for cleanup
    await new Promise(resolve => setTimeout(resolve, 100))
  } catch (error) {
    console.warn('Failed to unregister service workers:', error)
  }
}

/**
 * Wait for service worker to be fully ready
 */
async function waitForServiceWorkerReady(registration: ServiceWorkerRegistration, timeout = 10000): Promise<void> {
  const start = Date.now()
  
  while (!registration.active) {
    if (Date.now() - start > timeout) {
      throw new Error('Service worker activation timeout')
    }
    await new Promise(resolve => setTimeout(resolve, 100))
  }
  
  // Extra wait to ensure service worker is truly ready
  await new Promise(resolve => setTimeout(resolve, 500))
}

/**
 * Check if FCM endpoints are reachable
 * This helps diagnose network/firewall issues
 */
async function checkFCMConnectivity(): Promise<{ reachable: boolean; error?: string }> {
  try {
    // Try to reach Firebase CDN (more reliable test)
    const firebaseResponse = await fetch('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js', {
      method: 'HEAD',
      mode: 'no-cors'
    })
    
    // Note: FCM endpoint returns 404 for HEAD/GET without auth, which is normal
    // We just want to verify network connectivity, not API functionality
    console.log('✅ Firebase CDN connectivity check passed')
    return { reachable: true }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('❌ Firebase CDN connectivity check failed:', errorMessage)
    return { reachable: false, error: errorMessage }
  }
}

/**
 * Subscribe to push notifications and save token to database
 */
export async function subscribeToNotifications(userId: string): Promise<{
  success: boolean
  token?: string
  error?: string
}> {
  try {
    // Check if supported
    if (!isPushNotificationSupported()) {
      return { success: false, error: 'Push notifications not supported' }
    }

    // Check permission
    let permission = getNotificationPermission()
    if (permission === 'default') {
      permission = await requestNotificationPermission()
    }

    if (permission !== 'granted') {
      return { success: false, error: 'Notification permission denied' }
    }

    // Get Firebase messaging instance
    const messaging = await getFirebaseMessaging()
    if (!messaging) {
      return { success: false, error: 'Firebase messaging not available' }
    }

    if (!VAPID_KEY) {
      return { success: false, error: 'VAPID key not configured' }
    }

    // Check FCM connectivity first
    console.log('🌐 Checking FCM connectivity...')
    const connectivity = await checkFCMConnectivity()
    if (!connectivity.reachable) {
      return {
        success: false,
        error: `Cannot reach Firebase servers. Please check your internet connection and try again. ${connectivity.error || ''}`
      }
    }

    // Unregister ALL service workers first for clean slate
    console.log('🔄 Cleaning up old service workers...')
    await unregisterAllServiceWorkers()

    // Register service worker with better error handling
    let registration
    try {
      console.log('📝 Registering new service worker...')
      registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
        scope: '/',
        updateViaCache: 'none' // Prevent caching issues
      })
      
      // Wait for service worker to be truly ready
      await waitForServiceWorkerReady(registration)
      console.log('✅ Service worker registered and ready')
    } catch (swError) {
      console.error('❌ Service worker registration failed:', swError)
      return { 
        success: false, 
        error: `Service worker registration failed: ${swError instanceof Error ? swError.message : String(swError)}` 
      }
    }

    // Get FCM token with retry logic
    let token
    let lastError: Error | null = null
    const maxRetries = 3
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`🔑 Requesting FCM token (attempt ${attempt}/${maxRetries})...`)
        
        // Add a small delay between retries
        if (attempt > 1) {
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt))
        }
        
        // Try to get token
        token = await getToken(messaging, {
          vapidKey: VAPID_KEY,
          serviceWorkerRegistration: registration
        })
        
        if (token) {
          console.log('✅ FCM token obtained successfully')
          break // Success, exit retry loop
        } else {
          console.warn(`⚠️ FCM token is empty (attempt ${attempt}/${maxRetries})`)
          lastError = new Error('Empty token returned')
        }
      } catch (tokenError) {
        lastError = tokenError as Error
        
        // Log detailed error information
        console.error(`❌ Failed to get FCM token (attempt ${attempt}/${maxRetries})`)
        console.error('Error name:', lastError.name)
        console.error('Error message:', lastError.message)
        console.error('Error code:', (tokenError as any).code)
        console.error('Full error object:', tokenError)
        
        // Try to stringify it
        try {
          console.error('Error as JSON:', JSON.stringify(tokenError, Object.getOwnPropertyNames(tokenError)))
        } catch (e) {
          console.error('Could not stringify error')
        }
        
        // If it's not the last attempt, continue to retry
        if (attempt < maxRetries) {
          console.log(`🔄 Retrying in ${attempt} second(s)...`)
        }
      }
    }
    
    // If we still don't have a token after all retries, return error
    if (!token || lastError) {
      const error = lastError || new Error('Unknown error')
      console.error('❌ All token request attempts failed:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      })
      
      // Provide more specific error messages
      let errorMessage = 'Failed to get FCM token after multiple attempts'
      if (error.name === 'AbortError') {
        errorMessage = `Push notifications are currently unavailable. This may be due to:
• Network connectivity issues
• Firewall/VPN blocking FCM servers
• Browser restrictions on localhost

Try:
1. Check your internet connection
2. Disable VPN/firewall temporarily
3. Use a different browser
4. Test on a deployed domain (not localhost)

Technical: ${error.message}`
      } else if (error.message.includes('messaging/permission-blocked')) {
        errorMessage = 'Notification permission is blocked. Please enable notifications in your browser settings.'
      } else if (error.message.includes('messaging/unsupported-browser')) {
        errorMessage = 'Push notifications are not supported in this browser.'
      } else {
        errorMessage = `${error.name}: ${error.message}`
      }
      
      return { success: false, error: errorMessage }
    }

    if (!token) {
      return { success: false, error: 'Failed to get FCM token - empty token returned' }
    }

    // Save token to Supabase
    const supabase = createClient()
    const deviceInfo = getDeviceInfo()

    const { error: dbError } = await supabase
      .from('notification_tokens')
      .upsert(
        {
          user_id: userId,
          token,
          device_type: 'web',
          device_info: deviceInfo,
          is_active: true,
          last_used_at: new Date().toISOString()
        },
        {
          onConflict: 'token',
          ignoreDuplicates: false
        }
      )

    if (dbError) {
      console.error('Error saving token to database:', dbError)
      return { success: false, error: 'Failed to save notification token' }
    }

    console.log('✅ Successfully subscribed to push notifications')
    return { success: true, token }
  } catch (error) {
    console.error('Error subscribing to notifications:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Unsubscribe from push notifications
 */
export async function unsubscribeFromNotifications(userId: string): Promise<{
  success: boolean
  error?: string
}> {
  try {
    const messaging = await getFirebaseMessaging()
    if (!messaging) {
      return { success: false, error: 'Firebase messaging not available' }
    }

    // Get current token
    const token = await getToken(messaging, { vapidKey: VAPID_KEY || '' })

    if (token) {
      // Delete token from database
      const supabase = createClient()
      const { error: dbError } = await supabase
        .from('notification_tokens')
        .delete()
        .match({ user_id: userId, token })

      if (dbError) {
        console.error('Error deleting token from database:', dbError)
        return { success: false, error: 'Failed to delete notification token' }
      }
    }

    console.log('✅ Successfully unsubscribed from push notifications')
    return { success: true }
  } catch (error) {
    console.error('Error unsubscribing from notifications:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Check if user is subscribed to notifications
 */
export async function isSubscribedToNotifications(userId: string): Promise<boolean> {
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('notification_tokens')
      .select('id')
      .eq('user_id', userId)
      .eq('is_active', true)
      .eq('device_type', 'web')
      .limit(1)

    if (error) {
      console.error('Error checking subscription status:', error)
      return false
    }

    return (data?.length ?? 0) > 0
  } catch (error) {
    console.error('Error checking subscription:', error)
    return false
  }
}

/**
 * Listen for foreground messages (when app is open)
 */
export async function listenForForegroundMessages(
  callback: (payload: any) => void
): Promise<(() => void) | null> {
  try {
    const messaging = await getFirebaseMessaging()
    if (!messaging) return null

    // Listen for messages when app is in foreground
    const unsubscribe = onMessage(messaging, (payload) => {
      console.log('📬 Foreground message received:', payload)
      callback(payload)
    })

    return unsubscribe
  } catch (error) {
    console.error('Error setting up foreground message listener:', error)
    return null
  }
}

/**
 * Show a browser notification (when app is in foreground)
 */
export function showBrowserNotification(
  title: string,
  options?: NotificationOptions
): Notification | null {
  if (!isPushNotificationSupported() || Notification.permission !== 'granted') {
    return null
  }

  try {
    return new Notification(title, {
      icon: '/logo.png',
      badge: '/badge.png',
      ...options
    })
  } catch (error) {
    console.error('Error showing notification:', error)
    return null
  }
}
