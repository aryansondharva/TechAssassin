import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { recalculateRanks, getLeaderboard, upsertLeaderboardEntry } from './leaderboard'
import { getTestSupabaseClient, isDatabaseConfigured } from '@/lib/utils/test-db'

describe('Leaderboard Service Functions', () => {
  const supabase = getTestSupabaseClient()
  let testEventId: string
  let testUserIds: string[] = []
  let testLeaderboardIds: string[] = []

  beforeAll(async () => {
    if (!isDatabaseConfigured()) {
      console.warn('Skipping leaderboard tests - database not configured')
      return
    }

    // Create test event
    const { data: event, error: eventError } = await supabase
      .from('events')
      .insert({
        title: `Test Event for Leaderboard ${Date.now()}`,
        description: 'Test event',
        start_date: new Date(Date.now() + 86400000).toISOString(),
        end_date: new Date(Date.now() + 172800000).toISOString(),
        location: 'Test Location',
        max_participants: 10,
        registration_open: true
      })
      .select()
      .single()

    if (eventError) {
      console.error('Failed to create test event:', eventError)
      throw eventError
    }

    testEventId = event.id

    // Create test users
    for (let i = 0; i < 3; i++) {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: `test-leaderboard-${Date.now()}-${i}@example.com`,
        password: 'testpassword123'
      })

      if (authError || !authData.user) {
        console.error('Failed to create test user:', authError)
        throw authError
      }

      testUserIds.push(authData.user.id)
    }
  })

  afterAll(async () => {
    if (!isDatabaseConfigured()) {
      return
    }

    // Cleanup leaderboard entries
    if (testLeaderboardIds.length > 0) {
      await supabase
        .from('leaderboard')
        .delete()
        .in('id', testLeaderboardIds)
    }

    // Cleanup event
    if (testEventId) {
      await supabase
        .from('events')
        .delete()
        .eq('id', testEventId)
    }

    // Cleanup users
    for (const userId of testUserIds) {
      await supabase.auth.admin.deleteUser(userId)
    }
  })

  describe('upsertLeaderboardEntry', () => {
    it('should create a new leaderboard entry', async () => {
      if (!isDatabaseConfigured()) {
        return
      }

      const entry = await upsertLeaderboardEntry({
        event_id: testEventId,
        user_id: testUserIds[0],
        score: 100
      })

      expect(entry).toBeDefined()
      expect(entry.event_id).toBe(testEventId)
      expect(entry.user_id).toBe(testUserIds[0])
      expect(entry.score).toBe(100)
      expect(entry.rank).toBe(1)

      testLeaderboardIds.push(entry.id)
    })

    it('should update an existing leaderboard entry', async () => {
      if (!isDatabaseConfigured()) {
        return
      }

      // Update the same user's score
      const updatedEntry = await upsertLeaderboardEntry({
        event_id: testEventId,
        user_id: testUserIds[0],
        score: 150
      })

      expect(updatedEntry.score).toBe(150)
      expect(updatedEntry.rank).toBe(1)
    })
  })

  describe('recalculateRanks', () => {
    it('should assign ranks correctly based on scores', async () => {
      if (!isDatabaseConfigured()) {
        return
      }

      // Create entries with different scores
      const entry1 = await upsertLeaderboardEntry({
        event_id: testEventId,
        user_id: testUserIds[0],
        score: 100
      })

      const entry2 = await upsertLeaderboardEntry({
        event_id: testEventId,
        user_id: testUserIds[1],
        score: 90
      })

      const entry3 = await upsertLeaderboardEntry({
        event_id: testEventId,
        user_id: testUserIds[2],
        score: 90
      })

      testLeaderboardIds.push(entry1.id, entry2.id, entry3.id)

      // Recalculate ranks
      await recalculateRanks(testEventId)

      // Fetch entries to verify ranks
      const { data: entries } = await supabase
        .from('leaderboard')
        .select('*')
        .eq('event_id', testEventId)
        .order('rank', { ascending: true })

      expect(entries).toBeDefined()
      expect(entries!.length).toBe(3)

      // Highest score should be rank 1
      expect(entries![0].score).toBe(100)
      expect(entries![0].rank).toBe(1)

      // Tied scores should have same rank
      expect(entries![1].score).toBe(90)
      expect(entries![1].rank).toBe(2)
      expect(entries![2].score).toBe(90)
      expect(entries![2].rank).toBe(2)
    })
  })

  describe('getLeaderboard', () => {
    it('should return leaderboard entries ordered by rank', async () => {
      if (!isDatabaseConfigured()) {
        return
      }

      const entries = await getLeaderboard(testEventId)

      expect(entries).toBeDefined()
      expect(entries.length).toBeGreaterThan(0)

      // Verify ordering by rank
      for (let i = 1; i < entries.length; i++) {
        expect(entries[i].rank).toBeGreaterThanOrEqual(entries[i - 1].rank)
      }

      // Verify user profile information is included
      expect(entries[0].user).toBeDefined()
      expect(entries[0].user).toHaveProperty('username')
    })
  })
})
