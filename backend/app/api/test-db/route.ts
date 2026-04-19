import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();
    
    // Try to query the database
    const { data, error } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);

    if (error) {
      return NextResponse.json({
        connected: false,
        error: error.message,
        details: error,
      }, { status: 500 });
    }

    return NextResponse.json({
      connected: true,
      message: 'Database connection successful',
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
      databaseUrl: process.env.DATABASE_URL ? 'Set (hidden for security)' : 'Not set',
    });
  } catch (error) {
    return NextResponse.json({
      connected: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
