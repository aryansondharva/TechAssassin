/**
 * Leaderboard Cache Service
 * 
 * Manages in-memory caching for leaderboard data with TTL and invalidation
 * 
 * Requirements: 10.3
 */

interface CacheEntry {
  data: any[];
  timestamp: number;
}

class LeaderboardCacheService {
  private cache: Map<string, CacheEntry> = new Map();
  private readonly CACHE_TTL = 60 * 1000; // 60 seconds in milliseconds
  private readonly SIGNIFICANT_XP_THRESHOLD = 100; // XP change threshold for cache invalidation
  
  /**
   * Check if cache entry is still valid
   */
  private isCacheValid(entry: CacheEntry): boolean {
    return Date.now() - entry.timestamp < this.CACHE_TTL;
  }
  
  /**
   * Get cached leaderboard data
   */
  get(period: string, limit: number): any[] | null {
    const cacheKey = `leaderboard:${period}:${limit}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && this.isCacheValid(cached)) {
      return cached.data;
    }
    
    // Cache miss or expired
    if (cached) {
      this.cache.delete(cacheKey);
    }
    
    return null;
  }
  
  /**
   * Set cached leaderboard data
   */
  set(period: string, limit: number, data: any[]): void {
    const cacheKey = `leaderboard:${period}:${limit}`;
    this.cache.set(cacheKey, {
      data,
      timestamp: Date.now()
    });
  }
  
  /**
   * Invalidate cache for specific period or all periods
   */
  invalidate(period?: string): void {
    if (period) {
      // Invalidate specific period
      for (const key of this.cache.keys()) {
        if (key.includes(`:${period}:`)) {
          this.cache.delete(key);
        }
      }
    } else {
      // Invalidate all
      this.cache.clear();
    }
  }
  
  /**
   * Invalidate cache if XP change is significant
   * Called after XP transactions to maintain leaderboard freshness
   */
  invalidateOnXPChange(xpAmount: number): void {
    if (Math.abs(xpAmount) >= this.SIGNIFICANT_XP_THRESHOLD) {
      // Significant XP change - invalidate all leaderboard caches
      this.invalidate();
    }
  }
  
  /**
   * Manual cache refresh for admins
   * Clears all cached data to force fresh fetch
   */
  manualRefresh(): void {
    this.invalidate();
  }
  
  /**
   * Get cache statistics for monitoring
   */
  getStats(): {
    size: number;
    keys: string[];
    oldestEntry: number | null;
    newestEntry: number | null;
  } {
    const entries = Array.from(this.cache.entries());
    const timestamps = entries.map(([_, entry]) => entry.timestamp);
    
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
      oldestEntry: timestamps.length > 0 ? Math.min(...timestamps) : null,
      newestEntry: timestamps.length > 0 ? Math.max(...timestamps) : null
    };
  }
  
  /**
   * Clean up expired cache entries
   * Should be called periodically to prevent memory leaks
   */
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp >= this.CACHE_TTL) {
        this.cache.delete(key);
      }
    }
  }
}

// Singleton instance
export const leaderboardCache = new LeaderboardCacheService();

// Set up periodic cleanup (every 5 minutes)
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    leaderboardCache.cleanup();
  }, 5 * 60 * 1000);
}
