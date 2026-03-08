/**
 * Sage Agent — Skill Trainer
 * Identifies skill gaps and recommends learning paths
 */
import { prisma } from '@/lib/db/prisma';
import { aiChatWithFallback, extractJSON } from '@/lib/ai/openrouter';
import { type AgentContext, getContextSummary, logActivity } from './context';

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
  ctx?: AgentContext,
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
    const contextBlock = ctx ? `\n\nTEAM CONTEXT:\n${getContextSummary(ctx)}` : '';

    const response = await aiChatWithFallback({ messages: [
      { role: 'system', content: `You are Sage, the Skill Trainer in 3BOX's AI agent team.
${contextBlock}

YOUR ROLE: Identify skill gaps between the candidate's current abilities and market demands, then recommend targeted learning paths.

THINK STEP BY STEP:
1. Parse job descriptions for required skills, tools, and competencies
2. Compare required skills against the candidate's verified skill set
3. Categorize gaps by importance (critical vs nice-to-have)
4. Identify the candidate's existing strengths that are in demand
5. Recommend specific, actionable learning resources with realistic timelines
6. Calculate overall readiness and explain your scoring methodology

IMPORTANT:
- Never fabricate company names, job details, or qualifications
- Only use facts from the user's verified profile
- Include confidence score (0-100) for each decision
- Explain reasoning transparently for audit trail
- Base gap analysis on actual job market data provided
- Recommend practical, achievable learning paths
- Distinguish between "must-have" and "nice-to-have" skills honestly

OUTPUT FORMAT: Valid JSON with a "reasoning" field explaining your decisions.` },
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

    // Log to shared agent context
    if (ctx) {
      const criticalGaps = result.gaps.filter(g => g.importance === 'critical').length;
      logActivity(ctx, 'sage', 'identified_gaps', `Identified ${result.gaps.length} skill gaps for "${targetRole}" (${criticalGaps} critical) — Readiness: ${result.overallReadiness}%, ${result.recommendations.length} learning recommendations`);
    }

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

// ─── Application-Based Gap Analysis ────────────────────────────────────────

export interface ApplicationGapReport {
  jobCategory: string;
  totalApplied: number;
  currentMatchRate: number; // avg match score %
  projectedMatchRate: number; // estimated with missing skills %
  missingSkills: { skill: string; frequency: number; total: number }[];
  summary: string;
}

/**
 * Analyze skill gaps based on actual application history.
 * Output format the user wants:
 *   "You applied for 50 PLC Engineer jobs. You lack:
 *     - Siemens TIA Portal (required in 42/50 jobs)
 *     - SCADA (required in 38/50 jobs)
 *     Your current match rate: 32%. With these skills: ~78%."
 */
export async function generateApplicationBasedGapAnalysis(
  userId: string,
): Promise<ApplicationGapReport[]> {
  try {
    // Get user's applications grouped by job category
    const applications = await prisma.jobApplication.findMany({
      where: { userId },
      select: {
        jobTitle: true,
        company: true,
        matchScore: true,
        notes: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });

    if (applications.length < 5) {
      return []; // Need at least 5 applications for meaningful analysis
    }

    // Get user skills
    const careerTwin = await prisma.careerTwin.findUnique({
      where: { userId },
      select: { skillSnapshot: true, targetRoles: true },
    });

    const userSkills: string[] = [];
    if (careerTwin?.skillSnapshot) {
      const skills = careerTwin.skillSnapshot as any;
      if (Array.isArray(skills)) {
        skills.forEach((s: any) => {
          const name = typeof s === 'string' ? s : s.skill || s.name || '';
          if (name) userSkills.push(name.toLowerCase());
        });
      }
    }

    // Group applications by job category (first 2 significant words of title)
    const categories = new Map<string, typeof applications>();
    for (const app of applications) {
      const key = normalizeJobCategory(app.jobTitle);
      if (!categories.has(key)) categories.set(key, []);
      categories.get(key)!.push(app);
    }

    // Use AI to analyze skill gaps per category
    const reports: ApplicationGapReport[] = [];

    for (const [category, apps] of categories) {
      if (apps.length < 3) continue; // Skip small categories

      const avgMatch = apps.reduce((sum, a) => sum + (a.matchScore || 0), 0) / apps.length;

      // Extract skills from job titles for basic analysis
      const prompt = `Analyze skill requirements for "${category}" jobs based on these ${apps.length} applications.

Job titles: ${[...new Set(apps.map(a => a.jobTitle))].slice(0, 10).join(', ')}
Candidate's current skills: ${userSkills.join(', ')}
Average match score: ${Math.round(avgMatch)}%

Identify the top 5 most commonly required skills that the candidate is MISSING. For each, estimate how frequently it appears in ${category} job descriptions.

Respond in JSON:
{
  "missingSkills": [{"skill": "<skill name>", "estimatedFrequency": <percentage 0-100 of jobs requiring this>}],
  "projectedMatchWithSkills": <estimated match rate if candidate had these skills>
}`;

      try {
        const response = await aiChatWithFallback({ messages: [
          { role: 'system', content: 'You are a career skill analyst. Identify commonly required skills for specific job categories. Output valid JSON.' },
          { role: 'user', content: prompt },
        ] }, 'free');

        const result = JSON.parse(extractJSON(response));

        const missingSkills = Array.isArray(result.missingSkills)
          ? result.missingSkills.slice(0, 5).map((s: any) => ({
              skill: String(s.skill || ''),
              frequency: Math.round((Number(s.estimatedFrequency) || 50) / 100 * apps.length),
              total: apps.length,
            }))
          : [];

        const projectedMatch = Math.min(100, Number(result.projectedMatchWithSkills) || avgMatch + 30);

        reports.push({
          jobCategory: category,
          totalApplied: apps.length,
          currentMatchRate: Math.round(avgMatch),
          projectedMatchRate: Math.round(projectedMatch),
          missingSkills,
          summary: `You applied for ${apps.length} ${category} jobs. Your current match rate: ${Math.round(avgMatch)}%. With missing skills: ~${Math.round(projectedMatch)}%.`,
        });
      } catch {}
    }

    // Log activity
    if (reports.length > 0) {
      await prisma.agentActivity.create({
        data: {
          userId,
          agent: 'sage',
          action: 'application_gap_analysis',
          summary: `Analyzed skill gaps across ${reports.length} job categories from ${applications.length} applications`,
          details: {
            categories: reports.map(r => r.jobCategory),
            totalApplications: applications.length,
          },
        },
      });
    }

    return reports.sort((a, b) => b.totalApplied - a.totalApplied);
  } catch (err) {
    console.error('[Sage] Application gap analysis failed:', err);
    return [];
  }
}

function normalizeJobCategory(title: string): string {
  // Remove seniority prefixes and normalize
  return title
    .replace(/^(senior|junior|lead|principal|staff|entry[\s-]level|sr\.?|jr\.?)\s*/i, '')
    .replace(/\s*(i{1,3}|iv|v|1|2|3|4|5|intern|trainee)\s*$/i, '')
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .slice(0, 3) // Take first 3 words
    .join(' ');
}
