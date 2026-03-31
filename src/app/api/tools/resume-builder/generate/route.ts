import { NextResponse } from 'next/server';
import { aiChat, AI_MODELS, extractJSON } from '@/lib/ai/openrouter';
import { detectGibberish } from '@/lib/validation/gibberishDetector';
import { checkRateLimit, getClientIP } from '@/lib/rateLimit';

/**
 * Free Resume Builder - AI Generation Endpoint
 * No auth required. JD-based AI resume generation.
 * Rate limited via shared rateLimit module (5/tool/hr + 20/day).
 * Uses free-tier model with fallback chain.
 */

// ── Free model fallback chain (ordered by reliability + quality) ──
const FREE_MODEL_CHAIN = [
  'nvidia/nemotron-3-super-120b-a12b:free',
  'openai/gpt-oss-120b:free',
  'nousresearch/hermes-3-llama-3.1-405b:free',
  'google/gemma-3-27b-it:free',
  'meta-llama/llama-3.3-70b-instruct:free',
  'qwen/qwen3.6-plus-preview:free',
];

export async function POST(req: Request) {
  try {
    // ── 1. Rate limit by IP ──────────────────────
    const ip = getClientIP(req);
    const rateLimit = checkRateLimit(ip, 'resume-builder-generate');
    if (!rateLimit.allowed) {
      const retryAfter = Math.ceil((rateLimit.resetAt.getTime() - Date.now()) / 1000);
      return NextResponse.json(
        { error: 'Rate limit exceeded. Sign up for free unlimited access!', retryAfter },
        { status: 429 },
      );
    }

    // ── 2. Parse body ────────────────────────────
    const body = await req.json();
    const { jobDescription, basicInfo } = body;

    if (!jobDescription || typeof jobDescription !== 'string' || jobDescription.trim().length < 20) {
      return NextResponse.json(
        { error: 'bad_request', message: 'A job description of at least 20 characters is required.' },
        { status: 400 },
      );
    }

    if (!basicInfo?.name || !basicInfo?.email) {
      return NextResponse.json(
        { error: 'bad_request', message: 'Name and email are required.' },
        { status: 400 },
      );
    }

    const gibberishCheck = detectGibberish(jobDescription);
    if (gibberishCheck.isGibberish) {
      return NextResponse.json(
        { error: 'invalid_input', message: 'Your message is not clear. Please paste a valid job description with details about the role, responsibilities, and requirements.' },
        { status: 400 },
      );
    }

    // ── 3. Call AI with fallback ─────────────────
    const systemPrompt = `You are a professional resume writer. Given a job description, create a complete resume tailored to match it. Return ONLY valid JSON (no markdown code blocks, no extra text) with this exact structure:
{
  "contact": { "name": "", "email": "", "phone": "", "location": "", "linkedin": "", "portfolio": "" },
  "summary": "2-3 sentence professional summary",
  "experience": [
    { "id": "exp-1", "company": "", "role": "", "location": "", "startDate": "YYYY-MM", "endDate": "YYYY-MM", "current": false, "bullets": ["bullet 1", "bullet 2", "bullet 3"] }
  ],
  "education": [
    { "id": "edu-1", "institution": "", "degree": "", "field": "", "startDate": "YYYY", "endDate": "YYYY", "gpa": "" }
  ],
  "skills": ["skill1", "skill2"]
}

Rules:
- Use the provided candidate name and email in the contact section
- Create 2-3 realistic experience entries matching the job description
- Generate 8-12 relevant skills from the job description
- Make experience bullets quantified and action-verb-led (Led, Built, Improved, etc.)
- Generate unique IDs like "exp-1", "exp-2", "edu-1"
- Return ONLY the JSON object, nothing else`;

    const userMessage = `Job Description:\n${jobDescription.trim()}\n\nCandidate Information:\n- Name: ${basicInfo.name}\n- Email: ${basicInfo.email}\n- Target Role: ${basicInfo.targetRole || 'Not specified'}\n- Years of Experience: ${basicInfo.yearsExperience || 'Not specified'}`;

    let rawResponse = '';
    let lastError: Error | null = null;

    // Try each free model in the fallback chain
    for (const modelId of FREE_MODEL_CHAIN) {
      try {
        rawResponse = await aiChat({
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userMessage },
          ],
          model: modelId,
          temperature: 0.7,
          maxTokens: 4096,
          timeout: 25000,
        });

        // Check if we got a non-empty response
        if (rawResponse && rawResponse.trim().length > 10) {
          console.log(`[Resume Generate] Success with model: ${modelId}`);
          break;
        } else {
          console.warn(`[Resume Generate] Empty response from ${modelId}, trying next...`);
          lastError = new Error(`Empty response from ${modelId}`);
        }
      } catch (err: any) {
        console.warn(`[Resume Generate] Model ${modelId} failed:`, err.message);
        lastError = err;
        // Continue to next model
      }
    }

    if (!rawResponse || rawResponse.trim().length < 10) {
      console.error('[Resume Generate] All free models failed. Last error:', lastError?.message);
      return NextResponse.json(
        { error: 'ai_unavailable', message: 'AI service is temporarily busy. Please try again in a moment.' },
        { status: 503 },
      );
    }

    // ── 4. Parse JSON from response ──────────────
    const jsonStr = extractJSON(rawResponse);
    let resume;

    try {
      resume = JSON.parse(jsonStr);
    } catch {
      console.error('[Resume Generate] Failed to parse AI response as JSON. Raw:', rawResponse.substring(0, 500));
      return NextResponse.json(
        { error: 'parse_error', message: 'AI returned invalid data. Please try again.' },
        { status: 500 },
      );
    }

    // ── 5. Validate & fix response structure ─────
    // Ensure contact info uses the provided name/email
    if (!resume.contact) {
      resume.contact = {};
    }
    resume.contact.name = basicInfo.name;
    resume.contact.email = basicInfo.email;

    // Ensure arrays exist
    if (!Array.isArray(resume.experience)) resume.experience = [];
    if (!Array.isArray(resume.education)) resume.education = [];
    if (!Array.isArray(resume.skills)) resume.skills = [];
    if (typeof resume.summary !== 'string') resume.summary = '';

    // Ensure IDs exist on experience entries
    resume.experience = resume.experience.map((exp: any, i: number) => ({
      id: exp.id || `exp-${i + 1}`,
      company: exp.company || '',
      role: exp.role || exp.title || '',
      location: exp.location || '',
      startDate: exp.startDate || '',
      endDate: exp.endDate || '',
      current: exp.current || false,
      bullets: Array.isArray(exp.bullets) ? exp.bullets : [],
    }));

    // Ensure IDs exist on education entries
    resume.education = resume.education.map((edu: any, i: number) => ({
      id: edu.id || `edu-${i + 1}`,
      institution: edu.institution || edu.school || '',
      degree: edu.degree || '',
      field: edu.field || edu.major || '',
      startDate: edu.startDate || '',
      endDate: edu.endDate || '',
      gpa: edu.gpa || '',
    }));

    return NextResponse.json({
      resume,
      cta: 'Your resume draft is ready. Sign up free to save it, get ATS optimization, and auto-apply to jobs.',
      signupUrl: 'https://3box.ai/signup',
    });
  } catch (error) {
    console.error('[Resume Generate]', error);
    return NextResponse.json(
      { error: 'server_error', message: 'Failed to generate resume. Please try again.' },
      { status: 500 },
    );
  }
}
