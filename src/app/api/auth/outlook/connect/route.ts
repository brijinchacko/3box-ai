import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { getOutlookAuthUrl } from '@/lib/email/oauth';

const APP_URL = process.env.NEXTAUTH_URL || 'https://3box.ai';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const redirectUri = `${APP_URL}/api/auth/outlook/callback`;
  const authUrl = getOutlookAuthUrl(redirectUri, session.user.id);

  return NextResponse.redirect(authUrl);
}
