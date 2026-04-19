import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/middleware/auth'
import { registrationCreateSchema } from '@/lib/validations/registration'
import { createRegistration } from '@/lib/services/registrations'
import { createClient } from '@/lib/supabase/server'
import { checkRateLimit } from '@/lib/utils/rate-limit'
import { sendRegistrationConfirmation } from '@/lib/email/resend'
import { handleApiError, NotFoundError, RateLimitError, ValidationError, ConflictError } from '@/lib/errors'

/**
 * POST /api/registrations
 * Register for an event
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 11.1, 11.4, 12.8
 */
export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const user = await requireAuth()
    
    // Check rate limit: 5 registrations per hour
    const rateLimit = checkRateLimit(user.id, 5, 60 * 60 * 1000)
    if (!rateLimit.allowed) {
      const resetDate = new Date(rateLimit.resetTime)
      throw new RateLimitError(`Rate limit exceeded. Too many registration attempts. Reset time: ${resetDate.toISOString()}`)
    }
    
    // Parse and validate request body
    const body = await request.json()
    const validatedData = registrationCreateSchema.parse(body)
    
    // Check if registration is open for the event
    const supabase = await createClient()
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('*')
      .eq('id', validatedData.event_id)
      .single()
    
    if (eventError || !event) {
      throw new NotFoundError('Event not found')
    }
    
    if (!event.registration_open) {
      throw new ValidationError('Registration is closed for this event')
    }
    
    // Create registration with capacity check
    const registration = await createRegistration(user.id, validatedData)
    
    // Send registration confirmation email (non-blocking)
    // Requirements: 5.7, 11.1, 11.4
    if (user.email) {
      sendRegistrationConfirmation(
        user.email,
        event.title,
        {
          title: event.title,
          description: event.description,
          start_date: event.start_date,
          end_date: event.end_date,
          location: event.location,
          status: registration.status as 'confirmed' | 'waitlisted'
        }
      ).catch(error => {
        // Log email error but don't fail the registration
        console.error('Failed to send registration confirmation email:', error)
      })
    }
    
    return NextResponse.json(registration, { status: 201 })
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * GET /api/registrations
 * Get current user's registrations across all events
 * Requirements: 5.8
 */
export async function GET() {
  try {
    // Verify authentication
    const user = await requireAuth()
    
    // Get user's registrations with event details
    const supabase = await createClient()
    const { data: registrations, error } = await supabase
      .from('registrations')
      .select(`
        *,
        events:event_id (
          id,
          title,
          description,
          start_date,
          end_date,
          location,
          max_participants,
          registration_open,
          image_urls,
          prizes,
          themes
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    
    if (error) {
      throw new Error(`Failed to get registrations: ${error.message}`)
    }
    
    return NextResponse.json(registrations || [])
  } catch (error) {
    return handleApiError(error)
  }
}
