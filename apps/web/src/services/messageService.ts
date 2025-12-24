/**
 * Message Service - Handle messaging between players and clubs
 */

import { createClient } from '@/lib/supabase/client'

export interface Message {
  id: string
  sender_id: string
  sender_type: 'club_owner' | 'player'
  receiver_id: string
  receiver_type: 'club_owner' | 'player'
  subject: string | null
  content: string
  is_read: boolean
  created_at: string
  updated_at: string
}

export interface MessageWithSenderInfo extends Message {
  sender_name?: string
  sender_photo?: string
  club_name?: string
  club_logo?: string
}

/**
 * Get all messages for a user (inbox)
 */
export async function getInboxMessages(userId: string): Promise<{
  messages: MessageWithSenderInfo[]
  error?: string
}> {
  try {
    const supabase = createClient()

    const { data: messagesData, error: messagesError } = await supabase
      .from('messages')
      .select('*')
      .eq('receiver_id', userId)
      .order('created_at', { ascending: false })

    if (messagesError) {
      console.error('Error fetching inbox messages:', messagesError)
      return { messages: [], error: messagesError.message }
    }

    if (!messagesData || messagesData.length === 0) {
      return { messages: [] }
    }

    // Enrich messages with sender information
    const enrichedMessages = await Promise.all(
      messagesData.map(async (msg) => {
        const enriched: MessageWithSenderInfo = { ...msg }

        // Get sender info based on sender type
        if (msg.sender_type === 'club_owner') {
          const { data: club } = await supabase
            .from('clubs')
            .select('club_name, logo_url')
            .eq('owner_id', msg.sender_id)
            .single()

          if (club) {
            enriched.club_name = club.club_name
            enriched.club_logo = club.logo_url
          }

          // Get user name
          const { data: user } = await supabase
            .from('users')
            .select('first_name, last_name')
            .eq('id', msg.sender_id)
            .single()

          if (user) {
            const fullName = `${user.first_name} ${user.last_name}`.trim()
            enriched.sender_name = fullName || 'Unknown'
          }
        } else if (msg.sender_type === 'player') {
          // Fetch player info
          const { data: player } = await supabase
            .from('players')
            .select('photo_url, user_id')
            .eq('user_id', msg.sender_id)
            .single()

          if (player) {
            enriched.sender_photo = player.photo_url
          }

          // Get user name
          const { data: user } = await supabase
            .from('users')
            .select('first_name, last_name')
            .eq('id', msg.sender_id)
            .single()

          if (user) {
            const fullName = `${user.first_name} ${user.last_name}`.trim()
            enriched.sender_name = fullName || 'Unknown'
          }
        }

        return enriched
      })
    )

    return { messages: enrichedMessages }
  } catch (err) {
    console.error('Error in getInboxMessages:', err)
    return {
      messages: [],
      error: err instanceof Error ? err.message : 'Unknown error'
    }
  }
}

/**
 * Get all messages sent by a user
 */
export async function getSentMessages(userId: string): Promise<{
  messages: MessageWithSenderInfo[]
  error?: string
}> {
  try {
    const supabase = createClient()

    const { data: messagesData, error: messagesError } = await supabase
      .from('messages')
      .select('*')
      .eq('sender_id', userId)
      .order('created_at', { ascending: false })

    if (messagesError) {
      console.error('Error fetching sent messages:', messagesError)
      return { messages: [], error: messagesError.message }
    }

    if (!messagesData || messagesData.length === 0) {
      return { messages: [] }
    }

    // Enrich messages with receiver information
    const enrichedMessages = await Promise.all(
      messagesData.map(async (msg) => {
        const enriched: MessageWithSenderInfo = { ...msg }

        // Get receiver info based on receiver type
        if (msg.receiver_type === 'club_owner') {
          const { data: club } = await supabase
            .from('clubs')
            .select('club_name, logo_url')
            .eq('owner_id', msg.receiver_id)
            .single()

          if (club) {
            enriched.club_name = club.club_name
            enriched.club_logo = club.logo_url
          }

          // Get user name
          const { data: user } = await supabase
            .from('users')
            .select('first_name, last_name')
            .eq('id', msg.receiver_id)
            .single()

          if (user) {
            const fullName = `${user.first_name} ${user.last_name}`.trim()
            enriched.sender_name = fullName || 'Unknown'
          }
        } else if (msg.receiver_type === 'player') {
          // Fetch player info
          const { data: player } = await supabase
            .from('players')
            .select('photo_url, user_id')
            .eq('user_id', msg.receiver_id)
            .single()

          if (player) {
            enriched.sender_photo = player.photo_url
          }

          // Get user name
          const { data: user } = await supabase
            .from('users')
            .select('first_name, last_name')
            .eq('id', msg.receiver_id)
            .single()

          if (user) {
            const fullName = `${user.first_name} ${user.last_name}`.trim()
            enriched.sender_name = fullName || 'Unknown'
          }
        }

        return enriched
      })
    )

    return { messages: enrichedMessages }
  } catch (err) {
    console.error('Error in getSentMessages:', err)
    return {
      messages: [],
      error: err instanceof Error ? err.message : 'Unknown error'
    }
  }
}

/**
 * Send a new message
 */
export async function sendMessage(payload: {
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
    const { data: playerData } = await supabase
      .from('players')
      .select('id')
      .eq('user_id', user.id)
      .single()

    const senderType = playerData ? 'player' : 'club_owner'

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

    return { success: true, messageId: data.id }
  } catch (err) {
    console.error('Error in sendMessage:', err)
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error'
    }
  }
}

/**
 * Mark a message as read
 */
export async function markMessageAsRead(messageId: string): Promise<boolean> {
  try {
    const supabase = createClient()

    const { error } = await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('id', messageId)

    if (error) {
      console.error('Error marking message as read:', error)
      return false
    }

    return true
  } catch (err) {
    console.error('Error in markMessageAsRead:', err)
    return false
  }
}

/**
 * Get unread message count
 */
export async function getUnreadMessageCount(userId: string): Promise<number> {
  try {
    const supabase = createClient()

    const { count, error } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('receiver_id', userId)
      .eq('is_read', false)

    if (error) {
      console.error('Error getting unread count:', error)
      return 0
    }

    return count || 0
  } catch (err) {
    console.error('Error in getUnreadMessageCount:', err)
    return 0
  }
}

/**
 * Delete a message
 */
export async function deleteMessage(messageId: string): Promise<boolean> {
  try {
    const supabase = createClient()

    const { error } = await supabase
      .from('messages')
      .delete()
      .eq('id', messageId)

    if (error) {
      console.error('Error deleting message:', error)
      return false
    }

    return true
  } catch (err) {
    console.error('Error in deleteMessage:', err)
    return false
  }
}
