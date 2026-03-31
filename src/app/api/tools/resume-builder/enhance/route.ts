import { NextResponse } from 'next/server';
import { aiChat, AI_MODELS, extractJSON } from '@/lib/ai/openrouter';
import { checkRateLimit, getClientIP } from '@/lib/rateLimit';

/**
 * Free Resume Builder - AI Enhancement Endpoint
 * No auth required. Enhances individual resume sections using AI.
 * Rate limited via shared rateLimit module (5/tool/hr + 20/day).
 * Uses free-tier model with fallback chain.
 */

// ── Model fallback chain: paid first (reliable), then free fallbacks ──
const FREE_MODEL_CHAIN = [
  'openai/gpt-4o-mini',
  'deepseek/deepseek-chat',
  'nvidia/nemotron-3-super-120b-a12b:free',
  'openai/gpt-oss-120b:free',
  'meta-llama/llama-3.3-70b-instruct:free',
  'google/gemma-3-12b-it:free',
  'stepfun/step-3.5-flash:free',
];

// ── Section-specific prompts ─────────────────────

function getPromptForSection(
  section: string,
  content: any,
  context: { role?: string; skills?: string[]; summary?: string }
): { system: string; user: string } | null {
  switch (section) {
    case 'summary': {
      return {
        system:
          'You are an expert resume writer. Rewrite this professional summary to be more impactful, ATS-friendly, and action-oriented. Keep it 2-3 sentences. Return ONLY JSON: { "summary": "enhanced text" }',
        user: `Current summary:\n${content}\n\nRole context: ${context.role || 'Not specified'}`,
      };
    }

    case 'experience': {
      const bullets = Array.isArray(content) ? content.join('\n- ') : String(content);
      return {
        system:
          `You are an expert resume writer. Enhance the bullet points for a specific role. Rules:
- Return 3 to 5 bullet points MAXIMUM (pick the most impactful ones, drop weak/redundant points)
- Each bullet must be DIRECTLY relevant to the given role and company context
- Use strong action verbs (Led, Built, Improved, Delivered, Streamlined, Reduced, etc.)
- Include quantified achievements where possible (percentages, dollar amounts, team sizes)
- Make bullets ATS-friendly with industry keywords
- Do NOT add generic/filler bullets — quality over quantity
Return ONLY JSON: { "bullets": ["bullet1", "bullet2", ...] }`,
        user: `Current bullets:\n- ${bullets}\n\nRole: ${context.role || 'Not specified'}`,
      };
    }

    case 'skills': {
      const skillsList = Array.isArray(content) ? content.join(', ') : String(content);
      return {
        system: `Analyze these skills for a ${context.role || 'professional'} resume. Suggest additional relevant technical and soft skills. Return ONLY JSON: { "skills": ["existing + new skills"] }`,
        user: `Current skills: ${skillsList}\n\nRole: ${context.role || 'Not specified'}\nSummary: ${context.summary || 'Not provided'}`,
      };
    }

    default:
      return null;
  }
}

export async function POST(req: Request) {
  try {
    // ── 1. Rate limit by IP ──────────────────────
    const ip = getClientIP(req);
    const rateLimit = checkRateLimit(ip, 'resume-builder-enhance');
    if (!rateLimit.allowed) {
      const retryAfter = Math.ceil((rateLimit.resetAt.getTime() - Date.now()) / 1000);
      return NextResponse.json(
        { error: 'Rate limit exceeded. Sign up for free unlimited access!', retryAfter },
        { status: 429 },
      );
    }

    // ── 2. Parse body ────────────────────────────
    const body = await req.json();
    const { section, content, context } = body;

    if (!section || !['summary', 'experience', 'skills'].includes(section)) {
      return NextResponse.json(
        { error: 'bad_request', message: 'Section must be one of: summary, experience, skills.' },
        { status: 400 },
      );
    }

    if (!content) {
      return NextResponse.json(
        { error: 'bad_request', message: 'Content to enhance is required.' },
        { status: 400 },
      );
    }

    // ── 3. Build prompts ─────────────────────────
    const prompts = getPromptForSection(section, content, context || {});
    if (!prompts) {
      return NextResponse.json(
        { error: 'bad_request', message: 'Invalid section type.' },
        { status: 400 },
      );
    }

    // ── 4. Call AI with fallback ─────────────────
    let rawResponse = '';
    let lastError: Error | null = null;

    for (const modelId of FREE_MODEL_CHAIN) {
      try {
        rawResponse = await aiChat({
          messages: [
            { role: 'system', content: prompts.system },
            { role: 'user', content: prompts.user },
          ],
          model: modelId,
          temperature: 0.7,
          maxTokens: 2048,
        });

        if (rawResponse && rawResponse.trim().length > 5) {
          console.log(`[Resume Enhance] Success with model: ${modelId}`);
          break;
        } else {
          console.warn(`[Resume Enhance] Empty response from ${modelId}, trying next...`);
          lastError = new Error(`Empty response from ${modelId}`);
        }
      } catch (err: any) {
        console.warn(`[Resume Enhance] Model ${modelId} failed:`, err.message);
        lastError = err;
      }
    }

    if (!rawResponse || rawResponse.trim().length < 5) {
      console.error('[Resume Enhance] All free models failed. Last error:', lastError?.message);
      return NextResponse.json(
        { error: 'enhance_failed', message: 'AI service is temporarily busy. Please try again in a moment.' },
        { status: 500 },
      );
    }

    // ── 5. Parse JSON from response ──────────────
    const jsonStr = extractJSON(rawResponse);
    let parsedResult;

    try {
      parsedResult = JSON.parse(jsonStr);
    } catch {
      console.error('[Resume Enhance] Failed to parse AI response. Raw:', rawResponse.substring(0, 500));
      return NextResponse.json(
        { error: 'enhance_failed', message: 'AI returned invalid data. Please try again.' },
        { status: 500 },
      );
    }

    // Cap experience bullets at 5
    if (parsedResult?.bullets && Array.isArray(parsedResult.bullets)) {
      parsedResult.bullets = parsedResult.bullets.filter((b: string) => b && b.trim().length > 0).slice(0, 5);
    }

    return NextResponse.json({
      enhanced: parsedResult,
      cta: 'Get unlimited AI tools and auto-apply to jobs. Sign up free at 3box.ai',
      signupUrl: 'https://3box.ai/signup',
    });
  } catch (error) {
    console.error('[Resume Enhance]', error);
    return NextResponse.json(
      { error: 'enhance_failed', message: 'Failed to enhance section. Please try again.' },
      { status: 500 },
    );
  }
}
