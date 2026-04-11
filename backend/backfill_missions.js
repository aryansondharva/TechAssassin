const { Client } = require('pg');
const fs = require('fs');

async function run() {
  const client = new Client({
    connectionString: 'postgresql://postgres.qlurztwklaysbhdjcpam:1046402103As@aws-1-ap-south-1.pooler.supabase.com:5432/postgres'
  });
  await client.connect();
  
  const sql = fs.readFileSync('../SQL/auto_assign_missions_on_signup.sql', 'utf8');
  await client.query(sql);
  console.log('Trigger installed!');

  // Backfill missions for ALL existing users
  const profiles = await client.query('SELECT id FROM public.profiles');
  for (const row of profiles.rows) {
    await client.query(`
      INSERT INTO public.user_missions (user_id, mission_id, status, progress, last_reset_at)
      SELECT $1, m.id, 'in_progress', '{}', NOW()
      FROM public.missions m
      WHERE m.is_active = TRUE
      ON CONFLICT (user_id, mission_id) DO NOTHING
    `, [row.id]);
  }

  console.log('Backfilled missions for ' + profiles.rows.length + ' existing users!');
  await client.end();
}

run().catch(console.error);
