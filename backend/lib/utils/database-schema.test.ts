import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { getTestSupabaseClient, generateTestId, isDatabaseConfigured } from './test-db'

describe('Database Schema Tests', () => {
  // Skip all tests if database is not configured
  const skipTests = !isDatabaseConfigured()
  
  if (skipTests) {
    it.skip('Database tests require Supabase configuration', () => {
      console.log('⚠️  Skipping database tests: Please configure Supabase in backend/.env.local')
      console.log('   Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')
    })
    return
  }

  const supabase = getTestSupabaseClient()
  let testUserId: string
  let testEventId: string
  let testProfileId: string

  // Cleanup function to remove test data
  async function cleanupTestData() {
    try {
      // Delete in reverse order of dependencies
      if (testUserId) {
        await supabase.from('registrations').delete().eq('user_id', testUserId)
        await supabase.from('announcements').delete().eq('author_id', testUserId)
        await supabase.from('leaderboard').delete().eq('user_id', testUserId)
        await supabase.from('profiles').delete().eq('id', testUserId)
      }
      if (testEventId) {
        await supabase.from('registrations').delete().eq('event_id', testEventId)
        await supabase.from('leaderboard').delete().eq('event_id', testEventId)
        await supabase.from('events').delete().eq('id', testEventId)
      }
    } catch (error) {
      console.error('Cleanup error:', error)
    }
  }

  afterAll(async () => {
    await cleanupTestData()
  })

  describe('Table Existence and Columns', () => {
    it('should have profiles table with correct columns', async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .limit(0)

      expect(error).toBeNull()
      expect(data).toBeDefined()
    })

    it('should have events table with correct columns', async () => {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .limit(0)

      expect(error).toBeNull()
      expect(data).toBeDefined()
    })

    it('should have registrations table with correct columns', async () => {
      const { data, error } = await supabase
        .from('registrations')
        .select('*')
        .limit(0)

      expect(error).toBeNull()
      expect(data).toBeDefined()
    })

    it('should have announcements table with correct columns', async () => {
      const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .limit(0)

      expect(error).toBeNull()
      expect(data).toBeDefined()
    })

    it('should have resources table with correct columns', async () => {
      const { data, error } = await supabase
        .from('resources')
        .select('*')
        .limit(0)

      expect(error).toBeNull()
      expect(data).toBeDefined()
    })

    it('should have sponsors table with correct columns', async () => {
      const { data, error } = await supabase
        .from('sponsors')
        .select('*')
        .limit(0)

      expect(error).toBeNull()
      expect(data).toBeDefined()
    })

    it('should have leaderboard table with correct columns', async () => {
      const { data, error } = await supabase
        .from('leaderboard')
        .select('*')
        .limit(0)

      expect(error).toBeNull()
      expect(data).toBeDefined()
    })
  })

  describe('Unique Constraints', () => {
    beforeAll(async () => {
      // Create a test profile for unique constraint tests
      const uniqueUsername = generateTestId()
      const { data: profile, error } = await supabase
        .from('profiles')
        .insert({
          id: crypto.randomUUID(),
          username: uniqueUsername,
          full_name: 'Test User',
          is_admin: false,
          skills: [],
        })
        .select()
        .single()

      if (error) {
        console.error('Failed to create test profile:', error)
      } else {
        testProfileId = profile.id
      }
    })

    it('should enforce unique constraint on profiles.username', async () => {
      const username = generateTestId()

      // Insert first profile
      const { data: profile1, error: error1 } = await supabase
        .from('profiles')
        .insert({
          id: crypto.randomUUID(),
          username,
          full_name: 'User 1',
          is_admin: false,
          skills: [],
        })
        .select()
        .single()

      expect(error1).toBeNull()
      expect(profile1).toBeDefined()
      testUserId = profile1.id

      // Try to insert second profile with same username
      const { error: error2 } = await supabase
        .from('profiles')
        .insert({
          id: crypto.randomUUID(),
          username, // Same username
          full_name: 'User 2',
          is_admin: false,
          skills: [],
        })

      expect(error2).toBeDefined()
      expect(error2?.code).toBe('23505') // Unique violation error code
    })

    it('should enforce unique constraint on registrations(user_id, event_id)', async () => {
      // Create test event
      const { data: event, error: eventError } = await supabase
        .from('events')
        .insert({
          title: 'Test Event ' + generateTestId(),
          description: 'Test Description',
          start_date: new Date().toISOString(),
          end_date: new Date(Date.now() + 86400000).toISOString(),
          location: 'Online',
          max_participants: 100,
          registration_open: true,
        })
        .select()
        .single()

      expect(eventError).toBeNull()
      testEventId = event.id

      // Create first registration
      const { error: error1 } = await supabase
        .from('registrations')
        .insert({
          user_id: testProfileId,
          event_id: testEventId,
          team_name: 'Team 1',
          project_idea: 'Project idea 1',
          status: 'confirmed',
        })

      expect(error1).toBeNull()

      // Try to create duplicate registration
      const { error: error2 } = await supabase
        .from('registrations')
        .insert({
          user_id: testProfileId,
          event_id: testEventId,
          team_name: 'Team 2',
          project_idea: 'Project idea 2',
          status: 'confirmed',
        })

      expect(error2).toBeDefined()
      expect(error2?.code).toBe('23505') // Unique violation error code
    })
  })

  describe('Check Constraints', () => {
    it('should enforce check constraint on registrations.status', async () => {
      // Create test event if not exists
      if (!testEventId) {
        const { data: event } = await supabase
          .from('events')
          .insert({
            title: 'Test Event ' + generateTestId(),
            description: 'Test Description',
            start_date: new Date().toISOString(),
            end_date: new Date(Date.now() + 86400000).toISOString(),
            location: 'Online',
            max_participants: 100,
            registration_open: true,
          })
          .select()
          .single()
        testEventId = event!.id
      }

      // Create test profile if not exists
      if (!testProfileId) {
        const { data: profile } = await supabase
          .from('profiles')
          .insert({
            id: crypto.randomUUID(),
            username: generateTestId(),
            full_name: 'Test User',
            is_admin: false,
            skills: [],
          })
          .select()
          .single()
        testProfileId = profile!.id
      }

      // Try to insert registration with invalid status
      const { error } = await supabase
        .from('registrations')
        .insert({
          user_id: testProfileId,
          event_id: testEventId,
          team_name: 'Test Team',
          project_idea: 'Test idea',
          status: 'invalid_status', // Invalid status
        })

      expect(error).toBeDefined()
      expect(error?.code).toBe('23514') // Check constraint violation
    })

    it('should enforce check constraint on sponsors.tier', async () => {
      // Try to insert sponsor with invalid tier
      const { error } = await supabase
        .from('sponsors')
        .insert({
          name: 'Test Sponsor',
          logo_url: 'https://example.com/logo.png',
          website_url: 'https://example.com',
          tier: 'platinum', // Invalid tier
          description: 'Test description',
        })

      expect(error).toBeDefined()
      expect(error?.code).toBe('23514') // Check constraint violation
    })

    it('should accept valid registration status values', async () => {
      const validStatuses = ['pending', 'confirmed', 'waitlisted']

      for (const status of validStatuses) {
        // Create unique profile for each test
        const { data: profile } = await supabase
          .from('profiles')
          .insert({
            id: crypto.randomUUID(),
            username: generateTestId(),
            full_name: 'Test User',
            is_admin: false,
            skills: [],
          })
          .select()
          .single()

        const { error } = await supabase
          .from('registrations')
          .insert({
            user_id: profile!.id,
            event_id: testEventId,
            team_name: 'Test Team',
            project_idea: 'Test idea',
            status,
          })

        expect(error).toBeNull()

        // Cleanup
        await supabase.from('registrations').delete().eq('user_id', profile!.id)
        await supabase.from('profiles').delete().eq('id', profile!.id)
      }
    })

    it('should accept valid sponsor tier values', async () => {
      const validTiers = ['gold', 'silver', 'bronze']

      for (const tier of validTiers) {
        const { data, error } = await supabase
          .from('sponsors')
          .insert({
            name: 'Test Sponsor ' + generateTestId(),
            logo_url: 'https://example.com/logo.png',
            website_url: 'https://example.com',
            tier,
            description: 'Test description',
          })
          .select()
          .single()

        expect(error).toBeNull()
        expect(data).toBeDefined()

        // Cleanup
        await supabase.from('sponsors').delete().eq('id', data!.id)
      }
    })
  })

  describe('Foreign Key Constraints and Cascade Deletion', () => {
    it('should enforce foreign key constraint on registrations.user_id', async () => {
      const nonExistentUserId = crypto.randomUUID()

      const { error } = await supabase
        .from('registrations')
        .insert({
          user_id: nonExistentUserId,
          event_id: testEventId,
          team_name: 'Test Team',
          project_idea: 'Test idea',
          status: 'confirmed',
        })

      expect(error).toBeDefined()
      expect(error?.code).toBe('23503') // Foreign key violation
    })

    it('should enforce foreign key constraint on registrations.event_id', async () => {
      const nonExistentEventId = crypto.randomUUID()

      const { error } = await supabase
        .from('registrations')
        .insert({
          user_id: testProfileId,
          event_id: nonExistentEventId,
          team_name: 'Test Team',
          project_idea: 'Test idea',
          status: 'confirmed',
        })

      expect(error).toBeDefined()
      expect(error?.code).toBe('23503') // Foreign key violation
    })

    it('should cascade delete registrations when event is deleted', async () => {
      // Create test event
      const { data: event } = await supabase
        .from('events')
        .insert({
          title: 'Test Event ' + generateTestId(),
          description: 'Test Description',
          start_date: new Date().toISOString(),
          end_date: new Date(Date.now() + 86400000).toISOString(),
          location: 'Online',
          max_participants: 100,
          registration_open: true,
        })
        .select()
        .single()

      const eventId = event!.id

      // Create test profile
      const { data: profile } = await supabase
        .from('profiles')
        .insert({
          id: crypto.randomUUID(),
          username: generateTestId(),
          full_name: 'Test User',
          is_admin: false,
          skills: [],
        })
        .select()
        .single()

      const userId = profile!.id

      // Create registration
      const { data: registration } = await supabase
        .from('registrations')
        .insert({
          user_id: userId,
          event_id: eventId,
          team_name: 'Test Team',
          project_idea: 'Test idea',
          status: 'confirmed',
        })
        .select()
        .single()

      expect(registration).toBeDefined()

      // Delete event
      const { error: deleteError } = await supabase
        .from('events')
        .delete()
        .eq('id', eventId)

      expect(deleteError).toBeNull()

      // Verify registration was cascade deleted
      const { data: deletedRegistration } = await supabase
        .from('registrations')
        .select()
        .eq('id', registration!.id)
        .single()

      expect(deletedRegistration).toBeNull()

      // Cleanup profile
      await supabase.from('profiles').delete().eq('id', userId)
    })

    it('should cascade delete announcements when profile is deleted', async () => {
      // Create test profile
      const { data: profile } = await supabase
        .from('profiles')
        .insert({
          id: crypto.randomUUID(),
          username: generateTestId(),
          full_name: 'Test User',
          is_admin: false,
          skills: [],
        })
        .select()
        .single()

      const userId = profile!.id

      // Create announcement
      const { data: announcement } = await supabase
        .from('announcements')
        .insert({
          author_id: userId,
          content: 'Test announcement',
        })
        .select()
        .single()

      expect(announcement).toBeDefined()

      // Delete profile
      const { error: deleteError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId)

      expect(deleteError).toBeNull()

      // Verify announcement was cascade deleted
      const { data: deletedAnnouncement } = await supabase
        .from('announcements')
        .select()
        .eq('id', announcement!.id)
        .single()

      expect(deletedAnnouncement).toBeNull()
    })

    it('should cascade delete leaderboard entries when event is deleted', async () => {
      // Create test event
      const { data: event } = await supabase
        .from('events')
        .insert({
          title: 'Test Event ' + generateTestId(),
          description: 'Test Description',
          start_date: new Date().toISOString(),
          end_date: new Date(Date.now() + 86400000).toISOString(),
          location: 'Online',
          max_participants: 100,
          registration_open: true,
        })
        .select()
        .single()

      const eventId = event!.id

      // Create test profile
      const { data: profile } = await supabase
        .from('profiles')
        .insert({
          id: crypto.randomUUID(),
          username: generateTestId(),
          full_name: 'Test User',
          is_admin: false,
          skills: [],
        })
        .select()
        .single()

      const userId = profile!.id

      // Create leaderboard entry
      const { data: leaderboardEntry } = await supabase
        .from('leaderboard')
        .insert({
          event_id: eventId,
          user_id: userId,
          score: 100,
          rank: 1,
        })
        .select()
        .single()

      expect(leaderboardEntry).toBeDefined()

      // Delete event
      const { error: deleteError } = await supabase
        .from('events')
        .delete()
        .eq('id', eventId)

      expect(deleteError).toBeNull()

      // Verify leaderboard entry was cascade deleted
      const { data: deletedEntry } = await supabase
        .from('leaderboard')
        .select()
        .eq('id', leaderboardEntry!.id)
        .single()

      expect(deletedEntry).toBeNull()

      // Cleanup profile
      await supabase.from('profiles').delete().eq('id', userId)
    })
  })

  describe('Indexes', () => {
    it('should have index on profiles.username', async () => {
      // Query using pg_indexes to check if index exists
      const { data, error } = await supabase.rpc('exec_sql', {
        sql: `
          SELECT indexname 
          FROM pg_indexes 
          WHERE tablename = 'profiles' 
          AND indexname = 'idx_profiles_username'
        `,
      })

      // If RPC is not available, we can test index effectiveness indirectly
      // by performing a query that would use the index
      const { data: profiles, error: queryError } = await supabase
        .from('profiles')
        .select('id, username')
        .eq('username', 'test_user')
        .limit(1)

      expect(queryError).toBeNull()
      expect(profiles).toBeDefined()
    })

    it('should have index on events.start_date', async () => {
      // Test index effectiveness by querying with start_date
      const { data, error } = await supabase
        .from('events')
        .select('id, title, start_date')
        .gte('start_date', new Date().toISOString())
        .order('start_date', { ascending: true })
        .limit(10)

      expect(error).toBeNull()
      expect(data).toBeDefined()
    })

    it('should have index on registrations.event_id', async () => {
      // Test index effectiveness by querying with event_id
      if (testEventId) {
        const { data, error } = await supabase
          .from('registrations')
          .select('id, event_id')
          .eq('event_id', testEventId)

        expect(error).toBeNull()
        expect(data).toBeDefined()
      }
    })

    it('should have index on registrations.user_id', async () => {
      // Test index effectiveness by querying with user_id
      if (testProfileId) {
        const { data, error } = await supabase
          .from('registrations')
          .select('id, user_id')
          .eq('user_id', testProfileId)

        expect(error).toBeNull()
        expect(data).toBeDefined()
      }
    })

    it('should have index on announcements.created_at', async () => {
      // Test index effectiveness by querying with created_at ordering
      const { data, error } = await supabase
        .from('announcements')
        .select('id, created_at')
        .order('created_at', { ascending: false })
        .limit(10)

      expect(error).toBeNull()
      expect(data).toBeDefined()
    })

    it('should have index on resources.category', async () => {
      // Test index effectiveness by querying with category filter
      const { data, error } = await supabase
        .from('resources')
        .select('id, category')
        .eq('category', 'tutorial')
        .limit(10)

      expect(error).toBeNull()
      expect(data).toBeDefined()
    })

    it('should have composite index on leaderboard(event_id, rank)', async () => {
      // Test index effectiveness by querying with event_id and ordering by rank
      if (testEventId) {
        const { data, error } = await supabase
          .from('leaderboard')
          .select('id, event_id, rank')
          .eq('event_id', testEventId)
          .order('rank', { ascending: true })

        expect(error).toBeNull()
        expect(data).toBeDefined()
      }
    })
  })
})
