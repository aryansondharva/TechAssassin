/**
 * Terminal Database Wipe Utility (Nuclear Option)
 * DANGER: This script will permanently delete the entire public schema and recreate it.
 */

import pkg from 'pg';
const { Client } = pkg;
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from .env.local
config({ path: join(__dirname, '../.env.local') });

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ Error: Missing DATABASE_URL in .env.local');
  process.exit(1);
}

async function wipeDatabase() {
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('🔄 Connecting to Supabase for terminal wipe...');
    await client.connect();
    console.log('✅ Connected successfully.');

    // Use the Nuclear Option: Drop and Recreate Schema
    const wipeSql = `
      -- Nuclear Wipe
      DROP SCHEMA public CASCADE;
      CREATE SCHEMA public;
      
      -- Restore standard Supabase permissions
      GRANT ALL ON SCHEMA public TO postgres;
      GRANT ALL ON SCHEMA public TO anon;
      GRANT ALL ON SCHEMA public TO authenticated;
      GRANT ALL ON SCHEMA public TO service_role;
      
      -- Common Supabase roles sometimes need explicit usage
      GRANT USAGE ON SCHEMA public TO anon;
      GRANT USAGE ON SCHEMA public TO authenticated;
      
      COMMENT ON SCHEMA public IS 'standard public schema';
    `;

    console.log('🚀 Executing Nuclear Wipe (Recreating Public Schema)...');
    await client.query(wipeSql);
    console.log('✨ SUCCESS: Your database is now 100% clean and ready for the new architecture.');

  } catch (error) {
    console.error('❌ Error during database wipe:', error.message);
  } finally {
    await client.end();
  }
}

wipeDatabase();
