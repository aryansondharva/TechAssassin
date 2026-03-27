/**
 * GET /api/gamification/xp/history
 * 
 * Get user's XP transaction history with filtering and pagination
 * 
 * Requirements: 11.1, 11.2, 11.3, 11.4
 */

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuthWithClient } from '@/lib/middleware/auth';
import { handleApiError } from '@/lib/errors';
import { XPService, type XPSource } from '@/services/xp-service';

// Query parameter validation schema
const historyQuerySchema = z.object({
  source: z.enum([
    'event_participation',
    'code_contribution',
    'community_engagement',
    'challenge_completion',
    'helping_others',
    'profile_completion'
  ]).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  page: z.string().regex(/^\d+$/).transform(Number).default('1'),
  pageSize: z.string().regex(/^\d+$/).transform(Number).default('20')
});

/**
 * Get XP transaction history for authenticated user
 * Supports filtering by source and date range
 * Returns paginated results
 */
export async function GET(request: Request) {
  try {
    // Verify authentication
    const { user } = await requireAuthWithClient();
    
    // Parse and validate query parameters
    const { searchParams } = new URL(request.url);
    const queryParams = {
      source: searchParams.get('source') || undefined,
      startDate: searchParams.get('startDate') || undefined,
      endDate: searchParams.get('endDate') || undefined,
      page: searchParams.get('page') || '1',
      pageSize: searchParams.get('pageSize') || '20'
    };
    
    const validatedQuery = historyQuerySchema.parse(queryParams);
    
    // Get XP history using XP Service
    const xpService = new XPService();
    const history = await xpService.getXPHistory(user.id, {
      source: validatedQuery.source as XPSource | undefined,
      startDate: validatedQuery.startDate ? new Date(validatedQuery.startDate) : undefined,
      endDate: validatedQuery.endDate ? new Date(validatedQuery.endDate) : undefined,
      page: validatedQuery.page,
      pageSize: Math.min(validatedQuery.pageSize, 100) // Cap at 100 per page
    });
    
    return NextResponse.json(history);
  } catch (error) {
    return handleApiError(error);
  }
}
