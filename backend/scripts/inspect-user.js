const { Pool } = require('pg');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  const envConfig = dotenv.parse(fs.readFileSync(envPath));
  for (const k in envConfig) process.env[k] = envConfig[k];
}

async function inspect() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    const username = process.argv[2] || 'aryansondharva';
    console.log(`🔍 Inspecting user: ${username}`);
    
    const res = await pool.query('SELECT * FROM profiles WHERE username = $1 OR full_name ILIKE $1', [username]);
    
    if (res.rows.length === 0) {
      console.log('❌ User not found');
    } else {
      console.log('✅ User found:');
      console.table(res.rows.map(row => ({
        id: row.id.substring(0, 8) + '...',
        username: row.username,
        full_name: row.full_name,
        xp: row.total_xp,
        streak: row.current_streak,
        github: row.github_url ? 'SET' : 'NOT SET',
        avatar: row.avatar_url ? 'SET' : 'NOT SET',
        banner: row.banner_url ? 'SET' : 'NOT SET'
      })));
      
      console.log('\nFull JSON of first match:');
      console.log(JSON.stringify(res.rows[0], null, 2));
    }
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

inspect();
