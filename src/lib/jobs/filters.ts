/**
 * Centralized job-quality filters.
 *
 * Every route that surfaces jobs (live discovery, board, scout queue,
 * India cache) imports from here. Keeping the rules in ONE place is the
 * whole point — they used to be duplicated across four files and drifted
 * apart each time someone patched a symptom, which caused the cycle of
 * "we just fixed jobs, why is it broken again" reports.
 *
 * If a job-quality rule changes, change it here.
 */

/**
 * Hard cap (in days) on how old a job's REAL posting date may be before
 * we hide it from the live board. Most LinkedIn / Indeed postings stop
 * accepting applications after ~21 days, so older postings tend to
 * dead-end at "No longer accepting applications" by the time the user
 * clicks. Stale rows remain in the DB and surface in the Archive tab.
 */
export const MAX_JOB_AGE_DAYS = 21;

/**
 * Company strings that don't identify a real employer. Showing these to
 * the user produces "Unknown Company · India" cards that can't be
 * matched against, can't be auto-applied to, and can't have a cover
 * letter personalized — pure noise.
 */
export const PLACEHOLDER_COMPANIES = new Set<string>([
  '',
  'na',
  'n/a',
  'unknown',
  'unknown company',
  'unknownco',
  'unknowncompany',
  'confidential',
  'confidental', // common misspelling
  'not specified',
  'notspecified',
  'not disclosed',
  'notdisclosed',
  'company name',
  'companyname',
  'private',
  '-',
  '...',
]);

/**
 * Job-portal brand names that sometimes get scraped as the employer
 * name (e.g. the snippet says "LinkedIn" instead of the real company).
 * These are never valid employers.
 */
export const PORTAL_NAMES_AS_COMPANY = new Set<string>([
  'shine.com',
  'shine',
  'whatjobs',
  'whatjobs direct',
  'jooble',
  'indeed',
  'indeed.com',
  'linkedin',
  'linkedin.com',
  'naukri',
  'naukri.com',
  'glassdoor',
  'glassdoor.com',
  'remoteok',
  'remoteok.com',
  'adzuna',
  'adzuna.com',
  'dice',
  'dice.com',
  'monster',
  'monster.com',
  'timesjobs',
  'hirist',
  'internshala',
  'foundit',
]);

function norm(s: string | null | undefined): string {
  return (s || '').trim().toLowerCase();
}

export function isPlaceholderCompany(company: string | null | undefined): boolean {
  return PLACEHOLDER_COMPANIES.has(norm(company));
}

export function isPortalNameAsCompany(company: string | null | undefined): boolean {
  return PORTAL_NAMES_AS_COMPANY.has(norm(company));
}

export function isValidEmployer(company: string | null | undefined): boolean {
  const c = norm(company);
  if (!c) return false;
  if (PLACEHOLDER_COMPANIES.has(c)) return false;
  if (PORTAL_NAMES_AS_COMPANY.has(c)) return false;
  // Companies that are nothing but digits or punctuation are scraper junk.
  if (!/[a-z]/.test(c)) return false;
  return true;
}

/**
 * URL points to a non-posting page (search results, company reviews,
 * salary aggregator, alert subscription, etc.) rather than a real job.
 *
 * LinkedIn whitelist: ONLY /jobs/view/<digits> URLs are real postings.
 * Anything else on linkedin.com is rejected.
 */
export function isNonJobUrl(url: string | null | undefined): boolean {
  const u = (url || '').toLowerCase();
  if (!u) return true;

  // Indeed: reviews, salary, career-explorer, generic search results
  if (/indeed\.(com|co\.in|co\.uk)/.test(u)) {
    if (/\/cmp\/[^/]+\/reviews/.test(u)) return true;
    if (/\/cmp\/[^/]+\/salaries/.test(u)) return true;
    if (/\/career\/[^/]+\/salaries/.test(u)) return true;
    if (/\/career\/[^/]+\/jobs\??/.test(u)) return true;
    if (/\/q-[^/]+-jobs/.test(u)) return true;
    if (/\/jobs\?q=|\/jobs\?l=/.test(u)) return true;
  }

  // LinkedIn: only /jobs/view/<digits> survives. Plain /jobs/view/ with no
  // numeric id is typically an alert/subscribe page. Category pages
  // (/jobs/software-engineer-jobs-bangalore) are rejected.
  if (/linkedin\.com/.test(u)) {
    if (/\/jobs\/view\/\d+/.test(u)) {
      /* real posting — keep */
    } else {
      return true;
    }
  }

  // Glassdoor: reviews / salaries / interview pages
  if (/glassdoor\.(com|co\.in|co\.uk)/.test(u)) {
    if (/\/Reviews\//.test(u)) return true;
    if (/\/Salaries\//.test(u)) return true;
    if (/\/Interview\//.test(u)) return true;
  }

  // Naukri category/listing pages (real postings live under /job-listings-…)
  if (/naukri\.com/.test(u)) {
    if (/\/job-listings/i.test(u)) {
      /* real posting — keep */
    } else if (/-jobs-in-|-jobs$|\/jobs\//i.test(u)) {
      return true;
    }
  }

  // Generic search/listing query strings
  if (/\/search\?|\/jobs\?q=/.test(u)) return true;

  return false;
}

/**
 * Title looks like a non-job page: company review, salary lookup,
 * aggregator listing, listicle, alert subscription.
 */
export function isNonJobTitle(title: string | null | undefined): boolean {
  const t = norm(title);
  if (!t) return true;
  if (t.split(/\s+/).length < 2) return true;

  // Bad-parse signal: title still contains "<word(s)> hiring <word(s)>"
  // (LinkedIn search-result title that the parser failed to split).
  if (/\s+hiring\s+/.test(t)) return true;

  // Reviews / interview pages
  if (/employee\s+reviews?$/.test(t)) return true;
  if (/\bworking\s+as\b.*:.*review/.test(t)) return true;

  // Salary lookup pages
  if (/\bsalaries?\b.*how\s+much\s+does/.test(t)) return true;
  if (
    /^\s*\w[\w\s,.&-]+\s+salary\s+in\s+/.test(t)
    && !/\b(executive|manager|engineer|developer|analyst|consultant|specialist|associate|coordinator|officer|lead|assistant|director)\b/.test(t)
  ) {
    return true;
  }

  // Aggregator listing titles
  if (/\bjobs?,\s*employment\s+in\b/.test(t)) return true;
  if (
    /^\s*[a-z][\w\s&,-]+\s+jobs\s+in\s+[a-z][\w\s,]+$/.test(t)
    && !/\b(senior|junior|lead|head|chief|principal|staff)\b/.test(t)
  ) {
    return true;
  }

  // Listicles / SEO articles
  if (/^\s*\d+\s+(best|top|latest|new|highest|lowest)\b/.test(t)) return true;
  if (/^\s*top\s+\d+/.test(t)) return true;

  // Common count-based aggregator titles ("12,000+ Software Engineer Jobs in …")
  if (/^\d+\s+.*job\s*(vacancies|openings|listings|results)/.test(t)) return true;
  if (/^\d+[,+]?\d*\+?\s+.*jobs?\s/.test(t)) return true;
  if (/job\s*vacancies\s*in\s/.test(t)) return true;
  if (/\bjobs?\s+in\s+/.test(t) && /\d/.test(t)) return true;
  if (/\bopenings?\s+in\s+.*for\s/.test(t)) return true;
  if (t.includes(' - wellfound') || t.includes(' - glassdoor') || t.includes(' - indeed')) return true;

  // Obvious dead pages
  if (/(not found|page not found|access denied|error 404)/.test(t)) return true;

  return false;
}

/**
 * Description content reveals an expired posting or a job-alert
 * subscription page (the URL might be a real /jobs/view/<id> but the
 * server now serves alert-signup boilerplate because the posting was
 * removed). These slip past the URL filter; we need this signal too.
 *
 * Threshold deliberately conservative: short snippets pass through so
 * sources that don't supply descriptions aren't blanket-rejected.
 */
export function isNonJobDescription(description: string | null | undefined): boolean {
  const d = norm(description);
  if (!d) return false; // unknown desc is allowed; other filters catch the row
  if (d.length < 20) return false; // too short to judge

  // LinkedIn / Indeed expired or alert-subscription pages
  if (/get notified about new .* jobs?\b/.test(d)) return true;
  if (/sign\s*up (?:for|to get).*job alerts?/.test(d)) return true;
  if (/create (?:a )?job alert for/.test(d)) return true;
  if (/save (?:this )?(?:search|alert) to/.test(d)) return true;

  // Closed / removed postings
  if (/no longer accepting applications/.test(d)) return true;
  if (/this job (?:posting )?is no longer (?:available|active|open)/.test(d)) return true;
  if (/this position has been (?:filled|closed)/.test(d)) return true;
  if (/applications? (?:are )?(?:closed|no longer accepted)/.test(d)) return true;

  // Generic SEO landing pages
  if (/^be the first to apply/.test(d)) return true;

  return false;
}

/**
 * Best-effort parse of a postedAt string (ISO, "5 days ago", "yesterday",
 * "today"). Returns null on anything unparseable. Callers treat null as
 * "unknown date" (NOT stale) — the UI shows "Recently posted" rather
 * than fabricating a date.
 */
export function parsePostedAt(postedAt: string | null | undefined): Date | null {
  if (!postedAt) return null;
  const s = String(postedAt).trim();
  if (!s) return null;
  const lower = s.toLowerCase();
  const now = Date.now();
  if (/^today$/.test(lower)) return new Date(now);
  if (/^yesterday$/.test(lower)) return new Date(now - 86_400_000);
  const rel = lower.match(/^(\d+)\s*(minute|hour|day|week|month|year)s?\s*ago/);
  if (rel) {
    const n = parseInt(rel[1], 10);
    const ms: Record<string, number> = {
      minute: 60_000,
      hour: 3_600_000,
      day: 86_400_000,
      week: 604_800_000,
      month: 2_592_000_000,
      year: 31_536_000_000,
    };
    return new Date(now - n * (ms[rel[2]] || 0));
  }
  const ts = Date.parse(s);
  if (!Number.isNaN(ts)) return new Date(ts);
  return null;
}

/**
 * Returns true when we are CONFIDENT the posting is older than the
 * cutoff. Unknown / unparseable dates pass through (not stale).
 */
export function isStalePosting(
  postedAt: string | null | undefined,
  maxAgeDays: number = MAX_JOB_AGE_DAYS,
  now: number = Date.now(),
): boolean {
  const d = parsePostedAt(postedAt);
  if (!d) return false;
  return now - d.getTime() > maxAgeDays * 24 * 60 * 60 * 1000;
}

/**
 * Single canonical predicate for "should this job be shown to the user?".
 * All routes converge on this so legacy bad rows are hidden uniformly.
 */
export interface JobLike {
  title?: string | null;
  company?: string | null;
  description?: string | null;
  url?: string | null;
  jobUrl?: string | null;
  postedAt?: string | Date | null;
}

export interface ShouldShowOptions {
  /** When true, the stale-date filter is skipped (Archive tab). */
  allowStale?: boolean;
}

export function shouldShowJob(job: JobLike, opts: ShouldShowOptions = {}): boolean {
  if (!isValidEmployer(job.company)) return false;
  if (isNonJobTitle(job.title)) return false;
  const url = (job.url || job.jobUrl || '') as string;
  if (url && isNonJobUrl(url)) return false;
  if (isNonJobDescription(job.description)) return false;
  if (!opts.allowStale) {
    const postedAtStr =
      job.postedAt instanceof Date ? job.postedAt.toISOString() : (job.postedAt ?? null);
    if (isStalePosting(postedAtStr)) return false;
  }
  return true;
}
