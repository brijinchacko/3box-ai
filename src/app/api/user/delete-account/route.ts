import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';

const { prisma } = require('@/lib/db/prisma');

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

    // Log the deletion before it happens
    console.log(`[Account Deletion] User ${userId} (${userEmail}) requested account deletion`);

    // Delete newsletter subscriber first (uses onDelete: SetNull, not Cascade)
    if (userEmail) {
      await prisma.newsletterSubscriber.deleteMany({
        where: { OR: [{ userId }, { email: userEmail }] },
      }).catch(() => {});
    }

    // Prisma cascade delete handles all other related records
    // (All models have onDelete: Cascade on their userId foreign key)
    await prisma.user.delete({
      where: { id: userId },
    });

    return NextResponse.json({
      success: true,
      message: 'Account and all associated data have been permanently deleted',
    });
  } catch (error) {
    console.error('[Delete Account]', error);
    return NextResponse.json(
      { error: 'Failed to delete account' },
      { status: 500 }
    );
  }
}
