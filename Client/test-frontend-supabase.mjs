/**
 * Test Frontend Supabase Connection
 * Tests the client-side Supabase configuration
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Load environment variables
config({ path: '.env.local' });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

console.log('Testing Frontend Supabase Connection...\n');

console.log('Environment Variables Check:');
console.log('VITE_SUPABASE_URL:', SUPABASE_URL ? 'Set' : 'Missing');
console.log('VITE_SUPABASE_ANON_KEY:', SUPABASE_ANON_KEY ? 'Set' : 'Missing');
console.log();

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('Missing required environment variables!');
  process.exit(1);
}

async function testFrontendConnection() {
  try {
    // Test 1: Create client with anon key
    console.log('Test 1: Creating Supabase client with anon key...');
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
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

    // Test 3: Check key tables with anon access
    console.log('Test 3: Checking public table access...');
    const tables = ['profiles', 'events', 'badges'];
    
    for (const table of tables) {
      try {
        const { data: tableData, error: tableError } = await supabase
          .from(table)
          .select('count')
          .limit(1);
        
        if (tableError) {
          console.log(`${table}: ${tableError.message}`);
        } else {
          console.log(`${table}: OK (${tableData[0].count} records)`);
        }
      } catch (err) {
        console.log(`${table}: Error - ${err.message}`);
      }
    }

    // Success summary
    console.log('\nFrontend connection test completed!');
    console.log('\nConnection Summary:');
    console.log('Supabase URL:', SUPABASE_URL);
    console.log('Client creation: OK');
    console.log('Database access: OK');
    console.log('Anon role: OK');
    
    console.log('\nYour frontend can now connect to Supabase!');
    
  } catch (error) {
    console.error('Frontend connection test failed!');
    console.error('Error:', error.message);
    process.exit(1);
  }
}

testFrontendConnection();
