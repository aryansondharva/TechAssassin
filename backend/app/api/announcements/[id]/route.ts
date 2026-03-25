import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '../../../../lib/supabase/server'
import { requireAuth, AuthenticationError, AuthorizationError } from '../../../../lib/middleware/auth'
import { announcementUpdateSchema } from '../../../../lib/validations/announcement'
import { ZodError } from 'zod'

/**
 * PATCH /api/announcements/[id]
 * Update an announcement (author or admin only)
 * Requirements: 7.3
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify authentication
    const user = await requireAuth()
    
    const { id } = params
    
    // Parse and validate request body
    const body = await request.json()
    const validatedData = announcementUpdateSchema.parse(body)
    
    const supabase = await createClient()
    
    // Check if announcement exists and get author_id
    const { data: existingAnnouncement, error: fetchError } = await supabase
      .from('announcements')
      .select('author_id, author:profiles!announcements_author_id_fkey(is_admin)')
      .eq('id', id)
      .single()
    
    if (fetchError || !existingAnnouncement) {
      return NextResponse.json(
        { error: 'Announcement not found' },
        { status: 404 }
      )
    }
    
    // Check if user is author or admin
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()
    
    const isAuthor = existingAnnouncement.author_id === user.id
    const isAdmin = userProfile?.is_admin === true
    
    if (!isAuthor && !isAdmin) {
      throw new AuthorizationError('Only the author or an admin can update this announcement')
    }
    
    // Update announcement
    const { data: announcement, error } = await supabase
      .from('announcements')
      .update({
        content: validatedData.content,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select(`
        id,
        content,
        created_at,
        updated_at,
        author:profiles!announcements_author_id_fkey (
          id,
          username,
          avatar_url
        )
      `)
      .single()
    
    if (error) {
      throw new Error(`Failed to update announcement: ${error.message}`)
    }
    
    return NextResponse.json(announcement)
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
    
    console.error('PATCH /api/announcements/[id] error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/announcements/[id]
 * Delete an announcement (author or admin only)
 * Requirements: 7.4
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify authentication
    const user = await requireAuth()
    
    const { id } = params
    
    const supabase = await createClient()
    
    // Check if announcement exists and get author_id
    const { data: existingAnnouncement, error: fetchError } = await supabase
      .from('announcements')
      .select('author_id')
      .eq('id', id)
      .single()
    
    if (fetchError || !existingAnnouncement) {
      return NextResponse.json(
        { error: 'Announcement not found' },
        { status: 404 }
      )
    }
    
    // Check if user is author or admin
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()
    
    const isAuthor = existingAnnouncement.author_id === user.id
    const isAdmin = userProfile?.is_admin === true
    
    if (!isAuthor && !isAdmin) {
      throw new AuthorizationError('Only the author or an admin can delete this announcement')
    }
    
    // Delete announcement
    const { error } = await supabase
      .from('announcements')
      .delete()
      .eq('id', id)
    
    if (error) {
      throw new Error(`Failed to delete announcement: ${error.message}`)
    }
    
    return NextResponse.json({ message: 'Announcement deleted successfully' })
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
    
    console.error('DELETE /api/announcements/[id] error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
