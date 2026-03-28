/**
 * GET /api/gamification/badges
 * 
 * Get all badges with optional filtering
 * Public route (no auth required)
 * 
 * Requirements: 3.1, 3.2, 3.3
 */

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { handleApiError } from '@/lib/errors';
import { BadgeService, type BadgeCategory, type RarityLevel } from '@/services/badge-service';

// Query parameter validation schema
const badgeQuerySchema = z.object({
  category: z.enum(['coding', 'community', 'events', 'streaks', 'mentorship', 'special']).optional(),
  rarity: z.enum(['common', 'rare', 'epic', 'legendary']).optional(),
  isActive: z.enum(['true', 'false']).transform(val => val === 'true').optional()
});

/**
 * Get all badges with optional filtering
 * Supports filtering by category, rarity, and active status
 * Returns all matching badges
 */
export async function GET(request: Request) {
  try {
    // Parse and validate query parameters
    const { searchParams } = new URL(request.url);
    const queryParams = {
      category: searchParams.get('category') || undefined,
      rarity: searchParams.get('rarity') || undefined,
      isActive: searchParams.get('isActive') || undefined
    };
    
    const validatedQuery = badgeQuerySchema.parse(queryParams);
    
    // Get badges using Badge Service
    const badgeService = new BadgeService();
    const badges = await badgeService.getAllBadges({
      category: validatedQuery.category as BadgeCategory | undefined,
      rarityLevel: validatedQuery.rarity as RarityLevel | undefined,
      isActive: validatedQuery.isActive
    });
    
    return NextResponse.json(badges);
  } catch (error) {
    return handleApiError(error);
  }
}
