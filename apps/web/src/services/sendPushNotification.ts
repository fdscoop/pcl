// Client-side service to send push notifications via Supabase Edge Function

import { createClient } from '@/lib/supabase/client'

export interface SendPushNotificationParams {
  userId?: string
  userIds?: string[]
  title: string
  body: string
  actionUrl?: string
  icon?: string
  data?: Record<string, any>
  tag?: string
}

export interface SendPushNotificationResponse {
  success: boolean
  sentCount?: number
  errorCount?: number
  error?: string
  results?: any[]
  errors?: any[]
}

/**
 * Send a push notification to one or more users
 */
export async function sendPushNotification(
  params: SendPushNotificationParams
): Promise<SendPushNotificationResponse> {
  try {
    const supabase = createClient()

    // Get the current user's session to authenticate the request
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      return {
        success: false,
        error: 'User not authenticated'
      }
    }

    // Call the Supabase Edge Function
    const { data, error } = await supabase.functions.invoke('send-push-notification', {
      body: {
        user_id: params.userId,
        user_ids: params.userIds,
        title: params.title,
        body: params.body,
        action_url: params.actionUrl,
        icon: params.icon,
        data: params.data,
        tag: params.tag
      }
    })

    if (error) {
      console.error('Error calling push notification function:', error)
      return {
        success: false,
        error: error.message || 'Failed to send push notification'
      }
    }

    return {
      success: true,
      sentCount: data.sent_count,
      errorCount: data.error_count,
      results: data.results,
      errors: data.errors
    }
  } catch (error) {
    console.error('Error sending push notification:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Send a push notification to a single user
 */
export async function sendPushToUser(
  userId: string,
  title: string,
  body: string,
  actionUrl?: string
): Promise<SendPushNotificationResponse> {
  return sendPushNotification({
    userId,
    title,
    body,
    actionUrl
  })
}

/**
 * Send a push notification to multiple users
 */
export async function sendPushToUsers(
  userIds: string[],
  title: string,
  body: string,
  actionUrl?: string
): Promise<SendPushNotificationResponse> {
  return sendPushNotification({
    userIds,
    title,
    body,
    actionUrl
  })
}
