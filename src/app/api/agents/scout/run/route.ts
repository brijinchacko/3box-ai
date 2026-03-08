import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db/prisma';
import { runScout } from '@/lib/agents/scout';
import { isAgentAvailable, type PlanTier } from '@/lib/agents/permissions';
import { TOKEN_COSTS, canAfford } from '@/lib/tokens/pricing';

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
      select: { plan: true, aiCreditsUsed: true, aiCreditsLimit: true },
    });
    const plan = (user?.plan || 'BASIC') as PlanTier;

    if (!isAgentAvailable('scout', plan)) {
      return NextResponse.json({ error: 'Scout requires Starter plan or above' }, { status: 403 });
    }

    // Parse body early so we can calculate token cost
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

    // Token check — cost depends on number of platforms
    const platformCount = platforms?.length || 6;
    const tokenCost = platformCount * TOKEN_COSTS.scout_search_per_platform;

    if (!canAfford(user?.aiCreditsUsed ?? 0, user?.aiCreditsLimit ?? 0, tokenCost)) {
      const remaining = Math.max(0, (user?.aiCreditsLimit ?? 0) - (user?.aiCreditsUsed ?? 0));
      return NextResponse.json({
        error: 'Insufficient tokens',
        code: 'INSUFFICIENT_TOKENS',
        required: tokenCost,
        remaining,
      }, { status: 402 });
    }

    // Check no concurrent run
    const activeRun = await prisma.autoApplyRun.findFirst({
      where: { userId: session.user.id, status: 'running' },
    });
    if (activeRun) {
      return NextResponse.json({ error: 'An agent run is already in progress' }, { status: 409 });
    }

    if (!targetRole) {
      return NextResponse.json({ error: 'Target role is required' }, { status: 400 });
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
        summary: `Scout mission: ${targetRole} in ${location || 'anywhere'}`,
      },
    });

    // Run Scout
    const result = await runScout({
      userId: session.user.id,
      targetRoles: [targetRole],
      targetLocations: location ? [location] : [],
      preferRemote: workMode === 'remote',
      minMatchScore: 20, // Low threshold — show all reasonable matches
      excludeCompanies: [],
      excludeKeywords: [],
      limit: Math.max(Math.min(limit, 60), 40), // Ensure at least 40 requested, max 60
      platforms,
    });

    // Update run record + deduct tokens
    await Promise.all([
      prisma.autoApplyRun.update({
        where: { id: run.id },
        data: {
          status: 'completed',
          completedAt: new Date(),
          jobsFound: result.totalFound,
          jobsSkipped: result.scamJobsFiltered,
          creditsUsed: tokenCost,
          summary: `Scout found ${result.totalFound} jobs, ${result.totalFiltered} qualified (${result.scamJobsFiltered} scam filtered) from ${result.sources.join(', ')}`,
          details: JSON.parse(JSON.stringify({
            jobs: result.jobs,
            totalFound: result.totalFound,
            totalFiltered: result.totalFiltered,
            scamJobsFiltered: result.scamJobsFiltered,
            sources: result.sources,
            missionParams: { targetRole, location, workMode, salaryExpectation, experienceLevel, platforms },
          })),
        },
      }),
      prisma.user.update({
        where: { id: session.user.id },
        data: { aiCreditsUsed: { increment: tokenCost } },
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
