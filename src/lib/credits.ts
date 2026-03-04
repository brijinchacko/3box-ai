/**
 * AI Credit utility — checks if user is running low and sends email alerts
 */
import { prisma } from '@/lib/db/prisma';
import { sendCreditLowEmail } from '@/lib/email';

const LOW_CREDIT_THRESHOLDS = [3, 1]; // Send alert at 3 and 1 credits remaining

export async function checkAndAlertLowCredits(userId: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, name: true, aiCreditsUsed: true, aiCreditsLimit: true, plan: true },
    });

    if (!user?.email || !user.aiCreditsLimit || user.aiCreditsLimit < 0) return; // unlimited

    const remaining = user.aiCreditsLimit - user.aiCreditsUsed;

    if (!LOW_CREDIT_THRESHOLDS.includes(remaining)) return;

    // Check if we already sent a low credit email today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const alreadySent = await prisma.emailLog.findFirst({
      where: {
        userId,
        type: 'CREDIT_LOW',
        createdAt: { gte: today },
      },
    });

    if (alreadySent) return;

    await sendCreditLowEmail(user.email, user.name || 'there', remaining);

    // Log the email
    await prisma.emailLog.create({
      data: {
        userId,
        type: 'CREDIT_LOW',
        subject: `You have ${remaining} AI credits remaining`,
        to: user.email,
        status: 'sent',
      },
    });
  } catch (err) {
    console.error('[Credits] Low credit check failed:', err);
  }
}
