import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import pool from '../lib/db/postgres';

async function runMigrations() {
  console.log('🚀 Starting database migrations...\n');

  const migrationsDir = join(__dirname, '../../database/final');
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
      console.error(`❌ Error in ${file}:`, error);
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
