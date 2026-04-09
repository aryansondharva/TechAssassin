const { Pool } = require('pg');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  const envConfig = dotenv.parse(fs.readFileSync(envPath));
  for (const k in envConfig) process.env[k] = envConfig[k];
}

async function setup() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('🔧 Setting up banners storage...');

    // 1. Create bucket
    await pool.query(`
      INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
      VALUES ('banners', 'banners', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp'])
      ON CONFLICT (id) DO NOTHING
    `);
    console.log('✅ Banners bucket ensured');

    // 2. Add policies
    // First drop if they exist to be clean
    const policies = [
      'Banners are public',
      'Users can upload banners',
      'Users can update banners',
      'Users can delete own banners'
    ];

    for (const p of policies) {
      await pool.query(`DROP POLICY IF EXISTS "${p}" ON storage.objects`);
    }

    await pool.query(`
      CREATE POLICY "Banners are public" ON storage.objects FOR SELECT USING (bucket_id = 'banners')
    `);
    await pool.query(`
      CREATE POLICY "Users can upload banners" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'banners' AND auth.uid() = (storage.foldername(name))[1]::uuid)
    `);
    await pool.query(`
      CREATE POLICY "Users can update banners" ON storage.objects FOR UPDATE USING (bucket_id = 'banners' AND auth.uid() = (storage.foldername(name))[1]::uuid)
    `);
    await pool.query(`
      CREATE POLICY "Users can delete own banners" ON storage.objects FOR DELETE USING (bucket_id = 'banners' AND auth.uid() = (storage.foldername(name))[1]::uuid)
    `);
    console.log('✅ Banners policies created');

    console.log('\n🚀 Banners setup complete!');
  } catch (err) {
    console.error('❌ Setup failed:', err.message);
  } finally {
    await pool.end();
  }
}

setup();
