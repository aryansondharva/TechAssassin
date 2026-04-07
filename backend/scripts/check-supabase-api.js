const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function checkTables() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  try {
    console.log('Fetching live tables from Supabase schema...');
    
    // Updated expected table names based on gamification structure
    const tables = ['profiles', 'events', 'registrations', 'leaderboard', 'announcements', 'resources', 'badges', 'ranks', 'xp', 'streaks', 'user_skills', 'skills', 'sponsors'];
    
    console.log('\n--- Checking Expected Tables ---');
    let liveCount = 0;
    for (const table of tables) {
      const { data, error } = await supabase.from(table).select('count').limit(0);
      if (error) {
        // console.log(`- ${table}: ❌ Missing or inaccessible (${error.message})`);
      } else {
        console.log(`- ${table}: ✅ Live`);
        liveCount++;
      }
    }
    console.log(`\nVerified Live Tables in Public Schema: ${liveCount}`);
    
  } catch (err) {
    console.error('Error connecting to Supabase API:', err.message);
  }
}

checkTables();
