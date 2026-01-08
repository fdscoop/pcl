import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getUnreadMessageCount } from '@/services/messageService'

export function useUnreadMessages(userId: string | null) {
 const [unreadCount, setUnreadCount] = useState(0)
 const [loading, setLoading] = useState(true)

 useEffect(() => {
 if (!userId) {
 setUnreadCount(0)
 setLoading(false)
 return
 }

 const loadUnreadCount = async () => {
 const count = await getUnreadMessageCount(userId)
 setUnreadCount(count)
 setLoading(false)
 }

 loadUnreadCount()

 // Subscribe to real-time message updates
 const supabase = createClient()
 const channel = supabase
 .channel('unread_messages_realtime')
 .on(
 'postgres_changes',
 {
 event: 'INSERT',
 schema: 'public',
 table: 'messages',
 filter: `receiver_id=eq.${userId}`
 },
 () => {
 loadUnreadCount()
 }
 )
 .on(
 'postgres_changes',
 {
 event: 'UPDATE',
 schema: 'public',
 table: 'messages',
 filter: `receiver_id=eq.${userId}`
 },
 () => {
 loadUnreadCount()
 }
 )
 .subscribe()

 return () => {
 supabase.removeChannel(channel)
 }
 }, [userId])

 return { unreadCount, loading }
}
