import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Combined Clerk and CORS Middleware for TechAssassin Backend API
 * 
 * This middleware:
 * 1. Enables Clerk authentication detection
 * 2. Handles Cross-Origin Resource Sharing (CORS) for all API routes
 */

const applyCorsHeaders = (
  response: NextResponse,
  origin: string | null,
  isDev: boolean,
  allowedOrigins: string[]
) => {
  const isAllowedOrigin = origin && allowedOrigins.includes(origin)
  const allowOriginHeader = isAllowedOrigin ? origin : isDev ? origin || '*' : undefined

  if (allowOriginHeader) {
    response.headers.set('Access-Control-Allow-Origin', allowOriginHeader)
  }

  if (isAllowedOrigin) {
    response.headers.set('Access-Control-Allow-Credentials', 'true')
  }

  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With')

  return response
}

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

  // Handle preflight OPTIONS requests
  if (request.method === 'OPTIONS') {
   return applyCorsHeaders(new NextResponse(null, {
     status: 200,
     headers: {
       'Access-Control-Max-Age': '86400', // 24 hours
     },
   }), origin, isDev, allowedOrigins)
  }
  
  // Handle actual requests
  return applyCorsHeaders(NextResponse.next(), origin, isDev, allowedOrigins)
}

/**
 * Configure which routes use this middleware
 */
export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}

export default middleware
