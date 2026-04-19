import { createClient } from '@/lib/supabase/server'
import type { Event, EventWithParticipants } from '@/types/database'

/**
 * Calculate event status based on current date and event dates
 * Requirements: 4.8
 * 
 * @param event - Event object with start_date and end_date
 * @returns 'live' if event is ongoing, 'upcoming' if not started, 'past' if ended
 */
export function calculateEventStatus(event: Event): 'live' | 'upcoming' | 'past' {
  const now = new Date()
  const start = new Date(event.start_date)
  const end = new Date(event.end_date)
  
  if (now >= start && now <= end) {
    return 'live'
  }
  if (now < start) {
    return 'upcoming'
  }
  return 'past'
}

/**
 * Get count of confirmed registrations for an event
 * Requirements: 4.7
 * 
 * @param eventId - UUID of the event
 * @returns Number of confirmed registrations
 */
export async function getParticipantCount(eventId: string): Promise<number> {
  const supabase = await createClient()
  
  const { count, error } = await supabase
    .from('registrations')
    .select('*', { count: 'exact', head: true })
    .eq('event_id', eventId)
    .eq('status', 'confirmed')
  
  if (error) {
    throw new Error(`Failed to get participant count: ${error.message}`)
  }
  
  return count || 0
}

/**
 * List events with optional status filter and pagination
 * Requirements: 4.6, 4.7, 4.8
 * 
 * @param filters - Object containing status, page, and limit
 * @returns Array of events with participant counts and calculated status
 */
export async function listEvents(filters: {
  status?: 'live' | 'upcoming' | 'past'
  page?: number
  limit?: number
}): Promise<{ events: EventWithParticipants[]; total: number }> {
  const supabase = await createClient()
  const page = filters.page || 1
  const limit = filters.limit || 20
  const offset = (page - 1) * limit
  
  // Fetch all events (we'll filter by status in memory since it's calculated)
  const { data: events, error } = await supabase
    .from('events')
    .select('*')
    .order('start_date', { ascending: false })
  
  if (error) {
    throw new Error(`Failed to list events: ${error.message}`)
  }
  
  if (!events) {
    return { events: [], total: 0 }
  }
  
  // Get participant counts for all events in a single query (optimize N+1)
  const eventIds = events.map((e: Event) => e.id)
  const { data: registrationCounts, error: countError } = await supabase
    .from('registrations')
    .select('event_id')
    .in('event_id', eventIds)
    .eq('status', 'confirmed')
  
  if (countError) {
    throw new Error(`Failed to get participant counts: ${countError.message}`)
  }
  
  // Create a map of event_id to participant count
  const participantCountMap = new Map<string, number>()
  registrationCounts?.forEach((reg: { event_id: string }) => {
    participantCountMap.set(reg.event_id, (participantCountMap.get(reg.event_id) || 0) + 1)
  })
  
  // Calculate status for each event and add participant count
  let eventsWithStatus: EventWithParticipants[] = events.map((event: Event) => {
    const status = calculateEventStatus(event)
    const participant_count = participantCountMap.get(event.id) || 0
    
    return {
      ...event,
      status,
      participant_count
    }
  })
  
  // Filter by status if provided
  if (filters.status) {
    eventsWithStatus = eventsWithStatus.filter(
      (event) => event.status === filters.status
    )
  }
  
  // Apply pagination
  const total = eventsWithStatus.length
  const paginatedEvents = eventsWithStatus.slice(offset, offset + limit)
  
  return {
    events: paginatedEvents,
    total
  }
}

/**
 * Get single event by ID with participant count and status
 * Requirements: 4.7, 4.8
 * 
 * @param eventId - UUID of the event
 * @returns Event with participant count and status, or null if not found
 */
export async function getEventById(eventId: string): Promise<EventWithParticipants | null> {
  const supabase = await createClient()
  
  const { data: event, error } = await supabase
    .from('events')
    .select('*')
    .eq('id', eventId)
    .single()
  
  if (error) {
    if (error.code === 'PGRST116') {
      // Not found
      return null
    }
    throw new Error(`Failed to get event: ${error.message}`)
  }
  
  if (!event) {
    return null
  }
  
  const status = calculateEventStatus(event)
  const participant_count = await getParticipantCount(event.id)
  
  return {
    ...event,
    status,
    participant_count
  }
}
