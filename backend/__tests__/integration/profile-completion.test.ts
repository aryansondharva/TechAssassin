/**
 * Integration Tests: Profile Completion XP
 * 
 * Tests profile completion XP awards including:
 * - Profile field completion → XP award
 * - Duplicate prevention
 * - 100% completion bonus
 * 
 * Requirements: 16.1, 16.2, 16.3, 16.4
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { profileCompletionService } from '@/services/profile-completion-service';
import { xpService } from '@/services/xp-service';
import { createClient } from '../setup/test-supabase-client';

describe('Profile Completion XP Integration Tests', () => {
  let testUserId: string;
  let supabase: any;

  beforeEach(async () => {
    supabase = createClient();
    
    // Create a test user with minimal profile
    const { data: profile, error } = await supabase
      .from('profiles')
      .insert({
        username: `test_profile_${Date.now()}_${Math.random().toString(36).substring(7)}`,
        email: `test-profile-${Date.now()}@example.com`,
        full_name: null,
        bio: null,
        avatar_url: null,
        phone: null,
        address: null,
        education: null,
        university: null,
        graduation_year: null,
        github_url: null,
        aadhaar_number: null,
        total_xp: 0,
        current_streak: 0,
        longest_streak: 0,
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

  describe('Profile Field Completion', () => {
    it('should award XP when profile field is completed', async () => {
      // Requirements: 16.1
      
      // Complete full_name field
      const transaction = await profileCompletionService.awardProfileFieldXP({
        userId: testUserId,
        fieldName: 'full_name',
        fieldValue: 'John Doe',
      });

      expect(transaction).toBeDefined();
      expect(transaction.source).toBe('profile_completion');
      expect(transaction.activityType).toBe('profile_field_full_name');
      expect(transaction.amount).toBeGreaterThan(0);

      // Verify XP was added
      const totalXP = await xpService.getUserTotalXP(testUserId);
      expect(totalXP).toBeGreaterThan(0);
    });

    it('should award different XP amounts based on field importance', async () => {
      // Requirements: 16.1
      
      // Complete high-weight field (full_name: weight 3, 30 XP)
      const highWeightTx = await profileCompletionService.awardProfileFieldXP({
        userId: testUserId,
        fieldName: 'full_name',
        fieldValue: 'John Doe',
      });

      // Create another user for low-weight field test
      const { data: user2 } = await supabase
        .from('profiles')
        .insert({
          username: `test_profile_2_${Date.now()}_${Math.random().toString(36).substring(7)}`,
          email: `test-profile-2-${Date.now()}@example.com`,
          total_xp: 0,
          profile_completion_percentage: 0,
        })
        .select()
        .single();

      // Complete low-weight field (phone: weight 1, 10 XP)
      const lowWeightTx = await profileCompletionService.awardProfileFieldXP({
        userId: user2.id,
        fieldName: 'phone',
        fieldValue: '1234567890',
      });

      expect(highWeightTx.amount).toBeGreaterThan(lowWeightTx.amount);

      // Cleanup
      await supabase.from('xp_transactions').delete().eq('user_id', user2.id);
      await supabase.from('profiles').delete().eq('id', user2.id);
    });

    it('should not award XP for empty field values', async () => {
      // Requirements: 16.1
      
      // Try to complete field with empty value
      const transaction = await profileCompletionService.awardProfileFieldXP({
        userId: testUserId,
        fieldName: 'bio',
        fieldValue: '',
      });

      expect(transaction).toBeNull();

      // Verify no XP was added
      const totalXP = await xpService.getUserTotalXP(testUserId);
      expect(totalXP).toBe(0);
    });

    it('should not award XP for null field values', async () => {
      // Requirements: 16.1
      
      const transaction = await profileCompletionService.awardProfileFieldXP({
        userId: testUserId,
        fieldName: 'avatar_url',
        fieldValue: null,
      });

      expect(transaction).toBeNull();
    });
  });

  describe('Duplicate Prevention', () => {
    it('should prevent duplicate XP awards for same field', async () => {
      // Requirements: 16.4
      
      // Complete field first time
      const firstTx = await profileCompletionService.awardProfileFieldXP({
        userId: testUserId,
        fieldName: 'bio',
        fieldValue: 'My bio',
      });

      expect(firstTx).toBeDefined();
      const firstXP = await xpService.getUserTotalXP(testUserId);

      // Try to complete same field again
      const secondTx = await profileCompletionService.awardProfileFieldXP({
        userId: testUserId,
        fieldName: 'bio',
        fieldValue: 'Updated bio',
      });

      expect(secondTx).toBeNull();

      // Verify XP didn't increase
      const secondXP = await xpService.getUserTotalXP(testUserId);
      expect(secondXP).toBe(firstXP);
    });

    it('should allow XP for different fields', async () => {
      // Requirements: 16.1, 16.4
      
      // Complete first field
      await profileCompletionService.awardProfileFieldXP({
        userId: testUserId,
        fieldName: 'full_name',
        fieldValue: 'John Doe',
      });

      const xpAfterFirst = await xpService.getUserTotalXP(testUserId);

      // Complete second field
      await profileCompletionService.awardProfileFieldXP({
        userId: testUserId,
        fieldName: 'bio',
        fieldValue: 'My bio',
      });

      const xpAfterSecond = await xpService.getUserTotalXP(testUserId);

      // XP should have increased
      expect(xpAfterSecond).toBeGreaterThan(xpAfterFirst);
    });
  });

  describe('Profile Completion Percentage', () => {
    it('should calculate profile completion percentage', async () => {
      // Requirements: 16.2
      
      // Initially 0%
      let completion = await profileCompletionService.calculateProfileCompletion(testUserId);
      expect(completion.profileCompletionPercentage).toBe(0);

      // Complete one field
      await profileCompletionService.awardProfileFieldXP({
        userId: testUserId,
        fieldName: 'full_name',
        fieldValue: 'John Doe',
      });

      // Update profile with the field
      await supabase
        .from('profiles')
        .update({ full_name: 'John Doe' })
        .eq('id', testUserId);

      completion = await profileCompletionService.calculateProfileCompletion(testUserId);
      expect(completion.profileCompletionPercentage).toBeGreaterThan(0);
      expect(completion.completedFields).toContain('full_name');
    });

    it('should update profile_completion_percentage in database', async () => {
      // Requirements: 16.2
      
      // Complete a field
      await profileCompletionService.awardProfileFieldXP({
        userId: testUserId,
        fieldName: 'full_name',
        fieldValue: 'John Doe',
      });

      // Update profile
      await supabase
        .from('profiles')
        .update({ full_name: 'John Doe' })
        .eq('id', testUserId);

      // Trigger percentage update
      await profileCompletionService.calculateProfileCompletion(testUserId);

      // Verify database was updated
      const { data: profile } = await supabase
        .from('profiles')
        .select('profile_completion_percentage')
        .eq('id', testUserId)
        .single();

      expect(profile.profile_completion_percentage).toBeGreaterThan(0);
    });

    it('should show remaining fields', async () => {
      // Requirements: 16.2
      
      // Complete some fields
      await supabase
        .from('profiles')
        .update({
          full_name: 'John Doe',
          bio: 'My bio',
        })
        .eq('id', testUserId);

      const completion = await profileCompletionService.calculateProfileCompletion(testUserId);

      expect(completion.remainingFields.length).toBeGreaterThan(0);
      expect(completion.remainingFields.every(f => !['full_name', 'bio'].includes(f.name))).toBe(true);
    });
  });

  describe('100% Completion Bonus', () => {
    it('should award bonus XP when profile reaches 100%', async () => {
      // Requirements: 16.3
      
      // Get all profile fields
      const fields = profileCompletionService.getProfileFields();

      // Complete all fields
      for (const field of fields) {
        const fieldValue = field.name === 'graduation_year' ? 2024 : `Test ${field.name}`;
        
        await profileCompletionService.awardProfileFieldXP({
          userId: testUserId,
          fieldName: field.name,
          fieldValue,
        });

        // Update profile
        await supabase
          .from('profiles')
          .update({ [field.name]: fieldValue })
          .eq('id', testUserId);
      }

      // Check for completion bonus transaction
      const history = await xpService.getXPHistory(testUserId, {
        page: 1,
        pageSize: 100,
      });

      const bonusTransaction = history.transactions.find(
        t => t.activityType === 'profile_completion_bonus'
      );

      expect(bonusTransaction).toBeDefined();
      expect(bonusTransaction?.amount).toBeGreaterThan(0);
    });

    it('should not award completion bonus twice', async () => {
      // Requirements: 16.3, 16.4
      
      // Get all profile fields
      const fields = profileCompletionService.getProfileFields();

      // Complete all fields
      for (const field of fields) {
        const fieldValue = field.name === 'graduation_year' ? 2024 : `Test ${field.name}`;
        
        await profileCompletionService.awardProfileFieldXP({
          userId: testUserId,
          fieldName: field.name,
          fieldValue,
        });

        await supabase
          .from('profiles')
          .update({ [field.name]: fieldValue })
          .eq('id', testUserId);
      }

      const xpAfterBonus = await xpService.getUserTotalXP(testUserId);

      // Try to trigger bonus again by updating a field
      await profileCompletionService.awardProfileFieldXP({
        userId: testUserId,
        fieldName: 'bio',
        fieldValue: 'Updated bio',
      });

      const xpAfterUpdate = await xpService.getUserTotalXP(testUserId);

      // XP should not have increased (no duplicate bonus)
      expect(xpAfterUpdate).toBe(xpAfterBonus);
    });

    it('should calculate 100% completion correctly', async () => {
      // Requirements: 16.2, 16.3
      
      // Get all profile fields
      const fields = profileCompletionService.getProfileFields();

      // Complete all fields
      for (const field of fields) {
        const fieldValue = field.name === 'graduation_year' ? 2024 : `Test ${field.name}`;
        
        await supabase
          .from('profiles')
          .update({ [field.name]: fieldValue })
          .eq('id', testUserId);
      }

      const completion = await profileCompletionService.calculateProfileCompletion(testUserId);

      expect(completion.profileCompletionPercentage).toBe(100);
      expect(completion.remainingFields).toHaveLength(0);
      expect(completion.completedFields).toHaveLength(fields.length);
    });
  });

  describe('Profile Field Metadata', () => {
    it('should include field metadata in XP transaction', async () => {
      // Requirements: 16.1
      
      const transaction = await profileCompletionService.awardProfileFieldXP({
        userId: testUserId,
        fieldName: 'github_url',
        fieldValue: 'https://github.com/testuser',
      });

      expect(transaction.metadata).toBeDefined();
      expect(transaction.metadata.fieldName).toBe('github_url');
      expect(transaction.metadata.fieldDisplayName).toBeDefined();
      expect(transaction.metadata.fieldWeight).toBeGreaterThan(0);
    });

    it('should track which fields have been completed', async () => {
      // Requirements: 16.2
      
      // Complete multiple fields
      const fieldsToComplete = ['full_name', 'bio', 'github_url'];
      
      for (const fieldName of fieldsToComplete) {
        await profileCompletionService.awardProfileFieldXP({
          userId: testUserId,
          fieldName,
          fieldValue: `Test ${fieldName}`,
        });

        await supabase
          .from('profiles')
          .update({ [fieldName]: `Test ${fieldName}` })
          .eq('id', testUserId);
      }

      const completion = await profileCompletionService.calculateProfileCompletion(testUserId);

      expect(completion.completedFields).toEqual(expect.arrayContaining(fieldsToComplete));
    });
  });

  describe('Edge Cases', () => {
    it('should handle non-tracked fields gracefully', async () => {
      // Requirements: 16.1
      
      const transaction = await profileCompletionService.awardProfileFieldXP({
        userId: testUserId,
        fieldName: 'non_existent_field',
        fieldValue: 'Some value',
      });

      expect(transaction).toBeNull();
    });

    it('should handle whitespace-only values as empty', async () => {
      // Requirements: 16.1
      
      const transaction = await profileCompletionService.awardProfileFieldXP({
        userId: testUserId,
        fieldName: 'bio',
        fieldValue: '   ',
      });

      expect(transaction).toBeNull();
    });

    it('should handle numeric field values', async () => {
      // Requirements: 16.1
      
      const transaction = await profileCompletionService.awardProfileFieldXP({
        userId: testUserId,
        fieldName: 'graduation_year',
        fieldValue: 2024,
      });

      expect(transaction).toBeDefined();
      expect(transaction.amount).toBeGreaterThan(0);
    });
  });

  describe('Complete Profile Flow', () => {
    it('should award cumulative XP for completing entire profile', async () => {
      // Requirements: 16.1, 16.2, 16.3, 16.4
      
      const fields = profileCompletionService.getProfileFields();
      let totalExpectedXP = 0;

      // Complete all fields and track expected XP
      for (const field of fields) {
        const fieldValue = field.name === 'graduation_year' ? 2024 : `Test ${field.name}`;
        
        const transaction = await profileCompletionService.awardProfileFieldXP({
          userId: testUserId,
          fieldName: field.name,
          fieldValue,
        });

        if (transaction) {
          totalExpectedXP += transaction.amount;
        }

        await supabase
          .from('profiles')
          .update({ [field.name]: fieldValue })
          .eq('id', testUserId);
      }

      // Add completion bonus (50 XP)
      totalExpectedXP += 50;

      // Verify total XP
      const totalXP = await xpService.getUserTotalXP(testUserId);
      expect(totalXP).toBe(totalExpectedXP);

      // Verify 100% completion
      const completion = await profileCompletionService.calculateProfileCompletion(testUserId);
      expect(completion.profileCompletionPercentage).toBe(100);
    });
  });
});
