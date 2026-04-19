import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@clerk/react'
import { api } from '@/lib/api-client'
import type { Profile } from '@/types/api' // Keeping to minimal dependencies

export interface Notification {
  id: string
  user_id: string
  type: string
  title: string
  content: string | null
  metadata: Record<string, any>
  action_url: string | null
  is_read: boolean
  created_at: string
}

export function useNotifications() {
  const { userId } = useAuth()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)

  // Initial fetch via your backend API
  useEffect(() => {
    if (!userId) {
      setNotifications([]);
      setUnreadCount(0);
      setLoading(false);
      return;
    }
    
    setLoading(true);
    api.get<{ data: Notification[] }>('/notifications')
      .then(res => {
        setNotifications(res.data)
        setUnreadCount(res.data.filter(n => !n.is_read).length)
      })
      .catch(err => console.error("Error fetching notifications:", err))
      .finally(() => setLoading(false))
  }, [userId])

  // Realtime subscription — prepends new notifications as they arrive
  useEffect(() => {
    if (!userId || !supabase) return

    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload: any) => {
          const incoming = payload.new as Notification
          setNotifications(prev => [incoming, ...prev])
          setUnreadCount(prev => prev + 1)
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [userId])

  const markAllRead = useCallback(async () => {
    if (!userId) return;
    try {
      await api.patch('/notifications/read')
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
      setUnreadCount(0)
    } catch (err) {
      console.error("Failed to mark notifications as read:", err)
    }
  }, [userId])

  return { notifications, unreadCount, loading, markAllRead }
}
