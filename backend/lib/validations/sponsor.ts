import { z } from 'zod'

/**
 * Sponsor creation validation schema
 * Validates name, logo_url, website_url, tier, and description
 * Requirement: 9.1
 */
export const sponsorCreateSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(100, 'Name must not exceed 100 characters'),
  logo_url: z
    .string()
    .url('Logo URL must be a valid URL'),
  website_url: z
    .string()
    .url('Website URL must be a valid URL'),
  tier: z
    .enum(['gold', 'silver', 'bronze'], {
      message: 'Tier must be gold, silver, or bronze'
    }),
  description: z
    .string()
    .max(500, 'Description must not exceed 500 characters')
    .optional()
})

/**
 * Sponsor update validation schema (partial)
 * Allows updating any subset of sponsor fields
 * Requirements: 9.1
 */
export const sponsorUpdateSchema = sponsorCreateSchema.partial()
