import { NextResponse, NextRequest } from 'next/server';
import { aiChatWithFallback, AI_MODELS } from '@/lib/ai/openrouter';
import { checkFreeUsage, buildUsageCookie } from '@/lib/usage/serverUsageCheck';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { checkRateLimit, getClientIP } from '@/lib/rateLimit';

export async function POST(request: NextRequest) {
  try {
    // ── IP rate limiting ─────────────────────
    const ip = getClientIP(request);
    const rateLimit = checkRateLimit(ip, 'ats-checker');
    if (!rateLimit.allowed) {
      const retryAfter = Math.ceil((rateLimit.resetAt.getTime() - Date.now()) / 1000);
      return NextResponse.json(
        { error: 'Rate limit exceeded. Sign up for free unlimited access!', retryAfter },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { resumeText, targetJob, clientCount } = body;

    if (!resumeText || typeof resumeText !== 'string') {
      return NextResponse.json({ error: 'Resume text is required' }, { status: 400 });
    }

    // ── Usage limit tracking ─────────────────────
    const cookieHeader = request.headers.get('cookie') || '';
    const cookieMatch = cookieHeader.match(/3box-ats-uses=(\d+)/);
    const cookieValue = cookieMatch ? cookieMatch[1] : undefined;
    const { allowed, realCount } = checkFreeUsage(cookieValue, clientCount ?? 0);

    if (!allowed) {
      // Check if user has a paid session
      let isPaidUser = false;
      try {
        const session = await getServerSession(authOptions);
        if (session?.user?.id) {
          const { prisma } = await import('@/lib/db/prisma');
          const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { plan: true },
          });
          const plan = (user?.plan ?? 'FREE').toUpperCase();
          if (plan !== 'FREE') {
            isPaidUser = true;
          }
        }
      } catch {
        // Session check is optional
      }

      if (!isPaidUser) {
        return NextResponse.json(
          { error: 'limit_reached', message: 'You have used your free ATS check. Sign up or subscribe to continue.' },
          { status: 403 },
        );
      }
    }

    // First do a rule-based analysis for instant accuracy
    const ruleBasedResults = performRuleBasedAnalysis(resumeText, targetJob);

    // Then enhance with AI analysis
    const systemPrompt = `You are a senior ATS (Applicant Tracking System) expert and technical recruiter with 15+ years of experience parsing, optimizing, and evaluating resumes across enterprise ATS platforms including Workday, Taleo, iCIMS, Greenhouse, and Lever.

Analyze this resume THOROUGHLY against modern ATS parsing algorithms and return ONLY valid JSON (no markdown, no code blocks) with this exact structure:
{
  "score": <number 0-100>,
  "issues": [
    { "type": "critical"|"warning"|"tip", "message": "<specific actionable feedback>" }
  ],
  "keywords": {
    "found": ["<industry keywords found in resume>"],
    "missing": ["<important keywords NOT in resume but expected for the role>"],
    "suggested": ["<power words and metrics to add>"]
  },
  "formatting": {
    "score": <number 0-100>,
    "issues": ["<specific formatting problems>"]
  },
  "sections": {
    "present": ["<sections found>"],
    "missing": ["<essential sections not found>"]
  },
  "atsParseability": {
    "canParse": <boolean>,
    "risks": ["<things that might cause ATS parsing failures>"]
  },
  "improvementPlan": [
    "<top 5 specific, actionable steps to improve this resume>"
  ]
}

DETAILED SCORING RUBRIC (out of 100):

Contact & Header (15 points):
- Full name clearly identifiable: +3
- Professional email address: +3
- Phone number present: +2
- Location (city/state): +2
- LinkedIn URL: +3
- No photos, logos, or graphics in header: +2

Professional Summary (10 points):
- Has summary/objective section: +3
- Summary is 2-4 sentences: +2
- Contains role-relevant keywords: +3
- Quantified achievements in summary: +2

Work Experience (25 points):
- Has clearly labeled experience section: +4
- Uses reverse chronological order: +3
- Each entry has: company, title, dates, location: +4
- Bullet points start with action verbs (Led, Built, Improved, Delivered, Optimized): +4
- Contains quantified achievements with metrics (%,$,#): +5
- Date format is consistent (MM/YYYY or Month YYYY): +3
- No unexplained employment gaps: +2

Skills Section (15 points):
- Has dedicated skills section: +3
- Skills match target job requirements: +5
- Keyword density analysis: relevant terms appear 2-3 times naturally: +4
- Mix of technical and soft skills: +3

Education (10 points):
- Has education section: +3
- Includes degree, institution, graduation date: +4
- GPA included if > 3.0 or recent graduate: +3

ATS Compatibility (15 points):
- No tables, columns, or text boxes: +3
- No headers/footers (ATS often skips these): +2
- Standard section headings used: +3
- No special characters or unicode symbols: +2
- File would parse cleanly in Workday/Taleo: +3
- No embedded images or charts: +2

Resume Section Ordering (10 points):
- Optimal order: Contact > Summary > Experience > Skills > Education > Certifications: +5
- Most impactful sections appear first: +3
- Consistent section spacing: +2

KEYWORD DENSITY ANALYSIS:
- Check if key terms from the target role appear at least 2-3 times naturally throughout the resume
- Flag keyword stuffing (same term > 5 times)
- Identify missing industry-standard terminology
- Check for both spelled-out terms and acronyms (e.g., "Search Engine Optimization" AND "SEO")

DATE FORMAT CONSISTENCY:
- All dates should follow the same format throughout
- Flag mixed formats (e.g., "Jan 2020" alongside "2020-01")
- Prefer "Month YYYY" or "MM/YYYY" for ATS compatibility

Be STRICT and SPECIFIC. Do NOT give inflated scores. A resume with no metrics and generic bullets should score below 50. A perfect resume rarely scores above 90.`;

    let userPrompt = `RESUME TEXT:\n\n${resumeText}`;
    if (targetJob) {
      userPrompt += `\n\n---\nTARGET JOB/ROLE: ${targetJob}\n\nAnalyze keyword match against this target role. Be specific about which keywords are missing for this exact role. Check keyword density and suggest optimal placement.`;
    }

    try {
      const aiResponse = await aiChatWithFallback(
        {
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          temperature: 0.3,
          maxTokens: 3000,
        },
        'premium'
      );

      // Try to parse AI response
      let analysis;
      try {
        // Remove markdown code blocks if present
        const cleaned = aiResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        analysis = JSON.parse(cleaned);
      } catch {
        // Try to extract JSON from response
        const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          analysis = JSON.parse(jsonMatch[0]);
        } else {
          // Fallback to rule-based analysis
          const fallbackResponse = NextResponse.json({
            ...ruleBasedResults,
            cta: `Your ATS score is ${ruleBasedResults.score}/100. Sign up free to get AI-optimized improvements and auto-apply to matching jobs.`,
            signupUrl: 'https://3box.ai/signup',
          });
          const newCount = realCount + 1;
          fallbackResponse.headers.set('Set-Cookie', buildUsageCookie('3box-ats-uses', newCount));
          return fallbackResponse;
        }
      }

      // Merge AI results with rule-based results (60% AI, 40% rule-based)
      const mergedScore = Math.round((analysis.score * 0.6) + (ruleBasedResults.score * 0.4));
      const mergedResults = {
        score: mergedScore,
        issues: [...(analysis.issues || []), ...ruleBasedResults.issues.filter((i: { type: string; message: string }) => !analysis.issues?.some((ai: { type: string; message: string }) => ai.message.toLowerCase().includes(i.message.toLowerCase().split(' ')[0])))],
        keywords: analysis.keywords || ruleBasedResults.keywords,
        formatting: analysis.formatting || ruleBasedResults.formatting,
        sections: analysis.sections || ruleBasedResults.sections,
        atsParseability: analysis.atsParseability || { canParse: true, risks: [] },
        improvementPlan: analysis.improvementPlan || [],
        cta: `Your ATS score is ${mergedScore}/100. Sign up free to get AI-optimized improvements and auto-apply to matching jobs.`,
        signupUrl: 'https://3box.ai/signup',
      };

      const response = NextResponse.json(mergedResults);
      const newCount = realCount + 1;
      response.headers.set('Set-Cookie', buildUsageCookie('3box-ats-uses', newCount));
      return response;
    } catch (aiError) {
      console.error('AI analysis failed, using rule-based:', aiError);
      const fallbackResponse = NextResponse.json({
        ...ruleBasedResults,
        cta: `Your ATS score is ${ruleBasedResults.score}/100. Sign up free to get AI-optimized improvements and auto-apply to matching jobs.`,
        signupUrl: 'https://3box.ai/signup',
      });
      const newCount = realCount + 1;
      fallbackResponse.headers.set('Set-Cookie', buildUsageCookie('3box-ats-uses', newCount));
      return fallbackResponse;
    }
  } catch (error) {
    console.error('Error in ATS checker:', error);
    return NextResponse.json({ error: 'Failed to analyze resume' }, { status: 500 });
  }
}

function performRuleBasedAnalysis(resumeText: string, targetJob?: string) {
  const text = resumeText.toLowerCase();
  const lines = resumeText.split('\n').filter(l => l.trim());
  let score = 50;
  const issues: { type: 'critical' | 'warning' | 'tip'; message: string }[] = [];
  const foundKeywords: string[] = [];
  const missingKeywords: string[] = [];
  const suggestedKeywords: string[] = [];
  const presentSections: string[] = [];
  const missingSections: string[] = [];
  const formattingIssues: string[] = [];

  // Check contact info
  const hasEmail = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i.test(resumeText);
  const hasPhone = /[\d\(\)\-\+\s]{10,}/.test(resumeText);
  const hasLinkedIn = /linkedin/i.test(resumeText);

  if (hasEmail) { score += 3; presentSections.push('Email'); }
  else { issues.push({ type: 'critical', message: 'No email address found. Every resume must have contact email.' }); score -= 5; }

  if (hasPhone) { score += 2; presentSections.push('Phone'); }
  else { issues.push({ type: 'warning', message: 'No phone number detected.' }); }

  if (hasLinkedIn) { score += 2; foundKeywords.push('LinkedIn'); }
  else { issues.push({ type: 'tip', message: 'Add your LinkedIn profile URL.' }); }

  // Check sections
  const sectionChecks = [
    { name: 'Summary/Objective', patterns: ['summary', 'objective', 'profile', 'about me'], weight: 5 },
    { name: 'Experience', patterns: ['experience', 'work history', 'employment', 'professional experience'], weight: 8 },
    { name: 'Education', patterns: ['education', 'academic', 'degree', 'university', 'college'], weight: 5 },
    { name: 'Skills', patterns: ['skills', 'technical skills', 'competencies', 'technologies'], weight: 5 },
    { name: 'Certifications', patterns: ['certification', 'certifications', 'licensed', 'accredited'], weight: 2 },
  ];

  sectionChecks.forEach(section => {
    if (section.patterns.some(p => text.includes(p))) {
      presentSections.push(section.name);
      score += section.weight;
    } else {
      missingSections.push(section.name);
      if (section.weight >= 5) {
        issues.push({ type: section.weight >= 8 ? 'critical' : 'warning', message: `Missing "${section.name}" section - this is important for ATS parsing.` });
      }
    }
  });

  // Check for action verbs
  const actionVerbs = ['led', 'managed', 'developed', 'created', 'implemented', 'designed', 'improved', 'increased', 'reduced', 'achieved', 'delivered', 'built', 'launched', 'optimized', 'automated', 'streamlined'];
  const foundVerbs = actionVerbs.filter(v => text.includes(v));
  if (foundVerbs.length >= 5) { score += 5; foundKeywords.push(...foundVerbs.slice(0, 5)); }
  else if (foundVerbs.length >= 2) { score += 2; foundKeywords.push(...foundVerbs); issues.push({ type: 'tip', message: 'Use more action verbs like "Led", "Implemented", "Achieved" to strengthen your bullets.' }); }
  else { issues.push({ type: 'warning', message: 'Very few action verbs found. Start bullet points with strong action verbs.' }); }

  // Check for metrics/numbers
  const metrics = resumeText.match(/\d+[\%\$\+]|\$\d+|\d+\s*(users|customers|clients|projects|team|increase|decrease|revenue|sales)/gi) || [];
  if (metrics.length >= 3) { score += 5; }
  else if (metrics.length >= 1) { score += 2; issues.push({ type: 'tip', message: 'Add more quantified achievements (e.g., "Increased revenue by 25%", "Managed team of 12").' }); }
  else { issues.push({ type: 'critical', message: 'No quantified achievements found. ATS and recruiters favor resumes with specific metrics and numbers.' }); score -= 3; }

  // Check formatting issues
  if (resumeText.includes('\t')) { formattingIssues.push('Contains tab characters which can break ATS parsing'); score -= 2; }
  if (lines.length < 10) { issues.push({ type: 'warning', message: 'Resume appears very short. Most competitive resumes have 20+ lines.' }); score -= 3; }
  if (lines.length > 80) { issues.push({ type: 'warning', message: 'Resume is very long. Keep it to 1-2 pages for best results.' }); }

  // Check for common ATS-breaking elements
  if (/[\u2502\u2503\u2506\u250a\u254e\u2551]/.test(resumeText)) { formattingIssues.push('Contains table/box characters that break ATS parsing'); score -= 5; issues.push({ type: 'critical', message: 'Resume contains special characters (tables/columns) that most ATS systems cannot parse.' }); }

  // Target job keyword matching
  if (targetJob) {
    const jobWords = targetJob.toLowerCase().split(/\s+/).filter(w => w.length > 3);
    jobWords.forEach(word => {
      if (text.includes(word)) { foundKeywords.push(word); }
      else { missingKeywords.push(word); }
    });

    if (missingKeywords.length > foundKeywords.length) {
      issues.push({ type: 'critical', message: `Your resume is missing key terms from the target role: ${missingKeywords.slice(0, 5).join(', ')}` });
      score -= 5;
    }
  }

  // Add suggested keywords
  suggestedKeywords.push('results-driven', 'cross-functional', 'stakeholder', 'scalable', 'data-driven');

  score = Math.max(0, Math.min(100, score));

  return {
    score,
    issues,
    keywords: { found: [...new Set(foundKeywords)], missing: [...new Set(missingKeywords)], suggested: suggestedKeywords },
    formatting: { score: Math.max(0, 100 - formattingIssues.length * 15), issues: formattingIssues },
    sections: { present: presentSections, missing: missingSections },
    atsParseability: { canParse: formattingIssues.length === 0, risks: formattingIssues },
    improvementPlan: [],
  };
}
