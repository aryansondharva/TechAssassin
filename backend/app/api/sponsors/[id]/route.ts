import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireAuth, requireAdmin, AuthenticationError, AuthorizationError } from '@/lib/middleware/auth'
import { sponsorUpdateSchema } from '@/lib/validations/sponsor'
import { deleteSponsorLogo } from '@/lib/storage/cleanup'
import { ZodError } from 'zod'
import { cache, CacheKeys } from '@/lib/utils/cache'

/**
 * PATCH /api/sponsors/[id]
 * Update a sponsor (admin only)
 * Requirements: 9.3
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify authentication
    const user = await requireAuth()
    
    // Verify admin privileges
    await requireAdmin(user.id)
    
    const { id } = params
    
    // Parse and validate request body
    const body = await request.json()
    const validatedData = sponsorUpdateSchema.parse(body)
    
    // Update sponsor in database
    const supabase = await createClient()
    const { data: sponsor, error } = await supabase
      .from('sponsors')
      .update(validatedData)
      .eq('id', id)
      .select()
      .single()
    
    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Sponsor not found' },
          { status: 404 }
        )
      }
      throw new Error(`Failed to update sponsor: ${error.message}`)
    }
    
    // Invalidate sponsors cache
    cache.invalidate(CacheKeys.sponsors())
    
    return NextResponse.json(sponsor)
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      )
    }
    
    if (error instanceof AuthenticationError) {
      return NextResponse.json(
        { error: error.message },
        { status: 401 }
      )
    }
    
    if (error instanceof AuthorizationError) {
      return NextResponse.json(
        { error: error.message },
        { status: 403 }
      )
    }
    
    console.error('PATCH /api/sponsors/[id] error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/sponsors/[id]
 * Delete a sponsor (admin only)
 * Requirements: 9.4, 15.7
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify authentication
    const user = await requireAuth()
    
    // Verify admin privileges
    await requireAdmin(user.id)
    
    const { id } = params
    
    // Delete sponsor from database
    const supabase = await createClient()
    const { error } = await supabase
      .from('sponsors')
      .delete()
      .eq('id', id)
    
    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Sponsor not found' },
          { status: 404 }
        )
      }
      throw new Error(`Failed to delete sponsor: ${error.message}`)
    }
    
    // Clean up sponsor logo from storage
    // Handle cleanup errors gracefully (log but don't fail deletion)
    try {
      await deleteSponsorLogo(id)
    } catch (cleanupError) {
      console.error(`Failed to clean up sponsor logo for sponsor ${id}:`, cleanupError)
      // Continue - sponsor deletion was successful
    }
    
    // Invalidate sponsors cache
    cache.invalidate(CacheKeys.sponsors())
    
    return NextResponse.json({ message: 'Sponsor deleted successfully' })
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return NextResponse.json(
        { error: error.message },
        { status: 401 }
      )
    }
    
    if (error instanceof AuthorizationError) {
      return NextResponse.json(
        { error: error.message },
        { status: 403 }
      )
    }
    
    console.error('DELETE /api/sponsors/[id] error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
