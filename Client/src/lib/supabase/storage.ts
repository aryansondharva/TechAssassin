/**
 * Supabase Storage Service
 * 
 * Handles file uploads to Supabase Storage for avatars and banners
 */

import { createClient } from './client';

const AVATAR_BUCKET = 'avatars';
const BANNER_BUCKET = 'banners';

export interface UploadResult {
  url: string;
  path: string;
}

/**
 * Upload avatar image to Supabase Storage
 */
export async function uploadAvatar(file: File, userId: string): Promise<UploadResult> {
  const supabase = createClient();
  
  // Generate unique filename
  const fileExt = file.name.split('.').pop();
  const fileName = `${userId}-${Date.now()}.${fileExt}`;
  const filePath = `${userId}/${fileName}`;

  // Upload file
  const { data, error } = await supabase.storage
    .from(AVATAR_BUCKET)
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: true
    });

  if (error) {
    throw new Error(`Failed to upload avatar: ${error.message}`);
  }

  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from(AVATAR_BUCKET)
    .getPublicUrl(filePath);

  return {
    url: publicUrl,
    path: filePath
  };
}

/**
 * Upload banner image to Supabase Storage
 */
export async function uploadBanner(file: File, userId: string): Promise<UploadResult> {
  const supabase = createClient();
  
  // Generate unique filename
  const fileExt = file.name.split('.').pop();
  const fileName = `${userId}-${Date.now()}.${fileExt}`;
  const filePath = `${userId}/${fileName}`;

  // Upload file
  const { data, error } = await supabase.storage
    .from(BANNER_BUCKET)
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: true
    });

  if (error) {
    throw new Error(`Failed to upload banner: ${error.message}`);
  }

  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from(BANNER_BUCKET)
    .getPublicUrl(filePath);

  return {
    url: publicUrl,
    path: filePath
  };
}

/**
 * Delete avatar from Supabase Storage
 */
export async function deleteAvatar(filePath: string): Promise<void> {
  const supabase = createClient();
  
  const { error } = await supabase.storage
    .from(AVATAR_BUCKET)
    .remove([filePath]);

  if (error) {
    throw new Error(`Failed to delete avatar: ${error.message}`);
  }
}

/**
 * Delete banner from Supabase Storage
 */
export async function deleteBanner(filePath: string): Promise<void> {
  const supabase = createClient();
  
  const { error } = await supabase.storage
    .from(BANNER_BUCKET)
    .remove([filePath]);

  if (error) {
    throw new Error(`Failed to delete banner: ${error.message}`);
  }
}

/**
 * Validate image file
 */
export function validateImageFile(file: File): { valid: boolean; error?: string } {
  // Check file type
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
  if (!validTypes.includes(file.type)) {
    return {
      valid: false,
      error: 'Invalid file type. Please upload a JPEG, PNG, WebP, or GIF image.'
    };
  }

  // Check file size (max 5MB)
  const maxSize = 5 * 1024 * 1024; // 5MB in bytes
  if (file.size > maxSize) {
    return {
      valid: false,
      error: 'File size too large. Maximum size is 5MB.'
    };
  }

  return { valid: true };
}
