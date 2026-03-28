/**
 * POST /api/gamification/admin/xp/sources
 * 
 * Admin endpoint for updating XP source configuration.
 * 
 * Requirements: 2.1, 2.2, 2.4, 2.5
 */

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdminAuth, logAdminAction } from '@/middleware/admin-auth';
import { handleApiError } from '@/lib/errors';
import { xpService, type XPSource } from '@/services/xp-service';

// Validation schema
const updateXPSourceSchema = z.object({
  source: z.enum([
    'event_participation',
    'code_contribution',
    'community_engagement',
    'challenge_completion',
    'helping_others',
    'profile_completion'
  ]),
  baseAmount: z.number().int().positive().optional(),
  multipliers: z.record(z.number()).optional(),
  cooldownSeconds: z.number().int().min(0).optional(),
  maxPerHour: z.number().int().positive().optional()
});

/**
 * POST handler for updating XP source configuration
 */
export async function POST(request: Request) {
  try {
    // Verify admin authentication
    const { adminId } = await requireAdminAuth();
    
    // Parse and validate request body
    const body = await request.json();
    const validated = updateXPSourceSchema.parse(body);
    
    // Get current config for comparison
    const currentConfig = await xpService.getXPSourceConfig(validated.source);
    
    // Update XP source configuration
    const updatedConfig = await xpService.updateXPSourceConfig(
      validated.source,
      {
        baseAmount: validated.baseAmount,
        multipliers: validated.multipliers,
        cooldownSeconds: validated.cooldownSeconds,
        maxPerHour: validated.maxPerHour
      }
    );
    
    // Log configuration change
    await logAdminAction(adminId, 'xp_source_config_update', {
      source: validated.source,
      previous_config: currentConfig,
      new_config: updatedConfig
    });
    
    return NextResponse.json({
      success: true,
      config: updatedConfig
    });
  } catch (error) {
    return handleApiError(error);
  }
}
