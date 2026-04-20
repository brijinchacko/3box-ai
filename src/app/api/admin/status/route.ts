import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin';
import { prisma } from '@/lib/db/prisma';
import os from 'os';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface ServiceCheck {
  name: string;
  status: 'operational' | 'degraded' | 'down';
  latency?: number;
  message?: string;
}

export async function GET() {
  const auth = await requireAdmin();
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const start = Date.now();
  const checks: ServiceCheck[] = [];

  // ─── 1. Database ──────────────────────────
  try {
    const dbStart = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    checks.push({
      name: 'Database',
      status: 'operational',
      latency: Date.now() - dbStart,
    });
  } catch (e: any) {
    checks.push({
      name: 'Database',
      status: 'down',
      message: e?.message?.substring(0, 120) || 'Connection failed',
    });
  }

  // ─── 2. External APIs (env-based) ─────────
  const envChecks = [
    { name: 'Auth (NextAuth)', key: 'NEXTAUTH_SECRET' },
    { name: 'AI Services (OpenRouter)', key: 'OPENROUTER_API_KEY' },
    { name: 'Payments (Stripe)', key: 'STRIPE_SECRET_KEY' },
    { name: 'Email (Resend)', key: 'RESEND_API_KEY' },
    { name: 'Google OAuth', key: 'GOOGLE_CLIENT_ID' },
    { name: 'LinkedIn OAuth', key: 'LINKEDIN_CLIENT_ID' },
    { name: 'Job Scrapers (Serper)', key: 'SERPER_API_KEY' },
    { name: 'Analytics (GA4)', key: 'NEXT_PUBLIC_GA_MEASUREMENT_ID' },
  ];
  for (const ec of envChecks) {
    const val = process.env[ec.key];
    checks.push({
      name: ec.name,
      status: val ? 'operational' : 'degraded',
      message: val ? undefined : 'Not configured',
    });
  }

  // ─── 3. Traffic / Activity (last 24h) ─────
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const [
    pageViewsLast24h,
    pageViewsLastHour,
    activeSessionsLastHour,
    agentActivityLast24h,
    pastDueSubs,
    rejectedApps,
    signupsLast24h,
    applicationsLast24h,
  ] = await Promise.all([
    prisma.pageView.count({ where: { createdAt: { gte: oneDayAgo } } }),
    prisma.pageView.count({ where: { createdAt: { gte: oneHourAgo } } }),
    prisma.pageView.groupBy({
      by: ['sessionId'],
      where: { createdAt: { gte: oneHourAgo }, sessionId: { not: null } },
    }).then((r: any[]) => r.length).catch(() => 0),
    prisma.agentActivity.count({ where: { createdAt: { gte: oneDayAgo } } }).catch(() => 0),
    prisma.subscription.count({ where: { status: 'PAST_DUE' } }).catch(() => 0),
    prisma.jobApplication.count({
      where: { createdAt: { gte: oneDayAgo }, status: 'REJECTED' },
    }).catch(() => 0),
    prisma.user.count({ where: { createdAt: { gte: oneDayAgo } } }),
    prisma.jobApplication.count({ where: { createdAt: { gte: oneDayAgo } } }).catch(() => 0),
  ]);

  // Error rate as percentage (rejected applications / total applications)
  const errorRate = applicationsLast24h > 0
    ? Number(((rejectedApps / applicationsLast24h) * 100).toFixed(2))
    : 0;

  // ─── 4. System Metrics ─────────────────────
  const memUsage = process.memoryUsage();
  const heapUsedMB = Math.round(memUsage.heapUsed / 1024 / 1024);
  const heapTotalMB = Math.round(memUsage.heapTotal / 1024 / 1024);
  const rssMB = Math.round(memUsage.rss / 1024 / 1024);
  const uptimeSec = Math.round(process.uptime());
  const uptimeFormatted = formatUptime(uptimeSec);

  const loadAvg = os.loadavg();
  const totalMemMB = Math.round(os.totalmem() / 1024 / 1024);
  const freeMemMB = Math.round(os.freemem() / 1024 / 1024);
  const memUsagePct = Math.round(((totalMemMB - freeMemMB) / totalMemMB) * 100);
  const cpus = os.cpus().length;
  const platform = `${os.type()} ${os.release()}`;

  // ─── 5. Recent "events of concern" ─────────
  // We track: past-due subs, rejected applications, failed support tickets
  const [pastDueSubsList, recentRejections, urgentTickets] = await Promise.all([
    prisma.subscription.findMany({
      where: { status: 'PAST_DUE' },
      orderBy: { updatedAt: 'desc' },
      take: 5,
      select: {
        id: true, plan: true, status: true, currentPeriodEnd: true,
        user: { select: { email: true, name: true } },
      },
    }).catch(() => []),
    prisma.jobApplication.findMany({
      where: { status: 'REJECTED', updatedAt: { gte: oneDayAgo } },
      orderBy: { updatedAt: 'desc' },
      take: 5,
      select: {
        id: true, jobTitle: true, company: true, status: true, updatedAt: true,
        user: { select: { email: true } },
      },
    }).catch(() => []),
    prisma.supportTicket.findMany({
      where: { priority: 'high', status: { in: ['open', 'in_progress'] } },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true, subject: true, priority: true, status: true, createdAt: true,
        user: { select: { email: true, name: true } },
      },
    }).catch(() => []),
  ]);

  const recentIssues = {
    pastDueSubs: pastDueSubsList,
    rejectedApps: recentRejections,
    urgentTickets,
  };

  // ─── 6. Overall Status ─────────────────────
  const downCount = checks.filter(c => c.status === 'down').length;
  const degradedCount = checks.filter(c => c.status === 'degraded').length;
  let overallStatus: 'operational' | 'degraded' | 'down' = 'operational';
  if (downCount > 0) overallStatus = 'down';
  else if (degradedCount > 2) overallStatus = 'degraded';

  return NextResponse.json({
    overallStatus,
    responseTime: Date.now() - start,
    timestamp: new Date().toISOString(),
    services: checks,
    system: {
      uptimeSec,
      uptimeFormatted,
      nodeVersion: process.version,
      platform,
      cpus,
      loadAvg: { m1: loadAvg[0], m5: loadAvg[1], m15: loadAvg[2] },
      memory: {
        heapUsedMB, heapTotalMB, rssMB,
        systemTotalMB: totalMemMB,
        systemFreeMB: freeMemMB,
        systemUsagePct: memUsagePct,
      },
    },
    traffic: {
      pageViewsLast24h,
      pageViewsLastHour,
      activeSessionsLastHour,
      agentActivityLast24h,
      pastDueSubs,
      rejectedApps,
      errorRate,
      signupsLast24h,
      applicationsLast24h,
    },
    recentIssues,
  });
}

function formatUptime(sec: number): string {
  const d = Math.floor(sec / 86400);
  const h = Math.floor((sec % 86400) / 3600);
  const m = Math.floor((sec % 3600) / 60);
  if (d > 0) return `${d}d ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}
