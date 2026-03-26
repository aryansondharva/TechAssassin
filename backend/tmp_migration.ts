import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Force load env from .env.local
dotenv.config({ path: path.join(__dirname, '.env.local') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function run() {
  const client = await pool.connect();
  try {
    console.log('Running migration: Making username nullable in profiles table...');
    await client.query('ALTER TABLE public.profiles ALTER COLUMN username DROP NOT NULL;');
    console.log('✅ Migration successful: username is now nullable.');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

run();
