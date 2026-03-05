/**
 * Newsletter utility — Shared helper for sending newsletters
 * Used by admin blog publish, changelog, and newsletter campaign routes.
 */
import { sendEmail } from '@/lib/email';

const getPrisma = () => require('@/lib/db/prisma').prisma;
const APP_URL = process.env.NEXTAUTH_URL || 'https://nxted.ai';

function newsletterTemplate(content: string, unsubscribeEmail: string): string {
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
    .content { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; padding: 32px; margin-bottom: 24px; }
    .footer { text-align: center; margin-top: 40px; padding-top: 24px; border-top: 1px solid rgba(255,255,255,0.05); }
    .text-muted { color: rgba(255,255,255,0.4); font-size: 14px; }
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
    <div class="content">
      ${content}
    </div>
    <div class="footer">
      <p class="text-muted">
        NXTED AI by OFORO AI<br>
        <a href="${APP_URL}/api/newsletter/unsubscribe?email=${encodeURIComponent(unsubscribeEmail)}">Unsubscribe</a> &bull;
        <a href="${APP_URL}/security">Privacy Policy</a>
      </p>
    </div>
  </div>
</body>
</html>`;
}

/**
 * Send a newsletter to all active subscribers.
 * Creates a NewsletterCampaign record and sends emails in batches.
 */
export async function sendNewsletterCampaign(subject: string, htmlContent: string): Promise<{
  campaignId: string;
  sentCount: number;
  error?: string;
}> {
  const prisma = getPrisma();

  // Create campaign record
  const campaign = await prisma.newsletterCampaign.create({
    data: { subject, content: htmlContent, status: 'draft' },
  });

  if (!process.env.RESEND_API_KEY) {
    return {
      campaignId: campaign.id,
      sentCount: 0,
      error: 'Email sending not configured — campaign saved as draft',
    };
  }

  const subscribers = await prisma.newsletterSubscriber.findMany({
    where: { active: true },
    select: { email: true },
  });

  if (subscribers.length === 0) {
    await prisma.newsletterCampaign.update({
      where: { id: campaign.id },
      data: { status: 'failed' },
    });
    return { campaignId: campaign.id, sentCount: 0, error: 'No active subscribers' };
  }

  await prisma.newsletterCampaign.update({
    where: { id: campaign.id },
    data: { status: 'sending' },
  });

  let sentCount = 0;
  const emails = subscribers.map((s: { email: string }) => s.email);

  for (let i = 0; i < emails.length; i += 10) {
    const batch = emails.slice(i, i + 10);
    const results = await Promise.allSettled(
      batch.map((email: string) =>
        sendEmail({
          to: email,
          subject,
          html: newsletterTemplate(htmlContent, email),
        })
      )
    );
    sentCount += results.filter((r) => r.status === 'fulfilled').length;
  }

  await prisma.newsletterCampaign.update({
    where: { id: campaign.id },
    data: { status: 'sent', sentCount, sentAt: new Date() },
  });

  return { campaignId: campaign.id, sentCount };
}

/**
 * Create a newsletter from a blog post.
 */
export function blogToNewsletterHtml(title: string, excerpt: string, slug: string): string {
  return `
    <h2>${title}</h2>
    <p>${excerpt}</p>
    <p style="text-align: center; margin-top: 24px;">
      <a href="${APP_URL}/blog/${slug}" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #00d4ff, #a855f7); color: #fff; text-decoration: none; border-radius: 12px; font-weight: 600;">Read Full Article</a>
    </p>
  `;
}

/**
 * Create a newsletter from a changelog entry.
 */
export function changelogToNewsletterHtml(title: string, content: string, category: string): string {
  const categoryLabel = category.charAt(0).toUpperCase() + category.slice(1);
  return `
    <div style="display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; background: rgba(0,212,255,0.15); color: #00d4ff; margin-bottom: 16px;">${categoryLabel}</div>
    <h2>${title}</h2>
    <p>${content}</p>
    <p style="text-align: center; margin-top: 24px;">
      <a href="${APP_URL}/changelog" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #00d4ff, #a855f7); color: #fff; text-decoration: none; border-radius: 12px; font-weight: 600;">View All Updates</a>
    </p>
  `;
}
