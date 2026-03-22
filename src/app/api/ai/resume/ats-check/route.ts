import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { aiChatWithFallback, getModelForFeature, extractJSON } from '@/lib/ai/openrouter';
import { getUserContextString } from '@/lib/ai/context';
import { checkFeatureGate } from '@/lib/tokens/featureGate';
import { prisma } from '@/lib/db/prisma';

/**
 * ATS Cross-Check API
 *
 * Analyzes a resume for ATS (Applicant Tracking System) compatibility.
 * Returns a score (0-100), letter grade, detailed category feedback, and suggestions.
 */

interface ATSFeedbackItem {
  category: string;
  status: 'pass' | 'warning' | 'fail';
  message: string;
}

interface ATSCheckResponse {
  score: number;
  grade: string;
  feedback: ATSFeedbackItem[];
  suggestions: string[];
}

export async function POST(req: Request) {
  try {
    // ── 1. Auth check ────────────────────────────
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // ── 2. Feature gate ──────────────────────────
    const gate = await checkFeatureGate(session.user.id);
    if (gate.locked) {
      return NextResponse.json(
        { error: gate.reason || 'Free plan limit reached. Please upgrade.', code: 'PLAN_LIMIT_REACHED' },
        { status: 403 },
      );
    }

    // ── 3. Get user plan ─────────────────────────
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { plan: true },
    });

    const userPlan = (user?.plan as any) || 'FREE';

    // ── 4. Parse body ────────────────────────────
    const body = await req.json();
    const { resumeData, targetRole } = body;

    if (!resumeData) {
      return NextResponse.json(
        { error: 'resumeData is required' },
        { status: 400 },
      );
    }

    // ── 5. Build user context ────────────────────
    const userContext = await getUserContextString(session.user.id);

    // ── 6. Build AI prompt ───────────────────────
    const model = getModelForFeature('ats-checker', userPlan);

    const systemPrompt = `You are an expert ATS (Applicant Tracking System) analyzer for resumes. Analyze the provided resume data for ATS compatibility and return a detailed assessment.

Evaluate the resume across these categories:
1. **Contact Information** — Is it complete? Name, email, phone, location, LinkedIn should all be present.
2. **Keyword Density** — Does the resume include relevant industry keywords? Are they naturally integrated?
3. **Formatting Compatibility** — ATS-friendly formatting: no tables, columns parsed correctly, standard section headings, no graphics/images.
4. **Section Headings** — Are standard section headings used? (Summary/Objective, Experience, Education, Skills, Certifications)
5. **Bullet Point Quality** — Do bullet points start with action verbs? Are they concise and impactful?
6. **Measurable Achievements** — Are there quantified results (numbers, percentages, metrics)?
7. **Skills Relevance** — Are listed skills relevant to the target role? Is there a good mix of hard and soft skills?
8. **Length Appropriateness** — Is the resume an appropriate length? (1-2 pages, not too sparse or too dense)

Return ONLY valid JSON with this exact structure:
{
  "score": <number 0-100>,
  "grade": "<A+|A|B+|B|C+|C|D|F>",
  "feedback": [
    {
      "category": "<category name>",
      "status": "<pass|warning|fail>",
      "message": "<specific feedback about this category>"
    }
  ],
  "suggestions": [
    "<actionable suggestion 1>",
    "<actionable suggestion 2>",
    "<actionable suggestion 3>",
    "<actionable suggestion 4>",
    "<actionable suggestion 5>"
  ]
}

Scoring guide:
- 90-100 (A+/A): Excellent ATS compatibility, minor tweaks only
- 80-89 (B+/B): Good but some improvements needed
- 70-79 (C+/C): Moderate issues that could hurt ATS parsing
- 60-69 (D): Significant issues, resume likely to be filtered out
- Below 60 (F): Major problems, resume will not pass most ATS systems

Be specific and actionable in your feedback. Reference actual content from the resume.
Return ONLY valid JSON. No markdown, no explanation outside the JSON.`;

    const resumeSummary = buildResumeSummary(resumeData);

    const userMessage = targetRole
      ? `Analyze this resume for ATS compatibility for the target role of "${targetRole}":\n\n${resumeSummary}`
      : `Analyze this resume for general ATS compatibility:\n\n${resumeSummary}`;

    // ── 7. Call AI ───────────────────────────────
    const raw = await aiChatWithFallback(
      {
        messages: [
          { role: 'system', content: userContext ? `${systemPrompt}\n\nUser context: ${userContext}` : systemPrompt },
          { role: 'user', content: userMessage },
        ],
        temperature: 0.3,
        maxTokens: 4096,
        jsonMode: model.supportsJsonMode,
      },
      model.tier,
    );

    // ── 8. Parse & validate response ─────────────
    const jsonStr = extractJSON(raw);
    let result: ATSCheckResponse;

    try {
      result = JSON.parse(jsonStr);
    } catch {
      console.error('[ATS Check] Failed to parse AI response:', raw.slice(0, 500));
      return NextResponse.json(
        { error: 'Failed to parse ATS analysis. Please try again.' },
        { status: 500 },
      );
    }

    // Validate and sanitize the response
    result.score = Math.max(0, Math.min(100, Math.round(result.score || 0)));
    result.grade = result.grade || scoreToGrade(result.score);
    result.feedback = Array.isArray(result.feedback) ? result.feedback : [];
    result.suggestions = Array.isArray(result.suggestions) ? result.suggestions : [];

    return NextResponse.json(result);
  } catch (error) {
    console.error('[ATS Check API]', error);
    return NextResponse.json(
      { error: 'Failed to analyze resume for ATS compatibility' },
      { status: 500 },
    );
  }
}

// ── Helpers ────────────────────────────────────────

function scoreToGrade(score: number): string {
  if (score >= 95) return 'A+';
  if (score >= 90) return 'A';
  if (score >= 85) return 'B+';
  if (score >= 80) return 'B';
  if (score >= 75) return 'C+';
  if (score >= 70) return 'C';
  if (score >= 60) return 'D';
  return 'F';
}

function buildResumeSummary(data: any): string {
  const parts: string[] = [];

  // Contact info
  const contact = data.contact || {};
  const contactFields = ['name', 'email', 'phone', 'location', 'linkedin', 'portfolio'];
  const presentFields = contactFields.filter((f) => contact[f]?.trim());
  const missingFields = contactFields.filter((f) => !contact[f]?.trim());
  parts.push(`CONTACT INFO (${presentFields.length}/${contactFields.length} fields filled):`);
  parts.push(`  Present: ${presentFields.join(', ') || 'None'}`);
  parts.push(`  Missing: ${missingFields.join(', ') || 'None'}`);

  // Summary
  if (data.summary?.trim()) {
    parts.push(`\nPROFESSIONAL SUMMARY:\n  "${data.summary.trim()}"`);
  } else {
    parts.push('\nPROFESSIONAL SUMMARY: [MISSING]');
  }

  // Experience
  const experience = Array.isArray(data.experience) ? data.experience : [];
  parts.push(`\nEXPERIENCE (${experience.length} entries):`);
  for (const exp of experience) {
    parts.push(`  - ${exp.role || 'Untitled Role'} at ${exp.company || 'Unknown Company'} (${exp.startDate || '?'} - ${exp.current ? 'Present' : exp.endDate || '?'})`);
    if (Array.isArray(exp.bullets)) {
      for (const b of exp.bullets) {
        parts.push(`    * ${b}`);
      }
    }
  }

  // Education
  const education = Array.isArray(data.education) ? data.education : [];
  parts.push(`\nEDUCATION (${education.length} entries):`);
  for (const edu of education) {
    parts.push(`  - ${edu.degree || '?'} in ${edu.field || '?'} from ${edu.institution || '?'} (${edu.startDate || '?'} - ${edu.endDate || '?'})${edu.gpa ? ` GPA: ${edu.gpa}` : ''}`);
  }

  // Skills
  const skills = Array.isArray(data.skills) ? data.skills : [];
  parts.push(`\nSKILLS (${skills.length} listed):`);
  parts.push(`  ${skills.join(', ') || '[NONE]'}`);

  // Certifications
  const certs = Array.isArray(data.certifications) ? data.certifications : [];
  parts.push(`\nCERTIFICATIONS (${certs.length} listed):`);
  for (const c of certs) {
    parts.push(`  - ${c.name || '?'} by ${c.issuer || '?'} (${c.date || '?'})${c.verified ? ' [Verified]' : ''}`);
  }

  // Word count estimate
  const allText = JSON.stringify(data);
  const wordCount = allText.split(/\s+/).length;
  parts.push(`\nESTIMATED WORD COUNT: ~${wordCount}`);

  return parts.join('\n');
}
