/**
 * Generate a JWT token for the Chrome Extension.
 * The user calls this from the extension auth page after logging in.
 */
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'fallback-secret';

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const token = jwt.sign(
    {
      userId: session.user.id,
      email: session.user.email,
      name: session.user.name,
      plan: (session.user as any)?.plan || 'FREE',
      extensionAuth: true,
    },
    JWT_SECRET,
    { expiresIn: '30d' },
  );

  return NextResponse.json({ token, expiresIn: '30d' });
}
