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

export interface MessageWithReceiverInfo extends Message {
 receiver_name?: string
 receiver_photo?: string
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

 // Get messages with basic sender information joined
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

 // Group unique sender IDs to reduce database calls
 const clubOwnerIds = new Set<string>()
 const playerIds = new Set<string>()

 messagesData.forEach(msg => {
 if (msg.sender_type === 'club_owner') {
 clubOwnerIds.add(msg.sender_id)
 } else if (msg.sender_type === 'player') {
 playerIds.add(msg.sender_id)
 }
 })

 // Batch fetch club information for all club owners
 const clubsMap = new Map<string, any>()
 if (clubOwnerIds.size > 0) {
 try {
 const { data: clubs } = await supabase
 .from('clubs')
 .select('owner_id, club_name, logo_url')
 .in('owner_id', Array.from(clubOwnerIds))

 clubs?.forEach(club => {
 clubsMap.set(club.owner_id, club)
 })
 } catch (error) {
 console.warn('Failed to fetch club data:', error)
 }
 }

 // Batch fetch player information for all players
 const playersMap = new Map<string, any>()
 if (playerIds.size > 0) {
 try {
 const { data: players } = await supabase
 .from('players')
 .select('user_id, photo_url')
 .in('user_id', Array.from(playerIds))

 players?.forEach(player => {
 playersMap.set(player.user_id, player)
 })
 } catch (error) {
 console.warn('Failed to fetch player data:', error)
 }
 }

 // Batch fetch user names (this might fail due to RLS, so we handle gracefully)
 const usersMap = new Map<string, any>()
 const allUserIds = [...clubOwnerIds, ...playerIds]
 if (allUserIds.length > 0) {
 try {
 const { data: users } = await supabase
 .from('users')
 .select('id, first_name, last_name')
 .in('id', allUserIds)

 users?.forEach(user => {
 usersMap.set(user.id, user)
 })
 } catch (error) {
 // RLS prevents reading user data, we'll use fallback names
 console.info('Using fallback names due to RLS restrictions')
 }
 }

 // Enrich messages with sender information
 const enrichedMessages: MessageWithSenderInfo[] = messagesData.map(msg => {
 const enriched: MessageWithSenderInfo = { ...msg }

 if (msg.sender_type === 'club_owner') {
 const club = clubsMap.get(msg.sender_id)
 if (club) {
 enriched.club_name = club.club_name
 enriched.club_logo = club.logo_url
 enriched.sender_name = club.club_name || 'Club'
 } else {
 enriched.sender_name = 'Club'
 }

 // Try to get user name if available
 const user = usersMap.get(msg.sender_id)
 if (user && user.first_name && user.last_name) {
 const fullName = `${user.first_name} ${user.last_name}`.trim()
 if (fullName) {
 enriched.sender_name = fullName
 }
 }
 } else if (msg.sender_type === 'player') {
 const player = playersMap.get(msg.sender_id)
 if (player) {
 enriched.sender_photo = player.photo_url
 }

 // Try to get user name if available
 const user = usersMap.get(msg.sender_id)
 if (user && user.first_name && user.last_name) {
 const fullName = `${user.first_name} ${user.last_name}`.trim()
 enriched.sender_name = fullName || 'Player'
 } else {
 enriched.sender_name = 'Player'
 }
 }

 return enriched
 })

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
 messages: MessageWithReceiverInfo[]
 error?: string
}> {
 try {
 const supabase = createClient()

 // Get messages sent by the user
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

 // Group unique receiver IDs to reduce database calls
 const clubOwnerIds = new Set<string>()
 const playerIds = new Set<string>()

 messagesData.forEach(msg => {
 if (msg.receiver_type === 'club_owner') {
 clubOwnerIds.add(msg.receiver_id)
 } else if (msg.receiver_type === 'player') {
 playerIds.add(msg.receiver_id)
 }
 })

 // Batch fetch club information for all club owners
 const clubsMap = new Map<string, any>()
 if (clubOwnerIds.size > 0) {
 try {
 const { data: clubs } = await supabase
 .from('clubs')
 .select('owner_id, club_name, logo_url')
 .in('owner_id', Array.from(clubOwnerIds))

 clubs?.forEach(club => {
 clubsMap.set(club.owner_id, club)
 })
 } catch (error) {
 console.warn('Failed to fetch club data:', error)
 }
 }

 // Batch fetch player information for all players
 const playersMap = new Map<string, any>()
 if (playerIds.size > 0) {
 try {
 const { data: players } = await supabase
 .from('players')
 .select('user_id, photo_url')
 .in('user_id', Array.from(playerIds))

 players?.forEach(player => {
 playersMap.set(player.user_id, player)
 })
 } catch (error) {
 console.warn('Failed to fetch player data:', error)
 }
 }

 // Batch fetch user names (this might fail due to RLS, so we handle gracefully)
 const usersMap = new Map<string, any>()
 const allUserIds = [...clubOwnerIds, ...playerIds]
 if (allUserIds.length > 0) {
 try {
 const { data: users } = await supabase
 .from('users')
 .select('id, first_name, last_name')
 .in('id', allUserIds)

 users?.forEach(user => {
 usersMap.set(user.id, user)
 })
 } catch (error) {
 // RLS prevents reading user data, we'll use fallback names
 console.info('Using fallback names due to RLS restrictions')
 }
 }

 // Enrich messages with receiver information
 const enrichedMessages: MessageWithReceiverInfo[] = messagesData.map(msg => {
 const enriched: MessageWithReceiverInfo = { ...msg }

 if (msg.receiver_type === 'club_owner') {
 const club = clubsMap.get(msg.receiver_id)
 if (club) {
 enriched.club_name = club.club_name
 enriched.club_logo = club.logo_url
 enriched.receiver_name = club.club_name || 'Club'
 } else {
 enriched.receiver_name = 'Club'
 }

 // Try to get user name if available
 const user = usersMap.get(msg.receiver_id)
 if (user && user.first_name && user.last_name) {
 const fullName = `${user.first_name} ${user.last_name}`.trim()
 if (fullName) {
 enriched.receiver_name = fullName
 }
 }
 } else if (msg.receiver_type === 'player') {
 const player = playersMap.get(msg.receiver_id)
 if (player) {
 enriched.receiver_photo = player.photo_url
 }

 // Try to get user name if available
 const user = usersMap.get(msg.receiver_id)
 if (user && user.first_name && user.last_name) {
 const fullName = `${user.first_name} ${user.last_name}`.trim()
 enriched.receiver_name = fullName || 'Player'
 } else {
 enriched.receiver_name = 'Player'
 }
 }

 return enriched
 })

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
