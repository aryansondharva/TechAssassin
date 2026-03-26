const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:2301@localhost:5432/techassassin',
});

async function run() {
  const client = await pool.connect();
  try {
    const res = await client.query(`
      SELECT conname, pg_get_constraintdef(c.oid)
      FROM pg_constraint c
      JOIN pg_namespace n ON n.oid = c.connamespace
      WHERE n.nspname = 'public' AND c.conrelid = 'public.profiles'::regclass;
    `);
    console.log('Constraints on profiles table:');
    res.rows.forEach(row => console.log(`${row.conname}: ${row.pg_get_constraintdef}`));
  } catch (error) {
    console.error('Error fetching constraints:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

run();
