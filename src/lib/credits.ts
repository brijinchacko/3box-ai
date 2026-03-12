/**
 * Application limit utility — checks if user is approaching their application limit
 * and sends email alerts.
 *
 * FREE plan: 10 lifetime applications
 * PRO plan:  20 applications / day
 * MAX plan:  50 applications / day
 */
import { prisma } from '@/lib/db/prisma';
import { sendCreditLowEmail } from '@/lib/email';
import { normalizePlan, APP_LIMITS, getApplicationsRemaining } from '@/lib/tokens/pricing';

const LOW_REMAINING_THRESHOLDS = [3, 1]; // Send alert at 3 and 1 remaining

export async function checkAndAlertLowApplications(userId: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, name: true, plan: true, totalAppsUsed: true, dailyAppsUsed: true },
    });

    if (!user?.email) return;

    const plan = normalizePlan(user.plan);
    const remaining = getApplicationsRemaining(plan, user.totalAppsUsed, user.dailyAppsUsed);

    if (!LOW_REMAINING_THRESHOLDS.includes(remaining)) return;

    // Check if we already sent an alert today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const alreadySent = await prisma.emailLog.findFirst({
      where: {
        userId,
        type: 'CREDIT_LOW' as any,
        createdAt: { gte: today },
      },
    });

    if (alreadySent) return;

    const limitLabel = APP_LIMITS[plan].type === 'lifetime' ? 'lifetime' : 'daily';
    await sendCreditLowEmail(user.email, user.name || 'there', remaining);

    await prisma.emailLog.create({
      data: {
        userId,
        type: 'CREDIT_LOW' as any,
        subject: `You have ${remaining} ${limitLabel} job applications remaining`,
        to: user.email,
        status: 'sent',
      },
    });
  } catch (err) {
    console.error('[Applications] Low application limit check failed:', err);
  }
}
