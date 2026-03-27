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

/**
 * Real-time leaderboard update validation schema
 * Validates event_id, user_id, and score for real-time updates
 * Requirements: 5.1, 7.4
 */
export const realtimeLeaderboardUpdateSchema = z.object({
  event_id: z
    .string()
    .uuid('Event ID must be a valid UUID'),
  user_id: z
    .string()
    .uuid('User ID must be a valid UUID'),
  score: z
    .number()
    .int('Score must be an integer')
    .nonnegative('Score must be non-negative'),
  is_optimistic: z
    .boolean()
    .optional()
    .default(false)
})

/**
 * Leaderboard query parameters validation schema
 * Validates pagination parameters
 * Requirements: 5.1, 7.4
 */
export const leaderboardQuerySchema = z.object({
  page: z
    .number()
    .int('Page must be an integer')
    .positive('Page must be positive')
    .optional()
    .default(1),
  pageSize: z
    .number()
    .int('Page size must be an integer')
    .min(1, 'Page size must be at least 1')
    .max(100, 'Page size cannot exceed 100')
    .optional()
    .default(20)
})