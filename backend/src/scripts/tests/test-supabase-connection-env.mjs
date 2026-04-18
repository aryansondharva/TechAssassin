/**
 * Test Supabase connection with environment variables
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Load environment variables from .env.local
config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('Testing Supabase Connection...\n');

console.log('Environment Variables Check:');
console.log('NEXT_PUBLIC_SUPABASE_URL:', SUPABASE_URL ? 'Set' : 'Missing');
console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', SUPABASE_ANON_KEY ? 'Set' : 'Missing');
console.log('SUPABASE_SERVICE_ROLE_KEY:', SUPABASE_SERVICE_ROLE_KEY ? 'Set' : 'Missing');
console.log();

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('Missing required environment variables!');
  process.exit(1);
}

async function testConnection() {
  try {
    // Test 1: Create client with anon key
    console.log('Test 1: Creating Supabase client...');
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log('Client created successfully\n');

    // Test 2: Check connection by querying database
    console.log('Test 2: Testing database connection...');
    const { data, error } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);

    if (error) {
      if (error.message.includes('relation "public.profiles" does not exist')) {
        console.log('Database connected, but tables not created yet');
        console.log('You need to run the database schema migration\n');
      } else {
        throw error;
      }
    } else {
      console.log('Database connection successful\n');
    }

    // Test 3: Test service role key if provided
    if (SUPABASE_SERVICE_ROLE_KEY) {
      console.log('Test 3: Testing service role key...');
      const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
      
      const { error: adminError } = await adminClient
        .from('profiles')
        .select('count')
        .limit(1);

      if (adminError) {
        if (adminError.message.includes('relation "public.profiles" does not exist')) {
          console.log('Service role key valid (tables not created yet)\n');
        } else {
          throw adminError;
        }
      } else {
        console.log('Service role key working\n');
      }
    }

    // Success summary
    console.log('All tests passed!');
    console.log('\nConnection Summary:');
    console.log('Supabase URL:', SUPABASE_URL);
    console.log('Client creation: OK');
    console.log('Database access: OK');
    console.log('Service role:', SUPABASE_SERVICE_ROLE_KEY ? 'OK' : 'Not configured');
    
    console.log('\nYour Supabase connection is working!');
    console.log('Next step: Apply the database schema');
    
  } catch (error) {
    console.error('Connection test failed!');
    console.error('Error:', error.message);
    
    if (error.message.includes('Invalid API key')) {
      console.error('Check that your API keys are correct in .env.local');
    } else if (error.message.includes('fetch failed')) {
      console.error('Check your internet connection and Supabase URL');
    }
    
    process.exit(1);
  }
}

testConnection();
