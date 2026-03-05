import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin';
import { isImapConfigured, fetchRecentEmails } from '@/lib/email/imap';

export async function GET() {
  const { error, status } = await requireAdmin();
  if (error) return NextResponse.json({ error }, { status });

  if (!isImapConfigured()) {
    return NextResponse.json({
      configured: false,
      emails: [],
      message:
        'IMAP not configured. Set IMAP_HOST, IMAP_USER, and IMAP_PASSWORD in .env',
    });
  }

  try {
    const emails = await fetchRecentEmails(50);
    return NextResponse.json({ configured: true, emails });
  } catch (err: any) {
    console.error('[Admin Email] IMAP error:', err.message);
    return NextResponse.json({
      configured: true,
      emails: [],
      error: 'Failed to connect to email server: ' + err.message,
    });
  }
}
