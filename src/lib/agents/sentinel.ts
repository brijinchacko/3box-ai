/**
 * Sentinel Agent — Quality Reviewer
 * Reviews applications before submission for accuracy and quality
 */
import { prisma } from '@/lib/db/prisma';
import { aiChatWithFallback, extractJSON } from '@/lib/ai/openrouter';
import { type AgentContext, getContextSummary, getAgentHandoff, logActivity, type JobAlignmentResult } from './context';
import { detectScamSignals, type ScamSignals } from '@/lib/jobs/scamDetector';

interface QualityReview {
  approved: boolean;
  qualityScore: number; // 0-100
  issues: { severity: 'critical' | 'warning' | 'suggestion'; message: string }[];
  coverLetterFeedback: string;
  overallAssessment: string;
}

/**
 * Review an application before it's sent
 */
export async function reviewApplication(
  userId: string,
  application: {
    jobTitle: string;
    company: string;
    jobDescription: string;
    coverLetter: string;
    resumeSummary: string;
    candidateSkills: string[];
  },
  ctx?: AgentContext,
): Promise<QualityReview> {
  const prompt = `You are Sentinel, a Quality Review AI agent. Your job is to ensure job applications are high quality, accurate, and professional before they are sent.

Review this application:

JOB: ${application.jobTitle} at ${application.company}
JOB DESCRIPTION: ${application.jobDescription.slice(0, 1000)}

COVER LETTER:
${application.coverLetter}

CANDIDATE SUMMARY: ${application.resumeSummary}
CANDIDATE SKILLS: ${application.candidateSkills.join(', ')}

Check for:
1. Fabricated claims (skills/experience not in resume mentioned in cover letter)
2. Generic/template language without personalization
3. Mismatch between candidate profile and job requirements
4. Professional tone and grammar
5. Relevance to the specific job and company
6. Spam-like or mass-application signals

Respond in JSON:
{
  "approved": <true if quality is acceptable, false if critical issues found>,
  "qualityScore": <number 0-100>,
  "issues": [{"severity": "critical|warning|suggestion", "message": "<description of issue>"}],
  "coverLetterFeedback": "<brief feedback on the cover letter quality>",
  "overallAssessment": "<1-2 sentence overall assessment>"
}`;

  try {
    // ── Pre-flight scam check (zero AI cost) ──
    const scamCheck = detectScamSignals({
      title: application.jobTitle,
      company: application.company,
      description: application.jobDescription,
      salary: null,
    });

    if (scamCheck.verdict === 'likely_scam') {
      const result: QualityReview = {
        approved: false,
        qualityScore: 0,
        issues: [
          { severity: 'critical', message: `Job flagged as likely scam (score: ${scamCheck.score}/100)` },
          ...scamCheck.signals.slice(0, 3).map(s => ({ severity: 'critical' as const, message: s })),
        ],
        coverLetterFeedback: 'Application blocked — this job listing has multiple scam indicators.',
        overallAssessment: `Auto-rejected: ${scamCheck.signals.length} scam signals detected. Do not apply.`,
      };

      await prisma.agentActivity.create({
        data: {
          userId,
          agent: 'sentinel',
          action: 'blocked_scam',
          summary: `Blocked scam job "${application.jobTitle}" at ${application.company} — ${scamCheck.signals.length} signals`,
          details: { company: application.company, jobTitle: application.jobTitle, scamScore: scamCheck.score, signals: scamCheck.signals },
        },
      });

      if (ctx) {
        logActivity(ctx, 'sentinel', 'blocked_scam', `Blocked scam: "${application.jobTitle}" at ${application.company} — ${scamCheck.signals.join(', ')}`);
      }

      return result;
    }

    const contextBlock = ctx ? `\n\nTEAM CONTEXT:\n${getContextSummary(ctx)}` : '';
    const handoffBlock = ctx ? `\n\nHANDOFF DATA:\n${getAgentHandoff(ctx, 'forge', 'sentinel')}` : '';
    const scamWarning = scamCheck.verdict === 'suspicious'
      ? `\n\nSCAM WARNING: This job has ${scamCheck.signals.length} suspicious signals: ${scamCheck.signals.join('; ')}. Factor this into your review.`
      : '';

    const response = await aiChatWithFallback({ messages: [
      { role: 'system', content: `You are Sentinel, the Quality Reviewer in 3BOX's AI agent team.
${contextBlock}
${handoffBlock}
${scamWarning}

YOUR ROLE: Review job applications before submission to ensure accuracy, quality, and professionalism. You are the last line of defense before an application reaches an employer.

THINK STEP BY STEP:
1. Compare the cover letter claims against the candidate's actual resume and skills
2. Check for fabricated or exaggerated qualifications
3. Evaluate personalization — is this clearly written for this specific job and company?
4. Assess professional tone, grammar, and formatting
5. Flag any spam-like or mass-application signals
6. Make an approve/reject decision and explain your reasoning

IMPORTANT:
- Never fabricate company names, job details, or qualifications
- Only use facts from the user's verified profile
- Include confidence score (0-100) for each decision
- Explain reasoning transparently for audit trail
- Be strict on fabrication but fair on presentation quality
- Reject applications that claim skills the candidate does not possess

OUTPUT FORMAT: Valid JSON with a "reasoning" field explaining your decisions.` },
      { role: 'user', content: prompt },
    ] }, 'free');

    const review = JSON.parse(extractJSON(response)) as QualityReview;

    const result: QualityReview = {
      approved: typeof review.approved === 'boolean' ? review.approved : true,
      qualityScore: Math.min(100, Math.max(0, Number(review.qualityScore) || 70)),
      issues: Array.isArray(review.issues) ? review.issues.slice(0, 5) : [],
      coverLetterFeedback: typeof review.coverLetterFeedback === 'string' ? review.coverLetterFeedback : 'No feedback available.',
      overallAssessment: typeof review.overallAssessment === 'string' ? review.overallAssessment : 'Review completed.',
    };

    await prisma.agentActivity.create({
      data: {
        userId,
        agent: 'sentinel',
        action: result.approved ? 'approved_application' : 'rejected_application',
        summary: `${result.approved ? 'Approved' : 'Rejected'} application for "${application.jobTitle}" at ${application.company} — Quality: ${result.qualityScore}%`,
        details: {
          company: application.company,
          jobTitle: application.jobTitle,
          qualityScore: result.qualityScore,
          approved: result.approved,
          issueCount: result.issues.length,
        },
      },
    });

    // Log to shared agent context
    if (ctx) {
      logActivity(ctx, 'sentinel', result.approved ? 'approved_application' : 'rejected_application', `${result.approved ? 'Approved' : 'Rejected'} "${application.jobTitle}" at ${application.company} — Quality: ${result.qualityScore}%, ${result.issues.length} issues found`);
    }

    return result;
  } catch (err) {
    console.error('[Sentinel] Review failed:', err);
    // Default to approved on error (don't block applications if Sentinel fails)
    return {
      approved: true,
      qualityScore: 70,
      issues: [{ severity: 'warning', message: 'Quality review was unable to complete fully. Proceeding with caution.' }],
      coverLetterFeedback: 'Review incomplete.',
      overallAssessment: 'Auto-approved due to review system error.',
    };
  }
}

// ─── JD-Resume Alignment Verification ──────────────────────────────────────

/**
 * Verify alignment between job descriptions and resume.
 * Processes jobs in batches of 3 per AI call.
 * Returns per-job alignment score + matched/missing skills.
 *
 * Jobs scoring below the threshold are marked as not approved.
 */
export async function verifyJobAlignment(
  userId: string,
  jobs: { title: string; company: string; description: string }[],
  resume: {
    summary: string;
    skills: string[];
    experience: { title: string; company: string; bullets: string[] }[];
  },
  alignmentThreshold: number = 40,
  ctx?: AgentContext,
): Promise<JobAlignmentResult[]> {
  const results: JobAlignmentResult[] = [];

  // Process in batches of 3 to reduce AI calls
  const BATCH_SIZE = 3;
  for (let i = 0; i < jobs.length; i += BATCH_SIZE) {
    const batch = jobs.slice(i, i + BATCH_SIZE);

    const jobBlock = batch.map((j, idx) =>
      `JOB ${idx + 1}:\nTitle: ${j.title}\nCompany: ${j.company}\nDescription: ${j.description.slice(0, 800)}`
    ).join('\n\n');

    try {
      const contextBlock = ctx ? `\nTEAM CONTEXT:\n${getContextSummary(ctx)}` : '';

      const response = await aiChatWithFallback({ messages: [
        { role: 'system', content: `You are Sentinel, the Quality Reviewer. Compare each job's requirements against the candidate's resume to determine alignment.${contextBlock}

IMPORTANT: Be honest about skill gaps. Do not inflate alignment scores.
OUTPUT FORMAT: Valid JSON array.` },
        { role: 'user', content: `CANDIDATE RESUME:
Summary: ${resume.summary || 'Not provided'}
Skills: ${(resume.skills || []).join(', ') || 'None listed'}
Experience: ${(resume.experience || []).map(e => `${e.title} at ${e.company}: ${(e.bullets || []).slice(0, 3).join('; ')}`).join('\n') || 'No experience listed'}

${jobBlock}

For EACH job, respond with a JSON array:
[{
  "jobIndex": <0-based index>,
  "alignmentScore": <0-100, how well resume matches this job's requirements>,
  "matchedSkills": [<skills from resume that match job requirements>],
  "missingSkills": [<required skills from JD not found in resume>],
  "experienceMatch": "strong|partial|weak",
  "reason": "<1 sentence explaining the alignment assessment>"
}]` },
      ] }, 'free');

      const parsed = JSON.parse(extractJSON(response));
      const alignments = Array.isArray(parsed) ? parsed : [];

      for (const alignment of alignments) {
        const jobIdx = Number(alignment.jobIndex);
        const job = batch[jobIdx];
        if (!job) continue;

        const score = Math.min(100, Math.max(0, Number(alignment.alignmentScore) || 0));
        results.push({
          jobTitle: job.title,
          company: job.company,
          alignmentScore: score,
          matchedSkills: Array.isArray(alignment.matchedSkills) ? alignment.matchedSkills.slice(0, 10) : [],
          missingSkills: Array.isArray(alignment.missingSkills) ? alignment.missingSkills.slice(0, 10) : [],
          experienceMatch: ['strong', 'partial', 'weak'].includes(alignment.experienceMatch) ? alignment.experienceMatch : 'partial',
          approved: score >= alignmentThreshold,
          reason: typeof alignment.reason === 'string' ? alignment.reason : 'Alignment check completed.',
        });
      }

      // Handle jobs that AI didn't return results for
      for (let j = 0; j < batch.length; j++) {
        const hasResult = results.some(r => r.jobTitle === batch[j].title && r.company === batch[j].company);
        if (!hasResult) {
          results.push({
            jobTitle: batch[j].title,
            company: batch[j].company,
            alignmentScore: 50,
            matchedSkills: [],
            missingSkills: [],
            experienceMatch: 'partial',
            approved: true,
            reason: 'Alignment check incomplete — approved by default.',
          });
        }
      }
    } catch (err) {
      console.error('[Sentinel] Job alignment batch failed:', err);
      // On failure, default-approve this batch
      for (const job of batch) {
        results.push({
          jobTitle: job.title,
          company: job.company,
          alignmentScore: 50,
          matchedSkills: [],
          missingSkills: [],
          experienceMatch: 'partial',
          approved: true,
          reason: 'Alignment check failed — approved by default.',
        });
      }
    }
  }

  // Log to AgentActivity DB
  const approvedCount = results.filter(r => r.approved).length;
  const avgAlignment = results.length > 0
    ? Math.round(results.reduce((s, r) => s + r.alignmentScore, 0) / results.length)
    : 0;

  await prisma.agentActivity.create({
    data: {
      userId,
      agent: 'sentinel',
      action: 'verified_job_alignment',
      summary: `Checked alignment for ${results.length} jobs: ${approvedCount} approved, ${results.length - approvedCount} rejected (threshold: ${alignmentThreshold}%)`,
      details: {
        totalChecked: results.length,
        approved: approvedCount,
        rejected: results.length - approvedCount,
        threshold: alignmentThreshold,
        avgAlignment,
      },
    },
  });

  if (ctx) {
    logActivity(ctx, 'sentinel', 'verified_job_alignment',
      `Alignment check: ${approvedCount}/${results.length} jobs approved (avg: ${avgAlignment}%)`);
  }

  return results;
}
