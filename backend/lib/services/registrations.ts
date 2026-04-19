import { createClient } from '@/lib/supabase/server'
import { getParticipantCount } from './events'

/**
 * Determine registration status based on event capacity
 * Requirements: 5.3, 5.4, 5.5
 * 
 * @param eventId - UUID of the event
 * @returns 'confirmed' if capacity available, 'waitlisted' if at capacity
 */
export async function determineRegistrationStatus(
  eventId: string
): Promise<'confirmed' | 'waitlisted'> {
  const supabase = await createClient()
  
  // Get event details
  const { data: event, error: eventError } = await supabase
    .from('events')
    .select('max_participants')
    .eq('id', eventId)
    .single()
  
  if (eventError || !event) {
    throw new Error(`Failed to get event details: ${eventError?.message || 'Event not found'}`)
  }
  
  // Get current confirmed participant count
  const confirmedCount = await getParticipantCount(eventId)
  
  // Return status based on capacity
  return confirmedCount < event.max_participants ? 'confirmed' : 'waitlisted'
}

/**
 * Check if user already has a registration for the event
 * Requirements: 5.6
 * 
 * @param userId - UUID of the user
 * @param eventId - UUID of the event
 * @returns true if duplicate registration exists, false otherwise
 */
export async function checkDuplicateRegistration(
  userId: string,
  eventId: string
): Promise<boolean> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('registrations')
    .select('id')
    .eq('user_id', userId)
    .eq('event_id', eventId)
    .maybeSingle()
  
  if (error) {
    throw new Error(`Failed to check duplicate registration: ${error.message}`)
  }
  
  return data !== null
}

/**
 * Create a new registration with capacity check
 * Requirements: 5.3, 5.4, 5.5, 5.6
 * 
 * @param userId - UUID of the user
 * @param data - Registration data (event_id, team_name, project_idea)
 * @returns Created registration object
 */
export async function createRegistration(
  userId: string,
  data: {
    event_id: string
    team_name: string
    project_idea: string
  }
) {
  const supabase = await createClient()
  
  // Check for duplicate registration
  const isDuplicate = await checkDuplicateRegistration(userId, data.event_id)
  if (isDuplicate) {
    throw new Error('You have already registered for this event')
  }
  
  // Determine registration status based on capacity
  const status = await determineRegistrationStatus(data.event_id)
  
  // Create registration
  const { data: registration, error } = await supabase
    .from('registrations')
    .insert({
      user_id: userId,
      event_id: data.event_id,
      team_name: data.team_name,
      project_idea: data.project_idea,
      status
    })
    .select()
    .single()
  
  if (error) {
    throw new Error(`Failed to create registration: ${error.message}`)
  }
  
  return registration
}
