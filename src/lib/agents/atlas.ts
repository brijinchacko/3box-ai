/**
 * Atlas Agent — Interview Coach
 * Generates company-specific interview questions and practice scenarios
 */
import { prisma } from '@/lib/db/prisma';
import { aiChatWithFallback, extractJSON } from '@/lib/ai/openrouter';
import { type AgentContext, getContextSummary, getAgentHandoff, logActivity } from './context';

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
  ctx?: AgentContext,
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
    const contextBlock = ctx ? `\n\nTEAM CONTEXT:\n${getContextSummary(ctx)}` : '';
    const handoffBlock = ctx ? `\n\nHANDOFF DATA:\n${getAgentHandoff(ctx, 'scout', 'atlas')}` : '';

    const response = await aiChatWithFallback({ messages: [
      { role: 'system', content: `You are Atlas, the Interview Coach in jobTED's AI agent team.
${contextBlock}
${handoffBlock}

YOUR ROLE: Generate company-specific interview questions and preparation materials tailored to the candidate's profile and target role.

THINK STEP BY STEP:
1. Analyze the job description for required competencies and technical skills
2. Research common interview patterns for this type of company and role
3. Map the candidate's skills to likely interview focus areas
4. Generate questions that reflect real interview scenarios for this specific role
5. Provide tips based on the company's known culture and interview style

IMPORTANT:
- Never fabricate company names, job details, or qualifications
- Only use facts from the user's verified profile
- Include confidence score (0-100) for each decision
- Explain reasoning transparently for audit trail
- Base company insights on the job description, not assumptions
- Generate questions that test skills actually relevant to the role
- Tailor behavioral questions to the candidate's experience level

OUTPUT FORMAT: Valid JSON with a "reasoning" field explaining your decisions.` },
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

    // Log to shared agent context
    if (ctx) {
      const totalQ = result.technicalQuestions.length + result.behavioralQuestions.length + result.roleSpecificQuestions.length;
      logActivity(ctx, 'atlas', 'generated_questions', `Prepared interview guide for "${jobTitle}" at ${company} — ${totalQ} questions (${result.technicalQuestions.length} technical, ${result.behavioralQuestions.length} behavioral, ${result.roleSpecificQuestions.length} role-specific)`);
    }

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
