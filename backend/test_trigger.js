const { Client } = require('pg');
async function run() {
  const client = new Client({
    connectionString: 'postgresql://postgres.qlurztwklaysbhdjcpam:1046402103As@aws-1-ap-south-1.pooler.supabase.com:5432/postgres'
  });
  await client.connect();
  const res = await client.query("SELECT routine_definition FROM information_schema.routines WHERE routine_name = 'get_available_missions'");
  console.log(res.rows[0].routine_definition);
  await client.end();
}
run();
