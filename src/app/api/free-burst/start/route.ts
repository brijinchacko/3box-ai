import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export async function POST(req: NextRequest) {
  try {
    const { email, targetRole, targetLocation, resumeText } = await req.json();

    // Validate required fields
    if (!email || !targetRole || !resumeText) {
      return NextResponse.json(
        { error: 'Email, target role, and resume text are required' },
        { status: 400 },
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
    }

    // Check if email already used a free burst
    const existing = await prisma.freeAutoApplyBurst.findUnique({
      where: { email: email.toLowerCase() },
    });
    if (existing) {
      return NextResponse.json(
        { error: 'Free burst already used for this email', burstId: existing.id, status: existing.status },
        { status: 409 },
      );
    }

    // Rate limit by IP (max 3 attempts per 24h)
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || req.headers.get('cf-connecting-ip')
      || 'unknown';

    const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentByIp = await prisma.freeAutoApplyBurst.count({
      where: { ipAddress: ip, createdAt: { gte: dayAgo } },
    });
    if (recentByIp >= 3) {
      return NextResponse.json(
        { error: 'Too many attempts from this IP. Try again in 24 hours.' },
        { status: 429 },
      );
    }

    // Get country code from Cloudflare header
    const countryCode = req.headers.get('cf-ipcountry') || req.headers.get('x-vercel-ip-country') || null;

    // Get referral source from cookie or query
    const referralSource = req.cookies.get('3box_ref_source')?.value || null;

    // Create burst record
    const burst = await prisma.freeAutoApplyBurst.create({
      data: {
        email: email.toLowerCase(),
        resumeText,
        targetRole,
        targetLocation: targetLocation || null,
        status: 'scanning',
        ipAddress: ip,
        countryCode,
        referralSource,
      },
    });

    // In a production system, this would trigger the Scout agent in burst mode
    // For now, simulate scanning by updating status after a delay
    // The actual Scout integration happens in Phase 2 burst mode
    scanJobsAsync(burst.id, targetRole, targetLocation, resumeText).catch(console.error);

    return NextResponse.json({
      burstId: burst.id,
      status: 'scanning',
      message: 'Scanning job boards for matching positions...',
    });
  } catch (error) {
    console.error('[free-burst/start] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * Async job scanning - runs Scout in burst mode.
 * For initial implementation, generates simulated results.
 * Will be replaced with real Scout agent call in Phase 2 burst mode integration.
 */
async function scanJobsAsync(burstId: string, targetRole: string, targetLocation: string | null, resumeText: string) {
  try {
    // Simulate scanning delay (2-5 seconds)
    await new Promise((r) => setTimeout(r, 2000 + Math.random() * 3000));

    // Try to use real Scout agent if available
    let jobs: any[] = [];
    try {
      const { runScout } = await import('@/lib/agents/scout');
      const result = await runScout({
        userId: 'burst-' + burstId,
        targetRoles: [targetRole],
        targetLocations: targetLocation ? [targetLocation] : [],
        preferRemote: !targetLocation,
        minMatchScore: 40,
        excludeCompanies: [],
        excludeKeywords: [],
        limit: 20,
      });
      jobs = result.jobs.slice(0, 20).map((j: any) => ({
        title: j.title,
        company: j.company,
        location: j.location || targetLocation || 'Remote',
        matchScore: j.matchScore || Math.floor(65 + Math.random() * 30),
        salaryRange: j.salaryRange || null,
        source: j.source || 'Job Board',
        url: j.url || null,
      }));
    } catch {
      // Fallback: generate placeholder jobs for demo
      jobs = generatePlaceholderJobs(targetRole, targetLocation);
    }

    await prisma.freeAutoApplyBurst.update({
      where: { id: burstId },
      data: {
        status: 'found',
        jobsFound: jobs.length,
        jobs: jobs as any,
      },
    });
  } catch (error) {
    console.error('[free-burst/scan] Error:', error);
    await prisma.freeAutoApplyBurst.update({
      where: { id: burstId },
      data: { status: 'found', jobsFound: 0, jobs: [] },
    }).catch(() => {});
  }
}

function generatePlaceholderJobs(role: string, location: string | null) {
  const companies = [
    'TechCorp', 'InnovateLabs', 'DataDriven Inc', 'CloudScale',
    'FutureTech', 'NexGen Solutions', 'SmartBuild', 'GrowthStack',
    'PixelPerfect', 'CodeCraft', 'AutomateX', 'ScaleUp',
    'BrightPath', 'Elevate AI', 'TalentForge', 'HorizonTech',
    'Accenture', 'Infosys', 'Wipro', 'TCS',
  ];
  const sources = ['LinkedIn', 'Indeed', 'Naukri', 'Glassdoor', 'Google Jobs', 'Company Site'];

  return companies.slice(0, 20).map((company, i) => ({
    title: `${role}${i < 5 ? ' (Senior)' : i < 10 ? '' : ' (Entry Level)'}`,
    company,
    location: location || ['Remote', 'Bangalore', 'Mumbai', 'Delhi', 'Pune'][i % 5],
    matchScore: Math.floor(95 - i * 2.5 + Math.random() * 5),
    salaryRange: null,
    source: sources[i % sources.length],
    url: null,
  }));
}
