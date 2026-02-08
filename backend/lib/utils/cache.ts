/**
 * Simple in-memory cache implementation for frequently accessed data
 * Requirements: 13.4
 * 
 * This cache is suitable for serverless environments where each function
 * instance maintains its own cache. For multi-instance deployments,
 * consider using Redis or similar distributed cache.
 */

interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number
}

class SimpleCache {
  private cache: Map<string, CacheEntry<any>>
  private defaultTTL: number

  constructor(defaultTTL: number = 60000) { // Default 60 seconds
    this.cache = new Map()
    this.defaultTTL = defaultTTL
  }

  /**
   * Get cached data if it exists and hasn't expired
   * 
   * @param key - Cache key
   * @returns Cached data or null if not found or expired
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key)
    
    if (!entry) {
      return null
    }
    
    const now = Date.now()
    const age = now - entry.timestamp
    
    // Check if entry has expired
    if (age > entry.ttl) {
      this.cache.delete(key)
      return null
    }
    
    return entry.data as T
  }

  /**
   * Set cached data with optional TTL
   * 
   * @param key - Cache key
   * @param data - Data to cache
   * @param ttl - Time to live in milliseconds (optional, uses default if not provided)
   */
  set<T>(key: string, data: T, ttl?: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL
    })
  }

  /**
   * Invalidate a specific cache entry
   * 
   * @param key - Cache key to invalidate
   */
  invalidate(key: string): void {
    this.cache.delete(key)
  }

  /**
   * Invalidate all cache entries matching a pattern
   * 
   * @param pattern - String pattern to match (simple string contains check)
   */
  invalidatePattern(pattern: string): void {
    const keysToDelete: string[] = []
    
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        keysToDelete.push(key)
      }
    }
    
    keysToDelete.forEach(key => this.cache.delete(key))
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear()
  }

  /**
   * Get cache statistics
   * 
   * @returns Object with cache size and entry count
   */
  getStats(): { size: number; entries: number } {
    return {
      size: this.cache.size,
      entries: this.cache.size
    }
  }

  /**
   * Clean up expired entries
   * This should be called periodically to prevent memory leaks
   */
  cleanup(): void {
    const now = Date.now()
    const keysToDelete: string[] = []
    
    for (const [key, entry] of this.cache.entries()) {
      const age = now - entry.timestamp
      if (age > entry.ttl) {
        keysToDelete.push(key)
      }
    }
    
    keysToDelete.forEach(key => this.cache.delete(key))
  }
}

// Create singleton cache instance
// Different TTLs for different data types
export const cache = new SimpleCache(60000) // 60 seconds default

// Cache key generators for consistency
export const CacheKeys = {
  sponsors: () => 'sponsors:list',
  events: (status?: string, page?: number, limit?: number) => 
    `events:list:${status || 'all'}:${page || 1}:${limit || 20}`,
  event: (id: string) => `event:${id}`,
  leaderboard: (eventId: string) => `leaderboard:${eventId}`,
  resources: (category?: string, page?: number, limit?: number) =>
    `resources:list:${category || 'all'}:${page || 1}:${limit || 20}`
}

// Cache TTL configurations (in milliseconds)
export const CacheTTL = {
  sponsors: 5 * 60 * 1000,      // 5 minutes - sponsors rarely change
  events: 2 * 60 * 1000,        // 2 minutes - events change occasionally
  leaderboard: 30 * 1000,       // 30 seconds - leaderboard updates frequently
  resources: 5 * 60 * 1000,     // 5 minutes - resources rarely change
  profile: 1 * 60 * 1000        // 1 minute - profiles change occasionally
}

// Periodic cleanup (run every 5 minutes)
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    cache.cleanup()
  }, 5 * 60 * 1000)
}

/**
 * Helper function to get or set cached data
 * 
 * @param key - Cache key
 * @param fetcher - Function to fetch data if not cached
 * @param ttl - Time to live in milliseconds
 * @returns Cached or freshly fetched data
 */
export async function getCached<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl?: number
): Promise<T> {
  // Try to get from cache
  const cached = cache.get<T>(key)
  if (cached !== null) {
    return cached
  }
  
  // Fetch fresh data
  const data = await fetcher()
  
  // Store in cache
  cache.set(key, data, ttl)
  
  return data
}
