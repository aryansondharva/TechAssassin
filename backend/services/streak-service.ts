/**
 * Streak Service
 * 
 * Service for tracking consecutive days of user activity and applying streak multipliers.
 * 
 * Requirements:
 * - 18.1: Track consecutive days of user activity
 * - 18.2: Increment current_streak on consecutive days
 * - 18.3: Reset current_streak to zero after 24 hours of inactivity
 * - 18.4: Store longest_streak value
 * - 18.5: Apply streak multiplier to earned XP for streaks of 7+ days
 */

import { createClient } from '@/lib/supabase/server';

// ============================================================================
// Types and Interfaces
// ============================================================================

export interface StreakInfo {
  userId: string;
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: Date | null;
  streakMultiplier: number;
}

export interface StreakUpdateResult {
  currentStreak: number;
  longestStreak: number;
  streakIncreased: boolean;
  newRecord: boolean;
  multiplier: number;
}

// ============================================================================
// Streak Service Class
// ============================================================================

export class StreakService {
  /**
   * Track user activity and update streak
   * 
   * Requirements: 18.1, 18.2, 18.3, 18.4
   * 
   * @param userId - User ID
   * @returns Streak update result
   */
  async trackActivity(userId: string): Promise<StreakUpdateResult> {
    const supabase = await createClient();
    
    // Get current user profile with streak data
    const { data: profile, error: fetchError } = await supabase
      .from('profiles')
      .select('current_streak, longest_streak, last_activity_date')
      .eq('id', userId)
      .single();
    
    if (fetchError) {
      throw new Error(`Failed to fetch user profile: ${fetchError.message}`);
    }
    
    const now = new Date();
    const today = this.getDateOnly(now);
    const lastActivityDate = profile.last_activity_date 
      ? this.getDateOnly(new Date(profile.last_activity_date))
      : null;
    
    let currentStreak = profile.current_streak || 0;
    let longestStreak = profile.longest_streak || 0;
    let streakIncreased = false;
    let newRecord = false;
    
    // Check if this is the first activity today
    if (!lastActivityDate || lastActivityDate.getTime() !== today.getTime()) {
      // Calculate days since last activity
      if (lastActivityDate) {
        const daysSinceLastActivity = Math.floor(
          (today.getTime() - lastActivityDate.getTime()) / (1000 * 60 * 60 * 24)
        );
        
        if (daysSinceLastActivity === 1) {
          // Consecutive day - increment streak
          currentStreak += 1;
          streakIncreased = true;
        } else if (daysSinceLastActivity > 1) {
          // Missed a day - reset streak
          currentStreak = 1;
        }
      } else {
        // First activity ever
        currentStreak = 1;
        streakIncreased = true;
      }
      
      // Update longest streak if current exceeds it
      if (currentStreak > longestStreak) {
        longestStreak = currentStreak;
        newRecord = true;
      }
      
      // Update profile with new streak data
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          current_streak: currentStreak,
          longest_streak: longestStreak,
          last_activity_date: today.toISOString().split('T')[0] // Store as date only
        })
        .eq('id', userId);
      
      if (updateError) {
        throw new Error(`Failed to update streak: ${updateError.message}`);
      }
    }
    
    // Calculate streak multiplier
    const multiplier = this.calculateStreakMultiplier(currentStreak);
    
    return {
      currentStreak,
      longestStreak,
      streakIncreased,
      newRecord,
      multiplier
    };
  }
  
  /**
   * Get user's current streak information
   * 
   * Requirements: 18.1, 18.4, 18.6
   * 
   * @param userId - User ID
   * @returns Streak information
   */
  async getStreakInfo(userId: string): Promise<StreakInfo> {
    const supabase = await createClient();
    
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('current_streak, longest_streak, last_activity_date')
      .eq('id', userId)
      .single();
    
    if (error) {
      throw new Error(`Failed to fetch streak info: ${error.message}`);
    }
    
    const currentStreak = profile.current_streak || 0;
    const longestStreak = profile.longest_streak || 0;
    const lastActivityDate = profile.last_activity_date 
      ? new Date(profile.last_activity_date)
      : null;
    
    // Check if streak should be reset due to inactivity
    const now = new Date();
    const today = this.getDateOnly(now);
    
    let activeStreak = currentStreak;
    if (lastActivityDate) {
      const lastDate = this.getDateOnly(lastActivityDate);
      const daysSinceLastActivity = Math.floor(
        (today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      
      // Reset streak if inactive for more than 1 day
      if (daysSinceLastActivity > 1) {
        activeStreak = 0;
      }
    }
    
    const multiplier = this.calculateStreakMultiplier(activeStreak);
    
    return {
      userId,
      currentStreak: activeStreak,
      longestStreak,
      lastActivityDate,
      streakMultiplier: multiplier
    };
  }
  
  /**
   * Calculate streak multiplier based on streak length
   * 
   * Requirements: 18.5
   * 
   * Multiplier tiers:
   * - 7-13 days: 1.1x
   * - 14-29 days: 1.2x
   * - 30-59 days: 1.3x
   * - 60-89 days: 1.4x
   * - 90+ days: 1.5x
   * 
   * @param streakDays - Current streak in days
   * @returns Multiplier value
   */
  calculateStreakMultiplier(streakDays: number): number {
    if (streakDays >= 90) return 1.5;
    if (streakDays >= 60) return 1.4;
    if (streakDays >= 30) return 1.3;
    if (streakDays >= 14) return 1.2;
    if (streakDays >= 7) return 1.1;
    return 1.0;
  }
  
  /**
   * Reset user's streak (admin function)
   * 
   * @param userId - User ID
   */
  async resetStreak(userId: string): Promise<void> {
    const supabase = await createClient();
    
    const { error } = await supabase
      .from('profiles')
      .update({
        current_streak: 0,
        last_activity_date: null
      })
      .eq('id', userId);
    
    if (error) {
      throw new Error(`Failed to reset streak: ${error.message}`);
    }
  }
  
  // ============================================================================
  // Private Helper Methods
  // ============================================================================
  
  /**
   * Get date without time component
   * 
   * @param date - Date to process
   * @returns Date with time set to midnight UTC
   */
  private getDateOnly(date: Date): Date {
    const dateOnly = new Date(date);
    dateOnly.setUTCHours(0, 0, 0, 0);
    return dateOnly;
  }
}

// ============================================================================
// Export singleton instance
// ============================================================================

export const streakService = new StreakService();
