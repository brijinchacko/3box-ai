import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { scanRepliesBatch } from '@/lib/email/replyScanner';

/**
 * Reply Scanner Cron — runs daily (recommended: every 6-12 hours)
 *
 * Finds all users with active Gmail connections and scans their inbox
 * for application response emails. Auto-updates application statuses
 * (VIEWED, INTERVIEW, REJECTED, OFFER) based on keyword detection.
 *
 * Protected by CRON_SECRET bearer token.
 *
 * NOTE: Requires that Gmail connections have the `gmail.readonly` scope.
 * Users who connected Gmail only for sending (gmail.send) will be skipped
 * until they reconnect with read permissions.
 */
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[ReplyScanner] Starting reply scan cron...');

    // Find all users with active Gmail connections
    const connections = await prisma.userEmailConnection.findMany({
      where: {
        provider: 'gmail',
        isActive: true,
      },
      select: { userId: true },
      distinct: ['userId'],
    });

    const userIds = connections.map((c) => c.userId);

    if (userIds.length === 0) {
      console.log('[ReplyScanner] No users with active Gmail connections.');
      return NextResponse.json({
        success: true,
        usersScanned: 0,
        totalUpdates: 0,
        message: 'No users with active Gmail connections',
      });
    }

    console.log(`[ReplyScanner] Scanning ${userIds.length} users (batch size: 5)...`);

    // Run scanner in batches of 5
    const results = await scanRepliesBatch(userIds, 5);

    // Summarize
    const totalUpdates = results.reduce((sum, r) => sum + r.updates.length, 0);
    const totalErrors = results.reduce((sum, r) => sum + r.errors.length, 0);
    const skippedUsers = results.filter((r) => r.skipped).length;
    const scannedUsers = results.filter((r) => !r.skipped).length;

    const updatesByStatus: Record<string, number> = {};
    for (const r of results) {
      for (const u of r.updates) {
        updatesByStatus[u.newStatus] = (updatesByStatus[u.newStatus] || 0) + 1;
      }
    }

    console.log(
      `[ReplyScanner] Complete — scanned: ${scannedUsers}, skipped: ${skippedUsers}, ` +
      `updates: ${totalUpdates}, errors: ${totalErrors}`,
    );

    if (totalUpdates > 0) {
      console.log('[ReplyScanner] Updates by status:', updatesByStatus);
    }

    // Log skip reasons for debugging
    const skipReasons = results
      .filter((r) => r.skipped && r.skipReason)
      .reduce((acc: Record<string, number>, r) => {
        acc[r.skipReason!] = (acc[r.skipReason!] || 0) + 1;
        return acc;
      }, {});

    return NextResponse.json({
      success: true,
      usersTotal: userIds.length,
      usersScanned: scannedUsers,
      usersSkipped: skippedUsers,
      totalUpdates,
      totalErrors,
      updatesByStatus,
      skipReasons,
      // Include individual update details (for debugging / admin visibility)
      updates: results
        .flatMap((r) => r.updates)
        .map((u) => ({
          company: u.company,
          jobTitle: u.jobTitle,
          oldStatus: u.oldStatus,
          newStatus: u.newStatus,
          matchedKeyword: u.matchedKeyword,
        })),
    });
  } catch (err) {
    console.error('[ReplyScanner] Cron error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
