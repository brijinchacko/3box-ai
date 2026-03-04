import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface ServiceCheck {
  name: string;
  status: 'operational' | 'degraded' | 'down';
  latency?: number;
  message?: string;
}

export async function GET() {
  const startTime = Date.now();
  const checks: ServiceCheck[] = [];

  // 1. Database check
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
      message: 'Connection failed',
    });
  }

  // 2. Auth service check
  try {
    const authStart = Date.now();
    const authCheck = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3002'}/api/auth/providers`, {
      signal: AbortSignal.timeout(5000),
    });
    checks.push({
      name: 'Authentication',
      status: authCheck.ok ? 'operational' : 'degraded',
      latency: Date.now() - authStart,
    });
  } catch {
    checks.push({
      name: 'Authentication',
      status: 'degraded',
      message: 'Timeout or unreachable',
    });
  }

  // 3. AI Service (OpenRouter) check
  const hasOpenRouter = !!process.env.OPENROUTER_API_KEY;
  checks.push({
    name: 'AI Services',
    status: hasOpenRouter ? 'operational' : 'degraded',
    message: hasOpenRouter ? undefined : 'API key not configured',
  });

  // 4. Stripe check
  const hasStripe = !!process.env.STRIPE_SECRET_KEY;
  checks.push({
    name: 'Payments',
    status: hasStripe ? 'operational' : 'degraded',
    message: hasStripe ? undefined : 'Not configured',
  });

  // 5. Email service check
  const hasEmail = !!process.env.RESEND_API_KEY;
  checks.push({
    name: 'Email Service',
    status: hasEmail ? 'operational' : 'degraded',
    message: hasEmail ? undefined : 'Not configured',
  });

  // 6. App server (always operational if we reach here)
  checks.push({
    name: 'Web Server',
    status: 'operational',
    latency: Date.now() - startTime,
  });

  // Overall status
  const allOperational = checks.every((c) => c.status === 'operational');
  const anyDown = checks.some((c) => c.status === 'down');
  const overallStatus = anyDown ? 'major_outage' : allOperational ? 'operational' : 'partial_outage';

  const response = {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version || '1.0.0',
    services: checks,
    responseTime: Date.now() - startTime,
  };

  return NextResponse.json(response, {
    status: anyDown ? 503 : 200,
    headers: {
      'Cache-Control': 'no-store, max-age=0',
    },
  });
}
