/**
 * Rank Service
 * 
 * Core service for managing rank tiers and user rank progression.
 * 
 * Requirements:
 * - 6.1, 6.2, 6.3, 6.4, 6.5, 6.6: Rank calculation and user rank progression
 * - 7.1, 7.2, 7.3, 7.4, 7.5: Rank progress visualization
 * - 15.1, 15.2, 15.3, 15.4, 15.5: Rank tier configuration
 */

import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

// ============================================================================
// Types and Interfaces
// ============================================================================

export interface RankTier {
  id: string;
  name: string;
  minimumXpThreshold: number;
  rankOrder: number;
  iconUrl: string;
  perks: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateRankTierParams {
  name: string;
  minimumXpThreshold: number;
  rankOrder: number;
  iconUrl: string;
  perks?: Record<string, any>;
}

export interface UpdateRankTierParams {
  name?: string;
  minimumXpThreshold?: number;
  rankOrder?: number;
  iconUrl?: string;
  perks?: Record<string, any>;
}

export interface RankChangeResult {
  previousRank: RankTier | null;
  currentRank: RankTier | null;
  rankUp: boolean;
  notificationSent: boolean;
}

export interface RankHistoryEntry {
  id: string;
  userId: string;
  rankId: string;
  rank: RankTier;
  achievedAt: Date;
}

export interface RankProgress {
  currentRank: RankTier | null;
  nextRank: RankTier | null;
  currentXP: number;
  xpForNextRank: number;
  progressPercentage: number;
  isMaxRank: boolean;
}

// ============================================================================
// Validation Schemas
// ============================================================================

const createRankTierSchema = z.object({
  name: z.string().min(1).max(100),
  minimumXpThreshold: z.number().int().min(0),
  rankOrder: z.number().int().positive(),
  iconUrl: z.string().url(),
  perks: z.record(z.any()).optional()
});

const updateRankTierSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  minimumXpThreshold: z.number().int().min(0).optional(),
  rankOrder: z.number().int().positive().optional(),
  iconUrl: z.string().url().optional(),
  perks: z.record(z.any()).optional()
});

// ============================================================================
// Rank Service Class
// ============================================================================

export class RankService {
  /**
   * Create a new rank tier
   * 
   * Requirements: 15.1
   * 
   * @param params - Rank tier creation parameters
   * @returns The created rank tier
   */
  async createRankTier(params: CreateRankTierParams): Promise<RankTier> {
    // Validate input
    const validated = createRankTierSchema.parse(params);
    
    const supabase = await createClient();
    
    // Validate unique and ascending minimum_xp_threshold
    await this.validateXpThresholds(validated.minimumXpThreshold);
    
    // Insert rank tier
    const { data: rankTier, error } = await supabase
      .from('rank_tiers')
      .insert({
        name: validated.name,
        minimum_xp_threshold: validated.minimumXpThreshold,
        rank_order: validated.rankOrder,
        icon_url: validated.iconUrl,
        perks: validated.perks || {}
      })
      .select()
      .single();
    
    if (error) {
      throw new Error(`Failed to create rank tier: ${error.message}`);
    }
    
    return this.mapRankTierFromDB(rankTier);
  }
  
  /**
   * Update an existing rank tier
   * 
   * Requirements: 15.1, 15.3
   * 
   * @param rankId - Rank tier ID
   * @param params - Rank tier update parameters
   * @returns The updated rank tier
   */
  async updateRankTier(rankId: string, params: UpdateRankTierParams): Promise<RankTier> {
    // Validate input
    const validated = updateRankTierSchema.parse(params);
    
    const supabase = await createClient();
    
    // Validate unique and ascending minimum_xp_threshold if being updated
    if (validated.minimumXpThreshold !== undefined) {
      await this.validateXpThresholds(validated.minimumXpThreshold, rankId);
    }
    
    // Build update object
    const updateData: any = {
      updated_at: new Date().toISOString()
    };
    
    if (validated.name !== undefined) updateData.name = validated.name;
    if (validated.minimumXpThreshold !== undefined) {
      updateData.minimum_xp_threshold = validated.minimumXpThreshold;
    }
    if (validated.rankOrder !== undefined) updateData.rank_order = validated.rankOrder;
    if (validated.iconUrl !== undefined) updateData.icon_url = validated.iconUrl;
    if (validated.perks !== undefined) updateData.perks = validated.perks;
    
    // Update rank tier
    const { data: rankTier, error } = await supabase
      .from('rank_tiers')
      .update(updateData)
      .eq('id', rankId)
      .select()
      .single();
    
    if (error) {
      throw new Error(`Failed to update rank tier: ${error.message}`);
    }
    
    return this.mapRankTierFromDB(rankTier);
  }
  
  /**
   * Get all rank tiers sorted by rank_order
   * 
   * Requirements: 15.1
   * 
   * @returns Array of rank tiers sorted by rank_order
   */
  async getAllRankTiers(): Promise<RankTier[]> {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('rank_tiers')
      .select('*')
      .order('rank_order', { ascending: true });
    
    if (error) {
      throw new Error(`Failed to get rank tiers: ${error.message}`);
    }
    
    return (data || []).map(this.mapRankTierFromDB);
  }
  
  /**
   * Reorder rank tiers
   * 
   * Requirements: 15.1
   * 
   * @param rankIds - Array of rank IDs in desired order
   */
  async reorderRankTiers(rankIds: string[]): Promise<void> {
    const supabase = await createClient();
    
    // Update rank_order for each rank tier
    for (let i = 0; i < rankIds.length; i++) {
      const { error } = await supabase
        .from('rank_tiers')
        .update({ 
          rank_order: i + 1,
          updated_at: new Date().toISOString()
        })
        .eq('id', rankIds[i]);
      
      if (error) {
        throw new Error(`Failed to reorder rank tiers: ${error.message}`);
      }
    }
  }
  
  /**
   * Calculate the highest qualifying rank for a user based on their total XP
   * 
   * Requirements: 6.2, 6.3
   * 
   * @param userId - User ID
   * @returns The highest qualifying rank tier or null if no rank qualifies
   */
  async calculateUserRank(userId: string): Promise<RankTier | null> {
    const supabase = await createClient();
    
    // Get user's total XP
    const { data: user, error: userError } = await supabase
      .from('profiles')
      .select('total_xp')
      .eq('id', userId)
      .single();
    
    if (userError) {
      throw new Error(`Failed to get user profile: ${userError.message}`);
    }
    
    if (!user) {
      return null;
    }
    
    const totalXP = user.total_xp || 0;
    
    // Find highest qualifying rank
    const { data: rank, error: rankError } = await supabase
      .from('rank_tiers')
      .select('*')
      .lte('minimum_xp_threshold', totalXP)
      .order('minimum_xp_threshold', { ascending: false })
      .limit(1)
      .single();
    
    if (rankError) {
      if (rankError.code === 'PGRST116') {
        // No rows returned - user doesn't qualify for any rank yet
        return null;
      }
      throw new Error(`Failed to calculate user rank: ${rankError.message}`);
    }
    
    return rank ? this.mapRankTierFromDB(rank) : null;
  }
  
  /**
   * Update user's rank and detect rank changes
   * Note: This is primarily for manual recalculation as the database trigger
   * handles automatic updates when total_xp changes
   * 
   * Requirements: 6.2, 6.3, 6.4
   * 
   * @param userId - User ID
   * @returns Rank change result with previous and current ranks
   */
  async updateUserRank(userId: string): Promise<RankChangeResult> {
    const supabase = await createClient();
    
    // Get user's current rank
    const { data: user, error: userError } = await supabase
      .from('profiles')
      .select('current_rank_id, total_xp')
      .eq('id', userId)
      .single();
    
    if (userError) {
      throw new Error(`Failed to get user profile: ${userError.message}`);
    }
    
    const previousRankId = user?.current_rank_id;
    
    // Calculate new rank
    const newRank = await this.calculateUserRank(userId);
    const newRankId = newRank?.id || null;
    
    // Check if rank changed
    const rankChanged = previousRankId !== newRankId;
    const rankUp = rankChanged && newRank !== null;
    
    // Get previous rank details if it exists
    let previousRank: RankTier | null = null;
    if (previousRankId) {
      const { data: prevRankData } = await supabase
        .from('rank_tiers')
        .select('*')
        .eq('id', previousRankId)
        .single();
      
      if (prevRankData) {
        previousRank = this.mapRankTierFromDB(prevRankData);
      }
    }
    
    // Update user's rank if changed
    if (rankChanged) {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ current_rank_id: newRankId })
        .eq('id', userId);
      
      if (updateError) {
        throw new Error(`Failed to update user rank: ${updateError.message}`);
      }
      
      // Record rank history if new rank exists
      if (newRankId) {
        const { error: historyError } = await supabase
          .from('user_ranks_history')
          .insert({
            user_id: userId,
            rank_id: newRankId
          });
        
        if (historyError) {
          // Log error but don't fail the operation
          console.error('Failed to record rank history:', historyError);
        }
      }
    }
    
    return {
      previousRank,
      currentRank: newRank,
      rankUp,
      notificationSent: false // Notification handling would be done by caller
    };
  }
  
  /**
   * Get user's rank history sorted by achieved_at descending
   * 
   * Requirements: 6.6
   * 
   * @param userId - User ID
   * @returns Array of rank history entries
   */
  async getUserRankHistory(userId: string): Promise<RankHistoryEntry[]> {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('user_ranks_history')
      .select(`
        *,
        rank:rank_tiers(*)
      `)
      .eq('user_id', userId)
      .order('achieved_at', { ascending: false });
    
    if (error) {
      throw new Error(`Failed to get user rank history: ${error.message}`);
    }
    
    return (data || []).map(this.mapRankHistoryFromDB);
  }
  
  /**
   * Get user's rank progress showing progress to next rank
   * 
   * Requirements: 7.1, 7.2, 7.3, 7.4, 7.5
   * 
   * @param userId - User ID
   * @returns Rank progress information
   */
  async getRankProgress(userId: string): Promise<RankProgress> {
    const supabase = await createClient();
    
    // Get user's current XP and rank
    const { data: user, error: userError } = await supabase
      .from('profiles')
      .select(`
        total_xp,
        current_rank_id,
        current_rank:rank_tiers(*)
      `)
      .eq('id', userId)
      .single();
    
    if (userError) {
      throw new Error(`Failed to get user profile: ${userError.message}`);
    }
    
    const currentXP = user?.total_xp || 0;
    const currentRank = user?.current_rank ? this.mapRankTierFromDB(user.current_rank) : null;
    
    // Get next rank (lowest rank with threshold > current XP)
    const { data: nextRankData, error: nextRankError } = await supabase
      .from('rank_tiers')
      .select('*')
      .gt('minimum_xp_threshold', currentXP)
      .order('minimum_xp_threshold', { ascending: true })
      .limit(1)
      .single();
    
    // Handle case where there's no next rank (max rank reached)
    if (nextRankError && nextRankError.code === 'PGRST116') {
      return {
        currentRank,
        nextRank: null,
        currentXP,
        xpForNextRank: 0,
        progressPercentage: 100,
        isMaxRank: true
      };
    }
    
    if (nextRankError) {
      throw new Error(`Failed to get next rank: ${nextRankError.message}`);
    }
    
    const nextRank = nextRankData ? this.mapRankTierFromDB(nextRankData) : null;
    
    if (!nextRank) {
      // Max rank reached
      return {
        currentRank,
        nextRank: null,
        currentXP,
        xpForNextRank: 0,
        progressPercentage: 100,
        isMaxRank: true
      };
    }
    
    // Calculate progress
    const currentRankThreshold = currentRank?.minimumXpThreshold || 0;
    const nextRankThreshold = nextRank.minimumXpThreshold;
    const xpInCurrentRank = currentXP - currentRankThreshold;
    const xpNeededForNextRank = nextRankThreshold - currentRankThreshold;
    const progressPercentage = xpNeededForNextRank > 0
      ? Math.floor((xpInCurrentRank / xpNeededForNextRank) * 100)
      : 0;
    
    return {
      currentRank,
      nextRank,
      currentXP,
      xpForNextRank: nextRankThreshold - currentXP,
      progressPercentage: Math.max(0, Math.min(100, progressPercentage)),
      isMaxRank: false
    };
  }
  
  // ============================================================================
  // Private Helper Methods
  // ============================================================================
  
  /**
   * Validate that minimum_xp_threshold is unique and ascending
   * 
   * Requirements: 15.3
   * 
   * @param threshold - XP threshold to validate
   * @param excludeRankId - Rank ID to exclude from validation (for updates)
   */
  private async validateXpThresholds(threshold: number, excludeRankId?: string): Promise<void> {
    const supabase = await createClient();
    
    // Check for duplicate threshold
    let query = supabase
      .from('rank_tiers')
      .select('id')
      .eq('minimum_xp_threshold', threshold);
    
    if (excludeRankId) {
      query = query.neq('id', excludeRankId);
    }
    
    const { data, error } = await query;
    
    if (error) {
      throw new Error(`Failed to validate XP thresholds: ${error.message}`);
    }
    
    if (data && data.length > 0) {
      throw new Error(`XP threshold ${threshold} is already in use by another rank`);
    }
  }
  
  /**
   * Map database rank tier record to RankTier interface
   */
  private mapRankTierFromDB(dbRecord: any): RankTier {
    return {
      id: dbRecord.id,
      name: dbRecord.name,
      minimumXpThreshold: dbRecord.minimum_xp_threshold,
      rankOrder: dbRecord.rank_order,
      iconUrl: dbRecord.icon_url,
      perks: dbRecord.perks || {},
      createdAt: new Date(dbRecord.created_at),
      updatedAt: new Date(dbRecord.updated_at)
    };
  }
  
  /**
   * Map database rank history record to RankHistoryEntry interface
   */
  private mapRankHistoryFromDB(dbRecord: any): RankHistoryEntry {
    return {
      id: dbRecord.id,
      userId: dbRecord.user_id,
      rankId: dbRecord.rank_id,
      rank: this.mapRankTierFromDB(dbRecord.rank),
      achievedAt: new Date(dbRecord.achieved_at)
    };
  }
}

// ============================================================================
// Export singleton instance
// ============================================================================

export const rankService = new RankService();
