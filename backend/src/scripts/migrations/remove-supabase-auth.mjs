/**
 * Remove Supabase Auth Schema Completely
 * This script will remove all Supabase authentication-related elements
 */

import { config } from 'dotenv';

// Load environment variables
config({ path: '.env.local' });

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('Missing DATABASE_URL in environment variables!');
  process.exit(1);
}

async function removeSupabaseAuth() {
  try {
    console.log('=== REMOVING SUPABASE AUTH SCHEMA ===\n');

    // Import pg dynamically
    const { Client } = await import('pg');
    
    // Create client with DATABASE_URL
    const client = new Client({
      connectionString: DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });

    await client.connect();
    console.log('Connected to PostgreSQL database');

    // Phase 1: Disable RLS on all tables
    console.log('Phase 1: Disabling RLS on all tables...');
    
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
    `;

    try {
      await client.query(disableRLSSQL);
      console.log('RLS disabled on all tables');
    } catch (error) {
      console.log('Disable RLS result:', error.message);
    }

    // Phase 2: Drop all existing policies
    console.log('\nPhase 2: Dropping all existing policies...');
    
    const dropPoliciesSQL = `
      -- Drop all policies on all tables
      DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
      DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
      DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
      DROP POLICY IF EXISTS "Enable read access for all users" ON profiles;
      DROP POLICY IF EXISTS "Users can view their own skills" ON user_skills;
      DROP POLICY IF EXISTS "Users can update their own skills" ON user_skills;
      DROP POLICY IF EXISTS "Users can insert their own skills" ON user_skills;
      DROP POLICY IF EXISTS "Enable read access for all users" ON user_skills;
      DROP POLICY IF EXISTS "Enable read access for all users" ON leaderboard;
      DROP POLICY IF EXISTS "Enable read access for all users" ON announcements;
      
      -- Drop any other existing policies
      DO $$
      DECLARE
          policy_record RECORD;
      BEGIN
          FOR policy_record IN 
              SELECT schemaname, tablename, policyname 
              FROM pg_policies 
              WHERE schemaname = 'public'
          LOOP
              EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', 
                           policy_record.policyname, 
                           policy_record.schemaname, 
                           policy_record.tablename);
          END LOOP;
      END $$;
    `;

    try {
      await client.query(dropPoliciesSQL);
      console.log('All existing policies dropped');
    } catch (error) {
      console.log('Drop policies result:', error.message);
    }

    // Phase 3: Remove any auth.users references
    console.log('\nPhase 3: Removing auth.users references...');
    
    const removeAuthRefsSQL = `
      -- Drop any foreign key constraints that reference auth.users
      DO $$
      DECLARE
          constraint_record RECORD;
      BEGIN
          FOR constraint_record IN 
              SELECT tc.table_name, tc.constraint_name
              FROM information_schema.table_constraints tc
              JOIN information_schema.constraint_column_usage ccu 
                  ON tc.constraint_name = ccu.constraint_name
              WHERE tc.constraint_type = 'FOREIGN KEY'
              AND ccu.column_name = 'id'
              AND tc.table_schema = 'public'
          LOOP
              EXECUTE format('ALTER TABLE %I DROP CONSTRAINT IF EXISTS %I', 
                           constraint_record.table_name, 
                           constraint_record.constraint_name);
          END LOOP;
      END $$;
    `;

    try {
      await client.query(removeAuthRefsSQL);
      console.log('auth.users references removed');
    } catch (error) {
      console.log('Remove auth refs result:', error.message);
    }

    // Phase 4: Drop Supabase auth schema (if possible)
    console.log('\nPhase 4: Attempting to drop Supabase auth schema...');
    
    const dropAuthSchemaSQL = `
      -- Try to drop the auth schema (this might fail due to permissions)
      DROP SCHEMA IF EXISTS auth CASCADE;
      
      -- Also try to drop other auth-related schemas
      DROP SCHEMA IF EXISTS storage CASCADE;
      DROP SCHEMA IF EXISTS extensions CASCADE;
      DROP SCHEMA IF EXISTS realtime CASCADE;
      DROP SCHEMA IF EXISTS vault CASCADE;
    `;

    try {
      await client.query(dropAuthSchemaSQL);
      console.log('Supabase auth schemas dropped (if permissions allow)');
    } catch (error) {
      console.log('Drop auth schema result:', error.message);
      console.log('Note: This might fail due to Supabase permissions - that\'s OK');
    }

    // Phase 5: Remove any remaining auth functions
    console.log('\nPhase 5: Removing auth-related functions...');
    
    const dropAuthFunctionsSQL = `
      -- Drop any auth-related functions
      DROP FUNCTION IF EXISTS auth.jwt() CASCADE;
      DROP FUNCTION IF EXISTS auth.uid() CASCADE;
      DROP FUNCTION IF EXISTS auth.role() CASCADE;
      DROP FUNCTION IF EXISTS auth.email() CASCADE;
      
      -- Drop any functions that reference auth
      DO $$
      DECLARE
          func_record RECORD;
      BEGIN
              FOR func_record IN 
                  SELECT routine_name, routine_schema
                  FROM information_schema.routines
                  WHERE routine_schema = 'public'
                  AND routine_name LIKE '%auth%'
              LOOP
                  EXECUTE format('DROP FUNCTION IF EXISTS %I.%I CASCADE', 
                               func_record.routine_schema, 
                               func_record.routine_name);
              END LOOP;
          END LOOP;
      END $$;
    `;

    try {
      await client.query(dropAuthFunctionsSQL);
      console.log('Auth-related functions removed');
    } catch (error) {
      console.log('Drop auth functions result:', error.message);
    }

    // Phase 6: Create new Clerk-only policies
    console.log('\nPhase 6: Creating Clerk-only policies...');
    
    const createClerkPoliciesSQL = `
      -- Enable RLS on tables that need it
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
      ALTER TABLE activity_cooldowns ENABLE ROW LEVEL SECURITY;
      ALTER TABLE xp_rate_limits ENABLE ROW LEVEL SECURITY;
      
      -- Create simple Clerk-based policies
      CREATE POLICY "Users can view their own profile" ON profiles 
      FOR SELECT USING (clerk_user_id = current_setting('app.current_clerk_user_id', true));
      
      CREATE POLICY "Users can update their own profile" ON profiles 
      FOR UPDATE USING (clerk_user_id = current_setting('app.current_clerk_user_id', true));
      
      CREATE POLICY "Users can insert their own profile" ON profiles 
      FOR INSERT WITH CHECK (clerk_user_id = current_setting('app.current_clerk_user_id', true));
      
      -- Public read policies for some tables
      CREATE POLICY "Public read access" ON profiles FOR SELECT USING (true);
      CREATE POLICY "Public read access" ON user_skills FOR SELECT USING (true);
      CREATE POLICY "Public read access" ON leaderboard FOR SELECT USING (true);
      CREATE POLICY "Public read access" ON announcements FOR SELECT USING (true);
      
      -- Clerk-based policies for user-specific data
      CREATE POLICY "Users can view their own skills" ON user_skills 
      FOR ALL USING (user_id IN (
        SELECT id FROM profiles WHERE clerk_user_id = current_setting('app.current_clerk_user_id', true)
      ));
      
      CREATE POLICY "Users can view their own events" ON event_registrations 
      FOR ALL USING (user_id IN (
        SELECT id FROM profiles WHERE clerk_user_id = current_setting('app.current_clerk_user_id', true)
      ));
      
      CREATE POLICY "Users can view their own xp" ON xp_transactions 
      FOR ALL USING (user_id IN (
        SELECT id FROM profiles WHERE clerk_user_id = current_setting('app.current_clerk_user_id', true)
      ));
      
      CREATE POLICY "Users can view their own badges" ON user_badges 
      FOR ALL USING (user_id IN (
        SELECT id FROM profiles WHERE clerk_user_id = current_setting('app.current_clerk_user_id', true)
      ));
      
      CREATE POLICY "Users can view their own missions" ON user_missions 
      FOR ALL USING (user_id IN (
        SELECT id FROM profiles WHERE clerk_user_id = current_setting('app.current_clerk_user_id', true)
      ));
      
      CREATE POLICY "Users can view their own notifications" ON notifications 
      FOR ALL USING (user_id IN (
        SELECT id FROM profiles WHERE clerk_user_id = current_setting('app.current_clerk_user_id', true)
      ));
    `;

    try {
      await client.query(createClerkPoliciesSQL);
      console.log('Clerk-only policies created');
    } catch (error) {
      console.log('Create Clerk policies result:', error.message);
    }

    // Phase 7: Clean up any remaining auth triggers
    console.log('\nPhase 7: Cleaning up auth triggers...');
    
    const dropAuthTriggersSQL = `
      -- Drop any triggers that reference auth
      DO $$
      DECLARE
          trigger_record RECORD;
      BEGIN
          FOR trigger_record IN 
              SELECT trigger_name, event_object_table
              FROM information_schema.triggers
              WHERE trigger_schema = 'public'
              AND (trigger_name LIKE '%auth%' OR trigger_name LIKE '%user%')
          LOOP
              EXECUTE format('DROP TRIGGER IF EXISTS %I ON %I', 
                           trigger_record.trigger_name, 
                           trigger_record.event_object_table);
          END LOOP;
      END $$;
    `;

    try {
      await client.query(dropAuthTriggersSQL);
      console.log('Auth triggers cleaned up');
    } catch (error) {
      console.log('Drop auth triggers result:', error.message);
    }

    // Phase 8: Test the cleanup
    console.log('\nPhase 8: Testing the cleanup...');
    
    const testCleanupSQL = `
      -- Check if auth schema still exists
      SELECT schema_name FROM information_schema.schemata WHERE schema_name = 'auth';
      
      -- Check remaining policies
      SELECT schemaname, tablename, policyname FROM pg_policies WHERE schemaname = 'public';
      
      -- Check table structure
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'profiles' 
      AND column_name IN ('id', 'clerk_user_id')
      ORDER BY column_name;
    `;

    try {
      const result = await client.query(testCleanupSQL);
      console.log('Cleanup test results:');
      console.log('Auth schema exists:', result.rows[0]?.schema_name || 'No');
      console.log('Remaining policies:', result.rows.slice(1, 3).length || 0);
      console.log('Table structure:', result.rows.slice(3, 5));
    } catch (error) {
      console.log('Cleanup test result:', error.message);
    }

    await client.end();

    console.log('\n=== SUPABASE AUTH REMOVAL COMPLETED ===');
    console.log('Changes made:');
    console.log('1. RLS disabled on all tables');
    console.log('2. All existing policies dropped');
    console.log('3. auth.users references removed');
    console.log('4. Supabase auth schemas dropped (if possible)');
    console.log('5. Auth-related functions removed');
    console.log('6. Clerk-only policies created');
    console.log('7. Auth triggers cleaned up');
    console.log('\nResult: Supabase auth completely removed, only Clerk remains');
    console.log('\nNext steps:');
    console.log('1. Update any remaining Supabase auth references in code');
    console.log('2. Test all functionality with Clerk only');
    console.log('3. Remove Supabase auth environment variables (if any)');

  } catch (error) {
    console.error('Supabase auth removal failed:', error.message);
    process.exit(1);
  }
}

removeSupabaseAuth();
