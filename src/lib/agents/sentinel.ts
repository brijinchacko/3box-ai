/**
 * Sentinel Agent — Quality Reviewer
 * Reviews applications before submission for accuracy and quality
 */
import { prisma } from '@/lib/db/prisma';
import { aiChatWithFallback, extractJSON } from '@/lib/ai/openrouter';

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
    const response = await aiChatWithFallback({ messages: [
      { role: 'system', content: 'You are Sentinel, a Quality Review AI agent. Be strict but fair. Always respond in valid JSON.' },
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
