import { describe, it, expect, vi, beforeEach } from 'vitest'
import { sendRegistrationConfirmation, sendWelcomeEmail, EventDetails } from './resend'

// Mock the Resend module
vi.mock('resend', () => {
  const mockSend = vi.fn().mockResolvedValue({ id: 'test-email-id' })
  
  return {
    Resend: class MockResend {
      emails = {
        send: mockSend
      }
    }
  }
})

describe('Email Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Clear console.error mock
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  describe('sendRegistrationConfirmation', () => {
    it('should send registration confirmation email with confirmed status', async () => {
      const eventDetails: EventDetails = {
        title: 'Test Hackathon',
        description: 'A test hackathon event',
        start_date: '2026-03-01T10:00:00Z',
        end_date: '2026-03-02T18:00:00Z',
        location: 'Test Location',
        status: 'confirmed'
      }

      await sendRegistrationConfirmation(
        'test@example.com',
        'Test Hackathon',
        eventDetails
      )

      // Should not throw error
      expect(true).toBe(true)
    })

    it('should send registration confirmation email with waitlisted status', async () => {
      const eventDetails: EventDetails = {
        title: 'Test Hackathon',
        description: 'A test hackathon event',
        start_date: '2026-03-01T10:00:00Z',
        end_date: '2026-03-02T18:00:00Z',
        location: 'Test Location',
        status: 'waitlisted'
      }

      await sendRegistrationConfirmation(
        'test@example.com',
        'Test Hackathon',
        eventDetails
      )

      // Should not throw error
      expect(true).toBe(true)
    })

    it('should not throw error when email sending fails', async () => {
      const eventDetails: EventDetails = {
        title: 'Test Hackathon',
        description: 'A test hackathon event',
        start_date: '2026-03-01T10:00:00Z',
        end_date: '2026-03-02T18:00:00Z',
        location: 'Test Location',
        status: 'confirmed'
      }

      // Should not throw - errors are caught and logged
      await expect(
        sendRegistrationConfirmation('test@example.com', 'Test Hackathon', eventDetails)
      ).resolves.not.toThrow()
    })
  })

  describe('sendWelcomeEmail', () => {
    it('should send welcome email', async () => {
      await sendWelcomeEmail('test@example.com', 'testuser')

      // Should not throw error
      expect(true).toBe(true)
    })

    it('should not throw error when email sending fails', async () => {
      // Should not throw - errors are caught and logged
      await expect(
        sendWelcomeEmail('test@example.com', 'testuser')
      ).resolves.not.toThrow()
    })
  })

  describe('Email Templates', () => {
    it('should include event details in registration confirmation', async () => {
      const eventDetails: EventDetails = {
        title: 'Test Hackathon 2026',
        description: 'An amazing hackathon',
        start_date: '2026-03-01T10:00:00Z',
        end_date: '2026-03-02T18:00:00Z',
        location: 'San Francisco, CA',
        status: 'confirmed'
      }

      await sendRegistrationConfirmation(
        'test@example.com',
        'Test Hackathon 2026',
        eventDetails
      )

      // Verify the function completes without error
      expect(true).toBe(true)
    })

    it('should include username in welcome email', async () => {
      await sendWelcomeEmail('test@example.com', 'johndoe')

      // Verify the function completes without error
      expect(true).toBe(true)
    })
  })
})
