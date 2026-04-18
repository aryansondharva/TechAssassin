import { afterEach, describe, expect, it } from 'vitest'
import { NextRequest } from 'next/server'

import { middleware } from './middleware'

const originalEnv = { ...process.env }

const buildRequest = (origin?: string, method = 'GET') =>
  new NextRequest('http://localhost/api/test', {
    method,
    headers: origin ? { origin } : {},
  })

afterEach(() => {
  process.env = { ...originalEnv }
})

describe('middleware CORS handling', () => {
  it('allows origins listed in CORS_ORIGINS', () => {
    process.env.NODE_ENV = 'production'
    process.env.CORS_ORIGINS = 'https://allowed.com'

    const response = middleware(buildRequest('https://allowed.com'))

    expect(response.headers.get('Access-Control-Allow-Origin')).toBe('https://allowed.com')
    expect(response.headers.get('Access-Control-Allow-Credentials')).toBe('true')
  })

  it('blocks origins not listed in CORS_ORIGINS when not in development', () => {
    process.env.NODE_ENV = 'production'
    process.env.CORS_ORIGINS = 'https://allowed.com'

    const response = middleware(buildRequest('https://other.com'))

    expect(response.headers.get('Access-Control-Allow-Origin')).toBeNull()
    expect(response.headers.get('Access-Control-Allow-Credentials')).toBeNull()
  })

  it('falls back to allowing requests in development for non-allowlisted origins', () => {
    process.env.NODE_ENV = 'development'
    process.env.CORS_ORIGINS = ''

    const response = middleware(buildRequest('https://dev-client.test'))

    expect(response.headers.get('Access-Control-Allow-Origin')).toBe('https://dev-client.test')
    expect(response.headers.get('Access-Control-Allow-Credentials')).toBeNull()
  })
})
