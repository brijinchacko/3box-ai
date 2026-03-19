import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { handleGmailCallback } from '@/lib/email/oauth';

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

  // Check if user granted the gmail.send scope (Google granular consent allows unchecking)
  const grantedScope = request.nextUrl.searchParams.get('scope') || '';
  if (!grantedScope.includes('gmail.send')) {
    return NextResponse.redirect(
      `${APP_URL}/dashboard/settings?error=${encodeURIComponent('Gmail "Send email" permission is required. Please try again and make sure the "Send email on your behalf" checkbox is checked.')}`,
    );
  }

  const redirectUri = `${APP_URL}/api/auth/gmail/callback`;
  const result = await handleGmailCallback(code, session.user.id, redirectUri);

  if (result.success) {
    return NextResponse.redirect(
      `${APP_URL}/dashboard/settings?email_connected=gmail&email=${encodeURIComponent(result.email || '')}`,
    );
  }

  return NextResponse.redirect(
    `${APP_URL}/dashboard/settings?error=${encodeURIComponent(result.error || 'gmail_failed')}`,
  );
}
