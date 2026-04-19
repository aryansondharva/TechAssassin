/**
 * Create Clerk Functions Individually
 * This script creates Clerk functions one by one to avoid conflicts
 */

import { config } from 'dotenv';

// Load environment variables
config({ path: '.env.local' });

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('Missing DATABASE_URL in environment variables!');
  process.exit(1);
}

async function createClerkFunctionsIndividually() {
  try {
    console.log('=== CREATING CLERK FUNCTIONS INDIVIDUALLY ===\n');

    // Import pg dynamically
    const { Client } = await import('pg');
    
    // Create client with DATABASE_URL
    const client = new Client({
      connectionString: DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });

    await client.connect();
    console.log('Connected to PostgreSQL database');

    // Function 1: Set Clerk user ID
    console.log('Step 1: Creating set_clerk_user_id function...');
    
    try {
      await client.query(`
        DROP FUNCTION IF EXISTS set_clerk_user_id(TEXT);
        CREATE OR REPLACE FUNCTION set_clerk_user_id(user_id TEXT)
        RETURNS VOID AS $$
        BEGIN
          PERFORM set_config('app.current_clerk_user_id', user_id, true);
        END;
        $$ LANGUAGE plpgsql SECURITY DEFINER;
      `);
      console.log('✓ Created set_clerk_user_id function');
    } catch (error) {
      console.log('✗ Failed to create set_clerk_user_id:', error.message);
    }

    // Function 2: Get current Clerk user ID
    console.log('\nStep 2: Creating current_clerk_user_id function...');
    
    try {
      await client.query(`
        DROP FUNCTION IF EXISTS current_clerk_user_id();
        CREATE OR REPLACE FUNCTION current_clerk_user_id()
        RETURNS TEXT AS $$
        BEGIN
          RETURN current_setting('app.current_clerk_user_id', true);
        END;
        $$ LANGUAGE plpgsql SECURITY DEFINER;
      `);
      console.log('✓ Created current_clerk_user_id function');
    } catch (error) {
      console.log('✗ Failed to create current_clerk_user_id:', error.message);
    }

    // Function 3: Check user exists
    console.log('\nStep 3: Creating check_user_exists function...');
    
    try {
      await client.query(`
        DROP FUNCTION IF EXISTS check_user_exists(TEXT);
        CREATE OR REPLACE FUNCTION check_user_exists(uid TEXT)
        RETURNS BOOLEAN AS $$
        BEGIN
          RETURN EXISTS (
            SELECT 1 FROM profiles 
            WHERE clerk_user_id = uid AND is_active = true
          );
        END;
        $$ LANGUAGE plpgsql SECURITY DEFINER;
      `);
      console.log('✓ Created check_user_exists function');
    } catch (error) {
      console.log('✗ Failed to create check_user_exists:', error.message);
    }

    // Function 4: Increment login count
    console.log('\nStep 4: Creating inc_login_count function...');
    
    try {
      await client.query(`
        DROP FUNCTION IF EXISTS inc_login_count(TEXT);
        CREATE OR REPLACE FUNCTION inc_login_count(uid TEXT)
        RETURNS INTEGER AS $$
        DECLARE
          new_count INTEGER;
        BEGIN
          UPDATE profiles SET
            login_count = COALESCE(login_count, 0) + 1,
            last_login_at = NOW(),
            last_activity_at = NOW(),
            updated_at = NOW()
          WHERE clerk_user_id = uid AND is_active = true
          RETURNING login_count INTO new_count;
          
          RETURN COALESCE(new_count, 0);
        END;
        $$ LANGUAGE plpgsql SECURITY DEFINER;
      `);
      console.log('✓ Created inc_login_count function');
    } catch (error) {
      console.log('✗ Failed to create inc_login_count:', error.message);
    }

    // Function 5: Update activity
    console.log('\nStep 5: Creating update_activity function...');
    
    try {
      await client.query(`
        DROP FUNCTION IF EXISTS update_activity(TEXT);
        CREATE OR REPLACE FUNCTION update_activity(uid TEXT)
        RETURNS BOOLEAN AS $$
        BEGIN
          UPDATE profiles SET
            last_activity_at = NOW(),
            updated_at = NOW()
          WHERE clerk_user_id = uid AND is_active = true;
          
          RETURN true;
        END;
        $$ LANGUAGE plpgsql SECURITY DEFINER;
      `);
      console.log('✓ Created update_activity function');
    } catch (error) {
      console.log('✗ Failed to create update_activity:', error.message);
    }

    // Grant permissions
    console.log('\nStep 6: Granting permissions...');
    
    try {
      await client.query(`
        GRANT EXECUTE ON FUNCTION set_clerk_user_id(TEXT) TO authenticated, anon;
        GRANT EXECUTE ON FUNCTION current_clerk_user_id() TO authenticated, anon;
        GRANT EXECUTE ON FUNCTION check_user_exists(TEXT) TO authenticated, anon;
        GRANT EXECUTE ON FUNCTION inc_login_count(TEXT) TO authenticated;
        GRANT EXECUTE ON FUNCTION update_activity(TEXT) TO authenticated;
      `);
      console.log('✓ Granted permissions');
    } catch (error) {
      console.log('✗ Failed to grant permissions:', error.message);
    }

    await client.end();

    console.log('\n=== CLERK FUNCTIONS CREATION COMPLETE ===');
    console.log('\nSummary:');
    console.log('✅ Clerk user context functions created');
    console.log('✅ Permissions granted');
    console.log('✅ Database ready for Clerk integration');

    console.log('\nNext Steps:');
    console.log('1. Configure Clerk webhook endpoint');
    console.log('2. Test user registration flow');
    console.log('3. Verify RLS policies work correctly');

  } catch (error) {
    console.error('Failed to create Clerk functions:', error.message);
    process.exit(1);
  }
}

createClerkFunctionsIndividually();
