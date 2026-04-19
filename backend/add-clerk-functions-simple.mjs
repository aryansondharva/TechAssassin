/**
 * Add Simple Clerk Context Functions to Supabase
 * This script adds essential database functions for Clerk integration
 */

import { config } from 'dotenv';

// Load environment variables
config({ path: '.env.local' });

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('Missing DATABASE_URL in environment variables!');
  process.exit(1);
}

async function addSimpleClerkFunctions() {
  try {
    console.log('=== ADDING SIMPLE CLERK FUNCTIONS ===\n');

    // Import pg dynamically
    const { Client } = await import('pg');
    
    // Create client with DATABASE_URL
    const client = new Client({
      connectionString: DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });

    await client.connect();
    console.log('Connected to PostgreSQL database');

    // Step 1: Create essential Clerk functions
    console.log('Step 1: Creating essential Clerk functions...');
    
    const createFunctions = `
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
      CREATE OR REPLACE FUNCTION check_user_exists(uid TEXT)
      RETURNS BOOLEAN AS $$
      BEGIN
        RETURN EXISTS (
          SELECT 1 FROM profiles 
          WHERE clerk_user_id = uid AND is_active = true
        );
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
      
      -- Function to increment login count
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
      
      -- Function to update last activity
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
    `;
    
    await client.query(createFunctions);
    console.log('Created essential Clerk functions');

    // Step 2: Grant permissions
    console.log('\nStep 2: Granting permissions...');
    
    const grantPermissions = `
      -- Grant execute permissions on functions
      GRANT EXECUTE ON FUNCTION set_clerk_user_id(TEXT) TO authenticated, anon;
      GRANT EXECUTE ON FUNCTION current_clerk_user_id() TO authenticated, anon;
      GRANT EXECUTE ON FUNCTION check_user_exists(TEXT) TO authenticated, anon;
      GRANT EXECUTE ON FUNCTION inc_login_count(TEXT) TO authenticated;
      GRANT EXECUTE ON FUNCTION update_activity(TEXT) TO authenticated;
    `;
    
    await client.query(grantPermissions);
    console.log('Granted permissions');

    await client.end();

    console.log('\n=== SIMPLE CLERK FUNCTIONS ADDED ===');
    console.log('\nFunctions Created:');
    console.log('1. set_clerk_user_id(user_id) - Set current user for RLS');
    console.log('2. current_clerk_user_id() - Get current user ID');
    console.log('3. check_user_exists(uid) - Check if user exists');
    console.log('4. inc_login_count(uid) - Increment login count');
    console.log('5. update_activity(uid) - Update activity timestamp');

    console.log('\nFeatures Enabled:');
    console.log('✅ Clerk user context for RLS policies');
    console.log('✅ User existence checking');
    console.log('✅ Login count tracking');
    console.log('✅ Activity timestamp updates');

    console.log('\nYour database is now ready for basic Clerk integration!');

  } catch (error) {
    console.error('Failed to add simple Clerk functions:', error.message);
    process.exit(1);
  }
}

addSimpleClerkFunctions();
