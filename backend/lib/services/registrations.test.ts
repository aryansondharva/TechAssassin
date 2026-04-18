import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { determineRegistrationStatus, checkDuplicateRegistration, createRegistration } from './registrations'
import { createTestClient, cleanupTestData } from '@/lib/utils/test-db'

describe('Registration Service Functions', () => {
  let testEventId: string
  let testUserId: string
  const supabase = createTestClient()

  beforeAll(async () => {
    // Create test event
    const { data: event, error: eventError } = await supabase
      .from('events')
      .insert({
        title: 'Test Event for Registrations',
        description: 'Test event',
        start_date: new Date(Date.now() + 86400000).toISOString(),
        end_date: new Date(Date.now() + 172800000).toISOString(),
        location: 'Test Location',
        max_participants: 2,
        registration_open: true
      })
      .select()
      .single()

    if (eventError) {
      console.error('Failed to create test event:', eventError)
      throw eventError
    }

    testEventId = event.id

    // Create test user via auth (this will trigger profile creation)
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: `test-reg-${Date.now()}@example.com`,
      password: 'testpassword123'
    })

    if (authError || !authData.user) {
      console.error('Failed to create test user:', authError)
      throw authError
    }

    testUserId = authData.user.id
  })

  afterAll(async () => {
    await cleanupTestData(supabase, {
      events: [testEventId],
      profiles: [testUserId]
    })
  })

  describe('determineRegistrationStatus', () => {
    it('should return confirmed when capacity is available', async () => {
      const status = await determineRegistrationStatus(testEventId)
      expect(status).toBe('confirmed')
    })

    it('should return waitlisted when at capacity', async () => {
      // Create 2 registrations to fill capacity
      const user1Email = `user1-${Date.now()}@example.com`
      const user2Email = `user2-${Date.now()}@example.com`

      const { data: user1 } = await supabase.auth.signUp({
        email: user1Email,
        password: 'testpassword123'
      })

      const { data: user2 } = await supabase.auth.signUp({
        email: user2Email,
        password: 'testpassword123'
      })

      if (!user1.user || !user2.user) {
        throw new Error('Failed to create test users')
      }

      await supabase.from('registrations').insert([
        {
          user_id: user1.user.id,
          event_id: testEventId,
          team_name: 'Team 1',
          project_idea: 'Project idea 1',
          status: 'confirmed'
        },
        {
          user_id: user2.user.id,
          event_id: testEventId,
          team_name: 'Team 2',
          project_idea: 'Project idea 2',
          status: 'confirmed'
        }
      ])

      const status = await determineRegistrationStatus(testEventId)
      expect(status).toBe('waitlisted')

      // Cleanup
      await supabase.from('registrations').delete().eq('event_id', testEventId)
    })
  })

  describe('checkDuplicateRegistration', () => {
    it('should return false when no duplicate exists', async () => {
      const isDuplicate = await checkDuplicateRegistration(testUserId, testEventId)
      expect(isDuplicate).toBe(false)
    })

    it('should return true when duplicate exists', async () => {
      // Create a registration
      await supabase.from('registrations').insert({
        user_id: testUserId,
        event_id: testEventId,
        team_name: 'Test Team',
        project_idea: 'Test project idea',
        status: 'confirmed'
      })

      const isDuplicate = await checkDuplicateRegistration(testUserId, testEventId)
      expect(isDuplicate).toBe(true)

      // Cleanup
      await supabase.from('registrations').delete().eq('user_id', testUserId).eq('event_id', testEventId)
    })
  })

  describe('createRegistration', () => {
    it('should create registration with confirmed status when capacity available', async () => {
      const registration = await createRegistration(testUserId, {
        event_id: testEventId,
        team_name: 'My Team',
        project_idea: 'My awesome project idea'
      })

      expect(registration).toBeDefined()
      expect(registration.user_id).toBe(testUserId)
      expect(registration.event_id).toBe(testEventId)
      expect(registration.team_name).toBe('My Team')
      expect(registration.status).toBe('confirmed')

      // Cleanup
      await supabase.from('registrations').delete().eq('id', registration.id)
    })

    it('should throw error on duplicate registration', async () => {
      // Create first registration
      const registration = await createRegistration(testUserId, {
        event_id: testEventId,
        team_name: 'My Team',
        project_idea: 'My awesome project idea'
      })

      // Try to create duplicate
      await expect(
        createRegistration(testUserId, {
          event_id: testEventId,
          team_name: 'Another Team',
          project_idea: 'Another project idea'
        })
      ).rejects.toThrow('already registered')

      // Cleanup
      await supabase.from('registrations').delete().eq('id', registration.id)
    })
  })
})
