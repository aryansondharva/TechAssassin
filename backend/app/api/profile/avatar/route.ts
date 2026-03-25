import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/middleware/auth'
import { handleApiError, ValidationError } from '@/lib/errors'
import type { Profile } from '@/types/database'

/**
 * POST /api/profile/avatar
 * Upload avatar to Supabase Storage
 * Validates file type (jpg, png, webp) and size (< 2MB)
 * Stores file in avatars/{user_id}/ folder
 * Updates profile with avatar URL
 * Requirements: 3.3, 15.1, 15.2, 15.4, 15.5
 */
export async function POST(request: Request) {
  try {
    // Verify authentication
    const user = await requireAuth()
    
    // Parse form data
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      throw new ValidationError('No file provided')
    }
    
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      throw new ValidationError('File must be an image (jpg, png, or webp)')
    }
    
    // Validate file size (< 2MB)
    const maxSize = 2 * 1024 * 1024 // 2MB in bytes
    if (file.size > maxSize) {
      throw new ValidationError('File size must be under 2MB')
    }
    
    // Get Supabase client
    const supabase = await createClient()
    
    // Ensure 'avatars' bucket exists and is public
    const { data: buckets } = await supabase.storage.listBuckets()
    const avatarsBucket = buckets?.find(b => b.name === 'avatars')
    
    if (!avatarsBucket) {
      const { error: bucketError } = await supabase.storage.createBucket('avatars', {
        public: true,
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
        fileSizeLimit: maxSize
      })
      if (bucketError) {
        throw new Error(`Failed to create storage bucket: ${bucketError.message}`)
      }
    }
    
    // Generate unique filename
    const fileExt = file.name.split('.').pop()
    const fileName = `${user.id}/${Date.now()}.${fileExt}`
    
    // Convert File to ArrayBuffer then to Buffer for upload
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    
    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: true
      })
    
    if (uploadError) {
      throw new Error(`Failed to upload avatar: ${uploadError.message}`)
    }
    
    // Get public URL for the uploaded file
    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(fileName)
    
    // Update profile in local PostgreSQL database
    const { updateProfile } = await import('@/lib/auth/server')
    const updatedProfile = await updateProfile(user.id, { avatar_url: publicUrl })
    
    if (!updatedProfile) {
      throw new Error('Failed to update profile in database')
    }

    return NextResponse.json({
      message: 'Avatar uploaded successfully',
      avatar_url: publicUrl,
      profile: updatedProfile
    })
  } catch (error) {
    return handleApiError(error)
  }
}
