import { useEffect, useState, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@clerk/react'
import { api } from '@/lib/api-client'
import type { RealtimeChannel } from '@supabase/supabase-js'
import type { Profile } from '@/types/api' // Keeping to minimal dependencies

const generateChannelName = (userId: string) => {
  const channelSuffix = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`
  return `notifications:${userId}:${channelSuffix}`
}

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
  const channelRef = useRef<RealtimeChannel | null>(null)

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
        const dataArr = res?.data || [];
        setNotifications(dataArr)
        setUnreadCount(dataArr.filter(n => !n.is_read).length)
      })
      .catch(err => console.error("Error fetching notifications:", err))
      .finally(() => setLoading(false))
  }, [userId])

  useEffect(() => {
    if (!userId) {
      if (channelRef.current) {
        void supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
      setNotifications([])
      setUnreadCount(0)
      setLoading(false)
      return
    }

    if (!supabase || typeof supabase.channel !== 'function') return

    try {
      if (channelRef.current) {
        void supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }

      const channel = supabase
        .channel(generateChannelName(userId))
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

      channelRef.current = channel

      return () => {
        if (channelRef.current === channel) {
          channelRef.current = null
        }
        void supabase.removeChannel(channel)
      }
    } catch (err) {
      console.error("Failed to hook realtime notifications", err);
    }
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
