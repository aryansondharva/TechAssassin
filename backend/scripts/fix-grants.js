/**
 * Fix missing grants on public tables for Supabase roles
 */

const { Pool } = require('pg');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  const envConfig = dotenv.parse(fs.readFileSync(envPath));
  for (const k in envConfig) process.env[k] = envConfig[k];
}

async function fixGrants() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('🔧 Connection established. Fixing grants...');

    const tables = ['profiles', 'missions', 'user_missions', 'xp_transactions', 'badges', 'user_badges', 'events', 'registrations'];
    const roles = ['anon', 'authenticated', 'service_role'];

    for (const table of tables) {
      console.log(`\nProcessing table: ${table}`);
      
      // Grant basic permissions to standard Supabase roles
      await pool.query(`GRANT ALL ON TABLE public.${table} TO postgres`);
      await pool.query(`GRANT ALL ON TABLE public.${table} TO service_role`);
      await pool.query(`GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.${table} TO authenticated`);
      await pool.query(`GRANT SELECT ON TABLE public.${table} TO anon`);
      
      console.log(`✅ Grants restored for ${table}`);
    }

    // Also handle sequences (if any)
    await pool.query(`GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated, service_role`);

    console.log('\n🚀 All grants successfully restored!');

  } catch (error) {
    console.error('❌ Failed to restore grants:', error.message);
  } finally {
    await pool.end();
  }
}

fixGrants();
