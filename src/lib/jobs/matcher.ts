/**
 * Job Match Scoring Algorithm
 * Scores jobs 0-100 based on relevance to user's profile.
 * Integrates scam detection penalty for suspicious listings.
 */
import { detectScamSignals } from './scamDetector';

interface UserProfile {
  targetRole: string;
  skills: string[];
  location: string;
}

interface JobToScore {
  title: string;
  description: string;
  location: string;
  salary: string | null;
  remote: boolean;
  company?: string;
}

/**
 * Calculate match score between a job and user profile
 * Scoring breakdown:
 * - Title match: 40 points
 * - Skills overlap: 30 points
 * - Location match: 20 points
 * - Bonus (remote, salary): 10 points
 */
export function calculateMatchScore(job: JobToScore, profile: UserProfile): number {
  let score = 0;

  // ── Title Match (0-40 points) ──
  const jobTitle = job.title.toLowerCase();
  const targetRole = profile.targetRole.toLowerCase();
  const roleWords = targetRole.split(/\s+/).filter(w => w.length > 2);

  if (jobTitle.includes(targetRole)) {
    score += 40; // Exact match
  } else {
    // Partial word match
    const matchedWords = roleWords.filter(word => jobTitle.includes(word));
    const wordScore = (matchedWords.length / Math.max(roleWords.length, 1)) * 35;
    score += Math.min(35, wordScore);

    // Check for common role synonyms
    const synonymGroups: string[][] = [
      ['software engineer', 'software developer', 'swe', 'programmer', 'coder'],
      ['frontend', 'front-end', 'front end', 'ui developer', 'react developer'],
      ['backend', 'back-end', 'back end', 'server-side', 'api developer'],
      ['full stack', 'fullstack', 'full-stack'],
      ['data scientist', 'data analyst', 'ml engineer', 'machine learning'],
      ['devops', 'sre', 'site reliability', 'platform engineer', 'infrastructure'],
      ['product manager', 'pm', 'product owner'],
      ['ux designer', 'ui/ux', 'product designer', 'interaction designer'],
      ['project manager', 'scrum master', 'agile coach'],
      ['marketing manager', 'growth manager', 'digital marketer'],
    ];

    for (const group of synonymGroups) {
      const targetInGroup = group.some(s => targetRole.includes(s));
      const jobInGroup = group.some(s => jobTitle.includes(s));
      if (targetInGroup && jobInGroup) {
        score += 5;
        break;
      }
    }
  }

  // ── Skills Overlap (0-30 points) ──
  if (profile.skills.length > 0) {
    const jobText = `${job.title} ${job.description}`.toLowerCase();
    const matchedSkills = profile.skills.filter(skill =>
      jobText.includes(skill.toLowerCase())
    );
    const skillScore = (matchedSkills.length / Math.max(profile.skills.length, 1)) * 30;
    score += Math.min(30, skillScore);
  } else {
    // If no skills specified, give a base score
    score += 10;
  }

  // ── Location Match (0-20 points) ──
  if (job.remote) {
    score += 18; // Remote jobs match most people
  } else if (profile.location) {
    const jobLoc = job.location.toLowerCase();
    const userLoc = profile.location.toLowerCase();
    const userParts = userLoc.split(/[,\s]+/).filter(p => p.length > 2);

    if (jobLoc.includes(userLoc) || userLoc.includes(jobLoc)) {
      score += 20; // Exact location match
    } else {
      // Partial location match (same city/state/country)
      const matchedParts = userParts.filter(part => jobLoc.includes(part));
      if (matchedParts.length > 0) {
        score += 12;
      }
    }
  } else {
    score += 5; // No location preference
  }

  // ── Bonus Points (0-10) ──
  if (job.salary) score += 5; // Salary transparency bonus
  if (job.remote) score += 3; // Remote work bonus
  // Seniority alignment (basic heuristic)
  const seniorTerms = ['senior', 'lead', 'principal', 'staff', 'director', 'vp'];
  const juniorTerms = ['junior', 'entry', 'intern', 'associate', 'graduate'];
  const isSeniorJob = seniorTerms.some(t => jobTitle.includes(t));
  const isJuniorJob = juniorTerms.some(t => jobTitle.includes(t));
  if (!isSeniorJob && !isJuniorJob) score += 2; // Mid-level tends to match more people

  // ── Title Relevance Gate ──
  // If job title has ZERO keyword overlap with target role, cap the score.
  // This prevents "Sales Executive" from scoring high for a "PLC Programmer".
  const titleScore = score; // snapshot before adding non-title points
  const targetKeywords = roleWords.filter(w => w.length > 2 && !['the', 'and', 'for', 'with'].includes(w));
  const jobTitleWords = jobTitle.split(/[\s,&\-/]+/).filter(w => w.length > 2);
  const titleOverlap = targetKeywords.filter(tw =>
    jobTitleWords.some(jw => jw.includes(tw) || tw.includes(jw))
  ).length;
  if (titleOverlap === 0 && targetKeywords.length > 0) {
    // No title keyword match at all — cap total score at 30%
    // so irrelevant roles always rank below relevant ones
    return Math.min(30, Math.max(0, Math.round(score)));
  }

  // ── Scam Penalty (0 to -30) ──
  // Suspicious jobs get penalized so they rank lower even if keywords match
  const scam = detectScamSignals({
    title: job.title,
    company: job.company || '',
    description: job.description,
    salary: job.salary,
  });
  if (scam.verdict === 'suspicious') {
    score -= 15;
  } else if (scam.verdict === 'likely_scam') {
    score -= 30;
  }

  return Math.min(100, Math.max(0, Math.round(score)));
}

/**
 * Sort jobs by match score (descending)
 */
export function rankJobs<T extends JobToScore>(jobs: T[], profile: UserProfile): (T & { matchScore: number })[] {
  return jobs
    .map(job => ({
      ...job,
      matchScore: calculateMatchScore(job, profile),
    }))
    .sort((a, b) => b.matchScore - a.matchScore);
}
