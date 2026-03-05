import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { generateLearningPath, extractJSON } from '@/lib/ai/openrouter';
import { getUserContextString } from '@/lib/ai/context';

const { prisma } = require('@/lib/db/prisma');

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { plan: true } });

    const body = await req.json();
    const { targetRole, gaps } = body;

    if (!targetRole || !gaps) {
      return NextResponse.json(
        { error: 'targetRole and gaps are required' },
        { status: 400 }
      );
    }

    // Build user context for AI personalization
    const userContext = await getUserContextString(session.user.id);

    let learningPathData;
    try {
      const aiResponse = await generateLearningPath(targetRole, gaps, user?.plan || 'BASIC', userContext);
      learningPathData = JSON.parse(extractJSON(aiResponse));
    } catch (aiError) {
      console.warn('[Learning Path] AI generation failed, using demo data:', aiError);
      const gapSkills = Array.isArray(gaps) ? gaps.map((g: any) => g.skill || g) : ['Core Skills'];
      // Structured demo fallback when AI is unavailable
      learningPathData = {
        modules: [
          { id: '1', title: `${targetRole} Fundamentals Course`, description: 'Comprehensive introduction to core concepts and essential tools.', type: 'course', provider: 'Coursera', url: 'https://coursera.org', duration: '20 hours', skills: gapSkills.slice(0, 2), isAdaptive: true },
          { id: '2', title: 'Hands-On Project: Starter App', description: 'Build a practical starter project from scratch to apply fundamentals.', type: 'project', provider: 'Self-paced', url: '', duration: '15 hours', skills: gapSkills.slice(0, 2), isAdaptive: false },
          { id: '3', title: 'Advanced Techniques & Patterns', description: 'Deep dive into advanced patterns and best practices used in industry.', type: 'course', provider: 'Udemy', url: 'https://udemy.com', duration: '25 hours', skills: gapSkills.slice(1, 3), isAdaptive: true },
          { id: '4', title: 'Industry Best Practices Reading', description: 'Curated articles and documentation on industry standards and workflows.', type: 'reading', provider: 'Various', url: '', duration: '8 hours', skills: ['Best Practices', 'Standards'], isAdaptive: false },
          { id: '5', title: 'Capstone Integration Project', description: 'Build a full project integrating all learned skills for your portfolio.', type: 'project', provider: 'Self-paced', url: '', duration: '30 hours', skills: gapSkills, isAdaptive: true },
          { id: '6', title: 'Coding Challenges & Practice', description: 'Daily coding challenges to sharpen problem-solving skills.', type: 'practice', provider: 'LeetCode / HackerRank', url: 'https://leetcode.com', duration: '20 hours', skills: ['Problem Solving', 'Algorithms'], isAdaptive: true },
        ],
        progress: { completedModules: 0, totalModules: 6, percentage: 0 },
        estimatedCompletion: '12-16 weeks',
        _demo: true,
      };
    }

    // Find existing learning path for this user + targetRole, or create new
    const existingPath = await prisma.learningPath.findFirst({
      where: {
        userId: session.user.id,
        targetRole,
      },
    });

    const savedPath = await prisma.learningPath.upsert({
      where: {
        id: existingPath?.id || 'nonexistent-id',
      },
      update: {
        modules: learningPathData.modules || [],
        progress: learningPathData.progress || {},
        adaptive: true,
      },
      create: {
        userId: session.user.id,
        targetRole,
        modules: learningPathData.modules || [],
        progress: learningPathData.progress || {},
        adaptive: true,
      },
    });

    return NextResponse.json({
      id: savedPath.id,
      targetRole: savedPath.targetRole,
      ...learningPathData,
    });
  } catch (error) {
    console.error('[Learning Path API]', error);
    return NextResponse.json(
      { error: 'Failed to generate learning path' },
      { status: 500 }
    );
  }
}
