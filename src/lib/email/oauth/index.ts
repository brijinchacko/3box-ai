/**
 * Unified OAuth Email Interface
 * Provides a single function to send email from user's connected account.
 * Supports Gmail, Outlook, and custom SMTP with automatic provider detection.
 */

import { sendViaGmail, getGmailStatus } from './gmail';
import { sendViaOutlook, getOutlookStatus } from './outlook';
import { decrypt } from './encryption';

const { prisma } = require('@/lib/db/prisma');

export { getGmailAuthUrl, handleGmailCallback, revokeGmailAccess, getGmailStatus } from './gmail';
export { getOutlookAuthUrl, handleOutlookCallback, revokeOutlookAccess, getOutlookStatus } from './outlook';
export { encrypt, decrypt } from './encryption';

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

interface SendResult {
  success: boolean;
  messageId?: string;
  sentFrom?: string;     // Which email address was used
  provider?: string;     // 'gmail' | 'outlook' | 'resend'
  error?: string;
}

/**
 * Send email via the user's connected email account (Gmail or Outlook).
 * Automatically detects which provider is connected and uses the primary one.
 *
 * @returns SendResult with provider info
 */
export async function sendViaUserEmail(
  userId: string,
  params: SendEmailParams,
): Promise<SendResult> {
  // Find the user's primary (or any active) email connection
  const connection = await prisma.userEmailConnection.findFirst({
    where: { userId, isActive: true },
    orderBy: [{ isPrimary: 'desc' }, { updatedAt: 'desc' }],
    select: { provider: true, email: true },
  });

  if (!connection) {
    return { success: false, error: 'No email account connected' };
  }

  if (connection.provider === 'gmail') {
    const result = await sendViaGmail(userId, params);
    return {
      ...result,
      sentFrom: connection.email,
      provider: 'gmail',
    };
  }

  if (connection.provider === 'outlook') {
    const result = await sendViaOutlook(userId, params);
    return {
      ...result,
      sentFrom: connection.email,
      provider: 'outlook',
    };
  }

  if (connection.provider === 'smtp') {
    const result = await sendViaSmtp(userId, params);
    return {
      ...result,
      sentFrom: connection.email,
      provider: 'smtp',
    };
  }

  return { success: false, error: `Unknown email provider: ${connection.provider}` };
}

/**
 * Send email via the user's custom SMTP configuration.
 */
async function sendViaSmtp(
  userId: string,
  params: SendEmailParams,
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const connection = await prisma.userEmailConnection.findFirst({
      where: { userId, provider: 'smtp', isActive: true },
    });

    if (!connection) {
      return { success: false, error: 'No SMTP configuration found' };
    }

    let config: Record<string, string> = {};
    try {
      config = JSON.parse(connection.scopes || '{}');
    } catch {}

    const password = decrypt(connection.accessToken);

    // Dynamic import nodemailer to avoid issues if not installed
    const nodemailer = require('nodemailer');
    const transporter = nodemailer.createTransport({
      host: config.host,
      port: parseInt(config.port || '587'),
      secure: parseInt(config.port || '587') === 465,
      auth: {
        user: connection.email,
        pass: password,
      },
      connectionTimeout: 15000,
    });

    const fromAddress = config.fromName
      ? `${config.fromName} <${connection.email}>`
      : connection.email;

    const result = await transporter.sendMail({
      from: fromAddress,
      to: params.to,
      subject: params.subject,
      html: params.html,
      text: params.text,
    });

    return { success: true, messageId: result.messageId };
  } catch (err) {
    console.error('[SMTP] Send error:', err);
    return { success: false, error: (err as Error).message };
  }
}

/**
 * Check if the user has any active email connection.
 */
export async function hasConnectedEmail(userId: string): Promise<boolean> {
  const count = await prisma.userEmailConnection.count({
    where: { userId, isActive: true },
  });
  return count > 0;
}

/**
 * Get all connected email accounts for a user.
 */
export async function getConnectedEmails(userId: string): Promise<{
  gmail?: { email: string; isPrimary: boolean };
  outlook?: { email: string; isPrimary: boolean };
  smtp?: { email: string; isPrimary: boolean };
}> {
  const [gmail, outlook, smtpConn] = await Promise.all([
    getGmailStatus(userId),
    getOutlookStatus(userId),
    prisma.userEmailConnection.findFirst({
      where: { userId, provider: 'smtp', isActive: true },
      select: { email: true, isPrimary: true },
    }),
  ]);

  return {
    gmail: gmail.connected ? { email: gmail.email!, isPrimary: gmail.isPrimary! } : undefined,
    outlook: outlook.connected ? { email: outlook.email!, isPrimary: outlook.isPrimary! } : undefined,
    smtp: smtpConn ? { email: smtpConn.email, isPrimary: smtpConn.isPrimary } : undefined,
  };
}
