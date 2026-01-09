/**
 * Enhanced Message Service with Push Notifications
 * Use this to send messages with push notification support
 */

import { createClient } from '@/lib/supabase/client'
import { sendPushToUser } from './sendPushNotification'

/**
 * Send a new message with push notification
 */
export async function sendMessageWithPush(payload: {
  receiverId: string
  receiverType: 'club_owner' | 'player'
  subject?: string
  content: string
}): Promise<{ success: boolean; error?: string; messageId?: string }> {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    // Determine sender type
    // Fix 406 error: Don't use .eq('user_id') on players table
    const { data: allPlayers } = await supabase
      .from('players')
      .select('id, user_id')

    const playerData = allPlayers?.find(p => p.user_id === user.id)
    const senderType = playerData ? 'player' : 'club_owner'

    // Get sender's name for notification
    let senderName = 'Someone'
    if (senderType === 'club_owner') {
      const { data: clubData } = await supabase
        .from('clubs')
        .select('club_name')
        .eq('owner_id', user.id)
        .single()
      senderName = clubData?.club_name || 'A Club'
    } else {
      const { data: userData } = await supabase
        .from('users')
        .select('first_name, last_name')
        .eq('id', user.id)
        .single()
      if (userData?.first_name && userData?.last_name) {
        senderName = `${userData.first_name} ${userData.last_name}`
      } else {
        senderName = 'A Player'
      }
    }

    // Insert message
    const { data, error } = await supabase
      .from('messages')
      .insert({
        sender_id: user.id,
        sender_type: senderType,
        receiver_id: payload.receiverId,
        receiver_type: payload.receiverType,
        subject: payload.subject || null,
        content: payload.content,
        is_read: false
      })
      .select()
      .single()

    if (error) {
      console.error('Error sending message:', error)
      return { success: false, error: error.message }
    }

    // Send push notification to receiver (don't await - send in background)
    console.log('📤 Attempting to send push notification to:', payload.receiverId)
    sendPushToUser(
      payload.receiverId,
      `New message from ${senderName}`,
      payload.content.substring(0, 100),
      '/dashboard/messages'
    ).then(result => {
      console.log('✅ Push notification result:', result)
    }).catch(err => {
      console.error('❌ Failed to send push notification:', err)
      // Don't fail the message if push fails
    })

    return { success: true, messageId: data.id }
  } catch (err) {
    console.error('Error in sendMessageWithPush:', err)
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error'
    }
  }
}
