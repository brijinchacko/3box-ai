import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { handleOutlookCallback } from '@/lib/email/oauth';

const APP_URL = process.env.NEXTAUTH_URL || 'https://3box.ai';

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.redirect(`${APP_URL}/login`);
  }

  const code = request.nextUrl.searchParams.get('code');
  if (!code) {
    return NextResponse.redirect(`${APP_URL}/dashboard/settings?error=no_code`);
  }

  const redirectUri = `${APP_URL}/api/auth/outlook/callback`;
  const result = await handleOutlookCallback(code, session.user.id, redirectUri);

  if (result.success) {
    return NextResponse.redirect(
      `${APP_URL}/dashboard/settings?email_connected=outlook&email=${encodeURIComponent(result.email || '')}`,
    );
  }

  return NextResponse.redirect(
    `${APP_URL}/dashboard/settings?error=${encodeURIComponent(result.error || 'outlook_failed')}`,
  );
}
