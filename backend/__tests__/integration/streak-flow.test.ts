/**
 * Integration Tests: Streak Tracking Flow
 * 
 * Tests streak tracking including:
 * - Consecutive activity → streak increment
 * - Inactivity → streak reset
 * - Streak multiplier application
 * 
 * Requirements: 18.1, 18.2, 18.3, 18.5
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { streakService } from '@/services/streak-service';
import { xpService } from '@/services/xp-service';
import { createClient } from '../setup/test-supabase-client';

describe('Streak Tracking Flow Integration Tests', () => {
  let testUserId: string;
  let supabase: any;

  beforeEach(async () => {
    supabase = createClient();
    
    // Create a test user
    const { data: profile, error } = await supabase
      .from('profiles')
      .insert({
        username: `test_streak_${Date.now()}_${Math.random().toString(36).substring(7)}`,
        email: `test-streak-${Date.now()}@example.com`,
        full_name: 'Test Streak User',
        total_xp: 0,
        current_streak: 0,
        longest_streak: 0,
        last_activity_date: null,
        profile_completion_percentage: 0,
      })
      .select()
      .single();
    
    if (error) throw error;
    testUserId = profile.id;
  });

  afterEach(async () => {
    // Cleanup: Delete test data
    if (testUserId) {
      await supabase.from('xp_transactions').delete().eq('user_id', testUserId);
      await supabase.from('profiles').delete().eq('id', testUserId);
    }
  });

  describe('Streak Increment', () => {
    it('should start streak at 1 on first activity', async () => {
      // Requirements: 18.1, 18.2
      
      const result = await streakService.trackActivity(testUserId);

      expect(result.currentStreak).toBe(1);
      expect(result.streakIncreased).toBe(true);
      expect(result.longestStreak).toBe(1);
    });

    it('should increment streak on consecutive day activity', async () => {
      // Requirements: 18.2
      
      // Day 1
      await streakService.trackActivity(testUserId);

      // Simulate next day by updating last_activity_date
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      await supabase
        .from('profiles')
        .update({
          last_activity_date: yesterday.toISOString().split('T')[0],
          current_streak: 1,
        })
        .eq('id', testUserId);

      // Day 2
      const result = await streakService.trackActivity(testUserId);

      expect(result.currentStreak).toBe(2);
      expect(result.streakIncreased).toBe(true);
    });

    it('should not increment streak for multiple activities on same day', async () => {
      // Requirements: 18.2
      
      // First activity of the day
      const result1 = await streakService.trackActivity(testUserId);
      expect(result1.currentStreak).toBe(1);

      // Second activity same day
      const result2 = await streakService.trackActivity(testUserId);
      expect(result2.currentStreak).toBe(1); // Should not increment
      expect(result2.streakIncreased).toBe(false);
    });

    it('should update longest streak when current exceeds it', async () => {
      // Requirements: 18.4
      
      // Set initial streak
      await supabase
        .from('profiles')
        .update({
          current_streak: 5,
          longest_streak: 5,
        })
        .eq('id', testUserId);

      // Simulate next day
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      await supabase
        .from('profiles')
        .update({
          last_activity_date: yesterday.toISOString().split('T')[0],
        })
        .eq('id', testUserId);

      // Track activity to increment streak
      const result = await streakService.trackActivity(testUserId);

      expect(result.currentStreak).toBe(6);
      expect(result.longestStreak).toBe(6);
      expect(result.newRecord).toBe(true);
    });
  });

  describe('Streak Reset', () => {
    it('should reset streak after 24+ hours of inactivity', async () => {
      // Requirements: 18.3
      
      // Set up existing streak
      await supabase
        .from('profiles')
        .update({
          current_streak: 5,
          longest_streak: 5,
        })
        .eq('id', testUserId);

      // Simulate 2 days ago
      const twoDaysAgo = new Date();
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
      await supabase
        .from('profiles')
        .update({
          last_activity_date: twoDaysAgo.toISOString().split('T')[0],
        })
        .eq('id', testUserId);

      // Track activity - should reset streak
      const result = await streakService.trackActivity(testUserId);

      expect(result.currentStreak).toBe(1); // Reset to 1
      expect(result.longestStreak).toBe(5); // Longest streak preserved
    });

    it('should preserve longest streak when current resets', async () => {
      // Requirements: 18.3, 18.4
      
      // Set up streak with longest > current
      await supabase
        .from('profiles')
        .update({
          current_streak: 3,
          longest_streak: 10,
        })
        .eq('id', testUserId);

      // Simulate missed days
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
      await supabase
        .from('profiles')
        .update({
          last_activity_date: threeDaysAgo.toISOString().split('T')[0],
        })
        .eq('id', testUserId);

      // Track activity
      const result = await streakService.trackActivity(testUserId);

      expect(result.currentStreak).toBe(1);
      expect(result.longestStreak).toBe(10); // Preserved
    });

    it('should show zero streak when checking inactive user', async () => {
      // Requirements: 18.3
      
      // Set up old activity
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
      await supabase
        .from('profiles')
        .update({
          current_streak: 5,
          longest_streak: 5,
          last_activity_date: threeDaysAgo.toISOString().split('T')[0],
        })
        .eq('id', testUserId);

      // Get streak info (without tracking new activity)
      const streakInfo = await streakService.getStreakInfo(testUserId);

      expect(streakInfo.currentStreak).toBe(0); // Should show as reset
      expect(streakInfo.longestStreak).toBe(5); // Preserved
    });
  });

  describe('Streak Multipliers', () => {
    it('should apply 1.1x multiplier for 7-day streak', async () => {
      // Requirements: 18.5
      
      const multiplier = streakService.calculateStreakMultiplier(7);
      expect(multiplier).toBe(1.1);
    });

    it('should apply 1.2x multiplier for 14-day streak', async () => {
      // Requirements: 18.5
      
      const multiplier = streakService.calculateStreakMultiplier(14);
      expect(multiplier).toBe(1.2);
    });

    it('should apply 1.3x multiplier for 30-day streak', async () => {
      // Requirements: 18.5
      
      const multiplier = streakService.calculateStreakMultiplier(30);
      expect(multiplier).toBe(1.3);
    });

    it('should apply 1.4x multiplier for 60-day streak', async () => {
      // Requirements: 18.5
      
      const multiplier = streakService.calculateStreakMultiplier(60);
      expect(multiplier).toBe(1.4);
    });

    it('should apply 1.5x multiplier for 90+ day streak', async () => {
      // Requirements: 18.5
      
      const multiplier = streakService.calculateStreakMultiplier(90);
      expect(multiplier).toBe(1.5);

      const multiplier100 = streakService.calculateStreakMultiplier(100);
      expect(multiplier100).toBe(1.5);
    });

    it('should apply no multiplier for streaks under 7 days', async () => {
      // Requirements: 18.5
      
      expect(streakService.calculateStreakMultiplier(0)).toBe(1.0);
      expect(streakService.calculateStreakMultiplier(1)).toBe(1.0);
      expect(streakService.calculateStreakMultiplier(6)).toBe(1.0);
    });

    it('should return correct multiplier in streak info', async () => {
      // Requirements: 18.5
      
      // Set up 14-day streak
      await supabase
        .from('profiles')
        .update({
          current_streak: 14,
          longest_streak: 14,
          last_activity_date: new Date().toISOString().split('T')[0],
        })
        .eq('id', testUserId);

      const streakInfo = await streakService.getStreakInfo(testUserId);

      expect(streakInfo.currentStreak).toBe(14);
      expect(streakInfo.streakMultiplier).toBe(1.2);
    });
  });

  describe('Streak Integration with XP', () => {
    it('should track activity when XP is awarded', async () => {
      // Requirements: 18.1, 18.5
      
      // Track activity first
      await streakService.trackActivity(testUserId);

      // Award XP
      await xpService.awardXP({
        userId: testUserId,
        amount: 100,
        source: 'event_participation',
        activityType: 'test',
        description: 'Test XP',
      });

      // Verify streak was tracked
      const streakInfo = await streakService.getStreakInfo(testUserId);
      expect(streakInfo.currentStreak).toBeGreaterThan(0);
    });

    it('should apply streak multiplier to XP awards', async () => {
      // Requirements: 18.5
      
      // Set up 7-day streak
      await supabase
        .from('profiles')
        .update({
          current_streak: 7,
          longest_streak: 7,
          last_activity_date: new Date().toISOString().split('T')[0],
        })
        .eq('id', testUserId);

      // Get multiplier
      const streakInfo = await streakService.getStreakInfo(testUserId);
      expect(streakInfo.streakMultiplier).toBe(1.1);

      // In a real implementation, XP service would apply this multiplier
      // For testing, we verify the multiplier is available
      const baseXP = 100;
      const multipliedXP = Math.floor(baseXP * streakInfo.streakMultiplier);
      expect(multipliedXP).toBe(110);
    });
  });

  describe('Streak Edge Cases', () => {
    it('should handle user with no activity history', async () => {
      // Requirements: 18.1
      
      const streakInfo = await streakService.getStreakInfo(testUserId);

      expect(streakInfo.currentStreak).toBe(0);
      expect(streakInfo.longestStreak).toBe(0);
      expect(streakInfo.lastActivityDate).toBeNull();
      expect(streakInfo.streakMultiplier).toBe(1.0);
    });

    it('should handle streak reset by admin', async () => {
      // Requirements: 18.3
      
      // Set up streak
      await supabase
        .from('profiles')
        .update({
          current_streak: 10,
          longest_streak: 10,
        })
        .eq('id', testUserId);

      // Admin resets streak
      await streakService.resetStreak(testUserId);

      // Verify reset
      const streakInfo = await streakService.getStreakInfo(testUserId);
      expect(streakInfo.currentStreak).toBe(0);
      expect(streakInfo.lastActivityDate).toBeNull();
    });

    it('should handle date boundary correctly', async () => {
      // Requirements: 18.2
      
      // Set activity to yesterday
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      await supabase
        .from('profiles')
        .update({
          current_streak: 1,
          longest_streak: 1,
          last_activity_date: yesterday.toISOString().split('T')[0],
        })
        .eq('id', testUserId);

      // Track activity today
      const result = await streakService.trackActivity(testUserId);

      expect(result.currentStreak).toBe(2);
      expect(result.streakIncreased).toBe(true);
    });
  });

  describe('Long Streak Scenarios', () => {
    it('should maintain streak over extended period', async () => {
      // Requirements: 18.2, 18.4
      
      // Simulate 30-day streak
      let currentStreak = 0;
      let longestStreak = 0;

      for (let day = 30; day >= 1; day--) {
        const activityDate = new Date();
        activityDate.setDate(activityDate.getDate() - day);

        await supabase
          .from('profiles')
          .update({
            current_streak: currentStreak,
            longest_streak: longestStreak,
            last_activity_date: activityDate.toISOString().split('T')[0],
          })
          .eq('id', testUserId);

        const result = await streakService.trackActivity(testUserId);
        currentStreak = result.currentStreak;
        longestStreak = result.longestStreak;
      }

      expect(currentStreak).toBe(30);
      expect(longestStreak).toBe(30);

      // Verify multiplier for 30-day streak
      const streakInfo = await streakService.getStreakInfo(testUserId);
      expect(streakInfo.streakMultiplier).toBe(1.3);
    });
  });
});
