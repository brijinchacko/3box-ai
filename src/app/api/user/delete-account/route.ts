import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db/prisma';

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { confirmation } = await request.json();

    if (confirmation !== 'DELETE') {
      return NextResponse.json(
        { error: 'Please type DELETE to confirm account deletion' },
        { status: 400 }
      );
    }

    const userId = session.user.id;
    const userEmail = session.user.email;

    // Verify user exists first
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      // User already deleted (double-click or retry) — treat as success
      console.log(`[Account Deletion] User ${userId} already deleted, returning success`);
      return NextResponse.json({
        success: true,
        message: 'Account has been deleted',
      });
    }

    console.log(`[Account Deletion] User ${userId} (${userEmail}) requested account deletion`);

    // Step 1: Delete records that don't cascade properly
    // NewsletterSubscriber uses onDelete: SetNull, not Cascade
    await prisma.newsletterSubscriber.deleteMany({
      where: { OR: [{ userId }, ...(userEmail ? [{ email: userEmail }] : [])] },
    }).catch(() => {});

    // Step 2: Decrement coupon usedCount for any redeemed coupons
    try {
      const redemptions = await prisma.couponRedemption.findMany({ where: { userId }, select: { couponId: true } });
      for (const r of redemptions) {
        await prisma.coupon.update({
          where: { id: r.couponId },
          data: { usedCount: { decrement: 1 } },
        }).catch(() => {});
      }
    } catch {}

    // Step 3: Delete related records that might cause FK issues
    // Delete in order: child records first, then parent
    const deleteOps = [
      prisma.ticketMessage.deleteMany({ where: { ticket: { userId } } }),
      prisma.supportTicket.deleteMany({ where: { userId } }),
      prisma.couponRedemption.deleteMany({ where: { userId } }),
      prisma.agentChatMessage.deleteMany({ where: { userId } }),
      prisma.agentActivity.deleteMany({ where: { userId } }),
      prisma.followUp.deleteMany({ where: { userId } }),
      prisma.applicationOutcome.deleteMany({ where: { userId } }),
      prisma.resumeVariant.deleteMany({ where: { userId } }),
      prisma.jobApplication.deleteMany({ where: { userId } }),
      prisma.scoutJob.deleteMany({ where: { userId } }),
      prisma.searchProfile.deleteMany({ where: { userId } }),
      prisma.autoApplyConfig.deleteMany({ where: { userId } }),
      prisma.autoApplyRun.deleteMany({ where: { userId } }),
      prisma.autoApplyDigest.deleteMany({ where: { userId } }),
      prisma.resume.deleteMany({ where: { userId } }),
      prisma.portfolio.deleteMany({ where: { userId } }),
      prisma.assessment.deleteMany({ where: { userId } }),
      prisma.careerPlan.deleteMany({ where: { userId } }),
      prisma.learningPath.deleteMany({ where: { userId } }),
      prisma.careerTwin.deleteMany({ where: { userId } }),
      prisma.coachSettings.deleteMany({ where: { userId } }),
      prisma.emailLog.deleteMany({ where: { userId } }),
      prisma.userEmailConnection.deleteMany({ where: { userId } }),
      prisma.referral.deleteMany({ where: { OR: [{ referrerId: userId }, { referredId: userId }] } }),
    ];

    // Execute all deletes (ignore individual failures)
    await Promise.allSettled(deleteOps);

    // Step 3: Delete the user account itself
    await prisma.user.delete({
      where: { id: userId },
    });

    console.log(`[Account Deletion] Successfully deleted user ${userId} (${userEmail})`);

    return NextResponse.json({
      success: true,
      message: 'Account and all associated data have been permanently deleted',
    });
  } catch (error: any) {
    console.error('[Delete Account]', error);

    // If P2025 (record not found), user was already deleted
    if (error?.code === 'P2025') {
      return NextResponse.json({
        success: true,
        message: 'Account has been deleted',
      });
    }

    return NextResponse.json(
      { error: 'Failed to delete account. Please try again or contact support.' },
      { status: 500 }
    );
  }
}
