import { NextResponse } from 'next/server';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db/prisma';
import { sendAccountActivityEmail } from '@/lib/email';

const schema = z.object({
  email: z.string().email(),
  code: z.string().length(6),
  password: z.string().min(8),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, code, password } = schema.parse(body);

    // Find valid OTP
    const otp = await prisma.otpToken.findFirst({
      where: {
        email,
        type: 'reset',
        used: false,
        expires: { gte: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!otp) {
      return NextResponse.json(
        { error: 'Invalid or expired code. Please request a new one.' },
        { status: 400 }
      );
    }

    if (otp.attempts >= 5) {
      await prisma.otpToken.update({
        where: { id: otp.id },
        data: { used: true },
      });
      return NextResponse.json(
        { error: 'Too many attempts. Please request a new code.' },
        { status: 400 }
      );
    }

    if (otp.code !== code) {
      await prisma.otpToken.update({
        where: { id: otp.id },
        data: { attempts: { increment: 1 } },
      });
      return NextResponse.json(
        { error: 'Incorrect code. Please try again.' },
        { status: 400 }
      );
    }

    // Mark OTP as used
    await prisma.otpToken.update({
      where: { id: otp.id },
      data: { used: true },
    });

    // Find user and update password
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    await prisma.user.update({
      where: { id: user.id },
      data: { hashedPassword },
    });

    // Send security notification
    sendAccountActivityEmail(
      email,
      user.name || 'there',
      'Password Changed',
      `Your password was changed on ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}.`
    ).catch(() => {});

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error('[ResetPassword]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
