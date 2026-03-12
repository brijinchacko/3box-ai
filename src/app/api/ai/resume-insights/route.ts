import { NextResponse, NextRequest } from 'next/server';
import { aiChat, AI_MODELS, extractJSON } from '@/lib/ai/openrouter';
import { findClosestBenchmark } from '@/lib/salary/salaryBenchmarks';
import { adjustSalaryForLocation, getCostOfLiving } from '@/lib/salary/costOfLiving';

/**
 * POST /api/ai/resume-insights
 *
 * Called immediately after resume parsing during onboarding.
 * Takes parsed resume data and returns:
 *   - Job market insights (demand, growth, top companies)
 *   - Salary estimates adjusted for location + experience
 *   - Matching job titles the user qualifies for
 *   - Forge optimization suggestion
 */

interface ResumeInsightsRequest {
  targetRole: string;
  location: string;
  experienceLevel: string;
  skills: string[];
  experiences: { title: string; company: string; duration: string }[];
  educationLevel: string;
  currentStatus: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: ResumeInsightsRequest = await request.json();
    const { targetRole, location, experienceLevel, skills, experiences, educationLevel, currentStatus } = body;

    if (!targetRole) {
      return NextResponse.json({ error: 'Target role is required' }, { status: 400 });
    }

    // ── 1. Static salary benchmark lookup ──────────────────
    const benchmark = findClosestBenchmark(targetRole);
    let salaryLow = benchmark?.p10USD || 50_000;
    let salaryMedian = benchmark?.medianUSD || 80_000;
    let salaryHigh = benchmark?.p90USD || 150_000;
    const growthRate = benchmark?.growthRate || 0.10;

    // Experience adjustment
    const expMultipliers: Record<string, number> = {
      fresher: 0.60, '0-1': 0.70, '1-3': 0.85, '3-5': 1.0, '5-10': 1.25, '10+': 1.50,
    };
    const expMult = expMultipliers[experienceLevel] || 1.0;
    salaryLow = Math.round(salaryLow * expMult);
    salaryMedian = Math.round(salaryMedian * expMult);
    salaryHigh = Math.round(salaryHigh * expMult);

    // Location adjustment
    if (location) {
      const col = getCostOfLiving(location);
      if (col) {
        salaryLow = adjustSalaryForLocation(salaryLow, location).adjustedAmount;
        salaryMedian = adjustSalaryForLocation(salaryMedian, location).adjustedAmount;
        salaryHigh = adjustSalaryForLocation(salaryHigh, location).adjustedAmount;
      }
    }

    // ── 2. AI-powered market insights ──────────────────────
    let aiInsights = null;

    if (process.env.OPENROUTER_API_KEY) {
      try {
        const skillsList = skills.slice(0, 10).join(', ');
        const expList = experiences.slice(0, 3).map(e => `${e.title} at ${e.company}`).join('; ');

        const aiResponse = await aiChat({
          model: AI_MODELS.standard.id,
          messages: [
            {
              role: 'system',
              content: `You are a career market intelligence analyst. Given a candidate's profile, provide job market insights. Return ONLY a JSON object with these exact fields:

{
  "demandLevel": "high" | "medium" | "low",
  "marketTrend": "growing" | "stable" | "declining",
  "topCompanies": ["5 companies actively hiring for this role in the candidate's region"],
  "matchingRoles": ["5 specific job titles this candidate qualifies for based on their skills and experience"],
  "keyInsight": "One compelling 1-sentence insight about their market position",
  "resumeStrength": "brief 1-sentence assessment of resume competitiveness",
  "forgeRecommendation": "1 specific thing Agent Forge could improve in their resume to increase interview callbacks by 40%+",
  "topSkillGaps": ["up to 3 in-demand skills they should highlight or develop"],
  "competitiveEdge": "1-sentence about what makes this candidate stand out"
}

Be specific to their role, location, and experience level. Make insights actionable and data-driven.`,
            },
            {
              role: 'user',
              content: `Analyze this candidate's job market position:

Role: ${targetRole}
Location: ${location || 'Not specified'}
Experience Level: ${experienceLevel}
Current Status: ${currentStatus}
Education: ${educationLevel}
Skills: ${skillsList}
Recent Experience: ${expList || 'No prior experience listed'}

Provide personalized job market insights.`,
            },
          ],
          temperature: 0.5,
          maxTokens: 1500,
          jsonMode: true,
        });

        aiInsights = JSON.parse(extractJSON(aiResponse));
      } catch (err) {
        console.warn('[Resume Insights] AI analysis failed, using static data:', err);
      }
    }

    // ── 3. Build response ──────────────────────────────────
    const response = {
      salary: {
        low: salaryLow,
        median: salaryMedian,
        high: salaryHigh,
        currency: 'USD',
        growthRate: Math.round(growthRate * 100),
      },
      market: {
        demandLevel: aiInsights?.demandLevel || (growthRate > 0.15 ? 'high' : growthRate > 0.05 ? 'medium' : 'low'),
        marketTrend: aiInsights?.marketTrend || (growthRate > 0.10 ? 'growing' : 'stable'),
        topCompanies: aiInsights?.topCompanies || [],
        matchingRoles: aiInsights?.matchingRoles || [targetRole],
      },
      insights: {
        keyInsight: aiInsights?.keyInsight || `${targetRole} roles are in ${growthRate > 0.15 ? 'high' : 'moderate'} demand with ${Math.round(growthRate * 100)}% projected growth.`,
        resumeStrength: aiInsights?.resumeStrength || 'Upload complete — ready for optimization.',
        forgeRecommendation: aiInsights?.forgeRecommendation || `Agent Forge can tailor your resume with ATS-optimized keywords for ${targetRole} positions, potentially increasing your callback rate by 40%.`,
        topSkillGaps: aiInsights?.topSkillGaps || [],
        competitiveEdge: aiInsights?.competitiveEdge || '',
      },
    };

    return NextResponse.json({ success: true, data: response });
  } catch (error) {
    console.error('[Resume Insights] Error:', error);
    return NextResponse.json(
      { error: 'Failed to generate insights. Continuing with onboarding...' },
      { status: 500 }
    );
  }
}
