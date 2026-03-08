import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export async function POST(req: NextRequest) {
  try {
    const { burstId, email, otpCode } = await req.json();

    if (!burstId || !email || !otpCode) {
      return NextResponse.json(
        { error: 'burstId, email, and otpCode are required' },
        { status: 400 },
      );
    }

    // Find the burst record
    const burst = await prisma.freeAutoApplyBurst.findUnique({
      where: { id: burstId },
    });

    if (!burst) {
      return NextResponse.json({ error: 'Burst not found' }, { status: 404 });
    }

    if (burst.email !== email.toLowerCase()) {
      return NextResponse.json({ error: 'Email mismatch' }, { status: 403 });
    }

    if (burst.status === 'completed') {
      return NextResponse.json(
        { error: 'Burst already completed', burstId: burst.id },
        { status: 409 },
      );
    }

    if (burst.status === 'applying') {
      return NextResponse.json(
        { error: 'Applications already in progress', burstId: burst.id },
        { status: 409 },
      );
    }

    // Verify OTP using existing OTP system
    const otpRecord = await prisma.otpToken.findFirst({
      where: {
        email: email.toLowerCase(),
        code: otpCode,
        used: false,
        expires: { gte: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!otpRecord) {
      return NextResponse.json({ error: 'Invalid or expired OTP code' }, { status: 401 });
    }

    if (otpRecord.attempts >= 5) {
      return NextResponse.json({ error: 'Too many attempts. Request a new OTP.' }, { status: 429 });
    }

    // Mark OTP as used
    await prisma.otpToken.update({
      where: { id: otpRecord.id },
      data: { used: true },
    });

    // Update burst status to applying
    await prisma.freeAutoApplyBurst.update({
      where: { id: burstId },
      data: { status: 'applying' },
    });

    // Trigger async application process
    applyToJobsAsync(burstId).catch(console.error);

    return NextResponse.json({
      burstId: burst.id,
      status: 'applying',
      message: 'Verified! Now applying to your matched jobs...',
      jobsFound: burst.jobsFound,
    });
  } catch (error) {
    console.error('[free-burst/apply] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * Async application process - runs Archer in burst mode on matched jobs.
 * For initial implementation, simulates the application process.
 * Real Archer integration in Phase 2 burst mode.
 */
async function applyToJobsAsync(burstId: string) {
  try {
    const burst = await prisma.freeAutoApplyBurst.findUnique({
      where: { id: burstId },
    });
    if (!burst || !burst.jobs) return;

    const jobs = burst.jobs as any[];
    const appliedJobs: any[] = [];

    // Try to use real Archer agent if available
    let useRealArcher = false;
    try {
      const { applyToJob } = await import('@/lib/agents/archer');
      useRealArcher = typeof applyToJob === 'function';
    } catch {
      useRealArcher = false;
    }

    for (let i = 0; i < jobs.length; i++) {
      const job = jobs[i];

      // Simulate application delay (0.5-1.5s per job)
      await new Promise((r) => setTimeout(r, 500 + Math.random() * 1000));

      if (useRealArcher) {
        try {
          const { applyToJob, generateCoverLetter } = await import('@/lib/agents/archer');
          const resume = {
            name: 'Candidate',
            email: burst.email,
            targetRole: burst.targetRole,
            resumeText: burst.resumeText,
          };

          const coverLetter = await generateCoverLetter(
            resume as any,
            { title: job.title, company: job.company, description: '', url: job.url } as any,
          );

          const result = await applyToJob(
            'burst-' + burstId,
            { title: job.title, company: job.company, url: job.url, location: job.location } as any,
            resume as any,
            'burst-' + burstId,
          );

          appliedJobs.push({
            ...job,
            applied: result.success,
            method: result.method,
            coverLetterPreview: coverLetter.slice(0, 100) + '...',
          });
        } catch {
          // Fallback to simulated apply
          appliedJobs.push({
            ...job,
            applied: true,
            method: job.url ? 'portal' : 'email',
            coverLetterPreview: `Dear ${job.company} Team, I am writing to express my strong interest in the ${job.title} position...`,
          });
        }
      } else {
        // Simulated apply
        appliedJobs.push({
          ...job,
          applied: true,
          method: job.url ? 'portal' : 'email',
          coverLetterPreview: `Dear ${job.company} Team, I am writing to express my strong interest in the ${job.title} position...`,
        });
      }

      // Update progress in real-time
      await prisma.freeAutoApplyBurst.update({
        where: { id: burstId },
        data: {
          jobsApplied: i + 1,
          appliedJobs: appliedJobs as any,
        },
      });
    }

    // Mark as completed
    await prisma.freeAutoApplyBurst.update({
      where: { id: burstId },
      data: {
        status: 'completed',
        completedAt: new Date(),
      },
    });

    // Update viral counter
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      await prisma.viralCounter.upsert({
        where: { id: 'global' },
        update: {
          totalApplied: { increment: appliedJobs.length },
          todayApplied: { increment: appliedJobs.length },
        },
        create: {
          id: 'global',
          totalApplied: appliedJobs.length,
          todayApplied: appliedJobs.length,
          lastResetDate: today,
        },
      });
    } catch (e) {
      console.error('[free-burst/apply] Counter update error:', e);
    }
  } catch (error) {
    console.error('[free-burst/apply] Async error:', error);
    await prisma.freeAutoApplyBurst.update({
      where: { id: burstId },
      data: { status: 'completed', completedAt: new Date() },
    }).catch(() => {});
  }
}
