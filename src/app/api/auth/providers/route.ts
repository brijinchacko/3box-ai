import { NextResponse } from 'next/server';

export async function GET() {
  // Google OAuth requires: client ID + secret + redirect URI configured in Google Cloud Console
  // GOOGLE_OAUTH_ENABLED must be explicitly set to "true" after configuring the redirect URI
  const googleConfigured = !!(
    process.env.GOOGLE_CLIENT_ID &&
    process.env.GOOGLE_CLIENT_SECRET &&
    process.env.GOOGLE_OAUTH_ENABLED === 'true'
  );

  return NextResponse.json({
    google: googleConfigured,
  });
}
