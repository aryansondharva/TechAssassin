import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@clerk/react'

export interface ChatMessage {
  userId: string
  username: string
  text: string
  sentAt: string
}

export function useEventChat(eventId: string) {
  const { userId } = useAuth()
  const [messages, setMessages] = useState<ChatMessage[]>([])

  useEffect(() => {
    if (!eventId || !supabase) return

    const channel = supabase.channel(`event-chat:${eventId}`)

    channel
      .on('broadcast', { event: 'chat_message' }, ({ payload }: any) => {
        setMessages(prev => [...prev, payload as ChatMessage])
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [eventId])

  const sendMessage = useCallback(
    async (text: string, username: string) => {
      if (!userId || !supabase) return
      
      const channel = supabase.channel(`event-chat:${eventId}`)
      // Broadcast messages are ephemeral and don't require database INSERTs latency
      await channel.send({
        type: 'broadcast',
        event: 'chat_message',
        payload: { userId, username, text, sentAt: new Date().toISOString() },
      })
    },
    [eventId, userId]
  )

  return { messages, sendMessage }
}
