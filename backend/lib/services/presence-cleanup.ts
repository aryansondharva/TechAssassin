import { query } from '../db/postgres';

/**
 * Cleanup service for stale presence records
 * Marks users as offline if their last_seen timestamp is older than 1 hour
 * Validates Requirement 9.5
 */

const CLEANUP_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
const STALE_THRESHOLD_MS = 60 * 60 * 1000; // 1 hour

let cleanupIntervalId: NodeJS.Timeout | null = null;

/**
 * Cleans up stale presence records by marking users offline
 * if their last_seen timestamp is older than 1 hour
 */
export async function cleanupStalePresence(): Promise<number> {
  try {
    const oneHourAgo = new Date(Date.now() - STALE_THRESHOLD_MS);
    
    const result = await query(
      `UPDATE presence_tracking 
       SET status = 'offline' 
       WHERE last_seen < $1 AND status != 'offline'
       RETURNING user_id`,
      [oneHourAgo]
    );
    
    const cleanedCount = result.rowCount || 0;
    
    if (cleanedCount > 0) {
      console.log(`✅ Cleaned up ${cleanedCount} stale presence record(s)`);
    }
    
    return cleanedCount;
  } catch (error) {
    console.error('❌ Error cleaning up stale presence records:', error);
    throw error;
  }
}

/**
 * Starts the scheduled cleanup job that runs every 5 minutes
 */
export function startCleanupJob(): void {
  if (cleanupIntervalId) {
    console.warn('⚠️ Cleanup job is already running');
    return;
  }
  
  console.log('🚀 Starting presence cleanup job (runs every 5 minutes)');
  
  // Run immediately on start
  cleanupStalePresence().catch((error) => {
    console.error('❌ Initial cleanup failed:', error);
  });
  
  // Schedule recurring cleanup
  cleanupIntervalId = setInterval(() => {
    cleanupStalePresence().catch((error) => {
      console.error('❌ Scheduled cleanup failed:', error);
    });
  }, CLEANUP_INTERVAL_MS);
}

/**
 * Stops the scheduled cleanup job
 */
export function stopCleanupJob(): void {
  if (cleanupIntervalId) {
    clearInterval(cleanupIntervalId);
    cleanupIntervalId = null;
    console.log('🛑 Stopped presence cleanup job');
  } else {
    console.warn('⚠️ No cleanup job is currently running');
  }
}

/**
 * Checks if the cleanup job is currently running
 */
export function isCleanupJobRunning(): boolean {
  return cleanupIntervalId !== null;
}
