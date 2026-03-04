import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db/prisma';
import { sendOtpEmail } from '@/lib/email';

const schema = z.object({
  email: z.string().email(),
});

function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email } = schema.parse(body);

    // Always return success to avoid email enumeration
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json({ sent: true });
    }

    // Rate limit
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
    const recentOtps = await prisma.otpToken.count({
      where: { email, type: 'reset', createdAt: { gte: tenMinutesAgo } },
    });

    if (recentOtps >= 3) {
      return NextResponse.json({ sent: true }); // silently rate limit
    }

    // Invalidate old reset OTPs
    await prisma.otpToken.updateMany({
      where: { email, type: 'reset', used: false },
      data: { used: true },
    });

    // Generate OTP
    const code = generateOtp();
    const expires = new Date(Date.now() + 10 * 60 * 1000);

    await prisma.otpToken.create({
      data: { email, code, type: 'reset', expires },
    });

    // Send email
    await sendOtpEmail(email, code, 'reset');

    return NextResponse.json({ sent: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error('[ForgotPassword]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
