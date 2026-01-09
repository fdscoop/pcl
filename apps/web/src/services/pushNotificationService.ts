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

    // Register service worker
    const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js')
    await navigator.serviceWorker.ready

    // Get FCM token
    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: registration
    })

    if (!token) {
      return { success: false, error: 'Failed to get FCM token' }
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
