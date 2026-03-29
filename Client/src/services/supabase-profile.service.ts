/**
 * Supabase Profile Service
 * 
 * Handles profile operations with direct Supabase integration
 * Includes avatar and banner upload functionality
 */

import { createClient } from '@/lib/supabase/client';
import { uploadAvatar, uploadBanner, validateImageFile } from '@/lib/supabase/storage';
import type { Profile } from '@/types/api';

export const supabaseProfileService = {
  /**
   * Get current user's profile
   */
  getMyProfile: async (): Promise<Profile> => {
    const supabase = createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('Not authenticated');
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  },

  /**
   * Get profile by user ID
   */
  getProfile: async (userId: string): Promise<Profile> => {
    const supabase = createClient();
    
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  },

  /**
   * Get profile by username
   */
  getProfileByUsername: async (username: string): Promise<Profile> => {
    const supabase = createClient();
    
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('username', username)
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  },

  /**
   * Update profile
   */
  update: async (profileData: Partial<Profile>): Promise<Profile> => {
    const supabase = createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('Not authenticated');
    }

    const { data, error } = await supabase
      .from('profiles')
      .update(profileData)
      .eq('id', user.id)
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  },

  /**
   * Upload avatar image
   */
  uploadAvatar: async (file: File): Promise<{ avatar_url: string }> => {
    // Validate file
    const validation = validateImageFile(file);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('Not authenticated');
    }

    // Upload to Supabase Storage
    const { url } = await uploadAvatar(file, user.id);

    // Update profile with new avatar URL
    const { error } = await supabase
      .from('profiles')
      .update({ avatar_url: url })
      .eq('id', user.id);

    if (error) {
      throw new Error(`Failed to update profile: ${error.message}`);
    }

    return { avatar_url: url };
  },

  /**
   * Upload banner image
   */
  uploadBanner: async (file: File): Promise<{ banner_url: string }> => {
    // Validate file
    const validation = validateImageFile(file);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('Not authenticated');
    }

    // Upload to Supabase Storage
    const { url } = await uploadBanner(file, user.id);

    // Update profile with new banner URL
    const { error } = await supabase
      .from('profiles')
      .update({ banner_url: url })
      .eq('id', user.id);

    if (error) {
      throw new Error(`Failed to update profile: ${error.message}`);
    }

    return { banner_url: url };
  },

  /**
   * Get all profiles (for leaderboard, community, etc.)
   */
  getAllProfiles: async (limit: number = 100): Promise<Profile[]> => {
    const supabase = createClient();
    
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(error.message);
    }

    return data || [];
  },

  /**
   * Search profiles by username or name
   */
  searchProfiles: async (query: string): Promise<Profile[]> => {
    const supabase = createClient();
    
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .or(`username.ilike.%${query}%,full_name.ilike.%${query}%`)
      .limit(20);

    if (error) {
      throw new Error(error.message);
    }

    return data || [];
  },
};
