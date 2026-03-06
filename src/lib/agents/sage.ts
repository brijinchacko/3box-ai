/**
 * Sage Agent — Skill Trainer
 * Identifies skill gaps and recommends learning paths
 */
import { prisma } from '@/lib/db/prisma';
import { aiChatWithFallback, extractJSON } from '@/lib/ai/openrouter';

interface SkillGapAnalysis {
  gaps: { skill: string; importance: 'critical' | 'important' | 'nice-to-have'; reason: string }[];
  recommendations: { title: string; type: 'course' | 'project' | 'certification' | 'practice'; description: string; estimatedTime: string }[];
  strengthAreas: string[];
  overallReadiness: number; // 0-100
}

/**
 * Analyze skill gaps between candidate profile and target jobs
 */
export async function analyzeSkillGaps(
  userId: string,
  candidateSkills: string[],
  targetRole: string,
  recentJobDescriptions: string[],
): Promise<SkillGapAnalysis> {
  const jdSample = recentJobDescriptions.slice(0, 3).join('\n---\n').slice(0, 3000);
  
  const prompt = `You are Sage, an expert Skill Development AI agent. Analyze the gap between this candidate's skills and what the market demands.

CANDIDATE SKILLS: ${candidateSkills.join(', ')}
TARGET ROLE: ${targetRole}

RECENT JOB DESCRIPTIONS FOR THIS ROLE:
${jdSample}

Respond in JSON:
{
  "gaps": [{"skill": "<missing skill>", "importance": "critical|important|nice-to-have", "reason": "<why this skill matters>"}],
  "recommendations": [{"title": "<learning resource>", "type": "course|project|certification|practice", "description": "<brief description>", "estimatedTime": "<e.g., 2 weeks>"}],
  "strengthAreas": ["<skills the candidate already has that are in demand>"],
  "overallReadiness": <number 0-100, how ready the candidate is for the target role>
}

Identify 3-6 skill gaps and 3-5 learning recommendations.`;

  try {
    const response = await aiChatWithFallback({ messages: [
      { role: 'system', content: 'You are Sage, a Skill Development AI agent. Always respond in valid JSON.' },
      { role: 'user', content: prompt },
    ] }, 'free');

    const analysis = JSON.parse(extractJSON(response)) as SkillGapAnalysis;

    const result: SkillGapAnalysis = {
      gaps: Array.isArray(analysis.gaps) ? analysis.gaps.slice(0, 6) : [],
      recommendations: Array.isArray(analysis.recommendations) ? analysis.recommendations.slice(0, 5) : [],
      strengthAreas: Array.isArray(analysis.strengthAreas) ? analysis.strengthAreas.slice(0, 5) : [],
      overallReadiness: Math.min(100, Math.max(0, Number(analysis.overallReadiness) || 50)),
    };

    await prisma.agentActivity.create({
      data: {
        userId,
        agent: 'sage',
        action: 'identified_gaps',
        summary: `Identified ${result.gaps.length} skill gaps for "${targetRole}" — Readiness: ${result.overallReadiness}%`,
        details: { targetRole, gapCount: result.gaps.length, readiness: result.overallReadiness, gaps: result.gaps.map(g => g.skill) },
      },
    });

    return result;
  } catch (err) {
    console.error('[Sage] Skill gap analysis failed:', err);
    return {
      gaps: [],
      recommendations: [{ title: 'Review job descriptions', type: 'practice', description: 'Study recent job postings for your target role to identify in-demand skills.', estimatedTime: '1 day' }],
      strengthAreas: candidateSkills.slice(0, 3),
      overallReadiness: 50,
    };
  }
}
