/**
 * Script to apply RLS policies to Supabase database
 * 
 * This script reads the RLS policies migration file and applies it to the database.
 * It should be run after the database schema has been created.
 * 
 * Usage:
 *   npx tsx scripts/apply-rls-policies.ts
 * 
 * Requirements:
 *   - Database schema must be created first
 *   - SUPABASE_SERVICE_ROLE_KEY must be set in environment
 */

import { readFileSync } from 'fs'
import { join } from 'path'
import { getServerClient } from '../lib/supabase'

async function applyRLSPolicies() {
  console.log('🔒 Applying RLS policies to Supabase database...\n')

  try {
    // Read the migration file
    const migrationPath = join(process.cwd(), 'supabase/migrations/20260327000013_create_rls_policies.sql')
    const migrationSQL = readFileSync(migrationPath, 'utf-8')

    console.log('📄 Migration file loaded:', migrationPath)
    console.log('📏 SQL length:', migrationSQL.length, 'characters\n')

    // Get Supabase client
    const supabase = getServerClient()

    // Execute the migration
    console.log('⚙️  Executing migration...')
    const { error } = await supabase.rpc('exec_sql', { sql: migrationSQL })

    if (error) {
      console.error('❌ Error applying RLS policies:', error)
      process.exit(1)
    }

    console.log('✅ RLS policies applied successfully!\n')
    console.log('📋 Summary:')
    console.log('   - Enabled RLS on 8 gamification tables')
    console.log('   - Created policies for xp_transactions')
    console.log('   - Created policies for badges')
    console.log('   - Created policies for user_badges')
    console.log('   - Created policies for rank_tiers')
    console.log('   - Created policies for user_ranks_history')
    console.log('   - Created policies for xp_source_config')
    console.log('   - Created policies for xp_rate_limits')
    console.log('   - Created policies for activity_cooldowns')
    console.log('\n🎉 Database is now secured with Row Level Security!')

  } catch (error) {
    console.error('❌ Fatal error:', error)
    process.exit(1)
  }
}

// Run the script
applyRLSPolicies()
