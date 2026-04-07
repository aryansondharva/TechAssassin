/**
 * Profile Completion Service
 * 
 * Tracks profile completion and awards XP for completing profile fields.
 * 
 * Requirements:
 * - 16.1: Award XP when profile field is completed for first time
 * - 16.2: Track profile completion percentage (0-100%)
 * - 16.3: Award bonus XP when profile reaches 100% completion
 * - 16.4: Prevent duplicate XP awards for same profile field
 * - 16.5: Display profile completion percentage and remaining fields
 */

import { createClient } from '@/lib/supabase/server';
import { xpService } from './xp-service';

// ============================================================================
// Types and Interfaces
// ============================================================================

export interface ProfileField {
  name: string;
  displayName: string;
  weight: number; // Importance weight for XP calculation
  xpAmount: number; // XP awarded for completing this field
}

export interface ProfileCompletionResult {
  profileCompletionPercentage: number;
  completedFields: string[];
  remainingFields: ProfileField[];
  totalFields: number;
}

export interface ProfileFieldUpdate {
  userId: string;
  fieldName: string;
  fieldValue: any;
}

// ============================================================================
// Profile Field Definitions
// ============================================================================

/**
 * Define all trackable profile fields with their importance weights and XP amounts.
 * Higher weight = more important field = more XP
 */
const PROFILE_FIELDS: ProfileField[] = [
  { name: 'full_name', displayName: 'Full Name', weight: 3, xpAmount: 30 },
  { name: 'bio', displayName: 'Bio', weight: 2, xpAmount: 20 },
  { name: 'avatar_url', displayName: 'Profile Picture', weight: 2, xpAmount: 20 },
  { name: 'banner_url', displayName: 'Profile Banner', weight: 2, xpAmount: 20 },
  { name: 'phone', displayName: 'Phone Number', weight: 1, xpAmount: 10 },
  { name: 'address', displayName: 'Address', weight: 1, xpAmount: 10 },
  { name: 'education', displayName: 'Education', weight: 2, xpAmount: 20 },
  { name: 'university', displayName: 'University', weight: 2, xpAmount: 20 },
  { name: 'graduation_year', displayName: 'Graduation Year', weight: 1, xpAmount: 10 },
  { name: 'github_url', displayName: 'GitHub URL', weight: 2, xpAmount: 20 },
  { name: 'linkedin_url', displayName: 'LinkedIn URL', weight: 2, xpAmount: 20 },
  { name: 'portfolio_url', displayName: 'Portfolio URL', weight: 2, xpAmount: 20 },
  { name: 'skills', displayName: 'Mastered Skills', weight: 2, xpAmount: 20 },
  { name: 'interests', displayName: 'Network Interests', weight: 1, xpAmount: 10 },
  { name: 'aadhaar_number', displayName: 'Aadhaar Number', weight: 1, xpAmount: 10 },
];

const PROFILE_COMPLETION_BONUS_XP = 50; // Bonus XP for 100% completion

// ============================================================================
// Profile Completion Service Class
// ============================================================================

export class ProfileCompletionService {
  /**
   * Calculate profile completion percentage
   * 
   * Requirements: 16.2
   * 
   * @param userId - User ID
   * @returns Profile completion result with percentage and field details
   */
  async calculateProfileCompletion(userId: string): Promise<ProfileCompletionResult> {
    const supabase = await createClient();
    
    // Get user profile
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error) {
      throw new Error(`Failed to get user profile: ${error.message}`);
    }
    
    if (!profile) {
      throw new Error('Profile not found');
    }
    
    // Check which fields are completed
    const completedFields: string[] = [];
    const remainingFields: ProfileField[] = [];
    
    for (const field of PROFILE_FIELDS) {
      const fieldValue = profile[field.name];
      const isCompleted = this.isFieldCompleted(fieldValue);
      
      if (isCompleted) {
        completedFields.push(field.name);
      } else {
        remainingFields.push(field);
      }
    }
    
    // Calculate completion percentage
    const profileCompletionPercentage = Math.floor(
      (completedFields.length / PROFILE_FIELDS.length) * 100
    );
    
    return {
      profileCompletionPercentage,
      completedFields,
      remainingFields,
      totalFields: PROFILE_FIELDS.length,
    };
  }
  
  /**
   * Award XP for completing a profile field
   * 
   * Requirements: 16.1, 16.3, 16.4
   * 
   * @param params - Profile field update parameters
   * @returns XP transaction if awarded, null if already completed
   */
  async awardProfileFieldXP(params: ProfileFieldUpdate): Promise<any> {
    const { userId, fieldName, fieldValue } = params;
    
    // Check if field is in our tracked fields
    const field = PROFILE_FIELDS.find(f => f.name === fieldName);
    if (!field) {
      // Field not tracked for XP
      return null;
    }
    
    // Check if field value is actually completed
    if (!this.isFieldCompleted(fieldValue)) {
      // Field is empty, no XP
      return null;
    }
    
    const supabase = await createClient();
    
    // Check if user has already received XP for this field (Requirements: 16.4)
    const { data: existingTransaction, error: checkError } = await supabase
      .from('xp_transactions')
      .select('id')
      .eq('user_id', userId)
      .eq('source', 'profile_completion')
      .eq('activity_type', `profile_field_${fieldName}`)
      .single();
    
    if (checkError && checkError.code !== 'PGRST116') {
      throw new Error(`Failed to check existing XP transaction: ${checkError.message}`);
    }
    
    if (existingTransaction) {
      // User already received XP for this field
      return null;
    }
    
    // Award XP for completing the field (Requirements: 16.1)
    const transaction = await xpService.awardXP({
      userId,
      amount: field.xpAmount,
      source: 'profile_completion',
      activityType: `profile_field_${fieldName}`,
      description: `Completed profile field: ${field.displayName}`,
      metadata: {
        fieldName: field.name,
        fieldDisplayName: field.displayName,
        fieldWeight: field.weight,
      },
    });
    
    // Update profile completion percentage
    await this.updateProfileCompletionPercentage(userId);
    
    // Check if profile is now 100% complete and award bonus (Requirements: 16.3)
    const completion = await this.calculateProfileCompletion(userId);
    if (completion.profileCompletionPercentage === 100) {
      await this.awardCompletionBonus(userId);
    }
    
    return transaction;
  }
  
  /**
   * Award bonus XP for 100% profile completion
   * 
   * Requirements: 16.3, 16.4
   * 
   * @param userId - User ID
   */
  private async awardCompletionBonus(userId: string): Promise<void> {
    const supabase = await createClient();
    
    // Check if user has already received completion bonus (Requirements: 16.4)
    const { data: existingBonus, error: checkError } = await supabase
      .from('xp_transactions')
      .select('id')
      .eq('user_id', userId)
      .eq('source', 'profile_completion')
      .eq('activity_type', 'profile_completion_bonus')
      .single();
    
    if (checkError && checkError.code !== 'PGRST116') {
      throw new Error(`Failed to check existing completion bonus: ${checkError.message}`);
    }
    
    if (existingBonus) {
      // User already received completion bonus
      return;
    }
    
    // Award completion bonus
    await xpService.awardXP({
      userId,
      amount: PROFILE_COMPLETION_BONUS_XP,
      source: 'profile_completion',
      activityType: 'profile_completion_bonus',
      description: 'Completed 100% of profile',
      metadata: {
        bonus: true,
        completionPercentage: 100,
      },
    });
  }
  
  /**
   * Update profile completion percentage in database
   * 
   * Requirements: 16.2
   * 
   * @param userId - User ID
   */
  private async updateProfileCompletionPercentage(userId: string): Promise<void> {
    const completion = await this.calculateProfileCompletion(userId);
    const supabase = await createClient();
    
    const { error } = await supabase
      .from('profiles')
      .update({ profile_completion_percentage: completion.profileCompletionPercentage })
      .eq('id', userId);
    
    if (error) {
      throw new Error(`Failed to update profile completion percentage: ${error.message}`);
    }
  }
  
  /**
   * Check if a field value is considered "completed"
   * 
   * @param value - Field value to check
   * @returns True if field is completed, false otherwise
   */
  private isFieldCompleted(value: any): boolean {
    if (value === null || value === undefined) {
      return false;
    }
    
    if (typeof value === 'string') {
      return value.trim().length > 0;
    }
    
    if (typeof value === 'number') {
      return true; // Any number is considered complete
    }

    if (Array.isArray(value)) {
      return value.length > 0; // Any non-empty array is complete
    }
    
    return false;
  }
  
  /**
   * Get profile fields configuration
   * 
   * @returns Array of profile field definitions
   */
  getProfileFields(): ProfileField[] {
    return [...PROFILE_FIELDS];
  }
}

// ============================================================================
// Export singleton instance
// ============================================================================

export const profileCompletionService = new ProfileCompletionService();
