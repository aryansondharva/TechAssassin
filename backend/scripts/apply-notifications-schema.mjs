import pkg from 'pg';
const { Pool } = pkg;
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: join(__dirname, '../.env.local') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function main() {
  const sqlPath = join(__dirname, '../../database/schemas/phase1_notifications.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');

  console.log("🚀 Applying Phase 1 Notifications Schema...");
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    await client.query(sql);
    await client.query('COMMIT');
    console.log("✅ Successfully created 'notifications' table, indexes, and enabled RLS.");
    console.log("✅ Supabase Realtime Publication updated for notifications.");
  } catch (error) {
    await client.query('ROLLBACK');
    console.error("❌ Failed to apply schema:", error.message);
  } finally {
    client.release();
    pool.end();
  }
}

main();
