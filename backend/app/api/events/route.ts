import { NextRequest, NextResponse } from 'next/server'
import { listEvents } from '@/lib/services/events'
import { createClient } from '@/lib/supabase/server'
import { requireAuth, requireAdmin } from '@/lib/middleware/auth'
import { eventCreateSchema } from '@/lib/validations/event'
import { handleApiError, ValidationError } from '@/lib/errors'
import { validatePaginationParams, getPaginationMetadata } from '@/lib/utils/pagination'
import { getCached, cache, CacheKeys, CacheTTL } from '@/lib/utils/cache'

/**
 * GET /api/events
 * List events with optional status filter and pagination
 * Requirements: 4.6, 4.7, 4.8, 13.3, 13.4
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status') as 'live' | 'upcoming' | 'past' | null
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    
    // Validate pagination parameters
    validatePaginationParams(page, limit, 100)
    
    // Validate status if provided
    if (status && !['live', 'upcoming', 'past'].includes(status)) {
      throw new ValidationError('Invalid status filter. Must be live, upcoming, or past')
    }
    
    // Use cache for events list
    const cacheKey = CacheKeys.events(status || undefined, page, limit)
    const result = await getCached(
      cacheKey,
      async () => {
        const { events, total } = await listEvents({
          status: status || undefined,
          page,
          limit
        })
        
        const pagination = getPaginationMetadata(total, page, limit)
        
        return {
          data: events,
          pagination
        }
      },
      CacheTTL.events
    )
    
    return NextResponse.json(result)
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * POST /api/events
 * Create a new event (admin only)
 * Requirements: 4.1, 4.3, 4.5
 */
export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const user = await requireAuth()
    
    // Verify admin privileges
    await requireAdmin(user.id)
    
    // Parse and validate request body
    const body = await request.json()
    const validatedData = eventCreateSchema.parse(body)
    
    // Create event in database
    const supabase = await createClient()
    const { data: event, error } = await supabase
      .from('events')
      .insert({
        title: validatedData.title,
        description: validatedData.description,
        start_date: validatedData.start_date,
        end_date: validatedData.end_date,
        location: validatedData.location,
        max_participants: validatedData.max_participants,
        registration_open: validatedData.registration_open,
        prizes: validatedData.prizes || null,
        themes: validatedData.themes || [],
        image_urls: []
      })
      .select()
      .single()
    
    if (error) {
      throw new Error(`Failed to create event: ${error.message}`)
    }
    
    // Invalidate events cache
    cache.invalidatePattern('events:')
    
    return NextResponse.json(event, { status: 201 })
  } catch (error) {
    return handleApiError(error)
  }
}
