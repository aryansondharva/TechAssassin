// Script to verify Supabase schema for real-time presence & activity system
import { createClient } from '@supabase/supabase-js';

async function verifySchema() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  console.log('🔍 Verifying Supabase schema...\n');

  try {
    // Check presence_tracking table
    console.log('Checking presence_tracking table...');
    const { data: presenceData, error: presenceError } = await supabase
      .from('presence_tracking')
      .select('*')
      .limit(1);
    
    if (presenceError && presenceError.code === '42P01') {
      console.log('❌ presence_tracking table: MISSING');
    } else if (presenceError) {
      console.log(`⚠️  presence_tracking table: ERROR - ${presenceError.message}`);
    } else {
      console.log('✅ presence_tracking table: EXISTS');
    }

    // Check activity_feed table
    console.log('Checking activity_feed table...');
    const { data: activityData, error: activityError } = await supabase
      .from('activity_feed')
      .select('*')
      .limit(1);
    
    if (activityError && activityError.code === '42P01') {
      console.log('❌ activity_feed table: MISSING');
    } else if (activityError) {
      console.log(`⚠️  activity_feed table: ERROR - ${activityError.message}`);
    } else {
      console.log('✅ activity_feed table: EXISTS');
    }

    // Check leaderboard_scores table
    console.log('Checking leaderboard_scores table...');
    const { data: leaderboardData, error: leaderboardError } = await supabase
      .from('leaderboard_scores')
      .select('*')
      .limit(1);
    
    if (leaderboardError && leaderboardError.code === '42P01') {
      console.log('❌ leaderboard_scores table: MISSING');
    } else if (leaderboardError) {
      console.log(`⚠️  leaderboard_scores table: ERROR - ${leaderboardError.message}`);
    } else {
      console.log('✅ leaderboard_scores table: EXISTS');
    }

    console.log('\n✅ Schema verification complete!');
  } catch (error) {
    console.error('❌ Error verifying schema:', error);
    process.exit(1);
  }
}

verifySchema();
