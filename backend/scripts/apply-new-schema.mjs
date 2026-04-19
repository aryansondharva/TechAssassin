/**
 * Apply Initial Clerk Schema
 */

import pkg from 'pg';
const { Client } = pkg;
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from .env.local
config({ path: join(__dirname, '../.env.local') });

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ Error: Missing DATABASE_URL in .env.local');
  process.exit(1);
}

async function applySchema() {
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('🔄 Connecting to Supabase...');
    await client.connect();
    console.log('✅ Connected.');

    const sqlPath = join(__dirname, '../../database/schemas/initial_clerk_schema.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log('🚀 Applying Initial Clerk Schema...');
    await client.query(sql);
    console.log('✨ SUCCESS: Your new schema with custom Member IDs is live!');

  } catch (error) {
    console.error('❌ Error applying schema:', error.message);
  } finally {
    await client.end();
  }
}

applySchema();
