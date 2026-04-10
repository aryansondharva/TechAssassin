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
  
  // Define allowed origins
  // TODO: Update these with your actual production domains
  const allowedOrigins = [
    // Production domains
    process.env.NEXT_PUBLIC_APP_URL,
    'https://tech-assassin.vercel.app',
    'https://www.tech-assassin.vercel.app',
    
    // Development domains
    'http://localhost:3000',
    'http://localhost:3001',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:3001',
  ].filter((o): o is string => !!o) // Remove any undefined values
  
  // Check if the request origin is in the allowed list
  const isAllowedOrigin = origin && allowedOrigins.includes(origin)
  
  // Handle preflight OPTIONS requests
  if (request.method === 'OPTIONS') {
    return new NextResponse(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': isAllowedOrigin ? origin : allowedOrigins[0],
        'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
        'Access-Control-Max-Age': '86400', // 24 hours
        'Access-Control-Allow-Credentials': 'true',
      },
    })
  }
  
  // Handle actual requests
  const response = NextResponse.next()
  
  // Set CORS headers for allowed origins
  if (isAllowedOrigin) {
    response.headers.set('Access-Control-Allow-Origin', origin)
    response.headers.set('Access-Control-Allow-Credentials', 'true')
  } else if (process.env.NODE_ENV === 'development') {
    // In development, allow all origins for easier testing
    response.headers.set('Access-Control-Allow-Origin', origin || '*')
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
