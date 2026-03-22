import { NextResponse } from 'next/server';
import { buildResumeHTML } from '@/lib/resume/buildHTML';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { cookies } from 'next/headers';
import { checkRateLimit, getClientIP } from '@/lib/rateLimit';

/**
 * Free Resume Builder - Export Endpoint
 * No auth required. Free export with watermark + download tracking.
 * - 2 free downloads tracked via cookie + clientCount
 * - PRO/MAX users get unlimited clean exports
 * - Modern template: no watermark; other templates: watermark for free users
 */

const COOKIE_NAME = '3box-fdl';
const MAX_FREE_DOWNLOADS = 1;
const COOKIE_MAX_AGE = 30 * 24 * 60 * 60; // 30 days in seconds

export async function POST(req: Request) {
  try {
    // ── IP rate limiting ─────────────────────
    const ip = getClientIP(req);
    const rateLimit = checkRateLimit(ip, 'resume-builder-export');
    if (!rateLimit.allowed) {
      const retryAfter = Math.ceil((rateLimit.resetAt.getTime() - Date.now()) / 1000);
      return NextResponse.json(
        { error: 'Rate limit exceeded. Sign up for free unlimited access!', retryAfter },
        { status: 429 }
      );
    }

    // ── 1. Parse body ────────────────────────────
    const body = await req.json();
    const { resumeData, template, clientCount } = body;

    if (!resumeData) {
      return NextResponse.json(
        { error: 'bad_request', message: 'Resume data is required.' },
        { status: 400 },
      );
    }

    // ── 2. Read cookie count ─────────────────────
    const cookieStore = await cookies();
    const cookieVal = cookieStore.get(COOKIE_NAME)?.value;
    const cookieCount = cookieVal ? parseInt(cookieVal, 10) || 0 : 0;
    const realCount = Math.max(cookieCount, clientCount ?? 0);

    // ── 3. Check session for PRO/MAX bypass ────
    let isPaidUser = false;
    try {
      const session = await getServerSession(authOptions);
      if (session?.user?.id) {
        const { prisma } = await import('@/lib/db/prisma');
        const user = await prisma.user.findUnique({
          where: { id: session.user.id },
          select: { plan: true },
        });
        const plan = (user?.plan ?? 'FREE').toUpperCase();
        if (plan === 'PRO' || plan === 'MAX') {
          isPaidUser = true;
        }
      }
    } catch {
      // Session check is optional — continue as free user
    }

    // ── 4. Enforce download limit ────────────────
    if (realCount >= MAX_FREE_DOWNLOADS && !isPaidUser) {
      return NextResponse.json(
        { error: 'limit_reached', message: 'Free download limit reached. Sign up or upgrade to continue.' },
        { status: 403 },
      );
    }

    // ── 5. Determine watermark ───────────────────
    // Modern template: no watermark
    // Other templates: watermark for anonymous/free users, no watermark for PRO/MAX
    const selectedTemplate = template ?? 'modern';
    let showWatermark = false;
    if (selectedTemplate !== 'modern' && !isPaidUser) {
      showWatermark = true;
    }

    // ── 6. Build HTML ────────────────────────────
    const { contact, summary, experience, education, skills } = resumeData;

    const html = buildResumeHTML({
      contact: contact ?? { name: '', email: '', phone: '', location: '' },
      summary: summary ?? '',
      experience: experience ?? [],
      education: education ?? [],
      skills: skills ?? [],
      certifications: [],
      template: selectedTemplate,
      showWatermark,
    });

    // ── 7. Increment cookie count ────────────────
    const newCount = realCount + 1;
    const response = new Response(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': 'attachment; filename="resume.pdf"',
      },
    });

    response.headers.set('X-CTA', 'Sign up free to export unlimited resumes and auto-apply to matching jobs.');
    response.headers.set('X-Signup-URL', 'https://3box.ai/signup');
    response.headers.set(
      'Set-Cookie',
      `${COOKIE_NAME}=${newCount}; Max-Age=${COOKIE_MAX_AGE}; HttpOnly; SameSite=Lax; Path=/`,
    );

    return response;
  } catch (error) {
    console.error('[Free Resume Export]', error);
    return NextResponse.json(
      { error: 'server_error', message: 'Failed to generate PDF.' },
      { status: 500 },
    );
  }
}
