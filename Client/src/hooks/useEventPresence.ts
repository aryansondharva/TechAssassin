import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@clerk/react'

export function useEventPresence(eventId: string) {
  const { userId } = useAuth()
  const [attendeeCount, setAttendeeCount] = useState(0)

  useEffect(() => {
    if (!eventId || !userId || !supabase) return

    const channel = supabase.channel(`event-room:${eventId}`, {
      config: { presence: { key: userId } },
    })

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState()
        setAttendeeCount(Object.keys(state).length)
      })
      .subscribe(async (status: string) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ user_id: userId, joined_at: new Date().toISOString() })
        }
      })

    return () => { supabase.removeChannel(channel) }
  }, [eventId, userId])

  return attendeeCount
}
