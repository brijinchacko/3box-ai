import { NextResponse, NextRequest } from 'next/server';
import { sendAllWeeklyDigests } from '@/lib/email/digest';

/**
 * Weekly Digest Cron — runs every Monday at 9:00 AM UTC
 *
 * Sends actionable weekly digest emails to all active users with:
 * - This week's stats (applications sent, jobs found, apps viewed)
 * - Top 3 unfilled jobs with match scores and "Apply Now" links
 * - Career Twin market readiness score
 * - Skill gap trend (most common missing skill)
 *
 * Protected by CRON_SECRET bearer token.
 */
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[Weekly Digest] Starting weekly digest send...');

    const result = await sendAllWeeklyDigests();

    console.log(
      `[Weekly Digest] Complete — sent: ${result.sent}, skipped: ${result.skipped}, failed: ${result.failed}`
    );

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (err) {
    console.error('[Weekly Digest] Cron error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
