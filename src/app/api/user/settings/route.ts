import { NextResponse, NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';

const { prisma } = require('@/lib/db/prisma');

/**
 * PATCH /api/user/settings
 * Update user settings. Supports updating AutoApplyConfig fields.
 */
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = session.user.id;

    const body = await request.json();
    const { autoApplyConfig } = body;

    if (autoApplyConfig && typeof autoApplyConfig === 'object') {
      // Whitelist allowed fields
      const allowed: Record<string, any> = {};
      if (typeof autoApplyConfig.perJobResumeRewrite === 'boolean') {
        allowed.perJobResumeRewrite = autoApplyConfig.perJobResumeRewrite;
      }
      if (typeof autoApplyConfig.perJobAutoApprove === 'boolean') {
        allowed.perJobAutoApprove = autoApplyConfig.perJobAutoApprove;
      }
      if (typeof autoApplyConfig.enabled === 'boolean') {
        allowed.enabled = autoApplyConfig.enabled;
      }
      if (typeof autoApplyConfig.automationMode === 'string') {
        allowed.automationMode = autoApplyConfig.automationMode;
      }

      if (Object.keys(allowed).length > 0) {
        await prisma.autoApplyConfig.upsert({
          where: { userId },
          update: allowed,
          create: { userId, ...allowed },
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[User Settings] Error:', error);
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    );
  }
}
