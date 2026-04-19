/**
 * Error handling utilities for TechAssassin backend
 * 
 * This module provides:
 * - Custom error classes for different HTTP status codes
 * - Error formatting and response generation
 * - Centralized error handling for API routes
 * 
 * @module errors
 */

export {
  // Error classes
  NotFoundError,
  ConflictError,
  RateLimitError,
  ValidationError,
  
  // Error handling functions
  handleApiError,
  formatErrorResponse,
  getStatusCode,
  withErrorHandling,
  
  // Types
  type ApiErrorResponse
} from './handlers'

// Re-export auth errors for convenience
export {
  AuthenticationError,
  AuthorizationError
} from '@/lib/middleware/auth'
