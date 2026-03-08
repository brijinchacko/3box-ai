/**
 * Application Quality Score
 * Combines match score, ATS score, scam score, and job freshness
 * to determine whether to apply, optimize first, or skip.
 */

export interface ApplicationQualityScore {
  overall: number; // 0-100
  breakdown: {
    jobFit: number;           // from matchScore (0-100)
    resumeOptimization: number; // from ATS score (0-100)
    companyReachability: number; // has direct URL, email, etc. (0-100)
    competitionLevel: number;  // based on job age, source popularity (0-100)
    scamRisk: number;          // inverted scam score (0-100, higher=safer)
  };
  recommendation: 'apply_now' | 'optimize_first' | 'skip' | 'review';
  reason: string;
}

interface QualityInput {
  matchScore: number;   // 0-100 from matcher
  atsScore?: number;    // 0-100 from Forge (may not be available)
  scamScore: number;    // 0-100 from scam detector (higher = more scammy)
  hasDirectUrl: boolean;
  jobAgeDays: number;   // days since job was posted
  source?: string;
}

/**
 * Calculate application quality score
 */
export function calculateApplicationQuality(input: QualityInput): ApplicationQualityScore {
  const { matchScore, atsScore, scamScore, hasDirectUrl, jobAgeDays, source } = input;

  // ── Job Fit (30% weight) ──
  const jobFit = Math.min(100, Math.max(0, matchScore));

  // ── Resume Optimization (20% weight) ──
  // If no ATS score available (pre-Forge), use a neutral 50
  const resumeOptimization = atsScore !== undefined ? Math.min(100, Math.max(0, atsScore)) : 50;

  // ── Company Reachability (15% weight) ──
  let companyReachability = 30; // baseline
  if (hasDirectUrl) companyReachability += 50;
  // Some sources are more reliable for application
  const reliableSources = ['linkedin', 'naukri', 'company_career'];
  if (source && reliableSources.some(s => source.toLowerCase().includes(s))) {
    companyReachability += 20;
  }
  companyReachability = Math.min(100, companyReachability);

  // ── Competition Level (15% weight) ──
  // Fresher jobs = less competition (inverted — higher = better)
  let competitionLevel = 100;
  if (jobAgeDays > 30) competitionLevel -= 50;      // Old job — likely filled
  else if (jobAgeDays > 14) competitionLevel -= 30;  // Moderate age
  else if (jobAgeDays > 7) competitionLevel -= 15;   // One week old
  else if (jobAgeDays <= 1) competitionLevel += 0;    // Brand new — best chance
  competitionLevel = Math.min(100, Math.max(0, competitionLevel));

  // ── Scam Risk (20% weight) ──
  // Invert: 0 scam = 100 safety, 100 scam = 0 safety
  const scamRisk = Math.min(100, Math.max(0, 100 - scamScore));

  // ── Weighted Overall Score ──
  const overall = Math.round(
    jobFit * 0.30 +
    resumeOptimization * 0.20 +
    companyReachability * 0.15 +
    competitionLevel * 0.15 +
    scamRisk * 0.20
  );

  // ── Recommendation Logic ──
  let recommendation: ApplicationQualityScore['recommendation'];
  let reason: string;

  if (scamScore >= 50) {
    recommendation = 'skip';
    reason = 'High scam risk — likely a fake job posting.';
  } else if (overall >= 75) {
    recommendation = 'apply_now';
    reason = 'Strong match, good quality. Apply immediately for best chances.';
  } else if (overall >= 55) {
    if (resumeOptimization < 60) {
      recommendation = 'optimize_first';
      reason = 'Decent match but resume needs optimization for this role.';
    } else {
      recommendation = 'apply_now';
      reason = 'Good enough match. Apply to maximize interview chances.';
    }
  } else if (overall >= 40) {
    recommendation = 'review';
    reason = 'Moderate match. Review manually before deciding.';
  } else {
    recommendation = 'skip';
    reason = 'Low overall quality — not worth the application effort.';
  }

  // Override: very old jobs should always be reviewed at minimum
  if (jobAgeDays > 30 && recommendation === 'apply_now') {
    recommendation = 'review';
    reason = 'Good match but job is over 30 days old — may already be filled.';
  }

  return {
    overall,
    breakdown: {
      jobFit,
      resumeOptimization,
      companyReachability,
      competitionLevel,
      scamRisk,
    },
    recommendation,
    reason,
  };
}

/**
 * Batch score and sort jobs by application quality
 */
export function rankByApplicationQuality<T extends { matchScore?: number }>(
  jobs: T[],
  scamScores: Map<number, number>,
): (T & { qualityScore: ApplicationQualityScore })[] {
  return jobs
    .map((job, index) => ({
      ...job,
      qualityScore: calculateApplicationQuality({
        matchScore: job.matchScore || 0,
        scamScore: scamScores.get(index) || 0,
        hasDirectUrl: true, // Assume we have URLs from discovery
        jobAgeDays: 3,      // Default to recent
      }),
    }))
    .sort((a, b) => b.qualityScore.overall - a.qualityScore.overall);
}
