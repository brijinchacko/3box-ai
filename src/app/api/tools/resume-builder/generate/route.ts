import { NextResponse } from 'next/server';
import { aiChat, AI_MODELS, extractJSON } from '@/lib/ai/openrouter';

/**
 * Free Resume Builder - AI Generation Endpoint
 * No auth required. JD-based AI resume generation.
 * Rate limited: 5 requests per hour per IP.
 * Uses free-tier model with fallback chain.
 */

// ── Free model fallback chain ────────────────────
const FREE_MODEL_CHAIN = [
  AI_MODELS.free.id,
  'meta-llama/llama-3.3-70b-instruct:free',
  'google/gemma-3-27b-it:free',
  'mistralai/mistral-small-3.1-24b-instruct:free',
  'meta-llama/llama-3.2-3b-instruct:free',
];

// ── In-memory IP rate limiting ────────────────────
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hour

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
    return true;
  }

  if (entry.count >= RATE_LIMIT_MAX) {
    return false;
  }

  entry.count += 1;
  return true;
}

// Clean up stale entries periodically (every 10 minutes)
if (typeof globalThis !== 'undefined') {
  const cleanup = () => {
    const now = Date.now();
    for (const [ip, entry] of rateLimitMap.entries()) {
      if (now > entry.resetAt) {
        rateLimitMap.delete(ip);
      }
    }
  };
  setInterval(cleanup, 10 * 60 * 1000);
}

export async function POST(req: Request) {
  try {
    // ── 1. Rate limit by IP ──────────────────────
    const forwarded = req.headers.get('x-forwarded-for');
    const ip = forwarded?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || 'unknown';

    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: 'rate_limited', message: 'Too many requests. Please try again later.' },
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

    return NextResponse.json({ resume });
  } catch (error) {
    console.error('[Resume Generate]', error);
    return NextResponse.json(
      { error: 'server_error', message: 'Failed to generate resume. Please try again.' },
      { status: 500 },
    );
  }
}
