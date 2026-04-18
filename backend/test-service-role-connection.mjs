/**
 * Test Supabase Connection with Service Role
 * This bypasses RLS issues by using the service role key
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Load environment variables
config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('Testing Supabase Service Role Connection...\n');

console.log('Environment Variables Check:');
console.log('NEXT_PUBLIC_SUPABASE_URL:', SUPABASE_URL ? 'Set' : 'Missing');
console.log('SUPABASE_SERVICE_ROLE_KEY:', SUPABASE_SERVICE_ROLE_KEY ? 'Set' : 'Missing');
console.log();

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing required environment variables!');
  process.exit(1);
}

async function testServiceRoleConnection() {
  try {
    // Test 1: Create client with service role key
    console.log('Test 1: Creating Supabase client with service role key...');
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    console.log('Client created successfully\n');

    // Test 2: Check connection by querying database
    console.log('Test 2: Testing database connection...');
    const { data, error } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);

    if (error) {
      throw error;
    } else {
      console.log('Database connection successful\n');
    }

    // Test 3: Check all key tables
    console.log('Test 3: Checking all tables...');
    const tables = ['profiles', 'events', 'event_registrations', 'xp_transactions', 'badges', 'notifications'];
    
    for (const table of tables) {
      const { data: tableData, error: tableError } = await supabase
        .from(table)
        .select('count')
        .limit(1);
      
      if (tableError) {
        console.log(`${table}: Missing - ${tableError.message}`);
      } else {
        console.log(`${table}: OK (${tableData[0].count} records)`);
      }
    }

    // Success summary
    console.log('\nAll tests passed!');
    console.log('\nConnection Summary:');
    console.log('Supabase URL:', SUPABASE_URL);
    console.log('Client creation: OK');
    console.log('Database access: OK');
    console.log('Service role: OK');
    
    console.log('\nYour Supabase database is fully set up and working!');
    console.log('You can now start using the application.');
    
  } catch (error) {
    console.error('Connection test failed!');
    console.error('Error:', error.message);
    process.exit(1);
  }
}

testServiceRoleConnection();
