/**
 * Analytics event system
 * PostHog-ready with graceful fallback when no provider is loaded.
 */

/* ------------------------------------------------------------------ */
/*  Predefined event constants                                        */
/* ------------------------------------------------------------------ */

export const EVENTS = {
  // Auth
  SIGNUP: 'signup',
  LOGIN: 'login',

  // Assessment
  ASSESSMENT_START: 'assessment_start',
  ASSESSMENT_COMPLETE: 'assessment_complete',

  // Resume
  RESUME_CREATE: 'resume_create',
  RESUME_EXPORT: 'resume_export',

  // Billing
  PLAN_UPGRADE: 'plan_upgrade',
  PLAN_DOWNGRADE: 'plan_downgrade',
  CREDIT_PURCHASE: 'credit_purchase',

  // Jobs
  JOB_MATCH_VIEW: 'job_match_view',

  // Referrals
  REFERRAL_SEND: 'referral_send',
  REFERRAL_CLICK: 'referral_click',

  // Onboarding
  ONBOARDING_COMPLETE: 'onboarding_complete',

  // Free tools
  TOOL_ATS_CHECK: 'tool_ats_check',
  TOOL_SALARY_ESTIMATE: 'tool_salary_estimate',

  // Content
  BLOG_VIEW: 'blog_view',
  NEWSLETTER_SUBSCRIBE: 'newsletter_subscribe',
} as const;

export type AnalyticsEvent = (typeof EVENTS)[keyof typeof EVENTS];

/* ------------------------------------------------------------------ */
/*  Internal helpers                                                   */
/* ------------------------------------------------------------------ */

/** Returns `true` when running in a browser with PostHog on the window. */
function hasPostHog(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof (window as any).posthog?.capture === 'function'
  );
}

/** Returns `true` in a non-production environment. */
function isDev(): boolean {
  return process.env.NODE_ENV !== 'production';
}

/* ------------------------------------------------------------------ */
/*  Public API                                                         */
/* ------------------------------------------------------------------ */

/**
 * Track an analytics event.
 *
 * - In development the event is logged to the console.
 * - When PostHog is loaded on the page it forwards to `posthog.capture`.
 * - Falls back silently if no analytics provider is available.
 */
export function track(
  event: AnalyticsEvent | string,
  properties?: Record<string, unknown>,
): void {
  if (isDev()) {
    // eslint-disable-next-line no-console
    console.log('[analytics] track', event, properties ?? '');
  }

  if (hasPostHog()) {
    (window as any).posthog.capture(event, properties);
  }
}

/**
 * Identify the current user for analytics.
 *
 * - In development the call is logged to the console.
 * - When PostHog is loaded it forwards to `posthog.identify`.
 * - Falls back silently otherwise.
 */
export function identify(
  userId: string,
  traits?: Record<string, unknown>,
): void {
  if (isDev()) {
    // eslint-disable-next-line no-console
    console.log('[analytics] identify', userId, traits ?? '');
  }

  if (hasPostHog()) {
    (window as any).posthog.identify(userId, traits);
  }
}

/**
 * Reset the current analytics identity (e.g. on logout).
 */
export function reset(): void {
  if (isDev()) {
    // eslint-disable-next-line no-console
    console.log('[analytics] reset');
  }

  if (hasPostHog()) {
    (window as any).posthog.reset();
  }
}

/* ------------------------------------------------------------------ */
/*  React hook wrapper                                                 */
/* ------------------------------------------------------------------ */

/**
 * Convenience hook that returns pre-bound tracking helpers for common
 * application events. Each method calls `track()` with the appropriate
 * event constant and properties.
 *
 * Usage:
 * ```ts
 * const { trackSignup, trackResumeExport } = useTrack();
 * trackSignup('google');
 * trackResumeExport('modern');
 * ```
 */
export function useTrack() {
  return {
    trackSignup: (method: string) => track(EVENTS.SIGNUP, { method }),
    trackLogin: (method: string) => track(EVENTS.LOGIN, { method }),
    trackAssessmentStart: () => track(EVENTS.ASSESSMENT_START),
    trackAssessmentComplete: (score: number) => track(EVENTS.ASSESSMENT_COMPLETE, { score }),
    trackResumeExport: (template: string) => track(EVENTS.RESUME_EXPORT, { template }),
    trackPlanUpgrade: (plan: string, interval: string) => track(EVENTS.PLAN_UPGRADE, { plan, interval }),
    trackCreditPurchase: (pack: string) => track(EVENTS.CREDIT_PURCHASE, { pack }),
    trackReferralSend: () => track(EVENTS.REFERRAL_SEND),
    trackToolUse: (tool: string) => track(tool === 'ats' ? EVENTS.TOOL_ATS_CHECK : EVENTS.TOOL_SALARY_ESTIMATE),
    trackBlogView: (slug: string) => track(EVENTS.BLOG_VIEW, { slug }),
  };
}
