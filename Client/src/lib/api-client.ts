/**
 * API Client for TechAssassin Backend
 * 
 * This module provides a centralized HTTP client for making requests to the backend API.
 * It handles authentication, error handling, and request/response formatting.
 */

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
const DEBUG = import.meta.env.VITE_DEBUG === 'true';

/**
 * API Error class for structured error handling
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public data?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Request options interface
 */
interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean>;
}

/**
 * Get authentication token from Clerk session
 */
async function getAuthToken(): Promise<string | null> {
  if (typeof window !== 'undefined' && (window as any).Clerk && (window as any).Clerk.session) {
    try {
      return await (window as any).Clerk.session.getToken();
    } catch (e) {
      console.warn("Failed to get Clerk token", e);
      return null;
    }
  }
  return null;
}

/**
 * Empty placeholders to prevent existing code from breaking
 */
export function setAuthToken(token: string): void {}
export function clearAuthToken(): void {}

/**
 * Build URL with query parameters
 */
function buildUrl(endpoint: string, params?: Record<string, string | number | boolean>): string {
  const url = new URL(`${API_URL}${endpoint}`);
  
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, String(value));
    });
  }
  
  return url.toString();
}

/**
 * Make HTTP request to the API
 */
async function request<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { params, headers = {}, ...fetchOptions } = options;
  
  // Build URL with query parameters
  const url = buildUrl(endpoint, params);
  
  // Set default headers
  const defaultHeaders: HeadersInit = {
    'Content-Type': 'application/json',
  };
  
  // Add authentication token if available
  const token = await getAuthToken();
  if (token) {
    defaultHeaders['Authorization'] = `Bearer ${token}`;
  }
  
  // Merge headers
  const mergedHeaders = { ...defaultHeaders, ...headers };
  
  // Log request in debug mode
  if (DEBUG) {
    console.log(`[API] ${fetchOptions.method || 'GET'} ${url}`);
    if (fetchOptions.body) {
      console.log('[API] Request body:', fetchOptions.body);
    }
  }
  
  try {
    const response = await fetch(url, {
      ...fetchOptions,
      headers: mergedHeaders,
    });
    
    // Parse response
    const contentType = response.headers.get('content-type');
    const isJson = contentType?.includes('application/json');
    const data = isJson ? await response.json() : await response.text();
    
    // Log response in debug mode
    if (DEBUG) {
      console.log(`[API] Response ${response.status}:`, data);
    }
    
    // Handle errors
    if (!response.ok) {
      const errorMessage = isJson && data.error 
        ? data.error 
        : `Request failed with status ${response.status}`;
      
      throw new ApiError(errorMessage, response.status, data);
    }
    
    return data as T;
  } catch (error) {
    // Re-throw ApiError as-is
    if (error instanceof ApiError) {
      throw error;
    }
    
    // Handle network errors
    if (error instanceof TypeError) {
      throw new ApiError('Network error: Unable to connect to the server', 0);
    }
    
    // Handle other errors
    throw new ApiError(
      error instanceof Error ? error.message : 'An unknown error occurred',
      0
    );
  }
}

/**
 * HTTP methods
 */
export const api = {
  /**
   * GET request
   */
  get: <T>(endpoint: string, params?: Record<string, string | number | boolean>) =>
    request<T>(endpoint, { method: 'GET', params }),
  
  /**
   * POST request
   */
  post: <T>(endpoint: string, data?: any) =>
    request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    }),
  
  /**
   * PATCH request
   */
  patch: <T>(endpoint: string, data?: any) =>
    request<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    }),
  
  /**
   * PUT request
   */
  put: <T>(endpoint: string, data?: any) =>
    request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    }),
  
  /**
   * DELETE request
   */
  delete: <T>(endpoint: string) =>
    request<T>(endpoint, { method: 'DELETE' }),
  
  /**
   * Upload file (multipart/form-data)
   */
  upload: async <T>(endpoint: string, file: File, fieldName: string = 'file'): Promise<T> => {
    const formData = new FormData();
    formData.append(fieldName, file);
    
    const token = await getAuthToken();
    const headers: HeadersInit = {};
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const url = buildUrl(endpoint);
    
    if (DEBUG) {
      console.log(`[API] POST ${url} (file upload)`);
    }
    
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: formData,
    });
    
    const data = await response.json();
    
    if (DEBUG) {
      console.log(`[API] Response ${response.status}:`, data);
    }
    
    if (!response.ok) {
      throw new ApiError(
        data.error || `Upload failed with status ${response.status}`,
        response.status,
        data
      );
    }
    
    return data as T;
  },
};

/**
 * Export API URL for direct use if needed
 */
export { API_URL };
