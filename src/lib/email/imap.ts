/**
 * IMAP email reader — works with any IMAP provider (Gmail, Outlook, etc).
 * Read-only — used by admin dashboard to view incoming emails.
 */

// @ts-ignore - imapflow types
import { ImapFlow } from 'imapflow';

export interface EmailMessage {
  id: string;
  uid: number;
  from: { name: string; address: string };
  to: string[];
  subject: string;
  date: Date;
  preview: string;
  seen: boolean;
}

export function isImapConfigured(): boolean {
  return !!(
    process.env.IMAP_HOST &&
    process.env.IMAP_USER &&
    process.env.IMAP_PASSWORD
  );
}

function extractTextPreview(rawSource: string, maxLength: number): string {
  const bodyStart = rawSource.indexOf('\r\n\r\n');
  if (bodyStart === -1) return '';

  let body = rawSource.substring(bodyStart + 4);
  body = body.replace(/<[^>]*>/g, ' ');
  body = body
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
  body = body.replace(/\s+/g, ' ').trim();

  return body.substring(0, maxLength);
}

export async function fetchRecentEmails(limit: number = 50): Promise<EmailMessage[]> {
  if (!isImapConfigured()) {
    throw new Error('IMAP not configured');
  }

  const client = new ImapFlow({
    host: process.env.IMAP_HOST!,
    port: 993,
    secure: true,
    auth: {
      user: process.env.IMAP_USER!,
      pass: process.env.IMAP_PASSWORD!,
    },
    logger: false,
  });

  try {
    await client.connect();
    const lock = await client.getMailboxLock('INBOX');

    try {
      const messages: EmailMessage[] = [];
      const totalMessages = (client.mailbox as any)?.exists || 0;

      if (totalMessages === 0) return [];

      const startSeq = Math.max(1, totalMessages - limit + 1);

      for await (const message of client.fetch(`${startSeq}:*`, {
        envelope: true,
        flags: true,
        source: { start: 0, maxLength: 1000 },
      })) {
        const from = message.envelope?.from?.[0];
        const to = message.envelope?.to?.map((t: any) => t.address) || [];

        messages.push({
          id: message.uid?.toString() || message.seq?.toString() || '',
          uid: message.uid || 0,
          from: {
            name: from?.name || '',
            address: from?.address || '',
          },
          to,
          subject: message.envelope?.subject || '(No subject)',
          date: message.envelope?.date || new Date(),
          preview: message.source
            ? extractTextPreview(message.source.toString(), 200)
            : '',
          seen: message.flags?.has('\\Seen') || false,
        });
      }

      return messages.sort((a, b) => b.date.getTime() - a.date.getTime());
    } finally {
      lock.release();
    }
  } finally {
    await client.logout();
  }
}
