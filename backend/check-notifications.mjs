import { config } from 'dotenv';

config({ path: '.env.local' });

import { Client } from 'pg';

async function checkNotifications() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
  await client.connect();
  
  const result = await client.query('SELECT column_name, data_type FROM information_schema.columns WHERE table_name = \'notifications\' ORDER BY ordinal_position');
  console.log('Notifications table columns:');
  result.rows.forEach(row => console.log(`- ${row.column_name}: ${row.data_type}`));
  
  await client.end();
}

checkNotifications();
