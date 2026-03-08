import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { generateApplicationBasedGapAnalysis } from '@/lib/agents/sage';

/**
 * GET /api/agents/skill-gaps
 * Returns application-based skill gap analysis.
 * Format: "You applied for 50 PLC jobs. You lack: Siemens TIA Portal (42/50), SCADA (38/50)..."
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const reports = await generateApplicationBasedGapAnalysis(session.user.id);
    return NextResponse.json({ reports });
  } catch (err) {
    console.error('[Skill Gaps API]', err);
    return NextResponse.json({ reports: [] });
  }
}
