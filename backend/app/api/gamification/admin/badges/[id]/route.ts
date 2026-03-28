/**
 * PUT /api/gamification/admin/badges/:id
 * DELETE /api/gamification/admin/badges/:id
 * 
 * Admin endpoints for updating and deactivating badge definitions.
 * 
 * Requirements: 3.5, 3.6
 */

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdminAuth, logAdminAction } from '@/middleware/admin-auth';
import { handleApiError } from '@/lib/errors';
import { badgeService } from '@/services/badge-service';

// Validation schema for update
const criteriaConditionSchema = z.object({
  field: z.string().min(1),
  operator: z.enum(['gte', 'lte', 'eq', 'gt', 'lt']),
  value: z.union([z.number(), z.string()])
});

const unlockCriteriaSchema = z.object({
  type: z.enum(['xp_threshold', 'event_count', 'streak', 'composite']),
  conditions: z.array(criteriaConditionSchema).min(1)
});

const updateBadgeSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().min(1).optional(),
  category: z.enum(['coding', 'community', 'events', 'streaks', 'mentorship', 'special']).optional(),
  rarityLevel: z.enum(['common', 'rare', 'epic', 'legendary']).optional(),
  unlockCriteria: unlockCriteriaSchema.optional(),
  iconUrl: z.string().url().optional(),
  isActive: z.boolean().optional()
});

/**
 * PUT handler for updating a badge
 */
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Verify admin authentication
    const { adminId } = await requireAdminAuth();
    
    const badgeId = params.id;
    
    // Parse and validate request body
    const body = await request.json();
    const validated = updateBadgeSchema.parse(body);
    
    // Update badge
    const badge = await badgeService.updateBadge(badgeId, {
      name: validated.name,
      description: validated.description,
      category: validated.category,
      rarityLevel: validated.rarityLevel,
      unlockCriteria: validated.unlockCriteria,
      iconUrl: validated.iconUrl,
      isActive: validated.isActive
    });
    
    // Log badge modification
    await logAdminAction(adminId, 'badge_updated', {
      badge_id: badgeId,
      badge_name: badge.name,
      updates: validated
    });
    
    return NextResponse.json({
      success: true,
      badge
    });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * DELETE handler for deactivating a badge (soft delete)
 */
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Verify admin authentication
    const { adminId } = await requireAdminAuth();
    
    const badgeId = params.id;
    
    // Deactivate badge (prevents deletion if badge has been earned)
    await badgeService.deactivateBadge(badgeId);
    
    // Log admin action
    await logAdminAction(adminId, 'badge_deactivated', {
      badge_id: badgeId
    });
    
    return NextResponse.json({
      success: true,
      message: 'Badge deactivated successfully'
    });
  } catch (error) {
    return handleApiError(error);
  }
}
