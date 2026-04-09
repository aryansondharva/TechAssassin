
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

async function createUser() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabase = createClient(supabaseUrl, supabaseKey);

  const email = 'aryansondharva25@gmail.com';
  const password = '23J@n2008';
  const username = 'aryansondharva';

  console.log(`Creating user: ${email}`);

  // 1. Create user in Auth
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { username, full_name: 'Aryan Sondharva' }
  });

  if (authError) {
    if (authError.message.includes('already registered')) {
      console.log('User already exists in Auth.');
    } else {
      console.error('Error creating Auth user:', authError.message);
      return;
    }
  } else {
    console.log('User created in Auth successfully:', authData.user.id);
  }

  // 2. Ensure profile exists in profiles table
  const userId = authData?.user?.id || (await supabase.auth.admin.listUsers()).data.users.find(u => u.email === email)?.id;
  
  if (!userId) {
    console.error('Could not determine User ID.');
    return;
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .upsert({
      id: userId,
      email,
      username,
      full_name: 'Aryan Sondharva',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .select();

  if (profileError) {
    console.error('Error creating/updating profile:', profileError.message);
  } else {
    console.log('Profile ensured successfully:', profile[0]);
  }
}

createUser().catch(console.error);
