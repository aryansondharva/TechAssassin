import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, requireAdmin } from '@/lib/middleware/auth'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/registrations/event/[eventId]
 * Get all registrations for a specific event (admin only)
 * Requirements: 5.9
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { eventId: string } }
) {
  try {
    // Verify authentication
    const user = await requireAuth()
    
    // Verify admin privileges
    await requireAdmin(user.id)
    
    const { eventId } = params
    
    // Get all registrations for the event with user profile details
    const supabase = await createClient()
    const { data: registrations, error } = await supabase
      .from('registrations')
      .select(`
        *,
        profiles:user_id (
          id,
          username,
          full_name,
          avatar_url,
          github_url,
          skills
        )
      `)
      .eq('event_id', eventId)
      .order('created_at', { ascending: false })
    
    if (error) {
      throw new Error(`Failed to get registrations: ${error.message}`)
    }
    
    return NextResponse.json(registrations || [])
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('Unauthorized') || error.message.includes('Authentication required')) {
        return NextResponse.json(
          { error: error.message },
          { status: 401 }
        )
      }
      
      if (error.message.includes('Admin access required')) {
        return NextResponse.json(
          { error: error.message },
          { status: 403 }
        )
      }
    }
    
    console.error('GET /api/registrations/event/[eventId] error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
