import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { aiChat, getModelForFeature, extractJSON } from '@/lib/ai/openrouter';
import { getUserContextString } from '@/lib/ai/context';
import { TOKEN_COSTS, canAfford } from '@/lib/tokens/pricing';

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

    // If no data yet, return onboarding insights (no token cost)
    if (!hasData) {
      return NextResponse.json({
        insights: GENERIC_ONBOARDING_INSIGHTS,
        careerScore: 0,
        weeklyTip:
          'Start by completing a skills assessment to unlock personalized career insights and recommendations.',
      });
    }

    // Token check for AI-powered insights
    const insightCost = TOKEN_COSTS.ai_insights;
    if (!canAfford(user.aiCreditsUsed ?? 0, user.aiCreditsLimit ?? 0, insightCost)) {
      // Not enough tokens — return static fallback instead of erroring
      return NextResponse.json({
        insights: [{ type: 'action' as const, title: 'Token Limit Reached', description: 'Buy more tokens to unlock AI-powered career insights.', action: '/pricing', priority: 'high' as const }],
        careerScore: 0,
        weeklyTip: 'Purchase additional tokens to continue receiving personalized career insights.',
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

    // Build rich user context for AI personalization
    const userContext = await getUserContextString(userId);

    const systemPrompt = `You are a career analytics AI for the jobTED platform. Analyze the user's career data and generate personalized insights. Return JSON with:
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

Generate 3-5 relevant insights. Prioritize actionable items. Be encouraging but realistic. Address the user by name.${userContext ? `\n\n${userContext}` : ''}`;

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
      insightsData = JSON.parse(extractJSON(aiResponse));
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

    // Deduct tokens
    await prisma.user.update({
      where: { id: userId },
      data: { aiCreditsUsed: { increment: insightCost } },
    });

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
