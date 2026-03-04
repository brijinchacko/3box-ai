import { NextResponse, NextRequest } from 'next/server';
import { aiChat, AI_MODELS } from '@/lib/ai/openrouter';

export async function POST(request: NextRequest) {
  try {
    const { resumeText, targetJob } = await request.json();

    if (!resumeText || typeof resumeText !== 'string') {
      return NextResponse.json({ error: 'Resume text is required' }, { status: 400 });
    }

    // First do a rule-based analysis for instant accuracy
    const ruleBasedResults = performRuleBasedAnalysis(resumeText, targetJob);

    // Then enhance with AI analysis
    const systemPrompt = `You are a senior ATS (Applicant Tracking System) expert and recruiter with 15+ years of experience. You understand how systems like Workday, Taleo, iCIMS, Greenhouse, and Lever parse resumes.

Analyze this resume THOROUGHLY and return ONLY valid JSON (no markdown, no code blocks) with this exact structure:
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

SCORING RULES:
- Start at 50 points
- Contact info complete: +10
- Has summary/objective: +5
- Has experience with quantified bullets: +10
- Has education section: +5
- Has skills section: +5
- Keywords match target job: +15
- Clean formatting (no tables/columns/graphics): +5
- Action verbs used: +5
- Proper date formatting: +3
- Consistent formatting: +2
- Deduct for: typos, gaps, generic content, missing metrics, poor structure

Be STRICT and SPECIFIC. Do NOT give inflated scores. A resume with no metrics and generic bullets should score below 50.`;

    let userPrompt = `RESUME TEXT:\n\n${resumeText}`;
    if (targetJob) {
      userPrompt += `\n\n---\nTARGET JOB/ROLE: ${targetJob}\n\nAnalyze keyword match against this target role. Be specific about which keywords are missing for this exact role.`;
    }

    try {
      const aiResponse = await aiChat({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        model: AI_MODELS.free.id,
        temperature: 0.3,
        maxTokens: 3000,
      });

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
          return NextResponse.json(ruleBasedResults);
        }
      }

      // Merge AI results with rule-based results for accuracy
      const mergedResults = {
        score: Math.round((analysis.score + ruleBasedResults.score) / 2),
        issues: [...(analysis.issues || []), ...ruleBasedResults.issues.filter((i: { type: string; message: string }) => !analysis.issues?.some((ai: { type: string; message: string }) => ai.message.toLowerCase().includes(i.message.toLowerCase().split(' ')[0])))],
        keywords: analysis.keywords || ruleBasedResults.keywords,
        formatting: analysis.formatting || ruleBasedResults.formatting,
        sections: analysis.sections || ruleBasedResults.sections,
        atsParseability: analysis.atsParseability || { canParse: true, risks: [] },
        improvementPlan: analysis.improvementPlan || [],
      };

      return NextResponse.json(mergedResults);
    } catch (aiError) {
      console.error('AI analysis failed, using rule-based:', aiError);
      return NextResponse.json(ruleBasedResults);
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
