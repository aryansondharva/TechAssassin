import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * CORS Middleware for TechAssassin Backend API
 * 
 * This middleware handles Cross-Origin Resource Sharing (CORS) for all API routes.
 * It allows requests from specified origins and handles preflight OPTIONS requests.
 * 
 * Configuration:
 * - Update allowedOrigins array with your production and development domains
 * - Adjust allowed methods and headers as needed
 * - Configure in next.config.mjs if additional customization needed
 */

export function middleware(request: NextRequest) {
  // Get origin from request headers
  const origin = request.headers.get('origin')
  const isDev = process.env.NODE_ENV === 'development'
  
  // Define allowed origins from environment
  const envOrigins =
    process.env.CORS_ORIGINS?.split(',').map((value) => value.trim()).filter(Boolean) ?? []

  const allowedOrigins = Array.from(
    new Set(
      [process.env.NEXT_PUBLIC_APP_URL, ...envOrigins].filter((originValue): originValue is string =>
        Boolean(originValue)
      )
    )
  )
  
  // Check if the request origin is in the allowed list
  const isAllowedOrigin = origin && allowedOrigins.includes(origin)
  const allowOriginHeader = isAllowedOrigin ? origin : isDev ? origin || '*' : undefined
  
  // Handle preflight OPTIONS requests
  if (request.method === 'OPTIONS') {
    return new NextResponse(null, {
      status: 200,
      headers: {
        ...(allowOriginHeader ? { 'Access-Control-Allow-Origin': allowOriginHeader } : {}),
        'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
        'Access-Control-Max-Age': '86400', // 24 hours
        ...(isAllowedOrigin ? { 'Access-Control-Allow-Credentials': 'true' } : {}),
      },
    })
  }
  
  // Handle actual requests
  const response = NextResponse.next()
  
  if (allowOriginHeader) {
    response.headers.set('Access-Control-Allow-Origin', allowOriginHeader)
  }

  // Set CORS headers for allowed origins
  if (isAllowedOrigin) {
    response.headers.set('Access-Control-Allow-Credentials', 'true')
  }
  
  // Set other CORS headers
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With')
  
  return response
}

/**
 * Configure which routes use this middleware
 * 
 * This configuration applies the middleware to all API routes.
 * Adjust the matcher pattern if you need different behavior for specific routes.
 */
export const config = {
  matcher: '/:path*',
}
