const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function checkTables() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('Connected to Supabase...');
    
    const res = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);
    
    console.log('\n--- Live Tables ---');
    if (res.rows.length === 0) {
      console.log('No tables found in public schema.');
    } else {
      res.rows.forEach(row => console.log(`- ${row.table_name}`));
    }
    console.log(`\nTotal Live Tables: ${res.rows.length}`);
    
  } catch (err) {
    console.error('Error connecting to database:', err.message);
  } finally {
    await client.end();
  }
}

checkTables();
