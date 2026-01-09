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

    // Verify current auth session first
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    console.log('🔐 Auth verification for token save:', {
      requestedUserId: userId,
      authUserId: user?.id,
      authUserEmail: user?.email,
      authError: authError?.message
    })

    if (authError || !user) {
      console.error('❌ Auth verification failed:', authError)
      return false
    }

    if (user.id !== userId) {
      console.error('❌ User ID mismatch:', { expected: userId, actual: user.id })
      return false
    }

    // Get device info
    const deviceInfo = {
      platform: Capacitor.getPlatform(),
      model: 'unknown',
      os: Capacitor.getPlatform(),
      userAgent: navigator.userAgent
    }

    console.log('💾 Saving native token to database:', { userId, token: token.substring(0, 20) + '...', deviceInfo })

    // Get user profile to verify role and permissions
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('id, role, email, is_active')
      .eq('id', userId)
      .single()

    console.log('👤 User profile check:', {
      userProfile,
      profileError: profileError?.message
    })

    if (profileError || !userProfile) {
      console.error('❌ Cannot verify user profile:', profileError)
      return false
    }

    // Check if token already exists for ANY user (not just current user)
    const { data: existingToken, error: checkError } = await supabase
      .from('notification_tokens')
      .select('id, user_id')
      .eq('token', token)
      .maybeSingle()

    if (checkError) {
      console.error('❌ Error checking existing token:', checkError)
    }

    console.log('🔍 Token ownership check:', {
      tokenExists: !!existingToken,
      currentOwner: existingToken?.user_id,
      newOwner: userId,
      needsTransfer: existingToken && existingToken.user_id !== userId
    })

    if (existingToken) {
      if (existingToken.user_id === userId) {
        // Same user, just update to active
        console.log('📝 Updating existing token for same user:', existingToken.id)
        
        const { error } = await supabase
          .from('notification_tokens')
          .update({
            is_active: true,
            last_used_at: new Date().toISOString()
          })
          .eq('id', existingToken.id)

        if (error) {
          console.error('❌ Error updating token:', {
            error,
            message: error.message,
            code: error.code,
            details: error.details,
            hint: error.hint
          })
          return false
        }

        console.log('✅ Token updated for same user')
        return true
      } else {
        // Different user - transfer token ownership (same device, different login)
        console.log('🔄 Transferring token ownership from', existingToken.user_id, 'to', userId)
        
        const { error } = await supabase
          .from('notification_tokens')
          .update({
            user_id: userId, // Transfer ownership
            is_active: true,
            last_used_at: new Date().toISOString(),
            device_info: deviceInfo // Update device info
          })
          .eq('id', existingToken.id)

        if (error) {
          console.error('❌ Error transferring token ownership:', {
            error,
            message: error.message,
            code: error.code,
            details: error.details,
            hint: error.hint
          })
          return false
        }

        console.log('✅ Token ownership transferred successfully')
        return true
      }
    }

    // Insert new token
    const insertData = {
      user_id: userId,
      token: token,
      device_type: Capacitor.getPlatform(), // 'android' or 'ios'
      device_info: deviceInfo,
      is_active: true
    }

    console.log('📝 Attempting to insert token:', insertData)

    const { error } = await supabase
      .from('notification_tokens')
      .insert(insertData)

    if (error) {
      console.error('❌ Error saving token:', {
        error,
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      })
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
