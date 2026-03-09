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
  // LinkedIn optimization content (generated alongside resume)
  linkedinHeadline?: string;
  linkedinBio?: string;
  linkedinSuggestedSkills?: string[];
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
      { role: 'system', content: `You are Forge, the ATS Resume Optimizer in 3BOX's AI agent team.
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

// ─── Resume Readiness Verification ─────────────────────────────────────────

export interface ResumeReadinessResult {
  passed: boolean;
  completenessScore: number;
  averageAtsScore: number;
  skillCoveragePercent: number;
  issues: { field: string; severity: 'critical' | 'warning'; message: string }[];
  gaps: string[];
  recommendations: string[];
}

/**
 * Verify that a resume is ready for applications.
 * Two-phase check:
 *   Phase 1 — Local completeness (zero AI cost)
 *   Phase 2 — ATS + skill coverage analysis against target jobs (1 AI call)
 *
 * Blocks Archer if: critical issues exist, completeness < 70%, or avg ATS < 30%.
 */
export async function verifyResumeReadiness(
  userId: string,
  resume: ResumeContent,
  targetJobs: { title: string; description: string; company: string }[],
  ctx?: AgentContext,
): Promise<ResumeReadinessResult> {
  const issues: ResumeReadinessResult['issues'] = [];

  // ── Phase 1: Local completeness checks (zero AI cost) ──

  // Contact fields
  if (!resume.contact?.name?.trim()) {
    issues.push({ field: 'contact.name', severity: 'critical', message: 'Name is missing from resume' });
  }
  if (!resume.contact?.email?.trim()) {
    issues.push({ field: 'contact.email', severity: 'critical', message: 'Email is missing from resume' });
  }
  if (!resume.contact?.phone?.trim()) {
    issues.push({ field: 'contact.phone', severity: 'warning', message: 'Phone number is missing' });
  }
  if (!resume.contact?.location?.trim()) {
    issues.push({ field: 'contact.location', severity: 'warning', message: 'Location is missing' });
  }

  // Summary
  if (!resume.summary?.trim() || resume.summary.trim().length < 20) {
    issues.push({ field: 'summary', severity: 'critical', message: 'Professional summary is empty or too short (min 20 chars)' });
  }

  // Experience
  if (!resume.experience || resume.experience.length === 0) {
    issues.push({ field: 'experience', severity: 'critical', message: 'No work experience entries found' });
  } else {
    const emptyBullets = resume.experience.filter(e => !e.bullets || e.bullets.length === 0);
    if (emptyBullets.length > 0) {
      issues.push({ field: 'experience.bullets', severity: 'warning', message: `${emptyBullets.length} experience entries have no bullet points` });
    }
    const missingTitles = resume.experience.filter(e => !e.title?.trim());
    if (missingTitles.length > 0) {
      issues.push({ field: 'experience.title', severity: 'critical', message: `${missingTitles.length} experience entries missing job title` });
    }
  }

  // Skills
  if (!resume.skills || resume.skills.length === 0) {
    issues.push({ field: 'skills', severity: 'critical', message: 'No skills listed on resume' });
  } else if (resume.skills.length < 3) {
    issues.push({ field: 'skills', severity: 'warning', message: 'Very few skills listed (recommend at least 5)' });
  }

  // Education
  if (!resume.education || resume.education.length === 0) {
    issues.push({ field: 'education', severity: 'warning', message: 'No education entries found' });
  }

  // Weighted completeness score
  const fieldChecks = [
    { filled: !!resume.contact?.name?.trim(), weight: 15 },
    { filled: !!resume.contact?.email?.trim(), weight: 15 },
    { filled: !!resume.contact?.phone?.trim(), weight: 5 },
    { filled: !!resume.contact?.location?.trim(), weight: 5 },
    { filled: !!resume.summary?.trim() && resume.summary.trim().length >= 20, weight: 15 },
    { filled: (resume.experience?.length ?? 0) > 0, weight: 20 },
    { filled: (resume.skills?.length ?? 0) >= 3, weight: 15 },
    { filled: (resume.education?.length ?? 0) > 0, weight: 10 },
  ];
  const completenessScore = fieldChecks.reduce(
    (sum, check) => sum + (check.filled ? check.weight : 0), 0
  );

  // ── Phase 2: ATS analysis against target jobs ──
  let averageAtsScore = 0;
  let skillCoveragePercent = 0;
  const allGaps: string[] = [];
  let aiRecommendations: string[] = [];

  if (targetJobs.length > 0 && completenessScore >= 50) {
    // Use quickATSScore for each job (local, no AI call)
    const atsScores: number[] = [];
    for (const job of targetJobs.slice(0, 10)) {
      const score = await quickATSScore(resume, job.description);
      atsScores.push(score);
    }
    averageAtsScore = Math.round(atsScores.reduce((s, v) => s + v, 0) / atsScores.length);

    // Single AI call: batch skill coverage analysis
    const jobSummaries = targetJobs.slice(0, 5).map(j =>
      `${j.title} at ${j.company}: ${j.description.slice(0, 300)}`
    ).join('\n\n');

    try {
      const response = await aiChatWithFallback({ messages: [
        { role: 'system', content: 'You are Forge, the Resume Optimizer. Analyze whether this resume covers the skills needed for these target jobs. Output valid JSON only.' },
        { role: 'user', content: `RESUME SKILLS: ${(resume.skills || []).join(', ')}
RESUME EXPERIENCE: ${(resume.experience || []).map(e => `${e.title}: ${(e.bullets || []).slice(0, 2).join('; ')}`).join('\n')}

TARGET JOBS:
${jobSummaries}

Respond in JSON:
{
  "skillCoveragePercent": <0-100, what % of required skills does this resume cover>,
  "gaps": [<top 5 skill/keyword gaps across these jobs>],
  "recommendations": [<3-5 specific actions to improve resume readiness>]
}` },
      ] }, 'free');

      const parsed = JSON.parse(extractJSON(response));
      skillCoveragePercent = Math.min(100, Math.max(0, Number(parsed.skillCoveragePercent) || 0));
      if (Array.isArray(parsed.gaps)) allGaps.push(...parsed.gaps.slice(0, 8));
      aiRecommendations = Array.isArray(parsed.recommendations) ? parsed.recommendations.slice(0, 5) : [];
    } catch {
      skillCoveragePercent = 50; // neutral default on AI failure
      aiRecommendations = ['Unable to complete AI skill analysis. Please try again.'];
    }
  } else if (completenessScore < 50) {
    aiRecommendations = ['Complete the missing resume fields before running AI analysis.'];
  }

  // ── Pass/Fail Decision ──
  const hasCriticalIssues = issues.some(i => i.severity === 'critical');
  const passed = !hasCriticalIssues && completenessScore >= 70 && averageAtsScore >= 30;

  const result: ResumeReadinessResult = {
    passed,
    completenessScore,
    averageAtsScore,
    skillCoveragePercent,
    issues,
    gaps: allGaps,
    recommendations: aiRecommendations,
  };

  // Log to AgentActivity DB
  await prisma.agentActivity.create({
    data: {
      userId,
      agent: 'forge',
      action: passed ? 'resume_verified' : 'resume_verification_failed',
      summary: `Resume verification ${passed ? 'PASSED' : 'FAILED'}: completeness ${completenessScore}%, avg ATS ${averageAtsScore}%, ${issues.length} issues found`,
      details: {
        completenessScore,
        averageAtsScore,
        skillCoveragePercent,
        issueCount: issues.length,
        criticalIssues: issues.filter(i => i.severity === 'critical').length,
        gaps: allGaps,
      },
    },
  });

  if (ctx) {
    logActivity(ctx, 'forge', passed ? 'resume_verified' : 'resume_verification_failed',
      `Resume ${passed ? 'PASSED' : 'FAILED'} verification: completeness ${completenessScore}%, ATS ${averageAtsScore}%, ${issues.filter(i => i.severity === 'critical').length} critical issues`);
  }

  return result;
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

// ─── Generate Resume From Onboarding Profile ────────────────────────────────

export interface OnboardingProfile {
  fullName: string;
  phone: string;
  location: string;
  linkedin: string;
  targetRole: string;
  experienceLevel: string;
  currentStatus: string;
  experiences: { title: string; company: string; duration: string; description: string }[];
  educationLevel: string;
  fieldOfStudy: string;
  institution: string;
  graduationYear: string;
  skills: string[];
  bio: string;
  email?: string;
}

/**
 * Generate a complete resume + cover letter from onboarding profile data.
 * This is the first step after onboarding — takes the raw profile and
 * produces a polished, ATS-friendly resume ready for user approval.
 *
 * Cost: 3 tokens (resume) + 2 tokens (cover letter) = 5 total
 */
export async function generateResumeFromProfile(
  userId: string,
  profile: OnboardingProfile,
  ctx?: AgentContext,
): Promise<{ resume: ResumeContent; coverLetter: string; atsScore: number }> {
  // ── Step 1: Convert profile → ResumeContent structure ──
  const baseResume: ResumeContent = {
    contact: {
      name: profile.fullName,
      email: profile.email || '',
      phone: profile.phone || '',
      location: profile.location || '',
      linkedin: profile.linkedin || undefined,
    },
    summary: profile.bio || '',
    experience: (profile.experiences || []).map(exp => ({
      title: exp.title || '',
      company: exp.company || '',
      location: '',
      startDate: '',
      endDate: '',
      bullets: exp.description ? exp.description.split(/[.;]\s*/).filter(Boolean).map(s => s.trim()) : [],
    })),
    education: profile.institution ? [{
      degree: profile.educationLevel || '',
      institution: profile.institution,
      year: profile.graduationYear || '',
    }] : [],
    skills: profile.skills || [],
  };

  // ── Step 2: AI-enhance the resume (generate summary + polish bullets) ──
  const resumePrompt = `You are Forge, an expert ATS Resume Optimizer. Generate a polished, professional resume from this candidate's profile data.

CANDIDATE PROFILE:
Name: ${profile.fullName}
Target Role: ${profile.targetRole}
Experience Level: ${profile.experienceLevel}
Current Status: ${profile.currentStatus}
Bio: ${profile.bio || 'Not provided'}
Skills: ${(profile.skills || []).join(', ')}
Experience:
${(profile.experiences || []).map(e => `- ${e.title} at ${e.company} (${e.duration}): ${e.description}`).join('\n')}
Education: ${profile.educationLevel} in ${profile.fieldOfStudy || 'N/A'} from ${profile.institution || 'N/A'} (${profile.graduationYear || 'N/A'})

Generate a professional resume AND LinkedIn profile content in JSON format:
{
  "summary": "<2-3 sentence professional summary targeting ${profile.targetRole}, highlighting key strengths>",
  "enhancedExperience": [
    {
      "title": "<job title>",
      "company": "<company>",
      "bullets": ["<achievement-oriented bullet with metrics where possible>", "<another bullet>"]
    }
  ],
  "reorderedSkills": ["<most relevant skills first for ${profile.targetRole}>"],
  "estimatedAtsScore": <number 40-90, realistic assessment>,
  "linkedinHeadline": "<compelling LinkedIn headline, max 120 chars, with relevant keywords for ${profile.targetRole}. Example format: 'Senior Software Engineer | React & Node.js | Building scalable web applications'>",
  "linkedinBio": "<3-5 sentence LinkedIn About section. Conversational and engaging tone (first person). Highlight key strengths, years of experience, core skills, and career goals. End with what excites them about their field.>",
  "linkedinSuggestedSkills": ["<top 10-15 LinkedIn skills based on their profile, most relevant to ${profile.targetRole} first>"]
}

Rules:
- Summary should be compelling and target the ${profile.targetRole} role
- Enhance experience bullets with action verbs and quantified achievements where reasonable
- NEVER fabricate companies, titles, or skills not in the original profile
- Reorder skills with most relevant to ${profile.targetRole} first
- Be realistic with the ATS score estimate
- LinkedIn headline must be under 120 characters and keyword-rich
- LinkedIn bio should be written in first person, professional but personable
- LinkedIn suggested skills should include both technical and soft skills from the profile`;

  let enhancedSummary = profile.bio || '';
  let enhancedExperience = baseResume.experience;
  let reorderedSkills = baseResume.skills;
  let atsScore = 50;
  let linkedinHeadline = '';
  let linkedinBio = '';
  let linkedinSuggestedSkills: string[] = [];

  try {
    const resumeResponse = await aiChatWithFallback({ messages: [
      { role: 'system', content: 'You are Forge, the ATS Resume Optimizer. Generate polished resume content from raw profile data. Output valid JSON only. Never fabricate data.' },
      { role: 'user', content: resumePrompt },
    ] }, 'free');

    const parsed = JSON.parse(extractJSON(resumeResponse));

    if (typeof parsed.summary === 'string' && parsed.summary.length > 10) {
      enhancedSummary = parsed.summary;
    }

    if (Array.isArray(parsed.enhancedExperience)) {
      enhancedExperience = parsed.enhancedExperience.map((exp: any, i: number) => ({
        title: exp.title || baseResume.experience[i]?.title || '',
        company: exp.company || baseResume.experience[i]?.company || '',
        location: baseResume.experience[i]?.location || '',
        startDate: baseResume.experience[i]?.startDate || '',
        endDate: baseResume.experience[i]?.endDate || '',
        bullets: Array.isArray(exp.bullets) ? exp.bullets.filter((b: string) => typeof b === 'string') : baseResume.experience[i]?.bullets || [],
      }));
    }

    if (Array.isArray(parsed.reorderedSkills)) {
      const originalSkillsLower = new Set(baseResume.skills.map(s => s.toLowerCase()));
      const validReordered = parsed.reorderedSkills.filter(
        (s: string) => typeof s === 'string' && originalSkillsLower.has(s.toLowerCase())
      );
      if (validReordered.length >= baseResume.skills.length * 0.5) {
        const reorderedLower = new Set(validReordered.map((s: string) => s.toLowerCase()));
        const missing = baseResume.skills.filter(s => !reorderedLower.has(s.toLowerCase()));
        reorderedSkills = [...validReordered, ...missing];
      }
    }

    atsScore = Math.min(95, Math.max(20, Number(parsed.estimatedAtsScore) || 50));

    // Extract LinkedIn optimization content
    if (typeof parsed.linkedinHeadline === 'string' && parsed.linkedinHeadline.length > 5) {
      linkedinHeadline = parsed.linkedinHeadline.slice(0, 120);
    }
    if (typeof parsed.linkedinBio === 'string' && parsed.linkedinBio.length > 10) {
      linkedinBio = parsed.linkedinBio;
    }
    if (Array.isArray(parsed.linkedinSuggestedSkills)) {
      linkedinSuggestedSkills = parsed.linkedinSuggestedSkills
        .filter((s: string) => typeof s === 'string' && s.length > 0)
        .slice(0, 15);
    }
  } catch (err) {
    console.error('[Forge] Resume generation from profile failed:', err);
    // Fall back to raw profile data
  }

  const finalResume: ResumeContent = {
    ...baseResume,
    summary: enhancedSummary,
    experience: enhancedExperience,
    skills: reorderedSkills,
    ...(linkedinHeadline && { linkedinHeadline }),
    ...(linkedinBio && { linkedinBio }),
    ...(linkedinSuggestedSkills.length > 0 && { linkedinSuggestedSkills }),
  };

  // ── Step 3: Generate cover letter ──
  let coverLetter = '';
  try {
    const clPrompt = `Write a professional cover letter for this candidate applying to ${profile.targetRole} roles.

CANDIDATE:
Name: ${profile.fullName}
Summary: ${enhancedSummary}
Key Skills: ${reorderedSkills.slice(0, 8).join(', ')}
Experience: ${enhancedExperience.map(e => `${e.title} at ${e.company}`).join(', ')}
Education: ${profile.educationLevel} in ${profile.fieldOfStudy || 'N/A'} from ${profile.institution || 'N/A'}

Write a 3-4 paragraph cover letter that:
1. Opens with enthusiasm for the ${profile.targetRole} role
2. Highlights 2-3 key achievements from their experience
3. Connects their skills to the role requirements
4. Closes with a strong call-to-action

Return ONLY the cover letter text. No JSON, no markdown formatting.`;

    const clResponse = await aiChatWithFallback({ messages: [
      { role: 'system', content: 'You are Forge, writing a professional cover letter. Write naturally and compellingly. Return only the letter text, no JSON or markdown.' },
      { role: 'user', content: clPrompt },
    ] }, 'free');

    coverLetter = clResponse.trim();
  } catch (err) {
    console.error('[Forge] Cover letter generation failed:', err);
    coverLetter = `Dear Hiring Manager,\n\nI am writing to express my interest in ${profile.targetRole} positions. With experience as ${enhancedExperience[0]?.title || 'a professional'} and skills in ${reorderedSkills.slice(0, 3).join(', ')}, I believe I would be a strong fit.\n\nThank you for your consideration.\n\nBest regards,\n${profile.fullName}`;
  }

  // ── Log activity ──
  await prisma.agentActivity.create({
    data: {
      userId,
      agent: 'forge',
      action: 'generated_from_profile',
      summary: `Generated resume + cover letter from onboarding profile for "${profile.targetRole}" — ATS Score: ${atsScore}%`,
      details: { targetRole: profile.targetRole, experienceLevel: profile.experienceLevel, skillCount: reorderedSkills.length, atsScore },
    },
  });

  if (ctx) {
    logActivity(ctx, 'forge', 'generated_from_profile', `Generated resume + cover letter from profile for "${profile.targetRole}" (ATS: ${atsScore}%)`);
  }

  return { resume: finalResume, coverLetter, atsScore };
}
