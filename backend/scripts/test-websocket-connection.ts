// Script to test WebSocket connection to Supabase Realtime
import { createClient } from '@supabase/supabase-js';

async function testWebSocketConnection() {
  console.log('🔍 Testing WebSocket connection to Supabase Realtime...\n');

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    }
  );

  try {
    // Test presence channel
    console.log('Testing presence channel...');
    const presenceChannel = supabase.channel('presence:test');
    
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Connection timeout'));
      }, 5000);

      presenceChannel
        .on('presence', { event: 'sync' }, () => {
          console.log('✅ Presence channel: CONNECTED');
          clearTimeout(timeout);
          resolve(true);
        })
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            console.log('✅ Presence channel: SUBSCRIBED');
            clearTimeout(timeout);
            resolve(true);
          } else if (status === 'CHANNEL_ERROR') {
            clearTimeout(timeout);
            reject(new Error('Channel subscription failed'));
          }
        });
    });

    await presenceChannel.unsubscribe();

    // Test activity channel
    console.log('\nTesting activity channel...');
    const activityChannel = supabase.channel('activity:test');
    
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Connection timeout'));
      }, 5000);

      activityChannel
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'activity_feed',
        }, () => {
          // This won't be called during test, but validates the subscription
        })
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            console.log('✅ Activity channel: SUBSCRIBED');
            clearTimeout(timeout);
            resolve(true);
          } else if (status === 'CHANNEL_ERROR') {
            clearTimeout(timeout);
            reject(new Error('Channel subscription failed'));
          }
        });
    });

    await activityChannel.unsubscribe();

    console.log('\n✅ WebSocket connection test complete!');
    console.log('✅ All channels are working correctly.');
    process.exit(0);
  } catch (error) {
    console.error('❌ WebSocket connection test failed:', error);
    process.exit(1);
  }
}

testWebSocketConnection();
