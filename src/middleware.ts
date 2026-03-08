// =============================================================================
// 3BOX AI — Next.js Middleware
// =============================================================================
// Lightweight middleware that sets a geo cookie for client-side region detection.
// Does NOT block or redirect any requests — only adds a cookie if missing.
//
// Uses Cloudflare / Vercel headers when available (zero-latency).
// Falls back to setting a default so the client can detect via /api/geo.
// =============================================================================

import { NextResponse, type NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // Skip if the cookie is already set
  const existingCookie = request.cookies.get('3box-region');
  if (existingCookie?.value) {
    return response;
  }

  // Try to detect country from platform headers (zero-cost, no external call)
  let countryCode: string | null = null;

  // 1. Cloudflare header
  const cfCountry = request.headers.get('cf-ipcountry');
  if (cfCountry && cfCountry !== 'XX' && cfCountry !== 'T1') {
    countryCode = cfCountry.toUpperCase();
  }

  // 2. Vercel header
  if (!countryCode) {
    const vercelCountry = request.headers.get('x-vercel-ip-country');
    if (vercelCountry) {
      countryCode = vercelCountry.toUpperCase();
    }
  }

  // 3. If we detected a country, set the cookie
  // If we couldn't detect here, the client will call /api/geo as fallback
  if (countryCode) {
    response.cookies.set('3box-region', countryCode, {
      path: '/',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      httpOnly: false, // Needs to be readable by client JS
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });
  }

  return response;
}

// ---------------------------------------------------------------------------
// Matcher: Run on page routes only. Skip API routes, static files, etc.
// ---------------------------------------------------------------------------

export const config = {
  matcher: [
    /*
     * Match all paths EXCEPT:
     * - /api/*          (API routes)
     * - /_next/*        (Next.js internals)
     * - /favicon.ico    (favicon)
     * - /robots.txt     (SEO)
     * - /sitemap.xml    (SEO)
     * - /*.svg, /*.png, /*.jpg, /*.ico, /*.webp (static assets)
     */
    '/((?!api|_next/static|_next/image|favicon\\.ico|robots\\.txt|sitemap\\.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff|woff2|ttf|eot)).*)',
  ],
};
