/**
 * Cover Letter Batch Generator
 * Generates cover letters in parallel batches with caching.
 *
 * Features:
 * - Parallel generation (5 at a time via Promise.allSettled)
 * - In-memory cache (keyed by jobId + resumeHash)
 * - Quality tiers: Priority (full AI), Standard (template + AI tweak), Quick (smart template)
 * - Auto-uniquification to avoid duplicate detection
 */

import { aiChatWithFallback } from '@/lib/ai/openrouter';
import { uniquifyCoverLetter } from './humanBehavior';

// ─── Types ──────────────────────────────────────────

interface JobInfo {
  id: string;
  title: string;
  company: string;
  location: string;
  description: string;
}

interface ResumeInfo {
  name: string;
  email: string;
  summary: string;
  experience: { title: string; company: string; bullets: string[] }[];
  skills: string[];
}

export type CoverLetterTier = 'priority' | 'standard' | 'quick';

export interface CoverLetterResult {
  jobId: string;
  coverLetter: string;
  tier: CoverLetterTier;
  cached: boolean;
  generationTimeMs: number;
}

// ─── Cache ──────────────────────────────────────────

const coverLetterCache = new Map<string, { letter: string; tier: CoverLetterTier; timestamp: number }>();
const CACHE_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours

function getCacheKey(jobId: string, resumeName: string): string {
  return `${jobId}:${resumeName.toLowerCase().replace(/\s+/g, '')}`;
}

function getCached(key: string): { letter: string; tier: CoverLetterTier } | null {
  const entry = coverLetterCache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
    coverLetterCache.delete(key);
    return null;
  }
  return { letter: entry.letter, tier: entry.tier };
}

function setCache(key: string, letter: string, tier: CoverLetterTier): void {
  if (coverLetterCache.size > 2000) {
    const oldest = coverLetterCache.keys().next().value;
    if (oldest) coverLetterCache.delete(oldest);
  }
  coverLetterCache.set(key, { letter, tier, timestamp: Date.now() });
}

// ─── Cover Letter Generation ────────────────────────

/**
 * Generate a full AI-powered cover letter (Priority tier).
 * Uses OpenRouter for personalized, job-specific content.
 */
async function generatePriorityCoverLetter(
  resume: ResumeInfo,
  job: JobInfo,
): Promise<string> {
  const prompt = `Write a professional, concise cover letter for this job application. Keep it to 3-4 short paragraphs. Be specific about how the candidate's experience matches the role. Do NOT include any placeholder brackets — use the actual info provided.

CANDIDATE:
Name: ${resume.name}
Summary: ${resume.summary}
Key Experience: ${resume.experience.slice(0, 2).map(e => `${e.title} at ${e.company}`).join(', ')}
Skills: ${resume.skills.slice(0, 10).join(', ')}

JOB:
Title: ${job.title}
Company: ${job.company}
Location: ${job.location}
Description: ${job.description.slice(0, 800)}

Write ONLY the cover letter body text (no subject line, no header, no signature block). Start directly with the opening paragraph.`;

  const response = await aiChatWithFallback({ messages: [
    { role: 'system', content: 'You are Archer, an expert cover letter writer. Write concise, compelling, honest cover letters. Never fabricate experience. Every claim must be backed by the resume. Tailor specifically to the company and role.' },
    { role: 'user', content: prompt },
  ] }, 'free');

  return response.trim();
}

/**
 * Generate a standard cover letter with template + AI enhancement.
 * Faster than priority — uses a template skeleton with AI fill-in.
 */
async function generateStandardCoverLetter(
  resume: ResumeInfo,
  job: JobInfo,
): Promise<string> {
  const prompt = `Complete this cover letter template by filling in the [brackets] with specific, relevant content based on the candidate and job info. Return ONLY the completed text with no brackets remaining.

Template:
I am writing to express my interest in the ${job.title} position at ${job.company}. With my background in [2-3 relevant skills from resume], I am confident I can contribute meaningfully to your team.

In my role as [most relevant job title] at [company], I [specific achievement relevant to this job]. This experience has given me [key transferable skill] that directly applies to the ${job.title} role.

[One sentence about why this company/role specifically appeals to the candidate based on the job description.]

I look forward to discussing how my experience aligns with your needs.

CANDIDATE:
Summary: ${resume.summary}
Experience: ${resume.experience.slice(0, 2).map(e => `${e.title} at ${e.company}: ${e.bullets.slice(0, 2).join('; ')}`).join(' | ')}
Skills: ${resume.skills.slice(0, 8).join(', ')}

JOB DESCRIPTION (excerpt): ${job.description.slice(0, 500)}`;

  try {
    const response = await aiChatWithFallback({ messages: [
      { role: 'system', content: 'Complete the cover letter template. Return only the finished letter text. No brackets, no explanations.' },
      { role: 'user', content: prompt },
    ] }, 'free');
    return response.trim();
  } catch {
    // Fallback to quick template
    return generateQuickCoverLetter(resume, job);
  }
}

/**
 * Generate a quick template-based cover letter (no AI call).
 * Instant — used for low-priority jobs or when AI is unavailable.
 */
function generateQuickCoverLetter(resume: ResumeInfo, job: JobInfo): string {
  const topSkills = resume.skills.slice(0, 3).join(', ');
  const latestRole = resume.experience[0];
  const roleStr = latestRole ? `${latestRole.title} at ${latestRole.company}` : 'a professional';

  return `I am writing to express my strong interest in the ${job.title} position at ${job.company}. With my background in ${topSkills}, I am confident I can make a meaningful contribution to your team.

My experience as ${roleStr} has equipped me with the skills necessary to excel in this role. I have consistently delivered results and am eager to bring my expertise to ${job.company}.

I would welcome the opportunity to discuss how my skills and experience align with your needs. Thank you for considering my application.`;
}

// ─── Batch Generation ───────────────────────────────

const BATCH_CONCURRENCY = 5;

/**
 * Determine which tier a job should get based on match score.
 */
export function determineCoverLetterTier(matchScore: number): CoverLetterTier {
  if (matchScore >= 80) return 'priority';
  if (matchScore >= 60) return 'standard';
  return 'quick';
}

/**
 * Generate cover letters for a batch of jobs in parallel.
 *
 * @param resume - Candidate resume info
 * @param jobs - Array of jobs with their match scores
 * @param onProgress - Optional callback for progress tracking
 * @returns Array of cover letter results
 */
export async function generateCoverLettersBatch(
  resume: ResumeInfo,
  jobs: (JobInfo & { matchScore?: number })[],
  onProgress?: (completed: number, total: number) => void,
): Promise<CoverLetterResult[]> {
  const results: CoverLetterResult[] = [];
  const total = jobs.length;

  // Sort by match score descending (highest priority first)
  const sorted = [...jobs].sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));

  for (let i = 0; i < sorted.length; i += BATCH_CONCURRENCY) {
    const batch = sorted.slice(i, i + BATCH_CONCURRENCY);

    const batchResults = await Promise.allSettled(
      batch.map(async (job): Promise<CoverLetterResult> => {
        const startTime = Date.now();
        const cacheKey = getCacheKey(job.id, resume.name);

        // Check cache first
        const cached = getCached(cacheKey);
        if (cached) {
          // Uniquify even cached letters
          const uniqueLetter = uniquifyCoverLetter(cached.letter, job.id);
          return {
            jobId: job.id,
            coverLetter: uniqueLetter,
            tier: cached.tier,
            cached: true,
            generationTimeMs: Date.now() - startTime,
          };
        }

        // Determine tier based on match score
        const tier = determineCoverLetterTier(job.matchScore || 0);

        let coverLetter: string;
        switch (tier) {
          case 'priority':
            coverLetter = await generatePriorityCoverLetter(resume, job);
            break;
          case 'standard':
            coverLetter = await generateStandardCoverLetter(resume, job);
            break;
          case 'quick':
          default:
            coverLetter = generateQuickCoverLetter(resume, job);
            break;
        }

        // Uniquify and cache
        coverLetter = uniquifyCoverLetter(coverLetter, job.id);
        setCache(cacheKey, coverLetter, tier);

        return {
          jobId: job.id,
          coverLetter,
          tier,
          cached: false,
          generationTimeMs: Date.now() - startTime,
        };
      }),
    );

    for (const result of batchResults) {
      if (result.status === 'fulfilled') {
        results.push(result.value);
      } else {
        // If a cover letter fails, use quick template
        const failedJob = batch[batchResults.indexOf(result)];
        if (failedJob) {
          results.push({
            jobId: failedJob.id,
            coverLetter: generateQuickCoverLetter(resume, failedJob),
            tier: 'quick',
            cached: false,
            generationTimeMs: 0,
          });
        }
      }
    }

    onProgress?.(results.length, total);

    // Small delay between batches to respect AI rate limits
    if (i + BATCH_CONCURRENCY < sorted.length) {
      await new Promise((r) => setTimeout(r, 1000));
    }
  }

  return results;
}

/**
 * Get batch generation statistics.
 */
export function getCoverLetterStats(results: CoverLetterResult[]): {
  total: number;
  byTier: Record<CoverLetterTier, number>;
  cached: number;
  avgGenerationMs: number;
} {
  const byTier: Record<CoverLetterTier, number> = { priority: 0, standard: 0, quick: 0 };
  let totalMs = 0;
  let cachedCount = 0;

  for (const r of results) {
    byTier[r.tier]++;
    totalMs += r.generationTimeMs;
    if (r.cached) cachedCount++;
  }

  return {
    total: results.length,
    byTier,
    cached: cachedCount,
    avgGenerationMs: results.length > 0 ? Math.round(totalMs / results.length) : 0,
  };
}
