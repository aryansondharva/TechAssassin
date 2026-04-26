import pkg from 'pg';
const { Client } = pkg;
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

async function runSql(sql) {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('DATABASE_URL not found');
    process.exit(1);
  }

  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    await client.query(sql);
    console.log('Query successful');
  } catch (err) {
    console.error('Query failed:', err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

const sqlToRun = `
-- Create missing views and ensure basic tables for landing page
CREATE OR REPLACE VIEW public.leaderboard_all_time AS
SELECT 
    id,
    username,
    full_name,
    avatar_url,
    total_xp,
    RANK() OVER (ORDER BY total_xp DESC) as rank,
    'Elite Operative' as rank_name,
    '🚀' as rank_icon
FROM public.profiles
WHERE total_xp > 0
ORDER BY total_xp DESC;

-- Ensure events table exists (stub if missing)
CREATE TABLE IF NOT EXISTS public.events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    date TIMESTAMPTZ,
    prizes JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure registrations table exists (stub if missing)
CREATE TABLE IF NOT EXISTS public.registrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT REFERENCES public.profiles(id),
    event_id UUID REFERENCES public.events(id),
    team_name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
`;

runSql(sqlToRun);
