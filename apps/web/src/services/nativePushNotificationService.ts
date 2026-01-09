// Native Push Notification Service for Capacitor
// Handles Android/iOS native push notifications using Capacitor Push Notifications plugin

import { PushNotifications } from '@capacitor/push-notifications'
import { Capacitor } from '@capacitor/core'
import { createClient } from '@/lib/supabase/client'

/**
 * Check if running on a native platform (Android/iOS)
 * This checks if Capacitor runtime is available, regardless of where content is loaded from
 */
export function isNativePlatform(): boolean {
  try {
    // Check if Capacitor is available in the global scope
    return typeof (window as any).Capacitor !== 'undefined' && Capacitor.isNativePlatform()
  } catch {
    return false
  }
}

/**
 * Initialize native push notifications
 * Call this when the app loads
 */
export async function initializeNativePushNotifications(userId: string): Promise<{ success: boolean; error?: string; token?: string }> {
  if (!isNativePlatform()) {
    return { success: false, error: 'Not running on native platform' }
  }

  try {
    console.log('📱 Initializing native push notifications for user:', userId)

    // Request permission to use push notifications
    let permStatus = await PushNotifications.checkPermissions()
    console.log('📱 Current permission status:', permStatus.receive)

    if (permStatus.receive === 'prompt') {
      console.log('📱 Requesting push notification permission...')
      permStatus = await PushNotifications.requestPermissions()
    }

    if (permStatus.receive !== 'granted') {
      console.log('❌ Push notification permission denied')
      return { success: false, error: 'Permission denied' }
    }

    console.log('✅ Push notification permission granted')

    // Register with Apple / Google to receive push via APNS/FCM
    await PushNotifications.register()

    return new Promise((resolve) => {
      // Listen for registration success
      PushNotifications.addListener('registration', async (token) => {
        console.log('✅ Native push registration success. Token:', token.value)

        // Save token to Supabase
        const saved = await saveNativeTokenToDatabase(userId, token.value)
        if (saved) {
          resolve({ success: true, token: token.value })
        } else {
          resolve({ success: false, error: 'Failed to save token to database' })
        }
      })

      // Listen for registration errors
      PushNotifications.addListener('registrationError', (error: any) => {
        console.error('❌ Native push registration error:', error)
        resolve({ success: false, error: error.error || 'Registration failed' })
      })

      // Timeout after 10 seconds
      setTimeout(() => {
        resolve({ success: false, error: 'Registration timeout' })
      }, 10000)
    })
  } catch (error) {
    console.error('❌ Error initializing native push notifications:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Save native FCM token to Supabase database
 */
async function saveNativeTokenToDatabase(userId: string, token: string): Promise<boolean> {
  try {
    const supabase = createClient()

    // Get device info
    const deviceInfo = {
      platform: Capacitor.getPlatform(),
      model: 'unknown',
      os: Capacitor.getPlatform(),
    }

    console.log('💾 Saving native token to database:', { userId, token, deviceInfo })

    // Check if token already exists
    const { data: existingToken } = await supabase
      .from('notification_tokens')
      .select('id')
      .eq('user_id', userId)
      .eq('token', token)
      .single()

    if (existingToken) {
      // Update existing token to active
      const { error } = await supabase
        .from('notification_tokens')
        .update({
          is_active: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingToken.id)

      if (error) {
        console.error('❌ Error updating token:', error)
        return false
      }

      console.log('✅ Token updated in database')
      return true
    }

    // Insert new token
    const { error } = await supabase
      .from('notification_tokens')
      .insert({
        user_id: userId,
        token: token,
        device_type: Capacitor.getPlatform(), // 'android' or 'ios'
        browser: 'native-app',
        os: deviceInfo.os,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })

    if (error) {
      console.error('❌ Error saving token:', error)
      return false
    }

    console.log('✅ Token saved to database')
    return true
  } catch (error) {
    console.error('❌ Error in saveNativeTokenToDatabase:', error)
    return false
  }
}

/**
 * Set up listeners for incoming push notifications
 */
export function setupNativePushListeners() {
  if (!isNativePlatform()) {
    return
  }

  // Show notification received
  PushNotifications.addListener('pushNotificationReceived', (notification) => {
    console.log('📬 Push notification received:', notification)
  })

  // Handle notification click/tap
  PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
    console.log('👆 Push notification action performed:', notification)
    
    // You can handle navigation here based on notification data
    if (notification.notification.data?.action_url) {
      window.location.href = notification.notification.data.action_url
    }
  })
}

/**
 * Get list of delivered notifications
 */
export async function getDeliveredNotifications() {
  if (!isNativePlatform()) {
    return []
  }

  const result = await PushNotifications.getDeliveredNotifications()
  return result.notifications
}

/**
 * Remove all delivered notifications
 */
export async function removeAllDeliveredNotifications() {
  if (!isNativePlatform()) {
    return
  }

  await PushNotifications.removeAllDeliveredNotifications()
}
