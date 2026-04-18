/**
 * Property-Based Tests for Validation Schemas
 * Feature: techassassin-backend
 * Property 3: Input Validation Rejection
 * 
 * Tests that all schemas reject invalid inputs and provide descriptive error messages
 * Requirements: 3.1, 4.1, 5.1, 7.1, 8.1, 9.1, 10.1, 12.1, 12.2
 */

import { describe, it, expect } from 'vitest'
import fc from 'fast-check'
import {
  profileUpdateSchema,
  avatarUploadSchema
} from './profile'
import {
  eventCreateSchema,
  eventUpdateSchema,
  eventFilterSchema
} from './event'
import {
  registrationCreateSchema,
  registrationUpdateSchema
} from './registration'
import {
  announcementCreateSchema,
  announcementUpdateSchema,
  announcementListSchema
} from './announcement'
import {
  resourceCreateSchema,
  resourceUpdateSchema,
  resourceFilterSchema
} from './resource'
import {
  sponsorCreateSchema,
  sponsorUpdateSchema
} from './sponsor'
import {
  leaderboardUpdateSchema
} from './leaderboard'

/**
 * Property 3: Input Validation Rejection
 * Validates: Requirements 3.1, 4.1, 5.1, 7.1, 8.1, 9.1, 10.1, 12.1, 12.2
 */
describe('Property 3: Input Validation Rejection', () => {
  
  describe('Profile Validation', () => {
    it('should reject usernames shorter than 3 characters', () => {
      fc.assert(
        fc.property(
          fc.string({ maxLength: 2 }),
          (username) => {
            const result = profileUpdateSchema.safeParse({ username })
            expect(result.success).toBe(false)
            if (!result.success) {
              expect(result.error.issues[0].message).toContain('at least 3 characters')
            }
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should reject usernames longer than 30 characters', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 31, maxLength: 100 }),
          (username) => {
            const result = profileUpdateSchema.safeParse({ username })
            expect(result.success).toBe(false)
            if (!result.success) {
              expect(result.error.issues[0].message).toContain('not exceed 30 characters')
            }
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should reject usernames with invalid characters', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 3, maxLength: 30 }).filter(s => /[^a-zA-Z0-9_]/.test(s)),
          (username) => {
            const result = profileUpdateSchema.safeParse({ username })
            expect(result.success).toBe(false)
            if (!result.success) {
              expect(result.error.issues[0].message).toContain('letters, numbers, and underscores')
            }
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should reject empty full_name', () => {
      const result = profileUpdateSchema.safeParse({ full_name: '' })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('required')
      }
    })

    it('should reject full_name longer than 100 characters', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 101, maxLength: 200 }),
          (full_name) => {
            const result = profileUpdateSchema.safeParse({ full_name })
            expect(result.success).toBe(false)
            if (!result.success) {
              expect(result.error.issues[0].message).toContain('not exceed 100 characters')
            }
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should reject invalid github_url format', () => {
      fc.assert(
        fc.property(
          fc.string().filter(s => {
            // Filter out strings that might be valid URLs (like "A:" which could be a protocol)
            return s !== '' && !s.startsWith('http') && !s.match(/^[a-zA-Z]+:/)
          }),
          (github_url) => {
            const result = profileUpdateSchema.safeParse({ github_url })
            expect(result.success).toBe(false)
            if (!result.success) {
              expect(result.error.issues[0].message).toContain('valid URL')
            }
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should reject skills array with more than 10 items', () => {
      fc.assert(
        fc.property(
          fc.array(fc.string(), { minLength: 11, maxLength: 20 }),
          (skills) => {
            const result = profileUpdateSchema.safeParse({ skills })
            expect(result.success).toBe(false)
            if (!result.success) {
              expect(result.error.issues[0].message).toContain('more than 10')
            }
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  describe('Event Validation', () => {
    it('should reject empty title', () => {
      const result = eventCreateSchema.safeParse({
        title: '',
        description: 'Test',
        start_date: '2024-06-01T00:00:00Z',
        end_date: '2024-06-02T00:00:00Z',
        location: 'Online',
        max_participants: 100
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('required')
      }
    })

    it('should reject title longer than 200 characters', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 201, maxLength: 300 }),
          (title) => {
            const result = eventCreateSchema.safeParse({
              title,
              description: 'Test',
              start_date: '2024-06-01T00:00:00Z',
              end_date: '2024-06-02T00:00:00Z',
              location: 'Online',
              max_participants: 100
            })
            expect(result.success).toBe(false)
            if (!result.success) {
              expect(result.error.issues.some(i => i.message.includes('not exceed 200'))).toBe(true)
            }
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should reject empty description', () => {
      const result = eventCreateSchema.safeParse({
        title: 'Test Event',
        description: '',
        start_date: '2024-06-01T00:00:00Z',
        end_date: '2024-06-02T00:00:00Z',
        location: 'Online',
        max_participants: 100
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('required')
      }
    })

    it('should reject invalid datetime format for start_date', () => {
      fc.assert(
        fc.property(
          fc.string().filter(s => !s.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)),
          (start_date) => {
            const result = eventCreateSchema.safeParse({
              title: 'Test Event',
              description: 'Test',
              start_date,
              end_date: '2024-06-02T00:00:00Z',
              location: 'Online',
              max_participants: 100
            })
            expect(result.success).toBe(false)
            if (!result.success) {
              expect(result.error.issues.some(i => i.message.includes('datetime'))).toBe(true)
            }
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should reject end_date before start_date', () => {
      const result = eventCreateSchema.safeParse({
        title: 'Test Event',
        description: 'Test',
        start_date: '2024-06-02T00:00:00Z',
        end_date: '2024-06-01T00:00:00Z',
        location: 'Online',
        max_participants: 100
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('after start date')
      }
    })

    it('should reject non-positive max_participants', () => {
      fc.assert(
        fc.property(
          fc.integer({ max: 0 }),
          (max_participants) => {
            const result = eventCreateSchema.safeParse({
              title: 'Test Event',
              description: 'Test',
              start_date: '2024-06-01T00:00:00Z',
              end_date: '2024-06-02T00:00:00Z',
              location: 'Online',
              max_participants
            })
            expect(result.success).toBe(false)
            if (!result.success) {
              expect(result.error.issues.some(i => i.message.includes('positive'))).toBe(true)
            }
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should reject non-integer max_participants', () => {
      fc.assert(
        fc.property(
          fc.double({ min: 1.1, max: 100.9, noNaN: true }),
          (max_participants) => {
            const result = eventCreateSchema.safeParse({
              title: 'Test Event',
              description: 'Test',
              start_date: '2024-06-01T00:00:00Z',
              end_date: '2024-06-02T00:00:00Z',
              location: 'Online',
              max_participants
            })
            expect(result.success).toBe(false)
            if (!result.success) {
              expect(result.error.issues.some(i => i.message.includes('integer'))).toBe(true)
            }
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should reject invalid status filter', () => {
      fc.assert(
        fc.property(
          fc.string().filter(s => !['live', 'upcoming', 'past'].includes(s)),
          (status) => {
            const result = eventFilterSchema.safeParse({ status })
            expect(result.success).toBe(false)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should reject page limit exceeding 100', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 101, max: 1000 }),
          (limit) => {
            const result = eventFilterSchema.safeParse({ limit })
            expect(result.success).toBe(false)
            if (!result.success) {
              expect(result.error.issues[0].message).toContain('cannot exceed 100')
            }
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  describe('Registration Validation', () => {
    it('should reject invalid UUID for event_id', () => {
      fc.assert(
        fc.property(
          fc.string().filter(s => !s.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)),
          (event_id) => {
            const result = registrationCreateSchema.safeParse({
              event_id,
              team_name: 'Test Team',
              project_idea: 'A great project idea'
            })
            expect(result.success).toBe(false)
            if (!result.success) {
              expect(result.error.issues.some(i => i.message.includes('UUID'))).toBe(true)
            }
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should reject empty team_name', () => {
      const result = registrationCreateSchema.safeParse({
        event_id: '123e4567-e89b-12d3-a456-426614174000',
        team_name: '',
        project_idea: 'A great project idea'
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('required')
      }
    })

    it('should reject team_name longer than 100 characters', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 101, maxLength: 200 }),
          (team_name) => {
            const result = registrationCreateSchema.safeParse({
              event_id: '123e4567-e89b-12d3-a456-426614174000',
              team_name,
              project_idea: 'A great project idea'
            })
            expect(result.success).toBe(false)
            if (!result.success) {
              expect(result.error.issues.some(i => i.message.includes('not exceed 100'))).toBe(true)
            }
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should reject project_idea shorter than 10 characters', () => {
      fc.assert(
        fc.property(
          fc.string({ maxLength: 9 }),
          (project_idea) => {
            const result = registrationCreateSchema.safeParse({
              event_id: '123e4567-e89b-12d3-a456-426614174000',
              team_name: 'Test Team',
              project_idea
            })
            expect(result.success).toBe(false)
            if (!result.success) {
              expect(result.error.issues.some(i => i.message.includes('at least 10'))).toBe(true)
            }
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should reject project_idea longer than 1000 characters', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1001, maxLength: 1500 }),
          (project_idea) => {
            const result = registrationCreateSchema.safeParse({
              event_id: '123e4567-e89b-12d3-a456-426614174000',
              team_name: 'Test Team',
              project_idea
            })
            expect(result.success).toBe(false)
            if (!result.success) {
              expect(result.error.issues.some(i => i.message.includes('not exceed 1000'))).toBe(true)
            }
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should reject invalid registration status', () => {
      fc.assert(
        fc.property(
          fc.string().filter(s => !['pending', 'confirmed', 'waitlisted'].includes(s)),
          (status) => {
            const result = registrationUpdateSchema.safeParse({ status })
            expect(result.success).toBe(false)
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  describe('Announcement Validation', () => {
    it('should reject empty content', () => {
      const result = announcementCreateSchema.safeParse({ content: '' })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('required')
      }
    })

    it('should reject content longer than 5000 characters', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 5001, maxLength: 6000 }),
          (content) => {
            const result = announcementCreateSchema.safeParse({ content })
            expect(result.success).toBe(false)
            if (!result.success) {
              expect(result.error.issues[0].message).toContain('not exceed 5000')
            }
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should reject page limit exceeding 50 for announcements', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 51, max: 200 }),
          (limit) => {
            const result = announcementListSchema.safeParse({ limit })
            expect(result.success).toBe(false)
            if (!result.success) {
              expect(result.error.issues[0].message).toContain('cannot exceed 50')
            }
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  describe('Resource Validation', () => {
    it('should reject empty title', () => {
      const result = resourceCreateSchema.safeParse({
        title: '',
        description: 'Test',
        content_url: 'https://example.com',
        category: 'guide'
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('required')
      }
    })

    it('should reject title longer than 200 characters', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 201, maxLength: 300 }),
          (title) => {
            const result = resourceCreateSchema.safeParse({
              title,
              description: 'Test',
              content_url: 'https://example.com',
              category: 'guide'
            })
            expect(result.success).toBe(false)
            if (!result.success) {
              expect(result.error.issues.some(i => i.message.includes('not exceed 200'))).toBe(true)
            }
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should reject description longer than 1000 characters', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1001, maxLength: 1500 }),
          (description) => {
            const result = resourceCreateSchema.safeParse({
              title: 'Test',
              description,
              content_url: 'https://example.com',
              category: 'guide'
            })
            expect(result.success).toBe(false)
            if (!result.success) {
              expect(result.error.issues.some(i => i.message.includes('not exceed 1000'))).toBe(true)
            }
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should reject invalid content_url format', () => {
      fc.assert(
        fc.property(
          fc.string().filter(s => !s.startsWith('http') && !s.match(/^[a-zA-Z]+:/)),
          (content_url) => {
            const result = resourceCreateSchema.safeParse({
              title: 'Test',
              description: 'Test',
              content_url,
              category: 'guide'
            })
            expect(result.success).toBe(false)
            if (!result.success) {
              expect(result.error.issues.some(i => i.message.includes('valid URL'))).toBe(true)
            }
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should reject category longer than 50 characters', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 51, maxLength: 100 }),
          (category) => {
            const result = resourceCreateSchema.safeParse({
              title: 'Test',
              description: 'Test',
              content_url: 'https://example.com',
              category
            })
            expect(result.success).toBe(false)
            if (!result.success) {
              expect(result.error.issues.some(i => i.message.includes('not exceed 50'))).toBe(true)
            }
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  describe('Sponsor Validation', () => {
    it('should reject empty name', () => {
      const result = sponsorCreateSchema.safeParse({
        name: '',
        logo_url: 'https://example.com/logo.png',
        website_url: 'https://example.com',
        tier: 'gold'
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('required')
      }
    })

    it('should reject name longer than 100 characters', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 101, maxLength: 200 }),
          (name) => {
            const result = sponsorCreateSchema.safeParse({
              name,
              logo_url: 'https://example.com/logo.png',
              website_url: 'https://example.com',
              tier: 'gold'
            })
            expect(result.success).toBe(false)
            if (!result.success) {
              expect(result.error.issues.some(i => i.message.includes('not exceed 100'))).toBe(true)
            }
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should reject invalid logo_url format', () => {
      fc.assert(
        fc.property(
          fc.string().filter(s => {
            // Filter out strings that might be valid URLs (like "A:" which could be a protocol)
            return s.length > 0 && !s.startsWith('http') && !s.match(/^[a-zA-Z]+:/)
          }),
          (logo_url) => {
            const result = sponsorCreateSchema.safeParse({
              name: 'Test Sponsor',
              logo_url,
              website_url: 'https://example.com',
              tier: 'gold'
            })
            expect(result.success).toBe(false)
            if (!result.success) {
              expect(result.error.issues.some(i => i.message.includes('valid URL'))).toBe(true)
            }
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should reject invalid tier value', () => {
      fc.assert(
        fc.property(
          fc.string().filter(s => !['gold', 'silver', 'bronze'].includes(s)),
          (tier) => {
            const result = sponsorCreateSchema.safeParse({
              name: 'Test Sponsor',
              logo_url: 'https://example.com/logo.png',
              website_url: 'https://example.com',
              tier
            })
            expect(result.success).toBe(false)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should reject description longer than 500 characters', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 501, maxLength: 700 }),
          (description) => {
            const result = sponsorCreateSchema.safeParse({
              name: 'Test Sponsor',
              logo_url: 'https://example.com/logo.png',
              website_url: 'https://example.com',
              tier: 'gold',
              description
            })
            expect(result.success).toBe(false)
            if (!result.success) {
              expect(result.error.issues.some(i => i.message.includes('not exceed 500'))).toBe(true)
            }
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  describe('Leaderboard Validation', () => {
    it('should reject invalid UUID for event_id', () => {
      fc.assert(
        fc.property(
          fc.string().filter(s => !s.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)),
          (event_id) => {
            const result = leaderboardUpdateSchema.safeParse({
              event_id,
              user_id: '123e4567-e89b-12d3-a456-426614174000',
              score: 100
            })
            expect(result.success).toBe(false)
            if (!result.success) {
              expect(result.error.issues.some(i => i.message.includes('UUID'))).toBe(true)
            }
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should reject invalid UUID for user_id', () => {
      fc.assert(
        fc.property(
          fc.string().filter(s => !s.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)),
          (user_id) => {
            const result = leaderboardUpdateSchema.safeParse({
              event_id: '123e4567-e89b-12d3-a456-426614174000',
              user_id,
              score: 100
            })
            expect(result.success).toBe(false)
            if (!result.success) {
              expect(result.error.issues.some(i => i.message.includes('UUID'))).toBe(true)
            }
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should reject negative score', () => {
      fc.assert(
        fc.property(
          fc.integer({ max: -1 }),
          (score) => {
            const result = leaderboardUpdateSchema.safeParse({
              event_id: '123e4567-e89b-12d3-a456-426614174000',
              user_id: '123e4567-e89b-12d3-a456-426614174001',
              score
            })
            expect(result.success).toBe(false)
            if (!result.success) {
              expect(result.error.issues.some(i => i.message.includes('non-negative'))).toBe(true)
            }
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should reject non-integer score', () => {
      fc.assert(
        fc.property(
          fc.double({ min: 0.1, max: 100.9, noNaN: true }),
          (score) => {
            const result = leaderboardUpdateSchema.safeParse({
              event_id: '123e4567-e89b-12d3-a456-426614174000',
              user_id: '123e4567-e89b-12d3-a456-426614174001',
              score
            })
            expect(result.success).toBe(false)
            if (!result.success) {
              expect(result.error.issues.some(i => i.message.includes('integer'))).toBe(true)
            }
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  describe('Descriptive Error Messages', () => {
    it('should provide descriptive error messages for all validation failures', () => {
      const testCases = [
        {
          schema: profileUpdateSchema,
          input: { username: 'ab' },
          expectedMessage: 'at least 3 characters'
        },
        {
          schema: eventCreateSchema,
          input: {
            title: '',
            description: 'Test',
            start_date: '2024-06-01T00:00:00Z',
            end_date: '2024-06-02T00:00:00Z',
            location: 'Online',
            max_participants: 100
          },
          expectedMessage: 'required'
        },
        {
          schema: registrationCreateSchema,
          input: {
            event_id: 'invalid-uuid',
            team_name: 'Test',
            project_idea: 'Short'
          },
          expectedMessage: 'UUID'
        },
        {
          schema: announcementCreateSchema,
          input: { content: '' },
          expectedMessage: 'required'
        },
        {
          schema: resourceCreateSchema,
          input: {
            title: 'Test',
            description: 'Test',
            content_url: 'not-a-url',
            category: 'guide'
          },
          expectedMessage: 'valid URL'
        },
        {
          schema: sponsorCreateSchema,
          input: {
            name: 'Test',
            logo_url: 'https://example.com',
            website_url: 'https://example.com',
            tier: 'platinum'
          },
          expectedMessage: 'expected one of'
        },
        {
          schema: leaderboardUpdateSchema,
          input: {
            event_id: '123e4567-e89b-12d3-a456-426614174000',
            user_id: '123e4567-e89b-12d3-a456-426614174001',
            score: -10
          },
          expectedMessage: 'non-negative'
        }
      ]

      testCases.forEach(({ schema, input, expectedMessage }) => {
        const result = schema.safeParse(input)
        expect(result.success).toBe(false)
        if (!result.success) {
          const errorMessages = result.error.issues.map(i => i.message).join(' ')
          expect(errorMessages.toLowerCase()).toContain(expectedMessage.toLowerCase())
        }
      })
    })
  })
})
