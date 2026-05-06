import { NextResponse, NextRequest } from 'next/server';
import { sendEmail } from '@/lib/email';

/**
 * POST /api/contact
 * Lead-capture form for ad landing pages.
 * Validates input, sends an email to the team inbox, and returns a success
 * boolean. Designed to be lightweight and not depend on any new DB models.
 */

const TEAM_EMAIL = 'nishinth.m@wartens.com';
const MAX_LEN = {
  name: 120,
  email: 200,
  phone: 40,
  message: 4000,
};

function escapeHtml(s: string): string {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const name = String(body?.name || '').trim().slice(0, MAX_LEN.name);
    const email = String(body?.email || '').trim().toLowerCase().slice(0, MAX_LEN.email);
    const phone = String(body?.phone || '').trim().slice(0, MAX_LEN.phone);
    const message = String(body?.message || '').trim().slice(0, MAX_LEN.message);
    const source = String(body?.source || 'launch').trim().slice(0, 80);

    // Validation
    if (!name || name.length < 2) {
      return NextResponse.json({ error: 'Please enter your name.' }, { status: 400 });
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 });
    }
    if (!message || message.length < 5) {
      return NextResponse.json({ error: 'Please enter a brief message (min 5 characters).' }, { status: 400 });
    }

    // Honeypot — if a hidden "company" field is filled, treat as bot
    if (typeof body?.company === 'string' && body.company.trim().length > 0) {
      // Silently accept to avoid telling bots they tripped the trap
      return NextResponse.json({ success: true });
    }

    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const ua = request.headers.get('user-agent') || 'unknown';

    const html = `
      <h2>New lead from ${escapeHtml(source)}</h2>
      <p><strong>Name:</strong> ${escapeHtml(name)}</p>
      <p><strong>Email:</strong> <a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a></p>
      ${phone ? `<p><strong>Phone:</strong> ${escapeHtml(phone)}</p>` : ''}
      <p><strong>Message:</strong></p>
      <p style="white-space:pre-wrap;border-left:3px solid #00d4ff;padding-left:12px;color:#374151;">${escapeHtml(message)}</p>
      <hr/>
      <p style="font-size:12px;color:#6b7280;">Source: ${escapeHtml(source)} &middot; IP: ${escapeHtml(ip)} &middot; UA: ${escapeHtml(ua.slice(0, 200))}</p>
    `;

    const text = `New lead from ${source}\n\nName: ${name}\nEmail: ${email}${phone ? `\nPhone: ${phone}` : ''}\n\nMessage:\n${message}\n\n---\nSource: ${source}\nIP: ${ip}`;

    const result = await sendEmail({
      to: TEAM_EMAIL,
      subject: `[3BOX Lead] ${name} — ${source}`,
      html,
      text,
    });

    if (result.error) {
      console.error('[Contact API] Send error:', result.error);
      return NextResponse.json(
        { error: 'Could not send your message. Please try again or email us directly.' },
        { status: 503 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('[Contact API] Error:', err?.message || err);
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 },
    );
  }
}
