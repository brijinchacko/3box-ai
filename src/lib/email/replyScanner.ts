/**
 * Reply Scanner — Auto-detects application responses via Gmail API.
 *
 * Connects to a user's Gmail via their stored OAuth credentials,
 * searches for recent emails from companies they've applied to,
 * and auto-updates application status based on keyword matching.
 *
 * NOTE: Requires `gmail.readonly` scope on the user's email connection.
 * If the user only has `gmail.send`, this scanner will skip them and
 * log a notice. The scope must be added to the OAuth consent flow
 * in `src/lib/email/oauth/gmail.ts` (SCOPES array).
 */

import { google } from 'googleapis';
import { prisma } from '@/lib/db/prisma';
import { decrypt, encrypt } from '@/lib/email/oauth/encryption';
import type { ApplicationStatus } from '@prisma/client';

// ─── Types ──────────────────────────────────────

export interface ScanResult {
  userId: string;
  updates: StatusUpdate[];
  errors: string[];
  skipped: boolean;
  skipReason?: string;
}

export interface StatusUpdate {
  applicationId: string;
  company: string;
  jobTitle: string;
  oldStatus: ApplicationStatus;
  newStatus: ApplicationStatus;
  matchedKeyword: string;
  emailSubject: string;
  emailFrom: string;
  emailDate: string;
}

// ─── Keyword → Status mapping ───────────────────

const STATUS_RULES: {
  status: ApplicationStatus;
  keywords: string[];
  /** Only upgrade — never downgrade from these statuses */
  minCurrentStatus?: ApplicationStatus[];
}[] = [
  {
    status: 'OFFER',
    keywords: [
      'pleased to offer',
      'congratulations',
      'offer letter',
      'offer of employment',
      'we are pleased to extend',
      'compensation package',
    ],
  },
  {
    status: 'INTERVIEW',
    keywords: [
      'schedule an interview',
      'interview invitation',
      'would like to discuss',
      'would love to chat',
      'like to set up a call',
      'schedule a call',
      'technical interview',
      'phone screen',
      'coding challenge',
      'next steps in our process',
      'move forward with your application',
      'proceed to the next round',
    ],
  },
  {
    status: 'REJECTED',
    keywords: [
      'unfortunately',
      'not moving forward',
      'other candidates',
      'decided not to proceed',
      'will not be moving forward',
      'position has been filled',
      'not a fit at this time',
      'pursue other applicants',
      'decided to go with another',
      'unable to offer you',
      'regret to inform',
    ],
  },
  {
    status: 'VIEWED',
    keywords: [
      'thank you for applying',
      'application received',
      'we received your application',
      'application has been received',
      'your application for',
      'confirming receipt',
    ],
  },
];

/**
 * Status priority for upgrade-only logic.
 * We only update status if the new status is "higher" in the pipeline.
 */
const STATUS_PRIORITY: Record<ApplicationStatus, number> = {
  QUEUED: 0,
  APPLIED: 1,
  EMAILED: 2,
  VIEWED: 3,
  INTERVIEW: 4,
  OFFER: 5,
  REJECTED: 5, // Same level as OFFER — both are terminal-ish
  WITHDRAWN: 6, // User-initiated, never auto-change
};

// ─── Gmail OAuth helpers ────────────────────────

const GMAIL_CLIENT_ID = process.env.GOOGLE_GMAIL_CLIENT_ID || process.env.GOOGLE_CLIENT_ID;
const GMAIL_CLIENT_SECRET = process.env.GOOGLE_GMAIL_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET;
const REQUIRED_SCOPE = 'https://www.googleapis.com/auth/gmail.readonly';

function createOAuth2Client() {
  return new google.auth.OAuth2(GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, '');
}

async function getAuthedGmailClient(connection: {
  id: string;
  accessToken: string;
  refreshToken: string;
  tokenExpiry: Date;
  scopes: string;
}) {
  // Check that gmail.readonly scope is present
  const scopes = connection.scopes.split(',').map((s) => s.trim());
  if (!scopes.includes(REQUIRED_SCOPE)) {
    return { client: null, scopeMissing: true };
  }

  const oauth2Client = createOAuth2Client();
  const refreshToken = decrypt(connection.refreshToken);
  let accessToken = decrypt(connection.accessToken);

  oauth2Client.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken,
  });

  // Refresh if expired
  if (new Date() >= new Date(connection.tokenExpiry)) {
    try {
      const { credentials } = await oauth2Client.refreshAccessToken();
      if (credentials.access_token) {
        accessToken = credentials.access_token;
        await prisma.userEmailConnection.update({
          where: { id: connection.id },
          data: {
            accessToken: encrypt(credentials.access_token),
            tokenExpiry: credentials.expiry_date
              ? new Date(credentials.expiry_date)
              : new Date(Date.now() + 3600 * 1000),
          },
        });
        oauth2Client.setCredentials(credentials);
      }
    } catch (err) {
      console.error('[ReplyScanner] Token refresh failed:', err);
      await prisma.userEmailConnection.update({
        where: { id: connection.id },
        data: { isActive: false },
      });
      return { client: null, tokenError: true };
    }
  }

  return { client: google.gmail({ version: 'v1', auth: oauth2Client }), scopeMissing: false };
}

// ─── Core scanner ───────────────────────────────

/**
 * Scan a single user's Gmail inbox for application responses.
 * Returns a list of status updates that were applied.
 */
export async function scanUserReplies(userId: string): Promise<ScanResult> {
  const result: ScanResult = { userId, updates: [], errors: [], skipped: false };

  try {
    // 1. Get the user's Gmail connection
    const connection = await prisma.userEmailConnection.findFirst({
      where: { userId, provider: 'gmail', isActive: true },
    });

    if (!connection) {
      result.skipped = true;
      result.skipReason = 'No active Gmail connection';
      return result;
    }

    // 2. Auth with Gmail API
    const { client: gmail, scopeMissing, tokenError } = await getAuthedGmailClient(connection) as any;

    if (scopeMissing) {
      result.skipped = true;
      result.skipReason = `Missing required scope: ${REQUIRED_SCOPE}. User needs to reconnect Gmail with read permissions.`;
      return result;
    }

    if (tokenError || !gmail) {
      result.skipped = true;
      result.skipReason = 'Gmail token expired or invalid. User needs to reconnect.';
      return result;
    }

    // 3. Get user's active applications (not WITHDRAWN, not already OFFER)
    const applications = await prisma.jobApplication.findMany({
      where: {
        userId,
        status: { notIn: ['WITHDRAWN', 'OFFER'] as ApplicationStatus[] },
      },
      select: {
        id: true,
        company: true,
        jobTitle: true,
        status: true,
        emailSentTo: true,
        appliedAt: true,
        createdAt: true,
      },
    });

    if (applications.length === 0) {
      result.skipped = true;
      result.skipReason = 'No active applications to scan for';
      return result;
    }

    // 4. Build company domain set for Gmail search
    const companyNames = [...new Set(applications.map((a: any) => a.company))];

    // Search Gmail for emails from these companies in the last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const afterDate = sevenDaysAgo.toISOString().split('T')[0].replace(/-/g, '/');

    // Build query: from:company1 OR from:company2 ... after:date
    // Gmail search is fuzzy enough that company names work as from-filters
    const fromClauses = companyNames
      .slice(0, 20) // Limit to avoid query being too long
      .map((c: string) => `from:${c.toLowerCase().replace(/[^a-z0-9 ]/g, '')}`)
      .join(' OR ');

    const query = `(${fromClauses}) after:${afterDate} in:inbox`;

    let messageIds: string[] = [];
    try {
      const listResponse = await gmail.users.messages.list({
        userId: 'me',
        q: query,
        maxResults: 100,
      });
      messageIds = (listResponse.data.messages || []).map((m: any) => m.id!);
    } catch (err) {
      result.errors.push(`Gmail search failed: ${(err as Error).message}`);
      return result;
    }

    if (messageIds.length === 0) {
      return result; // No matching emails found — that's fine
    }

    // 5. Fetch each message and analyze
    for (const msgId of messageIds) {
      try {
        const msg = await gmail.users.messages.get({
          userId: 'me',
          id: msgId,
          format: 'metadata',
          metadataHeaders: ['From', 'Subject', 'Date'],
        });

        const headers = msg.data.payload?.headers || [];
        const fromHeader = headers.find((h: any) => h.name === 'From')?.value || '';
        const subject = headers.find((h: any) => h.name === 'Subject')?.value || '';
        const dateStr = headers.find((h: any) => h.name === 'Date')?.value || '';

        // Also get the snippet (preview text) for keyword matching
        const snippet = msg.data.snippet || '';

        // Try to match against applications
        const matchedApp = matchEmailToApplication(
          fromHeader,
          subject,
          applications,
        );

        if (!matchedApp) continue;

        // Detect status from subject + snippet
        const detected = detectStatus(subject, snippet);
        if (!detected) continue;

        // Only upgrade status, never downgrade
        const currentPriority = STATUS_PRIORITY[matchedApp.status as ApplicationStatus] || 0;
        const newPriority = STATUS_PRIORITY[detected.status] || 0;

        if (newPriority <= currentPriority) continue;

        // 6. Update the application status
        await prisma.jobApplication.update({
          where: { id: matchedApp.id },
          data: { status: detected.status },
        });

        const update: StatusUpdate = {
          applicationId: matchedApp.id,
          company: matchedApp.company,
          jobTitle: matchedApp.jobTitle,
          oldStatus: matchedApp.status as ApplicationStatus,
          newStatus: detected.status,
          matchedKeyword: detected.keyword,
          emailSubject: subject,
          emailFrom: fromHeader,
          emailDate: dateStr,
        };

        result.updates.push(update);

        // 7. Log as AgentActivity
        await prisma.agentActivity.create({
          data: {
            userId,
            agent: 'sentinel',
            action: 'auto_status_update',
            summary: `Auto-updated "${matchedApp.jobTitle}" at ${matchedApp.company} from ${matchedApp.status} to ${detected.status}`,
            details: {
              applicationId: matchedApp.id,
              oldStatus: matchedApp.status,
              newStatus: detected.status,
              matchedKeyword: detected.keyword,
              emailSubject: subject,
              emailFrom: fromHeader,
            },
            creditsUsed: 0,
          },
        });
      } catch (msgErr) {
        result.errors.push(`Failed to process message ${msgId}: ${(msgErr as Error).message}`);
      }
    }
  } catch (err) {
    result.errors.push(`Scanner error: ${(err as Error).message}`);
  }

  return result;
}

// ─── Matching helpers ───────────────────────────

/**
 * Match an email to one of the user's applications by comparing
 * the sender/subject against company names.
 */
function matchEmailToApplication(
  from: string,
  subject: string,
  applications: Array<{
    id: string;
    company: string;
    jobTitle: string;
    status: string;
    emailSentTo: string | null;
  }>,
) {
  const fromLower = from.toLowerCase();
  const subjectLower = subject.toLowerCase();

  for (const app of applications) {
    const companyLower = app.company.toLowerCase();

    // Try exact company name match in From header or subject
    // e.g., "John from Google <recruiting@google.com>" or subject: "Your Google Application"
    const companyWords = companyLower.split(/\s+/).filter((w) => w.length > 2);
    const companyMatch =
      fromLower.includes(companyLower) ||
      subjectLower.includes(companyLower) ||
      // Also try matching the primary word of the company name
      (companyWords.length > 0 && companyWords.some((w) => fromLower.includes(w)));

    if (companyMatch) {
      return app;
    }

    // Try matching company domain in email address
    // e.g., "no-reply@google.com" for company "Google"
    const emailMatch = fromLower.match(/<([^>]+)>/);
    if (emailMatch) {
      const emailDomain = emailMatch[1].split('@')[1]?.split('.')[0];
      if (emailDomain && companyWords.some((w) => emailDomain.includes(w))) {
        return app;
      }
    }
  }

  return null;
}

/**
 * Detect the application status from email subject + snippet
 * by matching against keyword rules.
 */
function detectStatus(
  subject: string,
  snippet: string,
): { status: ApplicationStatus; keyword: string } | null {
  const text = `${subject} ${snippet}`.toLowerCase();

  // Check rules in priority order (OFFER > INTERVIEW > REJECTED > VIEWED)
  for (const rule of STATUS_RULES) {
    for (const keyword of rule.keywords) {
      if (text.includes(keyword)) {
        return { status: rule.status, keyword };
      }
    }
  }

  return null;
}

// ─── Batch scanner ──────────────────────────────

/**
 * Scan replies for multiple users, processing in batches.
 */
export async function scanRepliesBatch(
  userIds: string[],
  batchSize: number = 5,
): Promise<ScanResult[]> {
  const results: ScanResult[] = [];

  for (let i = 0; i < userIds.length; i += batchSize) {
    const batch = userIds.slice(i, i + batchSize);
    const batchResults = await Promise.allSettled(
      batch.map((uid) => scanUserReplies(uid)),
    );

    for (const res of batchResults) {
      if (res.status === 'fulfilled') {
        results.push(res.value);
      } else {
        results.push({
          userId: batch[batchResults.indexOf(res)] || 'unknown',
          updates: [],
          errors: [res.reason?.message || 'Unknown error'],
          skipped: true,
          skipReason: 'Unhandled exception',
        });
      }
    }
  }

  return results;
}
