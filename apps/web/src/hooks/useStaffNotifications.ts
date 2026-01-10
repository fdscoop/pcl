import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Notification } from '@/types/database'

export function useStaffNotifications(staffId: string | null) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!staffId) return

    loadNotifications()

    // Set up real-time subscription
    const supabase = createClient()
    const channel = supabase
      .channel(`staff-notifications:${staffId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `staff_id=eq.${staffId}`
        },
        (payload) => {
          console.log('Staff notification change:', payload)
          loadNotifications()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [staffId])

  const loadNotifications = async () => {
    if (!staffId) return

    try {
      setLoading(true)
      const supabase = createClient()

      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('staff_id', staffId)
        .order('created_at', { ascending: false })
        .limit(20)

      if (error) {
        console.error('Error loading staff notifications:', error)
        return
      }

      setNotifications(data || [])

      // Count unread (use read_by_staff field)
      const unread = (data || []).filter((n) => !n.read_by_staff).length
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
          read_by_staff: true,
          staff_read_at: new Date().toISOString()
        })
        .eq('id', notificationId)

      // Update local state
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notificationId
            ? { ...n, read_by_staff: true, staff_read_at: new Date().toISOString() }
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
        .filter((n) => !n.read_by_staff)
        .map((n) => n.id)

      if (unreadIds.length === 0) return

      await supabase
        .from('notifications')
        .update({
          read_by_staff: true,
          staff_read_at: new Date().toISOString()
        })
        .in('id', unreadIds)

      // Update local state
      setNotifications((prev) =>
        prev.map((n) =>
          unreadIds.includes(n.id)
            ? { ...n, read_by_staff: true, staff_read_at: new Date().toISOString() }
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
