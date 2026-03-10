import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { coachChat } from '@/lib/ai/openrouter';
import { getUserContextString } from '@/lib/ai/context';
import { getAgentKnowledge } from '@/lib/agents/knowledge';

const { prisma } = require('@/lib/db/prisma');

export interface ChatContext {
  coachName?: string;
  personality?: string;
  targetRole?: string;
  progress?: number;
  history?: { role: 'user' | 'assistant'; content: string }[];
  agentId?: string;
  agentName?: string;
  agentRole?: string;
}

const VALID_PROFILE_FIELDS = ['name', 'phone', 'location', 'linkedin', 'bio', 'targetRole'];

// ─── Helper: execute a profile update via Prisma ──────────
async function executeProfileUpdate(userId: string, updates: Record<string, string>) {
  // Update user-level fields
  if (updates.name) {
    await prisma.user.update({
      where: { id: userId },
      data: { name: updates.name },
    });
  }

  // Update CareerTwin fields
  const careerFieldKeys = ['phone', 'location', 'linkedin', 'bio', 'targetRole'];
  const careerUpdates = Object.fromEntries(
    Object.entries(updates).filter(([key]) => careerFieldKeys.includes(key))
  );

  if (Object.keys(careerUpdates).length > 0) {
    const existing = await prisma.careerTwin.findUnique({ where: { userId } });
    if (existing) {
      const careerUpdate: Record<string, unknown> = {};

      if (careerUpdates.targetRole) {
        careerUpdate.targetRoles = [{ title: careerUpdates.targetRole, probability: 0 }];
        delete careerUpdates.targetRole;
      }

      if (Object.keys(careerUpdates).length > 0) {
        const snap = (existing.skillSnapshot as any) || {};
        const currentProfile = snap._profile || {};
        careerUpdate.skillSnapshot = {
          ...snap,
          _profile: { ...currentProfile, ...careerUpdates },
        };
      }

      if (Object.keys(careerUpdate).length > 0) {
        await prisma.careerTwin.update({
          where: { userId },
          data: careerUpdate,
        });
      }
    }
  }
}

// ─── Parse action blocks from AI reply ──────────
function parseActions(reply: string) {
  let cleanReply = reply;
  const actions: { type: string; field: string; value: string; success: boolean }[] = [];

  const actionMatch = reply.match(/---ACTION---\s*([\s\S]*?)\s*---END_ACTION---/);
  if (actionMatch) {
    cleanReply = reply.replace(/\s*---ACTION---[\s\S]*?---END_ACTION---\s*/g, '').trim();
    try {
      const parsed = JSON.parse(actionMatch[1].trim());
      if (Array.isArray(parsed.actions)) {
        for (const a of parsed.actions) {
          if (a.type === 'update_profile' && VALID_PROFILE_FIELDS.includes(a.field) && a.value) {
            actions.push({ type: a.type, field: a.field, value: String(a.value), success: false });
          }
          if (a.type === 'navigate' && a.page) {
            actions.push({ type: 'navigate', field: 'page', value: String(a.page), success: true });
          }
        }
      }
    } catch {
      // JSON parse failed — ignore action block
    }
  }

  return { cleanReply, actions };
}

export async function POST(req: Request) {
  try {
    // Auth check
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { plan: true } });

    const body = await req.json();
    const { message, context } = body as { message?: string; context?: ChatContext };

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    // Build context with defaults — include agent-specific info from dashboard
    const agentId = context?.agentId || null;
    const chatContext: ChatContext = {
      coachName: context?.agentName || context?.coachName || 'Cortex',
      personality: context?.personality || 'friendly',
      targetRole: context?.targetRole || 'not set',
      progress: context?.progress ?? 0,
      history: context?.history || [],
      agentId: agentId || undefined,
      agentName: context?.agentName,
      agentRole: context?.agentRole,
    };

    // Build user context for AI personalization
    const userContext = await getUserContextString(session.user.id);

    // Inject agent-specific knowledge if chatting with a specific agent
    const agentKnowledge = agentId ? getAgentKnowledge(agentId as any) : null;

    const reply = await coachChat(message, chatContext, user?.plan || 'BASIC', userContext, agentKnowledge);

    // Parse actions from AI reply
    const { cleanReply, actions } = parseActions(reply);

    // Execute any profile update actions (navigate actions are passed through to the client)
    for (const action of actions) {
      if (action.type === 'update_profile') {
        try {
          const updatePayload: Record<string, string> = { [action.field]: action.value };
          await executeProfileUpdate(session.user.id, updatePayload);
          action.success = true;
        } catch (err) {
          console.error('[AI Chat] Action execution error:', err);
          action.success = false;
        }
      }
    }

    return NextResponse.json({
      reply: cleanReply,
      actions: actions.length > 0 ? actions : undefined,
    });
  } catch (error) {
    console.error('[AI Chat]', error);
    return NextResponse.json(
      { error: 'AI service temporarily unavailable' },
      { status: 500 }
    );
  }
}
