import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { coachChat, aiChatStream, getModelForFeature } from '@/lib/ai/openrouter';
import type { PlanTier } from '@/lib/ai/openrouter';
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
    const { message, context, stream: useStream } = body as { message?: string; context?: ChatContext; stream?: boolean };

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

    // ── Streaming path ──────────────────────────
    if (useStream) {
      return handleStreamingChat(session.user.id, message, chatContext, user?.plan || 'BASIC', userContext, agentKnowledge);
    }

    // ── Non-streaming path (existing) ───────────
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

// ─── Streaming chat handler ──────────────────────
async function handleStreamingChat(
  userId: string,
  message: string,
  chatContext: ChatContext,
  userPlan: string,
  userContext: string,
  agentKnowledge: string | null
) {
  const model = getModelForFeature('coach', userPlan as PlanTier);
  const userContextBlock = userContext ? `\n\n## User Profile\n${userContext}\n\nIMPORTANT: Use the user's actual name, skills, targets, and progress data above to give highly personalized advice. Reference their specific situation.` : '';

  // Build system prompt (same logic as coachChat)
  let systemPrompt: string;
  if (agentKnowledge) {
    systemPrompt = `${agentKnowledge}
${userContextBlock}

## Response Rules
- Be concise (2-3 paragraphs max), encouraging, and actionable.
- Always suggest specific next steps.
- Address the user by their first name when you know it.
- Reference their specific skills, gaps, and progress when giving advice.
- CRITICAL FORMATTING RULE: NEVER use markdown formatting in your responses. No asterisks for bold or italic, no hash symbols for headings, no backtick code blocks. Write in plain, natural text only. Use numbered lists (1. 2. 3.) or dashes for lists.

## PROFILE UPDATE CAPABILITY
You can update the user's profile when they ask. Supported fields: name, phone, location, linkedin, bio, targetRole.
When an update is requested, respond with BOTH a friendly confirmation AND an action block:

Your friendly reply confirming the change.

---ACTION---
{"actions":[{"type":"update_profile","field":"phone","value":"the new value"}]}
---END_ACTION---

## Navigation Actions
When the user asks to go to a page, emit a navigation action:
---ACTION---
{"actions": [{"type": "navigate", "page": "/dashboard/resume"}]}
---END_ACTION---

Available pages: /dashboard, /dashboard/jobs, /dashboard/resume, /dashboard/agents, /dashboard/interview, /dashboard/learning, /dashboard/quality, /dashboard/settings, /dashboard/assessment, /dashboard/career-plan, /dashboard/portfolio, /pricing`;
  } else {
    systemPrompt = `You are ${chatContext.coachName || 'Cortex'}, the AI coordinator for 3BOX AI.
${userContextBlock}

## Response Rules
- Be concise (2-3 paragraphs max), encouraging, and actionable.
- Always suggest specific next steps.
- CRITICAL FORMATTING RULE: NEVER use markdown formatting in your responses. Write in plain, natural text only.`;
  }

  const messages = [
    { role: 'system' as const, content: systemPrompt },
    ...(chatContext.history || []),
    { role: 'user' as const, content: message },
  ];

  try {
    const upstreamStream = await aiChatStream(
      { messages, temperature: 0.7, maxTokens: 1024 },
      model.tier
    );

    // Create a TransformStream that buffers the full response for action parsing
    let fullText = '';
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    const transformStream = new TransformStream({
      async transform(chunk, controller) {
        const text = decoder.decode(chunk, { stream: true });
        // Parse SSE lines from OpenRouter
        const lines = text.split('\n');
        for (const line of lines) {
          if (line.startsWith('data: ') && line !== 'data: [DONE]') {
            try {
              const json = JSON.parse(line.slice(6));
              const content = json.choices?.[0]?.delta?.content || '';
              if (content) {
                fullText += content;
                // Forward the chunk as an SSE event
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content })}\n\n`));
              }
            } catch {
              // Skip malformed JSON chunks
            }
          } else if (line === 'data: [DONE]') {
            // Stream is done — parse actions from buffered text
            const { cleanReply, actions } = parseActions(fullText);

            // If the clean reply is different (action block was removed), send a correction
            if (cleanReply !== fullText && cleanReply.length < fullText.length) {
              // Send a replace event with the clean text
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ replace: cleanReply })}\n\n`));
            }

            // Execute profile update actions server-side
            for (const action of actions) {
              if (action.type === 'update_profile') {
                try {
                  await executeProfileUpdate(userId, { [action.field]: action.value });
                  action.success = true;
                } catch {
                  action.success = false;
                }
              }
            }

            // Send actions as a final event
            if (actions.length > 0) {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ actions })}\n\n`));
            }

            controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          }
        }
      },
    });

    const readableStream = upstreamStream.pipeThrough(transformStream);

    return new Response(readableStream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('[AI Chat Stream] Error:', error);
    return NextResponse.json(
      { error: 'AI streaming unavailable' },
      { status: 500 }
    );
  }
}
