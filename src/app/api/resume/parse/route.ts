import { NextResponse, NextRequest } from 'next/server';
import { aiChat, AI_MODELS, extractJSON } from '@/lib/ai/openrouter';
import { spawn } from 'child_process';
import path from 'path';

/**
 * POST /api/resume/parse
 * Accepts either:
 *   - multipart/form-data with a `file` field (PDF or DOCX)
 *   - application/json with a `text` field (plain-text resume)
 *
 * Returns structured onboarding data extracted by AI.
 */
export async function POST(request: NextRequest) {
  try {
    let resumeText = '';

    const contentType = request.headers.get('content-type') || '';

    if (contentType.includes('multipart/form-data')) {
      // ── File Upload (PDF / DOCX) ─────────────────
      const formData = await request.formData();
      const file = formData.get('file') as File | null;

      if (!file) {
        return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
      }

      const fileName = file.name.toLowerCase();
      const buffer = Buffer.from(await file.arrayBuffer());

      if (fileName.endsWith('.pdf')) {
        try {
          // Run PDF extraction in a child process to completely avoid
          // Next.js webpack bundling issues with pdf-parse/canvas
          const scriptPath = path.join(process.cwd(), 'scripts', 'extract-pdf-text.cjs');
          const base64 = buffer.toString('base64');
          const output = await new Promise<string>((resolve, reject) => {
            const child = spawn('node', [scriptPath], { stdio: ['pipe', 'pipe', 'pipe'] });
            const chunks: Buffer[] = [];
            const errChunks: Buffer[] = [];
            child.stdout.on('data', (d: Buffer) => chunks.push(d));
            child.stderr.on('data', (d: Buffer) => errChunks.push(d));
            child.on('close', (code) => {
              const stdout = Buffer.concat(chunks).toString('utf-8');
              if (code !== 0) {
                const stderr = Buffer.concat(errChunks).toString('utf-8');
                console.error('[Resume Parse] Child process error:', stderr);
                reject(new Error(stderr || `Process exited with code ${code}`));
              } else {
                resolve(stdout);
              }
            });
            child.on('error', reject);
            // Send PDF data via stdin to avoid command-line length limits
            child.stdin.write(base64);
            child.stdin.end();
          });
          const parsed = JSON.parse(output);
          if (parsed.error) throw new Error(parsed.error);
          resumeText = parsed.text;
        } catch (pdfError) {
          console.error('[Resume Parse] PDF extraction failed:', pdfError);
          return NextResponse.json(
            { error: 'Failed to extract text from PDF. The file may be image-based or corrupted. Please try a DOCX or TXT file, or paste your resume text.' },
            { status: 400 }
          );
        }
      } else if (fileName.endsWith('.docx') || fileName.endsWith('.doc')) {
        const mammoth = await import('mammoth');
        const result = await mammoth.extractRawText({ buffer });
        resumeText = result.value;
      } else if (fileName.endsWith('.txt')) {
        resumeText = buffer.toString('utf-8');
      } else {
        return NextResponse.json(
          { error: 'Unsupported file type. Please upload PDF, DOCX, or TXT.' },
          { status: 400 }
        );
      }
    } else {
      // ── Plain-text paste ──────────────────────────
      const body = await request.json();
      resumeText = body.text || '';
    }

    if (!resumeText || resumeText.trim().length < 30) {
      return NextResponse.json(
        { error: 'Resume text is too short to extract meaningful data.' },
        { status: 400 }
      );
    }

    // ── Pre-flight: check API key ─────────────────
    if (!process.env.OPENROUTER_API_KEY) {
      console.error('[Resume Parse] OPENROUTER_API_KEY is not configured');
      return NextResponse.json(
        { error: 'AI service is not configured. Please contact support.' },
        { status: 503 }
      );
    }

    // ── AI Extraction ──────────────────────────────
    const response = await aiChat({
      model: AI_MODELS.standard.id,
      messages: [
        {
          role: 'system',
          content: `You are a resume parser AI. Extract structured data from the resume text below and return a JSON object with these EXACT fields:

{
  "fullName": "string - full name of the candidate",
  "email": "string - email address (or empty string)",
  "phone": "string - phone number (or empty string)",
  "location": "string - city, state/country (or empty string)",
  "linkedin": "string - LinkedIn URL (or empty string)",
  "portfolio": "string - portfolio/website URL (or empty string)",
  "targetRole": "string - infer the most likely target role from their experience/title",
  "experienceLevel": "string - one of: fresher, 0-1, 1-3, 3-5, 5-10, 10+",
  "currentStatus": "string - one of: student, employed, job-searching, career-change, freelancer",
  "experiences": [{"title": "string", "company": "string", "duration": "string - e.g. Jan 2020 - Dec 2022", "description": "string - key achievements and responsibilities as a single paragraph"}],
  "educationLevel": "string - one of: High School, Associate's Degree, Bachelor's Degree, Master's Degree, PhD / Doctorate, Self-Taught, Bootcamp",
  "fieldOfStudy": "string - e.g. Computer Science (or empty string)",
  "institution": "string - university/school name (or empty string)",
  "graduationYear": "string - e.g. 2024 (or empty string)",
  "skills": ["string array of skills found in the resume"],
  "certifications": [{"name": "string - certification name", "issuer": "string - issuing organization", "date": "string - date obtained or empty string"}],
  "projects": [{"name": "string - project name", "description": "string - brief description", "url": "string - project URL or empty string", "technologies": ["string array of tech used"]}],
  "bio": "string - a 1-2 sentence professional summary"
}

Rules:
- Extract ALL experiences found, not just the most recent
- For each experience, extract ALL bullet points and achievements into the description field
- For experienceLevel, calculate from total years of work experience across all positions
- For currentStatus, infer from the resume context (if they list a current job, say "employed"; if fresh graduate with no experience, say "student" or "job-searching")
- For targetRole, use their most recent job title or the role they seem most qualified for
- Skills should include both technical and soft skills mentioned
- Extract ALL certifications, licenses, and professional credentials found
- Extract ALL projects mentioned (personal, academic, or professional)
- Bio should be a concise professional summary derived from the resume
- Return ONLY valid JSON. No markdown, no extra text.`,
        },
        {
          role: 'user',
          content: `Parse this resume and extract structured data:\n\n${resumeText.slice(0, 8000)}`,
        },
      ],
      temperature: 0.3,
      maxTokens: 4096,
      jsonMode: true,
    });

    const parsed = JSON.parse(extractJSON(response));

    // Validate & normalize the parsed result
    const result = {
      fullName: parsed.fullName || '',
      email: parsed.email || '',
      phone: parsed.phone || '',
      location: parsed.location || '',
      linkedin: parsed.linkedin || '',
      portfolio: parsed.portfolio || '',
      targetRole: parsed.targetRole || '',
      experienceLevel: parsed.experienceLevel || '',
      currentStatus: parsed.currentStatus || 'job-searching',
      experiences: Array.isArray(parsed.experiences) ? parsed.experiences : [],
      educationLevel: parsed.educationLevel || '',
      fieldOfStudy: parsed.fieldOfStudy || '',
      institution: parsed.institution || '',
      graduationYear: parsed.graduationYear || '',
      skills: Array.isArray(parsed.skills) ? parsed.skills : [],
      certifications: Array.isArray(parsed.certifications) ? parsed.certifications : [],
      projects: Array.isArray(parsed.projects) ? parsed.projects : [],
      bio: parsed.bio || '',
    };

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error('[Resume Parse] Error:', error);
    return NextResponse.json(
      { error: 'Failed to parse resume. Please try again or enter your details manually.' },
      { status: 500 }
    );
  }
}
