import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireAuth, requireAdmin, AuthenticationError, AuthorizationError } from '@/lib/middleware/auth'
import { resourceUpdateSchema } from '@/lib/validations/resource'
import { ZodError } from 'zod'

/**
 * PATCH /api/resources/[id]
 * Update a resource (admin only)
 * Requirements: 8.2, 8.4
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
    const validatedData = resourceUpdateSchema.parse(body)
    
    // Update resource in database
    const supabase = await createClient()
    const { data: resource, error } = await supabase
      .from('resources')
      .update(validatedData)
      .eq('id', id)
      .select()
      .single()
    
    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Resource not found' },
          { status: 404 }
        )
      }
      throw new Error(`Failed to update resource: ${error.message}`)
    }
    
    return NextResponse.json(resource)
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
    
    console.error('PATCH /api/resources/[id] error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/resources/[id]
 * Delete a resource (admin only)
 * Requirements: 8.3, 8.4
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
    
    // Delete resource from database
    const supabase = await createClient()
    const { error } = await supabase
      .from('resources')
      .delete()
      .eq('id', id)
    
    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Resource not found' },
          { status: 404 }
        )
      }
      throw new Error(`Failed to delete resource: ${error.message}`)
    }
    
    return NextResponse.json(
      { message: 'Resource deleted successfully' },
      { status: 200 }
    )
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
    
    console.error('DELETE /api/resources/[id] error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
