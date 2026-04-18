/**
 * Direct SQL Fix for Supabase
 * Uses the PostgreSQL connection string to execute SQL directly
 */

import { config } from 'dotenv';
import { readFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';

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

async function executeSQLDirectly() {
  try {
    console.log('Executing SQL fix directly...\n');

    // Read the RLS fix script
    const scriptPath = join(__dirname, '../SQL/20260418000006_fix_rls_policies.sql');
    const sqlScript = readFileSync(scriptPath, 'utf8');
    
    console.log('Executing RLS fix script using PostgreSQL connection...');

    // Import pg dynamically
    const { Client } = await import('pg');
    
    // Create client with DATABASE_URL
    const client = new Client({
      connectionString: DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });

    await client.connect();
    console.log('Connected to PostgreSQL database');

    // Execute the SQL script
    try {
      await client.query(sqlScript);
      console.log('RLS fix script executed successfully!');
    } catch (error) {
      console.log('SQL execution result:', error.message);
    }

    await client.end();

    // Test the connection
    console.log('\nTesting connection after fix...');
    
    const testClient = new Client({
      connectionString: DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });

    await testClient.connect();
    
    try {
      const result = await testClient.query('SELECT COUNT(*) FROM profiles LIMIT 1');
      console.log('Connection test passed! Database is now accessible.');
      console.log('Profiles count:', result.rows[0].count);
    } catch (error) {
      console.error('Connection test failed:', error.message);
    }
    
    await testClient.end();

  } catch (error) {
    console.error('Script execution failed:', error.message);
    process.exit(1);
  }
}

executeSQLDirectly();
