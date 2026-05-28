import { z } from 'zod'

/**
 * Leaderboard update validation schema
 * Validates event_id, user_id, and score
 * Requirements: 10.1.2
 */
export const leaderboardUpdateSchema = z.object({
  event_id: z
    .string()
    .uuid('Event ID must be a valid UUID'),
  user_id: z
    .string()
    .uuid('User ID must be a valid UUID'),
  score: z
    .number()
    .int('Score must be an integer')
    .nonnegative('Score must be non-negative')
})