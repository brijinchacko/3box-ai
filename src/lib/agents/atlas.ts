/**
 * Atlas Agent — Interview Coach
 * Generates company-specific interview questions and practice scenarios
 */
import { prisma } from '@/lib/db/prisma';
import { aiChatWithFallback, extractJSON } from '@/lib/ai/openrouter';

interface InterviewPrep {
  companyInsights: string;
  technicalQuestions: string[];
  behavioralQuestions: string[];
  roleSpecificQuestions: string[];
  tipsForCompany: string[];
}

/**
 * Generate interview preparation for a specific job application
 */
export async function prepareInterview(
  userId: string,
  jobTitle: string,
  company: string,
  jobDescription: string,
  candidateSkills: string[],
): Promise<InterviewPrep> {
  const prompt = `You are Atlas, an expert Interview Coach AI. Prepare comprehensive interview preparation materials for this candidate.

JOB: ${jobTitle} at ${company}
JOB DESCRIPTION: ${jobDescription.slice(0, 1500)}
CANDIDATE SKILLS: ${candidateSkills.join(', ')}

Generate a JSON response with:
{
  "companyInsights": "<brief 2-3 sentence overview of the company and what they likely look for in candidates>",
  "technicalQuestions": ["<5 technical interview questions specific to this role and company>"],
  "behavioralQuestions": ["<5 behavioral/STAR method questions likely for this company>"],
  "roleSpecificQuestions": ["<3 questions specific to the job description requirements>"],
  "tipsForCompany": ["<4 specific tips for succeeding in an interview at this company>"]
}`;

  try {
    const response = await aiChatWithFallback({ messages: [
      { role: 'system', content: 'You are Atlas, an Interview Coach AI agent. Always respond in valid JSON.' },
      { role: 'user', content: prompt },
    ] }, 'free');

    const prep = JSON.parse(extractJSON(response)) as InterviewPrep;

    const result: InterviewPrep = {
      companyInsights: typeof prep.companyInsights === 'string' ? prep.companyInsights : `${company} is a notable employer in the industry.`,
      technicalQuestions: Array.isArray(prep.technicalQuestions) ? prep.technicalQuestions.slice(0, 5) : [],
      behavioralQuestions: Array.isArray(prep.behavioralQuestions) ? prep.behavioralQuestions.slice(0, 5) : [],
      roleSpecificQuestions: Array.isArray(prep.roleSpecificQuestions) ? prep.roleSpecificQuestions.slice(0, 3) : [],
      tipsForCompany: Array.isArray(prep.tipsForCompany) ? prep.tipsForCompany.slice(0, 4) : [],
    };

    await prisma.agentActivity.create({
      data: {
        userId,
        agent: 'atlas',
        action: 'generated_questions',
        summary: `Prepared interview guide for "${jobTitle}" at ${company} — ${result.technicalQuestions.length + result.behavioralQuestions.length + result.roleSpecificQuestions.length} questions`,
        details: { company, jobTitle, questionCount: result.technicalQuestions.length + result.behavioralQuestions.length + result.roleSpecificQuestions.length },
      },
    });

    return result;
  } catch (err) {
    console.error('[Atlas] Interview prep failed:', err);
    return {
      companyInsights: `Research ${company} before your interview.`,
      technicalQuestions: ['Tell me about a challenging technical problem you solved recently.'],
      behavioralQuestions: ['Describe a time you worked effectively in a team.'],
      roleSpecificQuestions: [`Why are you interested in the ${jobTitle} role?`],
      tipsForCompany: ['Research the company thoroughly before the interview.'],
    };
  }
}
