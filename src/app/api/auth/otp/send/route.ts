import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db/prisma';
import { sendOtpEmail } from '@/lib/email';

const schema = z.object({
  email: z.string().email(),
  type: z.enum(['login', 'signup', 'reset']).default('login'),
});

function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, type } = schema.parse(body);

    // Rate limit: max 3 OTPs per email per 10 minutes
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
    const recentOtps = await prisma.otpToken.count({
      where: { email, type, createdAt: { gte: tenMinutesAgo } },
    });

    if (recentOtps >= 3) {
      return NextResponse.json(
        { error: 'Too many requests. Please wait before trying again.' },
        { status: 429 }
      );
    }

    // For login type, verify the user exists
    if (type === 'login') {
      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) {
        // Don't reveal whether user exists — still return success
        return NextResponse.json({ sent: true });
      }
    }

    // For signup type, check if email already registered
    if (type === 'signup') {
      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing) {
        return NextResponse.json(
          { error: 'An account with this email already exists. Please sign in instead.' },
          { status: 409 }
        );
      }
    }

    // Invalidate previous unused OTPs
    await prisma.otpToken.updateMany({
      where: { email, type, used: false },
      data: { used: true },
    });

    // Generate new OTP
    const code = generateOtp();
    const expires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await prisma.otpToken.create({
      data: { email, code, type, expires },
    });

    // Pre-flight: warn if email service not configured
    if (!process.env.RESEND_API_KEY) {
      console.warn('[OTP] RESEND_API_KEY not configured — emails will only be logged to console');
    }

    // Send OTP email
    const result = await sendOtpEmail(email, code, type);

    if (result.error) {
      console.error('[OTP] Email send error:', result.error);
      return NextResponse.json({ error: 'Failed to send verification code. Please try again later.' }, { status: 500 });
    }

    // If in demo mode (no API key), return a warning flag
    if (result.id === 'demo-mode') {
      console.warn(`[OTP] Demo mode — OTP for ${email}: ${code}`);
      return NextResponse.json({ sent: true, demo: true });
    }

    return NextResponse.json({ sent: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error('[OTP Send]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
