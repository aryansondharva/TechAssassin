import { z } from 'zod'

/**
 * Resource creation validation schema
 * Validates title, description, content_url, and category
 * Requirements: 8.1
 */
export const resourceCreateSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(200, 'Title must not exceed 200 characters'),
  description: z
    .string()
    .min(1, 'Description is required')
    .max(1000, 'Description must not exceed 1000 characters'),
  content_url: z
    .string()
    .regex(/^https?:\/\/.+/i, 'Content URL must be a valid URL'),
  category: z
    .string()
    .min(1, 'Category is required')
    .max(50, 'Category must not exceed 50 characters')
})

/**
 * Resource update validation schema (partial)
 * Allows updating any subset of resource fields
 * Requirements: 8.1
 */
export const resourceUpdateSchema = resourceCreateSchema.partial()

/**
 * Resource filter validation schema
 * Validates category filter and pagination parameters
 * Requirements: 8.1
 */
export const resourceFilterSchema = z.object({
  category: z
    .string()
    .optional(),
  page: z
    .number()
    .int('Page must be an integer')
    .positive('Page must be a positive number')
    .default(1),
  limit: z
    .number()
    .int('Limit must be an integer')
    .positive('Limit must be a positive number')
    .max(50, 'Limit cannot exceed 50')
    .default(20)
})