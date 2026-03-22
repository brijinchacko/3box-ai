/**
 * Archer Agent — Multi-Channel Application Agent
 *
 * Generates cover letters and sends job applications through 5 channels:
 * 1. ATS API         — Direct submission to Greenhouse/Lever (highest success rate)
 * 2. Extension Queue — Browser extension auto-fill (Workday, iCIMS, LinkedIn, Indeed, Naukri)
 * 3. User Email      — Send from user's connected Gmail/Outlook (personal touch)
 * 4. Cold Email      — Verified email via Hunter.io to HR/recruiter (fallback)
 * 5. Portal Queue    — URL queued for user to manually apply (last resort)
 *
 * Supports 100+ applications/day with:
 * - Parallel batch processing (5 concurrent)
 * - Multi-channel routing based on ATS detection
 * - Smart routing that learns from application outcomes
 * - Cover letter tiering (priority/standard/quick)
 * - Hunter.io verified emails (replaces hr@company.com guessing)
 * - Greenhouse + Lever direct API submission
 * - User's OAuth Gmail/Outlook for personal outreach
 * - Chrome extension auto-fill for Workday/iCIMS/LinkedIn/Indeed
 */
import { prisma } from '@/lib/db/prisma';
import { aiChatWithFallback } from '@/lib/ai/openrouter';
import { sendEmail } from '@/lib/email';
import { generateResumePdf } from '@/lib/resume/generatePdf';
import { findCompanyEmail as findVerifiedEmail, type EmailFinderResult } from '@/lib/email/emailFinder';
import { routeApplication, detectATSType, type RouteDecision, type ApplicationChannel } from '@/lib/ats/router';
import { smartRouteApplication } from '@/lib/ats/smartRouter';
import { recordOutcome } from '@/lib/ats/outcomeTracker';
import { submitGreenhouseApplication, parseGreenhouseUrl, isGreenhouseUrl } from '@/lib/ats/greenhouse';
import { submitLeverApplication, parseLeverUrl, isLeverUrl } from '@/lib/ats/lever';
import { prepareWorkdayApplicationData } from '@/lib/ats/workday';
import { prepareIcimsApplicationData } from '@/lib/ats/icims';
import { sendViaUserEmail, hasConnectedEmail } from '@/lib/email/oauth';
import { generateCoverLettersBatch, determineCoverLetterTier, type CoverLetterResult } from './coverLetterBatch';
import { processApplicationsBatch, type ApplicationJobData, type ApplicationJobResult } from '@/lib/queue/applicationQueue';
import { type AgentContext, getContextSummary, getAgentHandoff, logActivity } from './context';
import { canSendApplication, recordApplicationSent, getApplicationDelay, uniquifyCoverLetter } from './humanBehavior';
import { calculateApplicationQuality, type ApplicationQualityScore } from '@/lib/jobs/qualityScore';
import { checkApplicationCap, consumeApplicationSlot } from '@/lib/tokens/dailyCap';

// ─── Types ──────────────────────────────────────────

export interface JobForApplication {
  id: string;
  title: string;
  company: string;
  location: string;
  description: string;
  url: string;
  source: string;
  matchScore?: number;
}

export interface ResumeData {
  contact: { name: string; email: string; phone: string; location: string; linkedin?: string; website?: string };
  summary: string;
  experience: { title: string; company: string; bullets: string[] }[];
  skills: string[];
}

export interface ApplicationResult {
  success: boolean;
  method: 'ats_api' | 'email' | 'user_email' | 'extension' | 'portal' | 'none';
  channel: ApplicationChannel;
  strategy: 'priority' | 'standard' | 'skip';
  jobApplicationId?: string;
  details: string;
  qualityScore?: ApplicationQualityScore;
  atsType?: string;
}

export interface BatchApplicationResult {
  total: number;
  applied: number;
  emailed: number;
  queued: number;
  skipped: number;
  failed: number;
  results: ApplicationResult[];
  coverLetterStats: { priority: number; standard: number; quick: number; cached: number };
  routingStats: { ats_api: number; extension_queue: number; user_email: number; cold_email: number; portal_queue: number };
  durationMs: number;
}

// ─── Application Strategy ───────────────────────────

/**
 * Determine application strategy based on quality scoring.
 * - Priority (80+): Full AI cover letter + all channels
 * - Standard (60-79): Template cover letter + best available channel
 * - Skip (<60): Don't waste credits
 */
export function determineApplicationStrategy(
  matchScore: number,
  atsScore: number,
  scamScore: number,
): { strategy: 'priority' | 'standard' | 'skip'; quality: ApplicationQualityScore } {
  const quality = calculateApplicationQuality({
    matchScore,
    atsScore,
    scamScore,
    hasDirectUrl: true,
    jobAgeDays: 3,
  });

  let strategy: 'priority' | 'standard' | 'skip';
  if (quality.recommendation === 'apply_now' && quality.overall >= 80) {
    strategy = 'priority';
  } else if (quality.recommendation === 'apply_now' || quality.recommendation === 'optimize_first') {
    strategy = 'standard';
  } else {
    strategy = 'skip';
  }

  return { strategy, quality };
}

// ─── Single Job Application (backward-compatible) ───

/**
 * Generate a tailored cover letter for a specific job.
 * (Kept for backward compatibility — new code uses coverLetterBatch)
 */
export async function generateCoverLetter(
  resume: ResumeData,
  job: JobForApplication,
  ctx?: AgentContext,
): Promise<string> {
  const prompt = `Write a professional, concise cover letter for this job application. Keep it to 3-4 short paragraphs. Be specific about how the candidate's experience matches the role. Do NOT include any placeholder brackets — use the actual info provided.

CANDIDATE:
Name: ${resume.contact.name}
Location: ${resume.contact.location}
Summary: ${resume.summary}
Key Experience: ${resume.experience.slice(0, 2).map(e => `${e.title} at ${e.company}`).join(', ')}
Skills: ${resume.skills.slice(0, 10).join(', ')}

JOB:
Title: ${job.title}
Company: ${job.company}
Location: ${job.location}
Description: ${job.description.slice(0, 1000)}

Write ONLY the cover letter body text (no subject line, no "Dear Hiring Manager" header, no signature block). Start directly with the opening paragraph.`;

  try {
    const contextBlock = ctx ? `\n\nTEAM CONTEXT:\n${getContextSummary(ctx)}` : '';
    const handoffBlock = ctx ? `\n\nHANDOFF DATA:\n${getAgentHandoff(ctx, 'sentinel', 'archer')}` : '';

    const response = await aiChatWithFallback({ messages: [
      { role: 'system', content: `You are Archer, the Application Specialist in 3BOX's AI agent team.
${contextBlock}
${handoffBlock}

YOUR ROLE: Generate tailored, professional cover letters and manage job application submissions.

THINK STEP BY STEP:
1. Analyze the job description for key requirements and company values
2. Map the candidate's actual experience to job requirements
3. Write a compelling narrative that honestly represents the candidate
4. Ensure every claim in the cover letter is backed by resume data
5. Personalize for the specific company — avoid generic language

IMPORTANT:
- Never fabricate company names, job details, or qualifications
- Only use facts from the user's verified profile
- Never use placeholder brackets — use actual provided information
- Write concise, impactful content (3-4 paragraphs max)
- Every skill or achievement mentioned must exist in the candidate's resume
- Tailor tone and language to the company culture when possible` },
      { role: 'user', content: prompt },
    ] }, 'free');

    return response.trim();
  } catch {
    return `I am writing to express my strong interest in the ${job.title} position at ${job.company}. With my background in ${resume.skills.slice(0, 3).join(', ')}, I am confident I can make a meaningful contribution to your team.\n\nMy experience as ${resume.experience[0]?.title || 'a professional'} has equipped me with the skills necessary to excel in this role. I am eager to bring my expertise to ${job.company} and contribute to your continued success.\n\nI would welcome the opportunity to discuss how my skills and experience align with your needs. Thank you for considering my application.`;
  }
}

/**
 * Apply to a single job — multi-channel routing.
 * Backward-compatible signature with enhanced functionality.
 */
export async function applyToJob(
  userId: string,
  job: JobForApplication,
  resume: ResumeData,
  runId?: string,
  ctx?: AgentContext,
  options?: { burstMode?: boolean },
): Promise<ApplicationResult> {
  const burstMode = options?.burstMode ?? false;

  // ── Application cap check (skip in burst mode) ──
  if (!burstMode) {
    const cap = await checkApplicationCap(userId);
    if (!cap.allowed) {
      if (ctx) logActivity(ctx, 'archer', 'cap_reached', `Application limit reached (${cap.used}/${cap.limit} ${cap.limitType})`);
      return { success: false, method: 'none', channel: 'portal_queue', strategy: 'standard', details: `Application limit reached (${cap.used}/${cap.limit} ${cap.limitType === 'weekly' ? 'this week' : 'today'})` };
    }
  }

  // ── Rate limit check (skip in burst mode) ──
  if (!burstMode) {
    const rateCheck = canSendApplication(job.company, userId);
    if (!rateCheck.allowed) {
      if (ctx) logActivity(ctx, 'archer', 'rate_limited', `Rate limited: ${rateCheck.reason}`);
      return { success: false, method: 'none', channel: 'portal_queue', strategy: 'standard', details: `Rate limited: ${rateCheck.reason}` };
    }
  }

  // ── Find verified email for cold email channel ──
  let emailResult: EmailFinderResult | null = null;
  try {
    emailResult = await findVerifiedEmail(job.company);
  } catch {
    // Non-critical — continue with other channels
  }

  // ── Check user capabilities ──
  const userHasEmail = await hasConnectedEmail(userId).catch(() => false);
  // TODO: Extension detection — check if user has extension installed
  const userHasExtension = false; // Will be set when extension reports back

  // ── Smart Route to best channel (data-driven) ──
  const route = await smartRouteApplication(
    job.url,
    !!emailResult && emailResult.confidence >= 50,
    emailResult?.confidence || 0,
    userHasEmail,
    userHasExtension,
    job.company,
  );

  // ── Generate cover letter ──
  let coverLetter = await generateCoverLetter(resume, job, ctx);
  coverLetter = uniquifyCoverLetter(coverLetter, job.id);

  // ── Record rate limit ──
  recordApplicationSent(job.company, userId);

  // ── Execute based on routed channel ──
  let result: ApplicationResult;

  switch (route.channel) {
    case 'ats_api':
      result = await executeAtsApiApplication(userId, job, resume, coverLetter, route, runId, burstMode, ctx);
      break;
    case 'extension_queue':
      result = await executeExtensionQueueApplication(userId, job, resume, coverLetter, route, runId, burstMode, ctx);
      break;
    case 'user_email':
      result = await executeUserEmailApplication(userId, job, resume, coverLetter, emailResult, runId, burstMode, ctx);
      break;
    case 'cold_email':
      if (emailResult && emailResult.confidence >= 50) {
        result = await executeColdEmailApplication(userId, job, resume, coverLetter, emailResult, runId, burstMode, ctx);
      } else {
        result = await executePortalQueueApplication(userId, job, resume, coverLetter, runId, burstMode, ctx);
      }
      break;
    case 'portal_queue':
    default:
      result = await executePortalQueueApplication(userId, job, resume, coverLetter, runId, burstMode, ctx);
      break;
  }

  return result;
}

// ─── Channel Executors ──────────────────────────────

/**
 * Submit via ATS API (Greenhouse or Lever).
 */
async function executeAtsApiApplication(
  userId: string,
  job: JobForApplication,
  resume: ResumeData,
  coverLetter: string,
  route: RouteDecision,
  runId?: string,
  burstMode?: boolean,
  ctx?: AgentContext,
): Promise<ApplicationResult> {
  const nameParts = resume.contact.name.split(' ');
  const firstName = nameParts[0] || '';
  const lastName = nameParts.slice(1).join(' ') || '';

  try {
    if (route.atsType === 'greenhouse' && route.atsMetadata?.boardToken && route.atsMetadata?.jobId) {
      const result = await submitGreenhouseApplication({
        boardToken: route.atsMetadata.boardToken,
        jobId: route.atsMetadata.jobId,
        firstName,
        lastName,
        email: resume.contact.email,
        phone: resume.contact.phone,
        location: resume.contact.location,
        linkedinUrl: resume.contact.linkedin,
        websiteUrl: resume.contact.website,
        coverLetter,
      });

      if (result.success) {
        const applicationId = await recordApplication(userId, job, coverLetter, 'APPLIED', 'ats_api', { atsType: 'greenhouse', ...result }, runId, burstMode);
        if (ctx) logActivity(ctx, 'archer', 'applied_ats', `Applied to "${job.title}" at ${job.company} via Greenhouse API`);
        return { success: true, method: 'ats_api', channel: 'ats_api', strategy: 'priority', jobApplicationId: applicationId, details: `Applied via Greenhouse API`, atsType: 'greenhouse' };
      }

      // Greenhouse failed — fall through to cold email or portal
      console.warn(`[Archer] Greenhouse submission failed for ${job.company}: ${result.message}`);
    }

    if (route.atsType === 'lever' && route.atsMetadata?.site && route.atsMetadata?.jobId) {
      const result = await submitLeverApplication({
        site: route.atsMetadata.site,
        postingId: route.atsMetadata.jobId,
        name: resume.contact.name,
        email: resume.contact.email,
        phone: resume.contact.phone,
        comments: coverLetter,
        urls: {
          linkedin: resume.contact.linkedin,
          portfolio: resume.contact.website,
        },
      });

      if (result.success) {
        const applicationId = await recordApplication(userId, job, coverLetter, 'APPLIED', 'ats_api', { atsType: 'lever', ...result }, runId, burstMode);
        if (ctx) logActivity(ctx, 'archer', 'applied_ats', `Applied to "${job.title}" at ${job.company} via Lever API`);
        return { success: true, method: 'ats_api', channel: 'ats_api', strategy: 'priority', jobApplicationId: applicationId, details: `Applied via Lever API`, atsType: 'lever' };
      }

      console.warn(`[Archer] Lever submission failed for ${job.company}: ${result.message}`);
    }
  } catch (err) {
    console.error(`[Archer] ATS API error for ${job.company}:`, err);
  }

  // ATS API failed — fall back to portal queue
  return executePortalQueueApplication(userId, job, resume, coverLetter, runId, burstMode, ctx);
}

/**
 * Send application via cold email using verified email.
 */
async function executeColdEmailApplication(
  userId: string,
  job: JobForApplication,
  resume: ResumeData,
  coverLetter: string,
  emailInfo: EmailFinderResult,
  runId?: string,
  burstMode?: boolean,
  ctx?: AgentContext,
): Promise<ApplicationResult> {
  const emailSubject = `Application for ${job.title} — ${resume.contact.name}`;
  const emailBody = buildApplicationEmail(resume, job, coverLetter);

  try {
    // Generate PDF resume to attach
    let attachments: { filename: string; content: Buffer; contentType: string }[] = [];
    try {
      const pdfBuffer = await generateResumePdf(resume as any);
      const safeName = resume.contact.name.replace(/[^a-zA-Z0-9_\- ]/g, '').replace(/\s+/g, '_');
      attachments = [{ filename: `${safeName}_Resume.pdf`, content: pdfBuffer, contentType: 'application/pdf' }];
    } catch (pdfErr) {
      console.warn('[Archer] PDF generation failed, sending without attachment:', pdfErr);
    }

    const emailResult = await sendEmail({
      to: emailInfo.email,
      subject: emailSubject,
      html: emailBody,
      text: `${coverLetter}\n\nBest regards,\n${resume.contact.name}\n${resume.contact.email}\n${resume.contact.phone}`,
      attachments,
    });

    const applicationId = await recordApplication(
      userId, job, coverLetter, 'EMAILED', 'cold_email',
      { sentTo: emailInfo.email, confidence: emailInfo.confidence, source: emailInfo.source, messageId: emailResult.id },
      runId, burstMode,
    );

    if (ctx) logActivity(ctx, 'archer', 'sent_email', `Emailed application for "${job.title}" to ${emailInfo.email} (${emailInfo.confidence}% confidence)`);

    return {
      success: true,
      method: 'email',
      channel: 'cold_email',
      strategy: 'standard',
      jobApplicationId: applicationId,
      details: `Emailed application to ${emailInfo.email} (${emailInfo.source}, ${emailInfo.confidence}% confidence)`,
    };
  } catch (err) {
    console.error(`[Archer] Cold email failed for ${job.company}:`, err);
    // Fall back to portal queue
    return executePortalQueueApplication(userId, job, resume, coverLetter, runId, burstMode, ctx);
  }
}

/**
 * Queue application for Chrome Extension to auto-fill and submit.
 * Creates a QUEUED record with applicationMethod='extension_queue' and
 * pre-filled form data so the extension can pick it up.
 */
async function executeExtensionQueueApplication(
  userId: string,
  job: JobForApplication,
  resume: ResumeData,
  coverLetter: string,
  route: RouteDecision,
  runId?: string,
  burstMode?: boolean,
  ctx?: AgentContext,
): Promise<ApplicationResult> {
  // Prepare pre-filled form data based on ATS type
  let extensionData: Record<string, any> = {};

  if (route.atsType === 'workday') {
    extensionData = prepareWorkdayApplicationData({ contact: resume.contact }, coverLetter);
  } else if (route.atsType === 'icims') {
    extensionData = prepareIcimsApplicationData({ contact: resume.contact }, coverLetter);
  } else {
    // LinkedIn, Indeed, Naukri, etc. — pass resume contact data
    extensionData = {
      firstName: resume.contact.name.split(' ')[0] || '',
      lastName: resume.contact.name.split(' ').slice(1).join(' ') || '',
      email: resume.contact.email,
      phone: resume.contact.phone,
      location: resume.contact.location,
      linkedin: resume.contact.linkedin || '',
      coverLetter,
    };
  }

  const applicationId = await recordApplication(
    userId, job, coverLetter, 'QUEUED', 'extension_queue',
    {
      atsType: route.atsType,
      extensionData,
      ...route.atsMetadata,
    },
    runId, burstMode,
  );

  if (ctx) logActivity(ctx, 'archer', 'queued_extension', `Queued extension apply for "${job.title}" at ${job.company} (${route.atsType})`);

  return {
    success: true,
    method: 'extension',
    channel: 'extension_queue',
    strategy: 'standard',
    jobApplicationId: applicationId,
    details: `Queued for Chrome extension auto-fill (${route.atsType})`,
    atsType: route.atsType,
  };
}

/**
 * Send application via user's connected Gmail/Outlook account.
 * Falls back to cold email, then portal queue on failure.
 */
async function executeUserEmailApplication(
  userId: string,
  job: JobForApplication,
  resume: ResumeData,
  coverLetter: string,
  emailInfo: EmailFinderResult | null,
  runId?: string,
  burstMode?: boolean,
  ctx?: AgentContext,
): Promise<ApplicationResult> {
  const recipientEmail = emailInfo?.email;
  if (!recipientEmail) {
    // No HR email found — fall back to portal queue
    if (ctx) logActivity(ctx, 'archer', 'user_email_skip', `No recipient email found for ${job.company} — falling back`);
    return executePortalQueueApplication(userId, job, resume, coverLetter, runId, burstMode, ctx);
  }

  const emailSubject = `Application for ${job.title} — ${resume.contact.name}`;
  const emailBody = buildApplicationEmail(resume, job, coverLetter);

  try {
    const result = await sendViaUserEmail(userId, {
      to: recipientEmail,
      subject: emailSubject,
      html: emailBody,
      text: `${coverLetter}\n\nBest regards,\n${resume.contact.name}\n${resume.contact.email}\n${resume.contact.phone}`,
    });

    if (!result.success) {
      console.warn(`[Archer] User email failed for ${job.company}: ${result.error}`);
      // Fall back to cold email if available
      if (emailInfo && emailInfo.confidence >= 50) {
        return executeColdEmailApplication(userId, job, resume, coverLetter, emailInfo, runId, burstMode, ctx);
      }
      return executePortalQueueApplication(userId, job, resume, coverLetter, runId, burstMode, ctx);
    }

    const applicationId = await recordApplication(
      userId, job, coverLetter, 'EMAILED', 'user_email',
      {
        sentTo: recipientEmail,
        sentFrom: result.sentFrom,
        provider: result.provider,
        confidence: emailInfo.confidence,
        source: emailInfo.source,
        messageId: result.messageId,
      },
      runId, burstMode,
    );

    if (ctx) logActivity(ctx, 'archer', 'sent_user_email', `Sent application for "${job.title}" via ${result.provider} (from ${result.sentFrom}) to ${recipientEmail}`);

    // Record outcome for smart routing
    try {
      await recordOutcome({
        userId,
        company: job.company,
        atsType: detectATSType(job.url),
        channel: 'user_email',
        outcome: 'applied',
        appliedAt: new Date(),
      });
    } catch {}

    return {
      success: true,
      method: 'user_email',
      channel: 'user_email',
      strategy: 'standard',
      jobApplicationId: applicationId,
      details: `Sent from your ${result.provider} (${result.sentFrom}) to ${recipientEmail}`,
    };
  } catch (err) {
    console.error(`[Archer] User email failed for ${job.company}:`, err);
    // Fall back to cold email, then portal
    if (emailInfo && emailInfo.confidence >= 50) {
      return executeColdEmailApplication(userId, job, resume, coverLetter, emailInfo, runId, burstMode, ctx);
    }
    return executePortalQueueApplication(userId, job, resume, coverLetter, runId, burstMode, ctx);
  }
}

/**
 * Queue application for user to manually apply via portal URL.
 */
async function executePortalQueueApplication(
  userId: string,
  job: JobForApplication,
  resume: ResumeData,
  coverLetter: string,
  runId?: string,
  burstMode?: boolean,
  ctx?: AgentContext,
): Promise<ApplicationResult> {
  if (!job.url || !job.url.startsWith('http')) {
    return { success: false, method: 'none', channel: 'portal_queue', strategy: 'standard', details: `No valid URL for ${job.company}` };
  }

  const applicationId = await recordApplication(
    userId, job, coverLetter, 'QUEUED', 'portal',
    { url: job.url },
    runId, burstMode,
  );

  if (ctx) logActivity(ctx, 'archer', 'queued_portal', `Queued portal application for "${job.title}" at ${job.company} via ${job.source}`);

  return {
    success: true,
    method: 'portal',
    channel: 'portal_queue',
    strategy: 'standard',
    jobApplicationId: applicationId,
    details: `Queued portal application for ${job.title} at ${job.company}`,
  };
}

// ─── Batch Application (100+ jobs) ──────────────────

/**
 * Apply to a batch of jobs in parallel with multi-channel routing.
 * This is the main entry point for 100+ applications/day.
 *
 * Pipeline:
 * 1. Find verified emails for all companies (parallel, cached)
 * 2. Route each job to optimal channel
 * 3. Generate cover letters in parallel batches
 * 4. Submit applications in parallel (5 concurrent)
 * 5. Track progress and return results
 */
export async function applyToJobsBatch(
  userId: string,
  jobs: JobForApplication[],
  resume: ResumeData,
  runId: string,
  ctx?: AgentContext,
  options?: {
    burstMode?: boolean;
    onProgress?: (completed: number, total: number, lastResult: ApplicationResult) => void;
  },
): Promise<BatchApplicationResult> {
  const startTime = Date.now();
  const burstMode = options?.burstMode ?? false;
  const results: ApplicationResult[] = [];

  const routingStats = { ats_api: 0, extension_queue: 0, user_email: 0, cold_email: 0, portal_queue: 0 };
  const coverLetterStats = { priority: 0, standard: 0, quick: 0, cached: 0 };

  // ── Application cap check (skip in burst mode) ──
  if (!burstMode) {
    const cap = await checkApplicationCap(userId);
    if (!cap.allowed) {
      if (ctx) logActivity(ctx, 'archer', 'cap_reached', `Application limit reached (${cap.used}/${cap.limit} ${cap.limitType})`);
      return {
        total: jobs.length, applied: 0, emailed: 0, queued: 0, skipped: jobs.length, failed: 0,
        results: [], coverLetterStats, routingStats, durationMs: Date.now() - startTime,
      };
    }
    // Trim jobs to remaining allowance
    const remaining = cap.remaining === Infinity ? jobs.length : cap.remaining;
    if (remaining < jobs.length) {
      if (ctx) logActivity(ctx, 'archer', 'cap_trimmed', `Trimming batch from ${jobs.length} to ${remaining} (daily cap)`);
      jobs = jobs.slice(0, remaining);
    }
  }

  if (ctx) logActivity(ctx, 'archer', 'batch_start', `Starting batch application for ${jobs.length} jobs`);

  // ── Step 1: Find verified emails for all unique companies (parallel) ──
  const uniqueCompanies = [...new Set(jobs.map((j) => j.company))];
  const emailMap = new Map<string, EmailFinderResult | null>();

  if (ctx) logActivity(ctx, 'archer', 'email_lookup', `Looking up emails for ${uniqueCompanies.length} companies via Hunter.io`);

  const emailPromises = uniqueCompanies.map(async (company) => {
    try {
      const result = await findVerifiedEmail(company);
      emailMap.set(company, result);
    } catch {
      emailMap.set(company, null);
    }
  });
  // Process email lookups in batches of 3 (Hunter.io rate limits)
  for (let i = 0; i < emailPromises.length; i += 3) {
    await Promise.allSettled(emailPromises.slice(i, i + 3));
    if (i + 3 < emailPromises.length) await sleep(1000);
  }

  const verifiedEmails = [...emailMap.values()].filter((e) => e && e.confidence >= 50).length;
  if (ctx) logActivity(ctx, 'archer', 'email_results', `Found ${verifiedEmails} verified emails out of ${uniqueCompanies.length} companies`);

  // ── Step 2: Check user capabilities & Route each job to optimal channel ──
  const userHasEmail = await hasConnectedEmail(userId).catch(() => false);
  const userHasExtension = false; // TODO: detect from user's extension heartbeat

  const routedJobs: { job: JobForApplication; route: RouteDecision; email: EmailFinderResult | null }[] = [];
  for (const job of jobs) {
    const email = emailMap.get(job.company) || null;
    const route = await smartRouteApplication(
      job.url,
      !!email && email.confidence >= 50,
      email?.confidence || 0,
      userHasEmail,
      userHasExtension,
      job.company,
    );
    routingStats[route.channel]++;
    routedJobs.push({ job, route, email });
  }

  if (ctx) {
    logActivity(ctx, 'archer', 'routing_done',
      `Routed ${jobs.length} jobs: ${routingStats.ats_api} ATS, ${routingStats.extension_queue} extension, ${routingStats.user_email} user email, ${routingStats.cold_email} cold email, ${routingStats.portal_queue} portal`);
  }

  // ── Step 3: Generate cover letters in parallel batches ──
  if (ctx) logActivity(ctx, 'archer', 'coverletters_start', `Generating ${jobs.length} cover letters (batch mode)`);

  const clResults = await generateCoverLettersBatch(
    {
      name: resume.contact.name,
      email: resume.contact.email,
      summary: resume.summary,
      experience: resume.experience,
      skills: resume.skills,
    },
    jobs,
    (completed, total) => {
      if (ctx && completed % 10 === 0) {
        logActivity(ctx, 'archer', 'coverletters_progress', `Generated ${completed}/${total} cover letters`);
      }
    },
  );

  // Build lookup map
  const coverLetterMap = new Map<string, CoverLetterResult>();
  for (const cl of clResults) {
    coverLetterMap.set(cl.jobId, cl);
    coverLetterStats[cl.tier]++;
    if (cl.cached) coverLetterStats.cached++;
  }

  if (ctx) {
    logActivity(ctx, 'archer', 'coverletters_done',
      `Generated ${clResults.length} cover letters: ${coverLetterStats.priority} priority, ${coverLetterStats.standard} standard, ${coverLetterStats.quick} quick (${coverLetterStats.cached} cached)`);
  }

  // ── Step 4: Submit applications in parallel batches ──
  if (ctx) logActivity(ctx, 'archer', 'applying_start', `Submitting ${jobs.length} applications (5 concurrent)`);

  const applicationJobData: ApplicationJobData[] = routedJobs.map(({ job, route }, index) => ({
    userId,
    runId,
    job: {
      id: job.id,
      title: job.title,
      company: job.company,
      location: job.location,
      description: job.description,
      url: job.url,
      source: job.source,
      matchScore: job.matchScore,
      atsType: route.atsType,
    },
    resumeData: resume,
    coverLetter: coverLetterMap.get(job.id)?.coverLetter,
    channel: route.channel,
    priority: route.priority,
  }));

  // Process using in-memory batch processor
  const batchResults = await processApplicationsBatch(
    applicationJobData,
    async (data: ApplicationJobData): Promise<ApplicationJobResult> => {
      const jobData: JobForApplication = {
        id: data.job.id,
        title: data.job.title,
        company: data.job.company,
        location: data.job.location,
        description: data.job.description,
        url: data.job.url,
        source: data.job.source,
        matchScore: data.job.matchScore,
      };

      const routeInfo = routedJobs.find((r) => r.job.id === data.job.id);
      const email = routeInfo?.email;
      const coverLetter = data.coverLetter || coverLetterMap.get(data.job.id)?.coverLetter || '';

      // Rate limit check (skip in burst mode)
      if (!burstMode) {
        const rateCheck = canSendApplication(data.job.company, userId);
        if (!rateCheck.allowed) {
          return { success: false, jobId: data.job.id, method: 'rate_limited', details: rateCheck.reason || 'Rate limited' };
        }
      }
      recordApplicationSent(data.job.company, userId);

      // Execute based on channel
      let appResult: ApplicationResult;
      switch (data.channel) {
        case 'ats_api':
          appResult = await executeAtsApiApplication(userId, jobData, resume, coverLetter, routeInfo?.route!, runId, burstMode, ctx);
          break;
        case 'extension_queue':
          appResult = await executeExtensionQueueApplication(userId, jobData, resume, coverLetter, routeInfo?.route!, runId, burstMode, ctx);
          break;
        case 'user_email':
          appResult = await executeUserEmailApplication(userId, jobData, resume, coverLetter, email || null, runId, burstMode, ctx);
          break;
        case 'cold_email':
          if (email && email.confidence >= 50) {
            appResult = await executeColdEmailApplication(userId, jobData, resume, coverLetter, email, runId, burstMode, ctx);
          } else {
            appResult = await executePortalQueueApplication(userId, jobData, resume, coverLetter, runId, burstMode, ctx);
          }
          break;
        case 'portal_queue':
        default:
          appResult = await executePortalQueueApplication(userId, jobData, resume, coverLetter, runId, burstMode, ctx);
          break;
      }

      results.push(appResult);
      options?.onProgress?.(results.length, jobs.length, appResult);

      return {
        success: appResult.success,
        jobId: data.job.id,
        method: appResult.method,
        details: appResult.details,
        applicationId: appResult.jobApplicationId,
      };
    },
    (completed, total, result) => {
      if (ctx && completed % 10 === 0) {
        logActivity(ctx, 'archer', 'applying_progress', `Processed ${completed}/${total} applications`);
      }
    },
  );

  // ── Step 5: Compile results ──
  const applied = results.filter((r) => r.success && (r.method === 'ats_api' || r.method === 'extension')).length;
  const emailed = results.filter((r) => r.success && (r.method === 'email' || r.method === 'user_email')).length;
  const queued = results.filter((r) => r.success && r.method === 'portal').length;
  const failed = results.filter((r) => !r.success).length;
  const skipped = jobs.length - results.length;

  const durationMs = Date.now() - startTime;

  if (ctx) {
    logActivity(ctx, 'archer', 'batch_done',
      `Batch complete in ${Math.round(durationMs / 1000)}s: ${applied} API applied, ${emailed} emailed, ${queued} queued, ${failed} failed`);
  }

  return {
    total: jobs.length,
    applied: applied + emailed + queued,
    emailed,
    queued,
    skipped,
    failed,
    results,
    coverLetterStats,
    routingStats,
    durationMs,
  };
}

// ─── Helpers ────────────────────────────────────────

/**
 * Record a job application in the database.
 */
async function recordApplication(
  userId: string,
  job: JobForApplication,
  coverLetter: string,
  status: 'QUEUED' | 'APPLIED' | 'EMAILED',
  method: string,
  metadata: Record<string, any>,
  runId?: string,
  burstMode?: boolean,
): Promise<string | undefined> {
  if (burstMode) return undefined;

  // Consume an application slot for non-burst applications
  if (status !== 'QUEUED') {
    await consumeApplicationSlot(userId).catch(() => {});
  }

  try {
    const application = await prisma.jobApplication.create({
      data: {
        userId,
        jobTitle: job.title,
        company: job.company,
        location: job.location,
        matchScore: job.matchScore || null,
        status,
        applicationMethod: method, // ats_api | extension_queue | user_email | cold_email | portal
        atsType: metadata.atsType || detectATSType(job.url),
        appliedAt: status === 'APPLIED' || status === 'EMAILED' ? new Date() : undefined,
        source: job.source,
        coverLetter,
        jobUrl: job.url || null,
        autoApplyRunId: runId || null,
        auditTrail: { method, agentName: 'Archer', ...metadata },
      },
    });

    await prisma.agentActivity.create({
      data: {
        userId,
        agent: 'archer',
        action: `${method}_${status.toLowerCase()}`,
        summary: `${status === 'APPLIED' ? 'Applied' : status === 'EMAILED' ? 'Emailed' : 'Queued'} for "${job.title}" at ${job.company} via ${method}`,
        details: { jobId: job.id, company: job.company, method, matchScore: job.matchScore, ...metadata },
        creditsUsed: status === 'QUEUED' ? 0 : 1,
        runId,
      },
    });

    return application.id;
  } catch (err) {
    console.error(`[Archer] Failed to record application for ${job.company}:`, err);
    return undefined;
  }
}

/**
 * Build a professional HTML email for cold outreach.
 */
function buildApplicationEmail(resume: ResumeData, job: JobForApplication, coverLetter: string): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><style>
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #333; line-height: 1.6; max-width: 600px; margin: 0 auto; padding: 20px; }
  .header { border-bottom: 2px solid #2563eb; padding-bottom: 12px; margin-bottom: 20px; }
  .name { font-size: 20px; font-weight: 700; color: #1e293b; margin: 0; }
  .contact { font-size: 13px; color: #64748b; margin: 4px 0 0; }
  .body { font-size: 14px; white-space: pre-wrap; }
  .footer { margin-top: 24px; padding-top: 12px; border-top: 1px solid #e2e8f0; font-size: 13px; color: #64748b; }
</style></head>
<body>
  <div class="header">
    <p class="name">${resume.contact.name}</p>
    <p class="contact">${resume.contact.email} • ${resume.contact.phone} • ${resume.contact.location}${resume.contact.linkedin ? ` • ${resume.contact.linkedin}` : ''}</p>
  </div>
  <div class="body">${coverLetter.replace(/\n/g, '<br>')}</div>
  <div class="footer">
    <p>Best regards,<br><strong>${resume.contact.name}</strong></p>
  </div>
</body>
</html>`;
}

/**
 * Legacy findCompanyEmail — now delegates to Hunter.io-powered finder.
 * Kept for backward compatibility.
 * @deprecated Use findVerifiedEmail from '@/lib/email/emailFinder' instead.
 */
export function findCompanyEmail(company: string): string | null {
  const cleaned = company
    .toLowerCase()
    .replace(/\s*(pvt|private|ltd|limited|inc|corp|corporation|llc|technologies|tech|solutions|services|group|india)\s*/g, '')
    .replace(/[^a-z0-9]/g, '')
    .trim();
  if (!cleaned || cleaned.length < 2) return null;
  return `hr@${cleaned}.com`;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ── Independent Archer (runs on its own schedule) ──────────────────

export interface IndependentArcherConfig {
  maxPerRun: number;
  resumeId?: string;
  forgeEnabled: boolean;
  forgeMode: string;
  // Smart auto-apply options
  smartAutoEnabled?: boolean;
  autoApplyMinScore?: number;
  excludedCompanies?: string[];
  allowColdEmail?: boolean;
  maxDailyPreference?: number;
}

export interface IndependentArcherResult {
  runId: string;
  jobsApplied: number;
  jobsSkipped: number;
  creditsUsed: number;
}

/**
 * Run Archer independently — reads from the ScoutJob persistent store
 * and applies to jobs with status READY or FORGE_READY.
 *
 * When Forge is not configured (forgeMode === 'on_demand' or forgeEnabled is false),
 * Archer also picks up NEW jobs directly.
 */
export async function runIndependentArcher(
  userId: string,
  config: IndependentArcherConfig,
): Promise<IndependentArcherResult> {
  const run = await prisma.autoApplyRun.create({
    data: {
      userId,
      status: 'running',
      agentType: 'archer',
      summary: `Archer applying to up to ${config.maxPerRun} jobs`,
    },
  });

  try {
    // Load resume
    const resume = config.resumeId
      ? await prisma.resume.findUnique({ where: { id: config.resumeId } })
      : await prisma.resume.findFirst({
          where: { userId, isFinalized: true },
          orderBy: { updatedAt: 'desc' },
        });

    if (!resume) {
      await prisma.autoApplyRun.update({
        where: { id: run.id },
        data: { status: 'completed', completedAt: new Date(), summary: 'Archer skipped: no finalized resume found' },
      });
      return { runId: run.id, jobsApplied: 0, jobsSkipped: 0, creditsUsed: 0 };
    }

    const resumeContent = resume.content as unknown as ResumeData;

    // Determine which statuses to pull from
    // If Forge is not configured, also pull NEW jobs (they'll use the base resume)
    const forgeConfigured = config.forgeEnabled && config.forgeMode !== 'on_demand';
    const validStatuses = forgeConfigured
      ? ['READY', 'FORGE_READY']
      : ['NEW', 'READY', 'FORGE_READY'];

    // Query jobs ready for application
    const readyJobs = await prisma.scoutJob.findMany({
      where: {
        userId,
        status: { in: validStatuses as any },
      },
      orderBy: [
        { matchScore: 'desc' },
        { discoveredAt: 'desc' },
      ],
      take: config.maxPerRun,
    });

    if (readyJobs.length === 0) {
      await prisma.autoApplyRun.update({
        where: { id: run.id },
        data: { status: 'completed', completedAt: new Date(), summary: 'No jobs ready for application' },
      });
      return { runId: run.id, jobsApplied: 0, jobsSkipped: 0, creditsUsed: 0 };
    }

    // ── Smart Auto-Apply Filtering ──
    // When smart-auto is enabled, apply threshold + exclusion filters
    let jobsToApply = readyJobs;
    let smartAutoSkipped = 0;
    let smartAutoQueued = 0;

    if (config.smartAutoEnabled) {
      const minScore = config.autoApplyMinScore ?? 80;
      const excluded = (config.excludedCompanies ?? []).map(c => c.toLowerCase().trim());
      const allowCold = config.allowColdEmail ?? true;
      const dailyMax = config.maxDailyPreference ?? 20;

      // Count today's applications for daily preference cap
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayApplied = await prisma.scoutJob.count({
        where: { userId, status: 'APPLIED', appliedAt: { gte: todayStart } },
      });
      const remainingDaily = Math.max(0, dailyMax - todayApplied);

      const applyList: typeof readyJobs = [];
      for (const job of readyJobs) {
        // Check excluded companies
        if (excluded.length > 0 && excluded.includes(job.company.toLowerCase().trim())) {
          await prisma.scoutJob.update({ where: { id: job.id }, data: { status: 'SKIPPED' } }).catch(() => {});
          smartAutoSkipped++;
          continue;
        }

        // Check cold email preference — if not allowed, skip jobs that would only route via cold email
        if (!allowCold && !job.jobUrl) {
          await prisma.scoutJob.update({ where: { id: job.id }, data: { status: 'SKIPPED' } }).catch(() => {});
          smartAutoSkipped++;
          continue;
        }

        // Check match score threshold — below threshold goes to review queue
        const score = job.matchScore ?? 0;
        if (score < minScore) {
          await prisma.scoutJob.update({ where: { id: job.id }, data: { status: 'READY' } }).catch(() => {});
          smartAutoQueued++;
          continue;
        }

        // Respect daily preference cap
        if (applyList.length >= remainingDaily) {
          await prisma.scoutJob.update({ where: { id: job.id }, data: { status: 'READY' } }).catch(() => {});
          smartAutoQueued++;
          continue;
        }

        applyList.push(job);
      }

      jobsToApply = applyList;

      if (jobsToApply.length === 0) {
        await prisma.autoApplyRun.update({
          where: { id: run.id },
          data: {
            status: 'completed',
            completedAt: new Date(),
            jobsSkipped: smartAutoSkipped,
            summary: `Smart auto-apply: ${smartAutoSkipped} skipped, ${smartAutoQueued} queued for review, 0 applied`,
          },
        });
        return { runId: run.id, jobsApplied: 0, jobsSkipped: smartAutoSkipped + smartAutoQueued, creditsUsed: 0 };
      }
    }

    // Mark jobs as APPLYING
    const jobIds = jobsToApply.map(j => j.id);
    await prisma.scoutJob.updateMany({
      where: { id: { in: jobIds } },
      data: { status: 'APPLYING' },
    });

    // Convert ScoutJob records → JobForApplication format
    const jobsForApplication: JobForApplication[] = jobsToApply.map(sj => ({
      id: sj.id,
      title: sj.title,
      company: sj.company,
      location: sj.location || '',
      description: sj.description,
      url: sj.jobUrl,
      source: sj.source,
      matchScore: sj.matchScore || undefined,
    }));

    // Apply using existing batch function
    const batchResult = await applyToJobsBatch(
      userId,
      jobsForApplication,
      resumeContent,
      run.id,
    );

    // Update ScoutJob statuses based on results
    for (let i = 0; i < jobsForApplication.length; i++) {
      const appResult = batchResult.results[i];
      const scoutJobId = jobsForApplication[i].id;

      if (appResult?.success) {
        await prisma.scoutJob.update({
          where: { id: scoutJobId },
          data: {
            status: 'APPLIED',
            appliedAt: new Date(),
            applicationId: appResult.jobApplicationId || null,
          },
        }).catch(() => {});
      } else {
        // Revert to READY for retry on next run
        await prisma.scoutJob.update({
          where: { id: scoutJobId },
          data: { status: 'READY' },
        }).catch(() => {});
      }
    }

    const creditsUsed = batchResult.applied;

    // Update run + config + user credits
    await Promise.all([
      prisma.autoApplyRun.update({
        where: { id: run.id },
        data: {
          status: 'completed',
          completedAt: new Date(),
          jobsFound: readyJobs.length,
          jobsApplied: batchResult.applied,
          jobsSkipped: batchResult.failed + batchResult.skipped + smartAutoSkipped,
          creditsUsed,
          summary: config.smartAutoEnabled
            ? `Smart auto-apply: ${batchResult.applied} applied, ${smartAutoQueued} queued for review, ${smartAutoSkipped} excluded (${batchResult.failed} failed)`
            : `Archer applied to ${batchResult.applied} jobs (${batchResult.emailed} email, ${batchResult.queued} portal, ${batchResult.failed} failed)`,
          details: JSON.parse(JSON.stringify({
            applied: batchResult.applied,
            emailed: batchResult.emailed,
            queued: batchResult.queued,
            failed: batchResult.failed,
            skipped: batchResult.skipped,
            routingStats: batchResult.routingStats,
            durationMs: batchResult.durationMs,
          })),
        },
      }),
      prisma.autoApplyConfig.update({
        where: { userId },
        data: { archerLastRunAt: new Date() },
      }),
      // NOTE: Application slots are already consumed in recordApplication()
      // — no additional consumption needed here to avoid double-counting.
    ]);

    return {
      runId: run.id,
      jobsApplied: batchResult.applied,
      jobsSkipped: batchResult.failed + batchResult.skipped + smartAutoSkipped + smartAutoQueued,
      creditsUsed,
    };
  } catch (err) {
    // Revert any APPLYING jobs back to READY
    await prisma.scoutJob.updateMany({
      where: { userId, status: 'APPLYING' },
      data: { status: 'READY' },
    }).catch(() => {});

    await prisma.autoApplyRun.update({
      where: { id: run.id },
      data: { status: 'failed', completedAt: new Date(), summary: `Archer failed: ${(err as Error).message}` },
    });
    throw err;
  }
}
