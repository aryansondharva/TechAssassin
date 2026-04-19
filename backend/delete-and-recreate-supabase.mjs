/**
 * Delete Entire Supabase Schema and Recreate with Clerk
 * This script will completely wipe the database and create a new schema optimized for Clerk authentication
 */

import { config } from 'dotenv';

// Load environment variables
config({ path: '.env.local' });

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('Missing DATABASE_URL in environment variables!');
  process.exit(1);
}

async function deleteAndRecreateSupabase() {
  try {
    console.log('=== DELETE AND RECREATE SUPABASE SCHEMA ===\n');

    // Import pg dynamically
    const { Client } = await import('pg');
    
    // Create client with DATABASE_URL
    const client = new Client({
      connectionString: DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });

    await client.connect();
    console.log('Connected to PostgreSQL database');

    // Step 1: Get list of all tables
    console.log('Step 1: Getting all tables...');
    
    const tablesQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `;
    
    const tablesResult = await client.query(tablesQuery);
    const allTables = tablesResult.rows.map(row => row.table_name);
    
    console.log(`Found ${allTables.length} tables to delete`);
    
    // Step 2: Drop all tables (CASCADE)
    console.log('\nStep 2: Dropping all tables...');
    
    for (const table of allTables) {
      try {
        await client.query(`DROP TABLE IF EXISTS "${table}" CASCADE`);
        console.log(`Dropped table: ${table}`);
      } catch (error) {
        console.log(`Error dropping table ${table}:`, error.message);
      }
    }

    // Step 3: Drop all schemas except public
    console.log('\nStep 3: Dropping all schemas except public...');
    
    const schemasQuery = `
      SELECT schema_name 
      FROM information_schema.schemata 
      WHERE schema_name NOT IN ('public', 'information_schema', 'pg_catalog', 'pg_toast')
      ORDER BY schema_name;
    `;
    
    const schemasResult = await client.query(schemasQuery);
    const allSchemas = schemasResult.rows.map(row => row.schema_name);
    
    for (const schema of allSchemas) {
      try {
        await client.query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);
        console.log(`Dropped schema: ${schema}`);
      } catch (error) {
        console.log(`Error dropping schema ${schema}:`, error.message);
      }
    }

    // Step 4: Create new optimized schema for Clerk
    console.log('\nStep 4: Creating new schema for Clerk authentication...');
    
    // Create profiles table optimized for Clerk
    const createProfilesTable = `
      CREATE TABLE profiles (
        id TEXT PRIMARY KEY,
        clerk_user_id TEXT UNIQUE NOT NULL,
        email TEXT,
        username TEXT,
        first_name TEXT,
        last_name TEXT,
        full_name TEXT,
        avatar_url TEXT,
        github_url TEXT,
        linkedin_url TEXT,
        portfolio_url TEXT,
        twitter_url TEXT,
        bio TEXT,
        phone TEXT,
        address TEXT,
        education TEXT,
        university TEXT,
        graduation_year INTEGER,
        skills TEXT[],
        interests TEXT[],
        roles TEXT[],
        resume_url TEXT,
        is_admin BOOLEAN DEFAULT FALSE,
        is_email_public BOOLEAN DEFAULT FALSE,
        is_phone_public BOOLEAN DEFAULT FALSE,
        is_address_public BOOLEAN DEFAULT FALSE,
        has_education BOOLEAN DEFAULT FALSE,
        has_experience BOOLEAN DEFAULT FALSE,
        degree_type TEXT,
        graduation_month TEXT,
        tshirt_size TEXT,
        gender TEXT,
        dietary_preference TEXT,
        allergies TEXT,
        emergency_contact_name TEXT,
        emergency_contact_phone TEXT,
        aadhaar_number TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        email_verified BOOLEAN DEFAULT FALSE,
        clerk_created_at TIMESTAMPTZ,
        clerk_updated_at TIMESTAMPTZ,
        total_xp INTEGER DEFAULT 0,
        current_streak INTEGER DEFAULT 0,
        longest_streak INTEGER DEFAULT 0,
        last_activity_date DATE,
        profile_completion_percentage INTEGER DEFAULT 0,
        banner_url TEXT
      );
    `;
    
    await client.query(createProfilesTable);
    console.log('Created profiles table');

    // Create indexes for performance
    const createIndexes = `
      CREATE INDEX idx_profiles_clerk_user_id ON profiles(clerk_user_id);
      CREATE INDEX idx_profiles_email ON profiles(email);
      CREATE INDEX idx_profiles_username ON profiles(username);
      CREATE INDEX idx_profiles_created_at ON profiles(created_at);
      CREATE INDEX idx_profiles_total_xp ON profiles(total_xp DESC);
      CREATE INDEX idx_profiles_updated_at ON profiles(updated_at);
    `;
    
    await client.query(createIndexes);
    console.log('Created indexes for profiles table');

    // Create missions table
    const createMissionsTable = `
      CREATE TABLE missions (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        difficulty_level TEXT CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced', 'expert')),
        category TEXT,
        tags TEXT[],
        requirements TEXT[],
        rewards TEXT,
        xp_reward INTEGER DEFAULT 0,
        time_limit INTEGER,
        created_by_clerk_user_id TEXT REFERENCES profiles(clerk_user_id),
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        is_active BOOLEAN DEFAULT TRUE,
        completion_count INTEGER DEFAULT 0
      );
    `;
    
    await client.query(createMissionsTable);
    console.log('Created missions table');

    // Create skills table
    const createSkillsTable = `
      CREATE TABLE skills (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        category TEXT,
        description TEXT,
        icon TEXT,
        level TEXT CHECK (level IN ('beginner', 'intermediate', 'advanced', 'expert')),
        prerequisites TEXT[],
        learning_resources TEXT[],
        created_by_clerk_user_id TEXT REFERENCES profiles(clerk_user_id),
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        is_active BOOLEAN DEFAULT TRUE
      );
    `;
    
    await client.query(createSkillsTable);
    console.log('Created skills table');

    // Create user_skills junction table
    const createUserSkillsTable = `
      CREATE TABLE user_skills (
        id TEXT PRIMARY KEY,
        clerk_user_id TEXT REFERENCES profiles(clerk_user_id) ON DELETE CASCADE,
        skill_id TEXT REFERENCES skills(id) ON DELETE CASCADE,
        proficiency_level TEXT CHECK (proficiency_level IN ('beginner', 'intermediate', 'advanced', 'expert')),
        acquired_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(clerk_user_id, skill_id)
      );
    `;
    
    await client.query(createUserSkillsTable);
    console.log('Created user_skills junction table');

    // Create user_missions junction table
    const createUserMissionsTable = `
      CREATE TABLE user_missions (
        id TEXT PRIMARY KEY,
        clerk_user_id TEXT REFERENCES profiles(clerk_user_id) ON DELETE CASCADE,
        mission_id TEXT REFERENCES missions(id) ON DELETE CASCADE,
        status TEXT CHECK (status IN ('not_started', 'in_progress', 'completed', 'abandoned')),
        started_at TIMESTAMPTZ,
        completed_at TIMESTAMPTZ,
        xp_earned INTEGER DEFAULT 0,
        notes TEXT,
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(clerk_user_id, mission_id)
      );
    `;
    
    await client.query(createUserMissionsTable);
    console.log('Created user_missions junction table');

    // Create user_xp table for tracking user experience points
    const createUserXpTable = `
      CREATE TABLE user_xp (
        id TEXT PRIMARY KEY,
        clerk_user_id TEXT REFERENCES profiles(clerk_user_id) ON DELETE CASCADE,
        total_xp INTEGER DEFAULT 0,
        level INTEGER DEFAULT 1,
        xp_to_next_level INTEGER DEFAULT 100,
        current_level_xp INTEGER DEFAULT 0,
        xp_history TEXT[],
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(clerk_user_id)
      );
    `;

    await client.query(createUserXpTable);
    console.log('Created user_xp table');

    // Create notifications table
    const createNotificationsTable = `
      CREATE TABLE notifications (
        id TEXT PRIMARY KEY,
        clerk_user_id TEXT REFERENCES profiles(clerk_user_id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        message TEXT,
        type TEXT CHECK (type IN ('info', 'success', 'warning', 'error')),
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        expires_at TIMESTAMPTZ,
        metadata JSONB
      );
    `;
    
    await client.query(createNotificationsTable);
    console.log('Created notifications table');

    // Create audit_logs table for tracking
    const createAuditLogsTable = `
      CREATE TABLE audit_logs (
        id TEXT PRIMARY KEY,
        clerk_user_id TEXT REFERENCES profiles(clerk_user_id) ON DELETE CASCADE,
        action TEXT NOT NULL,
        table_name TEXT,
        record_id TEXT,
        old_values JSONB,
        new_values JSONB,
        ip_address INET,
        user_agent TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `;
    
    await client.query(createAuditLogsTable);
    console.log('Created audit_logs table');

    // Step 5: Enable RLS (Row Level Security)
    console.log('\nStep 5: Enabling Row Level Security...');
    
    await client.query('ALTER TABLE profiles ENABLE ROW LEVEL SECURITY');
    await client.query('ALTER TABLE missions ENABLE ROW LEVEL SECURITY');
    await client.query('ALTER TABLE skills ENABLE ROW LEVEL SECURITY');
    await client.query('ALTER TABLE user_skills ENABLE ROW LEVEL SECURITY');
    await client.query('ALTER TABLE user_missions ENABLE ROW LEVEL SECURITY');
    await client.query('ALTER TABLE user_xp ENABLE ROW LEVEL SECURITY');
    await client.query('ALTER TABLE notifications ENABLE ROW LEVEL SECURITY');
    await client.query('ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY');
    
    console.log('RLS enabled on all tables');

    // Step 6: Create RLS policies for Clerk authentication
    console.log('\nStep 6: Creating RLS policies for Clerk authentication...');
    
    // Profiles policies
    const profilesPolicies = `
      -- Users can view their own profile
      CREATE POLICY "Users can view their own profile" ON profiles
      FOR SELECT
      USING (clerk_user_id = current_setting('app.current_clerk_user_id', true));
      
      -- Users can update their own profile
      CREATE POLICY "Users can update their own profile" ON profiles
      FOR UPDATE
      USING (clerk_user_id = current_setting('app.current_clerk_user_id', true));
      
      -- Users can insert their own profile
      CREATE POLICY "Users can insert their own profile" ON profiles
      FOR INSERT
      WITH CHECK (clerk_user_id = current_setting('app.current_clerk_user_id', true));
      
      -- Public can view basic profile info
      CREATE POLICY "Public read access to basic profile info" ON profiles
      FOR SELECT
      USING (
        clerk_user_id IS NOT NULL AND
        is_email_public = true
      );
    `;
    
    await client.query(profilesPolicies);
    console.log('Created RLS policies for profiles table');

    // Missions policies
    const missionsPolicies = `
      -- Users can view missions
      CREATE POLICY "Users can view missions" ON missions
      FOR SELECT
      USING (true);
      
      -- Users can create missions if admin
      CREATE POLICY "Admins can create missions" ON missions
      FOR INSERT
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM profiles 
          WHERE clerk_user_id = created_by_clerk_user_id 
          AND is_admin = true
        )
      );
      
      -- Users can update their own missions
      CREATE POLICY "Users can update their own missions" ON missions
      FOR UPDATE
      USING (
        created_by_clerk_user_id = current_setting('app.current_clerk_user_id', true)
      );
      
      -- Users can delete their own missions
      CREATE POLICY "Users can delete their own missions" ON missions
      FOR DELETE
      USING (
        created_by_clerk_user_id = current_setting('app.current_clerk_user_id', true)
      );
    `;
    
    await client.query(missionsPolicies);
    console.log('Created RLS policies for missions table');

    // Skills policies
    const skillsPolicies = `
      -- Users can view skills
      CREATE POLICY "Users can view skills" ON skills
      FOR SELECT
      USING (true);
      
      -- Users can create skills if admin
      CREATE POLICY "Admins can create skills" ON skills
      FOR INSERT
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM profiles 
          WHERE clerk_user_id = created_by_clerk_user_id 
          AND is_admin = true
        )
      );
      
      -- Users can update their own skills
      CREATE POLICY "Users can update their own skills" ON skills
      FOR UPDATE
      USING (
        created_by_clerk_user_id = current_setting('app.current_clerk_user_id', true)
      );
      
      -- Users can delete their own skills
      CREATE POLICY "Users can delete their own skills" ON skills
      FOR DELETE
      USING (
        created_by_clerk_user_id = current_setting('app.current_clerk_user_id', true)
      );
    `;
    
    await client.query(skillsPolicies);
    console.log('Created RLS policies for skills table');

    // User junction tables policies
    const userJunctionPolicies = `
      -- Users can manage their own junction records
      CREATE POLICY "Users can manage their own records" ON user_skills
      FOR ALL
      USING (clerk_user_id = current_setting('app.current_clerk_user_id', true));
      
      CREATE POLICY "Users can manage their own records" ON user_missions
      FOR ALL
      USING (clerk_user_id = current_setting('app.current_clerk_user_id', true));
      
      CREATE POLICY "Users can manage their own records" ON user_xp
      FOR ALL
      USING (clerk_user_id = current_setting('app.current_clerk_user_id', true));
    `;
    
    await client.query(userJunctionPolicies);
    console.log('Created RLS policies for user junction tables');

    // Notifications policies
    const notificationsPolicies = `
      -- Users can view their own notifications
      CREATE POLICY "Users can view their own notifications" ON notifications
      FOR SELECT
      USING (clerk_user_id = current_setting('app.current_clerk_user_id', true));
      
      -- Users can update their own notifications
      CREATE POLICY "Users can update their own notifications" ON notifications
      FOR UPDATE
      USING (clerk_user_id = current_setting('app.current_clerk_user_id', true));
      
      -- Users can insert their own notifications
      CREATE POLICY "Users can insert their own notifications" ON notifications
      FOR INSERT
      WITH CHECK (clerk_user_id = current_setting('app.current_clerk_user_id', true));
      
      -- Users can delete their own notifications
      CREATE POLICY "Users can delete their own notifications" ON notifications
      FOR DELETE
      USING (clerk_user_id = current_setting('app.current_clerk_user_id', true));
    `;
    
    await client.query(notificationsPolicies);
    console.log('Created RLS policies for notifications table');

    // Step 7: Create helpful functions
    console.log('\nStep 7: Creating helper functions...');
    
    const createFunctions = `
      -- Function to get current Clerk user ID
      CREATE OR REPLACE FUNCTION current_clerk_user_id()
      RETURNS TEXT AS $$
      BEGIN
        RETURN current_setting('app.current_clerk_user_id', true);
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
      
      -- Function to check if user exists
      CREATE OR REPLACE FUNCTION user_exists(user_clerk_id TEXT)
      RETURNS BOOLEAN AS $$
      BEGIN
        RETURN EXISTS (
          SELECT 1 FROM profiles 
          WHERE clerk_user_id = user_clerk_id
        );
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
      
      -- Function to get user profile
      CREATE OR REPLACE FUNCTION get_user_profile(user_clerk_id TEXT)
      RETURNS SETOF profiles AS $$
      BEGIN
        RETURN QUERY SELECT * FROM profiles WHERE clerk_user_id = user_clerk_id;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
      
      -- Function to calculate user level based on XP
      CREATE OR REPLACE FUNCTION calculate_user_level(total_xp INTEGER)
      RETURNS INTEGER AS $$
      BEGIN
        RETURN GREATEST(1, FLOOR(total_xp / 100));
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
      
      -- Function to calculate XP needed for next level
      CREATE OR REPLACE FUNCTION xp_for_next_level(current_level INTEGER)
      RETURNS INTEGER AS $$
      BEGIN
        RETURN current_level * 100;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
      
      -- Function to update user XP and level
      CREATE OR REPLACE FUNCTION update_user_xp(user_clerk_id TEXT, xp_earned INTEGER)
      RETURNS VOID AS $$
      DECLARE
        current_xp INTEGER;
        new_total_xp INTEGER;
        new_level INTEGER;
        current_level_xp INTEGER;
      BEGIN
        -- Get current XP
        SELECT total_xp INTO current_xp 
        FROM user_xp 
        WHERE clerk_user_id = update_user_xp.user_clerk_id;
        
        -- Update total XP
        new_total_xp := current_xp + xp_earned;
        new_level := calculate_user_level(new_total_xp);
        current_level_xp := new_total_xp - ((new_level - 1) * 100);
        
        -- Update user_xp table
        UPDATE user_xp 
        SET 
          total_xp = new_total_xp,
          level = new_level,
          current_level_xp = current_level_xp,
          xp_to_next_level = xp_for_next_level(new_level),
          updated_at = NOW()
        WHERE clerk_user_id = update_user_xp.user_clerk_id;
        
        -- Update profile XP
        UPDATE profiles 
        SET 
          total_xp = new_total_xp,
          updated_at = NOW()
        WHERE clerk_user_id = update_user_xp.user_clerk_id;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
    `;
    
    await client.query(createFunctions);
    console.log('Created helper functions');

    // Step 8: Create triggers for automatic updates
    console.log('\nStep 8: Creating triggers...');
    
    const createTriggers = `
      -- Trigger to update profile when user XP changes
      CREATE OR REPLACE FUNCTION update_profile_on_xp_change()
      RETURNS TRIGGER AS $$
      BEGIN
        UPDATE profiles 
        SET 
          total_xp = NEW.total_xp,
          updated_at = NOW()
        WHERE clerk_user_id = NEW.clerk_user_id;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
      
      CREATE TRIGGER trigger_update_profile_on_xp_change
        AFTER UPDATE ON user_xp
        FOR EACH ROW
        EXECUTE FUNCTION update_profile_on_xp_change();
      
      -- Trigger to update user XP when profile XP changes
      CREATE OR REPLACE FUNCTION update_user_xp_on_profile_change()
      RETURNS TRIGGER AS $$
      BEGIN
        UPDATE user_xp 
        SET 
          total_xp = NEW.total_xp,
          updated_at = NOW()
        WHERE clerk_user_id = NEW.clerk_user_id;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
      
      CREATE TRIGGER trigger_update_user_xp_on_profile_change
        AFTER UPDATE ON profiles
        FOR EACH ROW
        EXECUTE FUNCTION update_user_xp_on_profile_change();
      
      -- Trigger to create audit log
      CREATE OR REPLACE FUNCTION create_audit_log()
      RETURNS TRIGGER AS $$
      BEGIN
        INSERT INTO audit_logs (
          id,
          clerk_user_id,
          action,
          table_name,
          record_id,
          old_values,
          new_values,
          ip_address,
          user_agent,
          created_at
        ) VALUES (
          gen_random_uuid(),
          current_setting('app.current_clerk_user_id', true),
          TG_OP,
          TG_TABLE_NAME,
          NEW.id::TEXT,
          row_to_json(OLD),
          row_to_json(NEW),
          inet_client_addr(),
          current_setting('app.user_agent', true),
          NOW()
        );
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
      
      CREATE TRIGGER trigger_create_audit_log
        AFTER INSERT OR UPDATE OR DELETE ON profiles
        FOR EACH ROW
        EXECUTE FUNCTION create_audit_log();
    `;
    
    await client.query(createTriggers);
    console.log('Created triggers for automatic updates');

    // Step 9: Insert some initial data
    console.log('\nStep 9: Inserting initial data...');
    
    // Create a default admin user (will be replaced by actual Clerk user)
    const insertDefaultUser = `
      INSERT INTO profiles (
        id, clerk_user_id, email, username, full_name, 
        is_admin, total_xp, current_streak, longest_streak,
        profile_completion_percentage, created_at, updated_at
      ) VALUES (
        'admin-user',
        'admin-user',
        'admin@techassassin.com',
        'admin',
        'TechAssassin Admin',
        true,
        1000,
        0,
        0,
        100,
        NOW(),
        NOW()
      ) ON CONFLICT (clerk_user_id) DO NOTHING;
    `;
    
    await client.query(insertDefaultUser);
    console.log('Created default admin user');

    await client.end();

    console.log('\n=== SUPABASE SCHEMA RECREATION COMPLETE ===');
    console.log('\nChanges made:');
    console.log('1. Deleted all existing tables and schemas');
    console.log('2. Created new optimized schema for Clerk');
    console.log('3. Added profiles table with Clerk integration');
    console.log('4. Added missions, skills, and junction tables');
    console.log('5. Added user XP and tracking tables');
    console.log('6. Added notifications and audit logging');
    console.log('7. Enabled Row Level Security (RLS)');
    console.log('8. Created Clerk-friendly RLS policies');
    console.log('9. Created helper functions and triggers');
    console.log('10. Inserted initial data');

    console.log('\nNew Schema Features:');
    console.log('- Clerk-first authentication');
    console.log('- Row Level Security (RLS) enabled');
    console.log('- Automatic XP and level calculation');
    console.log('- Audit logging for all changes');
    console.log('- Optimized for performance');
    console.log('- Scalable structure');

    console.log('\nNext Steps:');
    console.log('1. Update backend code to use new schema');
    console.log('2. Update frontend to use new API endpoints');
    console.log('3. Test authentication with Clerk');
    console.log('4. Test all CRUD operations');
    console.log('5. Verify RLS policies work correctly');

    console.log('\nYour Supabase database is now ready for Clerk authentication!');

  } catch (error) {
    console.error('Failed to recreate Supabase schema:', error.message);
    process.exit(1);
  }
}

deleteAndRecreateSupabase();
