/**
 * Add Clerk Context Functions to Supabase
 * This script adds database functions for Clerk user context
 */

import { config } from 'dotenv';

// Load environment variables
config({ path: '.env.local' });

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('Missing DATABASE_URL in environment variables!');
  process.exit(1);
}

async function addClerkContextFunctions() {
  try {
    console.log('=== ADDING CLERK CONTEXT FUNCTIONS ===\n');

    // Import pg dynamically
    const { Client } = await import('pg');
    
    // Create client with DATABASE_URL
    const client = new Client({
      connectionString: DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });

    await client.connect();
    console.log('Connected to PostgreSQL database');

    // Step 1: Create Clerk user context functions
    console.log('Step 1: Creating Clerk user context functions...');
    
    const createClerkFunctions = `
      -- Function to set current Clerk user ID for RLS policies
      CREATE OR REPLACE FUNCTION set_clerk_user_id(user_id TEXT)
      RETURNS VOID AS $$
      BEGIN
        PERFORM set_config('app.current_clerk_user_id', user_id, true);
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
      
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
          WHERE clerk_user_id = user_clerk_id AND is_active = true
        );
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
      
      -- Function to get user profile
      CREATE OR REPLACE FUNCTION get_user_profile(user_clerk_id TEXT)
      RETURNS SETOF profiles AS $$
      BEGIN
        RETURN QUERY SELECT * FROM profiles 
        WHERE clerk_user_id = user_clerk_id AND is_active = true;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
      
      -- Function to update user XP and level
      CREATE OR REPLACE FUNCTION update_user_xp(user_id TEXT, xp_change INTEGER, description TEXT)
      RETURNS TABLE (
        success BOOLEAN,
        new_total_xp INTEGER,
        new_level INTEGER,
        new_rank_tier TEXT
      ) AS $$
      DECLARE
        current_xp INTEGER;
        new_xp INTEGER;
        new_level INTEGER;
        new_rank TEXT;
      BEGIN
        -- Get current XP
        SELECT total_xp INTO current_xp 
        FROM profiles 
        WHERE clerk_user_id = user_id AND is_active = true;
        
        IF current_xp IS NULL THEN
          RETURN QUERY SELECT false, 0, 1, 'Bronze';
          RETURN;
        END IF;
        
        -- Calculate new XP
        new_xp := current_xp + xp_change;
        
        -- Calculate new level
        new_level := GREATEST(1, FLOOR(new_xp / 100));
        
        -- Calculate new rank
        IF new_level >= 100 THEN
          new_rank := 'Legendary';
        ELSIF new_level >= 50 THEN
          new_rank := 'Master';
        ELSIF new_level >= 25 THEN
          new_rank := 'Expert';
        ELSIF new_level >= 10 THEN
          new_rank := 'Advanced';
        ELSIF new_level >= 5 THEN
          new_rank := 'Intermediate';
        ELSE
          new_rank := 'Bronze';
        END IF;
        
        -- Update profile
        UPDATE profiles SET
          total_xp = new_xp,
          current_level = new_level,
          xp_to_next_level = new_level * 100,
          current_level_xp = new_xp - ((new_level - 1) * 100),
          rank_tier = new_rank,
          updated_at = NOW()
        WHERE clerk_user_id = user_id AND is_active = true;
        
        -- Create XP transaction
        INSERT INTO xp_transactions (
          clerk_user_id, amount, transaction_type, source_type, 
          description, reason, status, created_at, processed_at
        ) VALUES (
          user_id, xp_change, 
          CASE WHEN xp_change > 0 THEN 'earned' ELSE 'spent' END,
          'system', description, description, 'completed', NOW(), NOW()
        );
        
        RETURN QUERY SELECT true, new_xp, new_level, new_rank;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
      
      -- Function to create user notification
      CREATE OR REPLACE FUNCTION create_notification(
        recipient_user_id TEXT,
        notification_title TEXT,
        notification_message TEXT,
        notification_priority TEXT DEFAULT 'normal'
      )
      RETURNS BOOLEAN AS $$
      BEGIN
        INSERT INTO notifications (
          recipient_clerk_user_id, title, message, priority,
          in_app, email, created_at, updated_at
        ) VALUES (
          recipient_user_id, notification_title, notification_message, 
          notification_priority, true, false, NOW(), NOW()
        );
        
        RETURN true;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
      
      -- Function to increment login count
      CREATE OR REPLACE FUNCTION increment_login_count(user_clerk_id TEXT)
      RETURNS INTEGER AS $$
      DECLARE
        new_count INTEGER;
      BEGIN
        UPDATE profiles SET
          login_count = COALESCE(login_count, 0) + 1,
          last_login_at = NOW(),
          last_activity_at = NOW(),
          updated_at = NOW()
        WHERE clerk_user_id = user_clerk_id AND is_active = true
        RETURNING login_count INTO new_count;
        
        RETURN COALESCE(new_count, 0);
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
      
      -- Function to update last activity
      CREATE OR REPLACE FUNCTION update_last_activity(user_clerk_id TEXT)
      RETURNS BOOLEAN AS $$
      BEGIN
        UPDATE profiles SET
          last_activity_at = NOW(),
          updated_at = NOW()
        WHERE clerk_user_id = user_clerk_id AND is_active = true;
        
        RETURN true;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
      
      -- Function to check user permission
      CREATE OR REPLACE FUNCTION user_has_permission(user_clerk_id TEXT, permission_name TEXT)
      RETURNS BOOLEAN AS $$
      BEGIN
        -- Admin users have all permissions
        IF EXISTS (
          SELECT 1 FROM profiles 
          WHERE clerk_user_id = user_clerk_id 
          AND is_admin = true 
          AND is_active = true
        ) THEN
          RETURN true;
        END IF;
        
        -- Check specific permissions here in the future
        -- For now, return false for non-admin users
        RETURN false;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
      
      -- Function to get user stats
      CREATE OR REPLACE FUNCTION get_user_stats(user_clerk_id TEXT)
      RETURNS TABLE (
        total_missions INTEGER,
        completed_missions INTEGER,
        total_skills INTEGER,
        total_xp INTEGER,
        current_level INTEGER,
        rank_tier TEXT,
        login_count INTEGER,
        followers_count INTEGER,
        following_count INTEGER
      ) AS $$
      BEGIN
        RETURN QUERY
        SELECT 
          COALESCE(mission_counts.total, 0) as total_missions,
          COALESCE(mission_counts.completed, 0) as completed_missions,
          COALESCE(skill_counts.total, 0) as total_skills,
          COALESCE(p.total_xp, 0) as total_xp,
          COALESCE(p.current_level, 1) as current_level,
          COALESCE(p.rank_tier, 'Bronze') as rank_tier,
          COALESCE(p.login_count, 0) as login_count,
          COALESCE(follower_counts.followers, 0) as followers_count,
          COALESCE(following_counts.following, 0) as following_count
        FROM profiles p
        LEFT JOIN (
          SELECT 
            clerk_user_id,
            COUNT(*) as total,
            COUNT(*) FILTER (WHERE status = 'completed') as completed
          FROM user_missions 
          WHERE clerk_user_id = user_clerk_id
          GROUP BY clerk_user_id
        ) mission_counts ON p.clerk_user_id = mission_counts.clerk_user_id
        LEFT JOIN (
          SELECT 
            clerk_user_id,
            COUNT(*) as total
          FROM user_skills 
          WHERE clerk_user_id = user_clerk_id
          GROUP BY clerk_user_id
        ) skill_counts ON p.clerk_user_id = skill_counts.clerk_user_id
        LEFT JOIN (
          SELECT 
            following_clerk_user_id,
            COUNT(*) as followers
          FROM follows 
          WHERE following_clerk_user_id = user_clerk_id 
          AND status = 'accepted'
          GROUP BY following_clerk_user_id
        ) follower_counts ON p.clerk_user_id = follower_counts.following_clerk_user_id
        LEFT JOIN (
          SELECT 
            follower_clerk_user_id,
            COUNT(*) as following
          FROM follows 
          WHERE follower_clerk_user_id = user_clerk_id 
          AND status = 'accepted'
          GROUP BY follower_clerk_user_id
        ) following_counts ON p.clerk_user_id = following_counts.follower_clerk_user_id
        WHERE p.clerk_user_id = user_clerk_id AND p.is_active = true;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
    `;
    
    await client.query(createClerkFunctions);
    console.log('Created Clerk context functions');

    // Step 2: Create triggers for automatic updates
    console.log('\nStep 2: Creating triggers for automatic updates...');
    
    const createTriggers = `
      -- Trigger to update profile completion percentage
      CREATE OR REPLACE FUNCTION update_profile_completion()
      RETURNS TRIGGER AS $$
      DECLARE
        completion INTEGER := 0;
      BEGIN
        -- Calculate profile completion percentage
        completion := 0;
        
        -- Basic info (30%)
        IF NEW.first_name IS NOT NULL THEN completion := completion + 10; END IF;
        IF NEW.last_name IS NOT NULL THEN completion := completion + 10; END IF;
        IF NEW.bio IS NOT NULL THEN completion := completion + 10; END IF;
        
        -- Contact info (20%)
        IF NEW.email IS NOT NULL THEN completion := completion + 10; END IF;
        IF NEW.phone IS NOT NULL THEN completion := completion + 10; END IF;
        
        -- Professional info (20%)
        IF NEW.job_title IS NOT NULL THEN completion := completion + 10; END IF;
        IF NEW.company IS NOT NULL THEN completion := completion + 10; END IF;
        
        -- Skills (15%)
        IF NEW.skills IS NOT NULL AND array_length(NEW.skills, 1) > 0 THEN completion := completion + 15; END IF;
        
        -- Social links (15%)
        IF NEW.github_url IS NOT NULL OR NEW.linkedin_url IS NOT NULL THEN completion := completion + 15; END IF;
        
        NEW.profile_completion_percentage := LEAST(completion, 100);
        NEW.updated_at := NOW();
        
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
      
      -- Create trigger for profile completion
      DROP TRIGGER IF EXISTS trigger_update_profile_completion ON profiles;
      CREATE TRIGGER trigger_update_profile_completion
        BEFORE INSERT OR UPDATE ON profiles
        FOR EACH ROW
        EXECUTE FUNCTION update_profile_completion();
      
      -- Trigger to update XP and level automatically
      CREATE OR REPLACE FUNCTION auto_update_xp_level()
      RETURNS TRIGGER AS $$
      DECLARE
        new_level INTEGER;
        xp_for_next INTEGER;
        current_level_xp INTEGER;
      BEGIN
        -- Calculate new level
        new_level := GREATEST(1, FLOOR(NEW.total_xp / 100));
        xp_for_next := new_level * 100;
        current_level_xp := NEW.total_xp - ((new_level - 1) * 100);
        
        -- Update profile
        NEW.current_level := new_level;
        NEW.xp_to_next_level := xp_for_next;
        NEW.current_level_xp := current_level_xp;
        NEW.updated_at := NOW();
        
        -- Update rank tier based on level
        IF new_level >= 100 THEN
          NEW.rank_tier := 'Legendary';
        ELSIF new_level >= 50 THEN
          NEW.rank_tier := 'Master';
        ELSIF new_level >= 25 THEN
          NEW.rank_tier := 'Expert';
        ELSIF new_level >= 10 THEN
          NEW.rank_tier := 'Advanced';
        ELSIF new_level >= 5 THEN
          NEW.rank_tier := 'Intermediate';
        ELSE
          NEW.rank_tier := 'Bronze';
        END IF;
        
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
      
      -- Create trigger for XP and level updates
      DROP TRIGGER IF EXISTS trigger_auto_update_xp_level ON profiles;
      CREATE TRIGGER trigger_auto_update_xp_level
        BEFORE UPDATE OF total_xp ON profiles
        FOR EACH ROW
        EXECUTE FUNCTION auto_update_xp_level();
      
      -- Trigger to update activity timestamp
      CREATE OR REPLACE FUNCTION auto_update_activity()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.last_activity_at := NOW();
        NEW.updated_at := NOW();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
      
      -- Create trigger for activity updates
      DROP TRIGGER IF EXISTS trigger_auto_update_activity ON profiles;
      CREATE TRIGGER trigger_auto_update_activity
        BEFORE UPDATE ON profiles
        FOR EACH ROW
        EXECUTE FUNCTION auto_update_activity();
    `;
    
    await client.query(createTriggers);
    console.log('Created automatic update triggers');

    // Step 3: Grant necessary permissions
    console.log('\nStep 3: Granting permissions...');
    
    const grantPermissions = `
      -- Grant execute permissions on functions
      GRANT EXECUTE ON FUNCTION set_clerk_user_id(TEXT) TO authenticated, anon;
      GRANT EXECUTE ON FUNCTION current_clerk_user_id() TO authenticated, anon;
      GRANT EXECUTE ON FUNCTION user_exists(TEXT) TO authenticated, anon;
      GRANT EXECUTE ON FUNCTION get_user_profile(TEXT) TO authenticated;
      GRANT EXECUTE ON FUNCTION update_user_xp(TEXT, INTEGER, TEXT) TO authenticated;
      GRANT EXECUTE ON FUNCTION create_notification(TEXT, TEXT, TEXT, TEXT) TO authenticated;
      GRANT EXECUTE ON FUNCTION increment_login_count(TEXT) TO authenticated;
      GRANT EXECUTE ON FUNCTION update_last_activity(TEXT) TO authenticated;
      GRANT EXECUTE ON FUNCTION user_has_permission(TEXT, TEXT) TO authenticated;
      GRANT EXECUTE ON FUNCTION get_user_stats(TEXT) TO authenticated;
    `;
    
    await client.query(grantPermissions);
    console.log('Granted necessary permissions');

    await client.end();

    console.log('\n=== CLERK CONTEXT FUNCTIONS ADDED ===');
    console.log('\nFunctions Created:');
    console.log('1. set_clerk_user_id() - Set current user for RLS');
    console.log('2. current_clerk_user_id() - Get current user ID');
    console.log('3. user_exists() - Check if user exists');
    console.log('4. get_user_profile() - Get user profile');
    console.log('5. update_user_xp() - Update XP and level');
    console.log('6. create_notification() - Create notification');
    console.log('7. increment_login_count() - Increment login count');
    console.log('8. update_last_activity() - Update activity timestamp');
    console.log('9. user_has_permission() - Check user permissions');
    console.log('10. get_user_stats() - Get comprehensive user stats');

    console.log('\nTriggers Created:');
    console.log('1. trigger_update_profile_completion - Auto-calculate profile completion');
    console.log('2. trigger_auto_update_xp_level - Auto-update XP and level');
    console.log('3. trigger_auto_update_activity - Auto-update activity timestamp');

    console.log('\nFeatures Enabled:');
    console.log('✅ Clerk user context for RLS policies');
    console.log('✅ Automatic XP and level calculations');
    console.log('✅ Profile completion tracking');
    console.log('✅ Activity timestamp updates');
    console.log('✅ User permission checking');
    console.log('✅ Comprehensive user statistics');

    console.log('\nYour database is now ready for Clerk integration!');

  } catch (error) {
    console.error('Failed to add Clerk context functions:', error.message);
    process.exit(1);
  }
}

addClerkContextFunctions();
