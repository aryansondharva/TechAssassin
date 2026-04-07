const { readFileSync, readdirSync } = require('fs');
const { join } = require('path');
const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

if (!process.env.DATABASE_URL) {
  console.error('❌ Error: DATABASE_URL not found in .env.local');
  process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function runMigrations() {
  console.log('🚀 Starting database migrations...\n');
  console.log('Connection URL:', process.env.DATABASE_URL.replace(/:[^:@]+@/, ':****@'));

  const migrationsDir = join(__dirname, '../../SQL');
  const migrationFiles = readdirSync(migrationsDir)
    .filter(file => file.endsWith('.sql'))
    .sort(); // Run in order

  let successCount = 0;
  let errorCount = 0;

  for (const file of migrationFiles) {
    try {
      console.log(`📄 Running migration: ${file}`);
      const filePath = join(migrationsDir, file);
      const sql = readFileSync(filePath, 'utf-8');
      
      await pool.query(sql);
      console.log(`✅ Success: ${file}\n`);
      successCount++;
    } catch (error) {
      console.error(`❌ Error in ${file}:`, error.message);
      console.log('');
      errorCount++;
      // Continue with other migrations even if one fails
    }
  }

  console.log('\n📊 Migration Summary:');
  console.log(`✅ Successful: ${successCount}`);
  console.log(`❌ Failed: ${errorCount}`);
  console.log(`📝 Total: ${migrationFiles.length}`);

  await pool.end();
  process.exit(errorCount > 0 ? 1 : 0);
}

runMigrations().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
