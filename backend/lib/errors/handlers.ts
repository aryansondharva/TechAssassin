import { NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { AuthenticationError, AuthorizationError } from '../middleware/auth'
import { PostgrestError } from '@supabase/supabase-js'

/**
 * Standard API error response format
 */
export interface ApiErrorResponse {
  error: string
  details?: any
  statusCode?: number
}

/**
 * Custom error class for not found errors
 */
export class NotFoundError extends Error {
  statusCode = 404
  
  constructor(message: string = 'Resource not found') {
    super(message)
    this.name = 'NotFoundError'
  }
}

/**
 * Custom error class for conflict errors (e.g., duplicate entries)
 */
export class ConflictError extends Error {
  statusCode = 409
  
  constructor(message: string = 'Resource conflict') {
    super(message)
    this.name = 'ConflictError'
  }
}

/**
 * Custom error class for rate limit errors
 */
export class RateLimitError extends Error {
  statusCode = 429
  
  constructor(message: string = 'Too many requests') {
    super(message)
    this.name = 'RateLimitError'
  }
}

/**
 * Custom error class for validation errors
 */
export class ValidationError extends Error {
  statusCode = 400
  details?: any
  
  constructor(message: string = 'Validation failed', details?: any) {
    super(message)
    this.name = 'ValidationError'
    this.details = details
  }
}

/**
 * Map errors to appropriate HTTP status codes
 * 
 * @param error - The error to map
 * @returns HTTP status code
 */
export function getStatusCode(error: unknown): number {
  // Handle custom error classes with statusCode property
  if (error && typeof error === 'object' && 'statusCode' in error) {
    return (error as any).statusCode
  }
  
  // Handle Zod validation errors
  if (error instanceof ZodError) {
    return 400
  }
  
  // Handle Supabase/Postgres errors
  if (isPostgrestError(error)) {
    // Unique constraint violation
    if (error.code === '23505') {
      return 409
    }
    // Foreign key violation
    if (error.code === '23503') {
      return 400
    }
    // Check constraint violation
    if (error.code === '23514') {
      return 400
    }
    // Not found
    if (error.code === 'PGRST116') {
      return 404
    }
  }
  
  // Handle standard Error instances
  if (error instanceof Error) {
    // Check error message for common patterns
    if (error.message.toLowerCase().includes('not found')) {
      return 404
    }
    if (error.message.toLowerCase().includes('unauthorized') || 
        error.message.toLowerCase().includes('authentication required')) {
      return 401
    }
    if (error.message.toLowerCase().includes('forbidden') || 
        error.message.toLowerCase().includes('insufficient permissions') ||
        error.message.toLowerCase().includes('admin access required')) {
      return 403
    }
    if (error.message.toLowerCase().includes('duplicate') || 
        error.message.toLowerCase().includes('already exists')) {
      return 409
    }
    if (error.message.toLowerCase().includes('rate limit')) {
      return 429
    }
  }
  
  // Default to 500 for unknown errors
  return 500
}

/**
 * Format error into consistent API response format
 * 
 * @param error - The error to format
 * @returns Formatted error response object
 */
export function formatErrorResponse(error: unknown): ApiErrorResponse {
  // Handle Zod validation errors
  if (error instanceof ZodError) {
    return {
      error: 'Validation failed',
      details: error.issues,
      statusCode: 400
    }
  }
  
  // Handle custom error classes
  if (error instanceof ValidationError) {
    return {
      error: error.message,
      details: error.details,
      statusCode: 400
    }
  }
  
  if (error instanceof AuthenticationError) {
    return {
      error: error.message,
      statusCode: 401
    }
  }
  
  if (error instanceof AuthorizationError) {
    return {
      error: error.message,
      statusCode: 403
    }
  }
  
  if (error instanceof NotFoundError) {
    return {
      error: error.message,
      statusCode: 404
    }
  }
  
  if (error instanceof ConflictError) {
    return {
      error: error.message,
      statusCode: 409
    }
  }
  
  if (error instanceof RateLimitError) {
    return {
      error: error.message,
      statusCode: 429
    }
  }
  
  // Handle Supabase/Postgres errors
  if (isPostgrestError(error)) {
    const statusCode = getStatusCode(error)
    let message = 'Database error'
    
    // Provide user-friendly messages for common errors
    if (error.code === '23505') {
      message = 'A record with this value already exists'
    } else if (error.code === '23503') {
      message = 'Invalid reference in data'
    } else if (error.code === '23514') {
      message = 'Data violates constraints'
    } else if (error.code === 'PGRST116') {
      message = 'Resource not found'
    }
    
    return {
      error: message,
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      statusCode
    }
  }
  
  // Handle standard Error instances
  if (error instanceof Error) {
    const statusCode = getStatusCode(error)
    
    // Don't expose internal error details in production for 500 errors
    if (statusCode === 500 && process.env.NODE_ENV === 'production') {
      return {
        error: 'Internal server error',
        statusCode: 500
      }
    }
    
    return {
      error: error.message,
      statusCode
    }
  }
  
  // Handle unknown error types
  return {
    error: 'An unexpected error occurred',
    statusCode: 500
  }
}

/**
 * Handle API errors and return appropriate NextResponse
 * This is the main error handler to use in API routes
 * 
 * @param error - The error to handle
 * @param logError - Whether to log the error (default: true)
 * @returns NextResponse with error details and appropriate status code
 * 
 * @example
 * ```typescript
 * export async function POST(request: Request) {
 *   try {
 *     // ... your logic
 *   } catch (error) {
 *     return handleApiError(error)
 *   }
 * }
 * ```
 */
export function handleApiError(error: unknown, logError: boolean = true): NextResponse {
  const errorResponse = formatErrorResponse(error)
  const statusCode = errorResponse.statusCode || 500
  
  // Log server errors (500) and unexpected errors
  if (logError && statusCode >= 500) {
    console.error('API Error:', error)
    
    // Log stack trace in development
    if (process.env.NODE_ENV === 'development' && error instanceof Error) {
      console.error('Stack trace:', error.stack)
    }
  }
  
  // Remove statusCode from response body (it's in the HTTP status)
  const { statusCode: _, ...responseBody } = errorResponse
  
  return NextResponse.json(responseBody, { status: statusCode })
}

/**
 * Type guard to check if error is a Postgrest error
 */
function isPostgrestError(error: unknown): error is PostgrestError {
  return (
    error !== null &&
    typeof error === 'object' &&
    'code' in error &&
    'message' in error &&
    'details' in error
  )
}

/**
 * Wrap async API route handlers with error handling
 * This higher-order function automatically catches and handles errors
 * 
 * @param handler - The async route handler function
 * @returns Wrapped handler with error handling
 * 
 * @example
 * ```typescript
 * export const POST = withErrorHandling(async (request: Request) => {
 *   const user = await requireAuth()
 *   // ... your logic
 *   return NextResponse.json(result)
 * })
 * ```
 */
export function withErrorHandling<T extends any[]>(
  handler: (...args: T) => Promise<NextResponse>
) {
  return async (...args: T): Promise<NextResponse> => {
    try {
      return await handler(...args)
    } catch (error) {
      return handleApiError(error)
    }
  }
}
