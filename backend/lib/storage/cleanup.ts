import { createClient } from '@/lib/supabase/server'

/**
 * Storage cleanup utilities for deleting files from Supabase Storage
 * when associated database records are deleted.
 * Requirements: 15.7
 */

/**
 * Delete avatar from storage for a given user
 * @param userId - The user's ID
 * @returns Promise<void>
 */
export async function deleteAvatar(userId: string): Promise<void> {
  try {
    const supabase = await createClient()
    
    // List all files in the user's avatar folder
    const { data: files, error: listError } = await supabase.storage
      .from('avatars')
      .list(userId)
    
    if (listError) {
      console.error(`Error listing avatar files for user ${userId}:`, listError)
      return
    }
    
    if (!files || files.length === 0) {
      // No files to delete
      return
    }
    
    // Delete all files in the user's folder
    const filePaths = files.map(file => `${userId}/${file.name}`)
    const { error: deleteError } = await supabase.storage
      .from('avatars')
      .remove(filePaths)
    
    if (deleteError) {
      console.error(`Error deleting avatar files for user ${userId}:`, deleteError)
    }
  } catch (error) {
    console.error(`Unexpected error deleting avatar for user ${userId}:`, error)
  }
}

/**
 * Delete event images from storage for a given event
 * @param eventId - The event's ID
 * @returns Promise<void>
 */
export async function deleteEventImages(eventId: string): Promise<void> {
  try {
    const supabase = await createClient()
    
    // List all files in the event's images folder
    const { data: files, error: listError } = await supabase.storage
      .from('event-images')
      .list(eventId)
    
    if (listError) {
      console.error(`Error listing event images for event ${eventId}:`, listError)
      return
    }
    
    if (!files || files.length === 0) {
      // No files to delete
      return
    }
    
    // Delete all files in the event's folder
    const filePaths = files.map(file => `${eventId}/${file.name}`)
    const { error: deleteError } = await supabase.storage
      .from('event-images')
      .remove(filePaths)
    
    if (deleteError) {
      console.error(`Error deleting event images for event ${eventId}:`, deleteError)
    }
  } catch (error) {
    console.error(`Unexpected error deleting event images for event ${eventId}:`, error)
  }
}

/**
 * Delete sponsor logo from storage for a given sponsor
 * @param sponsorId - The sponsor's ID
 * @returns Promise<void>
 */
export async function deleteSponsorLogo(sponsorId: string): Promise<void> {
  try {
    const supabase = await createClient()
    
    // List all files matching the sponsor ID pattern
    // Sponsor logos are stored as {sponsorId}-{timestamp}.{ext}
    const { data: files, error: listError } = await supabase.storage
      .from('sponsor-logos')
      .list()
    
    if (listError) {
      console.error(`Error listing sponsor logos:`, listError)
      return
    }
    
    if (!files || files.length === 0) {
      // No files to delete
      return
    }
    
    // Filter files that start with the sponsor ID
    const sponsorFiles = files.filter(file => file.name.startsWith(`${sponsorId}-`))
    
    if (sponsorFiles.length === 0) {
      // No files to delete for this sponsor
      return
    }
    
    // Delete all matching files
    const filePaths = sponsorFiles.map(file => file.name)
    const { error: deleteError } = await supabase.storage
      .from('sponsor-logos')
      .remove(filePaths)
    
    if (deleteError) {
      console.error(`Error deleting sponsor logo for sponsor ${sponsorId}:`, deleteError)
    }
  } catch (error) {
    console.error(`Unexpected error deleting sponsor logo for sponsor ${sponsorId}:`, error)
  }
}
