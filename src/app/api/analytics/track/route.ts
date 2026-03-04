import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export const dynamic = 'force-dynamic';

function parseDevice(ua: string): string {
  if (/mobile|android|iphone|ipad/i.test(ua)) {
    return /ipad|tablet/i.test(ua) ? 'tablet' : 'mobile';
  }
  return 'desktop';
}

function parseBrowser(ua: string): string {
  if (/edg/i.test(ua)) return 'Edge';
  if (/chrome/i.test(ua)) return 'Chrome';
  if (/firefox/i.test(ua)) return 'Firefox';
  if (/safari/i.test(ua)) return 'Safari';
  if (/opera|opr/i.test(ua)) return 'Opera';
  return 'Other';
}

function parseOS(ua: string): string {
  if (/windows/i.test(ua)) return 'Windows';
  if (/mac os|macintosh/i.test(ua)) return 'macOS';
  if (/linux/i.test(ua)) return 'Linux';
  if (/android/i.test(ua)) return 'Android';
  if (/iphone|ipad|ios/i.test(ua)) return 'iOS';
  return 'Other';
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { path, referrer, sessionId, userId, duration } = body;

    if (!path) {
      return NextResponse.json({ error: 'path required' }, { status: 400 });
    }

    const ua = req.headers.get('user-agent') || '';
    const forwarded = req.headers.get('x-forwarded-for');
    const ip = forwarded?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || '';

    // Simple geo lookup from IP (we'll use a free header-based approach)
    // In production, you'd use a service like MaxMind or IPinfo
    const country = req.headers.get('cf-ipcountry') ||
                    req.headers.get('x-vercel-ip-country') ||
                    null;
    const city = req.headers.get('x-vercel-ip-city') || null;

    await prisma.pageView.create({
      data: {
        path,
        referrer: referrer || null,
        userAgent: ua.substring(0, 500),
        country,
        city,
        device: parseDevice(ua),
        browser: parseBrowser(ua),
        os: parseOS(ua),
        sessionId: sessionId || null,
        userId: userId || null,
        duration: duration || null,
      },
    });

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    console.error('[Analytics Track]', error);
    return NextResponse.json({ ok: true }, { status: 200 }); // fail silently for tracking
  }
}
