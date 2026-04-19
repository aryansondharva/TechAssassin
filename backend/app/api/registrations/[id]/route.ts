import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, requireAdmin } from '@/lib/middleware/auth'
import { registrationUpdateSchema } from '@/lib/validations/registration'
import { createClient } from '@/lib/supabase/server'
import { ZodError } from 'zod'

/**
 * PATCH /api/registrations/[id]
 * Update registration status (admin only)
 * Requirements: 5.10
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
    const validatedData = registrationUpdateSchema.parse(body)
    
    // Update registration status
    const supabase = await createClient()
    const { data: registration, error } = await supabase
      .from('registrations')
      .update({ status: validatedData.status })
      .eq('id', id)
      .select()
      .single()
    
    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Registration not found' },
          { status: 404 }
        )
      }
      throw new Error(`Failed to update registration: ${error.message}`)
    }
    
    return NextResponse.json(registration)
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      )
    }
    
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
    
    console.error('PATCH /api/registrations/[id] error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
