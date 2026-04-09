/**
 * Fix ALL permissions for Supabase
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

async function fixAll() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('🔧 Connection established. Fixing everything...');

    // 1. Grant usage on public schema
    await pool.query('GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role');
    console.log('✅ Granted usage on schema public');

    // 2. Grant all on tables to essential roles
    const tables = ['profiles', 'missions', 'user_missions', 'xp_transactions', 'badges', 'user_badges', 'events', 'registrations', 'activity_feed', 'leaderboard_all_time'];
    
    for (const table of tables) {
      try {
        await pool.query(`GRANT ALL ON TABLE public.${table} TO postgres`);
        await pool.query(`GRANT ALL ON TABLE public.${table} TO service_role`);
        await pool.query(`GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.${table} TO authenticated`);
        await pool.query(`GRANT SELECT ON TABLE public.${table} TO anon`);
        console.log(`✅ Fixed grants for ${table}`);
      } catch (e) {
        console.warn(`⚠️ skipping ${table}: ${e.message}`);
      }
    }

    // 3. Sequences
    await pool.query('GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated, service_role');
    console.log('✅ Fixed sequences');

    // 4. Specifically check/enable RLS on profiles again
    await pool.query('ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY');
    console.log('✅ RLS active on profiles');

    console.log('\n🚀 Permissions repair complete!');

  } catch (error) {
    console.error('❌ Repair failed:', error.message);
  } finally {
    await pool.end();
  }
}

fixAll();
