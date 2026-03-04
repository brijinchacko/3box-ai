/**
 * Email System using Resend
 * Handles transactional emails and drip campaigns
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
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://nxted.ai';

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

// ─── Email Templates ─────────────────────────────

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
    .text-muted { color: rgba(255,255,255,0.4); font-size: 14px; }
    .text-sm { font-size: 14px; }
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

// ─── Transactional Email Templates ───────────────

export async function sendWelcomeEmail(to: string, name: string) {
  return sendEmail({
    to,
    subject: 'Welcome to NXTED AI — Your career journey starts now',
    html: baseTemplate(`
      <div class="card">
        <h2>Welcome aboard, ${name || 'there'}! &#127881;</h2>
        <p>You've just joined the most advanced AI career platform. Here's what you can do right now:</p>
        <p><strong>1.</strong> Take your first skill assessment<br>
        <strong>2.</strong> Get your personalized career roadmap<br>
        <strong>3.</strong> Build an ATS-optimized resume</p>
        <p style="text-align: center; margin-top: 24px;">
          <a href="${APP_URL}/dashboard" class="btn">Start Your Assessment</a>
        </p>
      </div>
      <p class="text-muted text-sm">You have 10 free AI credits to explore. Upgrade anytime for unlimited access.</p>
    `),
  });
}

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
