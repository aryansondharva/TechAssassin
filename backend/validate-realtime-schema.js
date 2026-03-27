#!/usr/bin/env node

import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function query(text, params) {
  const res = await pool.query(text, params);
  return res;
}

async function validateSchema() {
  console.log('🔍 Validating Real-Time Presence & Activity Schema...\n');

  try {
    // Check if tables exist
    const tables = ['presence_tracking', 'activity_feed', 'leaderboard_scores'];
    
    for (const table of tables) {
      console.log(`📋 Checking table: ${table}`);
      
      const result = await query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = $1
        );
      `, [table]);
      
      const exists = result.rows[0].exists;
      console.log(`   ${exists ? '✅' : '❌'} Table ${table}: ${exists ? 'EXISTS' : 'MISSING'}`);
      
      if (exists) {
        // Check table structure
        const columns = await query(`
          SELECT column_name, data_type, is_nullable, column_default
          FROM information_schema.columns
          WHERE table_schema = 'public' AND table_name = $1
          ORDER BY ordinal_position;
        `, [table]);
        
        console.log(`   📊 Columns (${columns.rows.length}):`);
        columns.rows.forEach(col => {
          console.log(`      - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'}`);
        });
        
        // Check indexes
        const indexes = await query(`
          SELECT indexname, indexdef
          FROM pg_indexes
          WHERE tablename = $1 AND schemaname = 'public';
        `, [table]);
        
        console.log(`   🔍 Indexes (${indexes.rows.length}):`);
        indexes.rows.forEach(idx => {
          console.log(`      - ${idx.indexname}`);
        });
      }
      console.log('');
    }

    // Check Supabase Realtime publication
    console.log('📡 Checking Supabase Realtime configuration...');
    
    const realtimeCheck = await query(`
      SELECT tablename 
      FROM pg_publication_tables 
      WHERE pubname = 'supabase_realtime'
      AND tablename IN ('presence_tracking', 'activity_feed', 'leaderboard_scores');
    `);
    
    console.log(`   📊 Tables in realtime publication (${realtimeCheck.rows.length}):`);
    realtimeCheck.rows.forEach(row => {
      console.log(`      ✅ ${row.tablename}`);
    });

    // Check RLS policies
    console.log('\n🔒 Checking Row Level Security policies...');
    
    for (const table of tables) {
      const policies = await query(`
        SELECT policyname, permissive, roles, cmd, qual
        FROM pg_policies
        WHERE tablename = $1;
      `, [table]);
      
      console.log(`   📋 ${table} policies (${policies.rows.length}):`);
      policies.rows.forEach(policy => {
        console.log(`      - ${policy.policyname} (${policy.cmd})`);
      });
    }

    // Test sample queries
    console.log('\n🧪 Testing sample queries...');
    
    // Test presence_tracking
    try {
      const presenceCount = await query('SELECT COUNT(*) FROM presence_tracking');
      console.log(`   ✅ presence_tracking: ${presenceCount.rows[0].count} records`);
    } catch (error) {
      console.log(`   ❌ presence_tracking query failed: ${error.message}`);
    }
    
    // Test activity_feed
    try {
      const activityCount = await query('SELECT COUNT(*) FROM activity_feed');
      console.log(`   ✅ activity_feed: ${activityCount.rows[0].count} records`);
    } catch (error) {
      console.log(`   ❌ activity_feed query failed: ${error.message}`);
    }
    
    // Test leaderboard_scores
    try {
      const leaderboardCount = await query('SELECT COUNT(*) FROM leaderboard_scores');
      console.log(`   ✅ leaderboard_scores: ${leaderboardCount.rows[0].count} records`);
    } catch (error) {
      console.log(`   ❌ leaderboard_scores query failed: ${error.message}`);
    }

    console.log('\n✅ Schema validation completed!');
    
  } catch (error) {
    console.error('❌ Schema validation failed:', error);
    process.exit(1);
  }
}

validateSchema().then(() => {
  process.exit(0);
}).catch(error => {
  console.error('❌ Validation error:', error);
  process.exit(1);
});