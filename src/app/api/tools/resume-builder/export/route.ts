import { NextResponse } from 'next/server';
import { buildResumeHTML } from '@/lib/resume/buildHTML';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { cookies } from 'next/headers';

/**
 * Free Resume Builder - Export Endpoint
 * No auth required. Free export with watermark + download tracking.
 * - 2 free downloads tracked via cookie + clientCount
 * - PRO/ULTRA users get unlimited clean exports
 * - Modern template: no watermark; other templates: watermark for free users
 */

const COOKIE_NAME = 'nxted-fdl';
const MAX_FREE_DOWNLOADS = 1;
const COOKIE_MAX_AGE = 30 * 24 * 60 * 60; // 30 days in seconds

export async function POST(req: Request) {
  try {
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

    // ── 3. Check session for PRO/ULTRA bypass ────
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
        if (plan === 'PRO' || plan === 'ULTRA') {
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
    // Other templates: watermark for anonymous/free users, no watermark for PRO/ULTRA
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
