/**
 * Archer Agent — Application Agent
 * Generates cover letters and sends job applications
 */
import { prisma } from '@/lib/db/prisma';
import { aiChatWithFallback } from '@/lib/ai/openrouter';
import { sendEmail } from '@/lib/email';
import { type AgentContext, getContextSummary, getAgentHandoff, logActivity } from './context';
import { canSendApplication, recordApplicationSent, getApplicationDelay, uniquifyCoverLetter } from './humanBehavior';
import { calculateApplicationQuality, type ApplicationQualityScore } from '@/lib/jobs/qualityScore';

interface JobForApplication {
  id: string;
  title: string;
  company: string;
  location: string;
  description: string;
  url: string;
  source: string;
  matchScore?: number;
}

interface ResumeData {
  contact: { name: string; email: string; phone: string; location: string; linkedin?: string };
  summary: string;
  experience: { title: string; company: string; bullets: string[] }[];
  skills: string[];
}

interface ApplicationResult {
  success: boolean;
  method: 'portal' | 'email' | 'none';
  strategy: 'priority' | 'standard' | 'skip';
  jobApplicationId?: string;
  details: string;
  qualityScore?: ApplicationQualityScore;
}

/**
 * Determine application strategy based on quality scoring
 * - Priority (80+): Personalized cover letter + apply + cold email
 * - Standard (60-79): Template cover letter + apply only
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

/**
 * Generate a tailored cover letter for a specific job
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
 * Try to find/infer a company HR email
 */
export function findCompanyEmail(company: string): string | null {
  // Normalize company name to guess domain
  const cleaned = company
    .toLowerCase()
    .replace(/\s*(pvt|private|ltd|limited|inc|corp|corporation|llc|technologies|tech|solutions|services|group|india)\s*/g, '')
    .replace(/[^a-z0-9]/g, '')
    .trim();
  
  if (!cleaned || cleaned.length < 2) return null;
  
  // Common patterns: hr@company.com, careers@company.com
  // We can only guess — return the most common pattern
  const domain = `${cleaned}.com`;
  return `hr@${domain}`;
}

/**
 * Apply to a job — portal queue or cold email
 */
export async function applyToJob(
  userId: string,
  job: JobForApplication,
  resume: ResumeData,
  runId?: string,
  ctx?: AgentContext,
): Promise<ApplicationResult> {
  // ── Rate limit check ──
  const rateCheck = canSendApplication(job.company);
  if (!rateCheck.allowed) {
    if (ctx) logActivity(ctx, 'archer', 'rate_limited', `Rate limited: ${rateCheck.reason}`);
    return { success: false, method: 'none', strategy: 'standard', details: `Rate limited: ${rateCheck.reason}` };
  }

  // Generate cover letter and add subtle uniqueness
  let coverLetter = await generateCoverLetter(resume, job, ctx);
  coverLetter = uniquifyCoverLetter(coverLetter, job.id);

  // Record that we sent an application (for rate limiting)
  recordApplicationSent(job.company);

  // Strategy 1: Queue portal application (always do this if URL exists)
  if (job.url && job.url.startsWith('http')) {
    const application = await prisma.jobApplication.create({
      data: {
        userId,
        jobTitle: job.title,
        company: job.company,
        location: job.location,
        matchScore: job.matchScore || null,
        status: 'QUEUED',
        source: job.source,
        coverLetter,
        jobUrl: job.url,
        autoApplyRunId: runId || null,
        auditTrail: { method: 'portal', url: job.url, agentName: 'Archer' },
      },
    });

    // Log activity
    await prisma.agentActivity.create({
      data: {
        userId,
        agent: 'archer',
        action: 'queued_portal',
        summary: `Queued application for "${job.title}" at ${job.company} via ${job.source}`,
        details: { jobId: job.id, company: job.company, method: 'portal', matchScore: job.matchScore },
        runId,
      },
    });

    // Log to shared agent context
    if (ctx) {
      logActivity(ctx, 'archer', 'queued_portal', `Queued portal application for "${job.title}" at ${job.company} via ${job.source} (match: ${job.matchScore}%)`);
    }

    return { success: true, method: 'portal', strategy: 'standard', jobApplicationId: application.id, details: `Queued portal application for ${job.title} at ${job.company}` };
  }

  // Strategy 2: Cold email
  const companyEmail = findCompanyEmail(job.company);
  if (companyEmail) {
    const emailSubject = `Application for ${job.title} — ${resume.contact.name}`;
    const emailBody = buildApplicationEmail(resume, job, coverLetter);
    
    try {
      const emailResult = await sendEmail({
        to: companyEmail,
        subject: emailSubject,
        html: emailBody,
        text: `${coverLetter}\n\nBest regards,\n${resume.contact.name}\n${resume.contact.email}\n${resume.contact.phone}`,
      });
      
      const application = await prisma.jobApplication.create({
        data: {
          userId,
          jobTitle: job.title,
          company: job.company,
          location: job.location,
          matchScore: job.matchScore || null,
          status: 'EMAILED',
          appliedAt: new Date(),
          source: job.source,
          coverLetter,
          jobUrl: job.url || null,
          autoApplyRunId: runId || null,
          auditTrail: { method: 'email', sentTo: companyEmail, messageId: emailResult.id || null, agentName: 'Archer' },
        },
      });

      await prisma.agentActivity.create({
        data: {
          userId,
          agent: 'archer',
          action: 'sent_email',
          summary: `Emailed application for "${job.title}" to ${companyEmail}`,
          details: { jobId: job.id, company: job.company, method: 'email', sentTo: companyEmail },
          creditsUsed: 1,
          runId,
        },
      });

      // Log to shared agent context
      if (ctx) {
        logActivity(ctx, 'archer', 'sent_email', `Emailed application for "${job.title}" at ${job.company} to ${companyEmail}`);
      }

      return { success: true, method: 'email', strategy: 'standard', jobApplicationId: application.id, details: `Emailed application to ${companyEmail}` };
    } catch (err) {
      console.error('[Archer] Email failed:', err);
    }
  }

  return { success: false, method: 'none', strategy: 'standard', details: `No application method available for ${job.company}` };
}

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
    <p style="font-size: 11px; color: #94a3b8;">This application was sent via 3BOX AI Career Platform</p>
  </div>
</body>
</html>`;
}
