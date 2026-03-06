/**
 * Forge Agent — Resume Optimizer
 * Analyzes and optimizes resumes for specific jobs
 */
import { prisma } from '@/lib/db/prisma';
import { aiChatWithFallback, extractJSON } from '@/lib/ai/openrouter';

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
    const response = await aiChatWithFallback({ messages: [
      { role: 'system', content: 'You are Forge, an ATS Resume Optimization agent. Always respond in valid JSON.' },
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
