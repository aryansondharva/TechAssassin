import { NextResponse } from 'next/server'
import { createClient } from '../../../../lib/supabase/server'
import { requireAuth } from '../../../../lib/middleware/auth'
import { handleApiError, ValidationError } from '../../../../lib/errors'
import { profileCompletionService } from '../../../../services/profile-completion-service'
import type { Profile } from '../../../../types/database'

/**
 * POST /api/profile/banner
 * Upload banner to Supabase Storage
 * Validates file type (jpg, png, webp) and size (< 5MB)
 * Stores file in banners/{user_id}/ folder
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
    
    // Validate file size (< 5MB for banners)
    const maxSize = 5 * 1024 * 1024 // 5MB in bytes
    if (file.size > maxSize) {
      throw new ValidationError('File size must be under 5MB')
    }
    
    // Get Supabase client
    const supabase = await createClient()
    
    // Generate unique filename
    const fileExt = file.name.split('.').pop()
    const fileName = `${user.id}/${Date.now()}.${fileExt}`
    
    // Convert File to ArrayBuffer then to Buffer for upload
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    
    // Upload to Supabase Storage - using 'avatars' bucket with banners/ prefix 
    // to ensure it works with existing bucket configuration
    const bucketName = 'avatars' 
    const filePath = `banners/${fileName}`
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: true
      })
    
    if (uploadError) {
      throw new Error(`Failed to upload banner: ${uploadError.message}`)
    }
    
    // Get public URL for the uploaded file
    const { data: { publicUrl } } = supabase.storage
      .from(bucketName)
      .getPublicUrl(filePath)
    
    // Update profile with banner URL
    const { data: profiles, error: updateError } = await supabase
      .from('profiles')
      .update({ banner_url: publicUrl })
      .eq('id', user.id)
      .select()
    
    if (updateError) {
      throw new Error(`Failed to update profile with banner URL: ${updateError.message}`)
    }

    const updatedProfile = profiles && profiles.length > 0 ? profiles[0] : null;
    
    // Award XP for completing banner_url field
    try {
      await profileCompletionService.awardProfileFieldXP({
        userId: user.id,
        fieldName: 'banner_url',
        fieldValue: publicUrl,
      });
    } catch (xpError) {
      console.error('Failed to award profile completion XP for banner:', xpError);
    }

    return NextResponse.json({
      message: 'Banner uploaded successfully',
      banner_url: publicUrl,
      profile: updatedProfile as Profile
    })
  } catch (error) {
    return handleApiError(error)
  }
}
