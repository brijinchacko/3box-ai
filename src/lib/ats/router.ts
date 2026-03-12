/**
 * Application Router — Detects ATS type from job URL and routes
 * to the optimal application channel.
 *
 * Channels (in order of effectiveness):
 * 1. ats_api         — Direct API submission (Greenhouse, Lever) — highest success rate
 * 2. extension_queue — Browser extension auto-fill (Workday, iCIMS, LinkedIn, etc.)
 * 3. user_email      — Send from user's connected Gmail/Outlook — personal touch
 * 4. cold_email      — Verified email to HR/recruiter via company domain — fallback
 * 5. portal_queue    — Queue URL for user to manually apply — last resort
 */

import { isGreenhouseUrl, parseGreenhouseUrl } from './greenhouse';
import { isLeverUrl, parseLeverUrl } from './lever';
import { isWorkdayUrl, parseWorkdayUrl, prepareWorkdayApplicationData } from './workday';
import { isIcimsUrl, parseIcimsUrl, prepareIcimsApplicationData } from './icims';

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

export type ApplicationChannel = 'ats_api' | 'extension_queue' | 'user_email' | 'cold_email' | 'portal_queue';

export interface RouteDecision {
  channel: ApplicationChannel;
  atsType: ATSType;
  priority: number;           // 1=highest, 5=lowest
  supportsDirectApi: boolean;
  supportsExtension: boolean;
  atsMetadata?: {
    boardToken?: string;      // Greenhouse board token
    jobId?: string;           // Greenhouse, Lever, Workday, iCIMS job ID
    site?: string;            // Lever site slug
    company?: string;         // Workday/iCIMS company slug
    instance?: string;        // Workday instance (wd1-wd5)
  };
  extensionData?: Record<string, any>; // Pre-filled form data for extension
  reason: string;
}

// ─── ATS Detection Patterns ─────────────────────────

const ATS_PATTERNS: { type: ATSType; patterns: RegExp[]; supportsApi: boolean; supportsExtension: boolean }[] = [
  {
    type: 'greenhouse',
    patterns: [
      /greenhouse\.io/i,
      /boards\.greenhouse/i,
      /job-boards\.greenhouse/i,
    ],
    supportsApi: true,
    supportsExtension: false,
  },
  {
    type: 'lever',
    patterns: [
      /jobs\.lever\.co/i,
      /lever\.co\/[^/]+\/[a-f0-9-]+/i,
    ],
    supportsApi: true,
    supportsExtension: false,
  },
  {
    type: 'workday',
    patterns: [
      /myworkdayjobs\.com/i,
      /wd\d+\.myworkdayjobs/i,
      /workday\.com\/.*\/job/i,
    ],
    supportsApi: false,
    supportsExtension: true,
  },
  {
    type: 'taleo',
    patterns: [
      /taleo\.net/i,
      /oracle\.com\/.*taleo/i,
    ],
    supportsApi: false,
    supportsExtension: true,
  },
  {
    type: 'icims',
    patterns: [
      /icims\.com/i,
      /\.icims\./i,
    ],
    supportsApi: false,
    supportsExtension: true,
  },
  {
    type: 'successfactors',
    patterns: [
      /successfactors\.com/i,
      /sap\.com\/.*career/i,
    ],
    supportsApi: false,
    supportsExtension: true,
  },
  {
    type: 'smartrecruiters',
    patterns: [
      /smartrecruiters\.com/i,
      /jobs\.smartrecruiters/i,
    ],
    supportsApi: false,
    supportsExtension: true,
  },
  {
    type: 'bamboohr',
    patterns: [
      /bamboohr\.com\/.*jobs/i,
    ],
    supportsApi: false,
    supportsExtension: true,
  },
  {
    type: 'ashby',
    patterns: [
      /ashbyhq\.com/i,
      /jobs\.ashby/i,
    ],
    supportsApi: false,
    supportsExtension: false,
  },
  {
    type: 'jobvite',
    patterns: [
      /jobvite\.com/i,
      /jobs\.jobvite/i,
    ],
    supportsApi: false,
    supportsExtension: true,
  },
  {
    type: 'naukri',
    patterns: [
      /naukri\.com/i,
    ],
    supportsApi: false,
    supportsExtension: true,
  },
  {
    type: 'linkedin',
    patterns: [
      /linkedin\.com\/jobs/i,
    ],
    supportsApi: false,
    supportsExtension: true, // Easy Apply via extension
  },
  {
    type: 'indeed',
    patterns: [
      /indeed\.com/i,
      /indeed\.co/i,
    ],
    supportsApi: false,
    supportsExtension: true,
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

/**
 * Check if a given ATS type supports Chrome extension auto-fill.
 */
export function supportsExtension(atsType: ATSType): boolean {
  const entry = ATS_PATTERNS.find((p) => p.type === atsType);
  return entry?.supportsExtension ?? false;
}

// ─── Application Routing ────────────────────────────

/**
 * Route a job to the optimal application channel.
 *
 * Priority:
 * 1. ATS API (Greenhouse/Lever) → direct submission
 * 2. Extension Queue (Workday/iCIMS/LinkedIn) → browser auto-fill
 * 3. User's Connected Email (Gmail/Outlook) → personal outreach
 * 4. Cold Email (via Resend from company domain) → fallback
 * 5. Portal Queue → user manually applies
 */
export function routeApplication(
  jobUrl: string,
  hasVerifiedEmail: boolean = false,
  emailConfidence: number = 0,
  hasConnectedEmail: boolean = false,
  hasExtension: boolean = false,
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
      supportsExtension: false,
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
      supportsExtension: false,
      atsMetadata: parsed ? { site: parsed.site, jobId: parsed.postingId } : undefined,
      reason: 'Lever ATS detected — submitting via API',
    };
  }

  // Channel 2: Extension Queue (Workday, iCIMS, LinkedIn, Indeed, Naukri)
  if (hasExtension) {
    if (atsType === 'workday') {
      const parsed = parseWorkdayUrl(jobUrl);
      return {
        channel: 'extension_queue',
        atsType,
        priority: 2,
        supportsDirectApi: false,
        supportsExtension: true,
        atsMetadata: parsed ? { company: parsed.company, instance: parsed.instance, jobId: parsed.jobId } : undefined,
        reason: 'Workday ATS detected — queuing for browser extension auto-fill',
      };
    }

    if (atsType === 'icims') {
      const parsed = parseIcimsUrl(jobUrl);
      return {
        channel: 'extension_queue',
        atsType,
        priority: 2,
        supportsDirectApi: false,
        supportsExtension: true,
        atsMetadata: parsed ? { company: parsed.company, jobId: parsed.jobId } : undefined,
        reason: 'iCIMS ATS detected — queuing for browser extension auto-fill',
      };
    }

    if (atsType === 'linkedin' || atsType === 'indeed' || atsType === 'naukri') {
      return {
        channel: 'extension_queue',
        atsType,
        priority: 2,
        supportsDirectApi: false,
        supportsExtension: true,
        reason: `${atsType} detected — queuing for browser extension Easy Apply`,
      };
    }

    // Other extension-supported ATS types
    const atsEntry = ATS_PATTERNS.find(p => p.type === atsType);
    if (atsEntry?.supportsExtension) {
      return {
        channel: 'extension_queue',
        atsType,
        priority: 2,
        supportsDirectApi: false,
        supportsExtension: true,
        reason: `${atsType} detected — queuing for browser extension`,
      };
    }
  }

  // Channel 3: User's connected email (Gmail/Outlook)
  if (hasConnectedEmail && hasVerifiedEmail && emailConfidence >= 40) {
    return {
      channel: 'user_email',
      atsType,
      priority: 3,
      supportsDirectApi: false,
      supportsExtension: false,
      reason: `Sending from your personal email (${emailConfidence}% confidence) — higher response rate`,
    };
  }

  // Channel 4: Cold email (via Resend from company domain)
  if (hasVerifiedEmail && emailConfidence >= 50) {
    return {
      channel: 'cold_email',
      atsType,
      priority: 4,
      supportsDirectApi: false,
      supportsExtension: false,
      reason: `Verified email found (${emailConfidence}% confidence) — sending cold email`,
    };
  }

  // Channel 5: Portal queue (fallback)
  return {
    channel: 'portal_queue',
    atsType,
    priority: 5,
    supportsDirectApi: false,
    supportsExtension: false,
    reason: `${atsType === 'generic' ? 'Unknown' : atsType} ATS — queuing portal application`,
  };
}

/**
 * Route a batch of jobs to their optimal channels.
 * Returns jobs grouped by channel for efficient batch processing.
 */
export function routeApplicationsBatch(
  jobs: { id: string; url: string; company: string; hasVerifiedEmail?: boolean; emailConfidence?: number }[],
  hasConnectedEmail: boolean = false,
  hasExtension: boolean = false,
): {
  atsApi: (typeof jobs[0] & { route: RouteDecision })[];
  extensionQueue: (typeof jobs[0] & { route: RouteDecision })[];
  userEmail: (typeof jobs[0] & { route: RouteDecision })[];
  coldEmail: (typeof jobs[0] & { route: RouteDecision })[];
  portalQueue: (typeof jobs[0] & { route: RouteDecision })[];
} {
  const atsApi: (typeof jobs[0] & { route: RouteDecision })[] = [];
  const extensionQueue: (typeof jobs[0] & { route: RouteDecision })[] = [];
  const userEmail: (typeof jobs[0] & { route: RouteDecision })[] = [];
  const coldEmail: (typeof jobs[0] & { route: RouteDecision })[] = [];
  const portalQueue: (typeof jobs[0] & { route: RouteDecision })[] = [];

  for (const job of jobs) {
    const route = routeApplication(job.url, job.hasVerifiedEmail, job.emailConfidence, hasConnectedEmail, hasExtension);
    const enriched = { ...job, route };

    switch (route.channel) {
      case 'ats_api':
        atsApi.push(enriched);
        break;
      case 'extension_queue':
        extensionQueue.push(enriched);
        break;
      case 'user_email':
        userEmail.push(enriched);
        break;
      case 'cold_email':
        coldEmail.push(enriched);
        break;
      case 'portal_queue':
        portalQueue.push(enriched);
        break;
    }
  }

  return { atsApi, extensionQueue, userEmail, coldEmail, portalQueue };
}

/**
 * Get a human-readable summary of routing decisions for a batch.
 */
export function getRoutingSummary(
  routes: { channel: ApplicationChannel; atsType: ATSType }[],
): string {
  const counts: Record<string, number> = {};

  for (const r of routes) {
    counts[r.channel] = (counts[r.channel] || 0) + 1;
  }

  const labels: Record<string, string> = {
    ats_api: 'ATS API',
    extension_queue: 'browser extension',
    user_email: 'your email',
    cold_email: 'cold email',
    portal_queue: 'portal queue',
  };

  const parts: string[] = [];
  for (const [channel, count] of Object.entries(counts)) {
    parts.push(`${count} via ${labels[channel] || channel}`);
  }

  return parts.join(', ') || 'No jobs to route';
}
