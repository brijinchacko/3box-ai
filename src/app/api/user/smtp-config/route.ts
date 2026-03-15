/**
 * SMTP Config API — Allows users to configure custom email (Yahoo, iCloud, company, etc.)
 * Stores encrypted SMTP credentials in UserEmailConnection table with provider='smtp'.
 */
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { encrypt, decrypt } from '@/lib/email/oauth/encryption';

const { prisma } = require('@/lib/db/prisma');

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const connection = await prisma.userEmailConnection.findFirst({
    where: { userId: (session.user as any).id, provider: 'smtp', isActive: true },
    select: { email: true, scopes: true },
  });

  if (!connection) {
    return NextResponse.json({ configured: false });
  }

  // Parse the scopes field which stores SMTP config as JSON
  let config: Record<string, string> = {};
  try {
    config = JSON.parse(connection.scopes || '{}');
  } catch {}

  return NextResponse.json({
    configured: true,
    email: connection.email,
    host: config.host || '',
    port: config.port || '587',
    fromName: config.fromName || '',
  });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = (session.user as any).id;
  const body = await req.json();
  const { host, port, email, password, fromName } = body;

  if (!host || !email) {
    return NextResponse.json({ error: 'Host and email are required' }, { status: 400 });
  }

  // Store SMTP config: password in accessToken (encrypted), config in scopes as JSON
  const smtpConfig = JSON.stringify({ host, port: port || '587', fromName: fromName || '' });

  // Check if updating existing (may not have new password)
  const existing = await prisma.userEmailConnection.findFirst({
    where: { userId, provider: 'smtp', isActive: true },
  });

  const encryptedPassword = password ? encrypt(password) : existing?.accessToken || '';

  if (!password && !existing) {
    return NextResponse.json({ error: 'Password is required for new configuration' }, { status: 400 });
  }

  await prisma.userEmailConnection.upsert({
    where: {
      userId_provider_email: { userId, provider: 'smtp', email },
    },
    create: {
      userId,
      provider: 'smtp',
      email,
      accessToken: encryptedPassword, // SMTP password (encrypted)
      refreshToken: encrypt('none'),   // Not used for SMTP
      tokenExpiry: new Date('2099-12-31'),
      scopes: smtpConfig,
      isActive: true,
      isPrimary: false, // Gmail/Outlook take priority unless no other
    },
    update: {
      accessToken: encryptedPassword,
      scopes: smtpConfig,
      isActive: true,
    },
  });

  return NextResponse.json({ success: true });
}

export async function DELETE() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await prisma.userEmailConnection.deleteMany({
    where: { userId: (session.user as any).id, provider: 'smtp' },
  });

  return NextResponse.json({ success: true });
}
