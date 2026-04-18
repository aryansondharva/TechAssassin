/**
 * Streak Service Tests
 * 
 * Unit tests for streak tracking functionality
 */

import { StreakService } from '../streak-service';

describe('StreakService', () => {
  let streakService: StreakService;
  
  beforeEach(() => {
    streakService = new StreakService();
  });
  
  describe('calculateStreakMultiplier', () => {
    it('should return 1.0 for streaks less than 7 days', () => {
      expect(streakService.calculateStreakMultiplier(0)).toBe(1.0);
      expect(streakService.calculateStreakMultiplier(1)).toBe(1.0);
      expect(streakService.calculateStreakMultiplier(6)).toBe(1.0);
    });
    
    it('should return 1.1 for streaks 7-13 days', () => {
      expect(streakService.calculateStreakMultiplier(7)).toBe(1.1);
      expect(streakService.calculateStreakMultiplier(10)).toBe(1.1);
      expect(streakService.calculateStreakMultiplier(13)).toBe(1.1);
    });
    
    it('should return 1.2 for streaks 14-29 days', () => {
      expect(streakService.calculateStreakMultiplier(14)).toBe(1.2);
      expect(streakService.calculateStreakMultiplier(20)).toBe(1.2);
      expect(streakService.calculateStreakMultiplier(29)).toBe(1.2);
    });
    
    it('should return 1.3 for streaks 30-59 days', () => {
      expect(streakService.calculateStreakMultiplier(30)).toBe(1.3);
      expect(streakService.calculateStreakMultiplier(45)).toBe(1.3);
      expect(streakService.calculateStreakMultiplier(59)).toBe(1.3);
    });
    
    it('should return 1.4 for streaks 60-89 days', () => {
      expect(streakService.calculateStreakMultiplier(60)).toBe(1.4);
      expect(streakService.calculateStreakMultiplier(75)).toBe(1.4);
      expect(streakService.calculateStreakMultiplier(89)).toBe(1.4);
    });
    
    it('should return 1.5 for streaks 90+ days', () => {
      expect(streakService.calculateStreakMultiplier(90)).toBe(1.5);
      expect(streakService.calculateStreakMultiplier(100)).toBe(1.5);
      expect(streakService.calculateStreakMultiplier(365)).toBe(1.5);
    });
  });
});
