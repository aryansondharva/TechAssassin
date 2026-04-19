import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireAuth, requireAdmin, AuthenticationError, AuthorizationError } from '@/lib/middleware/auth'

/**
 * POST /api/sponsors/[id]/logo
 * Upload sponsor logo to Supabase Storage (admin only)
 * Validates file type (jpg, png, webp) and size (< 2MB)
 * Stores file in sponsor-logos/ folder
 * Updates sponsor with logo URL
 * Requirements: 9.2, 15.3, 15.4, 15.5
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify authentication
    const user = await requireAuth()
    
    // Verify admin privileges
    await requireAdmin(user.id)
    
    const { id } = params
    
    // Parse form data
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }
    
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'File must be an image (jpg, png, or webp)' },
        { status: 400 }
      )
    }
    
    // Validate file size (< 2MB)
    const maxSize = 2 * 1024 * 1024 // 2MB in bytes
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File size must be under 2MB' },
        { status: 400 }
      )
    }
    
    // Get Supabase client
    const supabase = await createClient()
    
    // Verify sponsor exists
    const { data: sponsor, error: fetchError } = await supabase
      .from('sponsors')
      .select('id')
      .eq('id', id)
      .single()
    
    if (fetchError || !sponsor) {
      return NextResponse.json(
        { error: 'Sponsor not found' },
        { status: 404 }
      )
    }
    
    // Generate unique filename
    const fileExt = file.name.split('.').pop()
    const fileName = `${id}-${Date.now()}.${fileExt}`
    
    // Convert File to ArrayBuffer then to Buffer for upload
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    
    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('sponsor-logos')
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: true
      })
    
    if (uploadError) {
      console.error('Error uploading sponsor logo:', uploadError)
      return NextResponse.json(
        { error: 'Failed to upload logo' },
        { status: 500 }
      )
    }
    
    // Get public URL for the uploaded file
    const { data: { publicUrl } } = supabase.storage
      .from('sponsor-logos')
      .getPublicUrl(fileName)
    
    // Update sponsor with logo URL
    const { data: updatedSponsor, error: updateError } = await supabase
      .from('sponsors')
      .update({ logo_url: publicUrl })
      .eq('id', id)
      .select()
      .single()
    
    if (updateError) {
      console.error('Error updating sponsor with logo URL:', updateError)
      return NextResponse.json(
        { error: 'Failed to update sponsor with logo URL' },
        { status: 500 }
      )
    }
    
    return NextResponse.json({
      message: 'Logo uploaded successfully',
      logo_url: publicUrl,
      sponsor: updatedSponsor
    })
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
    
    console.error('POST /api/sponsors/[id]/logo error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
