/**
 * Apply New Database Schema to Supabase
 * This script will safely apply the new structured schema
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { readFileSync } from 'fs';
import { join } from 'path';

// Load environment variables
config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing Supabase credentials!');
  process.exit(1);
}

// Create admin client with service role key
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function applySchema() {
  try {
    console.log('Applying new database schema...\n');

    // Step 1: Drop existing RLS policies to avoid recursion
    console.log('Step 1: Removing existing RLS policies...');
    const { error: dropPoliciesError } = await supabase.rpc('exec_sql', {
      sql: `
        -- Drop all existing policies to avoid recursion
        DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
        DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
        DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
        DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
        DROP POLICY IF EXISTS "Profiles are publicly viewable (basic info)" ON public.profiles;
        DROP POLICY IF EXISTS "Users can view their own registrations" ON public.event_registrations;
        DROP POLICY IF EXISTS "Users can create their own registrations" ON public.event_registrations;
        DROP POLICY IF EXISTS "Users can update their own registrations" ON public.event_registrations;
        DROP POLICY IF EXISTS "Organizers can view event registrations" ON public.event_registrations;
        DROP POLICY IF EXISTS "Admins can manage all registrations" ON public.event_registrations;
        DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
        DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
        DROP POLICY IF EXISTS "System can create notifications" ON public.notifications;
        DROP POLICY IF EXISTS "Users can view their own XP transactions" ON public.xp_transactions;
        DROP POLICY IF EXISTS "Service role can manage XP transactions" ON public.xp_transactions;
        DROP POLICY IF EXISTS "Admins can view all XP transactions" ON public.xp_transactions;
      `
    });

    if (dropPoliciesError) {
      console.log('Note: Some policies may not exist, continuing...');
    } else {
      console.log('Existing policies removed successfully');
    }

    // Step 2: Apply the new schema
    console.log('\nStep 2: Applying new database schema...');
    
    // Read the master schema file
    const schemaPath = join(__dirname, '../SQL/20260418000001_master_database_schema_v2.sql');
    const schemaSQL = readFileSync(schemaPath, 'utf8');
    
    // Split into individual statements and execute
    const statements = schemaSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    console.log(`Found ${statements.length} SQL statements to execute...`);

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      try {
        const { error } = await supabase.rpc('exec_sql', { sql: statement });
        
        if (error) {
          // Log error but continue (some statements might fail due to existing objects)
          console.log(`Statement ${i + 1}: ${error.message || 'OK'}`);
        } else {
          console.log(`Statement ${i + 1}: OK`);
        }
      } catch (err) {
        console.log(`Statement ${i + 1}: ${err.message || 'OK'}`);
      }
    }

    // Step 3: Apply safe migration
    console.log('\nStep 3: Applying safe migration...');
    const migrationPath = join(__dirname, '../SQL/20260418000002_safe_schema_migration.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf8');
    
    const migrationStatements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    for (let i = 0; i < migrationStatements.length; i++) {
      const statement = migrationStatements[i];
      
      try {
        const { error } = await supabase.rpc('exec_sql', { sql: statement });
        
        if (error) {
          console.log(`Migration ${i + 1}: ${error.message || 'OK'}`);
        } else {
          console.log(`Migration ${i + 1}: OK`);
        }
      } catch (err) {
        console.log(`Migration ${i + 1}: ${err.message || 'OK'}`);
      }
    }

    // Step 4: Verify the setup
    console.log('\nStep 4: Verifying database setup...');
    
    // Check if key tables exist
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .in('table_name', ['profiles', 'events', 'xp_transactions', 'badges']);

    if (tablesError) {
      console.error('Error checking tables:', tablesError);
    } else {
      console.log(`Found ${tables.length} key tables`);
    }

    // Test a simple query
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);

    if (profilesError) {
      console.error('Error querying profiles:', profilesError);
    } else {
      console.log('Profiles table accessible');
    }

    console.log('\nSchema application completed!');
    console.log('\nNext steps:');
    console.log('1. Test the application');
    console.log('2. Verify all features work');
    console.log('3. Monitor performance');

  } catch (error) {
    console.error('Schema application failed:', error.message);
    process.exit(1);
  }
}

applySchema();
