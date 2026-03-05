import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin';
import { sendEmail } from '@/lib/email';

const getPrisma = () => require('@/lib/db/prisma').prisma;

export async function POST(req: NextRequest) {
  const { error, status } = await requireAdmin();
  if (error) return NextResponse.json({ error }, { status });

  const prisma = getPrisma();
  const body = await req.json();
  const { subject, content } = body;

  if (!subject || !content) {
    return NextResponse.json({ error: 'Subject and content are required' }, { status: 400 });
  }

  // Create campaign record
  const campaign = await prisma.newsletterCampaign.create({
    data: { subject, content, status: 'draft' },
  });

  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({
      campaign,
      message: 'Campaign saved as draft. Email sending not configured — set RESEND_API_KEY in .env to send.',
    });
  }

  // Get active subscribers
  const subscribers = await prisma.newsletterSubscriber.findMany({
    where: { active: true },
    select: { email: true },
  });

  if (subscribers.length === 0) {
    await prisma.newsletterCampaign.update({
      where: { id: campaign.id },
      data: { status: 'failed' },
    });
    return NextResponse.json({ error: 'No active subscribers' }, { status: 400 });
  }

  // Update status to sending
  await prisma.newsletterCampaign.update({
    where: { id: campaign.id },
    data: { status: 'sending' },
  });

  // Send emails (in batches of 10)
  let sentCount = 0;
  const emails = subscribers.map((s: { email: string }) => s.email);

  for (let i = 0; i < emails.length; i += 10) {
    const batch = emails.slice(i, i + 10);
    const results = await Promise.allSettled(
      batch.map((email: string) =>
        sendEmail({
          to: email,
          subject,
          html: content,
        })
      )
    );
    sentCount += results.filter((r) => r.status === 'fulfilled').length;
  }

  // Update campaign
  await prisma.newsletterCampaign.update({
    where: { id: campaign.id },
    data: {
      status: 'sent',
      sentCount,
      sentAt: new Date(),
    },
  });

  return NextResponse.json({ campaign: { ...campaign, status: 'sent', sentCount } });
}
