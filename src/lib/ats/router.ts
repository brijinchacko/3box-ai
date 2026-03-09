/**
 * Application Router — Detects ATS type from job URL and routes
 * to the optimal application channel.
 *
 * Channels (in order of effectiveness):
 * 1. ats_api     — Direct API submission (Greenhouse, Lever) — highest success rate
 * 2. cold_email  — Verified email to HR/recruiter — good for smaller companies
 * 3. portal_queue — Queue URL for user to manually apply — fallback
 *
 * The router inspects the job URL to detect which ATS the company uses,
 * then selects the best application method.
 */

import { isGreenhouseUrl, parseGreenhouseUrl } from './greenhouse';
import { isLeverUrl, parseLeverUrl } from './lever';

// ─── Types ──────────────────────────────────────────

export type ATSType =
  | 'greenhouse'
  | 'lever'
  | 'workday'
  | 'taleo'
  | 'icims'
  | 'successfactors'
  | 'smartrecruiters'
  | 'bamboohr'
  | 'ashby'
  | 'jobvite'
  | 'naukri'
  | 'linkedin'
  | 'indeed'
  | 'generic';

export type ApplicationChannel = 'ats_api' | 'cold_email' | 'portal_queue';

export interface RouteDecision {
  channel: ApplicationChannel;
  atsType: ATSType;
  priority: number;           // 1=highest, 3=lowest
  supportsDirectApi: boolean;
  atsMetadata?: {
    boardToken?: string;      // Greenhouse board token
    jobId?: string;           // Greenhouse or Lever job ID
    site?: string;            // Lever site slug
  };
  reason: string;
}

// ─── ATS Detection Patterns ─────────────────────────

const ATS_PATTERNS: { type: ATSType; patterns: RegExp[]; supportsApi: boolean }[] = [
  {
    type: 'greenhouse',
    patterns: [
      /greenhouse\.io/i,
      /boards\.greenhouse/i,
      /job-boards\.greenhouse/i,
    ],
    supportsApi: true,
  },
  {
    type: 'lever',
    patterns: [
      /jobs\.lever\.co/i,
      /lever\.co\/[^/]+\/[a-f0-9-]+/i,
    ],
    supportsApi: true,
  },
  {
    type: 'workday',
    patterns: [
      /myworkdayjobs\.com/i,
      /wd\d+\.myworkdayjobs/i,
      /workday\.com\/.*\/job/i,
    ],
    supportsApi: false, // Complex multi-step form — needs browser automation
  },
  {
    type: 'taleo',
    patterns: [
      /taleo\.net/i,
      /oracle\.com\/.*taleo/i,
    ],
    supportsApi: false,
  },
  {
    type: 'icims',
    patterns: [
      /icims\.com/i,
      /\.icims\./i,
    ],
    supportsApi: false,
  },
  {
    type: 'successfactors',
    patterns: [
      /successfactors\.com/i,
      /sap\.com\/.*career/i,
    ],
    supportsApi: false,
  },
  {
    type: 'smartrecruiters',
    patterns: [
      /smartrecruiters\.com/i,
      /jobs\.smartrecruiters/i,
    ],
    supportsApi: false,
  },
  {
    type: 'bamboohr',
    patterns: [
      /bamboohr\.com\/.*jobs/i,
    ],
    supportsApi: false,
  },
  {
    type: 'ashby',
    patterns: [
      /ashbyhq\.com/i,
      /jobs\.ashby/i,
    ],
    supportsApi: false,
  },
  {
    type: 'jobvite',
    patterns: [
      /jobvite\.com/i,
      /jobs\.jobvite/i,
    ],
    supportsApi: false,
  },
  {
    type: 'naukri',
    patterns: [
      /naukri\.com/i,
    ],
    supportsApi: false,
  },
  {
    type: 'linkedin',
    patterns: [
      /linkedin\.com\/jobs/i,
    ],
    supportsApi: false,
  },
  {
    type: 'indeed',
    patterns: [
      /indeed\.com/i,
      /indeed\.co/i,
    ],
    supportsApi: false,
  },
];

// ─── ATS Detection ──────────────────────────────────

/**
 * Detect which ATS platform a job URL belongs to.
 */
export function detectATSType(url: string): ATSType {
  if (!url) return 'generic';

  for (const { type, patterns } of ATS_PATTERNS) {
    for (const pattern of patterns) {
      if (pattern.test(url)) return type;
    }
  }

  return 'generic';
}

/**
 * Check if a given ATS type supports direct API submission.
 */
export function supportsDirectApi(atsType: ATSType): boolean {
  const entry = ATS_PATTERNS.find((p) => p.type === atsType);
  return entry?.supportsApi ?? false;
}

// ─── Application Routing ────────────────────────────

/**
 * Route a job to the optimal application channel.
 *
 * Decision logic:
 * 1. If URL is Greenhouse/Lever → ats_api (direct submission)
 * 2. If we can find a verified email → cold_email
 * 3. Otherwise → portal_queue (user clicks apply link)
 *
 * @param jobUrl - The job application URL
 * @param hasVerifiedEmail - Whether we found a verified email for the company
 * @param emailConfidence - Confidence score of the found email (0-100)
 */
export function routeApplication(
  jobUrl: string,
  hasVerifiedEmail: boolean = false,
  emailConfidence: number = 0,
): RouteDecision {
  const atsType = detectATSType(jobUrl);

  // Channel 1: Direct ATS API (Greenhouse, Lever)
  if (atsType === 'greenhouse') {
    const parsed = parseGreenhouseUrl(jobUrl);
    return {
      channel: 'ats_api',
      atsType,
      priority: 1,
      supportsDirectApi: true,
      atsMetadata: parsed ? { boardToken: parsed.boardToken, jobId: parsed.jobId } : undefined,
      reason: 'Greenhouse ATS detected — submitting via API',
    };
  }

  if (atsType === 'lever') {
    const parsed = parseLeverUrl(jobUrl);
    return {
      channel: 'ats_api',
      atsType,
      priority: 1,
      supportsDirectApi: true,
      atsMetadata: parsed ? { site: parsed.site, jobId: parsed.postingId } : undefined,
      reason: 'Lever ATS detected — submitting via API',
    };
  }

  // Channel 2: Cold email (if we have a verified email with decent confidence)
  if (hasVerifiedEmail && emailConfidence >= 50) {
    return {
      channel: 'cold_email',
      atsType,
      priority: 2,
      supportsDirectApi: false,
      reason: `Verified email found (${emailConfidence}% confidence) — sending cold email`,
    };
  }

  // Channel 3: Portal queue (fallback)
  return {
    channel: 'portal_queue',
    atsType,
    priority: 3,
    supportsDirectApi: false,
    reason: `${atsType === 'generic' ? 'Unknown' : atsType} ATS — queuing portal application`,
  };
}

/**
 * Route a batch of jobs to their optimal channels.
 * Returns jobs grouped by channel for efficient batch processing.
 */
export function routeApplicationsBatch(
  jobs: { id: string; url: string; company: string; hasVerifiedEmail?: boolean; emailConfidence?: number }[],
): {
  atsApi: (typeof jobs[0] & { route: RouteDecision })[];
  coldEmail: (typeof jobs[0] & { route: RouteDecision })[];
  portalQueue: (typeof jobs[0] & { route: RouteDecision })[];
} {
  const atsApi: (typeof jobs[0] & { route: RouteDecision })[] = [];
  const coldEmail: (typeof jobs[0] & { route: RouteDecision })[] = [];
  const portalQueue: (typeof jobs[0] & { route: RouteDecision })[] = [];

  for (const job of jobs) {
    const route = routeApplication(job.url, job.hasVerifiedEmail, job.emailConfidence);
    const enriched = { ...job, route };

    switch (route.channel) {
      case 'ats_api':
        atsApi.push(enriched);
        break;
      case 'cold_email':
        coldEmail.push(enriched);
        break;
      case 'portal_queue':
        portalQueue.push(enriched);
        break;
    }
  }

  return { atsApi, coldEmail, portalQueue };
}

/**
 * Get a human-readable summary of routing decisions for a batch.
 */
export function getRoutingSummary(
  routes: { channel: ApplicationChannel; atsType: ATSType }[],
): string {
  const counts = { ats_api: 0, cold_email: 0, portal_queue: 0 };
  const atsTypes = new Map<string, number>();

  for (const r of routes) {
    counts[r.channel]++;
    atsTypes.set(r.atsType, (atsTypes.get(r.atsType) || 0) + 1);
  }

  const parts: string[] = [];
  if (counts.ats_api > 0) parts.push(`${counts.ats_api} via ATS API`);
  if (counts.cold_email > 0) parts.push(`${counts.cold_email} via cold email`);
  if (counts.portal_queue > 0) parts.push(`${counts.portal_queue} queued for portal`);

  return parts.join(', ') || 'No jobs to route';
}
