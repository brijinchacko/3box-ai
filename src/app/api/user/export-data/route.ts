import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';

const { prisma } = require('@/lib/db/prisma');

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // Gather all user data across all models
    const [
      user,
      assessments,
      careerPlans,
      learningPaths,
      resumes,
      portfolios,
      jobApplications,
      careerTwin,
      auditLogs,
    ] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          plan: true,
          onboardingDone: true,
          referralCode: true,
          createdAt: true,
          updatedAt: true,
          // Exclude sensitive fields: hashedPassword, stripeCustomerId, etc.
        },
      }),
      prisma.assessment.findMany({ where: { userId } }),
      prisma.careerPlan.findMany({ where: { userId } }),
      prisma.learningPath.findMany({ where: { userId } }),
      prisma.resume.findMany({ where: { userId } }),
      prisma.portfolio.findMany({ where: { userId } }),
      prisma.jobApplication.findMany({ where: { userId } }),
      prisma.careerTwin.findUnique({ where: { userId } }),
      prisma.auditLog.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 100,
      }),
    ]);

    const exportData = {
      exportedAt: new Date().toISOString(),
      exportVersion: '1.0',
      user,
      assessments,
      careerPlans,
      learningPaths,
      resumes,
      portfolios,
      jobApplications,
      careerTwin,
      auditLogs,
    };

    // Log the export action
    await prisma.auditLog.create({
      data: {
        userId,
        action: 'DATA_EXPORTED',
        details: { timestamp: new Date().toISOString() },
      },
    }).catch(() => {});

    return new NextResponse(JSON.stringify(exportData, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="nxted-data-export-${new Date().toISOString().split('T')[0]}.json"`,
      },
    });
  } catch (error) {
    console.error('[Export Data]', error);
    return NextResponse.json(
      { error: 'Failed to export data' },
      { status: 500 }
    );
  }
}
