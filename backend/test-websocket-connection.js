#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Load environment variables
config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('🔌 Testing WebSocket Connection to Supabase Realtime...\n');

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

console.log(`📡 Supabase URL: ${supabaseUrl}`);
console.log(`🔑 Supabase Key: ${supabaseKey.substring(0, 20)}...`);

const supabase = createClient(supabaseUrl, supabaseKey, {
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

async function testRealtimeConnection() {
  try {
    console.log('\n🧪 Testing Realtime Channel Subscription...');
    
    // Test presence channel
    console.log('📍 Testing presence channel...');
    const presenceChannel = supabase
      .channel('presence:test')
      .on('presence', { event: 'sync' }, () => {
        console.log('✅ Presence sync event received');
      })
      .on('presence', { event: 'join' }, () => {
        console.log('✅ Presence join event received');
      })
      .on('presence', { event: 'leave' }, () => {
        console.log('✅ Presence leave event received');
      })
      .subscribe((status) => {
        console.log(`📍 Presence channel status: ${status}`);
        if (status === 'SUBSCRIBED') {
          console.log('✅ Successfully subscribed to presence channel');
          
          // Test tracking presence
          presenceChannel.track({
            user_id: 'test-user',
            status: 'online',
            timestamp: new Date().toISOString(),
          });
        }
      });

    // Test activity channel
    console.log('📊 Testing activity channel...');
    const activityChannel = supabase
      .channel('activity:test')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'activity_feed',
        },
        (payload) => {
          console.log('✅ Activity INSERT event received:', payload);
        }
      )
      .subscribe((status) => {
        console.log(`📊 Activity channel status: ${status}`);
        if (status === 'SUBSCRIBED') {
          console.log('✅ Successfully subscribed to activity channel');
        }
      });

    // Test leaderboard channel
    console.log('🏆 Testing leaderboard channel...');
    const leaderboardChannel = supabase
      .channel('leaderboard:test')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'leaderboard_scores',
        },
        (payload) => {
          console.log('✅ Leaderboard UPDATE event received:', payload);
        }
      )
      .subscribe((status) => {
        console.log(`🏆 Leaderboard channel status: ${status}`);
        if (status === 'SUBSCRIBED') {
          console.log('✅ Successfully subscribed to leaderboard channel');
        }
      });

    // Wait for connections to establish
    console.log('\n⏳ Waiting for connections to establish...');
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Test basic database query
    console.log('\n🗄️ Testing basic database query...');
    const { data, error } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);

    if (error) {
      console.log('❌ Database query failed:', error.message);
    } else {
      console.log('✅ Database query successful');
    }

    // Cleanup
    console.log('\n🧹 Cleaning up connections...');
    presenceChannel.unsubscribe();
    activityChannel.unsubscribe();
    leaderboardChannel.unsubscribe();

    console.log('\n✅ WebSocket connection test completed!');
    
  } catch (error) {
    console.error('❌ WebSocket test failed:', error);
  }
}

testRealtimeConnection().then(() => {
  console.log('\n🎉 Test finished');
  process.exit(0);
}).catch(error => {
  console.error('❌ Test error:', error);
  process.exit(1);
});