/**
 * Auto-Apply Digest Email
 * Sends a summary of auto-applied, queued, and blocked jobs to the user.
 */
import { prisma } from '@/lib/db/prisma';
import { sendEmail } from '@/lib/email';

const APP_URL = process.env.NEXTAUTH_URL || 'https://3box.ai';

// ─── Types ──────────────────────────────────────

interface AppliedJob {
  title: string;
  company: string;
  matchScore: number;
  method: string;
}

interface QueuedJob {
  title: string;
  company: string;
  matchScore?: number;
  reason?: string;
}

interface BlockedJob {
  title: string;
  company: string;
  reason?: string;
}

interface AutoApplyDigest {
  jobsDiscovered: number;
  jobsAutoApplied: number;
  jobsQueued: number;
  jobsBlocked: number;
  scamsDetected: number;
  appliedJobs: AppliedJob[];
  queuedJobs: QueuedJob[];
  blockedJobs: BlockedJob[];
}

interface SendAutoApplyDigestParams {
  email: string;
  name: string;
  digest: AutoApplyDigest;
}

// ─── Helpers ────────────────────────────────────

function matchScoreColor(score: number): string {
  if (score >= 80) return '#34d399'; // green
  if (score >= 60) return '#facc15'; // yellow
  return '#f87171'; // red
}

function methodBadge(method: string): string {
  const colors: Record<string, { bg: string; fg: string }> = {
    email: { bg: 'rgba(0,212,255,0.15)', fg: '#00d4ff' },
    portal: { bg: 'rgba(168,85,247,0.15)', fg: '#a855f7' },
    'easy-apply': { bg: 'rgba(52,211,153,0.15)', fg: '#34d399' },
    api: { bg: 'rgba(251,191,36,0.15)', fg: '#fbbf24' },
  };
  const c = colors[method.toLowerCase()] || colors.email;
  return `<span style="display: inline-block; padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 600; background: ${c.bg}; color: ${c.fg};">${method}</span>`;
}

// ─── HTML Template ──────────────────────────────

function buildAutoApplyDigestHtml(name: string, digest: AutoApplyDigest): string {
  const displayName = name || 'there';

  const appliedRows = digest.appliedJobs
    .map(
      (job) => `
      <tr>
        <td style="padding: 14px 0; border-bottom: 1px solid rgba(255,255,255,0.06);">
          <div style="font-weight: 600; font-size: 15px; color: #ffffff; margin-bottom: 4px;">${job.title}</div>
          <div style="font-size: 13px; color: rgba(255,255,255,0.5);">${job.company}</div>
        </td>
        <td style="padding: 14px 0; border-bottom: 1px solid rgba(255,255,255,0.06); text-align: right; vertical-align: top; white-space: nowrap;">
          <span style="display: inline-block; padding: 4px 10px; border-radius: 20px; font-size: 12px; font-weight: 700; background: ${matchScoreColor(job.matchScore)}22; color: ${matchScoreColor(job.matchScore)};">${Math.round(job.matchScore)}% match</span>
          <br>
          ${methodBadge(job.method)}
        </td>
      </tr>`
    )
    .join('');

  const queuedRows = digest.queuedJobs
    .map(
      (job) => `
      <tr>
        <td style="padding: 12px 0; border-bottom: 1px solid rgba(255,255,255,0.06);">
          <div style="font-weight: 600; font-size: 14px; color: #ffffff;">${job.title}</div>
          <div style="font-size: 12px; color: rgba(255,255,255,0.4);">${job.company}${job.reason ? ` &mdash; ${job.reason}` : ''}</div>
        </td>
        <td style="padding: 12px 0; border-bottom: 1px solid rgba(255,255,255,0.06); text-align: right; vertical-align: middle;">
          ${job.matchScore !== undefined ? `<span style="font-size: 12px; font-weight: 600; color: ${matchScoreColor(job.matchScore)};">${Math.round(job.matchScore)}%</span>` : ''}
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
      <h1 style="margin: 0 0 8px; font-size: 22px; font-weight: 700;">Auto-Apply Digest</h1>
      <p style="color: rgba(255,255,255,0.5); font-size: 14px; margin: 0 0 24px;">
        Hi ${displayName}, here's what happened while you were away
      </p>
    </div>

    <!-- Summary Stats -->
    <div style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; padding: 28px; margin-bottom: 20px;">
      <h2 style="margin: 0 0 20px; font-size: 16px; font-weight: 700; color: rgba(255,255,255,0.6); text-transform: uppercase; letter-spacing: 1px;">Summary</h2>
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="text-align: center; padding: 8px;">
            <div style="font-size: 32px; font-weight: 800; background: linear-gradient(135deg, #00d4ff, #a855f7); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">${digest.jobsDiscovered}</div>
            <div style="font-size: 12px; color: rgba(255,255,255,0.4); margin-top: 4px;">Discovered</div>
          </td>
          <td style="text-align: center; padding: 8px;">
            <div style="font-size: 32px; font-weight: 800; color: #34d399;">${digest.jobsAutoApplied}</div>
            <div style="font-size: 12px; color: rgba(255,255,255,0.4); margin-top: 4px;">Auto-Applied</div>
          </td>
          <td style="text-align: center; padding: 8px;">
            <div style="font-size: 32px; font-weight: 800; color: #facc15;">${digest.jobsQueued}</div>
            <div style="font-size: 12px; color: rgba(255,255,255,0.4); margin-top: 4px;">Queued</div>
          </td>
        </tr>
      </table>
      ${digest.jobsBlocked > 0 || digest.scamsDetected > 0 ? `
      <table width="100%" cellpadding="0" cellspacing="0" style="margin-top: 16px;">
        <tr>
          ${digest.jobsBlocked > 0 ? `
          <td style="padding: 10px 0; border-top: 1px solid rgba(255,255,255,0.06); color: rgba(255,255,255,0.4); font-size: 13px;">Blocked</td>
          <td style="padding: 10px 0; border-top: 1px solid rgba(255,255,255,0.06); text-align: right; font-weight: 600; font-size: 13px; color: #f87171;">${digest.jobsBlocked}</td>
          ` : ''}
        </tr>
        ${digest.scamsDetected > 0 ? `
        <tr>
          <td style="padding: 10px 0; border-top: 1px solid rgba(255,255,255,0.06); color: rgba(255,255,255,0.4); font-size: 13px;">Scams Detected</td>
          <td style="padding: 10px 0; border-top: 1px solid rgba(255,255,255,0.06); text-align: right; font-weight: 600; font-size: 13px; color: #f87171;">${digest.scamsDetected}</td>
        </tr>
        ` : ''}
      </table>
      ` : ''}
    </div>

    ${digest.appliedJobs.length > 0 ? `
    <!-- Applied Jobs -->
    <div style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; padding: 28px; margin-bottom: 20px;">
      <h2 style="margin: 0 0 16px; font-size: 16px; font-weight: 700; color: rgba(255,255,255,0.6); text-transform: uppercase; letter-spacing: 1px;">Applied Jobs</h2>
      <table width="100%" cellpadding="0" cellspacing="0">
        ${appliedRows}
      </table>
    </div>
    ` : ''}

    ${digest.queuedJobs.length > 0 ? `
    <!-- Queued for Review -->
    <div style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; padding: 28px; margin-bottom: 20px;">
      <h2 style="margin: 0 0 16px; font-size: 16px; font-weight: 700; color: rgba(255,255,255,0.6); text-transform: uppercase; letter-spacing: 1px;">Queued for Review</h2>
      <p style="color: rgba(255,255,255,0.4); font-size: 13px; margin: 0 0 16px;">These jobs need your review before we can apply.</p>
      <table width="100%" cellpadding="0" cellspacing="0">
        ${queuedRows}
      </table>
      <p style="text-align: center; margin: 20px 0 0;">
        <a href="${APP_URL}/dashboard/jobs?filter=queued" style="display: inline-block; padding: 10px 24px; border: 1px solid rgba(0,212,255,0.4); color: #00d4ff; text-decoration: none; border-radius: 10px; font-weight: 600; font-size: 13px;">Review Queued Jobs</a>
      </p>
    </div>
    ` : ''}

    ${digest.jobsBlocked > 0 ? `
    <!-- Blocked -->
    <div style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; padding: 28px; margin-bottom: 20px;">
      <h2 style="margin: 0 0 12px; font-size: 16px; font-weight: 700; color: rgba(255,255,255,0.6); text-transform: uppercase; letter-spacing: 1px;">Blocked</h2>
      <div style="background: rgba(248,113,113,0.1); border: 1px solid rgba(248,113,113,0.2); border-radius: 10px; padding: 14px 18px;">
        <span style="font-size: 14px; color: rgba(255,255,255,0.7);">
          <strong style="color: #f87171;">${digest.jobsBlocked}</strong> job${digest.jobsBlocked !== 1 ? 's were' : ' was'} blocked
          ${digest.scamsDetected > 0 ? ` (including <strong style="color: #f87171;">${digest.scamsDetected}</strong> potential scam${digest.scamsDetected !== 1 ? 's' : ''})` : ''}
        </span>
      </div>
      <p style="margin: 12px 0 0; font-size: 13px; color: rgba(255,255,255,0.4);">
        Blocked jobs didn't meet your auto-apply criteria or were flagged by our safety checks.
        <a href="${APP_URL}/dashboard/jobs?filter=blocked" style="color: #00d4ff; text-decoration: none;">View details</a>
      </p>
    </div>
    ` : ''}

    <!-- CTA -->
    <div style="text-align: center; margin: 24px 0;">
      <a href="${APP_URL}/dashboard" style="display: inline-block; padding: 14px 36px; background: linear-gradient(135deg, #00d4ff, #a855f7); color: #fff; text-decoration: none; border-radius: 12px; font-weight: 700; font-size: 16px;">View Dashboard</a>
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

// ─── Plain Text Fallback ────────────────────────

function buildAutoApplyDigestPlainText(name: string, digest: AutoApplyDigest): string {
  const displayName = name || 'there';

  let text = `Auto-Apply Digest\n`;
  text += `Hi ${displayName}, here's what happened while you were away.\n\n`;

  text += `SUMMARY\n`;
  text += `- Jobs Discovered: ${digest.jobsDiscovered}\n`;
  text += `- Auto-Applied: ${digest.jobsAutoApplied}\n`;
  text += `- Queued for Review: ${digest.jobsQueued}\n`;
  text += `- Blocked: ${digest.jobsBlocked}\n`;
  if (digest.scamsDetected > 0) {
    text += `- Scams Detected: ${digest.scamsDetected}\n`;
  }
  text += `\n`;

  if (digest.appliedJobs.length > 0) {
    text += `APPLIED JOBS\n`;
    digest.appliedJobs.forEach((job, i) => {
      text += `${i + 1}. ${job.title} at ${job.company} - ${Math.round(job.matchScore)}% match (${job.method})\n`;
    });
    text += `\n`;
  }

  if (digest.queuedJobs.length > 0) {
    text += `QUEUED FOR REVIEW\n`;
    digest.queuedJobs.forEach((job, i) => {
      text += `${i + 1}. ${job.title} at ${job.company}${job.matchScore !== undefined ? ` - ${Math.round(job.matchScore)}%` : ''}${job.reason ? ` (${job.reason})` : ''}\n`;
    });
    text += `\n`;
  }

  if (digest.jobsBlocked > 0) {
    text += `BLOCKED\n`;
    text += `${digest.jobsBlocked} job${digest.jobsBlocked !== 1 ? 's were' : ' was'} blocked`;
    if (digest.scamsDetected > 0) {
      text += ` (including ${digest.scamsDetected} potential scam${digest.scamsDetected !== 1 ? 's' : ''})`;
    }
    text += `.\n\n`;
  }

  text += `View your dashboard: ${APP_URL}/dashboard\n\n`;
  text += `---\n3BOX AI by OFORO AI\nManage preferences: ${APP_URL}/settings\n`;

  return text;
}

// ─── Send Function ──────────────────────────────

/**
 * Send an auto-apply digest email and mark it as sent.
 * Returns true if sent successfully, false otherwise.
 */
export async function sendAutoApplyDigestEmail({
  email,
  name,
  digest,
}: SendAutoApplyDigestParams): Promise<boolean> {
  try {
    const subject = `3BOX AI applied to ${digest.jobsAutoApplied} job${digest.jobsAutoApplied !== 1 ? 's' : ''} while you were away`;

    // Replace unsubscribe placeholder with actual email
    const html = buildAutoApplyDigestHtml(name, digest).replace('{{EMAIL}}', email);
    const text = buildAutoApplyDigestPlainText(name, digest);

    const result = await sendEmail({ to: email, subject, html, text });

    if (result.error) {
      console.error(`[AutoApplyDigest] Failed to send to ${email}:`, result.error);
      return false;
    }

    // Mark the digest as emailSent=true
    try {
      await prisma.emailLog.create({
        data: {
          userId: '', // Populated by caller if available; log exists for auditing
          type: 'AUTO_APPLY_DIGEST',
          subject,
          to: email,
          status: 'sent',
          messageId: result.id,
        },
      });
    } catch {
      // Non-critical -- don't fail the digest if logging fails
    }

    console.log(`[AutoApplyDigest] Sent to ${email}: ${digest.jobsAutoApplied} applied, ${digest.jobsQueued} queued, ${digest.jobsBlocked} blocked`);
    return true;
  } catch (err) {
    console.error(`[AutoApplyDigest] Error sending to ${email}:`, err);
    return false;
  }
}
