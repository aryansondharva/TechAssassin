const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({path: './.env.local'});

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  // Step 1: Get Aryan's user ID from auth
  const { data: { users }, error: authError } = await supabase.auth.admin.listUsers();
  if (authError) { console.error('Auth error:', authError); return; }
  
  console.log('All users:', users.map(u => ({ id: u.id, email: u.email })));
  
  // Step 2: Test RPC for first user
  const userId = users[0]?.id;
  if (!userId) { console.log('No users found'); return; }
  
  const { data, error } = await supabase.rpc('get_available_missions', { p_user_id: userId });
  console.log('Missions for', userId, ':', data?.length, 'error:', error?.message);
  
  // Step 3: Also check what's in user_missions for this user
  const { data: um, error: umErr } = await supabase.from('user_missions').select('*').eq('user_id', userId);
  console.log('user_missions rows:', um?.length, umErr?.message);
}

run();
