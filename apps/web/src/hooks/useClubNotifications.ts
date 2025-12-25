import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Notification } from '@/types/database'
import { useToast } from '@/context/ToastContext'

export function useClubNotifications(clubId: string | null) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const { addToast } = useToast()

  useEffect(() => {
    if (!clubId) return

    loadNotifications()

    // Set up real-time subscription
    const supabase = createClient()
    const channel = supabase
      .channel(`notifications:${clubId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `club_id=eq.${clubId}`
        },
        (payload) => {
          console.log('Notification change:', payload)
          // Show a small in-app toast for realtime updates to reduce noisy desktop notifications
          try {
            const newRecord = (payload as any)?.record || (payload as any)?.new || null
            if (newRecord) {
              addToast({
                type: 'info',
                title: 'New notification',
                description: newRecord.title || newRecord.notification_type || 'You have a new notification',
                duration: 3000
              })
            }
          } catch (err) {
            console.debug('Toast unavailable for notification:', err)
          }

          loadNotifications()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [clubId])

  const loadNotifications = async () => {
    if (!clubId) return

    try {
      setLoading(true)
      const supabase = createClient()

      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('club_id', clubId)
        .neq('notification_type', 'contract_created') // Exclude player contract offers
        .order('created_at', { ascending: false })
        .limit(20)

      if (error) {
        console.error('Error loading notifications:', error)
        return
      }

      setNotifications(data || [])

      // Count unread (use read_by_club field)
      const unread = (data || []).filter((n) => !n.read_by_club).length
      setUnreadCount(unread)
    } catch (err) {
      console.error('Error in loadNotifications:', err)
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (notificationId: string) => {
    try {
      const supabase = createClient()

      await supabase
        .from('notifications')
        .update({
          read_by_club: true,
          club_read_at: new Date().toISOString()
        })
        .eq('id', notificationId)

      // Update local state
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notificationId
            ? { ...n, read_by_club: true, club_read_at: new Date().toISOString() }
            : n
        )
      )

      setUnreadCount((prev) => Math.max(0, prev - 1))
    } catch (err) {
      console.error('Error marking notification as read:', err)
    }
  }

  const markAllAsRead = async () => {
    try {
      const supabase = createClient()
      const unreadIds = notifications
        .filter((n) => !n.read_by_club)
        .map((n) => n.id)

      if (unreadIds.length === 0) return

      await supabase
        .from('notifications')
        .update({
          read_by_club: true,
          club_read_at: new Date().toISOString()
        })
        .in('id', unreadIds)

      // Update local state
      setNotifications((prev) =>
        prev.map((n) =>
          unreadIds.includes(n.id)
            ? { ...n, read_by_club: true, club_read_at: new Date().toISOString() }
            : n
        )
      )

      setUnreadCount(0)
    } catch (err) {
      console.error('Error marking all notifications as read:', err)
    }
  }

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    reload: loadNotifications
  }
}
