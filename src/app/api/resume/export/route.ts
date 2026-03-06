import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db/prisma';
import { buildResumeHTML } from '@/lib/resume/buildHTML';

/**
 * Resume PDF Export API
 * - BASIC plan: blocked (403 upgrade_required)
 * - STARTER plan: export with watermark
 * - PRO / ULTRA plan: clean export
 *
 * Returns structured HTML that the client opens in a new tab for
 * browser print-to-PDF. The Content-Disposition header hints at a
 * filename but the real PDF conversion happens client-side.
 */
export async function POST(req: Request) {
  try {
    // ── 1. Auth check ────────────────────────────
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'unauthorized', message: 'You must be signed in to export.' },
        { status: 401 },
      );
    }

    // ── 2. Fetch fresh plan from DB ──────────────
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, plan: true, aiCreditsUsed: true, aiCreditsLimit: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'not_found', message: 'User record not found.' },
        { status: 404 },
      );
    }

    const plan = (user.plan ?? 'BASIC').toUpperCase();

    // ── 3. Plan gate ─────────────────────────────
    if (plan === 'BASIC') {
      return NextResponse.json(
        {
          error: 'upgrade_required',
          message: 'Upgrade to Starter or above to export PDF',
        },
        { status: 403 },
      );
    }

    // ── 4. Parse body ────────────────────────────
    const body = await req.json();
    const { resumeData, template } = body;

    if (!resumeData) {
      return NextResponse.json(
        { error: 'bad_request', message: 'Resume data is required.' },
        { status: 400 },
      );
    }

    const { contact, summary, experience, education, skills, certifications } =
      resumeData;

    // ── 5. Determine watermark ───────────────────
    const showWatermark = plan === 'STARTER';

    // ── 6. Track export (increment aiCreditsUsed) ─
    try {
      await prisma.user.update({
        where: { id: user.id },
        data: { aiCreditsUsed: { increment: 1 } },
      });
    } catch {
      // non-blocking – don't fail the export if tracking fails
      console.warn('[Resume Export] Could not increment export count for user', user.id);
    }

    // ── 7. Build HTML resume ─────────────────────
    const html = buildResumeHTML({
      contact,
      summary,
      experience,
      education,
      skills,
      certifications,
      template: template ?? 'modern',
      showWatermark,
    });

    return new Response(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': 'attachment; filename="resume.pdf"',
      },
    });
  } catch (error) {
    console.error('[Resume Export]', error);
    return NextResponse.json(
      { error: 'server_error', message: 'Failed to generate PDF.' },
      { status: 500 },
    );
  }
}
