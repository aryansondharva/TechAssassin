import { z } from 'zod'

/**
 * Registration creation validation schema
 * Validates event_id, team_name, and project_idea
 * Requirements: 5.1
 */
export const registrationCreateSchema = z.object({
  event_id: z
    .string()
    .uuid('Event ID must be a valid UUID'),
  team_name: z
    .string()
    .min(1, 'Team name is required')
    .max(100, 'Team name must not exceed 100 characters'),
  project_idea: z
    .string()
    .min(10, 'Project idea must be at least 10 characters')
    .max(1000, 'Project idea must not exceed 1000 characters')
})

/**
 * Registration update validation schema
 * Validates status enum (pending/confirmed/waitlisted)
 * Requirements: 5.1
 */
export const registrationUpdateSchema = z.object({
  status: z
    .enum(['pending', 'confirmed', 'waitlisted'], {
      message: 'Status must be pending, confirmed, or waitlisted'
    })
})