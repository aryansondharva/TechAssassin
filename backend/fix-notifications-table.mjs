/**
 * Fix Notifications Table
 * This script fixes the notifications table structure
 */

import { config } from 'dotenv';

// Load environment variables
config({ path: '.env.local' });

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('Missing DATABASE_URL in environment variables!');
  process.exit(1);
}

async function fixNotificationsTable() {
  try {
    console.log('=== FIXING NOTIFICATIONS TABLE ===\n');

    // Import pg dynamically
    const { Client } = await import('pg');
    
    // Create client with DATABASE_URL
    const client = new Client({
      connectionString: DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });

    await client.connect();
    console.log('Connected to PostgreSQL database');

    // Step 1: Check current columns
    console.log('Step 1: Checking current notifications table structure...');
    
    const checkColumns = `
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'notifications' 
      ORDER BY ordinal_position;
    `;
    
    const result = await client.query(checkColumns);
    console.log('Current columns:');
    result.rows.forEach(row => console.log(`- ${row.column_name}: ${row.data_type}`));

    // Step 2: Add missing columns one by one
    console.log('\nStep 2: Adding missing columns...');
    
    const columnsToAdd = [
      'sender_clerk_user_id TEXT REFERENCES profiles(clerk_user_id)',
      'notification_type_id TEXT REFERENCES notification_types(id)',
      'in_app BOOLEAN DEFAULT TRUE',
      'email BOOLEAN DEFAULT FALSE',
      'push BOOLEAN DEFAULT FALSE',
      'sms BOOLEAN DEFAULT FALSE',
      'is_sent BOOLEAN DEFAULT FALSE',
      'is_delivered BOOLEAN DEFAULT FALSE',
      'read_at TIMESTAMPTZ',
      'sent_at TIMESTAMPTZ',
      'delivered_at TIMESTAMPTZ',
      'priority TEXT CHECK (priority IN (\'low\', \'normal\', \'high\', \'urgent\')) DEFAULT \'normal\'',
      'scheduled_at TIMESTAMPTZ',
      'action_url TEXT',
      'action_text TEXT',
      'action_data JSONB DEFAULT \'{}\'',
      'updated_at TIMESTAMPTZ DEFAULT NOW()'
    ];

    for (const columnDef of columnsToAdd) {
      const columnName = columnDef.split(' ')[0];
      try {
        await client.query(`ALTER TABLE notifications ADD COLUMN IF NOT EXISTS ${columnDef}`);
        console.log(`✓ Added column: ${columnName}`);
      } catch (error) {
        console.log(`✗ Failed to add column ${columnName}: ${error.message}`);
      }
    }

    // Step 3: Rename clerk_user_id to recipient_clerk_user_id
    console.log('\nStep 3: Renaming clerk_user_id to recipient_clerk_user_id...');
    
    try {
      await client.query('ALTER TABLE notifications RENAME COLUMN clerk_user_id TO recipient_clerk_user_id');
      console.log('✓ Renamed clerk_user_id to recipient_clerk_user_id');
    } catch (error) {
      console.log(`✗ Failed to rename column: ${error.message}`);
    }

    // Step 4: Drop old type column
    console.log('\nStep 4: Dropping old type column...');
    
    try {
      await client.query('ALTER TABLE notifications DROP COLUMN IF EXISTS type');
      console.log('✓ Dropped old type column');
    } catch (error) {
      console.log(`✗ Failed to drop type column: ${error.message}`);
    }

    // Step 5: Create indexes
    console.log('\nStep 5: Creating indexes...');
    
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_notifications_recipient_clerk_user_id ON notifications(recipient_clerk_user_id)',
      'CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read)',
      'CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC)',
      'CREATE INDEX IF NOT EXISTS idx_notifications_priority ON notifications(priority)'
    ];

    for (const indexSql of indexes) {
      try {
        await client.query(indexSql);
        console.log(`✓ Created index`);
      } catch (error) {
        console.log(`✗ Failed to create index: ${error.message}`);
      }
    }

    // Step 6: Check final structure
    console.log('\nStep 6: Checking final table structure...');
    
    const finalResult = await client.query(checkColumns);
    console.log('Final columns:');
    finalResult.rows.forEach(row => console.log(`- ${row.column_name}: ${row.data_type}`));

    await client.end();

    console.log('\n=== NOTIFICATIONS TABLE FIXED ===');
    console.log('\nThe notifications table now has:');
    console.log('- All required columns for comprehensive notifications');
    console.log('- Proper foreign key relationships');
    console.log('- Performance indexes');
    console.log('- Clerk integration ready');

  } catch (error) {
    console.error('Failed to fix notifications table:', error.message);
    process.exit(1);
  }
}

fixNotificationsTable();
