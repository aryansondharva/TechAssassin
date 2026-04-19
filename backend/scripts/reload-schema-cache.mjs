/**
 * Reload PostgREST schema cache so the Supabase REST client
 * can see tables created via raw pg.
 */
import pkg from 'pg';
const { Client } = pkg;
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: join(__dirname, '../.env.local') });

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('❌ Missing DATABASE_URL');
  process.exit(1);
}

async function reload() {
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('✅ Connected to database.');

    // Notify PostgREST to reload its schema cache
    await client.query("NOTIFY pgrst, 'reload schema'");
    console.log('✅ PostgREST schema cache reloaded!');

    // Also verify the profiles table exists
    const res = await client.query(
      "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'profiles' AND table_schema = 'public' ORDER BY ordinal_position"
    );
    console.log(`\n📋 profiles table has ${res.rows.length} columns:`);
    res.rows.forEach(r => console.log(`   - ${r.column_name} (${r.data_type})`));

  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await client.end();
  }
}

reload();
