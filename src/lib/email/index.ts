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

const FROM_EMAIL = process.env.EMAIL_FROM || 'NXTED AI <hello@nxted.ai>';
// Use NEXTAUTH_URL (runtime) — NEXT_PUBLIC_APP_URL is inlined at build time by Next.js
const APP_URL = process.env.NEXTAUTH_URL || 'https://nxted.ai';

// ─── Core send function ──────────────────────────

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail({ to, subject, html, text }: SendEmailParams): Promise<{ id?: string; error?: string }> {
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
      <div class="logo">NXTED AI</div>
      <p class="text-muted">AI Career Operating System</p>
    </div>
    ${content}
    <div class="footer">
      <p class="text-muted">
        NXTED AI by OFORO AI<br>
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
    login: `${code} is your NXTED AI login code`,
    signup: `${code} — Verify your email for NXTED AI`,
    reset: `${code} — Reset your NXTED AI password`,
  };

  const headings = {
    login: 'Your Login Code',
    signup: 'Verify Your Email',
    reset: 'Password Reset Code',
  };

  const descriptions = {
    login: 'Use the code below to sign in to your NXTED AI account. This code expires in 10 minutes.',
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
    text: `Your NXTED AI verification code is: ${code}. It expires in 10 minutes.`,
  });
}

// ─── Welcome Email ──────────────────────────────

export async function sendWelcomeEmail(to: string, name: string) {
  return sendEmail({
    to,
    subject: `Welcome to NXTED AI, ${name || 'there'}! Your career journey starts now`,
    html: baseTemplate(`
      <div class="card">
        <h2>Welcome aboard, ${name || 'there'}! &#127881;</h2>
        <p>You've just joined the most advanced AI career platform. Here's what you can do right now:</p>
        <table width="100%" cellpadding="0" cellspacing="0" style="margin: 16px 0;">
          <tr>
            <td style="padding: 12px 0; border-bottom: 1px solid rgba(255,255,255,0.05);">
              <strong style="color: #00d4ff;">1.</strong> Take your first skill assessment
            </td>
          </tr>
          <tr>
            <td style="padding: 12px 0; border-bottom: 1px solid rgba(255,255,255,0.05);">
              <strong style="color: #00d4ff;">2.</strong> Get your personalized career roadmap
            </td>
          </tr>
          <tr>
            <td style="padding: 12px 0; border-bottom: 1px solid rgba(255,255,255,0.05);">
              <strong style="color: #00d4ff;">3.</strong> Build an ATS-optimized resume
            </td>
          </tr>
          <tr>
            <td style="padding: 12px 0;">
              <strong style="color: #00d4ff;">4.</strong> Get matched with dream jobs
            </td>
          </tr>
        </table>
        <p style="text-align: center; margin-top: 24px;">
          <a href="${APP_URL}/dashboard" class="btn">Go to Dashboard</a>
        </p>
      </div>
      <div class="card" style="text-align: center;">
        <p class="text-muted text-sm">Your account includes <strong style="color: #fff;">10 free AI credits</strong> to explore all features.</p>
        <p class="text-muted text-sm">Need unlimited access? <a href="${APP_URL}/pricing">View plans</a></p>
      </div>
    `),
  });
}

// ─── Email Verified Confirmation ────────────────

export async function sendEmailVerifiedEmail(to: string, name: string) {
  return sendEmail({
    to,
    subject: 'Email verified — Your NXTED AI account is ready',
    html: baseTemplate(`
      <div class="card" style="text-align: center;">
        <div style="font-size: 48px; margin-bottom: 16px;">&#9989;</div>
        <h2>Email Verified!</h2>
        <p>Hi ${name || 'there'}, your email has been successfully verified. Your NXTED AI account is now fully activated.</p>
        <p style="margin-top: 24px;">
          <a href="${APP_URL}/dashboard" class="btn">Start Using NXTED AI</a>
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
        <p>You've been using NXTED AI for a week now. Upgrade to Pro and get:</p>
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
    subject: `Welcome to NXTED AI ${plan} — You're all set!`,
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
    subject: 'Your NXTED AI subscription has been canceled',
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
    subject: 'Action needed: Payment failed for your NXTED AI subscription',
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
    subject: `${referrerName} invited you to NXTED AI — Get 1 month Pro free`,
    html: baseTemplate(`
      <div class="card">
        <h2>${referrerName} thinks you'd love NXTED AI</h2>
        <p>You've been invited to join the most advanced AI career platform. Sign up and both you and ${referrerName} get <strong>1 month of Pro</strong> free!</p>
        <p style="text-align: center; margin-top: 24px;">
          <a href="${APP_URL}/signup?ref=${referralCode}" class="btn">Join NXTED AI Free</a>
        </p>
      </div>
    `),
  });
}

// ─── Password Reset Email ───────────────────────

export async function sendPasswordResetEmail(to: string, resetToken: string) {
  return sendEmail({
    to,
    subject: 'Reset your NXTED AI password',
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
    subject: `Security alert: ${activity} on your NXTED AI account`,
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
