import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { getApplicationCapStatus } from '@/lib/tokens/dailyCap';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const status = await getApplicationCapStatus(session.user.id);

  return NextResponse.json({
    allowed: status.allowed,
    used: status.used,
    limit: status.limit,
    remaining: status.remaining,
    limitType: status.limitType,
    resetsAt: status.resetsAt?.toISOString() || null,
  });
}
