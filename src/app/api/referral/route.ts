import { NextResponse, NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';

const { prisma } = require('@/lib/db/prisma');
import { sendReferralInviteEmail } from '@/lib/email';
import { generateReferralCode } from '@/lib/utils';

// Use NEXTAUTH_URL (runtime) — do NOT use NEXT_PUBLIC_APP_URL here as Next.js
// inlines it at build time, which bakes in localhost when building locally.
const APP_URL = process.env.NEXTAUTH_URL || 'https://nxted.ai';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { referralCode: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const totalReferrals = await prisma.referral.count({
      where: { referrerId: session.user.id },
    });

    const rewardedReferrals = await prisma.referral.count({
      where: {
        referrerId: session.user.id,
        status: 'REWARDED',
      },
    });

    return NextResponse.json({
      referralCode: user.referralCode,
      totalReferrals,
      rewardedReferrals,
      referralLink: user.referralCode
        ? `${APP_URL}/signup?ref=${user.referralCode}`
        : null,
    });
  } catch (error) {
    console.error('Error fetching referral stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch referral stats' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action } = body;

    if (action === 'invite') {
      const { email } = body;

      if (!email) {
        return NextResponse.json(
          { error: 'Email is required' },
          { status: 400 }
        );
      }

      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { referralCode: true, name: true },
      });

      if (!user?.referralCode) {
        return NextResponse.json(
          { error: 'No referral code found. Please generate one first.' },
          { status: 400 }
        );
      }

      const referralLink = `${APP_URL}/signup?ref=${user.referralCode}`;

      await sendReferralInviteEmail(email, user.name || 'A friend', user.referralCode || '');

      await prisma.emailLog.create({
        data: {
          userId: session.user.id,
          type: 'REFERRAL_INVITE',
          to: email,
          status: 'SENT',
        },
      });

      return NextResponse.json({ success: true, message: 'Invite sent successfully' });
    }

    if (action === 'generate-code') {
      const existingUser = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { referralCode: true },
      });

      if (existingUser?.referralCode) {
        return NextResponse.json({
          referralCode: existingUser.referralCode,
          message: 'Referral code already exists',
        });
      }

      const referralCode = generateReferralCode();

      const updatedUser = await prisma.user.update({
        where: { id: session.user.id },
        data: { referralCode },
        select: { referralCode: true },
      });

      return NextResponse.json({
        referralCode: updatedUser.referralCode,
        referralLink: `${APP_URL}/signup?ref=${updatedUser.referralCode}`,
        message: 'Referral code generated successfully',
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error processing referral action:', error);
    return NextResponse.json(
      { error: 'Failed to process referral action' },
      { status: 500 }
    );
  }
}
