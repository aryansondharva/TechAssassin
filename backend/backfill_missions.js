const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function run() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is required in .env.local');
  }

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  await client.connect();

  const result = await client.query(`
    INSERT INTO public.user_missions (user_id, mission_id, status, progress, last_reset_at)
    SELECT p.id, m.id, 'in_progress', '{}', NOW()
    FROM public.profiles p
    CROSS JOIN public.missions m
    WHERE m.is_active = TRUE
    ON CONFLICT (user_id, mission_id) DO NOTHING
  `);

  console.log('Backfilled ' + result.rowCount + ' mission assignments.');
  await client.end();
}

run().catch(console.error);
