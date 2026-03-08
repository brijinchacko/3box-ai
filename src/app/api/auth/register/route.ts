import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '@/lib/db/prisma';
import { isOforoDomain, generateReferralCode } from '@/lib/utils';
import { sendWelcomeEmail } from '@/lib/email';

const registerSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
  ref: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, password, ref } = registerSchema.parse(body);

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const isOforo = isOforoDomain(email);
    const referralCode = generateReferralCode();

    const user = await prisma.user.create({
      data: {
        name,
        email,
        hashedPassword,
        isOforoInternal: isOforo,
        plan: isOforo ? 'ULTRA' : 'BASIC',
        aiCreditsLimit: isOforo ? -1 : 10,
        referralCode,
      },
    });

    // Create Career Twin with empty initial data
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

    // Handle referral if ref code provided
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

    // Subscribe to newsletter automatically
    await prisma.newsletterSubscriber.create({
      data: {
        email,
        userId: user.id,
        source: 'signup',
      },
    }).catch(() => {}); // Ignore if already subscribed

    // Send welcome email (non-blocking) and log it
    sendWelcomeEmail(email, name).then(() => {
      prisma.emailLog.create({
        data: { userId: user.id, type: 'WELCOME', subject: 'Welcome to jobTED AI', to: email, status: 'sent' },
      }).catch(() => {});
    }).catch((err: any) => {
      console.error('[Register] Failed to send welcome email:', err);
      prisma.emailLog.create({
        data: { userId: user.id, type: 'WELCOME', subject: 'Welcome to jobTED AI', to: email, status: 'failed' },
      }).catch(() => {});
    });

    return NextResponse.json({ id: user.id, email: user.email }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error('[Register]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
