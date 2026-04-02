import { NextResponse, NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db/prisma';
import { checkApplicationCap } from '@/lib/tokens/dailyCap';
import { applyToJob, type JobForApplication, type ResumeData } from '@/lib/agents/archer';
import { sendEmail } from '@/lib/email';

/**
 * POST /api/jobs/quick-apply — Apply to a single job from Live Search
 *
 * Checks: resume finalized, application cap, then triggers Archer.
 * Saves job to ScoutJob table and creates a JobApplication record.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await request.json();
    const { title, company, location, description, url, source, matchScore, salary, remote } = body;

    if (!title || !company || !url) {
      return NextResponse.json({ error: 'Missing required fields: title, company, url' }, { status: 400 });
    }

    // 1. Check resume is finalized
    const resume = await prisma.resume.findFirst({
      where: { userId, isFinalized: true },
      orderBy: { updatedAt: 'desc' },
    });

    if (!resume) {
      return NextResponse.json({
        error: 'resume_not_ready',
        message: 'You need a finalized resume before applying. Please create and verify your resume first.',
      }, { status: 400 });
    }

    // 2. Check application cap
    const cap = await checkApplicationCap(userId);
    if (!cap.allowed) {
      return NextResponse.json({
        error: 'limit_reached',
        message: `Application limit reached (${cap.used}/${cap.limit} ${cap.limitType === 'weekly' ? 'this week' : 'today'}).`,
        cap,
      }, { status: 429 });
    }

    // 3. Save to ScoutJob (so it appears on the board)
    const dedupeKey = `${company.toLowerCase().replace(/[^a-z0-9]/g, '')}-${title.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 40)}`;
    const scoutJob = await prisma.scoutJob.upsert({
      where: { userId_dedupeKey: { userId, dedupeKey } },
      create: {
        userId,
        title,
        company,
        location: location || '',
        description: description || '',
        jobUrl: url,
        source: source || 'Live Search',
        matchScore: matchScore || null,
        salary: salary || null,
        remote: remote || false,
        status: 'APPLYING',
        dedupeKey,
      },
      update: {
        status: 'APPLYING',
      },
    });

    // 4. Trigger Archer to apply (async, don't block response)
    const resumeContent = resume.content as unknown as ResumeData;
    const jobForApp: JobForApplication = {
      id: scoutJob.id,
      title,
      company,
      location: location || '',
      description: description || '',
      url,
      source: source || 'Live Search',
      matchScore: matchScore || undefined,
    };

    // Fire-and-forget: apply in background
    (async () => {
      try {
        const result = await applyToJob(userId, jobForApp, resumeContent);

        // Update ScoutJob status based on result
        const newStatus = result.success
          ? result.method === 'email' || result.method === 'user_email' ? 'EMAILED' : 'APPLIED'
          : result.channel === 'portal_queue' ? 'SKIPPED' : 'READY';

        await prisma.scoutJob.update({
          where: { id: scoutJob.id },
          data: {
            status: newStatus,
            appliedAt: result.success ? new Date() : undefined,
          },
        });

        console.log(`[QuickApply] ${result.success ? 'Applied' : 'Failed'} to "${title}" at ${company} via ${result.method}: ${result.details}`);

        // Send confirmation email to user if application succeeded
        if (result.success) {
          try {
            const user = await prisma.user.findUnique({ where: { id: userId }, select: { email: true, name: true } });
            if (user?.email) {
              await sendEmail({
                to: user.email,
                subject: `Application Sent: ${title} at ${company}`,
                html: `
                  <div style="font-family:system-ui,sans-serif;max-width:520px;margin:0 auto;padding:24px;background:#0f172a;color:#e2e8f0;border-radius:12px;">
                    <h2 style="color:#38bdf8;margin:0 0 16px;">Application Confirmed ✓</h2>
                    <p style="margin:0 0 12px;color:#94a3b8;">Hi ${user.name || 'there'},</p>
                    <p style="margin:0 0 16px;">Your application has been sent successfully:</p>
                    <div style="background:#1e293b;border-radius:8px;padding:16px;margin:0 0 16px;">
                      <p style="margin:0 0 4px;font-weight:600;color:#f8fafc;">${title}</p>
                      <p style="margin:0 0 4px;color:#94a3b8;">${company}${location ? ` · ${location}` : ''}</p>
                      <p style="margin:0;color:#64748b;font-size:13px;">Applied via ${result.method === 'email' || result.method === 'user_email' ? 'Email' : result.method === 'ats_api' ? 'ATS Portal' : 'Job Portal'}</p>
                    </div>
                    <p style="margin:0 0 8px;color:#94a3b8;font-size:13px;">Track all your applications on your <a href="https://3box.ai/dashboard/board" style="color:#38bdf8;text-decoration:none;">Applications Dashboard</a>.</p>
                    <p style="margin:16px 0 0;color:#475569;font-size:12px;">— 3BOX AI</p>
                  </div>
                `,
              });
            }
          } catch (_emailErr) { /* Don't fail the apply if confirmation email fails */ }
        }
      } catch (err) {
        console.error(`[QuickApply] Error applying to "${title}" at ${company}:`, err);
        await prisma.scoutJob.update({
          where: { id: scoutJob.id },
          data: { status: 'READY' },
        }).catch(() => {});
      }
    })();

    return NextResponse.json({
      success: true,
      message: 'Application in progress',
      scoutJobId: scoutJob.id,
      cap: {
        remaining: cap.remaining - 1,
        limit: cap.limit,
        limitType: cap.limitType,
      },
    });
  } catch (error) {
    console.error('[QuickApply] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * GET /api/jobs/quick-apply — Check if user can auto-apply (resume + cap status)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    const [resume, cap] = await Promise.all([
      prisma.resume.findFirst({
        where: { userId, isFinalized: true },
        select: { id: true, approvalStatus: true, isFinalized: true },
        orderBy: { updatedAt: 'desc' },
      }),
      checkApplicationCap(userId),
    ]);

    return NextResponse.json({
      resumeReady: !!resume,
      resumeStatus: resume ? resume.approvalStatus : 'none',
      cap: {
        allowed: cap.allowed,
        used: cap.used,
        limit: cap.limit,
        remaining: cap.remaining,
        limitType: cap.limitType,
        resetsAt: cap.resetsAt,
      },
    });
  } catch (error) {
    console.error('[QuickApply] Status check error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
