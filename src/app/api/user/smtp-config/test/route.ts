/**
 * SMTP Test Endpoint — Sends a test email via the user's configured SMTP to verify settings.
 */
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { decrypt } from '@/lib/email/oauth/encryption';
import nodemailer from 'nodemailer';

const { prisma } = require('@/lib/db/prisma');

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = (session.user as any).id;

  const connection = await prisma.userEmailConnection.findFirst({
    where: { userId, provider: 'smtp', isActive: true },
  });

  if (!connection) {
    return NextResponse.json({ success: false, error: 'No SMTP configuration found' }, { status: 404 });
  }

  let config: Record<string, string> = {};
  try {
    config = JSON.parse(connection.scopes || '{}');
  } catch {}

  const password = decrypt(connection.accessToken);

  try {
    const transporter = nodemailer.createTransport({
      host: config.host,
      port: parseInt(config.port || '587'),
      secure: parseInt(config.port || '587') === 465,
      auth: {
        user: connection.email,
        pass: password,
      },
      connectionTimeout: 10000,
    });

    await transporter.verify();

    await transporter.sendMail({
      from: config.fromName
        ? `${config.fromName} <${connection.email}>`
        : connection.email,
      to: connection.email,
      subject: '3BOX AI — SMTP Test Successful ✅',
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
          <h2 style="color: #00d4ff;">SMTP Connection Verified!</h2>
          <p>Your email <strong>${connection.email}</strong> is now connected to 3BOX AI.</p>
          <p style="color: #666;">Job applications will be sent from this address when auto-apply runs.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 16px 0;" />
          <p style="font-size: 12px; color: #999;">This is a test email from 3BOX AI — <a href="https://3box.ai">3box.ai</a></p>
        </div>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[SMTP Test] Error:', err);
    return NextResponse.json({
      success: false,
      error: (err as Error).message || 'Failed to connect to SMTP server',
    });
  }
}
