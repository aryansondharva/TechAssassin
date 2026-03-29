/**
 * XP Service
 * 
 * Core service for managing XP transactions, rate limiting, and fraud detection.
 * 
 * Requirements:
 * - 1.1, 1.2, 1.4, 1.5, 1.6: XP transaction tracking
 * - 2.1, 2.2, 2.3, 2.4, 2.5: XP source configuration management
 * - 11.1, 11.2, 11.3, 11.4, 11.5: XP history retrieval and filtering
 * - 14.1, 14.2, 14.3, 14.4, 14.5: Manual XP adjustments
 * - 20.1, 20.2, 20.3, 20.4, 20.5: Rate limiting and fraud detection
 */

import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';
import { leaderboardCache } from './leaderboard-cache-service';
import { streakService } from './streak-service';

// ============================================================================
// Types and Interfaces
// ============================================================================

export type XPSource = 
  | 'event_participation'
  | 'code_contribution'
  | 'community_engagement'
  | 'challenge_completion'
  | 'helping_others'
  | 'profile_completion';

export interface XPTransaction {
  id: string;
  userId: string;
  amount: number;
  source: XPSource;
  activityType: string;
  referenceId?: string;
  description: string;
  manualAdjustment: boolean;
  metadata?: Record<string, any>;
  createdAt: Date;
}

export interface AwardXPParams {
  userId: string;
  amount: number;
  source: XPSource;
  activityType: string;
  referenceId?: string;
  description: string;
  metadata?: Record<string, any>;
}

export interface XPSourceConfig {
  id: string;
  source: XPSource;
  baseAmount: number;
  multipliers: Record<string, number>;
  cooldownSeconds: number;
  maxPerHour: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface XPHistoryFilters {
  source?: XPSource;
  startDate?: Date;
  endDate?: Date;
  page: number;
  pageSize: number;
}

export interface PaginatedXPTransactions {
  transactions: XPTransaction[];
  totalCount: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface ManualAdjustmentParams {
  userId: string;
  amount: number;
  source: XPSource;
  activityType: string;
  description: string;
  reason: string;
  adminId: string;
}

export interface RateLimitResult {
  allowed: boolean;
  remainingQuota: number;
  resetAt: Date;
  reason?: string;
}

export interface XPSummary {
  daily: number;
  weekly: number;
  monthly: number;
}

// ============================================================================
// Validation Schemas
// ============================================================================

const xpSourceSchema = z.enum([
  'event_participation',
  'code_contribution',
  'community_engagement',
  'challenge_completion',
  'helping_others',
  'profile_completion'
]);

const awardXPSchema = z.object({
  userId: z.string().uuid(),
  amount: z.number().int().positive(),
  source: xpSourceSchema,
  activityType: z.string().min(1).max(100),
  referenceId: z.string().uuid().optional(),
  description: z.string().min(1),
  metadata: z.record(z.any()).optional()
});

const manualAdjustmentSchema = z.object({
  userId: z.string().uuid(),
  amount: z.number().int().refine(val => val !== 0, { message: "Amount cannot be zero" }),
  source: xpSourceSchema,
  activityType: z.string().min(1).max(100),
  description: z.string().min(1),
  reason: z.string().min(1),
  adminId: z.string().uuid()
});

// ============================================================================
// XP Service Class
// ============================================================================

export class XPService {
  /**
   * Award XP to a user
   * 
   * Requirements: 1.1, 1.2, 1.4, 1.5, 1.6
   * 
   * @param params - Parameters for awarding XP
   * @returns The created XP transaction
   */
  async awardXP(params: AwardXPParams): Promise<XPTransaction> {
    // Validate input
    const validated = awardXPSchema.parse(params);
    
    const supabase = await createClient();
    
    // Check rate limit
    const rateLimitCheck = await this.checkRateLimit(validated.userId, validated.source);
    if (!rateLimitCheck.allowed) {
      throw new Error(`Rate limit exceeded: ${rateLimitCheck.reason}`);
    }
    
    // Check cooldown if reference_id is provided
    if (validated.referenceId) {
      const cooldownActive = await this.checkCooldown(
        validated.userId,
        validated.activityType,
        validated.referenceId
      );
      if (cooldownActive) {
        throw new Error('Activity is on cooldown');
      }
    }
    
    // Get source configuration to apply multipliers
    const sourceConfig = await this.getXPSourceConfig(validated.source);
    let finalAmount = validated.amount;
    
    // Apply multipliers if present in metadata
    if (validated.metadata && sourceConfig) {
      for (const [key, value] of Object.entries(validated.metadata)) {
        if (sourceConfig.multipliers[key]) {
          finalAmount = Math.floor(finalAmount * sourceConfig.multipliers[key]);
        }
      }
    }
    
    // Apply streak multiplier (Requirements: 18.5)
    const streakInfo = await streakService.getStreakInfo(validated.userId);
    if (streakInfo.streakMultiplier > 1.0) {
      finalAmount = Math.floor(finalAmount * streakInfo.streakMultiplier);
    }
    
    // Create XP transaction
    const { data: transaction, error } = await supabase
      .from('xp_transactions')
      .insert({
        user_id: validated.userId,
        amount: finalAmount,
        source: validated.source,
        activity_type: validated.activityType,
        reference_id: validated.referenceId,
        description: validated.description,
        manual_adjustment: false,
        metadata: validated.metadata || {}
      })
      .select()
      .single();
    
    if (error) {
      throw new Error(`Failed to create XP transaction: ${error.message}`);
    }
    
    // Record XP award for rate limiting
    await this.recordXPAward(validated.userId, validated.source, finalAmount);
    
    // Track user activity for streak (Requirements: 18.1, 18.2, 18.3, 18.4)
    await streakService.trackActivity(validated.userId);
    
    // Invalidate leaderboard cache if XP change is significant (>100 XP)
    leaderboardCache.invalidateOnXPChange(finalAmount);
    
    // Set cooldown if reference_id is provided and source has cooldown
    if (validated.referenceId && sourceConfig && sourceConfig.cooldownSeconds > 0) {
      await this.setCooldown(
        validated.userId,
        validated.activityType,
        validated.referenceId,
        sourceConfig.cooldownSeconds
      );
    }
    
    return this.mapTransactionFromDB(transaction);
  }
  
  /**
   * Get user's total XP
   * 
   * Requirements: 1.2
   * 
   * @param userId - User ID
   * @returns Total XP amount
   */
  async getUserTotalXP(userId: string): Promise<number> {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('profiles')
      .select('total_xp')
      .eq('id', userId)
      .single();
    
    if (error) {
      throw new Error(`Failed to get user total XP: ${error.message}`);
    }
    
    return data?.total_xp || 0;
  }
  
  /**
   * Get user's XP transaction history with pagination and filtering
   * 
   * Requirements: 1.6, 11.1, 11.2, 11.3, 11.4
   * 
   * @param userId - User ID
   * @param filters - Filtering and pagination options
   * @returns Paginated XP transactions
   */
  async getXPHistory(
    userId: string,
    filters: XPHistoryFilters
  ): Promise<PaginatedXPTransactions> {
    const supabase = await createClient();
    
    // Build query
    let query = supabase
      .from('xp_transactions')
      .select('*', { count: 'exact' })
      .eq('user_id', userId);
    
    // Apply filters
    if (filters.source) {
      query = query.eq('source', filters.source);
    }
    
    if (filters.startDate) {
      query = query.gte('created_at', filters.startDate.toISOString());
    }
    
    if (filters.endDate) {
      query = query.lte('created_at', filters.endDate.toISOString());
    }
    
    // Apply pagination
    const offset = (filters.page - 1) * filters.pageSize;
    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + filters.pageSize - 1);
    
    const { data, error, count } = await query;
    
    if (error) {
      throw new Error(`Failed to get XP history: ${error.message}`);
    }
    
    const totalCount = count || 0;
    const transactions = (data || []).map(this.mapTransactionFromDB);
    
    return {
      transactions,
      totalCount,
      page: filters.page,
      pageSize: filters.pageSize,
      hasMore: offset + filters.pageSize < totalCount
    };
  }

  /**
   * Get XP source configuration
   * 
   * Requirements: 2.1
   * 
   * @param source - XP source type
   * @returns Source configuration or null if not found
   */
  async getXPSourceConfig(source: XPSource): Promise<XPSourceConfig | null> {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('xp_source_config')
      .select('*')
      .eq('source', source)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned
        return null;
      }
      throw new Error(`Failed to get XP source config: ${error.message}`);
    }
    
    return this.mapSourceConfigFromDB(data);
  }
  
  /**
   * Update XP source configuration
   * 
   * Requirements: 2.2, 2.3, 2.4, 2.5
   * 
   * @param source - XP source type
   * @param config - Updated configuration
   */
  async updateXPSourceConfig(
    source: XPSource,
    config: Partial<Omit<XPSourceConfig, 'id' | 'source' | 'createdAt' | 'updatedAt'>>
  ): Promise<XPSourceConfig> {
    const supabase = await createClient();
    
    const updateData: any = {
      updated_at: new Date().toISOString()
    };
    
    if (config.baseAmount !== undefined) {
      updateData.base_amount = config.baseAmount;
    }
    if (config.multipliers !== undefined) {
      updateData.multipliers = config.multipliers;
    }
    if (config.cooldownSeconds !== undefined) {
      updateData.cooldown_seconds = config.cooldownSeconds;
    }
    if (config.maxPerHour !== undefined) {
      updateData.max_per_hour = config.maxPerHour;
    }
    
    const { data, error } = await supabase
      .from('xp_source_config')
      .update(updateData)
      .eq('source', source)
      .select()
      .single();
    
    if (error) {
      throw new Error(`Failed to update XP source config: ${error.message}`);
    }
    
    return this.mapSourceConfigFromDB(data);
  }
  
  /**
   * Check if user has exceeded rate limit for a source
   * 
   * Requirements: 20.1, 20.2
   * 
   * @param userId - User ID
   * @param source - XP source type
   * @returns Rate limit check result
   */
  async checkRateLimit(userId: string, source: XPSource): Promise<RateLimitResult> {
    const supabase = await createClient();
    
    // Get source configuration
    const sourceConfig = await this.getXPSourceConfig(source);
    if (!sourceConfig) {
      // No config means no limit
      return {
        allowed: true,
        remainingQuota: 1000,
        resetAt: new Date(Date.now() + 3600000)
      };
    }
    
    // Get current hour bucket
    const now = new Date();
    const hourBucket = new Date(now);
    hourBucket.setMinutes(0, 0, 0);
    
    // Get current rate limit record
    const { data, error } = await supabase
      .from('xp_rate_limits')
      .select('*')
      .eq('user_id', userId)
      .eq('source', source)
      .eq('hour_bucket', hourBucket.toISOString())
      .single();
    
    if (error && error.code !== 'PGRST116') {
      throw new Error(`Failed to check rate limit: ${error.message}`);
    }
    
    const currentXP = data?.xp_earned || 0;
    const remainingQuota = Math.max(0, sourceConfig.maxPerHour - currentXP);
    const resetAt = new Date(hourBucket.getTime() + 3600000); // Next hour
    
    if (currentXP >= sourceConfig.maxPerHour) {
      return {
        allowed: false,
        remainingQuota: 0,
        resetAt,
        reason: `Maximum XP per hour (${sourceConfig.maxPerHour}) exceeded for source ${source}`
      };
    }
    
    return {
      allowed: true,
      remainingQuota,
      resetAt
    };
  }
  
  /**
   * Record XP award for rate limiting tracking
   * 
   * Requirements: 20.2
   * 
   * @param userId - User ID
   * @param source - XP source type
   * @param amount - XP amount awarded
   */
  async recordXPAward(userId: string, source: XPSource, amount: number): Promise<void> {
    const supabase = await createClient();
    
    // Get current hour bucket
    const now = new Date();
    const hourBucket = new Date(now);
    hourBucket.setMinutes(0, 0, 0);
    
    // Upsert rate limit record
    const { error } = await supabase
      .from('xp_rate_limits')
      .upsert({
        user_id: userId,
        source,
        hour_bucket: hourBucket.toISOString(),
        xp_earned: amount,
        transaction_count: 1
      }, {
        onConflict: 'user_id,source,hour_bucket',
        ignoreDuplicates: false
      });
    
    if (error) {
      // If record exists, increment it
      const { error: updateError } = await supabase.rpc('increment_rate_limit', {
        p_user_id: userId,
        p_source: source,
        p_hour_bucket: hourBucket.toISOString(),
        p_xp_amount: amount
      });
      
      if (updateError) {
        // Fallback: manual update
        const { data: existing } = await supabase
          .from('xp_rate_limits')
          .select('*')
          .eq('user_id', userId)
          .eq('source', source)
          .eq('hour_bucket', hourBucket.toISOString())
          .single();
        
        if (existing) {
          await supabase
            .from('xp_rate_limits')
            .update({
              xp_earned: existing.xp_earned + amount,
              transaction_count: existing.transaction_count + 1
            })
            .eq('user_id', userId)
            .eq('source', source)
            .eq('hour_bucket', hourBucket.toISOString());
        }
      }
    }
  }
  
  /**
   * Flag suspicious activity for admin review
   * 
   * Requirements: 20.3
   * 
   * @param userId - User ID
   * @param reason - Reason for flagging
   */
  async flagSuspiciousActivity(userId: string, reason: string): Promise<void> {
    const supabase = await createClient();
    
    // Create a manual adjustment record with negative amount as a flag
    // This is a simple implementation; a more robust system would have a dedicated table
    await supabase
      .from('xp_transactions')
      .insert({
        user_id: userId,
        amount: 1, // Minimal amount to satisfy CHECK constraint
        source: 'community_engagement',
        activity_type: 'suspicious_activity_flag',
        description: `FLAGGED: ${reason}`,
        manual_adjustment: true,
        metadata: {
          flag: true,
          reason,
          flagged_at: new Date().toISOString()
        }
      });
  }
  
  /**
   * Check if activity is on cooldown
   * 
   * Requirements: 20.4
   * 
   * @param userId - User ID
   * @param activityType - Activity type
   * @param referenceId - Reference ID for the activity
   * @returns True if on cooldown, false otherwise
   */
  async checkCooldown(
    userId: string,
    activityType: string,
    referenceId: string
  ): Promise<boolean> {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('activity_cooldowns')
      .select('expires_at')
      .eq('user_id', userId)
      .eq('activity_type', activityType)
      .eq('reference_id', referenceId)
      .single();
    
    if (error && error.code !== 'PGRST116') {
      throw new Error(`Failed to check cooldown: ${error.message}`);
    }
    
    if (!data) {
      return false;
    }
    
    const expiresAt = new Date(data.expires_at);
    const now = new Date();
    
    return expiresAt > now;
  }
  
  /**
   * Set cooldown for an activity
   * 
   * Requirements: 20.4
   * 
   * @param userId - User ID
   * @param activityType - Activity type
   * @param referenceId - Reference ID for the activity
   * @param seconds - Cooldown duration in seconds
   */
  async setCooldown(
    userId: string,
    activityType: string,
    referenceId: string,
    seconds: number
  ): Promise<void> {
    const supabase = await createClient();
    
    const expiresAt = new Date(Date.now() + seconds * 1000);
    
    const { error } = await supabase
      .from('activity_cooldowns')
      .upsert({
        user_id: userId,
        activity_type: activityType,
        reference_id: referenceId,
        expires_at: expiresAt.toISOString()
      }, {
        onConflict: 'user_id,activity_type,reference_id'
      });
    
    if (error) {
      throw new Error(`Failed to set cooldown: ${error.message}`);
    }
  }
  
  /**
   * Create manual XP adjustment (admin only)
   * 
   * Requirements: 14.1, 14.2, 14.3, 14.4, 14.5
   * 
   * @param params - Manual adjustment parameters
   * @returns The created XP transaction
   */
  async manualAdjustment(params: ManualAdjustmentParams): Promise<XPTransaction> {
    // Validate input
    const validated = manualAdjustmentSchema.parse(params);
    
    const supabase = await createClient();
    
    // Create XP transaction with manual_adjustment flag
    const { data: transaction, error } = await supabase
      .from('xp_transactions')
      .insert({
        user_id: validated.userId,
        amount: validated.amount,
        source: validated.source,
        activity_type: validated.activityType,
        description: validated.description,
        manual_adjustment: true,
        metadata: {
          reason: validated.reason,
          admin_id: validated.adminId,
          adjusted_at: new Date().toISOString()
        }
      })
      .select()
      .single();
    
    if (error) {
      throw new Error(`Failed to create manual adjustment: ${error.message}`);
    }
    
    // Invalidate leaderboard cache if XP change is significant (>100 XP)
    leaderboardCache.invalidateOnXPChange(validated.amount);
    
    return this.mapTransactionFromDB(transaction);
  }
  
  /**
   * Get XP summaries (daily, weekly, monthly)
   * 
   * Requirements: 11.5
   * 
   * @param userId - User ID
   * @returns XP summaries
   */
  async getXPSummary(userId: string): Promise<XPSummary> {
    const supabase = await createClient();
    
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    // Get daily XP
    const { data: dailyData } = await supabase
      .from('xp_transactions')
      .select('amount')
      .eq('user_id', userId)
      .gte('created_at', oneDayAgo.toISOString());
    
    const daily = (dailyData || []).reduce((sum, t) => sum + t.amount, 0);
    
    // Get weekly XP
    const { data: weeklyData } = await supabase
      .from('xp_transactions')
      .select('amount')
      .eq('user_id', userId)
      .gte('created_at', oneWeekAgo.toISOString());
    
    const weekly = (weeklyData || []).reduce((sum, t) => sum + t.amount, 0);
    
    // Get monthly XP
    const { data: monthlyData } = await supabase
      .from('xp_transactions')
      .select('amount')
      .eq('user_id', userId)
      .gte('created_at', oneMonthAgo.toISOString());
    
    const monthly = (monthlyData || []).reduce((sum, t) => sum + t.amount, 0);
    
    return { daily, weekly, monthly };
  }
  
  // ============================================================================
  // Private Helper Methods
  // ============================================================================
  
  /**
   * Map database transaction record to XPTransaction interface
   */
  private mapTransactionFromDB(dbRecord: any): XPTransaction {
    return {
      id: dbRecord.id,
      userId: dbRecord.user_id,
      amount: dbRecord.amount,
      source: dbRecord.source,
      activityType: dbRecord.activity_type,
      referenceId: dbRecord.reference_id,
      description: dbRecord.description,
      manualAdjustment: dbRecord.manual_adjustment,
      metadata: dbRecord.metadata,
      createdAt: new Date(dbRecord.created_at)
    };
  }
  
  /**
   * Map database source config record to XPSourceConfig interface
   */
  private mapSourceConfigFromDB(dbRecord: any): XPSourceConfig {
    return {
      id: dbRecord.id,
      source: dbRecord.source,
      baseAmount: dbRecord.base_amount,
      multipliers: dbRecord.multipliers || {},
      cooldownSeconds: dbRecord.cooldown_seconds,
      maxPerHour: dbRecord.max_per_hour,
      createdAt: new Date(dbRecord.created_at),
      updatedAt: new Date(dbRecord.updated_at)
    };
  }
}

// ============================================================================
// Export singleton instance
// ============================================================================

export const xpService = new XPService();
