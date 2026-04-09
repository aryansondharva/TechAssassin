const { Pool } = require('pg');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  const envConfig = dotenv.parse(fs.readFileSync(envPath));
  for (const k in envConfig) process.env[k] = envConfig[k];
}

async function check() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('--- TABLE GRANTS ---');
    const res = await pool.query(`
      SELECT grantee, privilege_type 
      FROM information_schema.role_table_grants 
      WHERE table_name = 'profiles'
    `);
    console.table(res.rows);

    console.log('\n--- RLS STATUS ---');
    const rls = await pool.query(`
      SELECT relname, relrowsecurity 
      FROM pg_class 
      JOIN pg_namespace ON pg_namespace.oid = pg_class.relnamespace 
      WHERE relname = 'profiles' AND nspname = 'public'
    `);
    console.table(rls.rows);

    console.log('\n--- POLICIES ---');
    const policies = await pool.query(`
      SELECT policyname, action, roles, qident(cmd) as cmd
      FROM pg_policies 
      WHERE tablename = 'profiles'
    `);
    console.table(policies.rows);

  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

check();
