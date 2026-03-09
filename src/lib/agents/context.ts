import { AgentId, AGENTS } from './registry';

// ─── Types for shared data ──────────────────────────────────────────────────

export interface DiscoveredJobSummary {
  title: string;
  company: string;
  matchScore: number;
  applyUrl?: string;
  source: string;
}

export interface ResumeVariantSummary {
  jobTitle: string;
  company: string;
  atsScore: number;
  keywordsAdded: string[];
}

export interface ReviewResultSummary {
  jobTitle: string;
  approved: boolean;
  qualityScore: number;
  reasons: string[];
}

export interface ApplicationSummary {
  jobTitle: string;
  company: string;
  method: 'email' | 'portal' | 'ats_api';
  status: 'sent' | 'queued' | 'failed';
}

export interface InterviewPrepSummary {
  jobTitle: string;
  company: string;
  questionsCount: number;
  topTopics: string[];
}

export interface SkillGapSummary {
  skill: string;
  currentLevel: string;
  requiredLevel: string;
  recommendation: string;
}

export interface AgentActivityEntry {
  agent: AgentId;
  action: string;
  summary: string;
  timestamp: Date;
}

// ─── The shared context ─────────────────────────────────────────────────────

export interface QualityScoreSummary {
  jobTitle: string;
  company: string;
  overall: number;
  recommendation: 'apply_now' | 'optimize_first' | 'skip' | 'review';
}

export interface NetworkingSuggestionSummary {
  company: string;
  strategy: string;
  priority: 'high' | 'medium' | 'low';
}

// ─── Resume verification types ─────────────────────────────────────────────

export interface ResumeReadinessReport {
  passed: boolean;
  hasWarnings: boolean;            // true if non-blocking issues exist
  completenessScore: number;       // 0-100
  averageAtsScore: number;         // avg ATS score across target jobs
  skillCoveragePercent: number;    // % of required skills covered
  issues: { field: string; severity: 'critical' | 'warning'; message: string }[];
  gaps: string[];                  // skills missing across target jobs
  recommendations: string[];
  checkedAt: Date;
}

export interface JobAlignmentResult {
  jobTitle: string;
  company: string;
  alignmentScore: number;          // 0-100
  matchedSkills: string[];
  missingSkills: string[];
  experienceMatch: 'strong' | 'partial' | 'weak';
  approved: boolean;               // true if alignment >= threshold
  reason: string;
}

export interface AgentContext {
  userId: string;
  runId: string;
  profile: {
    targetRole: string;
    skills: string[];
    experienceLevel: string;
    location: string;
  };
  automationMode: 'copilot' | 'autopilot' | 'full-agent';
  // Shared data written by each agent
  discoveredJobs: DiscoveredJobSummary[];
  optimizedResumes: ResumeVariantSummary[];
  reviewResults: ReviewResultSummary[];
  applicationsSent: ApplicationSummary[];
  interviewPreps: InterviewPrepSummary[];
  skillGaps: SkillGapSummary[];
  // New v1.6.0 fields
  scamJobsFiltered: number;
  qualityScores: QualityScoreSummary[];
  networkingSuggestions: NetworkingSuggestionSummary[];
  // Resume verification gate (v1.7.0)
  resumeReadiness: ResumeReadinessReport | null;
  jobAlignments: JobAlignmentResult[];
  // Activity log
  activityLog: AgentActivityEntry[];
}

// ─── Create empty context ───────────────────────────────────────────────────

export function createAgentContext(
  userId: string,
  runId: string,
  profile: AgentContext['profile'],
  automationMode: AgentContext['automationMode'] = 'copilot'
): AgentContext {
  return {
    userId,
    runId,
    profile,
    automationMode,
    discoveredJobs: [],
    optimizedResumes: [],
    reviewResults: [],
    applicationsSent: [],
    interviewPreps: [],
    skillGaps: [],
    scamJobsFiltered: 0,
    qualityScores: [],
    networkingSuggestions: [],
    resumeReadiness: null,
    jobAlignments: [],
    activityLog: [],
  };
}

// ─── Add data to context ────────────────────────────────────────────────────

export function addToContext<K extends keyof AgentContext>(
  ctx: AgentContext,
  key: K,
  data: AgentContext[K]
): void {
  const current = ctx[key];

  // If the field is an array, concat the new data onto it
  if (Array.isArray(current) && Array.isArray(data)) {
    (ctx[key] as unknown[]) = [...current, ...data];
  } else {
    // For scalar fields (userId, runId, profile, automationMode), overwrite
    ctx[key] = data;
  }
}

// ─── Log an activity ────────────────────────────────────────────────────────

export function logActivity(
  ctx: AgentContext,
  agent: AgentId,
  action: string,
  summary: string
): void {
  ctx.activityLog.push({
    agent,
    action,
    summary,
    timestamp: new Date(),
  });
}

// ─── Get a text summary of context for LLM prompts ─────────────────────────

export function getContextSummary(ctx: AgentContext): string {
  const lines: string[] = [];

  lines.push('PIPELINE STATUS:');
  lines.push(`Run: ${ctx.runId} | Mode: ${ctx.automationMode} | Target: ${ctx.profile.targetRole}`);
  lines.push('');

  // Scout summary
  if (ctx.discoveredJobs.length > 0) {
    const topJob = [...ctx.discoveredJobs].sort((a, b) => b.matchScore - a.matchScore)[0];
    const avgScore = Math.round(
      ctx.discoveredJobs.reduce((sum, j) => sum + j.matchScore, 0) / ctx.discoveredJobs.length
    );
    lines.push(
      `- Scout found ${ctx.discoveredJobs.length} jobs (top: ${topJob.title} at ${topJob.company}, score ${topJob.matchScore}% | avg score: ${avgScore}%)`
    );
  } else {
    lines.push('- Scout: no jobs discovered yet');
  }

  // Forge summary
  if (ctx.optimizedResumes.length > 0) {
    const avgAts = Math.round(
      ctx.optimizedResumes.reduce((sum, r) => sum + r.atsScore, 0) / ctx.optimizedResumes.length
    );
    const totalKeywords = ctx.optimizedResumes.reduce((sum, r) => sum + r.keywordsAdded.length, 0);
    lines.push(
      `- Forge optimized ${ctx.optimizedResumes.length} resumes (avg ATS: ${avgAts}% | ${totalKeywords} keywords added)`
    );
  } else {
    lines.push('- Forge: no resumes optimized yet');
  }

  // Sentinel summary
  if (ctx.reviewResults.length > 0) {
    const approved = ctx.reviewResults.filter((r) => r.approved).length;
    const rejected = ctx.reviewResults.length - approved;
    const avgQuality = Math.round(
      ctx.reviewResults.reduce((sum, r) => sum + r.qualityScore, 0) / ctx.reviewResults.length
    );
    lines.push(
      `- Sentinel reviewed ${ctx.reviewResults.length} apps (${approved} approved, ${rejected} rejected | avg quality: ${avgQuality}%)`
    );
  } else {
    lines.push('- Sentinel: no reviews completed yet');
  }

  // Archer summary
  if (ctx.applicationsSent.length > 0) {
    const sent = ctx.applicationsSent.filter((a) => a.status === 'sent').length;
    const queued = ctx.applicationsSent.filter((a) => a.status === 'queued').length;
    const failed = ctx.applicationsSent.filter((a) => a.status === 'failed').length;
    const byEmail = ctx.applicationsSent.filter((a) => a.method === 'email').length;
    const byPortal = ctx.applicationsSent.filter((a) => a.method === 'portal').length;
    const byAtsApi = ctx.applicationsSent.filter((a) => a.method === 'ats_api').length;
    lines.push(
      `- Archer processed ${ctx.applicationsSent.length} applications (${sent} sent, ${queued} queued, ${failed} failed | ${byAtsApi} ATS API, ${byEmail} email, ${byPortal} portal)`
    );
  } else {
    lines.push('- Archer: no applications sent yet');
  }

  // Atlas summary
  if (ctx.interviewPreps.length > 0) {
    const totalQuestions = ctx.interviewPreps.reduce((sum, p) => sum + p.questionsCount, 0);
    const allTopics = [...new Set(ctx.interviewPreps.flatMap((p) => p.topTopics))];
    const topicPreview = allTopics.slice(0, 5).join(', ');
    lines.push(
      `- Atlas prepared ${ctx.interviewPreps.length} interview preps (${totalQuestions} questions | topics: ${topicPreview})`
    );
  } else {
    lines.push('- Atlas: no interview prep completed yet');
  }

  // Sage summary
  if (ctx.skillGaps.length > 0) {
    const criticalGaps = ctx.skillGaps.filter(
      (g) => g.currentLevel === 'none' || g.currentLevel === 'beginner'
    );
    const gapSkills = ctx.skillGaps.map((g) => g.skill).slice(0, 5).join(', ');
    lines.push(
      `- Sage identified ${ctx.skillGaps.length} skill gaps (${criticalGaps.length} critical | skills: ${gapSkills})`
    );
  } else {
    lines.push('- Sage: no skill gaps analyzed yet');
  }

  // Scam filter summary
  if (ctx.scamJobsFiltered > 0) {
    lines.push(`- Scam Filter: blocked ${ctx.scamJobsFiltered} suspicious/scam job listings`);
  }

  // Quality scores summary
  if (ctx.qualityScores.length > 0) {
    const applyNow = ctx.qualityScores.filter(q => q.recommendation === 'apply_now').length;
    const skip = ctx.qualityScores.filter(q => q.recommendation === 'skip').length;
    const avgQuality = Math.round(ctx.qualityScores.reduce((s, q) => s + q.overall, 0) / ctx.qualityScores.length);
    lines.push(`- Quality Gate: ${ctx.qualityScores.length} jobs scored (${applyNow} apply_now, ${skip} skip | avg: ${avgQuality}%)`);
  }

  // Resume readiness (Forge verification gate)
  if (ctx.resumeReadiness) {
    const r = ctx.resumeReadiness;
    lines.push(`- Forge Resume Check: ${r.passed ? 'PASSED' : 'FAILED'} (completeness: ${r.completenessScore}%, avg ATS: ${r.averageAtsScore}%, skill coverage: ${r.skillCoveragePercent}%)`);
    if (r.issues.length > 0) {
      const critical = r.issues.filter(i => i.severity === 'critical');
      lines.push(`  Issues: ${critical.length} critical, ${r.issues.length - critical.length} warnings`);
    }
    if (r.gaps.length > 0) {
      lines.push(`  Skill gaps: ${r.gaps.slice(0, 5).join(', ')}`);
    }
  }

  // Job alignment (Sentinel JD-resume check)
  if (ctx.jobAlignments.length > 0) {
    const approved = ctx.jobAlignments.filter(a => a.approved).length;
    const avgAlign = Math.round(ctx.jobAlignments.reduce((s, a) => s + a.alignmentScore, 0) / ctx.jobAlignments.length);
    lines.push(`- Sentinel Alignment: ${ctx.jobAlignments.length} jobs checked (${approved} approved, avg alignment: ${avgAlign}%)`);
  }

  // Networking suggestions
  if (ctx.networkingSuggestions.length > 0) {
    const highPriority = ctx.networkingSuggestions.filter(n => n.priority === 'high').length;
    lines.push(`- Networking: ${ctx.networkingSuggestions.length} suggestions generated (${highPriority} high priority)`);
  }

  // Recent activity
  if (ctx.activityLog.length > 0) {
    lines.push('');
    lines.push('RECENT ACTIVITY:');
    const recent = ctx.activityLog.slice(-5);
    for (const entry of recent) {
      const agentName = AGENTS[entry.agent]?.name ?? entry.agent;
      const timeAgo = getRelativeTime(entry.timestamp);
      lines.push(`  [${agentName}] ${entry.action}: ${entry.summary} (${timeAgo})`);
    }
  }

  return lines.join('\n');
}

// ─── Get handoff data between specific agents ───────────────────────────────

export function getAgentHandoff(
  ctx: AgentContext,
  fromAgent: AgentId,
  toAgent: AgentId
): string {
  const key = `${fromAgent}->${toAgent}` as const;

  switch (key) {
    // ── Scout handoffs ────────────────────────────────────────────────────
    case 'scout->forge': {
      // Forge needs job titles, companies, and match scores to tailor resumes
      if (ctx.discoveredJobs.length === 0) return 'No jobs discovered yet. Scout must run first.';
      const jobs = ctx.discoveredJobs
        .sort((a, b) => b.matchScore - a.matchScore)
        .map((j) => `- ${j.title} at ${j.company} (match: ${j.matchScore}%, source: ${j.source})`)
        .join('\n');
      return `JOBS TO OPTIMIZE RESUMES FOR:\n${jobs}\n\nUser skills: ${ctx.profile.skills.join(', ')}\nTarget role: ${ctx.profile.targetRole}`;
    }

    case 'scout->archer': {
      // Archer needs apply URLs and job info to send applications
      if (ctx.discoveredJobs.length === 0) return 'No jobs discovered yet. Scout must run first.';
      const jobs = ctx.discoveredJobs
        .filter((j) => j.applyUrl)
        .sort((a, b) => b.matchScore - a.matchScore)
        .map(
          (j) =>
            `- ${j.title} at ${j.company} | URL: ${j.applyUrl} | score: ${j.matchScore}% | source: ${j.source}`
        )
        .join('\n');
      const noUrl = ctx.discoveredJobs.filter((j) => !j.applyUrl).length;
      return `JOBS WITH APPLY URLS:\n${jobs}${noUrl > 0 ? `\n\n(${noUrl} jobs have no apply URL and need email outreach)` : ''}`;
    }

    case 'scout->atlas': {
      // Atlas needs job details to prepare interview questions
      if (ctx.discoveredJobs.length === 0) return 'No jobs discovered yet. Scout must run first.';
      const topJobs = ctx.discoveredJobs
        .sort((a, b) => b.matchScore - a.matchScore)
        .slice(0, 10)
        .map((j) => `- ${j.title} at ${j.company} (match: ${j.matchScore}%)`)
        .join('\n');
      return `TOP JOBS FOR INTERVIEW PREP:\n${topJobs}\n\nTarget role: ${ctx.profile.targetRole}\nExperience: ${ctx.profile.experienceLevel}`;
    }

    case 'scout->sage': {
      // Sage needs job requirements to identify skill gaps
      if (ctx.discoveredJobs.length === 0) return 'No jobs discovered yet. Scout must run first.';
      const sources = [...new Set(ctx.discoveredJobs.map((j) => j.source))];
      const avgScore = Math.round(
        ctx.discoveredJobs.reduce((s, j) => s + j.matchScore, 0) / ctx.discoveredJobs.length
      );
      return `JOB MARKET DATA FOR SKILL ANALYSIS:\nTotal jobs found: ${ctx.discoveredJobs.length}\nAvg match score: ${avgScore}%\nSources: ${sources.join(', ')}\nUser skills: ${ctx.profile.skills.join(', ')}\nTarget role: ${ctx.profile.targetRole}\nLow-match jobs indicate potential skill gaps.`;
    }

    case 'scout->sentinel': {
      // Sentinel needs original job data to verify application quality
      if (ctx.discoveredJobs.length === 0) return 'No jobs discovered yet. Scout must run first.';
      const jobs = ctx.discoveredJobs.map(
        (j) => `- ${j.title} at ${j.company} (match: ${j.matchScore}%, source: ${j.source})`
      ).join('\n');
      return `ORIGINAL JOB LISTINGS FOR QUALITY REVIEW:\n${jobs}`;
    }

    // ── Forge handoffs ────────────────────────────────────────────────────
    case 'forge->sentinel': {
      // Sentinel needs resume details to verify accuracy
      if (ctx.optimizedResumes.length === 0) return 'No resumes optimized yet. Forge must run first.';
      const resumes = ctx.optimizedResumes.map(
        (r) =>
          `- Resume for ${r.jobTitle} at ${r.company} | ATS: ${r.atsScore}% | keywords: ${r.keywordsAdded.join(', ')}`
      ).join('\n');
      return `OPTIMIZED RESUMES TO REVIEW:\n${resumes}\n\nCheck for: fabricated skills, keyword stuffing, accuracy vs user profile.`;
    }

    case 'forge->archer': {
      // Archer needs optimized resume info to attach to applications
      if (ctx.optimizedResumes.length === 0) return 'No resumes optimized yet. Forge must run first.';
      const resumes = ctx.optimizedResumes.map(
        (r) => `- ${r.jobTitle} at ${r.company} | ATS: ${r.atsScore}% | +${r.keywordsAdded.length} keywords`
      ).join('\n');
      return `READY RESUMES FOR APPLICATIONS:\n${resumes}`;
    }

    case 'forge->atlas': {
      // Atlas can use resume keywords to focus interview prep
      if (ctx.optimizedResumes.length === 0) return 'No resumes optimized yet. Forge must run first.';
      const allKeywords = [...new Set(ctx.optimizedResumes.flatMap((r) => r.keywordsAdded))];
      const companies = [...new Set(ctx.optimizedResumes.map((r) => r.company))];
      return `RESUME KEYWORDS FOR INTERVIEW PREP:\nKeywords emphasized: ${allKeywords.join(', ')}\nCompanies targeted: ${companies.join(', ')}\n\nFocus interview questions on these skills and keywords.`;
    }

    case 'forge->sage': {
      // Sage uses ATS scores and keywords to understand skill positioning
      if (ctx.optimizedResumes.length === 0) return 'No resumes optimized yet. Forge must run first.';
      const avgAts = Math.round(
        ctx.optimizedResumes.reduce((s, r) => s + r.atsScore, 0) / ctx.optimizedResumes.length
      );
      const allKeywords = [...new Set(ctx.optimizedResumes.flatMap((r) => r.keywordsAdded))];
      return `RESUME OPTIMIZATION DATA FOR SKILL ANALYSIS:\nAvg ATS score: ${avgAts}%\nKeywords user lacks and were added: ${allKeywords.join(', ')}\n\nFrequently added keywords likely represent skill gaps.`;
    }

    // ── Sentinel handoffs ─────────────────────────────────────────────────
    case 'sentinel->archer': {
      // Archer only sends approved applications
      if (ctx.reviewResults.length === 0) return 'No reviews completed yet. Sentinel must run first.';
      const approved = ctx.reviewResults.filter((r) => r.approved);
      const rejected = ctx.reviewResults.filter((r) => !r.approved);
      if (approved.length === 0) return 'No applications approved. All were rejected by Sentinel.';
      const list = approved
        .map((r) => `- ${r.jobTitle} | quality: ${r.qualityScore}%`)
        .join('\n');
      return `APPROVED APPLICATIONS TO SEND:\n${list}\n\n${rejected.length} applications were rejected and should NOT be sent.`;
    }

    case 'sentinel->forge': {
      // Forge can re-optimize rejected applications
      if (ctx.reviewResults.length === 0) return 'No reviews completed yet. Sentinel must run first.';
      const rejected = ctx.reviewResults.filter((r) => !r.approved);
      if (rejected.length === 0) return 'All applications approved. No re-optimization needed.';
      const list = rejected
        .map((r) => `- ${r.jobTitle} | quality: ${r.qualityScore}% | reasons: ${r.reasons.join('; ')}`)
        .join('\n');
      return `REJECTED APPLICATIONS FOR RE-OPTIMIZATION:\n${list}\n\nAddress the listed reasons and re-optimize these resumes.`;
    }

    // ── Archer handoffs ───────────────────────────────────────────────────
    case 'archer->atlas': {
      // Atlas preps interviews for successfully sent applications
      if (ctx.applicationsSent.length === 0) return 'No applications sent yet. Archer must run first.';
      const sent = ctx.applicationsSent.filter((a) => a.status === 'sent');
      if (sent.length === 0) return 'No applications successfully sent yet.';
      const list = sent
        .map((a) => `- ${a.jobTitle} at ${a.company} (via ${a.method})`)
        .join('\n');
      return `APPLICATIONS SENT - PREPARE INTERVIEWS FOR:\n${list}\n\nPrioritize prep for these companies as responses may come soon.`;
    }

    case 'archer->sage': {
      // Sage can analyze application outcomes for skill improvement
      if (ctx.applicationsSent.length === 0) return 'No applications sent yet. Archer must run first.';
      const statusCounts = {
        sent: ctx.applicationsSent.filter((a) => a.status === 'sent').length,
        queued: ctx.applicationsSent.filter((a) => a.status === 'queued').length,
        failed: ctx.applicationsSent.filter((a) => a.status === 'failed').length,
      };
      const companies = [...new Set(ctx.applicationsSent.map((a) => a.company))];
      return `APPLICATION STATUS FOR SKILL TRACKING:\nSent: ${statusCounts.sent} | Queued: ${statusCounts.queued} | Failed: ${statusCounts.failed}\nCompanies: ${companies.join(', ')}\n\nTrack response rates to identify skill areas needing improvement.`;
    }

    // ── Atlas handoffs ────────────────────────────────────────────────────
    case 'atlas->sage': {
      // Sage uses interview topics to recommend learning
      if (ctx.interviewPreps.length === 0) return 'No interview prep completed yet. Atlas must run first.';
      const allTopics = [...new Set(ctx.interviewPreps.flatMap((p) => p.topTopics))];
      const totalQuestions = ctx.interviewPreps.reduce((s, p) => s + p.questionsCount, 0);
      return `INTERVIEW TOPICS FOR SKILL DEVELOPMENT:\nTop topics across all preps: ${allTopics.join(', ')}\nTotal questions prepared: ${totalQuestions}\n\nRecommend learning resources focused on these interview topics.`;
    }

    // ── Sage handoffs ─────────────────────────────────────────────────────
    case 'sage->scout': {
      // Scout can use skill gap data to find better matching jobs
      if (ctx.skillGaps.length === 0) return 'No skill gaps identified yet. Sage must run first.';
      const strong = ctx.skillGaps
        .filter((g) => g.currentLevel === 'advanced' || g.currentLevel === 'expert')
        .map((g) => g.skill);
      const weak = ctx.skillGaps
        .filter((g) => g.currentLevel === 'none' || g.currentLevel === 'beginner')
        .map((g) => g.skill);
      return `SKILL PROFILE FOR JOB SEARCH:\nStrong skills: ${strong.join(', ') || 'none identified'}\nWeak skills: ${weak.join(', ') || 'none identified'}\n\nPrioritize jobs matching strong skills. Avoid jobs requiring weak skills unless user wants stretch roles.`;
    }

    case 'sage->forge': {
      // Forge can emphasize strong skills and address gaps in resumes
      if (ctx.skillGaps.length === 0) return 'No skill gaps identified yet. Sage must run first.';
      const gaps = ctx.skillGaps
        .map((g) => `- ${g.skill}: ${g.currentLevel} -> ${g.requiredLevel} (${g.recommendation})`)
        .join('\n');
      return `SKILL GAP DATA FOR RESUME OPTIMIZATION:\n${gaps}\n\nEmphasize skills where user meets or exceeds required level. Frame gaps positively where possible.`;
    }

    // ── Default / unknown pair ────────────────────────────────────────────
    default: {
      const fromName = AGENTS[fromAgent]?.name ?? fromAgent;
      const toName = AGENTS[toAgent]?.name ?? toAgent;
      return `No specific handoff defined from ${fromName} to ${toName}. Use getContextSummary() for general pipeline state.`;
    }
  }
}

// ─── Helper: relative time string ───────────────────────────────────────────

function getRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);

  if (diffSec < 60) return 'just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDays = Math.floor(diffHr / 24);
  return `${diffDays}d ago`;
}
