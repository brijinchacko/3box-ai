import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin';

const { prisma } = require('@/lib/db/prisma');

/**
 * DELETE /api/admin/users/[id] — Admin deletes a user account
 * Requires admin auth + confirmation. Cascade deletes all user data.
 */
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const auth = await requireAdmin();
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Prevent admin from deleting themselves
    if (id === auth.user?.id) {
      return NextResponse.json(
        { error: 'You cannot delete your own account from the admin panel' },
        { status: 400 }
      );
    }

    // Find the user first to log details
    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true, name: true, email: true, plan: true, isOforoInternal: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Prevent deleting other admin/internal users
    if (user.isOforoInternal) {
      return NextResponse.json(
        { error: 'Cannot delete internal/admin users' },
        { status: 403 }
      );
    }

    // Log the deletion
    console.log(
      `[Admin Delete] Admin ${auth.user?.email} deleting user ${user.id} (${user.email})`
    );

    // Prisma cascade delete handles all related records
    await prisma.user.delete({ where: { id } });

    return NextResponse.json({
      success: true,
      message: `User ${user.email} has been permanently deleted`,
    });
  } catch (error) {
    console.error('[Admin Delete User]', error);
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/users/[id] — Get single user details
 */
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const auth = await requireAdmin();
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        name: true,
        email: true,
        plan: true,
        createdAt: true,
        updatedAt: true,
        onboardingDone: true,
        aiCreditsUsed: true,
        aiCreditsLimit: true,
        isOforoInternal: true,
        stripeCustomerId: true,
        referralCode: true,
        referredBy: true,
        image: true,
        _count: {
          select: {
            assessments: true,
            resumes: true,
            careerPlans: true,
            learningPaths: true,
            jobApplications: true,
            auditLogs: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error('[Admin Get User]', error);
    return NextResponse.json({ error: 'Failed to fetch user' }, { status: 500 });
  }
}
