/**
 * Profile Service
 * 
 * Handles user profile operations.
 */

import { api } from '@/lib/api-client';
import type {
  Profile,
  ProfileUpdateRequest,
  AvatarUploadResponse,
} from '@/types/api';

export const profileService = {
  /**
   * Get current user's profile
   */
  getMyProfile: async (): Promise<Profile> => {
    return api.get<Profile>('/profile');
  },

  /**
   * Get a user's profile by ID
   */
  getById: async (id: string): Promise<Profile> => {
    return api.get<Profile>(`/profile/${id}`);
  },

  /**
   * Update current user's profile
   */
  update: async (data: ProfileUpdateRequest): Promise<Profile> => {
    return api.patch<Profile>('/profile', data);
  },

  /**
   * Upload avatar image
   */
  uploadAvatar: async (file: File): Promise<AvatarUploadResponse> => {
    return api.upload<AvatarUploadResponse>('/profile/avatar', file, 'file');
  },
};
