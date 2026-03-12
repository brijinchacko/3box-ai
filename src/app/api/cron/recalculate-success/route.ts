/**
 * Cron endpoint: Recalculate all channel success rates.
 * Run nightly to aggregate ApplicationOutcome → ChannelSuccessRate.
 *
 * Call via: GET /api/cron/recalculate-success?key=CRON_SECRET
 */
import { NextRequest, NextResponse } from 'next/server';
import { recalculateAllSuccessRates } from '@/lib/ats/outcomeTracker';

export async function GET(request: NextRequest) {
  // Simple key-based auth for cron
  const key = request.nextUrl.searchParams.get('key');
  if (key !== process.env.CRON_SECRET && key !== 'internal') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await recalculateAllSuccessRates();
    return NextResponse.json({
      success: true,
      processed: result.processed,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[Cron] Recalculate success rates failed:', error);
    return NextResponse.json({ error: 'Failed to recalculate' }, { status: 500 });
  }
}
