import { NextRequest, NextResponse } from 'next/server'
import { getEventById } from '@/lib/services/events'
import { createClient } from '@/lib/supabase/server'
import { requireAuth, requireAdmin } from '@/lib/middleware/auth'

/**
 * POST /api/events/[id]/images
 * Upload event images (admin only)
 * Requirements: 4.2, 15.3, 15.4, 15.5
 */
export async function POST(
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
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      )
    }
    
    // Parse form data
    const formData = await request.formData()
    const files = formData.getAll('images') as File[]
    
    if (files.length === 0) {
      return NextResponse.json(
        { error: 'No images provided' },
        { status: 400 }
      )
    }
    
    // Validate file types and sizes
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
    const maxSize = 2 * 1024 * 1024 // 2MB
    
    for (const file of files) {
      if (!allowedTypes.includes(file.type)) {
        return NextResponse.json(
          { error: `Invalid file type: ${file.type}. Allowed types: jpg, png, webp` },
          { status: 400 }
        )
      }
      
      if (file.size > maxSize) {
        return NextResponse.json(
          { error: `File ${file.name} exceeds 2MB size limit` },
          { status: 400 }
        )
      }
    }
    
    // Upload files to Supabase Storage
    const supabase = await createClient()
    const uploadedUrls: string[] = []
    
    for (const file of files) {
      const fileExt = file.name.split('.').pop()
      const fileName = `${id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
      
      // Convert File to ArrayBuffer
      const arrayBuffer = await file.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)
      
      const { data, error } = await supabase.storage
        .from('event-images')
        .upload(fileName, buffer, {
          contentType: file.type,
          upsert: false
        })
      
      if (error) {
        throw new Error(`Failed to upload image: ${error.message}`)
      }
      
      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('event-images')
        .getPublicUrl(data.path)
      
      uploadedUrls.push(publicUrl)
    }
    
    // Update event with new image URLs
    const updatedImageUrls = [...existingEvent.image_urls, ...uploadedUrls]
    
    const { data: updatedEvent, error: updateError } = await supabase
      .from('events')
      .update({ image_urls: updatedImageUrls })
      .eq('id', id)
      .select()
      .single()
    
    if (updateError) {
      throw new Error(`Failed to update event with image URLs: ${updateError.message}`)
    }
    
    return NextResponse.json({
      message: 'Images uploaded successfully',
      image_urls: uploadedUrls,
      event: updatedEvent
    })
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
    
    console.error('POST /api/events/[id]/images error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
