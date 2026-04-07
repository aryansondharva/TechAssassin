/**
 * POST /api/gamification/xp/award
 * 
 * Award XP to a user (internal/admin use only)
 * 
 * Requirements: 1.1, 1.4
 */

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuthWithClient, requireAdmin } from '@/lib/middleware/auth';
import { handleApiError } from '@/lib/errors';
import { XPService } from '@/services/xp-service';

// Request validation schema
const awardXPRequestSchema = z.object({
  userId: z.string().uuid('Invalid user ID format'),
  amount: z.number().int().positive('Amount must be a positive integer'),
  source: z.enum([
    'event_participation',
    'code_contribution',
    'community_engagement',
    'challenge_completion',
    'helping_others',
    'profile_completion'
  ]),
  activityType: z.string().min(1, 'Activity type is required').max(100),
  referenceId: z.string().uuid().optional(),
  description: z.string().min(1, 'Description is required'),
  metadata: z.record(z.any()).optional()
});

/**
 * Award XP to a user
 * Restricted to internal/admin use only
 */
export async function POST(request: Request) {
  try {
    // Verify authentication
    const { user } = await requireAuthWithClient();
    
    // Verify admin privileges
    await requireAdmin(user.id);
    
    // Parse and validate request body
    const body = await request.json();
    const validatedData = awardXPRequestSchema.parse(body);
    
    // Award XP using XP Service
    const xpService = new XPService();
    const transaction = await xpService.awardXP({
      userId: validatedData.userId,
      amount: validatedData.amount,
      source: validatedData.source,
      activityType: validatedData.activityType,
      referenceId: validatedData.referenceId,
      description: validatedData.description,
      metadata: validatedData.metadata
    });
    
    return NextResponse.json(transaction, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
