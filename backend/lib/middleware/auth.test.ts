import { describe, it, expect } from 'vitest'
import { requireAuth, requireAdmin, AuthenticationError, AuthorizationError } from './auth'

describe('Authentication Middleware', () => {
  describe('Error Classes', () => {
    it('should create AuthenticationError with correct status code', () => {
      const error = new AuthenticationError()
      expect(error).toBeInstanceOf(Error)
      expect(error.statusCode).toBe(401)
      expect(error.name).toBe('AuthenticationError')
      expect(error.message).toBe('Authentication required')
    })

    it('should create AuthenticationError with custom message', () => {
      const error = new AuthenticationError('Custom auth error')
      expect(error.message).toBe('Custom auth error')
      expect(error.statusCode).toBe(401)
    })

    it('should create AuthorizationError with correct status code', () => {
      const error = new AuthorizationError()
      expect(error).toBeInstanceOf(Error)
      expect(error.statusCode).toBe(403)
      expect(error.name).toBe('AuthorizationError')
      expect(error.message).toBe('Insufficient permissions')
    })

    it('should create AuthorizationError with custom message', () => {
      const error = new AuthorizationError('Custom auth error')
      expect(error.message).toBe('Custom auth error')
      expect(error.statusCode).toBe(403)
    })
  })

  describe('Function Signatures', () => {
    it('should export requireAuth function', () => {
      expect(requireAuth).toBeDefined()
      expect(typeof requireAuth).toBe('function')
    })

    it('should export requireAdmin function', () => {
      expect(requireAdmin).toBeDefined()
      expect(typeof requireAdmin).toBe('function')
    })
  })

  describe('requireAuth', () => {
    it('should be an async function', () => {
      const result = requireAuth()
      expect(result).toBeInstanceOf(Promise)
      // Clean up the promise to avoid unhandled rejection
      result.catch(() => {})
    })
  })

  describe('requireAdmin', () => {
    it('should be an async function', () => {
      const result = requireAdmin('test-user-id')
      expect(result).toBeInstanceOf(Promise)
      // Clean up the promise to avoid unhandled rejection
      result.catch(() => {})
    })

    it('should accept userId parameter', () => {
      expect(requireAdmin.length).toBe(1)
    })
  })
})
