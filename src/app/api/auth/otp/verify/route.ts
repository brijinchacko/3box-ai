import { NextResponse } from 'next/server';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db/prisma';
import { isOforoDomain, generateReferralCode } from '@/lib/utils';
import { sendWelcomeEmail, sendEmailVerifiedEmail } from '@/lib/email';

const schema = z.object({
  email: z.string().email(),
  code: z.string().length(6),
  type: z.enum(['login', 'signup', 'reset']),
  // For signup only
  name: z.string().optional(),
  password: z.string().min(8).optional(),
  ref: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, code, type, name, password, ref } = schema.parse(body);

    // Find valid OTP
    const otp = await prisma.otpToken.findFirst({
      where: {
        email,
        type,
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

    // Check max attempts
    if (otp.attempts >= 5) {
      await prisma.otpToken.update({
        where: { id: otp.id },
        data: { used: true },
      });
      return NextResponse.json(
        { error: 'Too many incorrect attempts. Please request a new code.' },
        { status: 400 }
      );
    }

    // Verify code
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

    // Handle based on type
    if (type === 'login') {
      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) {
        return NextResponse.json({ error: 'Account not found' }, { status: 404 });
      }

      // Mark email as verified if not already
      if (!user.emailVerified) {
        await prisma.user.update({
          where: { id: user.id },
          data: { emailVerified: new Date() },
        });
      }

      return NextResponse.json({
        verified: true,
        userId: user.id,
        email: user.email,
        action: 'login',
      });
    }

    if (type === 'signup') {
      if (!name || !password) {
        return NextResponse.json(
          { error: 'Name and password are required for signup' },
          { status: 400 }
        );
      }

      // Check if user already exists
      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing) {
        return NextResponse.json(
          { error: 'Account already exists' },
          { status: 409 }
        );
      }

      const hashedPassword = await bcrypt.hash(password, 12);
      const isOforo = isOforoDomain(email);
      const referralCode = generateReferralCode();

      const user = await prisma.user.create({
        data: {
          name,
          email,
          hashedPassword,
          emailVerified: new Date(),
          isOforoInternal: isOforo,
          plan: isOforo ? 'ULTRA' : 'BASIC',
          aiCreditsLimit: isOforo ? -1 : 10,
          referralCode,
        },
      });

      // Create CareerTwin
      await prisma.careerTwin.create({
        data: {
          userId: user.id,
          skillSnapshot: {},
          interests: [],
          targetRoles: [],
          marketReadiness: 0,
          hireProb: 0,
        },
      });

      // Handle referral
      if (ref) {
        const referrer = await prisma.user.findFirst({
          where: { referralCode: ref },
        });
        if (referrer) {
          await prisma.referral.create({
            data: {
              referrerId: referrer.id,
              referredId: user.id,
              status: 'PENDING',
            },
          });
        }
      }

      // Auto-subscribe to newsletter
      await prisma.newsletterSubscriber.create({
        data: { email, userId: user.id, source: 'signup' },
      }).catch(() => {});

      // Send welcome email
      sendWelcomeEmail(email, name).catch((err: any) => {
        console.error('[Register] Failed to send welcome email:', err);
      });

      return NextResponse.json({
        verified: true,
        userId: user.id,
        email: user.email,
        action: 'signup',
      }, { status: 201 });
    }

    if (type === 'reset') {
      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) {
        return NextResponse.json({ error: 'Account not found' }, { status: 404 });
      }

      // Generate a short-lived reset token
      const crypto = require('crypto');
      const resetToken = crypto.randomBytes(32).toString('hex');
      const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      // Store in VerificationToken
      await prisma.verificationToken.create({
        data: {
          identifier: email,
          token: resetToken,
          expires: resetExpires,
        },
      });

      return NextResponse.json({
        verified: true,
        resetToken,
        action: 'reset',
      });
    }

    return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error('[OTP Verify]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
