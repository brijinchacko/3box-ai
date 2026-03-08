/**
 * Shared API route handler for all AI tools.
 * Encapsulates: input validation, usage tracking, AI call, cookie management.
 */

import { NextResponse, type NextRequest } from 'next/server';
import { checkFreeUsage, buildUsageCookie } from '@/lib/usage/serverUsageCheck';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { aiChatWithFallback, extractJSON } from '@/lib/ai/openrouter';

export interface ToolAPIConfig {
  /** Cookie name for usage tracking, e.g. "jobted-resumesum-uses" */
  cookieName: string;
  /** Required body fields — returns 400 if any missing */
  requiredFields: string[];
  /** System prompt for the AI model */
  systemPrompt: string;
  /** Build the user message from request body */
  buildUserPrompt: (body: Record<string, any>) => string;
  /** AI temperature (default 0.7) */
  temperature?: number;
  /** Max response tokens (default 2048) */
  maxTokens?: number;
  /** 'json' to parse JSON from response, 'text' to return raw text */
  responseFormat?: 'text' | 'json';
  /** Custom error message for AI failure */
  errorMessage?: string;
  /** Max free uses before requiring subscription (default 2) */
  maxFreeUses?: number;
}

export async function handleToolRequest(
  request: NextRequest,
  config: ToolAPIConfig
): Promise<NextResponse> {
  try {
    const body = await request.json();

    // ── Validate required fields ────────────────
    // When resume text is provided, skip validation for other fields
    const hasResume = body.resumeText && typeof body.resumeText === 'string' && body.resumeText.trim().length > 50;
    if (!hasResume) {
      for (const field of config.requiredFields) {
        if (!body[field] || (typeof body[field] === 'string' && !body[field].trim())) {
          return NextResponse.json(
            { error: `${field} is required` },
            { status: 400 }
          );
        }
      }
    }

    // ── Usage limit tracking ────────────────────
    const maxUses = config.maxFreeUses ?? 2;
    const cookieHeader = request.headers.get('cookie') || '';
    const cookieRegex = new RegExp(`${config.cookieName}=(\\d+)`);
    const cookieMatch = cookieHeader.match(cookieRegex);
    const cookieValue = cookieMatch ? cookieMatch[1] : undefined;
    const { allowed, realCount } = checkFreeUsage(cookieValue, body.clientCount ?? 0, maxUses);

    if (!allowed) {
      // Check if user has a paid session
      let isPaidUser = false;
      try {
        const session = await getServerSession(authOptions);
        if (session?.user?.id) {
          const { prisma } = await import('@/lib/db/prisma');
          const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { plan: true },
          });
          const plan = (user?.plan ?? 'BASIC').toUpperCase();
          if (plan !== 'BASIC') {
            isPaidUser = true;
          }
        }
      } catch {
        // Session check is optional
      }

      if (!isPaidUser) {
        return NextResponse.json(
          { error: 'limit_reached', message: 'Free uses exceeded. Subscribe to continue using this tool.' },
          { status: 403 }
        );
      }
    }

    // ── Call AI model ───────────────────────────
    let userPrompt = config.buildUserPrompt(body);

    // Auto-append resume context if provided
    if (body.resumeText && typeof body.resumeText === 'string' && body.resumeText.trim()) {
      userPrompt += `\n\n--- RESUME ---\n${body.resumeText.trim()}`;
    }

    let aiResult: string;
    try {
      aiResult = await aiChatWithFallback(
        {
          messages: [
            { role: 'system', content: config.systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          temperature: config.temperature ?? 0.7,
          maxTokens: config.maxTokens ?? 2048,
        },
        'free'
      );
    } catch (err) {
      console.error(`[Tool API] AI call failed for ${config.cookieName}:`, err);
      return NextResponse.json(
        { error: config.errorMessage || 'AI service temporarily unavailable. Please try again.' },
        { status: 503 }
      );
    }

    // ── Parse response ──────────────────────────
    let result: any;
    if (config.responseFormat === 'json') {
      try {
        const cleaned = extractJSON(aiResult);
        result = JSON.parse(cleaned);
      } catch {
        // Return raw text as fallback
        result = { text: aiResult };
      }
    } else {
      result = { text: aiResult };
    }

    // ── Build response with usage cookie ────────
    const newCount = realCount + 1;
    const cookieString = buildUsageCookie(config.cookieName, newCount);

    const response = NextResponse.json({ success: true, result });
    response.headers.set('Set-Cookie', cookieString);
    return response;
  } catch (error) {
    console.error(`[Tool API] Error:`, error);
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}
