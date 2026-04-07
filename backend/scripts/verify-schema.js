// Script to verify database schema for real-time presence & activity system
const { Pool } = require('pg');

async function verifySchema() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log('🔍 Verifying database schema...\n');

    // Check if tables exist
    const tables = ['presence_tracking', 'activity_feed', 'leaderboard_scores'];
    
    for (const table of tables) {
      const result = await pool.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = $1
        );
      `, [table]);
      
      const exists = result.rows[0].exists;
      console.log(`${exists ? '✅' : '❌'} Table "${table}": ${exists ? 'EXISTS' : 'MISSING'}`);
      
      if (exists) {
        // Check columns
        const columns = await pool.query(`
          SELECT column_name, data_type, is_nullable
          FROM information_schema.columns
          WHERE table_schema = 'public' AND table_name = $1
          ORDER BY ordinal_position;
        `, [table]);
        
        console.log(`   Columns (${columns.rows.length}):`);
        columns.rows.forEach(col => {
          console.log(`   - ${col.column_name} (${col.data_type}${col.is_nullable === 'NO' ? ', NOT NULL' : ''})`);
        });
        
        // Check indexes
        const indexes = await pool.query(`
          SELECT indexname, indexdef
          FROM pg_indexes
          WHERE schemaname = 'public' AND tablename = $1;
        `, [table]);
        
        console.log(`   Indexes (${indexes.rows.length}):`);
        indexes.rows.forEach(idx => {
          console.log(`   - ${idx.indexname}`);
        });
        console.log('');
      }
    }

    // Check if Supabase Realtime is enabled
    console.log('🔍 Checking Supabase Realtime configuration...\n');
    const realtimeCheck = await pool.query(`
      SELECT tablename 
      FROM pg_publication_tables 
      WHERE pubname = 'supabase_realtime'
      AND tablename IN ('presence_tracking', 'activity_feed', 'leaderboard_scores');
    `);
    
    console.log(`✅ Realtime enabled for ${realtimeCheck.rows.length} tables:`);
    realtimeCheck.rows.forEach(row => {
      console.log(`   - ${row.tablename}`);
    });

    console.log('\n✅ Schema verification complete!');
  } catch (error) {
    console.error('❌ Error verifying schema:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

verifySchema();
