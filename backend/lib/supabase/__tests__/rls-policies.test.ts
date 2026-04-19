/**
 * Tests for Row Level Security (RLS) policies
 * Validates that RLS policies are correctly configured for gamification tables
 * 
 * Note: These tests verify the policy structure and logic, not actual database enforcement
 */

import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { join } from 'path'

describe('RLS Policies Migration', () => {
  const migrationPath = join(process.cwd(), 'supabase/migrations/20260327000013_create_rls_policies.sql')
  let migrationContent: string

  try {
    migrationContent = readFileSync(migrationPath, 'utf-8')
  } catch (error) {
    migrationContent = ''
  }

  it('should enable RLS on all gamification tables', () => {
    const tables = [
      'xp_transactions',
      'badges',
      'user_badges',
      'rank_tiers',
      'user_ranks_history',
      'xp_source_config',
      'xp_rate_limits',
      'activity_cooldowns'
    ]

    tables.forEach(table => {
      expect(migrationContent).toContain(`ALTER TABLE ${table} ENABLE ROW LEVEL SECURITY`)
    })
  })

  describe('XP Transactions Policies', () => {
    it('should allow users to view their own transactions', () => {
      expect(migrationContent).toContain('Users can view own XP transactions')
      expect(migrationContent).toContain('ON xp_transactions FOR SELECT')
      expect(migrationContent).toContain('Clerk user ID = user_id')
    })

    it('should allow admins to view all transactions', () => {
      expect(migrationContent).toContain('Admins can view all XP transactions')
      expect(migrationContent).toContain("is_admin = true")
    })

    it('should allow admins to insert transactions', () => {
      expect(migrationContent).toContain('Admins can insert XP transactions')
      expect(migrationContent).toContain('ON xp_transactions FOR INSERT')
    })
  })

  describe('Badges Policies', () => {
    it('should allow anyone to view active badges', () => {
      expect(migrationContent).toContain('Anyone can view active badges')
      expect(migrationContent).toContain('ON badges FOR SELECT')
      expect(migrationContent).toContain('is_active = true')
    })

    it('should allow admins to manage badges', () => {
      expect(migrationContent).toContain('Admins can create badges')
      expect(migrationContent).toContain('Admins can update badges')
      expect(migrationContent).toContain('Admins can delete badges')
    })
  })

  describe('User Badges Policies', () => {
    it('should allow users to view their own badges', () => {
      expect(migrationContent).toContain('Users can view own badges')
      expect(migrationContent).toContain('ON user_badges FOR SELECT')
      expect(migrationContent).toContain('Clerk user ID = user_id')
    })

    it('should allow anyone to view non-revoked badges', () => {
      expect(migrationContent).toContain('Anyone can view non-revoked badges')
      expect(migrationContent).toContain('revoked_at IS NULL')
    })

    it('should allow admins to award and revoke badges', () => {
      expect(migrationContent).toContain('Admins can insert user badges')
      expect(migrationContent).toContain('Admins can update user badges')
    })
  })

  describe('Rank Tiers Policies', () => {
    it('should allow anyone to view rank tiers', () => {
      expect(migrationContent).toContain('Anyone can view rank tiers')
      expect(migrationContent).toContain('ON rank_tiers FOR SELECT')
      expect(migrationContent).toContain('USING (true)')
    })

    it('should allow admins to manage rank tiers', () => {
      expect(migrationContent).toContain('Admins can create rank tiers')
      expect(migrationContent).toContain('Admins can update rank tiers')
      expect(migrationContent).toContain('Admins can delete rank tiers')
    })
  })

  describe('User Ranks History Policies', () => {
    it('should allow users to view their own rank history', () => {
      expect(migrationContent).toContain('Users can view own rank history')
      expect(migrationContent).toContain('ON user_ranks_history FOR SELECT')
    })

    it('should allow anyone to view rank history', () => {
      expect(migrationContent).toContain('Anyone can view rank history')
    })
  })

  describe('XP Source Config Policies', () => {
    it('should allow anyone to view XP source configuration', () => {
      expect(migrationContent).toContain('Anyone can view XP source config')
      expect(migrationContent).toContain('ON xp_source_config FOR SELECT')
    })

    it('should allow admins to manage XP source config', () => {
      expect(migrationContent).toContain('Admins can create XP source config')
      expect(migrationContent).toContain('Admins can update XP source config')
    })
  })

  describe('Rate Limits and Cooldowns Policies', () => {
    it('should allow users to view their own rate limits', () => {
      expect(migrationContent).toContain('Users can view own rate limits')
      expect(migrationContent).toContain('ON xp_rate_limits FOR SELECT')
    })

    it('should allow users to view their own cooldowns', () => {
      expect(migrationContent).toContain('Users can view own cooldowns')
      expect(migrationContent).toContain('ON activity_cooldowns FOR SELECT')
    })

    it('should allow admins to view all rate limits and cooldowns', () => {
      expect(migrationContent).toContain('Admins can view all rate limits')
      expect(migrationContent).toContain('Admins can view all cooldowns')
    })
  })

  describe('Policy Documentation', () => {
    it('should include comments for key policies', () => {
      expect(migrationContent).toContain('COMMENT ON POLICY')
      expect(migrationContent).toContain('Users can only view their own XP transaction history')
      expect(migrationContent).toContain('All users can view active badges')
    })
  })

  describe('Admin Role Check', () => {
    it('should consistently check admin role across all policies', () => {
      const adminChecks = migrationContent.match(/is_admin = true/g)
      expect(adminChecks).toBeTruthy()
      expect(adminChecks!.length).toBeGreaterThan(10) // Multiple admin policies
    })

    it('should use EXISTS clause for admin checks', () => {
      const existsChecks = migrationContent.match(/EXISTS \(/g)
      expect(existsChecks).toBeTruthy()
      expect(existsChecks!.length).toBeGreaterThan(10)
    })
  })
})
