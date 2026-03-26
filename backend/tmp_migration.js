const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:2301@localhost:5432/techassassin',
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
