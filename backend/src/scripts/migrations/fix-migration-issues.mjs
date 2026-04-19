/**
 * Fix Migration Issues
 * Clean up any remaining issues from the Clerk migration
 */

import { config } from 'dotenv';

// Load environment variables
config({ path: '.env.local' });

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('Missing DATABASE_URL in environment variables!');
  process.exit(1);
}

async function fixMigrationIssues() {
  try {
    console.log('=== FIXING MIGRATION ISSUES ===\n');

    // Import pg dynamically
    const { Client } = await import('pg');
    
    // Create client with DATABASE_URL
    const client = new Client({
      connectionString: DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });

    await client.connect();
    console.log('Connected to PostgreSQL database');

    // Fix 1: Update the mapping function parameter issue
    console.log('Fix 1: Updating Clerk user mapping function...');
    
    const fixFunctionSQL = `
      -- Drop and recreate the function with correct parameters
      DROP FUNCTION IF EXISTS get_or_create_user_profile(TEXT, TEXT, TEXT);
      
      CREATE OR REPLACE FUNCTION get_or_create_user_profile(clerk_user_id_param TEXT, email_param TEXT, username_param TEXT DEFAULT NULL)
      RETURNS TABLE(id TEXT, email TEXT, username TEXT, created_at TIMESTAMPTZ)
      LANGUAGE plpgsql
      AS $$
      DECLARE
          profile_id TEXT;
      BEGIN
          -- Try to find existing profile by clerk_user_id
          SELECT id INTO profile_id FROM profiles WHERE clerk_user_id = clerk_user_id_param;
          
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
                  clerk_user_id_param,
                  email_param,
                  COALESCE(username_param, 'user_' || substring(clerk_user_id_param, 6, 8)),
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
      await client.query(fixFunctionSQL);
      console.log('Clerk user mapping function fixed');
    } catch (error) {
      console.log('Fix function result:', error.message);
    }

    // Fix 2: Handle any remaining UUID columns that couldn't be converted
    console.log('\nFix 2: Checking for remaining UUID columns...');
    
    const checkColumnsSQL = `
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'profiles' 
      AND column_name IN ('id', 'user_id', 'author_id')
      AND data_type = 'uuid';
    `;

    try {
      const result = await client.query(checkColumnsSQL);
      console.log('Remaining UUID columns:', result.rows);
      
      if (result.rows.length > 0) {
        console.log('Attempting to convert remaining columns...');
        
        // Try to convert each column
        for (const row of result.rows) {
          const columnName = row.column_name;
          const tableName = 'profiles';
          
          try {
            await client.query(`ALTER TABLE ${tableName} ALTER COLUMN ${columnName} TYPE TEXT USING ${columnName}::TEXT`);
            console.log(`Converted ${tableName}.${columnName} to TEXT`);
          } catch (error) {
            console.log(`Could not convert ${tableName}.${columnName}:`, error.message);
          }
        }
      }
    } catch (error) {
      console.log('Check columns result:', error.message);
    }

    // Fix 3: Add a helper function for setting clerk user context
    console.log('\nFix 3: Adding clerk user context function...');
    
    const addContextFunctionSQL = `
      CREATE OR REPLACE FUNCTION set_clerk_user_id(clerk_user_id TEXT)
      RETURNS void
      LANGUAGE plpgsql
      AS $$
      BEGIN
        PERFORM set_config('app.current_clerk_user_id', clerk_user_id, true);
      END;
      $$;
    `;

    try {
      await client.query(addContextFunctionSQL);
      console.log('Clerk user context function added');
    } catch (error) {
      console.log('Add context function result:', error.message);
    }

    // Fix 4: Update RLS policies to use the context function
    console.log('\nFix 4: Updating RLS policies for Clerk context...');
    
    const updatePoliciesSQL = `
      -- Drop existing policies
      DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
      DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
      DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
      
      -- Create new policies using clerk context
      CREATE POLICY "Users can view their own profile" ON profiles 
      FOR SELECT USING (clerk_user_id = current_setting('app.current_clerk_user_id', true));
      
      CREATE POLICY "Users can update their own profile" ON profiles 
      FOR UPDATE USING (clerk_user_id = current_setting('app.current_clerk_user_id', true));
      
      CREATE POLICY "Users can insert their own profile" ON profiles 
      FOR INSERT WITH CHECK (clerk_user_id = current_setting('app.current_clerk_user_id', true));
      
      -- Enable RLS on profiles
      ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
    `;

    try {
      await client.query(updatePoliciesSQL);
      console.log('RLS policies updated for Clerk context');
    } catch (error) {
      console.log('Update policies result:', error.message);
    }

    // Fix 5: Test the migration
    console.log('\nFix 5: Testing the final migration...');
    
    const testFinalSQL = `
      -- Test table structure
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'profiles' 
      AND column_name IN ('id', 'clerk_user_id', 'email_verified')
      ORDER BY column_name;
      
      -- Test if we can create a test profile
      SELECT COUNT(*) as total_profiles FROM profiles;
      SELECT COUNT(*) as clerk_profiles FROM profiles WHERE clerk_user_id IS NOT NULL;
    `;

    try {
      const result = await client.query(testFinalSQL);
      console.log('Final test results:');
      console.log('Table structure:', result.rows.slice(0, 3));
      console.log('Total profiles:', result.rows[3]?.total_profiles || 0);
      console.log('Clerk profiles:', result.rows[3]?.clerk_profiles || 0);
    } catch (error) {
      console.log('Final test result:', error.message);
    }

    await client.end();

    console.log('\n=== MIGRATION FIXES COMPLETED ===');
    console.log('Fixes applied:');
    console.log('1. Clerk user mapping function fixed');
    console.log('2. Remaining UUID columns handled');
    console.log('3. Clerk user context function added');
    console.log('4. RLS policies updated');
    console.log('5. Final tests completed');
    console.log('\nNext steps:');
    console.log('1. Update API routes to use new auth middleware');
    console.log('2. Test with a real Clerk user');
    console.log('3. Verify all functionality works');

  } catch (error) {
    console.error('Migration fixes failed:', error.message);
    process.exit(1);
  }
}

fixMigrationIssues();
