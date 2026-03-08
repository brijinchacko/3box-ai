/**
 * Scam / Fake Job Detector
 * Rule-based detection system — zero AI cost, runs on every job.
 * Scores 0-100 (higher = more scammy).
 */

export interface ScamSignals {
  score: number;         // 0-100 (higher = more scammy)
  signals: string[];     // Reasons flagged
  verdict: 'safe' | 'suspicious' | 'likely_scam';
}

interface JobToCheck {
  title: string;
  company: string;
  description: string;
  salary?: string | null;
  url?: string;
  source?: string;
  location?: string;
}

// ─── Detection Rules ──────────────────────────────────────────────

const VAGUE_COMPANY_PATTERNS = [
  /^(hr|hiring|recruitment|staffing|talent|job)\s*(solutions?|services?|agency|group|team|hub|zone|point)?$/i,
  /^(tech|it|digital|web|software)\s*(solutions?|services?|recruiter|staffing)$/i,
  /^(global|international|world|national)\s*(hiring|recruitment|staffing|solutions?)$/i,
  /^(best|top|premium|elite)\s*(jobs?|careers?|hiring)$/i,
  /^(abc|xyz|aaa)\s/i,
];

const URGENCY_PHRASES = [
  'immediate hiring', 'immediate joiner', 'immediate joining',
  'walk-in', 'walk in', 'walkin',
  'urgent opening', 'urgent requirement', 'urgently required',
  'hiring now', 'join today', 'start tomorrow',
  'last date today', 'limited seats', 'hurry up',
  'don\'t miss', 'act now', 'apply immediately',
];

const PAYMENT_DEMAND_PHRASES = [
  'training fee', 'registration fee', 'registration charge',
  'security deposit', 'processing fee', 'joining fee',
  'pay to apply', 'advance payment', 'refundable deposit',
  'admission fee', 'course fee before joining',
  'send money', 'wire transfer', 'western union',
  'google pay', 'phonepe', 'paytm', 'upi id',
];

const RESUME_HARVESTING_SIGNALS = [
  'send your resume to', 'send cv to', 'mail your resume',
  'whatsapp your resume', 'whatsapp your cv',
  'share your details on', 'send profile to',
];

const FREE_EMAIL_DOMAINS = [
  'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com',
  'rediffmail.com', 'ymail.com', 'aol.com', 'mail.com',
  'protonmail.com', 'zoho.com',
];

const BROAD_REQUIREMENT_PHRASES = [
  'any degree', 'any graduation', 'any graduate',
  'no experience required', '0 experience',
  'freshers welcome', 'anyone can apply',
  'no qualification needed', 'all backgrounds welcome',
  '10th pass', '12th pass', 'no skills required',
];

const SUSPICIOUS_SALARY_PATTERNS = [
  // Entry-level offering absurdly high pay (Indian context)
  { regex: /(\d+)\s*(lpa|lakhs?\s*per\s*annum)/i, maxForEntry: 25 },
  // Monthly salary too high for freshers
  { regex: /(\d+)\s*k?\s*(per\s*month|pm|monthly)/i, maxForEntry: 100 },
];

const MLM_SIGNALS = [
  'network marketing', 'multi level', 'mlm',
  'passive income', 'work from home earn lakhs',
  'unlimited earning', 'be your own boss',
  'part time income', 'data entry from home',
  'typing job', 'form filling', 'ad posting',
  'sms sending job', 'copy paste job',
];

// ─── Core Detection Function ──────────────────────────────────────

export function detectScamSignals(job: JobToCheck): ScamSignals {
  let score = 0;
  const signals: string[] = [];
  const desc = (job.description || '').toLowerCase();
  const title = (job.title || '').toLowerCase();
  const company = (job.company || '').trim();
  const companyLower = company.toLowerCase();

  // Rule 1: Vague company names (+15)
  for (const pattern of VAGUE_COMPANY_PATTERNS) {
    if (pattern.test(company)) {
      score += 15;
      signals.push(`Vague company name: "${company}"`);
      break;
    }
  }

  // Rule 2: Missing or very short company name (+10)
  if (!company || company.length < 3) {
    score += 10;
    signals.push('Missing or extremely short company name');
  }

  // Rule 3: Urgency language (+12)
  const urgencyMatches = URGENCY_PHRASES.filter(p => desc.includes(p) || title.includes(p));
  if (urgencyMatches.length > 0) {
    score += Math.min(12, urgencyMatches.length * 6);
    signals.push(`Urgency language detected: ${urgencyMatches.slice(0, 2).join(', ')}`);
  }

  // Rule 4: Payment demands (+40 — CRITICAL)
  const paymentMatches = PAYMENT_DEMAND_PHRASES.filter(p => desc.includes(p));
  if (paymentMatches.length > 0) {
    score += 40;
    signals.push(`Payment demand detected: ${paymentMatches[0]}`);
  }

  // Rule 5: Resume harvesting (+15)
  const harvestMatches = RESUME_HARVESTING_SIGNALS.filter(p => desc.includes(p));
  if (harvestMatches.length > 0) {
    score += 15;
    signals.push('Asks to send resume via personal channels instead of proper portal');
  }

  // Rule 6: Free email domain in description (+10)
  const emailRegex = /[\w.-]+@([\w.-]+\.\w+)/gi;
  const emails = [...desc.matchAll(emailRegex)];
  const freeEmails = emails.filter(m => FREE_EMAIL_DOMAINS.includes(m[1].toLowerCase()));
  if (freeEmails.length > 0) {
    score += 10;
    signals.push(`HR using free email domain: ${freeEmails[0][0]}`);
  }

  // Rule 7: Suspiciously broad requirements (+8)
  const broadMatches = BROAD_REQUIREMENT_PHRASES.filter(p => desc.includes(p));
  if (broadMatches.length >= 2) {
    score += 8;
    signals.push('Suspiciously broad requirements — accepting anyone');
  }

  // Rule 8: Salary mismatches (+15)
  if (job.salary) {
    const salaryLower = job.salary.toLowerCase();
    // Check for unrealistically high entry-level salary (India)
    const lpaMatch = salaryLower.match(/(\d+)\s*(lpa|lakhs?\s*per\s*annum)/i);
    if (lpaMatch && (title.includes('fresher') || title.includes('entry') || title.includes('junior'))) {
      const amount = parseInt(lpaMatch[1]);
      if (amount > 25) {
        score += 15;
        signals.push(`Unrealistic salary for entry-level: ${amount} LPA`);
      }
    }
  }

  // Rule 9: MLM / Scam job types (+25)
  const mlmMatches = MLM_SIGNALS.filter(p => desc.includes(p) || title.includes(p));
  if (mlmMatches.length >= 2) {
    score += 25;
    signals.push(`MLM/scam job indicators: ${mlmMatches.slice(0, 2).join(', ')}`);
  }

  // Rule 10: Missing job description (+8)
  if (desc.length < 50) {
    score += 8;
    signals.push('Very short or missing job description');
  }

  // Rule 11: Excessive capitalization in title (+5)
  const capsRatio = (job.title.match(/[A-Z]/g) || []).length / Math.max(job.title.length, 1);
  if (capsRatio > 0.6 && job.title.length > 10) {
    score += 5;
    signals.push('Excessive capitalization in title (spam signal)');
  }

  // Rule 12: WhatsApp / personal number in description (+10)
  const whatsappPattern = /whatsapp|whats\s*app|wa\.me|(\+91|91)?\s*\d{10}/i;
  if (whatsappPattern.test(desc)) {
    score += 10;
    signals.push('WhatsApp/personal number in job posting');
  }

  // Cap at 100
  const finalScore = Math.min(100, score);

  // Determine verdict
  let verdict: ScamSignals['verdict'] = 'safe';
  if (finalScore >= 50) verdict = 'likely_scam';
  else if (finalScore >= 25) verdict = 'suspicious';

  return {
    score: finalScore,
    signals,
    verdict,
  };
}

/**
 * Batch filter jobs — removes likely_scam, flags suspicious
 */
export function filterScamJobs<T extends JobToCheck>(jobs: T[]): {
  clean: (T & { scamScore: number; scamVerdict: string })[];
  filtered: (T & { scamScore: number; scamVerdict: string; scamSignals: string[] })[];
  stats: { total: number; clean: number; suspicious: number; scam: number };
} {
  const clean: (T & { scamScore: number; scamVerdict: string })[] = [];
  const filtered: (T & { scamScore: number; scamVerdict: string; scamSignals: string[] })[] = [];
  let suspicious = 0;
  let scam = 0;

  for (const job of jobs) {
    const result = detectScamSignals(job);

    if (result.verdict === 'likely_scam') {
      scam++;
      filtered.push({ ...job, scamScore: result.score, scamVerdict: result.verdict, scamSignals: result.signals });
    } else {
      if (result.verdict === 'suspicious') suspicious++;
      clean.push({ ...job, scamScore: result.score, scamVerdict: result.verdict });
    }
  }

  return {
    clean,
    filtered,
    stats: { total: jobs.length, clean: clean.length, suspicious, scam },
  };
}
