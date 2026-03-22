import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db/prisma';
import { runScout, persistScoutJobs } from '@/lib/agents/scout';
// All agents are unlocked for all plans

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      console.error('[Scout Run] Auth failed — session:', session ? 'exists' : 'null', 'user:', session?.user ? 'exists' : 'null', 'id:', session?.user?.id ?? 'missing');
      // Fallback: try to find user by email if session exists but id is missing
      if (session?.user?.email) {
        const userByEmail = await prisma.user.findUnique({ where: { email: session.user.email }, select: { id: true } });
        if (userByEmail) {
          (session.user as any).id = userByEmail.id;
        } else {
          return NextResponse.json({ error: 'Unauthorized — session found but user not in database' }, { status: 401 });
        }
      } else {
        return NextResponse.json({ error: 'Unauthorized — please sign in again' }, { status: 401 });
      }
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { plan: true },
    });
    // All agents are available on all plans — no plan gate needed

    // Parse body early so we can validate inputs
    const body = await request.json();
    const {
      platforms,
      targetRole,
      location,
      salaryExpectation,
      workMode = 'any',
      experienceLevel,
      limit = 40,
    } = body as {
      platforms?: string[];
      targetRole: string;
      location: string;
      salaryExpectation?: string;
      workMode?: 'remote' | 'hybrid' | 'onsite' | 'any';
      experienceLevel?: string;
      limit?: number;
    };

    // Check no concurrent run
    const activeRun = await prisma.autoApplyRun.findFirst({
      where: { userId: session.user.id, status: 'running' },
    });
    if (activeRun) {
      return NextResponse.json({ error: 'An agent run is already in progress' }, { status: 409 });
    }

    // Fallback: pull target role from user profile if not provided in request
    let resolvedTargetRole = targetRole;
    let resolvedLocation = location;
    if (!resolvedTargetRole) {
      const twin = await prisma.careerTwin.findUnique({ where: { userId: session.user.id } });
      const roles = twin?.targetRoles as any;
      resolvedTargetRole = Array.isArray(roles) && roles.length > 0
        ? (typeof roles[0] === 'string' ? roles[0] : roles[0]?.title || '')
        : '';
      if (!resolvedLocation) {
        const snap = twin?.skillSnapshot as any;
        resolvedLocation = snap?._profile?.location || '';
      }
    }
    if (!resolvedTargetRole) {
      return NextResponse.json({ error: 'Target role is required. Please set it in your agent configuration.' }, { status: 400 });
    }

    // Create a run record
    const run = await prisma.autoApplyRun.create({
      data: {
        userId: session.user.id,
        status: 'running',
        jobsFound: 0,
        jobsApplied: 0,
        jobsSkipped: 0,
        creditsUsed: 0,
        summary: `Scout mission: ${resolvedTargetRole} in ${resolvedLocation || 'anywhere'}`,
      },
    });

    // Run Scout
    const result = await runScout({
      userId: session.user.id,
      targetRoles: [resolvedTargetRole],
      targetLocations: resolvedLocation ? [resolvedLocation] : [],
      preferRemote: workMode === 'remote',
      minMatchScore: 20, // Low threshold — show all reasonable matches
      excludeCompanies: [],
      excludeKeywords: [],
      limit: Math.max(Math.min(limit, 60), 40), // Ensure at least 40 requested, max 60
      platforms,
    });

    // Persist to ScoutJob table for independent agent pipeline
    const { newCount, dupCount } = await persistScoutJobs(session.user.id, result.jobs, run.id);

    // Update run record + deduct tokens
    await Promise.all([
      prisma.autoApplyRun.update({
        where: { id: run.id },
        data: {
          status: 'completed',
          completedAt: new Date(),
          agentType: 'scout',
          jobsFound: result.totalFound,
          jobsSkipped: result.scamJobsFiltered,
          creditsUsed: 0,
          summary: `Scout found ${result.totalFound} jobs, ${result.totalFiltered} qualified, ${newCount} new, ${dupCount} duplicates (${result.scamJobsFiltered} scam filtered) from ${result.sources.join(', ')}`,
          details: JSON.parse(JSON.stringify({
            jobs: result.jobs,
            totalFound: result.totalFound,
            totalFiltered: result.totalFiltered,
            scamJobsFiltered: result.scamJobsFiltered,
            newJobs: newCount,
            duplicates: dupCount,
            sources: result.sources,
            missionParams: { targetRole, location, workMode, salaryExpectation, experienceLevel, platforms },
          })),
        },
      }),
    ]);

    return NextResponse.json({
      runId: run.id,
      jobs: result.jobs,
      summary: {
        totalFound: result.totalFound,
        totalFiltered: result.totalFiltered,
        scamJobsFiltered: result.scamJobsFiltered,
        sources: result.sources,
      },
    });
  } catch (err: any) {
    console.error('[Scout Run] Error:', err);
    return NextResponse.json({ error: err.message || 'Scout mission failed' }, { status: 500 });
  }
}
