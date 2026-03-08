/**
 * Forge Agent — Resume Optimizer
 * Analyzes and optimizes resumes for specific jobs
 */
import { prisma } from '@/lib/db/prisma';
import { aiChatWithFallback, extractJSON } from '@/lib/ai/openrouter';
import { type AgentContext, getContextSummary, getAgentHandoff, logActivity } from './context';

interface ResumeContent {
  contact: { name: string; email: string; phone: string; location: string; linkedin?: string };
  summary: string;
  experience: { title: string; company: string; location: string; startDate: string; endDate: string; bullets: string[] }[];
  education: { degree: string; institution: string; year: string; gpa?: string }[];
  skills: string[];
  certifications?: string[];
}

interface ForgeAnalysis {
  atsScore: number;
  keywordGaps: string[];
  suggestions: string[];
  optimizedSummary?: string;
  optimizedBullets?: { original: string; enhanced: string }[];
}

/**
 * Analyze a resume against a specific job description
 */
export async function analyzeResumeForJob(
  userId: string,
  resume: ResumeContent,
  jobTitle: string,
  jobDescription: string,
  company: string,
  ctx?: AgentContext,
): Promise<ForgeAnalysis> {
  const prompt = `You are Forge, an expert ATS Resume Optimizer AI agent. Analyze this resume against the target job and provide specific, actionable feedback.

TARGET JOB:
Title: ${jobTitle}
Company: ${company}
Description: ${jobDescription.slice(0, 1500)}

CANDIDATE RESUME:
Name: ${resume.contact.name}
Summary: ${resume.summary}
Experience: ${resume.experience.map(e => `${e.title} at ${e.company}: ${e.bullets.join('; ')}`).join('\n')}
Skills: ${resume.skills.join(', ')}
Education: ${resume.education.map(e => `${e.degree} from ${e.institution}`).join(', ')}

Respond in JSON:
{
  "atsScore": <number 0-100, how well resume matches this specific job>,
  "keywordGaps": [<strings: important keywords from the JD missing from resume>],
  "suggestions": [<strings: 3-5 specific improvement suggestions>],
  "optimizedSummary": "<rewritten professional summary tailored to this job, 2-3 sentences>",
  "optimizedBullets": [{"original": "<first experience bullet>", "enhanced": "<improved version with relevant keywords>"}]
}`;

  try {
    const contextBlock = ctx ? `\n\nTEAM CONTEXT:\n${getContextSummary(ctx)}` : '';
    const handoffBlock = ctx ? `\n\nHANDOFF DATA:\n${getAgentHandoff(ctx, 'scout', 'forge')}` : '';

    const response = await aiChatWithFallback({ messages: [
      { role: 'system', content: `You are Forge, the ATS Resume Optimizer in jobTED's AI agent team.
${contextBlock}
${handoffBlock}

YOUR ROLE: Analyze resumes against job descriptions, identify keyword gaps, and optimize content for ATS scoring.

THINK STEP BY STEP:
1. Parse the job description for required skills, qualifications, and keywords
2. Compare against the candidate's actual resume content
3. Identify genuine keyword gaps (not fabricated skills)
4. Suggest improvements that honestly represent the candidate
5. Score the resume match and explain your reasoning

IMPORTANT:
- Never fabricate company names, job details, or qualifications
- Only use facts from the user's verified profile
- Include confidence score (0-100) for each decision
- Explain reasoning transparently for audit trail
- Never add skills the candidate does not possess

OUTPUT FORMAT: Valid JSON with a "reasoning" field explaining your decisions.` },
      { role: 'user', content: prompt },
    ] }, 'free');

    const analysis = JSON.parse(extractJSON(response)) as ForgeAnalysis;
    
    // Validate and sanitize
    const result: ForgeAnalysis = {
      atsScore: Math.min(100, Math.max(0, Number(analysis.atsScore) || 50)),
      keywordGaps: Array.isArray(analysis.keywordGaps) ? analysis.keywordGaps.slice(0, 10) : [],
      suggestions: Array.isArray(analysis.suggestions) ? analysis.suggestions.slice(0, 5) : [],
      optimizedSummary: typeof analysis.optimizedSummary === 'string' ? analysis.optimizedSummary : undefined,
      optimizedBullets: Array.isArray(analysis.optimizedBullets) ? analysis.optimizedBullets.slice(0, 3) : undefined,
    };

    // Log activity
    await prisma.agentActivity.create({
      data: {
        userId,
        agent: 'forge',
        action: 'optimized_resume',
        summary: `Analyzed resume for "${jobTitle}" at ${company} — ATS Score: ${result.atsScore}%, Found ${result.keywordGaps.length} keyword gaps`,
        details: { atsScore: result.atsScore, keywordGaps: result.keywordGaps, company, jobTitle },
      },
    });

    // Log to shared agent context
    if (ctx) {
      logActivity(ctx, 'forge', 'optimized_resume', `Analyzed resume for "${jobTitle}" at ${company} — ATS Score: ${result.atsScore}%, ${result.keywordGaps.length} keyword gaps, ${result.suggestions.length} suggestions`);
    }

    return result;
  } catch (err) {
    console.error('[Forge] Analysis failed:', err);
    return {
      atsScore: 50,
      keywordGaps: [],
      suggestions: ['Unable to complete analysis. Please try again.'],
    };
  }
}

/**
 * Generate a fully optimized resume variant for a specific job.
 * Rewrites summary, reorders skills, enhances bullets — using ONLY real candidate data.
 */
export async function generateOptimizedResume(
  userId: string,
  baseResume: ResumeContent,
  jobTitle: string,
  jobDescription: string,
  company: string,
  analysis: ForgeAnalysis,
  ctx?: AgentContext,
): Promise<ResumeContent> {
  const prompt = `Create an optimized resume variant for this specific job. Use ONLY the candidate's real data — do NOT fabricate any skills, companies, or achievements.

TARGET JOB: ${jobTitle} at ${company}
KEY JOB KEYWORDS: ${analysis.keywordGaps.slice(0, 8).join(', ')}
ATS SCORE OF ORIGINAL: ${analysis.atsScore}%

ORIGINAL RESUME:
Summary: ${baseResume.summary}
Skills: ${baseResume.skills.join(', ')}
Experience: ${baseResume.experience.map(e => `${e.title} at ${e.company}: ${e.bullets.slice(0, 3).join('; ')}`).join('\n')}

Respond in JSON:
{
  "optimizedSummary": "<2-3 sentence summary targeting THIS specific job>",
  "reorderedSkills": [<skills reordered with most relevant to this job first>],
  "enhancedBullets": [{"experienceIndex": 0, "bulletIndex": 0, "enhanced": "<improved bullet with relevant keywords>"}]
}

Rules:
- Rewrite the summary to target this specific role and company
- Put the most relevant skills first in the skills list
- Enhance 3-5 key experience bullets with job-relevant keywords
- NEVER add skills or experience the candidate does not have
- Keep all enhancements truthful to the original resume`;

  try {
    const response = await aiChatWithFallback({ messages: [
      { role: 'system', content: 'You are Forge, the ATS Resume Optimizer. Create job-specific resume variants using only the candidate\'s real data. Never fabricate. Output valid JSON.' },
      { role: 'user', content: prompt },
    ] }, 'free');

    const result = JSON.parse(extractJSON(response));

    // Build the optimized resume from base + AI enhancements
    const optimized: ResumeContent = JSON.parse(JSON.stringify(baseResume)); // Deep clone

    // Apply optimized summary
    if (typeof result.optimizedSummary === 'string') {
      optimized.summary = result.optimizedSummary;
    } else if (analysis.optimizedSummary) {
      optimized.summary = analysis.optimizedSummary;
    }

    // Apply reordered skills (only if they're from the original set)
    if (Array.isArray(result.reorderedSkills)) {
      const originalSkillsLower = new Set(baseResume.skills.map(s => s.toLowerCase()));
      const validReordered = result.reorderedSkills.filter(
        (s: string) => typeof s === 'string' && originalSkillsLower.has(s.toLowerCase())
      );
      if (validReordered.length >= baseResume.skills.length * 0.5) {
        // Add any original skills that weren't in the reordered list
        const reorderedLower = new Set(validReordered.map((s: string) => s.toLowerCase()));
        const missing = baseResume.skills.filter(s => !reorderedLower.has(s.toLowerCase()));
        optimized.skills = [...validReordered, ...missing];
      }
    }

    // Apply enhanced bullets
    if (Array.isArray(result.enhancedBullets)) {
      for (const enhancement of result.enhancedBullets.slice(0, 5)) {
        const expIdx = Number(enhancement.experienceIndex);
        const bulletIdx = Number(enhancement.bulletIndex);
        if (
          optimized.experience[expIdx] &&
          optimized.experience[expIdx].bullets[bulletIdx] &&
          typeof enhancement.enhanced === 'string'
        ) {
          optimized.experience[expIdx].bullets[bulletIdx] = enhancement.enhanced;
        }
      }
    }

    // Log activity
    await prisma.agentActivity.create({
      data: {
        userId,
        agent: 'forge',
        action: 'generated_variant',
        summary: `Created optimized resume variant for "${jobTitle}" at ${company}`,
        details: { jobTitle, company, originalAtsScore: analysis.atsScore },
      },
    });

    if (ctx) {
      logActivity(ctx, 'forge', 'generated_variant', `Created optimized resume variant for "${jobTitle}" at ${company}`);
    }

    return optimized;
  } catch (err) {
    console.error('[Forge] Resume variant generation failed:', err);
    // Return base resume with analysis suggestions applied
    const fallback: ResumeContent = JSON.parse(JSON.stringify(baseResume));
    if (analysis.optimizedSummary) fallback.summary = analysis.optimizedSummary;
    return fallback;
  }
}

/**
 * Quick ATS score check without full optimization
 */
export async function quickATSScore(resume: ResumeContent, jobDescription: string): Promise<number> {
  // Simple keyword overlap check
  const resumeText = `${resume.summary} ${resume.skills.join(' ')} ${resume.experience.map(e => e.bullets.join(' ')).join(' ')}`.toLowerCase();
  const jdWords = jobDescription.toLowerCase().split(/\s+/).filter(w => w.length > 3);
  const uniqueJdWords = [...new Set(jdWords)];
  
  if (uniqueJdWords.length === 0) return 50;
  
  const matches = uniqueJdWords.filter(w => resumeText.includes(w));
  const ratio = matches.length / uniqueJdWords.length;
  
  return Math.min(100, Math.round(ratio * 120)); // Slight boost since not all JD words are keywords
}
