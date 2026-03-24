/**
 * Email System using Resend
 * Handles transactional emails, OTP, and drip campaigns
 */
import { Resend } from 'resend';

let _resend: Resend | null = null;
function getResend() {
  if (!_resend && process.env.RESEND_API_KEY) {
    _resend = new Resend(process.env.RESEND_API_KEY);
  }
  return _resend;
}

const FROM_EMAIL = process.env.EMAIL_FROM || '3BOX AI <nishinth.m@wartens.com>';
// Use NEXTAUTH_URL (runtime) — NEXT_PUBLIC_APP_URL is inlined at build time by Next.js
const APP_URL = process.env.NEXTAUTH_URL || 'https://3box.ai';

// ─── Core send function ──────────────────────────

interface EmailAttachment {
  filename: string;
  content: Buffer;
  contentType?: string;
}

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  text?: string;
  attachments?: EmailAttachment[];
}

export async function sendEmail({ to, subject, html, text, attachments }: SendEmailParams): Promise<{ id?: string; error?: string }> {
  if (!process.env.RESEND_API_KEY) {
    console.log(`[Email] Would send to ${to}: ${subject}`);
    return { id: 'demo-mode' };
  }

  try {
    const resend = getResend();
    if (!resend) return { error: 'Email not configured' };
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject,
      html,
      text,
      ...(attachments?.length ? {
        attachments: attachments.map(a => ({
          filename: a.filename,
          content: a.content,
          content_type: a.contentType,
        })),
      } : {}),
    });

    if (error) {
      console.error('[Email] Send error:', error);
      return { error: error.message };
    }

    return { id: data?.id };
  } catch (err: any) {
    console.error('[Email] Exception:', err.message);
    return { error: err.message };
  }
}

// ─── Base Template ──────────────────────────────

function baseTemplate(content: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0a0a0f; color: #ffffff; }
    .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
    .header { text-align: center; margin-bottom: 32px; }
    .logo { font-size: 24px; font-weight: 800; background: linear-gradient(135deg, #00d4ff, #a855f7); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
    .card { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; padding: 32px; margin-bottom: 24px; }
    .btn { display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #00d4ff, #a855f7); color: #fff; text-decoration: none; border-radius: 12px; font-weight: 600; font-size: 16px; }
    .otp-code { font-size: 36px; font-weight: 800; letter-spacing: 8px; text-align: center; padding: 20px; background: rgba(0,212,255,0.1); border: 2px dashed rgba(0,212,255,0.3); border-radius: 12px; margin: 24px 0; color: #00d4ff; font-family: monospace; }
    .text-muted { color: rgba(255,255,255,0.4); font-size: 14px; }
    .text-sm { font-size: 14px; }
    .stat-row { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid rgba(255,255,255,0.05); }
    .stat-label { color: rgba(255,255,255,0.4); }
    .stat-value { font-weight: 600; }
    .badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; }
    .badge-green { background: rgba(52,211,153,0.15); color: #34d399; }
    .badge-blue { background: rgba(0,212,255,0.15); color: #00d4ff; }
    .badge-purple { background: rgba(168,85,247,0.15); color: #a855f7; }
    .footer { text-align: center; margin-top: 40px; padding-top: 24px; border-top: 1px solid rgba(255,255,255,0.05); }
    h1, h2, h3 { margin: 0 0 16px 0; }
    p { margin: 0 0 16px 0; line-height: 1.6; }
    a { color: #00d4ff; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">3BOX AI</div>
      <p class="text-muted">AI Career Operating System</p>
    </div>
    ${content}
    <div class="footer">
      <p class="text-muted">
        3BOX AI by OFORO AI<br>
        <a href="${APP_URL}/settings">Manage preferences</a> &bull;
        <a href="${APP_URL}/security">Privacy Policy</a>
      </p>
    </div>
  </div>
</body>
</html>`;
}

// ─── OTP Emails ─────────────────────────────────

export async function sendOtpEmail(to: string, code: string, type: 'login' | 'signup' | 'reset' = 'login') {
  const subjects = {
    login: `${code} is your 3BOX AI login code`,
    signup: `${code} — Verify your email for 3BOX AI`,
    reset: `${code} — Reset your 3BOX AI password`,
  };

  const headings = {
    login: 'Your Login Code',
    signup: 'Verify Your Email',
    reset: 'Password Reset Code',
  };

  const descriptions = {
    login: 'Use the code below to sign in to your 3BOX AI account. This code expires in 10 minutes.',
    signup: 'Use the code below to verify your email address and complete your registration. This code expires in 10 minutes.',
    reset: 'Use the code below to reset your password. This code expires in 10 minutes.',
  };

  return sendEmail({
    to,
    subject: subjects[type],
    html: baseTemplate(`
      <div class="card">
        <h2>${headings[type]}</h2>
        <p>${descriptions[type]}</p>
        <div class="otp-code">${code}</div>
        <p class="text-muted text-sm" style="text-align: center;">If you didn't request this code, you can safely ignore this email.</p>
      </div>
    `),
    text: `Your 3BOX AI verification code is: ${code}. It expires in 10 minutes.`,
  });
}

// ─── Welcome Email ──────────────────────────────

export async function sendWelcomeEmail(to: string, name: string) {
  const firstName = (name || 'there').split(' ')[0];
  return sendEmail({
    to,
    subject: `Welcome to 3BOX AI, ${firstName}! Your AI career platform is ready`,
    html: baseTemplate(`
      <div class="card">
        <div style="text-align: center; margin-bottom: 20px;">
          <h2 style="margin-bottom: 8px;">Welcome to 3BOX AI, ${firstName}!</h2>
          <p style="color: #94a3b8; margin: 0;">Your AI-powered career platform is set up and ready to go.</p>
        </div>

        <table width="100%" cellpadding="0" cellspacing="0" style="margin: 24px 0;">
          <tr>
            <td style="padding: 14px 16px; background: #EFF6FF; border-radius: 8px; border-left: 4px solid #3B82F6;">
              <table cellpadding="0" cellspacing="0"><tr>
                <td style="width: 36px; vertical-align: top;"><span style="display: inline-block; width: 28px; height: 28px; background: #3B82F6; border-radius: 50%; text-align: center; line-height: 28px; font-size: 14px; color: #fff; font-weight: bold;">1</span></td>
                <td style="padding-left: 12px;"><strong style="color: #1E3A5F; font-size: 15px;">Upload your resume</strong><br/><span style="color: #475569; font-size: 13px;">AI extracts your details and builds an ATS-optimized version</span></td>
              </tr></table>
            </td>
          </tr>
          <tr><td style="height: 10px;"></td></tr>
          <tr>
            <td style="padding: 14px 16px; background: #F5F3FF; border-radius: 8px; border-left: 4px solid #7C3AED;">
              <table cellpadding="0" cellspacing="0"><tr>
                <td style="width: 36px; vertical-align: top;"><span style="display: inline-block; width: 28px; height: 28px; background: #7C3AED; border-radius: 50%; text-align: center; line-height: 28px; font-size: 14px; color: #fff; font-weight: bold;">2</span></td>
                <td style="padding-left: 12px;"><strong style="color: #1E3A5F; font-size: 15px;">Let AI agents find jobs for you</strong><br/><span style="color: #475569; font-size: 13px;">Scout searches 6+ platforms and matches jobs to your skills</span></td>
              </tr></table>
            </td>
          </tr>
          <tr><td style="height: 10px;"></td></tr>
          <tr>
            <td style="padding: 14px 16px; background: #FDF2F8; border-radius: 8px; border-left: 4px solid #EC4899;">
              <table cellpadding="0" cellspacing="0"><tr>
                <td style="width: 36px; vertical-align: top;"><span style="display: inline-block; width: 28px; height: 28px; background: #EC4899; border-radius: 50%; text-align: center; line-height: 28px; font-size: 14px; color: #fff; font-weight: bold;">3</span></td>
                <td style="padding-left: 12px;"><strong style="color: #1E3A5F; font-size: 15px;">Apply with one click</strong><br/><span style="color: #475569; font-size: 13px;">AI generates cover letters, tailors your resume, and submits applications</span></td>
              </tr></table>
            </td>
          </tr>
        </table>

        <div style="background: #F1F5F9; border: 1px solid #E2E8F0; border-radius: 8px; padding: 16px; margin: 20px 0; text-align: center;">
          <p style="margin: 0 0 4px; color: #64748B; font-size: 13px;">Your free plan includes</p>
          <p style="margin: 0; color: #1E293B; font-size: 15px;"><strong>5 job applications/week</strong> &bull; <strong>Unlimited AI tools</strong> &bull; <strong>All 6 AI agents</strong></p>
        </div>

        <p style="text-align: center; margin-top: 24px;">
          <a href="${APP_URL}/dashboard" class="btn">Go to Dashboard</a>
        </p>
      </div>
    `),
  });
}

// ─── Email Verified Confirmation ────────────────

export async function sendEmailVerifiedEmail(to: string, name: string) {
  return sendEmail({
    to,
    subject: 'Email verified — Your 3BOX AI account is ready',
    html: baseTemplate(`
      <div class="card" style="text-align: center;">
        <div style="font-size: 48px; margin-bottom: 16px;">&#9989;</div>
        <h2>Email Verified!</h2>
        <p>Hi ${name || 'there'}, your email has been successfully verified. Your 3BOX AI account is now fully activated.</p>
        <p style="margin-top: 24px;">
          <a href="${APP_URL}/dashboard" class="btn">Start Using 3BOX AI</a>
        </p>
      </div>
    `),
  });
}

// ─── Onboarding Drip Emails ─────────────────────

export async function sendOnboardingDay2(to: string, name: string) {
  return sendEmail({
    to,
    subject: `${name}, your career roadmap is waiting`,
    html: baseTemplate(`
      <div class="card">
        <h2>Your Career Roadmap is Ready</h2>
        <p>Hi ${name},</p>
        <p>Based on your profile, our AI has started building a personalized career plan. Complete your first assessment to unlock:</p>
        <p>&#10003; Skill gap analysis<br>
        &#10003; Personalized learning path<br>
        &#10003; Market readiness score</p>
        <p style="text-align: center; margin-top: 24px;">
          <a href="${APP_URL}/dashboard/assessment" class="btn">Take Assessment</a>
        </p>
      </div>
    `),
  });
}

export async function sendOnboardingDay5(to: string, name: string) {
  return sendEmail({
    to,
    subject: `3 jobs match your profile, ${name}`,
    html: baseTemplate(`
      <div class="card">
        <h2>New Job Matches Found</h2>
        <p>Hi ${name},</p>
        <p>Our AI has found job opportunities that match your skills. Log in to see your fit scores and get improvement tips for each role.</p>
        <p style="text-align: center; margin-top: 24px;">
          <a href="${APP_URL}/dashboard/jobs" class="btn">View Job Matches</a>
        </p>
      </div>
    `),
  });
}

export async function sendOnboardingDay7(to: string, name: string) {
  return sendEmail({
    to,
    subject: `Unlock your full potential — 40% off Pro, ${name}`,
    html: baseTemplate(`
      <div class="card">
        <h2>Special Offer: 40% Off Pro Plan</h2>
        <p>Hi ${name},</p>
        <p>You've been using 3BOX AI for a week now. Upgrade to Pro and get:</p>
        <p>&#10003; Unlimited AI-powered assessments<br>
        &#10003; 500 AI credits per month<br>
        &#10003; All resume templates + unlimited exports<br>
        &#10003; Full career plan with timeline<br>
        &#10003; AI job matching with fit reports</p>
        <p style="text-align: center; margin-top: 24px;">
          <a href="${APP_URL}/pricing" class="btn">Get 40% Off Pro</a>
        </p>
        <p class="text-muted text-sm" style="text-align: center;">Offer valid for 48 hours. Use code WELCOME40 at checkout.</p>
      </div>
    `),
  });
}

// ─── Credit & Subscription Emails ───────────────

export async function sendCreditLowEmail(to: string, name: string, creditsLeft: number) {
  return sendEmail({
    to,
    subject: `You have ${creditsLeft} AI credits remaining`,
    html: baseTemplate(`
      <div class="card">
        <h2>Running Low on AI Credits</h2>
        <p>Hi ${name},</p>
        <p>You have <strong>${creditsLeft} AI credits</strong> remaining this month. Don't let your momentum stop!</p>
        <p style="text-align: center; margin-top: 24px;">
          <a href="${APP_URL}/dashboard/settings" class="btn">Buy More Credits</a>
        </p>
        <p class="text-muted text-sm" style="text-align: center;">Or upgrade your plan for more monthly credits.</p>
      </div>
    `),
  });
}

export async function sendSubscriptionConfirmEmail(to: string, name: string, plan: string) {
  return sendEmail({
    to,
    subject: `Welcome to 3BOX AI ${plan} — You're all set!`,
    html: baseTemplate(`
      <div class="card">
        <h2>Subscription Confirmed! &#127881;</h2>
        <p>Hi ${name},</p>
        <p>Your <strong>${plan} plan</strong> is now active. You now have access to all ${plan} features.</p>
        <p style="text-align: center; margin-top: 24px;">
          <a href="${APP_URL}/dashboard" class="btn">Go to Dashboard</a>
        </p>
      </div>
    `),
  });
}

export async function sendSubscriptionCanceledEmail(to: string, name: string, endsAt: string) {
  return sendEmail({
    to,
    subject: 'Your 3BOX AI subscription has been canceled',
    html: baseTemplate(`
      <div class="card">
        <h2>Subscription Canceled</h2>
        <p>Hi ${name},</p>
        <p>Your subscription has been canceled. You'll still have access to your current plan features until <strong>${endsAt}</strong>.</p>
        <p>After that, your account will revert to the Basic plan with 10 AI credits per month.</p>
        <p style="text-align: center; margin-top: 24px;">
          <a href="${APP_URL}/pricing" class="btn">Resubscribe Anytime</a>
        </p>
        <p class="text-muted text-sm">We'd love to have you back. If you have feedback, reply to this email.</p>
      </div>
    `),
  });
}

export async function sendPaymentFailedEmail(to: string, name: string) {
  return sendEmail({
    to,
    subject: 'Action needed: Payment failed for your 3BOX AI subscription',
    html: baseTemplate(`
      <div class="card">
        <h2>Payment Failed</h2>
        <p>Hi ${name},</p>
        <p>We couldn't process your latest payment. Please update your payment method to keep your subscription active.</p>
        <p style="text-align: center; margin-top: 24px;">
          <a href="${APP_URL}/dashboard/settings" class="btn">Update Payment</a>
        </p>
        <p class="text-muted text-sm">If your payment isn't updated within 7 days, your account will be downgraded to Basic.</p>
      </div>
    `),
  });
}

// ─── Referral Email ─────────────────────────────

export async function sendReferralInviteEmail(to: string, referrerName: string, referralCode: string) {
  return sendEmail({
    to,
    subject: `${referrerName} invited you to 3BOX AI — Get +5 extra applications`,
    html: baseTemplate(`
      <div class="card">
        <h2>${referrerName} thinks you'd love 3BOX AI</h2>
        <p>You've been invited to join the most advanced AI career platform. Sign up and both you and ${referrerName} get <strong>+5 extra applications</strong> this week!</p>
        <p style="text-align: center; margin-top: 24px;">
          <a href="${APP_URL}/signup?ref=${referralCode}" class="btn">Join 3BOX AI Free</a>
        </p>
      </div>
    `),
  });
}

// ─── Password Reset Email ───────────────────────

export async function sendPasswordResetEmail(to: string, resetToken: string) {
  return sendEmail({
    to,
    subject: 'Reset your 3BOX AI password',
    html: baseTemplate(`
      <div class="card">
        <h2>Password Reset Request</h2>
        <p>Click the button below to reset your password. This link expires in 1 hour.</p>
        <p style="text-align: center; margin-top: 24px;">
          <a href="${APP_URL}/reset-password?token=${resetToken}" class="btn">Reset Password</a>
        </p>
        <p class="text-muted text-sm">If you didn't request this, you can safely ignore this email.</p>
      </div>
    `),
  });
}

// ─── Account Activity Email ─────────────────────

export async function sendAccountActivityEmail(to: string, name: string, activity: string, details: string) {
  return sendEmail({
    to,
    subject: `Security alert: ${activity} on your 3BOX AI account`,
    html: baseTemplate(`
      <div class="card">
        <h2>Account Activity Detected</h2>
        <p>Hi ${name},</p>
        <p>We noticed the following activity on your account:</p>
        <div style="background: rgba(255,255,255,0.03); border-radius: 8px; padding: 16px; margin: 16px 0;">
          <p style="margin: 0;"><strong>${activity}</strong></p>
          <p class="text-muted text-sm" style="margin: 8px 0 0 0;">${details}</p>
        </div>
        <p class="text-muted text-sm">If this was you, no action is needed. If you don't recognize this activity, please <a href="${APP_URL}/forgot-password">reset your password</a> immediately.</p>
      </div>
    `),
  });
}

// ─── Weekly Career Digest Email ─────────────────
// The enhanced weekly digest is now in src/lib/email/digest.ts
// which includes: stats, top unfilled jobs, career twin, skill gaps.
// Use sendWeeklyDigest(userId) from '@/lib/email/digest' for the full version.
// The legacy function below is kept for backward compatibility.

export async function sendWeeklyDigestEmail(
  to: string,
  name: string,
  stats: {
    assessmentsDone?: number;
    resumesCreated?: number;
    jobsMatched?: number;
    creditsUsed?: number;
    creditsRemaining?: number;
    marketReadiness?: number;
    hireProb?: number;
  }
) {
  return sendEmail({
    to,
    subject: `Your weekly career update, ${name}`,
    html: baseTemplate(`
      <div class="card">
        <h2>Your Weekly Career Digest</h2>
        <p>Hi ${name}, here's your career progress this week:</p>
        <table width="100%" cellpadding="0" cellspacing="0" style="margin: 16px 0;">
          ${stats.marketReadiness !== undefined ? `
          <tr>
            <td style="padding: 12px 0; border-bottom: 1px solid rgba(255,255,255,0.05); color: rgba(255,255,255,0.4);">Market Readiness</td>
            <td style="padding: 12px 0; border-bottom: 1px solid rgba(255,255,255,0.05); text-align: right; font-weight: 600;">${Math.round(stats.marketReadiness)}%</td>
          </tr>` : ''}
          ${stats.hireProb !== undefined ? `
          <tr>
            <td style="padding: 12px 0; border-bottom: 1px solid rgba(255,255,255,0.05); color: rgba(255,255,255,0.4);">Hire Probability</td>
            <td style="padding: 12px 0; border-bottom: 1px solid rgba(255,255,255,0.05); text-align: right; font-weight: 600;">${Math.round(stats.hireProb)}%</td>
          </tr>` : ''}
          ${stats.assessmentsDone !== undefined ? `
          <tr>
            <td style="padding: 12px 0; border-bottom: 1px solid rgba(255,255,255,0.05); color: rgba(255,255,255,0.4);">Assessments Completed</td>
            <td style="padding: 12px 0; border-bottom: 1px solid rgba(255,255,255,0.05); text-align: right; font-weight: 600;">${stats.assessmentsDone}</td>
          </tr>` : ''}
          ${stats.resumesCreated !== undefined ? `
          <tr>
            <td style="padding: 12px 0; border-bottom: 1px solid rgba(255,255,255,0.05); color: rgba(255,255,255,0.4);">Resumes Created</td>
            <td style="padding: 12px 0; border-bottom: 1px solid rgba(255,255,255,0.05); text-align: right; font-weight: 600;">${stats.resumesCreated}</td>
          </tr>` : ''}
          ${stats.jobsMatched !== undefined ? `
          <tr>
            <td style="padding: 12px 0; border-bottom: 1px solid rgba(255,255,255,0.05); color: rgba(255,255,255,0.4);">Jobs Matched</td>
            <td style="padding: 12px 0; border-bottom: 1px solid rgba(255,255,255,0.05); text-align: right; font-weight: 600;">${stats.jobsMatched}</td>
          </tr>` : ''}
          <tr>
            <td style="padding: 12px 0; color: rgba(255,255,255,0.4);">AI Credits Remaining</td>
            <td style="padding: 12px 0; text-align: right; font-weight: 600;">${stats.creditsRemaining ?? 'N/A'}</td>
          </tr>
        </table>
        <p style="text-align: center; margin-top: 24px;">
          <a href="${APP_URL}/dashboard" class="btn">Continue Your Journey</a>
        </p>
      </div>
    `),
  });
}

// ─── Send Email via User's Connected Account or Fallback to Resend ──

/**
 * Try sending via the user's connected Gmail/Outlook first.
 * Falls back to Resend (company domain) if no connection or send fails.
 */
export async function sendEmailViaUserOrFallback(
  userId: string,
  params: SendEmailParams,
): Promise<{ id?: string; error?: string; sentFrom?: string; provider?: string }> {
  try {
    // Dynamic import to avoid circular deps
    const { sendViaUserEmail, hasConnectedEmail } = await import('@/lib/email/oauth');

    const connected = await hasConnectedEmail(userId);
    if (connected) {
      const result = await sendViaUserEmail(userId, params);
      if (result.success) {
        return { id: result.messageId, sentFrom: result.sentFrom, provider: result.provider };
      }
      console.warn(`[Email] User email failed, falling back to Resend: ${result.error}`);
    }
  } catch (err) {
    console.warn('[Email] OAuth email unavailable, using Resend:', (err as Error).message);
  }

  // Fallback: send via Resend (company domain)
  const result = await sendEmail(params);
  return { ...result, provider: 'resend', sentFrom: FROM_EMAIL };
}

// ─── Job Application Email (Cold Outreach by Archer Agent) ──

export async function sendJobApplicationEmail({
  to,
  candidateName,
  candidateEmail,
  jobTitle,
  company,
  coverLetter,
  resumeUrl,
  resumePdf,
}: {
  to: string;
  candidateName: string;
  candidateEmail: string;
  jobTitle: string;
  company: string;
  coverLetter: string;
  resumeUrl?: string;
  resumePdf?: Buffer;
}): Promise<{ id?: string; error?: string }> {
  const subject = `Application for ${jobTitle} — ${candidateName}`;

  // Use a clean professional template (NOT the branded 3BOX template)
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #ffffff; color: #333333; line-height: 1.6; }
    .container { max-width: 640px; margin: 0 auto; padding: 32px 24px; }
    .greeting { font-size: 16px; margin-bottom: 16px; }
    .body-text { font-size: 15px; margin-bottom: 16px; white-space: pre-wrap; }
    .resume-link { display: inline-block; padding: 12px 28px; background-color: #2563eb; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px; margin: 16px 0; }
    .signature { margin-top: 32px; padding-top: 16px; border-top: 1px solid #e5e7eb; font-size: 14px; color: #6b7280; }
    .signature strong { color: #333333; }
  </style>
</head>
<body>
  <div class="container">
    <div class="greeting">Dear Hiring Manager,</div>
    <div class="body-text">${coverLetter}</div>
    ${resumeUrl ? `<p style="margin: 24px 0;"><a href="${resumeUrl}" class="resume-link">View My Resume</a></p>` : ''}
    <div class="signature">
      <strong>${candidateName}</strong><br>
      <a href="mailto:${candidateEmail}" style="color: #2563eb; text-decoration: none;">${candidateEmail}</a>
    </div>
  </div>
</body>
</html>`;

  const text = `Dear Hiring Manager,\n\n${coverLetter}\n\n${resumeUrl ? `Resume: ${resumeUrl}\n\n` : ''}Best regards,\n${candidateName}\n${candidateEmail}`;

  const attachments: EmailAttachment[] = [];
  if (resumePdf) {
    const safeName = candidateName.replace(/[^a-zA-Z0-9_\- ]/g, '').replace(/\s+/g, '_');
    attachments.push({ filename: `${safeName}_Resume.pdf`, content: resumePdf, contentType: 'application/pdf' });
  }

  return sendEmail({ to, subject, html, text, attachments: attachments.length ? attachments : undefined });
}

// ─── Agent Run Summary Email ────────────────────

export async function sendAgentRunSummaryEmail(
  to: string,
  name: string,
  summary: {
    jobsFound: number;
    jobsApplied: number;
    topMatches: { title: string; company: string; matchScore: number }[];
    agentsUsed: string[];
    creditsUsed: number;
  }
) {
  return sendEmail({
    to,
    subject: `Agent Report: ${summary.jobsFound} jobs found, ${summary.jobsApplied} applications sent`,
    html: baseTemplate(`
      <div class="card">
        <h2>Agent Pipeline Report</h2>
        <p>Hi ${name}, your AI agents just completed a run. Here's the summary:</p>
        <table width="100%" cellpadding="0" cellspacing="0" style="margin: 16px 0;">
          <tr>
            <td style="padding: 12px 0; border-bottom: 1px solid rgba(255,255,255,0.05); color: rgba(255,255,255,0.4);">Jobs Discovered</td>
            <td style="padding: 12px 0; border-bottom: 1px solid rgba(255,255,255,0.05); text-align: right; font-weight: 600;">${summary.jobsFound}</td>
          </tr>
          <tr>
            <td style="padding: 12px 0; border-bottom: 1px solid rgba(255,255,255,0.05); color: rgba(255,255,255,0.4);">Applications Sent</td>
            <td style="padding: 12px 0; border-bottom: 1px solid rgba(255,255,255,0.05); text-align: right; font-weight: 600;">${summary.jobsApplied}</td>
          </tr>
          <tr>
            <td style="padding: 12px 0; border-bottom: 1px solid rgba(255,255,255,0.05); color: rgba(255,255,255,0.4);">Agents Used</td>
            <td style="padding: 12px 0; border-bottom: 1px solid rgba(255,255,255,0.05); text-align: right; font-weight: 600;">${summary.agentsUsed.join(', ')}</td>
          </tr>
          <tr>
            <td style="padding: 12px 0; color: rgba(255,255,255,0.4);">Credits Used</td>
            <td style="padding: 12px 0; text-align: right; font-weight: 600;">${summary.creditsUsed}</td>
          </tr>
        </table>
        ${summary.topMatches.length > 0 ? `
        <h3 style="margin-top: 24px; margin-bottom: 12px; font-size: 14px; color: rgba(255,255,255,0.6);">Top Matches</h3>
        ${summary.topMatches.slice(0, 5).map(job => `
        <div style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.05);">
          <div>
            <div style="font-weight: 600; font-size: 14px;">${job.title}</div>
            <div style="font-size: 12px; color: rgba(255,255,255,0.4);">${job.company}</div>
          </div>
          <div style="text-align: right;">
            <span class="badge badge-green">${job.matchScore}% match</span>
          </div>
        </div>`).join('')}
        ` : ''}
        <p style="text-align: center; margin-top: 24px;">
          <a href="${APP_URL}/dashboard/agents" class="btn">View Full Report</a>
        </p>
      </div>
    `),
  });
}
