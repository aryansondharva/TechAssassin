import { NextResponse } from 'next/server'
import { listEvents } from '../@/lib/services/events'
import { handleApiError } from '../@/lib/errors'

export async function GET() {
  try {
    const { events } = await listEvents({ status: 'upcoming', limit: 10 })
    
    // Map to frontend expected format
    const formattedEvents = events.map(event => ({
      id: event.id,
      name: event.title,
      date: new Date(event.start_date).toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
      }),
      location: event.location,
      participants: event.participant_count || 0,
      maxParticipants: event.max_participants || 100,
      prize: event.prizes && typeof event.prizes === 'object' 
        ? `₹${(event.prizes as any).total || '5L'}+` 
        : '₹5L+',
      status: event.registration_open ? 'registration_open' : 'upcoming'
    }))

    return NextResponse.json(formattedEvents)
  } catch (error) {
    return handleApiError(error)
  }
}
