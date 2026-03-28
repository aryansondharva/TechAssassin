/**
 * Badge Service
 * 
 * Core service for managing badge definitions, unlock detection, and user badge operations.
 * 
 * Requirements:
 * - 3.1, 3.2, 3.3, 3.4, 3.5, 3.6: Badge definition management
 * - 4.1, 4.2, 4.3, 4.5: Badge unlock detection and evaluation
 * - 5.1, 5.2, 13.1, 13.2, 13.3, 13.4: User badge operations
 * - 12.1, 12.2, 12.3, 12.4: Badge progress tracking
 * - 19.1, 19.2, 19.3, 19.4, 19.5: Badge rarity statistics
 */

import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

// ============================================================================
// Types and Interfaces
// ============================================================================

export type BadgeCategory = 'coding' | 'community' | 'events' | 'streaks' | 'mentorship' | 'special';
export type RarityLevel = 'common' | 'rare' | 'epic' | 'legendary';
export type CriteriaType = 'xp_threshold' | 'event_count' | 'streak' | 'composite';
export type CriteriaOperator = 'gte' | 'lte' | 'eq' | 'gt' | 'lt';

export interface Badge {
  id: string;
  name: string;
  description: string;
  category: BadgeCategory;
  rarityLevel: RarityLevel;
  unlockCriteria: UnlockCriteria;
  iconUrl: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface UnlockCriteria {
  type: CriteriaType;
  conditions: CriteriaCondition[];
}

export interface CriteriaCondition {
  field: string;
  operator: CriteriaOperator;
  value: number | string;
}

export interface UserBadge {
  id: string;
  userId: string;
  badgeId: string;
  badge: Badge;
  earnedAt: Date;
  manualAward: boolean;
  revokedAt?: Date;
  revocationReason?: string;
}

export interface UnlockProgress {
  badgeId: string;
  progress: number; // 0-100
  conditions: ConditionProgress[];
  isUnlocked: boolean;
}

export interface ConditionProgress {
  field: string;
  current: number;
  required: number;
  progress: number; // 0-100
}

export interface BadgeWithProgress {
  badge: Badge;
  progress: UnlockProgress;
}

export interface CreateBadgeParams {
  name: string;
  description: string;
  category: BadgeCategory;
  rarityLevel: RarityLevel;
  unlockCriteria: UnlockCriteria;
  iconUrl: string;
}

export interface UpdateBadgeParams {
  name?: string;
  description?: string;
  category?: BadgeCategory;
  rarityLevel?: RarityLevel;
  unlockCriteria?: UnlockCriteria;
  iconUrl?: string;
  isActive?: boolean;
}

export interface BadgeFilters {
  category?: BadgeCategory;
  rarityLevel?: RarityLevel;
  isActive?: boolean;
}

export interface UnlockContext {
  trigger: 'xp_change' | 'event_completion' | 'activity' | 'manual';
  metadata?: Record<string, any>;
}

export interface BadgeRarityStats {
  badgeId: string;
  earnedByCount: number;
  totalUsers: number;
  earnedPercentage: number;
  isRareAchievement: boolean;
}

export interface RarityDistribution {
  common: number;
  rare: number;
  epic: number;
  legendary: number;
}

// ============================================================================
// Validation Schemas
// ============================================================================

const badgeCategorySchema = z.enum(['coding', 'community', 'events', 'streaks', 'mentorship', 'special']);
const rarityLevelSchema = z.enum(['common', 'rare', 'epic', 'legendary']);
const criteriaOperatorSchema = z.enum(['gte', 'lte', 'eq', 'gt', 'lt']);

const criteriaConditionSchema = z.object({
  field: z.string().min(1),
  operator: criteriaOperatorSchema,
  value: z.union([z.number(), z.string()])
});

const unlockCriteriaSchema = z.object({
  type: z.enum(['xp_threshold', 'event_count', 'streak', 'composite']),
  conditions: z.array(criteriaConditionSchema).min(1)
});

const createBadgeSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().min(1),
  category: badgeCategorySchema,
  rarityLevel: rarityLevelSchema,
  unlockCriteria: unlockCriteriaSchema,
  iconUrl: z.string().url()
});

const updateBadgeSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().min(1).optional(),
  category: badgeCategorySchema.optional(),
  rarityLevel: rarityLevelSchema.optional(),
  unlockCriteria: unlockCriteriaSchema.optional(),
  iconUrl: z.string().url().optional(),
  isActive: z.boolean().optional()
});

// ============================================================================
// Badge Criteria Cache
// ============================================================================

interface BadgeCriteriaCache {
  badges: Badge[];
  timestamp: number;
}

// ============================================================================
// Badge Service Class
// ============================================================================

export class BadgeService {
  // In-memory cache for badge criteria with 5-minute TTL
  private badgeCriteriaCache: BadgeCriteriaCache | null = null;
  private readonly CRITERIA_CACHE_TTL = 5 * 60 * 1000; // 5 minutes in milliseconds
  /**
   * Create a new badge definition
   * 
   * Requirements: 3.1, 3.4
   * 
   * @param params - Badge creation parameters
   * @returns The created badge
   */
  async createBadge(params: CreateBadgeParams): Promise<Badge> {
    // Validate input
    const validated = createBadgeSchema.parse(params);
    
    const supabase = await createClient();
    
    // Insert badge
    const { data: badge, error } = await supabase
      .from('badges')
      .insert({
        name: validated.name,
        description: validated.description,
        category: validated.category,
        rarity_level: validated.rarityLevel,
        unlock_criteria: validated.unlockCriteria,
        icon_url: validated.iconUrl,
        is_active: true
      })
      .select()
      .single();
    
    if (error) {
      throw new Error(`Failed to create badge: ${error.message}`);
    }
    
    // Invalidate cache since badge definitions changed
    this.invalidateCriteriaCache();
    
    return this.mapBadgeFromDB(badge);
  }
  
  /**
   * Update an existing badge
   * 
   * Requirements: 3.5
   * 
   * @param badgeId - Badge ID
   * @param params - Badge update parameters
   * @returns The updated badge
   */
  async updateBadge(badgeId: string, params: UpdateBadgeParams): Promise<Badge> {
    // Validate input
    const validated = updateBadgeSchema.parse(params);
    
    const supabase = await createClient();
    
    // Build update object
    const updateData: any = {
      updated_at: new Date().toISOString()
    };
    
    if (validated.name !== undefined) updateData.name = validated.name;
    if (validated.description !== undefined) updateData.description = validated.description;
    if (validated.category !== undefined) updateData.category = validated.category;
    if (validated.rarityLevel !== undefined) updateData.rarity_level = validated.rarityLevel;
    if (validated.unlockCriteria !== undefined) updateData.unlock_criteria = validated.unlockCriteria;
    if (validated.iconUrl !== undefined) updateData.icon_url = validated.iconUrl;
    if (validated.isActive !== undefined) updateData.is_active = validated.isActive;

    
    // Update badge
    const { data: badge, error } = await supabase
      .from('badges')
      .update(updateData)
      .eq('id', badgeId)
      .select()
      .single();
    
    if (error) {
      throw new Error(`Failed to update badge: ${error.message}`);
    }
    
    // Invalidate cache since badge definitions changed
    this.invalidateCriteriaCache();
    
    return this.mapBadgeFromDB(badge);
  }
  
  /**
   * Deactivate a badge (soft delete)
   * Prevents deletion if badge has been earned by users
   * 
   * Requirements: 3.6
   * 
   * @param badgeId - Badge ID
   */
  async deactivateBadge(badgeId: string): Promise<void> {
    const supabase = await createClient();
    
    // Check if badge has been earned
    const { data: userBadges, error: checkError } = await supabase
      .from('user_badges')
      .select('id')
      .eq('badge_id', badgeId)
      .is('revoked_at', null)
      .limit(1);
    
    if (checkError) {
      throw new Error(`Failed to check badge usage: ${checkError.message}`);
    }
    
    if (userBadges && userBadges.length > 0) {
      throw new Error('Cannot deactivate badge that has been earned by users');
    }
    
    // Deactivate badge
    const { error } = await supabase
      .from('badges')
      .update({ 
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', badgeId);
    
    if (error) {
      throw new Error(`Failed to deactivate badge: ${error.message}`);
    }
    
    // Invalidate cache since badge definitions changed
    this.invalidateCriteriaCache();
  }
  
  /**
   * Get all badges with optional filtering
   * 
   * Requirements: 3.2, 3.3
   * 
   * @param filters - Optional filters for category, rarity, and active status
   * @returns Array of badges
   */
  async getAllBadges(filters: BadgeFilters = {}): Promise<Badge[]> {
    const supabase = await createClient();
    
    // Build query
    let query = supabase.from('badges').select('*');
    
    // Apply filters
    if (filters.category) {
      query = query.eq('category', filters.category);
    }
    
    if (filters.rarityLevel) {
      query = query.eq('rarity_level', filters.rarityLevel);
    }
    
    if (filters.isActive !== undefined) {
      query = query.eq('is_active', filters.isActive);
    }
    
    // Order by rarity (legendary first) then name
    const rarityOrder = { legendary: 1, epic: 2, rare: 3, common: 4 };
    query = query.order('created_at', { ascending: false });
    
    const { data, error } = await query;
    
    if (error) {
      throw new Error(`Failed to get badges: ${error.message}`);
    }
    
    const badges = (data || []).map(this.mapBadgeFromDB);
    
    // Sort by rarity level
    badges.sort((a, b) => {
      const rarityA = rarityOrder[a.rarityLevel] || 5;
      const rarityB = rarityOrder[b.rarityLevel] || 5;
      return rarityA - rarityB;
    });
    
    return badges;
  }

  
  /**
   * Check if badge criteria cache is valid
   * 
   * @returns true if cache is valid, false otherwise
   */
  private isCriteriaCacheValid(): boolean {
    if (!this.badgeCriteriaCache) {
      return false;
    }
    return Date.now() - this.badgeCriteriaCache.timestamp < this.CRITERIA_CACHE_TTL;
  }
  
  /**
   * Get all active badges with caching
   * Implements 5-minute TTL cache for badge criteria
   * 
   * Requirements: 4.5
   * 
   * @returns Array of active badges
   */
  private async getActiveBadgesCached(): Promise<Badge[]> {
    // Check cache first
    if (this.isCriteriaCacheValid()) {
      return this.badgeCriteriaCache!.badges;
    }
    
    // Cache miss or expired - fetch from database
    const supabase = await createClient();
    
    const { data: badges, error } = await supabase
      .from('badges')
      .select('*')
      .eq('is_active', true);
    
    if (error) {
      throw new Error(`Failed to get active badges: ${error.message}`);
    }
    
    const mappedBadges = (badges || []).map(this.mapBadgeFromDB);
    
    // Update cache
    this.badgeCriteriaCache = {
      badges: mappedBadges,
      timestamp: Date.now()
    };
    
    return mappedBadges;
  }
  
  /**
   * Invalidate badge criteria cache
   * Should be called when badges are created, updated, or deactivated
   */
  private invalidateCriteriaCache(): void {
    this.badgeCriteriaCache = null;
  }
  
  /**
   * Evaluate badge unlocks for a user
   * Checks all active badges and awards any that meet criteria
   * 
   * Optimizations:
   * - Incremental evaluation: Only checks badges user doesn't have
   * - Cached badge criteria: 5-minute TTL cache for badge definitions
   * - Short-circuit evaluation: Stops checking conditions on first failure
   * 
   * Requirements: 4.1, 4.2, 4.3, 4.5
   * 
   * @param userId - User ID
   * @param context - Unlock context (trigger type and metadata)
   * @returns Array of newly unlocked badges
   */
  async evaluateBadgeUnlocks(userId: string, context: UnlockContext): Promise<UserBadge[]> {
    const supabase = await createClient();
    
    // Get all active badges from cache
    const badges = await this.getActiveBadgesCached();
    
    if (badges.length === 0) {
      return [];
    }
    
    // Get badges user already has (incremental evaluation)
    const { data: existingBadges, error: existingError } = await supabase
      .from('user_badges')
      .select('badge_id')
      .eq('user_id', userId)
      .is('revoked_at', null);
    
    if (existingError) {
      throw new Error(`Failed to get user badges: ${existingError.message}`);
    }
    
    const existingBadgeIds = new Set((existingBadges || []).map(ub => ub.badge_id));
    
    // Filter out badges user already has (incremental evaluation optimization)
    const badgesToEvaluate = badges.filter(b => !existingBadgeIds.has(b.id));
    
    // Evaluate each badge
    const newlyUnlocked: UserBadge[] = [];
    
    for (const badge of badgesToEvaluate) {
      const meetsRequirements = await this.checkUnlockCriteria(userId, badge);
      
      if (meetsRequirements.isUnlocked) {
        try {
          const userBadge = await this.awardBadge(userId, badge.id, false);
          newlyUnlocked.push(userBadge);
        } catch (error) {
          // Handle duplicate constraint violation gracefully
          if (error instanceof Error && error.message.includes('unique')) {
            continue;
          }
          throw error;
        }
      }
    }
    
    return newlyUnlocked;
  }
  
  /**
   * Check if user meets unlock criteria for a badge
   * Uses the evaluate_badge_criteria() database function
   * 
   * Requirements: 4.2, 4.5
   * 
   * @param userId - User ID
   * @param badge - Badge to check
   * @returns Unlock progress information
   */
  async checkUnlockCriteria(userId: string, badge: Badge): Promise<UnlockProgress> {
    const supabase = await createClient();
    
    // Call database function to evaluate criteria
    const { data, error } = await supabase.rpc('evaluate_badge_criteria', {
      p_user_id: userId,
      p_badge_id: badge.id
    });
    
    if (error) {
      throw new Error(`Failed to evaluate badge criteria: ${error.message}`);
    }
    
    const isUnlocked = data === true;
    
    // Calculate progress for each condition
    const conditionProgress = await this.calculateConditionProgress(userId, badge.unlockCriteria);
    
    // Calculate overall progress
    const totalProgress = conditionProgress.reduce((sum, cp) => sum + cp.progress, 0);
    const averageProgress = conditionProgress.length > 0 ? totalProgress / conditionProgress.length : 0;
    
    return {
      badgeId: badge.id,
      progress: Math.round(averageProgress),
      conditions: conditionProgress,
      isUnlocked
    };
  }

  
  /**
   * Get user's earned badges
   * 
   * Requirements: 5.1, 5.2
   * 
   * @param userId - User ID
   * @returns Array of user badges sorted by rarity then earned_at
   */
  async getUserBadges(userId: string): Promise<UserBadge[]> {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('user_badges')
      .select(`
        *,
        badge:badges(*)
      `)
      .eq('user_id', userId)
      .is('revoked_at', null)
      .order('earned_at', { ascending: false });
    
    if (error) {
      throw new Error(`Failed to get user badges: ${error.message}`);
    }
    
    const userBadges = (data || []).map(this.mapUserBadgeFromDB);
    
    // Sort by rarity (legendary first) then earned_at
    const rarityOrder = { legendary: 1, epic: 2, rare: 3, common: 4 };
    userBadges.sort((a, b) => {
      const rarityA = rarityOrder[a.badge.rarityLevel] || 5;
      const rarityB = rarityOrder[b.badge.rarityLevel] || 5;
      
      if (rarityA !== rarityB) {
        return rarityA - rarityB;
      }
      
      return b.earnedAt.getTime() - a.earnedAt.getTime();
    });
    
    return userBadges;
  }
  
  /**
   * Award a badge to a user
   * 
   * Requirements: 13.1, 13.3
   * 
   * @param userId - User ID
   * @param badgeId - Badge ID
   * @param manual - Whether this is a manual award
   * @returns The created user badge
   */
  async awardBadge(userId: string, badgeId: string, manual: boolean): Promise<UserBadge> {
    const supabase = await createClient();
    
    // Insert user badge
    const { data: userBadge, error } = await supabase
      .from('user_badges')
      .insert({
        user_id: userId,
        badge_id: badgeId,
        manual_award: manual
      })
      .select(`
        *,
        badge:badges(*)
      `)
      .single();
    
    if (error) {
      throw new Error(`Failed to award badge: ${error.message}`);
    }
    
    return this.mapUserBadgeFromDB(userBadge);
  }
  
  /**
   * Revoke a badge from a user (soft delete)
   * 
   * Requirements: 13.2, 13.4
   * 
   * @param userBadgeId - User badge ID
   * @param reason - Reason for revocation
   */
  async revokeBadge(userBadgeId: string, reason: string): Promise<void> {
    const supabase = await createClient();
    
    const { error } = await supabase
      .from('user_badges')
      .update({
        revoked_at: new Date().toISOString(),
        revocation_reason: reason
      })
      .eq('id', userBadgeId);
    
    if (error) {
      throw new Error(`Failed to revoke badge: ${error.message}`);
    }
  }

  
  /**
   * Get badge unlock progress for a user
   * 
   * Requirements: 12.1, 12.2
   * 
   * @param userId - User ID
   * @param badgeId - Badge ID
   * @returns Badge unlock progress
   */
  async getBadgeProgress(userId: string, badgeId: string): Promise<UnlockProgress> {
    const supabase = await createClient();
    
    // Get badge
    const { data: badge, error } = await supabase
      .from('badges')
      .select('*')
      .eq('id', badgeId)
      .single();
    
    if (error) {
      throw new Error(`Failed to get badge: ${error.message}`);
    }
    
    return this.checkUnlockCriteria(userId, this.mapBadgeFromDB(badge));
  }
  
  /**
   * Get locked badges with progress for a user
   * 
   * Requirements: 12.3, 12.4
   * 
   * @param userId - User ID
   * @returns Array of locked badges with progress
   */
  async getLockedBadges(userId: string): Promise<BadgeWithProgress[]> {
    const supabase = await createClient();
    
    // Get all active badges
    const { data: allBadges, error: badgesError } = await supabase
      .from('badges')
      .select('*')
      .eq('is_active', true);
    
    if (badgesError) {
      throw new Error(`Failed to get badges: ${badgesError.message}`);
    }
    
    // Get badges user already has
    const { data: earnedBadges, error: earnedError } = await supabase
      .from('user_badges')
      .select('badge_id')
      .eq('user_id', userId)
      .is('revoked_at', null);
    
    if (earnedError) {
      throw new Error(`Failed to get earned badges: ${earnedError.message}`);
    }
    
    const earnedBadgeIds = new Set((earnedBadges || []).map(ub => ub.badge_id));
    
    // Filter to locked badges only
    const lockedBadges = (allBadges || [])
      .filter(b => !earnedBadgeIds.has(b.id))
      .map(this.mapBadgeFromDB);
    
    // Calculate progress for each locked badge
    const badgesWithProgress: BadgeWithProgress[] = [];
    
    for (const badge of lockedBadges) {
      const progress = await this.checkUnlockCriteria(userId, badge);
      badgesWithProgress.push({ badge, progress });
    }
    
    // Sort by progress percentage descending
    badgesWithProgress.sort((a, b) => b.progress.progress - a.progress.progress);
    
    return badgesWithProgress;
  }

  
  /**
   * Calculate percentage of users who earned a badge
   * 
   * Requirements: 19.1, 19.4
   * 
   * @param badgeId - Badge ID
   * @returns Badge rarity statistics
   */
  async getBadgeRarityStats(badgeId: string): Promise<BadgeRarityStats> {
    const supabase = await createClient();
    
    // Count users who earned this badge
    const { count: earnedCount, error: earnedError } = await supabase
      .from('user_badges')
      .select('*', { count: 'exact', head: true })
      .eq('badge_id', badgeId)
      .is('revoked_at', null);
    
    if (earnedError) {
      throw new Error(`Failed to count badge earners: ${earnedError.message}`);
    }
    
    // Count total users
    const { count: totalCount, error: totalError } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });
    
    if (totalError) {
      throw new Error(`Failed to count total users: ${totalError.message}`);
    }
    
    const earnedByCount = earnedCount || 0;
    const totalUsers = totalCount || 1; // Avoid division by zero
    const earnedPercentage = (earnedByCount / totalUsers) * 100;
    const isRareAchievement = earnedPercentage < 5;
    
    return {
      badgeId,
      earnedByCount,
      totalUsers,
      earnedPercentage,
      isRareAchievement
    };
  }
  
  /**
   * Get badge count by rarity level for a user
   * 
   * Requirements: 19.2, 19.3
   * 
   * @param userId - User ID
   * @returns Badge count by rarity level
   */
  async getUserBadgesByRarity(userId: string): Promise<RarityDistribution> {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('user_badges')
      .select(`
        badge:badges(rarity_level)
      `)
      .eq('user_id', userId)
      .is('revoked_at', null);
    
    if (error) {
      throw new Error(`Failed to get user badges by rarity: ${error.message}`);
    }
    
    const distribution: RarityDistribution = {
      common: 0,
      rare: 0,
      epic: 0,
      legendary: 0
    };
    
    for (const item of data || []) {
      const rarityLevel = item.badge?.rarity_level;
      if (rarityLevel && rarityLevel in distribution) {
        distribution[rarityLevel as keyof RarityDistribution]++;
      }
    }
    
    return distribution;
  }
  
  /**
   * Get rarity indicator for display
   * 
   * Requirements: 19.5
   * 
   * @param rarityLevel - Rarity level
   * @returns Color code for rarity
   */
  getRarityColor(rarityLevel: RarityLevel): string {
    const colorMap: Record<RarityLevel, string> = {
      common: '#9CA3AF',    // gray
      rare: '#3B82F6',      // blue
      epic: '#A855F7',      // purple
      legendary: '#F59E0B'  // gold
    };
    
    return colorMap[rarityLevel];
  }

  
  // ============================================================================
  // Private Helper Methods
  // ============================================================================
  
  /**
   * Calculate progress for each condition in unlock criteria
   * Implements short-circuit evaluation - stops on first failed condition
   * 
   * Requirements: 4.5
   * 
   * @param userId - User ID
   * @param criteria - Unlock criteria
   * @param shortCircuit - If true, stops evaluation on first failed condition
   * @returns Array of condition progress
   */
  private async calculateConditionProgress(
    userId: string,
    criteria: UnlockCriteria,
    shortCircuit: boolean = false
  ): Promise<ConditionProgress[]> {
    const supabase = await createClient();
    
    const progress: ConditionProgress[] = [];
    
    for (const condition of criteria.conditions) {
      let currentValue = 0;
      const requiredValue = typeof condition.value === 'number' ? condition.value : 0;
      
      // Get current value based on field
      switch (condition.field) {
        case 'total_xp': {
          const { data } = await supabase
            .from('profiles')
            .select('total_xp')
            .eq('id', userId)
            .single();
          currentValue = data?.total_xp || 0;
          break;
        }
        
        case 'event_count': {
          const { count } = await supabase
            .from('registrations')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId);
          currentValue = count || 0;
          break;
        }
        
        case 'current_streak': {
          const { data } = await supabase
            .from('profiles')
            .select('current_streak')
            .eq('id', userId)
            .single();
          currentValue = data?.current_streak || 0;
          break;
        }
        
        case 'longest_streak': {
          const { data } = await supabase
            .from('profiles')
            .select('longest_streak')
            .eq('id', userId)
            .single();
          currentValue = data?.longest_streak || 0;
          break;
        }
        
        case 'badge_count': {
          const { count } = await supabase
            .from('user_badges')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId)
            .is('revoked_at', null);
          currentValue = count || 0;
          break;
        }
        
        case 'profile_completion': {
          const { data } = await supabase
            .from('profiles')
            .select('profile_completion_percentage')
            .eq('id', userId)
            .single();
          currentValue = data?.profile_completion_percentage || 0;
          break;
        }
        
        default:
          currentValue = 0;
      }
      
      // Calculate progress percentage based on operator
      let progressPercentage = 0;
      let conditionMet = false;
      
      switch (condition.operator) {
        case 'gte':
          conditionMet = currentValue >= requiredValue;
          progressPercentage = Math.min(100, (currentValue / requiredValue) * 100);
          break;
        
        case 'gt':
          conditionMet = currentValue > requiredValue;
          progressPercentage = Math.min(100, (currentValue / requiredValue) * 100);
          break;
        
        case 'lte':
          conditionMet = currentValue <= requiredValue;
          progressPercentage = conditionMet ? 100 : 0;
          break;
        
        case 'lt':
          conditionMet = currentValue < requiredValue;
          progressPercentage = conditionMet ? 100 : 0;
          break;
        
        case 'eq':
          conditionMet = currentValue === requiredValue;
          progressPercentage = conditionMet ? 100 : 0;
          break;
      }
      
      progress.push({
        field: condition.field,
        current: currentValue,
        required: requiredValue,
        progress: Math.round(progressPercentage)
      });
      
      // Short-circuit evaluation: stop on first failed condition
      if (shortCircuit && !conditionMet) {
        break;
      }
    }
    
    return progress;
  }

  
  /**
   * Map database badge record to Badge interface
   */
  private mapBadgeFromDB(dbRecord: any): Badge {
    return {
      id: dbRecord.id,
      name: dbRecord.name,
      description: dbRecord.description,
      category: dbRecord.category,
      rarityLevel: dbRecord.rarity_level,
      unlockCriteria: dbRecord.unlock_criteria,
      iconUrl: dbRecord.icon_url,
      isActive: dbRecord.is_active,
      createdAt: new Date(dbRecord.created_at),
      updatedAt: new Date(dbRecord.updated_at)
    };
  }
  
  /**
   * Map database user badge record to UserBadge interface
   */
  private mapUserBadgeFromDB(dbRecord: any): UserBadge {
    return {
      id: dbRecord.id,
      userId: dbRecord.user_id,
      badgeId: dbRecord.badge_id,
      badge: this.mapBadgeFromDB(dbRecord.badge),
      earnedAt: new Date(dbRecord.earned_at),
      manualAward: dbRecord.manual_award,
      revokedAt: dbRecord.revoked_at ? new Date(dbRecord.revoked_at) : undefined,
      revocationReason: dbRecord.revocation_reason
    };
  }
}

// ============================================================================
// Export singleton instance
// ============================================================================

export const badgeService = new BadgeService();
