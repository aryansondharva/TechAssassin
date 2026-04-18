/**
 * Create Event Registrations Table
 * Simple script to create just the missing event_registrations table
 */

import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { join } from 'path';

// Get __dirname in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = join(__filename, '..');

// Load environment variables
config({ path: '.env.local' });

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('Missing DATABASE_URL in environment variables!');
  process.exit(1);
}

async function createEventRegistrationsTable() {
  try {
    console.log('Creating event_registrations table...\n');

    // Import pg dynamically
    const { Client } = await import('pg');
    
    // Create client with DATABASE_URL
    const client = new Client({
      connectionString: DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });

    await client.connect();
    console.log('Connected to PostgreSQL database');

    // Create the event_registrations table
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS public.event_registrations (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
          event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
          
          -- Team Information
          team_name TEXT NOT NULL,
          team_code TEXT UNIQUE,
          team_members TEXT[] DEFAULT '{}',
          
          -- Project Details
          project_idea TEXT,
          project_description TEXT,
          tech_stack TEXT[] DEFAULT '{}',
          
          -- Registration Status
          status TEXT NOT NULL DEFAULT 'pending' 
              CHECK (status IN ('pending', 'confirmed', 'waitlisted', 'rejected', 'cancelled')),
          
          -- Attendance
          checked_in_at TIMESTAMPTZ,
          checked_out_at TIMESTAMPTZ,
          attendance_notes TEXT,
          
          -- Timestamps
          created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
          updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
          
          UNIQUE(user_id, event_id)
      );
    `;

    try {
      await client.query(createTableSQL);
      console.log('event_registrations table created successfully!');
    } catch (error) {
      console.log('Table creation result:', error.message);
    }

    // Add indexes
    const indexSQL = `
      CREATE INDEX IF NOT EXISTS idx_event_registrations_user ON public.event_registrations(user_id);
      CREATE INDEX IF NOT EXISTS idx_event_registrations_event ON public.event_registrations(event_id);
      CREATE INDEX IF NOT EXISTS idx_event_registrations_status ON public.event_registrations(status);
    `;

    try {
      await client.query(indexSQL);
      console.log('Indexes created successfully!');
    } catch (error) {
      console.log('Index creation result:', error.message);
    }

    // Add updated_at trigger
    const triggerSQL = `
      CREATE OR REPLACE FUNCTION public.handle_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN
          NEW.updated_at = NOW();
          RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;

      CREATE TRIGGER handle_event_registrations_updated_at 
          BEFORE UPDATE ON public.event_registrations 
          FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
    `;

    try {
      await client.query(triggerSQL);
      console.log('Trigger created successfully!');
    } catch (error) {
      console.log('Trigger creation result:', error.message);
    }

    // Enable RLS
    const rlsSQL = `
      ALTER TABLE public.event_registrations ENABLE ROW LEVEL SECURITY;
      
      CREATE POLICY "Users can view their own registrations" ON public.event_registrations FOR SELECT USING (auth.uid() = user_id);
      CREATE POLICY "Users can create their own registrations" ON public.event_registrations FOR INSERT WITH CHECK (auth.uid() = user_id);
      CREATE POLICY "Users can update their own registrations" ON public.event_registrations FOR UPDATE USING (auth.uid() = user_id);
    `;

    try {
      await client.query(rlsSQL);
      console.log('RLS policies created successfully!');
    } catch (error) {
      console.log('RLS creation result:', error.message);
    }

    await client.end();

    // Test the table
    console.log('\nTesting event_registrations table...');
    
    const testClient = new Client({
      connectionString: DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });

    await testClient.connect();
    
    try {
      const result = await testClient.query('SELECT COUNT(*) FROM event_registrations');
      console.log('event_registrations table: OK! Records:', result.rows[0].count);
    } catch (error) {
      console.log('Test failed:', error.message);
    }
    
    await testClient.end();

  } catch (error) {
    console.error('Script execution failed:', error.message);
    process.exit(1);
  }
}

createEventRegistrationsTable();
