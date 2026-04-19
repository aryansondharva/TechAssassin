import { NextRequest, NextResponse } from 'next/server'
import { getEventById } from '@/lib/services/events'
import { createClient } from '@/lib/supabase/server'
import { requireAuth, requireAdmin } from '@/lib/middleware/auth'
import { eventUpdateSchema } from '@/lib/validations/event'
import { handleApiError, NotFoundError } from '@/lib/errors'
import { deleteEventImages } from '@/lib/storage/cleanup'
import { cache } from '@/lib/utils/cache'

/**
 * GET /api/events/[id]
 * Get single event by ID with participant count and status
 * Requirements: 4.7, 4.8, 12.5
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    
    const event = await getEventById(id)
    
    if (!event) {
      throw new NotFoundError('Event not found')
    }
    
    return NextResponse.json(event)
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * PATCH /api/events/[id]
 * Update an event (admin only)
 * Requirements: 4.1, 4.3, 4.5
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    
    // Verify authentication
    const user = await requireAuth()
    
    // Verify admin privileges
    await requireAdmin(user.id)
    
    // Parse and validate request body
    const body = await request.json()
    const validatedData = eventUpdateSchema.parse(body)
    
    // Check if event exists
    const existingEvent = await getEventById(id)
    if (!existingEvent) {
      throw new NotFoundError('Event not found')
    }
    
    // Update event in database
    const supabase = await createClient()
    const { data: event, error } = await supabase
      .from('events')
      .update(validatedData)
      .eq('id', id)
      .select()
      .single()
    
    if (error) {
      throw new Error(`Failed to update event: ${error.message}`)
    }
    
    // Invalidate events cache
    cache.invalidatePattern('events:')
    cache.invalidatePattern(`event:${id}`)
    
    return NextResponse.json(event)
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * DELETE /api/events/[id]
 * Delete an event (admin only, cascade deletes registrations)
 * Requirements: 4.4, 4.5, 15.7
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    
    // Verify authentication
    const user = await requireAuth()
    
    // Verify admin privileges
    await requireAdmin(user.id)
    
    // Check if event exists
    const existingEvent = await getEventById(id)
    if (!existingEvent) {
      throw new NotFoundError('Event not found')
    }
    
    // Delete event (cascade will delete registrations)
    const supabase = await createClient()
    const { error } = await supabase
      .from('events')
      .delete()
      .eq('id', id)
    
    if (error) {
      throw new Error(`Failed to delete event: ${error.message}`)
    }
    
    // Clean up event images from storage
    // Handle cleanup errors gracefully (log but don't fail deletion)
    try {
      await deleteEventImages(id)
    } catch (cleanupError) {
      console.error(`Failed to clean up event images for event ${id}:`, cleanupError)
      // Continue - event deletion was successful
    }
    
    // Invalidate events cache
    cache.invalidatePattern('events:')
    cache.invalidatePattern(`event:${id}`)
    
    return NextResponse.json(
      { message: 'Event deleted successfully' },
      { status: 200 }
    )
  } catch (error) {
    return handleApiError(error)
  }
}
