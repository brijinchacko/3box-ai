import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { aiChat, getModelForFeature } from '@/lib/ai/openrouter';

const { prisma } = require('@/lib/db/prisma');

interface Insight {
  type: 'strength' | 'improvement' | 'opportunity' | 'action';
  title: string;
  description: string;
  action: string;
  priority: 'high' | 'medium' | 'low';
}

const GENERIC_ONBOARDING_INSIGHTS: Insight[] = [
  {
    type: 'action',
    title: 'Complete Your Skills Assessment',
    description:
      'Take a quick assessment to discover your strengths and identify skill gaps for your target role.',
    action: '/dashboard/assessment',
    priority: 'high',
  },
  {
    type: 'action',
    title: 'Set Your Target Role',
    description:
      'Tell us what role you are aiming for so we can personalize your career plan and recommendations.',
    action: '/dashboard/settings',
    priority: 'high',
  },
  {
    type: 'opportunity',
    title: 'Upload Your Resume',
    description:
      'Upload or build your resume to get ATS optimization tips and tailored job matches.',
    action: '/dashboard/resume',
    priority: 'medium',
  },
  {
    type: 'improvement',
    title: 'Explore Learning Paths',
    description:
      'Browse curated learning paths designed to help you skill up for in-demand roles.',
    action: '/dashboard/learning',
    priority: 'low',
  },
];

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // Fetch user data in parallel
    const [user, assessments, careerPlans, resumes, jobApplications] =
      await Promise.all([
        prisma.user.findUnique({ where: { id: userId } }),
        prisma.assessment.findMany({
          where: { userId },
          orderBy: { createdAt: 'desc' },
          take: 5,
        }),
        prisma.careerPlan.findMany({
          where: { userId },
          orderBy: { updatedAt: 'desc' },
          take: 3,
        }),
        prisma.resume.findMany({
          where: { userId },
          orderBy: { updatedAt: 'desc' },
          take: 3,
        }),
        prisma.jobApplication.findMany({
          where: { userId },
          orderBy: { createdAt: 'desc' },
          take: 10,
        }),
      ]);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const hasData =
      assessments.length > 0 ||
      careerPlans.length > 0 ||
      resumes.length > 0;

    // If no data yet, return onboarding insights
    if (!hasData) {
      return NextResponse.json({
        insights: GENERIC_ONBOARDING_INSIGHTS,
        careerScore: 0,
        weeklyTip:
          'Start by completing a skills assessment to unlock personalized career insights and recommendations.',
      });
    }

    // Build context for AI analysis
    const context = {
      assessmentCount: assessments.length,
      latestAssessment: assessments[0]
        ? {
            targetRole: assessments[0].targetRole,
            status: assessments[0].status,
            skillScores: assessments[0].skillScores,
          }
        : null,
      careerPlans: careerPlans.map((p: any) => ({
        targetRole: p.targetRole,
        status: p.status,
      })),
      resumeCount: resumes.length,
      latestResumeAtsScore: resumes[0]?.atsScore || null,
      applicationStats: {
        total: jobApplications.length,
        applied: jobApplications.filter(
          (j: any) => j.status === 'APPLIED',
        ).length,
        interview: jobApplications.filter(
          (j: any) => j.status === 'INTERVIEW',
        ).length,
        offer: jobApplications.filter((j: any) => j.status === 'OFFER')
          .length,
        rejected: jobApplications.filter(
          (j: any) => j.status === 'REJECTED',
        ).length,
      },
      plan: user.plan,
    };

    const systemPrompt = `You are a career analytics AI for the NXTED platform. Analyze the user's career data and generate personalized insights. Return JSON with:
{
  "insights": [
    {
      "type": "strength" | "improvement" | "opportunity" | "action",
      "title": "<short title>",
      "description": "<1-2 sentence description>",
      "action": "<suggested next step or dashboard path>",
      "priority": "high" | "medium" | "low"
    }
  ],
  "careerScore": <0-100 overall career readiness score>,
  "weeklyTip": "<personalized weekly tip based on their data>"
}

Generate 3-5 relevant insights. Prioritize actionable items. Be encouraging but realistic.`;

    const model = getModelForFeature('dashboard-insights', user.plan);
    const aiResponse = await aiChat({
      messages: [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: `User career data: ${JSON.stringify(context)}`,
        },
      ],
      model: model.id,
      temperature: 0.6,
      jsonMode: model.supportsJsonMode,
    });

    let insightsData;
    try {
      insightsData = JSON.parse(aiResponse);
    } catch {
      // Fallback if AI response is not valid JSON
      console.error(
        '[Dashboard Insights] Failed to parse AI response:',
        aiResponse,
      );
      insightsData = {
        insights: [
          {
            type: 'action',
            title: 'Continue Your Progress',
            description:
              'Keep building your career profile by completing assessments and updating your resume.',
            action: '/dashboard',
            priority: 'medium',
          },
        ],
        careerScore: 50,
        weeklyTip:
          'Consistency is key. Spend 15 minutes each day working on your career development goals.',
      };
    }

    return NextResponse.json({
      insights: insightsData.insights || [],
      careerScore: insightsData.careerScore || 0,
      weeklyTip: insightsData.weeklyTip || '',
    });
  } catch (error) {
    console.error('[Dashboard Insights API]', error);
    return NextResponse.json(
      { error: 'Failed to generate dashboard insights' },
      { status: 500 },
    );
  }
}
