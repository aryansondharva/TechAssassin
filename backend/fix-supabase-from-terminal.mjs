/**
 * Fix Supabase RLS Policies from Terminal
 * This script executes SQL directly using the service role key
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { readFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';

// Get __dirname in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = join(__filename, '..');

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

async function executeSQLScript() {
  try {
    console.log('Fixing Supabase RLS policies from terminal...\n');

    // Read the RLS fix script
    const scriptPath = join(__dirname, '../SQL/20260418000006_fix_rls_policies.sql');
    const sqlScript = readFileSync(scriptPath, 'utf8');
    
    console.log('Executing RLS fix script...');

    // Split into individual statements and execute them one by one
    const statements = sqlScript
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--') && !s.startsWith('/*'));

    console.log(`Found ${statements.length} SQL statements to execute...`);

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      if (statement.trim().length === 0) continue;
      
      try {
        console.log(`Executing statement ${i + 1}: ${statement.substring(0, 50)}...`);
        
        // Use raw SQL execution via Postgres RPC
        const { data, error } = await supabase.rpc('exec_sql', { sql: statement });
        
        if (error) {
          console.log(`Statement ${i + 1}: ${error.message}`);
        } else {
          console.log(`Statement ${i + 1}: Success`);
        }
      } catch (err) {
        console.log(`Statement ${i + 1}: ${err.message}`);
      }
    }

    console.log('\nRLS fix script completed!');
    
    // Test the connection
    console.log('\nTesting connection after fix...');
    const { data, error } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);

    if (error) {
      console.error('Connection test failed:', error.message);
    } else {
      console.log('Connection test passed! Database is now accessible.');
    }

  } catch (error) {
    console.error('Script execution failed:', error.message);
    process.exit(1);
  }
}

executeSQLScript();
