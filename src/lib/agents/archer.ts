/**
 * Archer Agent — Application Agent
 * Generates cover letters and sends job applications
 */
import { prisma } from '@/lib/db/prisma';
import { aiChatWithFallback } from '@/lib/ai/openrouter';
import { sendEmail } from '@/lib/email';

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
  jobApplicationId?: string;
  details: string;
}

/**
 * Generate a tailored cover letter for a specific job
 */
export async function generateCoverLetter(
  resume: ResumeData,
  job: JobForApplication,
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
    const response = await aiChatWithFallback({ messages: [
      { role: 'system', content: 'You are Archer, a professional job application specialist. Write concise, impactful cover letters. Never use placeholder brackets.' },
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
): Promise<ApplicationResult> {
  // Generate cover letter
  const coverLetter = await generateCoverLetter(resume, job);
  
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

    return { success: true, method: 'portal', jobApplicationId: application.id, details: `Queued portal application for ${job.title} at ${job.company}` };
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

      return { success: true, method: 'email', jobApplicationId: application.id, details: `Emailed application to ${companyEmail}` };
    } catch (err) {
      console.error('[Archer] Email failed:', err);
    }
  }

  return { success: false, method: 'none', details: `No application method available for ${job.company}` };
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
    <p style="font-size: 11px; color: #94a3b8;">This application was sent via NXTED AI Career Platform</p>
  </div>
</body>
</html>`;
}
