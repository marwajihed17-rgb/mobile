import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// This endpoint runs at 00:30 daily to record the previous day's final totals
// as the baseline for the new day's statistics

export async function GET(request: NextRequest) {
  // Verify cron secret for security
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  // Allow request if:
  // 1. CRON_SECRET is set and matches the authorization header
  // 2. Request is from Vercel Cron (has x-vercel-cron header)
  const isVercelCron = request.headers.get('x-vercel-cron') === '1';
  const hasValidSecret = cronSecret && authHeader === `Bearer ${cronSecret}`;

  if (!isVercelCron && !hasValidSecret) {
    // In development, allow without secret
    if (process.env.NODE_ENV !== 'development') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
  }

  try {
    // Use service role key for admin operations
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase configuration');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Call the database function to record daily baseline
    const { error } = await supabase.rpc('record_daily_baseline');

    if (error) {
      console.error('Error recording daily baseline:', error);
      return NextResponse.json(
        { error: 'Failed to record daily baseline', details: error.message },
        { status: 500 }
      );
    }

    const now = new Date();
    console.log(`Daily baseline recorded successfully at ${now.toISOString()}`);

    return NextResponse.json({
      success: true,
      message: 'Daily baseline recorded successfully',
      timestamp: now.toISOString(),
    });
  } catch (error) {
    console.error('Cron job error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// Also allow POST for manual triggering
export async function POST(request: NextRequest) {
  return GET(request);
}
