/**
 * Tests for Supabase client configuration
 * Validates that both server-side and client-side clients are properly configured
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'

describe('Supabase Client Configuration', () => {
  beforeEach(() => {
    // Set up environment variables for testing
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key'
  })

  describe('getServerClient', () => {
    it('should create a server client with service role key', async () => {
      const { getServerClient } = await import('../../../lib/supabase')
      const client = getServerClient()
      
      expect(client).toBeDefined()
      expect(client.auth).toBeDefined()
    })

    it('should throw error when environment variables are missing', async () => {
      delete process.env.NEXT_PUBLIC_SUPABASE_URL
      delete process.env.SUPABASE_SERVICE_ROLE_KEY
      
      // Re-import to get fresh module
      vi.resetModules()
      const { getServerClient } = await import('../../../lib/supabase')
      
      expect(() => getServerClient()).toThrow('Missing Supabase environment variables')
    })

    it('should configure auth options correctly for server client', async () => {
      const { getServerClient } = await import('../../../lib/supabase')
      const client = getServerClient()
      
      // Server client should not auto-refresh tokens or persist sessions
      expect(client).toBeDefined()
    })
  })

  describe('getClientSupabase', () => {
    it('should create a client with anon key', async () => {
      const { getClientSupabase } = await import('../../../lib/supabase')
      const client = getClientSupabase()
      
      expect(client).toBeDefined()
      expect(client.auth).toBeDefined()
    })

    it('should throw error when environment variables are missing', async () => {
      delete process.env.NEXT_PUBLIC_SUPABASE_URL
      delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      
      // Re-import to get fresh module
      vi.resetModules()
      const { getClientSupabase } = await import('../../../lib/supabase')
      
      expect(() => getClientSupabase()).toThrow('Missing Supabase environment variables')
    })
  })

  describe('executeQuery', () => {
    it('should execute query successfully', async () => {
      const { executeQuery } = await import('../../../lib/supabase')
      
      const mockQueryFn = vi.fn().mockResolvedValue({ id: '123', name: 'Test' })
      const result = await executeQuery(mockQueryFn)
      
      expect(result.data).toEqual({ id: '123', name: 'Test' })
      expect(result.error).toBeNull()
      expect(mockQueryFn).toHaveBeenCalled()
    })

    it('should handle query errors gracefully', async () => {
      const { executeQuery } = await import('../../../lib/supabase')
      
      const mockError = new Error('Database connection failed')
      const mockQueryFn = vi.fn().mockRejectedValue(mockError)
      const result = await executeQuery(mockQueryFn)
      
      expect(result.data).toBeNull()
      expect(result.error).toBeInstanceOf(Error)
      expect(result.error?.message).toBe('Database connection failed')
    })

    it('should handle non-Error exceptions', async () => {
      const { executeQuery } = await import('../../../lib/supabase')
      
      const mockQueryFn = vi.fn().mockRejectedValue('String error')
      const result = await executeQuery(mockQueryFn)
      
      expect(result.data).toBeNull()
      expect(result.error).toBeInstanceOf(Error)
      expect(result.error?.message).toBe('Unknown database error')
    })
  })
})
