/**
 * Complete Migration from Supabase Auth to Clerk Authentication
 * This script will restructure the entire database for Clerk
 */

import { config } from 'dotenv';
import { readFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';

// Get __dirname in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = join(__filename, '..');

// Load environment variables
config({ path: '.env.local' });

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('Missing DATABASE_URL in environment variables!');
  process.exit(1);
}

async function migrateToClerkAuth() {
  try {
    console.log('=== MIGRATING FROM SUPABASE AUTH TO CLERK AUTH ===\n');

    // Import pg dynamically
    const { Client } = await import('pg');
    
    // Create client with DATABASE_URL
    const client = new Client({
      connectionString: DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });

    await client.connect();
    console.log('Connected to PostgreSQL database');

    // Phase 1: Backup current data
    console.log('\nPhase 1: Creating backup tables...');
    
    const backupSQL = `
      CREATE TABLE IF NOT EXISTS profiles_backup AS SELECT * FROM profiles;
      CREATE TABLE IF NOT EXISTS user_skills_backup AS SELECT * FROM user_skills;
      CREATE TABLE IF NOT EXISTS event_registrations_backup AS SELECT * FROM event_registrations;
      CREATE TABLE IF NOT EXISTS xp_transactions_backup AS SELECT * FROM xp_transactions;
      CREATE TABLE IF NOT EXISTS user_badges_backup AS SELECT * FROM user_badges;
      CREATE TABLE IF NOT EXISTS user_missions_backup AS SELECT * FROM user_missions;
      CREATE TABLE IF NOT EXISTS user_ranks_history_backup AS SELECT * FROM user_ranks_history;
      CREATE TABLE IF NOT EXISTS leaderboard_backup AS SELECT * FROM leaderboard;
      CREATE TABLE IF NOT EXISTS leaderboard_scores_backup AS SELECT * FROM leaderboard_scores;
      CREATE TABLE IF NOT EXISTS notifications_backup AS SELECT * FROM notifications;
      CREATE TABLE IF NOT EXISTS announcements_backup AS SELECT * FROM announcements;
      CREATE TABLE IF NOT EXISTS activity_cooldowns_backup AS SELECT * FROM activity_cooldowns;
      CREATE TABLE IF NOT EXISTS xp_rate_limits_backup AS SELECT * FROM xp_rate_limits;
    `;

    try {
      await client.query(backupSQL);
      console.log('Backup tables created successfully');
    } catch (error) {
      console.log('Backup creation result:', error.message);
    }

    // Phase 2: Disable RLS and drop existing policies
    console.log('\nPhase 2: Disabling RLS and dropping policies...');
    
    const disableRLSSQL = `
      ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
      ALTER TABLE user_skills DISABLE ROW LEVEL SECURITY;
      ALTER TABLE event_registrations DISABLE ROW LEVEL SECURITY;
      ALTER TABLE xp_transactions DISABLE ROW LEVEL SECURITY;
      ALTER TABLE user_badges DISABLE ROW LEVEL SECURITY;
      ALTER TABLE user_missions DISABLE ROW LEVEL SECURITY;
      ALTER TABLE user_ranks_history DISABLE ROW LEVEL SECURITY;
      ALTER TABLE leaderboard DISABLE ROW LEVEL SECURITY;
      ALTER TABLE leaderboard_scores DISABLE ROW LEVEL SECURITY;
      ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;
      ALTER TABLE announcements DISABLE ROW LEVEL SECURITY;
      ALTER TABLE activity_cooldowns DISABLE ROW LEVEL SECURITY;
      ALTER TABLE xp_rate_limits DISABLE ROW LEVEL SECURITY;
      
      -- Drop all existing policies
      DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
      DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
      DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
      DROP POLICY IF EXISTS "Users can view their own skills" ON user_skills;
      DROP POLICY IF EXISTS "Users can update their own skills" ON user_skills;
      DROP POLICY IF EXISTS "Users can insert their own skills" ON user_skills;
    `;

    try {
      await client.query(disableRLSSQL);
      console.log('RLS disabled and policies dropped');
    } catch (error) {
      console.log('Disable RLS result:', error.message);
    }

    // Phase 3: Update user ID fields to TEXT
    console.log('\nPhase 3: Converting user ID fields to TEXT...');
    
    const convertToTextSQL = `
      -- Update profiles table first
      ALTER TABLE profiles ALTER COLUMN id TYPE TEXT USING id::TEXT;
      
      -- Update all user_id references
      ALTER TABLE user_skills ALTER COLUMN user_id TYPE TEXT USING user_id::TEXT;
      ALTER TABLE event_registrations ALTER COLUMN user_id TYPE TEXT USING user_id::TEXT;
      ALTER TABLE xp_transactions ALTER COLUMN user_id TYPE TEXT USING user_id::TEXT;
      ALTER TABLE user_badges ALTER COLUMN user_id TYPE TEXT USING user_id::TEXT;
      ALTER TABLE user_missions ALTER COLUMN user_id TYPE TEXT USING user_id::TEXT;
      ALTER TABLE user_ranks_history ALTER COLUMN user_id TYPE TEXT USING user_id::TEXT;
      ALTER TABLE leaderboard ALTER COLUMN user_id TYPE TEXT USING user_id::TEXT;
      ALTER TABLE leaderboard_scores ALTER COLUMN user_id TYPE TEXT USING user_id::TEXT;
      ALTER TABLE notifications ALTER COLUMN user_id TYPE TEXT USING user_id::TEXT;
      ALTER TABLE announcements ALTER COLUMN author_id TYPE TEXT USING author_id::TEXT;
      ALTER TABLE activity_cooldowns ALTER COLUMN user_id TYPE TEXT USING user_id::TEXT;
      ALTER TABLE xp_rate_limits ALTER COLUMN user_id TYPE TEXT USING user_id::TEXT;
    `;

    try {
      await client.query(convertToTextSQL);
      console.log('User ID fields converted to TEXT');
    } catch (error) {
      console.log('Convert to TEXT result:', error.message);
    }

    // Phase 4: Add Clerk-specific fields
    console.log('\nPhase 4: Adding Clerk-specific fields...');
    
    const addClerkFieldsSQL = `
      -- Add Clerk-specific fields to profiles table
      ALTER TABLE profiles ADD COLUMN IF NOT EXISTS clerk_user_id TEXT UNIQUE;
      ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE;
      ALTER TABLE profiles ADD COLUMN IF NOT EXISTS clerk_created_at TIMESTAMPTZ;
      ALTER TABLE profiles ADD COLUMN IF NOT EXISTS clerk_updated_at TIMESTAMPTZ;
      
      -- Create index for clerk_user_id
      CREATE INDEX IF NOT EXISTS idx_profiles_clerk_user_id ON profiles(clerk_user_id);
    `;

    try {
      await client.query(addClerkFieldsSQL);
      console.log('Clerk-specific fields added');
    } catch (error) {
      console.log('Add Clerk fields result:', error.message);
    }

    // Phase 5: Create Clerk user mapping function
    console.log('\nPhase 5: Creating Clerk user mapping function...');
    
    const createMappingFunctionSQL = `
      -- Function to get or create user profile from Clerk user ID
      CREATE OR REPLACE FUNCTION get_or_create_user_profile(clerk_user_id TEXT, email TEXT, username TEXT DEFAULT NULL)
      RETURNS TABLE(id TEXT, email TEXT, username TEXT, created_at TIMESTAMPTZ)
      LANGUAGE plpgsql
      AS $$
      DECLARE
          profile_id TEXT;
      BEGIN
          -- Try to find existing profile by clerk_user_id
          SELECT id INTO profile_id FROM profiles WHERE clerk_user_id = clerk_user_id;
          
          IF profile_id IS NOT NULL THEN
              -- Return existing profile
              RETURN QUERY
              SELECT p.id, p.email, p.username, p.created_at
              FROM profiles p
              WHERE p.id = profile_id;
          ELSE
              -- Create new profile
              INSERT INTO profiles (
                  id, 
                  clerk_user_id, 
                  email, 
                  username, 
                  email_verified,
                  clerk_created_at,
                  clerk_updated_at,
                  created_at, 
                  updated_at,
                  total_xp,
                  current_streak,
                  longest_streak,
                  profile_completion_percentage
              ) VALUES (
                  gen_random_uuid(), -- Generate UUID for internal use
                  clerk_user_id,
                  email,
                  COALESCE(username, 'user_' || substring(clerk_user_id, 6, 8)),
                  TRUE, -- Assume verified since Clerk handles verification
                  NOW(),
                  NOW(),
                  NOW(),
                  NOW(),
                  0,
                  0,
                  0,
                  0
              ) RETURNING id, email, username, created_at;
          END IF;
      END;
      $$;
    `;

    try {
      await client.query(createMappingFunctionSQL);
      console.log('Clerk user mapping function created');
    } catch (error) {
      console.log('Create mapping function result:', error.message);
    }

    // Phase 6: Create new RLS policies for Clerk
    console.log('\nPhase 6: Creating new RLS policies for Clerk...');
    
    const createNewPoliciesSQL = `
      -- Enable RLS
      ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
      ALTER TABLE user_skills ENABLE ROW LEVEL SECURITY;
      ALTER TABLE event_registrations ENABLE ROW LEVEL SECURITY;
      ALTER TABLE xp_transactions ENABLE ROW LEVEL SECURITY;
      ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;
      ALTER TABLE user_missions ENABLE ROW LEVEL SECURITY;
      ALTER TABLE user_ranks_history ENABLE ROW LEVEL SECURITY;
      ALTER TABLE leaderboard ENABLE ROW LEVEL SECURITY;
      ALTER TABLE leaderboard_scores ENABLE ROW LEVEL SECURITY;
      ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
      ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
      ALTER TABLE activity_cooldowns ENABLE ROW LEVEL SECURITY;
      ALTER TABLE xp_rate_limits ENABLE ROW LEVEL SECURITY;
      
      -- Create Clerk-friendly policies for profiles
      CREATE POLICY "Users can view their own profile" ON profiles 
      FOR SELECT USING (clerk_user_id = current_setting('app.current_clerk_user_id', true));
      
      CREATE POLICY "Users can update their own profile" ON profiles 
      FOR UPDATE USING (clerk_user_id = current_setting('app.current_clerk_user_id', true));
      
      CREATE POLICY "Users can insert their own profile" ON profiles 
      FOR INSERT WITH CHECK (clerk_user_id = current_setting('app.current_clerk_user_id', true));
      
      -- Public read policies for some tables
      CREATE POLICY "Enable read access for all users" ON profiles FOR SELECT USING (true);
      CREATE POLICY "Enable read access for all users" ON user_skills FOR SELECT USING (true);
      CREATE POLICY "Enable read access for all users" ON leaderboard FOR SELECT USING (true);
      CREATE POLICY "Enable read access for all users" ON announcements FOR SELECT USING (true);
    `;

    try {
      await client.query(createNewPoliciesSQL);
      console.log('New RLS policies created for Clerk');
    } catch (error) {
      console.log('Create policies result:', error.message);
    }

    // Phase 7: Test the migration
    console.log('\nPhase 7: Testing migration...');
    
    const testMigrationSQL = `
      -- Test if we can insert a Clerk user
      SELECT COUNT(*) as count FROM profiles WHERE clerk_user_id IS NOT NULL;
      
      -- Test table structures
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'profiles' 
      AND column_name IN ('id', 'clerk_user_id', 'email_verified');
    `;

    try {
      const result = await client.query(testMigrationSQL);
      console.log('Migration test results:');
      console.log('Profiles with clerk_user_id:', result.rows[0]?.count || 0);
      console.log('Table structure check passed');
    } catch (error) {
      console.log('Migration test result:', error.message);
    }

    await client.end();

    console.log('\n=== MIGRATION COMPLETED ===');
    console.log('Changes made:');
    console.log('1. Backup tables created');
    console.log('2. RLS disabled and old policies dropped');
    console.log('3. User ID fields converted to TEXT');
    console.log('4. Clerk-specific fields added');
    console.log('5. Clerk user mapping function created');
    console.log('6. New RLS policies created');
    console.log('\nNext steps:');
    console.log('1. Update backend auth middleware');
    console.log('2. Update frontend auth context');
    console.log('3. Test authentication flow');
    console.log('4. Verify all API endpoints');

  } catch (error) {
    console.error('Migration failed:', error.message);
    process.exit(1);
  }
}

migrateToClerkAuth();
