/**
 * Fix Table Permissions for Service Role
 * Grant proper permissions to service role for all tables
 */

import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { join } from 'path';

// Get __dirname in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = join(__filename, '..');

// Load environment variables
config({ path: '.env.local' });

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('Missing DATABASE_URL in environment variables!');
  process.exit(1);
}

async function fixTablePermissions() {
  try {
    console.log('Fixing table permissions for service role...\n');

    // Import pg dynamically
    const { Client } = await import('pg');
    
    // Create client with DATABASE_URL
    const client = new Client({
      connectionString: DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });

    await client.connect();
    console.log('Connected to PostgreSQL database');

    // Grant permissions to service role
    const grantSQL = `
      -- Grant permissions to service_role for all tables
      GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
      GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
      GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO service_role;
      
      -- Grant usage on schema
      GRANT USAGE ON SCHEMA public TO service_role;
      
      -- Ensure RLS is properly configured
      ALTER TABLE public.event_registrations ENABLE ROW LEVEL SECURITY;
      ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
    `;

    try {
      await client.query(grantSQL);
      console.log('Permissions granted successfully!');
    } catch (error) {
      console.log('Permission grant result:', error.message);
    }

    await client.end();

    // Test the permissions
    console.log('\nTesting permissions...');
    
    const testClient = new Client({
      connectionString: DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });

    await testClient.connect();
    
    const tables = ['profiles', 'events', 'event_registrations', 'xp_transactions', 'badges', 'notifications'];
    
    for (const table of tables) {
      try {
        const result = await testClient.query(`SELECT COUNT(*) FROM ${table} LIMIT 1`);
        console.log(`${table}: OK (${result.rows[0].count} records)`);
      } catch (error) {
        console.log(`${table}: Error - ${error.message}`);
      }
    }
    
    await testClient.end();

  } catch (error) {
    console.error('Script execution failed:', error.message);
    process.exit(1);
  }
}

fixTablePermissions();
