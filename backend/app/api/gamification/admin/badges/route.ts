/**
 * POST /api/gamification/admin/badges
 * 
 * Admin endpoint for creating new badge definitions.
 * 
 * Requirements: 3.5
 */

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdminAuth, logAdminAction } from '@/middleware/admin-auth';
import { handleApiError } from '@/lib/errors';
import { badgeService } from '@/services/badge-service';

// Validation schema
const criteriaConditionSchema = z.object({
  field: z.string().min(1),
  operator: z.enum(['gte', 'lte', 'eq', 'gt', 'lt']),
  value: z.union([z.number(), z.string()])
});

const unlockCriteriaSchema = z.object({
  type: z.enum(['xp_threshold', 'event_count', 'streak', 'composite']),
  conditions: z.array(criteriaConditionSchema).min(1)
});

const createBadgeSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().min(1),
  category: z.enum(['coding', 'community', 'events', 'streaks', 'mentorship', 'special']),
  rarityLevel: z.enum(['common', 'rare', 'epic', 'legendary']),
  unlockCriteria: unlockCriteriaSchema,
  iconUrl: z.string().url()
});

/**
 * POST handler for creating a new badge
 */
export async function POST(request: Request) {
  try {
    // Verify admin authentication
    const { adminId } = await requireAdminAuth();
    
    // Parse and validate request body
    const body = await request.json();
    const validated = createBadgeSchema.parse(body);
    
    // Create badge
    const badge = await badgeService.createBadge({
      name: validated.name,
      description: validated.description,
      category: validated.category,
      rarityLevel: validated.rarityLevel,
      unlockCriteria: validated.unlockCriteria,
      iconUrl: validated.iconUrl
    });
    
    // Log admin action
    await logAdminAction(adminId, 'badge_created', {
      badge_id: badge.id,
      badge_name: badge.name,
      category: badge.category,
      rarity_level: badge.rarityLevel
    });
    
    return NextResponse.json({
      success: true,
      badge
    });
  } catch (error) {
    return handleApiError(error);
  }
}
