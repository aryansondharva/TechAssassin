import { z } from 'zod'

/**
 * Profile update validation schema
 * Validates username, full_name, bio, github_url, linkedin_url, portfolio_url, and skills
 * Requirements: 3.1, 15.1, 15.2
 */
export const profileUpdateSchema = z.object({
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username must not exceed 30 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
  full_name: z
    .string()
    .min(1, 'Full name is required')
    .max(100, 'Full name must not exceed 100 characters'),
  bio: z
    .string()
    .max(500, 'Bio must not exceed 500 characters')
    .optional()
    .or(z.literal('')),
  github_url: z
    .string()
    .url('GitHub URL must be a valid URL')
    .optional()
    .or(z.literal('')),
  linkedin_url: z
    .string()
    .url('LinkedIn URL must be a valid URL')
    .optional()
    .or(z.literal('')),
  portfolio_url: z
    .string()
    .url('Portfolio URL must be a valid URL')
    .optional()
    .or(z.literal('')),
  skills: z
    .array(z.string())
    .max(15, 'Cannot have more than 15 skills')
    .optional(),
  university: z.string().max(100).optional().or(z.literal('')),
  education: z.string().max(100).optional().or(z.literal('')),
  graduation_year: z.union([z.number().int().min(1900).max(2100), z.string(), z.null()]).optional(),
  phone: z.string().max(20).optional().or(z.literal('')),
  address: z.string().max(200).optional().or(z.literal('')),
  avatar_url: z.string().url().optional().or(z.literal('')),
  banner_url: z.string().url().optional().or(z.literal('')),
  interests: z.array(z.string()).max(10, 'Cannot have more than 10 interests').optional(),
  first_name: z.string().max(50).optional().or(z.literal('')),
  last_name: z.string().max(50).optional().or(z.literal('')),
  gender: z.string().optional().or(z.literal('')),
  tshirt_size: z.string().optional().or(z.literal('')),
  readme: z.string().max(5000).optional().or(z.literal('')),
  dietary_preference: z.string().optional().or(z.literal('')),
  allergies: z.string().max(200).optional().or(z.literal('')),
  has_education: z.boolean().optional(),
  degree_type: z.string().optional().or(z.literal('')),
  graduation_month: z.string().optional().or(z.literal('')),
  roles: z.array(z.string()).optional(),
  resume_url: z.string().url().optional().or(z.literal('')),
  has_experience: z.boolean().optional(),
  twitter_url: z.string().url().optional().or(z.literal('')),
  emergency_contact_name: z.string().max(100).optional().or(z.literal('')),
  emergency_contact_phone: z.string().max(20).optional().or(z.literal('')),
}).partial()

/**
 * Avatar upload validation schema
 * Validates file type (jpg, png, webp) and size (< 2MB)
 * Requirements: 15.1, 15.2
 */
export const avatarUploadSchema = z.object({
  file: z
    .instanceof(File)
    .refine(
      (file) => file.size <= 2 * 1024 * 1024,
      'File size must be under 2MB'
    )
    .refine(
      (file) => ['image/jpeg', 'image/png', 'image/webp'].includes(file.type),
      'File must be an image (jpg, png, or webp)'
    )
})