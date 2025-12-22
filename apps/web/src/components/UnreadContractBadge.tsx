'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface UnreadContractBadgeProps {
  userType: 'player' | 'club_owner'
}

export function UnreadContractBadge({ userType }: UnreadContractBadgeProps) {
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    loadUnreadCount()

    // Set up real-time subscription for notifications
    const supabase = createClient()
    const channel = supabase
      .channel('notification_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications'
        },
        () => {
          loadUnreadCount()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userType])

  const loadUnreadCount = async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      if (userType === 'player') {
        // Get player ID
        const { data: playerData } = await supabase
          .from('players')
          .select('id')
          .eq('user_id', user.id)
          .single()

        if (!playerData) return

        // Count unread notifications for this player
        const { count } = await supabase
          .from('notifications')
          .select('*', { count: 'exact', head: true })
          .eq('player_id', playerData.id)
          .eq('read_by_player', false)

        setUnreadCount(count || 0)
      } else if (userType === 'club_owner') {
        // Get club ID
        const { data: clubData } = await supabase
          .from('clubs')
          .select('id')
          .eq('owner_id', user.id)
          .single()

        if (!clubData) return

        // Count unread notifications for this club
        const { count } = await supabase
          .from('notifications')
          .select('*', { count: 'exact', head: true })
          .eq('club_id', clubData.id)
          .eq('read_by_club', false)

        setUnreadCount(count || 0)
      }
    } catch (error) {
      console.error('Error loading unread count:', error)
    }
  }

  if (unreadCount === 0) return null

  return (
    <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white ring-2 ring-white">
      {unreadCount > 9 ? '9+' : unreadCount}
    </span>
  )
}
