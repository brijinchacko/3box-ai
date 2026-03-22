/**
 * Weekly Digest — Gathers user stats, top unfilled jobs, career twin data,
 * and skill gap trends, then sends an actionable weekly email.
 */
import { prisma } from '@/lib/db/prisma';
import { sendEmail } from '@/lib/email';

const APP_URL = process.env.NEXTAUTH_URL || 'https://3box.ai';

// ─── Data Gathering ─────────────────────────────

interface DigestUser {
  id: string;
  email: string;
  name: string | null;
}

interface WeeklyStats {
  applicationsSent: number;
  jobsFound: number;
  applicationsViewed: number;
}

interface TopJob {
  id: string;
  title: string;
  company: string;
  matchScore: number;
  jobUrl: string;
  location: string | null;
  salary: string | null;
}

interface CareerTwinData {
  marketReadiness: number;
  hireProb: number;
}

interface DigestData {
  user: DigestUser;
  stats: WeeklyStats;
  topJobs: TopJob[];
  careerTwin: CareerTwinData | null;
  topMissingSkill: string | null;
  totalNewJobs: number;
}

/**
 * Gather all digest data for a single user.
 */
export async function gatherDigestData(userId: string): Promise<DigestData | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, name: true },
  });

  if (!user || !user.email) return null;

  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  // Gather stats, top jobs, career twin, and skill gaps in parallel
  const [
    applicationsSent,
    jobsFound,
    applicationsViewed,
    topJobs,
    careerTwin,
    recentJobsWithScores,
  ] = await Promise.all([
    // Applications sent this week
    prisma.jobApplication.count({
      where: {
        userId,
        appliedAt: { gte: oneWeekAgo },
        status: { in: ['APPLIED', 'EMAILED'] },
      },
    }),

    // Jobs discovered this week
    prisma.scoutJob.count({
      where: {
        userId,
        discoveredAt: { gte: oneWeekAgo },
      },
    }),

    // Applications viewed (status changed to VIEWED or beyond)
    prisma.jobApplication.count({
      where: {
        userId,
        updatedAt: { gte: oneWeekAgo },
        status: { in: ['VIEWED', 'INTERVIEW', 'OFFER'] },
      },
    }),

    // Top 3 unfilled jobs — highest match score, not yet applied
    prisma.scoutJob.findMany({
      where: {
        userId,
        status: { in: ['NEW', 'SCORED', 'READY', 'FORGE_READY'] },
      },
      orderBy: { matchScore: 'desc' },
      take: 3,
      select: {
        id: true,
        title: true,
        company: true,
        matchScore: true,
        jobUrl: true,
        location: true,
        salary: true,
      },
    }),

    // Career Twin data
    prisma.careerTwin.findUnique({
      where: { userId },
      select: { marketReadiness: true, hireProb: true, skillSnapshot: true },
    }),

    // Recent scout jobs with descriptions for skill gap analysis
    prisma.scoutJob.findMany({
      where: {
        userId,
        discoveredAt: { gte: oneWeekAgo },
        matchScore: { not: null },
      },
      orderBy: { matchScore: 'desc' },
      take: 20,
      select: { description: true },
    }),
  ]);

  // Extract top missing skill from career twin skill snapshot
  let topMissingSkill: string | null = null;
  if (careerTwin?.skillSnapshot) {
    try {
      const snapshot = careerTwin.skillSnapshot as Record<string, any>;
      // Look for gaps or weak skills in the snapshot
      const skills = snapshot.skills || snapshot.gaps || snapshot;
      if (Array.isArray(skills)) {
        // If it's an array of { skill, score } objects, find the lowest-scored
        const weakSkill = skills
          .filter((s: any) => typeof s === 'object' && s.skill && typeof s.score === 'number')
          .sort((a: any, b: any) => a.score - b.score)[0];
        if (weakSkill) topMissingSkill = weakSkill.skill;
      } else if (typeof skills === 'object') {
        // If it's { skillName: score }, find lowest
        const entries = Object.entries(skills).filter(
          ([, v]) => typeof v === 'number'
        ) as [string, number][];
        if (entries.length > 0) {
          entries.sort((a, b) => a[1] - b[1]);
          topMissingSkill = entries[0][0];
        }
      }
    } catch {
      // Ignore parsing errors
    }
  }

  return {
    user: { id: user.id, email: user.email, name: user.name },
    stats: {
      applicationsSent,
      jobsFound,
      applicationsViewed,
    },
    topJobs: topJobs.map((j) => ({
      id: j.id,
      title: j.title,
      company: j.company,
      matchScore: j.matchScore || 0,
      jobUrl: j.jobUrl,
      location: j.location,
      salary: j.salary,
    })),
    careerTwin: careerTwin
      ? { marketReadiness: careerTwin.marketReadiness, hireProb: careerTwin.hireProb }
      : null,
    topMissingSkill,
    totalNewJobs: jobsFound,
  };
}

// ─── Email Template ─────────────────────────────

function matchScoreColor(score: number): string {
  if (score >= 80) return '#34d399'; // green
  if (score >= 60) return '#facc15'; // yellow
  return '#f87171'; // red
}

function buildDigestHtml(data: DigestData): string {
  const { user, stats, topJobs, careerTwin, topMissingSkill, totalNewJobs } = data;
  const name = user.name || 'there';

  const jobRows = topJobs
    .map(
      (job) => `
      <tr>
        <td style="padding: 14px 0; border-bottom: 1px solid rgba(255,255,255,0.06);">
          <div style="font-weight: 600; font-size: 15px; color: #ffffff; margin-bottom: 4px;">${job.title}</div>
          <div style="font-size: 13px; color: rgba(255,255,255,0.5);">
            ${job.company}${job.location ? ` &bull; ${job.location}` : ''}${job.salary ? ` &bull; ${job.salary}` : ''}
          </div>
        </td>
        <td style="padding: 14px 0; border-bottom: 1px solid rgba(255,255,255,0.06); text-align: right; vertical-align: top; white-space: nowrap;">
          <span style="display: inline-block; padding: 4px 10px; border-radius: 20px; font-size: 12px; font-weight: 700; background: ${matchScoreColor(job.matchScore)}22; color: ${matchScoreColor(job.matchScore)};">${Math.round(job.matchScore)}% match</span>
          <br>
          <a href="${job.jobUrl}" style="display: inline-block; margin-top: 8px; padding: 6px 16px; background: linear-gradient(135deg, #00d4ff, #a855f7); color: #fff; text-decoration: none; border-radius: 8px; font-size: 12px; font-weight: 600;">Apply Now</a>
        </td>
      </tr>`
    )
    .join('');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0a0a0f; color: #ffffff;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">

    <!-- Header -->
    <div style="text-align: center; margin-bottom: 32px;">
      <div style="font-size: 24px; font-weight: 800; background: linear-gradient(135deg, #00d4ff, #a855f7); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">3BOX AI</div>
      <p style="color: rgba(255,255,255,0.4); font-size: 14px; margin: 8px 0 0;">AI Career Operating System</p>
    </div>

    <!-- Title -->
    <div style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; padding: 28px 28px 4px; margin-bottom: 20px; text-align: center;">
      <h1 style="margin: 0 0 8px; font-size: 22px; font-weight: 700;">Your Week in Review</h1>
      <p style="color: rgba(255,255,255,0.5); font-size: 14px; margin: 0 0 24px;">
        ${totalNewJobs > 0 ? `${totalNewJobs} new matching job${totalNewJobs !== 1 ? 's' : ''} found this week` : 'Here is your weekly career update'}
      </p>
    </div>

    <!-- This Week Stats -->
    <div style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; padding: 28px; margin-bottom: 20px;">
      <h2 style="margin: 0 0 20px; font-size: 16px; font-weight: 700; color: rgba(255,255,255,0.6); text-transform: uppercase; letter-spacing: 1px;">This Week</h2>
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="text-align: center; padding: 8px;">
            <div style="font-size: 32px; font-weight: 800; background: linear-gradient(135deg, #00d4ff, #a855f7); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">${stats.applicationsSent}</div>
            <div style="font-size: 12px; color: rgba(255,255,255,0.4); margin-top: 4px;">Applications Sent</div>
          </td>
          <td style="text-align: center; padding: 8px;">
            <div style="font-size: 32px; font-weight: 800; background: linear-gradient(135deg, #00d4ff, #a855f7); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">${stats.jobsFound}</div>
            <div style="font-size: 12px; color: rgba(255,255,255,0.4); margin-top: 4px;">Jobs Found</div>
          </td>
          <td style="text-align: center; padding: 8px;">
            <div style="font-size: 32px; font-weight: 800; background: linear-gradient(135deg, #00d4ff, #a855f7); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">${stats.applicationsViewed}</div>
            <div style="font-size: 12px; color: rgba(255,255,255,0.4); margin-top: 4px;">Apps Viewed</div>
          </td>
        </tr>
      </table>
    </div>

    ${topJobs.length > 0 ? `
    <!-- Top Unfilled Jobs -->
    <div style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; padding: 28px; margin-bottom: 20px;">
      <h2 style="margin: 0 0 16px; font-size: 16px; font-weight: 700; color: rgba(255,255,255,0.6); text-transform: uppercase; letter-spacing: 1px;">Top Jobs For You</h2>
      <table width="100%" cellpadding="0" cellspacing="0">
        ${jobRows}
      </table>
      <p style="text-align: center; margin: 20px 0 0;">
        <a href="${APP_URL}/dashboard/jobs" style="display: inline-block; padding: 12px 28px; background: linear-gradient(135deg, #00d4ff, #a855f7); color: #fff; text-decoration: none; border-radius: 12px; font-weight: 600; font-size: 14px;">View All Jobs</a>
      </p>
    </div>
    ` : ''}

    ${careerTwin || topMissingSkill ? `
    <!-- Career Twin + Skill Gap -->
    <div style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; padding: 28px; margin-bottom: 20px;">
      ${careerTwin ? `
      <h2 style="margin: 0 0 16px; font-size: 16px; font-weight: 700; color: rgba(255,255,255,0.6); text-transform: uppercase; letter-spacing: 1px;">Career Twin</h2>
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.06); color: rgba(255,255,255,0.5);">Market Readiness</td>
          <td style="padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.06); text-align: right;">
            <span style="font-weight: 700; color: ${matchScoreColor(careerTwin.marketReadiness)};">${Math.round(careerTwin.marketReadiness)}%</span>
          </td>
        </tr>
        <tr>
          <td style="padding: 10px 0; ${topMissingSkill ? 'border-bottom: 1px solid rgba(255,255,255,0.06);' : ''} color: rgba(255,255,255,0.5);">Hire Probability</td>
          <td style="padding: 10px 0; ${topMissingSkill ? 'border-bottom: 1px solid rgba(255,255,255,0.06);' : ''} text-align: right;">
            <span style="font-weight: 700; color: ${matchScoreColor(careerTwin.hireProb)};">${Math.round(careerTwin.hireProb)}%</span>
          </td>
        </tr>
      </table>
      ` : ''}
      ${topMissingSkill ? `
      <div style="${careerTwin ? 'margin-top: 16px;' : ''}">
        <h2 style="margin: 0 0 12px; font-size: 16px; font-weight: 700; color: rgba(255,255,255,0.6); text-transform: uppercase; letter-spacing: 1px;">Skill Gap Trend</h2>
        <div style="background: rgba(168,85,247,0.1); border: 1px solid rgba(168,85,247,0.2); border-radius: 10px; padding: 14px 18px; display: flex; align-items: center;">
          <span style="font-size: 14px; color: rgba(255,255,255,0.7);">Most common gap:
            <strong style="color: #a855f7;">${topMissingSkill}</strong>
          </span>
        </div>
        <p style="margin: 12px 0 0; font-size: 13px; color: rgba(255,255,255,0.4);">
          Improving this skill could boost your match scores across multiple roles.
          <a href="${APP_URL}/dashboard/assessment" style="color: #00d4ff; text-decoration: none;">Take an assessment</a>
        </p>
      </div>
      ` : ''}
    </div>
    ` : ''}

    <!-- CTA -->
    <div style="text-align: center; margin: 24px 0;">
      <a href="${APP_URL}/dashboard" style="display: inline-block; padding: 14px 36px; background: linear-gradient(135deg, #00d4ff, #a855f7); color: #fff; text-decoration: none; border-radius: 12px; font-weight: 700; font-size: 16px;">Go to Dashboard</a>
    </div>

    <!-- Footer -->
    <div style="text-align: center; margin-top: 40px; padding-top: 24px; border-top: 1px solid rgba(255,255,255,0.05);">
      <p style="color: rgba(255,255,255,0.4); font-size: 13px; margin: 0 0 8px;">
        3BOX AI by OFORO AI
      </p>
      <p style="color: rgba(255,255,255,0.3); font-size: 12px; margin: 0;">
        <a href="${APP_URL}/settings" style="color: rgba(255,255,255,0.4); text-decoration: none;">Manage preferences</a> &bull;
        <a href="${APP_URL}/api/newsletter/unsubscribe?email=${encodeURIComponent('{{EMAIL}}')}" style="color: rgba(255,255,255,0.4); text-decoration: none;">Unsubscribe</a> &bull;
        <a href="${APP_URL}/security" style="color: rgba(255,255,255,0.4); text-decoration: none;">Privacy Policy</a>
      </p>
    </div>

  </div>
</body>
</html>`;
}

// ─── Send Digest ────────────────────────────────

/**
 * Build and send the weekly digest email for a single user.
 * Returns true if sent successfully, false otherwise.
 */
export async function sendWeeklyDigest(userId: string): Promise<boolean> {
  try {
    const data = await gatherDigestData(userId);
    if (!data) return false;

    // Skip if nothing happened this week and no top jobs
    if (
      data.stats.applicationsSent === 0 &&
      data.stats.jobsFound === 0 &&
      data.stats.applicationsViewed === 0 &&
      data.topJobs.length === 0
    ) {
      console.log(`[Digest] Skipping ${data.user.email} — no activity or jobs`);
      return false;
    }

    const subjectLine = data.totalNewJobs > 0
      ? `Your Week in Review — ${data.totalNewJobs} new matching job${data.totalNewJobs !== 1 ? 's' : ''} found`
      : `Your Week in Review, ${data.user.name || 'there'}`;

    // Replace unsubscribe placeholder with actual email
    const html = buildDigestHtml(data).replace('{{EMAIL}}', data.user.email);

    const result = await sendEmail({
      to: data.user.email,
      subject: subjectLine,
      html,
      text: buildDigestPlainText(data),
    });

    if (result.error) {
      console.error(`[Digest] Failed to send to ${data.user.email}:`, result.error);
      return false;
    }

    // Log the email
    try {
      await prisma.emailLog.create({
        data: {
          userId,
          type: 'WEEKLY_DIGEST',
          subject: subjectLine,
          to: data.user.email,
          status: 'sent',
          messageId: result.id,
        },
      });
    } catch {
      // Non-critical — don't fail the digest if logging fails
    }

    return true;
  } catch (err) {
    console.error(`[Digest] Error for user ${userId}:`, err);
    return false;
  }
}

/**
 * Plain text fallback for the digest email.
 */
function buildDigestPlainText(data: DigestData): string {
  const { user, stats, topJobs, careerTwin, topMissingSkill, totalNewJobs } = data;
  const name = user.name || 'there';

  let text = `Your Week in Review\n`;
  text += totalNewJobs > 0
    ? `${totalNewJobs} new matching job${totalNewJobs !== 1 ? 's' : ''} found this week\n\n`
    : `\n`;

  text += `THIS WEEK\n`;
  text += `- Applications Sent: ${stats.applicationsSent}\n`;
  text += `- Jobs Found: ${stats.jobsFound}\n`;
  text += `- Applications Viewed: ${stats.applicationsViewed}\n\n`;

  if (topJobs.length > 0) {
    text += `TOP JOBS FOR YOU\n`;
    topJobs.forEach((job, i) => {
      text += `${i + 1}. ${job.title} at ${job.company} — ${Math.round(job.matchScore)}% match\n`;
      text += `   ${job.jobUrl}\n`;
    });
    text += `\n`;
  }

  if (careerTwin) {
    text += `CAREER TWIN\n`;
    text += `- Market Readiness: ${Math.round(careerTwin.marketReadiness)}%\n`;
    text += `- Hire Probability: ${Math.round(careerTwin.hireProb)}%\n\n`;
  }

  if (topMissingSkill) {
    text += `SKILL GAP TREND\n`;
    text += `Most common gap: ${topMissingSkill}\n`;
    text += `Improving this skill could boost your match scores.\n\n`;
  }

  text += `View your dashboard: ${APP_URL}/dashboard\n\n`;
  text += `---\n3BOX AI by OFORO AI\nManage preferences: ${APP_URL}/settings\n`;

  return text;
}

/**
 * Send weekly digests to all eligible users.
 * Returns count of emails sent.
 */
export async function sendAllWeeklyDigests(): Promise<{ sent: number; skipped: number; failed: number }> {
  // Find users who have been active (have scout jobs or applications) and haven't been sent a digest recently
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  // Get users who received a digest in the last 6 days (avoid double-sending)
  const recentDigestUserIds = await prisma.emailLog.findMany({
    where: {
      type: 'WEEKLY_DIGEST',
      createdAt: { gte: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000) },
    },
    select: { userId: true },
    distinct: ['userId'],
  });
  const recentDigestSet = new Set(recentDigestUserIds.map((r) => r.userId));

  // Find active users: those who have scout jobs or applications
  const activeUsers = await prisma.user.findMany({
    where: {
      email: { not: null },
      OR: [
        { scoutJobs: { some: {} } },
        { jobApplications: { some: {} } },
        { careerTwin: { isNot: null } },
      ],
    },
    select: { id: true, email: true },
    take: 200, // Process in batches to avoid timeout
  });

  let sent = 0;
  let skipped = 0;
  let failed = 0;

  // Process in batches of 10
  for (let i = 0; i < activeUsers.length; i += 10) {
    const batch = activeUsers.slice(i, i + 10);
    const results = await Promise.allSettled(
      batch.map(async (user) => {
        if (recentDigestSet.has(user.id)) {
          skipped++;
          return 'skipped';
        }
        const success = await sendWeeklyDigest(user.id);
        if (success) sent++;
        else skipped++;
        return success ? 'sent' : 'skipped';
      })
    );

    // Count failures
    results.forEach((r) => {
      if (r.status === 'rejected') failed++;
    });
  }

  return { sent, skipped, failed };
}
