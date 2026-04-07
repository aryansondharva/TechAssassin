/**
 * Next.js Instrumentation File
 * 
 * This file is automatically loaded by Next.js when the server starts.
 * It's the ideal place to initialize background jobs and services.
 * 
 * @see https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */

import { startCleanupJob } from './lib/services/presence-cleanup';

export async function register() {
  // Only run on the server side
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    console.log('🚀 Initializing server-side services...');
    
    // Start the presence cleanup job
    // This will mark users as offline if their last_seen > 1 hour
    // Runs every 5 minutes
    startCleanupJob();
    
    console.log('✅ Server-side services initialized');
  }
}
