import { NextResponse, NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db/prisma';
import { aiChatWithFallback } from '@/lib/ai/openrouter';

/**
 * POST /api/ai/match-analysis — Analyze match score breakdown and suggest resume improvements
 *
 * Takes a job (title, company, description) and returns:
 * - Detailed score breakdown (title, skills, location, bonus)
 * - Missing skills/keywords
 * - Specific resume improvement suggestions
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await request.json();
    const { jobTitle, company, description, location, matchScore, salary, remote } = body;

    if (!jobTitle) {
      return NextResponse.json({ error: 'jobTitle is required' }, { status: 400 });
    }

    // Fetch user's profile and resume
    const [careerTwin, resume] = await Promise.all([
      prisma.careerTwin.findUnique({
        where: { userId },
        select: { targetRoles: true, skillSnapshot: true },
      }),
      prisma.resume.findFirst({
        where: { userId },
        orderBy: { updatedAt: 'desc' },
        select: { content: true, isFinalized: true },
      }),
    ]);

    // Extract user skills and target role
    const skills: string[] = [];
    if (careerTwin?.skillSnapshot) {
      const ss = careerTwin.skillSnapshot as any;
      if (Array.isArray(ss)) {
        skills.push(...ss.map((s: any) => typeof s === 'string' ? s : s.skill || s.name || '').filter(Boolean));
      } else if (typeof ss === 'object') {
        skills.push(...Object.keys(ss));
      }
    }

    let targetRole = '';
    if (careerTwin?.targetRoles) {
      const tr = careerTwin.targetRoles as any;
      if (Array.isArray(tr) && tr.length > 0) {
        targetRole = typeof tr[0] === 'string' ? tr[0] : tr[0]?.title || '';
      } else if (typeof tr === 'string') {
        targetRole = tr;
      }
    }

    // Extract resume skills for comparison
    const resumeContent = resume?.content as any;
    const resumeSkills: string[] = resumeContent?.skills || [];
    const resumeSummary: string = resumeContent?.summary || '';
    const resumeExperience: any[] = resumeContent?.experience || [];

    // Compute detailed score breakdown
    const jobText = `${jobTitle} ${description || ''}`.toLowerCase();
    const titleLower = jobTitle.toLowerCase();
    const targetLower = targetRole.toLowerCase();

    // Title match analysis
    const roleWords = targetLower.split(/\s+/).filter((w: string) => w.length > 2);
    const titleMatchedWords = roleWords.filter((w: string) => titleLower.includes(w));
    const titleScore = titleLower.includes(targetLower)
      ? 40
      : Math.min(35, (titleMatchedWords.length / Math.max(roleWords.length, 1)) * 35);

    // Skills analysis
    const allUserSkills = [...new Set([...skills, ...resumeSkills].map(s => s.toLowerCase()))];
    const matchedSkills = allUserSkills.filter(s => jobText.includes(s));
    const missingFromJob: string[] = allUserSkills.filter(s => !jobText.includes(s));

    // Extract keywords from job description that user doesn't have
    const commonTechKeywords = [
      'react', 'angular', 'vue', 'node', 'python', 'java', 'typescript', 'javascript',
      'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'sql', 'nosql', 'mongodb', 'postgresql',
      'graphql', 'rest', 'api', 'ci/cd', 'git', 'agile', 'scrum', 'jira',
      'machine learning', 'deep learning', 'tensorflow', 'pytorch', 'nlp',
      'figma', 'sketch', 'adobe', 'photoshop', 'illustrator',
      'html', 'css', 'sass', 'tailwind', 'bootstrap', 'redux', 'next.js', 'express',
      'spring', 'django', 'flask', 'ruby', 'rails', 'go', 'golang', 'rust', 'swift',
      'kotlin', 'flutter', 'react native', 'ios', 'android',
      'elasticsearch', 'redis', 'kafka', 'rabbitmq', 'microservices',
      'linux', 'terraform', 'ansible', 'jenkins', 'github actions',
      'power bi', 'tableau', 'excel', 'data analysis', 'statistics',
      'leadership', 'management', 'communication', 'problem solving',
    ];
    const jobKeywords = commonTechKeywords.filter(kw => jobText.includes(kw));
    const missingKeywords = jobKeywords.filter(kw => !allUserSkills.some(s => s.includes(kw) || kw.includes(s)));

    const skillScore = allUserSkills.length > 0
      ? Math.min(30, (matchedSkills.length / Math.max(allUserSkills.length, 1)) * 30)
      : 10;

    // Location analysis
    let locationScore = 5;
    let locationNote = 'No location preference set';
    if (remote) {
      locationScore = 18;
      locationNote = 'Remote job — matches most profiles';
    } else if (location) {
      locationNote = `Job is in ${location}`;
      // Simple check
      const userLoc = (careerTwin as any)?.location || '';
      if (userLoc && location.toLowerCase().includes(userLoc.toLowerCase())) {
        locationScore = 20;
        locationNote += ' — matches your location';
      }
    }

    // Build AI suggestions
    let aiSuggestions: string[] = [];
    try {
      const prompt = `Analyze this job posting and the candidate's resume. Give exactly 5 specific, actionable suggestions to improve the resume for this specific job. Each suggestion should be 1-2 sentences.

JOB:
Title: ${jobTitle}
Company: ${company || 'Unknown'}
Description: ${(description || '').slice(0, 1500)}

CANDIDATE'S RESUME SKILLS: ${[...resumeSkills, ...skills].join(', ') || 'None listed'}
CANDIDATE'S TARGET ROLE: ${targetRole || jobTitle}
CANDIDATE'S EXPERIENCE: ${resumeExperience.map((e: any) => `${e.role || e.title} at ${e.company}`).join(', ') || 'Not available'}
CANDIDATE'S SUMMARY: ${resumeSummary.slice(0, 300) || 'Not available'}

MISSING KEYWORDS FROM JOB: ${missingKeywords.join(', ') || 'None'}
MATCHED SKILLS: ${matchedSkills.join(', ') || 'None'}
MATCH SCORE: ${matchScore || 0}/100

Return ONLY a JSON array of 5 strings. No other text.
Example: ["Add Python and AWS to your skills section", "Quantify your achievements with metrics"]`;

      const response = await aiChatWithFallback({
        messages: [
          { role: 'system', content: 'You are a resume optimization expert. Return ONLY valid JSON arrays.' },
          { role: 'user', content: prompt },
        ],
      }, 'free');

      // Parse JSON from response
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        aiSuggestions = JSON.parse(jsonMatch[0]);
      }
    } catch {
      // Fallback suggestions based on analysis
      aiSuggestions = [];
      if (missingKeywords.length > 0) {
        aiSuggestions.push(`Add these missing skills to your resume: ${missingKeywords.slice(0, 5).join(', ')}`);
      }
      if (titleScore < 30) {
        aiSuggestions.push(`Align your resume title/summary with "${jobTitle}" to improve title matching`);
      }
      if (matchedSkills.length < 3) {
        aiSuggestions.push('Add more relevant technical skills that appear in the job description');
      }
      aiSuggestions.push('Quantify your achievements with numbers and metrics (e.g., "increased performance by 40%")');
      aiSuggestions.push('Tailor your professional summary to mention the specific role and company');
    }

    return NextResponse.json({
      matchScore: matchScore || 0,
      breakdown: {
        title: { score: Math.round(titleScore), max: 40, matchedWords: titleMatchedWords, targetRole },
        skills: { score: Math.round(skillScore), max: 30, matched: matchedSkills, total: allUserSkills.length },
        location: { score: Math.round(locationScore), max: 20, note: locationNote },
        bonus: { score: Math.min(10, (salary ? 5 : 0) + (remote ? 3 : 0) + 2), max: 10 },
      },
      missingKeywords,
      matchedSkills,
      suggestions: aiSuggestions,
      hasResume: !!resume,
      isFinalized: resume?.isFinalized || false,
      job: { title: jobTitle, company, location },
    });
  } catch (error) {
    console.error('[Match Analysis]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
