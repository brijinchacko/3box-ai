/**
 * Sentinel Agent — Quality Reviewer
 * Reviews applications before submission for accuracy and quality
 */
import { prisma } from '@/lib/db/prisma';
import { aiChatWithFallback, extractJSON } from '@/lib/ai/openrouter';
import { type AgentContext, getContextSummary, getAgentHandoff, logActivity } from './context';
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
      { role: 'system', content: `You are Sentinel, the Quality Reviewer in jobTED's AI agent team.
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
