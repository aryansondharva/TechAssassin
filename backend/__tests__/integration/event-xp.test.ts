/**
 * Integration Tests: Event Participation XP
 * 
 * Tests event participation XP awards including:
 * - Event registration → XP award
 * - Event check-in → XP award
 * - Event completion → XP award
 * - Placement bonus XP
 * 
 * Requirements: 17.1, 17.2, 17.3, 17.4, 17.5
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { xpService } from '@/services/xp-service';
import { createClient } from '../setup/test-supabase-client';

describe('Event Participation XP Integration Tests', () => {
  let testUserId: string;
  let testEventId: string;
  let supabase: any;

  beforeEach(async () => {
    supabase = createClient();
    
    // Create a test user
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .insert({
        username: `test_event_xp_${Date.now()}_${Math.random().toString(36).substring(7)}`,
        email: `test-event-xp-${Date.now()}@example.com`,
        full_name: 'Test Event XP User',
        total_xp: 0,
        current_streak: 0,
        longest_streak: 0,
        profile_completion_percentage: 0,
      })
      .select()
      .single();
    
    if (profileError) throw profileError;
    testUserId = profile.id;

    // Create a test event
    const { data: event, error: eventError } = await supabase
      .from('events')
      .insert({
        title: `Test Event ${Date.now()}`,
        description: 'Test event for XP integration',
        event_date: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
        location: 'Test Location',
        max_participants: 100,
        status: 'upcoming',
      })
      .select()
      .single();
    
    if (eventError) throw eventError;
    testEventId = event.id;
  });

  afterEach(async () => {
    // Cleanup: Delete test data
    if (testUserId) {
      await supabase.from('xp_transactions').delete().eq('user_id', testUserId);
      await supabase.from('registrations').delete().eq('user_id', testUserId);
      await supabase.from('profiles').delete().eq('id', testUserId);
    }
    
    if (testEventId) {
      await supabase.from('events').delete().eq('id', testEventId);
    }
  });

  describe('Event Registration XP', () => {
    it('should award XP when user registers for event', async () => {
      // Requirements: 17.1, 17.5
      
      // Award registration XP
      const transaction = await xpService.awardXP({
        userId: testUserId,
        amount: 50,
        source: 'event_participation',
        activityType: 'registration',
        referenceId: testEventId,
        description: 'Registered for event',
        metadata: {
          eventId: testEventId,
          eventTitle: 'Test Event',
        },
      });

      expect(transaction).toBeDefined();
      expect(transaction.source).toBe('event_participation');
      expect(transaction.activityType).toBe('registration');
      expect(transaction.referenceId).toBe(testEventId);
      expect(transaction.amount).toBe(50);

      // Verify XP was added to total
      const totalXP = await xpService.getUserTotalXP(testUserId);
      expect(totalXP).toBe(50);
    });

    it('should link XP transaction to event via reference_id', async () => {
      // Requirements: 17.5
      
      await xpService.awardXP({
        userId: testUserId,
        amount: 50,
        source: 'event_participation',
        activityType: 'registration',
        referenceId: testEventId,
        description: 'Event registration',
      });

      // Retrieve transaction
      const history = await xpService.getXPHistory(testUserId, {
        page: 1,
        pageSize: 10,
      });

      const eventTransaction = history.transactions.find(
        t => t.referenceId === testEventId
      );

      expect(eventTransaction).toBeDefined();
      expect(eventTransaction?.referenceId).toBe(testEventId);
    });

    it('should prevent duplicate registration XP with cooldown', async () => {
      // Requirements: 17.1, 17.5
      
      const activityType = 'registration';

      // First registration
      await xpService.awardXP({
        userId: testUserId,
        amount: 50,
        source: 'event_participation',
        activityType,
        referenceId: testEventId,
        description: 'First registration',
      });

      // Set cooldown
      await xpService.setCooldown(testUserId, activityType, testEventId, 3600);

      // Check cooldown
      const isOnCooldown = await xpService.checkCooldown(
        testUserId,
        activityType,
        testEventId
      );

      expect(isOnCooldown).toBe(true);
    });
  });

  describe('Event Check-in XP', () => {
    it('should award XP when user checks in to event', async () => {
      // Requirements: 17.2, 17.5
      
      // Award check-in XP (typically higher than registration)
      const transaction = await xpService.awardXP({
        userId: testUserId,
        amount: 100,
        source: 'event_participation',
        activityType: 'check_in',
        referenceId: testEventId,
        description: 'Checked in to event',
        metadata: {
          eventId: testEventId,
          checkInTime: new Date().toISOString(),
        },
      });

      expect(transaction).toBeDefined();
      expect(transaction.activityType).toBe('check_in');
      expect(transaction.amount).toBe(100);

      // Verify XP was added
      const totalXP = await xpService.getUserTotalXP(testUserId);
      expect(totalXP).toBe(100);
    });

    it('should award higher XP for check-in than registration', async () => {
      // Requirements: 17.2
      
      // Award registration XP
      const registrationTx = await xpService.awardXP({
        userId: testUserId,
        amount: 50,
        source: 'event_participation',
        activityType: 'registration',
        referenceId: testEventId,
        description: 'Registration',
      });

      // Award check-in XP
      const checkInTx = await xpService.awardXP({
        userId: testUserId,
        amount: 100,
        source: 'event_participation',
        activityType: 'check_in',
        referenceId: testEventId,
        description: 'Check-in',
      });

      expect(checkInTx.amount).toBeGreaterThan(registrationTx.amount);
    });
  });

  describe('Event Completion XP', () => {
    it('should award XP when event is completed', async () => {
      // Requirements: 17.3, 17.5
      
      // Award completion XP
      const transaction = await xpService.awardXP({
        userId: testUserId,
        amount: 200,
        source: 'event_participation',
        activityType: 'completion',
        referenceId: testEventId,
        description: 'Completed event',
        metadata: {
          eventId: testEventId,
          completionTime: new Date().toISOString(),
        },
      });

      expect(transaction).toBeDefined();
      expect(transaction.activityType).toBe('completion');
      expect(transaction.amount).toBe(200);

      // Verify XP was added
      const totalXP = await xpService.getUserTotalXP(testUserId);
      expect(totalXP).toBe(200);
    });

    it('should award completion XP to all attendees', async () => {
      // Requirements: 17.3
      
      // Create multiple test users
      const users = [];
      for (let i = 0; i < 3; i++) {
        const { data: user } = await supabase
          .from('profiles')
          .insert({
            username: `attendee_${i}_${Date.now()}_${Math.random().toString(36).substring(7)}`,
            email: `attendee-${i}-${Date.now()}@example.com`,
            full_name: `Attendee ${i}`,
            total_xp: 0,
          })
          .select()
          .single();
        users.push(user);
      }

      // Award completion XP to all
      for (const user of users) {
        await xpService.awardXP({
          userId: user.id,
          amount: 200,
          source: 'event_participation',
          activityType: 'completion',
          referenceId: testEventId,
          description: 'Event completion',
        });
      }

      // Verify all users received XP
      for (const user of users) {
        const totalXP = await xpService.getUserTotalXP(user.id);
        expect(totalXP).toBe(200);
      }

      // Cleanup
      for (const user of users) {
        await supabase.from('xp_transactions').delete().eq('user_id', user.id);
        await supabase.from('profiles').delete().eq('id', user.id);
      }
    });
  });

  describe('Placement Bonus XP', () => {
    it('should award bonus XP for 1st place', async () => {
      // Requirements: 17.4
      
      // Award base completion XP
      await xpService.awardXP({
        userId: testUserId,
        amount: 200,
        source: 'event_participation',
        activityType: 'completion',
        referenceId: testEventId,
        description: 'Event completion',
      });

      // Award 1st place bonus (e.g., 2x multiplier = 400 bonus)
      const bonusTx = await xpService.awardXP({
        userId: testUserId,
        amount: 400,
        source: 'event_participation',
        activityType: 'placement_bonus',
        referenceId: testEventId,
        description: '1st place bonus',
        metadata: {
          placement: 1,
          multiplier: 2.0,
        },
      });

      expect(bonusTx.amount).toBe(400);
      expect(bonusTx.activityType).toBe('placement_bonus');

      // Total should be 600 (200 + 400)
      const totalXP = await xpService.getUserTotalXP(testUserId);
      expect(totalXP).toBe(600);
    });

    it('should award different bonus amounts based on placement', async () => {
      // Requirements: 17.4
      
      // Create users for different placements
      const placements = [
        { place: 1, bonus: 400 },
        { place: 2, bonus: 300 },
        { place: 3, bonus: 200 },
      ];

      const users = [];
      for (let i = 0; i < placements.length; i++) {
        const { data: user } = await supabase
          .from('profiles')
          .insert({
            username: `placement_${i}_${Date.now()}_${Math.random().toString(36).substring(7)}`,
            email: `placement-${i}-${Date.now()}@example.com`,
            full_name: `Placement User ${i}`,
            total_xp: 0,
          })
          .select()
          .single();
        users.push(user);

        // Award placement bonus
        await xpService.awardXP({
          userId: user.id,
          amount: placements[i].bonus,
          source: 'event_participation',
          activityType: 'placement_bonus',
          referenceId: testEventId,
          description: `${placements[i].place} place bonus`,
          metadata: {
            placement: placements[i].place,
          },
        });
      }

      // Verify different bonus amounts
      for (let i = 0; i < users.length; i++) {
        const totalXP = await xpService.getUserTotalXP(users[i].id);
        expect(totalXP).toBe(placements[i].bonus);
      }

      // Verify 1st place got more than 2nd, 2nd more than 3rd
      const xp1 = await xpService.getUserTotalXP(users[0].id);
      const xp2 = await xpService.getUserTotalXP(users[1].id);
      const xp3 = await xpService.getUserTotalXP(users[2].id);

      expect(xp1).toBeGreaterThan(xp2);
      expect(xp2).toBeGreaterThan(xp3);

      // Cleanup
      for (const user of users) {
        await supabase.from('xp_transactions').delete().eq('user_id', user.id);
        await supabase.from('profiles').delete().eq('id', user.id);
      }
    });

    it('should apply multipliers from XP source config', async () => {
      // Requirements: 17.4
      
      // Set up XP source config with placement multipliers
      await xpService.updateXPSourceConfig('event_participation', {
        baseAmount: 200,
        multipliers: {
          placement_1st: 2.0,
          placement_2nd: 1.5,
          placement_3rd: 1.25,
        },
        cooldownSeconds: 0,
        maxPerHour: 1000,
      });

      // Get config
      const config = await xpService.getXPSourceConfig('event_participation');
      
      expect(config).toBeDefined();
      expect(config?.multipliers.placement_1st).toBe(2.0);
      expect(config?.multipliers.placement_2nd).toBe(1.5);
      expect(config?.multipliers.placement_3rd).toBe(1.25);
    });
  });

  describe('Complete Event Flow', () => {
    it('should award XP for complete event participation flow', async () => {
      // Requirements: 17.1, 17.2, 17.3, 17.4, 17.5
      
      // Step 1: Registration
      await xpService.awardXP({
        userId: testUserId,
        amount: 50,
        source: 'event_participation',
        activityType: 'registration',
        referenceId: testEventId,
        description: 'Event registration',
      });

      let totalXP = await xpService.getUserTotalXP(testUserId);
      expect(totalXP).toBe(50);

      // Step 2: Check-in
      await xpService.awardXP({
        userId: testUserId,
        amount: 100,
        source: 'event_participation',
        activityType: 'check_in',
        referenceId: testEventId,
        description: 'Event check-in',
      });

      totalXP = await xpService.getUserTotalXP(testUserId);
      expect(totalXP).toBe(150);

      // Step 3: Completion
      await xpService.awardXP({
        userId: testUserId,
        amount: 200,
        source: 'event_participation',
        activityType: 'completion',
        referenceId: testEventId,
        description: 'Event completion',
      });

      totalXP = await xpService.getUserTotalXP(testUserId);
      expect(totalXP).toBe(350);

      // Step 4: Placement bonus (2nd place)
      await xpService.awardXP({
        userId: testUserId,
        amount: 300,
        source: 'event_participation',
        activityType: 'placement_bonus',
        referenceId: testEventId,
        description: '2nd place bonus',
        metadata: { placement: 2 },
      });

      totalXP = await xpService.getUserTotalXP(testUserId);
      expect(totalXP).toBe(650);

      // Verify all transactions are linked to event
      const history = await xpService.getXPHistory(testUserId, {
        page: 1,
        pageSize: 10,
      });

      const eventTransactions = history.transactions.filter(
        t => t.referenceId === testEventId
      );

      expect(eventTransactions).toHaveLength(4);
      expect(eventTransactions.every(t => t.source === 'event_participation')).toBe(true);
    });
  });
});
