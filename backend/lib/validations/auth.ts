import { z } from 'zod'

/**
 * Validation schema for user signup
 * Requirements: 2.1, 2.2
 */
export const signupSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters').max(20, 'Username must be less than 20 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  full_name: z.string().optional(),
  phone: z.string().optional(),
  aadhaar_number: z.string().optional(),
  avatar_url: z.string().url().optional().or(z.literal('')),
  github_url: z.string().url().optional().or(z.literal('')),
  bio: z.string().optional(),
  address: z.string().optional(),
  education: z.string().optional(),
  university: z.string().optional(),
  graduation_year: z.number().int().min(1950).max(2030).optional()
})

/**
 * Validation schema for user signin
 * Requirements: 2.1, 2.2
 */
export const signinSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required')
})

/**
 * Validation schema for password reset request
 * Requirements: 2.6
 */
export const resetPasswordSchema = z.object({
  email: z.string().email('Invalid email address')
})

/**
 * Validation schema for password update
 * Requirements: 2.7
 */
export const updatePasswordSchema = z.object({
  password: z.string().min(8, 'Password must be at least 8 characters')
})
