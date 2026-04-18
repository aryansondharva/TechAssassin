/**
 * Add Missing Tables to Supabase
 * Uses PostgreSQL connection to add all missing tables
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

async function addMissingTables() {
  try {
    console.log('Adding missing tables to Supabase...\n');

    // Read the missing tables script
    const scriptPath = join(__dirname, '../SQL/20260418000005_add_missing_tables.sql');
    const sqlScript = readFileSync(scriptPath, 'utf8');
    
    console.log('Executing missing tables script...');

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
      console.log('Missing tables script executed successfully!');
    } catch (error) {
      console.log('SQL execution result:', error.message);
    }

    await client.end();

    // Test the connection with all tables
    console.log('\nTesting all tables...');
    
    const testClient = new Client({
      connectionString: DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });

    await testClient.connect();
    
    const tables = ['profiles', 'events', 'event_registrations', 'xp_transactions', 'badges', 'notifications'];
    
    for (const table of tables) {
      try {
        const result = await testClient.query(`SELECT COUNT(*) FROM ${table} LIMIT 1`);
        console.log(`Table ${table}: OK (${result.rows[0].count} records)`);
      } catch (error) {
        console.log(`Table ${table}: Missing - ${error.message}`);
      }
    }
    
    await testClient.end();

  } catch (error) {
    console.error('Script execution failed:', error.message);
    process.exit(1);
  }
}

addMissingTables();
