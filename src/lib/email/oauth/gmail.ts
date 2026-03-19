/**
 * Gmail OAuth2 Integration
 * Allows users to connect their Gmail account so Archer can
 * send job application emails FROM their personal address.
 *
 * Uses Google OAuth2 with gmail.send scope + googleapis package.
 */
import { google } from 'googleapis';
import { encrypt, decrypt } from './encryption';
import { prisma } from '@/lib/db/prisma';

// Use separate OAuth credentials for Gmail (different scopes than NextAuth Google login)
const GMAIL_CLIENT_ID = process.env.GOOGLE_GMAIL_CLIENT_ID || process.env.GOOGLE_CLIENT_ID;
const GMAIL_CLIENT_SECRET = process.env.GOOGLE_GMAIL_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET;
const SCOPES = ['https://www.googleapis.com/auth/gmail.send', 'https://www.googleapis.com/auth/userinfo.email'];

function getOAuth2Client(redirectUri: string) {
  return new google.auth.OAuth2(GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, redirectUri);
}

/**
 * Generate the Google OAuth2 consent URL for Gmail send access.
 */
export function getGmailAuthUrl(redirectUri: string, state?: string): string {
  const oauth2Client = getOAuth2Client(redirectUri);
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent', // Force consent to always get refresh_token
    state: state || '',
  });
}

/**
 * Exchange authorization code for tokens and store them encrypted in DB.
 */
export async function handleGmailCallback(
  code: string,
  userId: string,
  redirectUri: string,
): Promise<{ success: boolean; email?: string; error?: string }> {
  try {
    const oauth2Client = getOAuth2Client(redirectUri);
    const { tokens } = await oauth2Client.getToken(code);

    if (!tokens.access_token || !tokens.refresh_token) {
      return { success: false, error: 'No tokens received. Try disconnecting and reconnecting.' };
    }

    // Get user's Gmail address via userinfo (covered by userinfo.email scope)
    oauth2Client.setCredentials(tokens);
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const userInfo = await oauth2.userinfo.get();
    const email = userInfo.data.email;

    if (!email) {
      return { success: false, error: 'Could not retrieve email address' };
    }

    // Store encrypted tokens
    const encryptedAccess = encrypt(tokens.access_token);
    const encryptedRefresh = encrypt(tokens.refresh_token);
    const tokenExpiry = tokens.expiry_date
      ? new Date(tokens.expiry_date)
      : new Date(Date.now() + 3600 * 1000);

    await prisma.userEmailConnection.upsert({
      where: {
        userId_provider_email: { userId, provider: 'gmail', email },
      },
      create: {
        userId,
        provider: 'gmail',
        email,
        accessToken: encryptedAccess,
        refreshToken: encryptedRefresh,
        tokenExpiry,
        scopes: SCOPES.join(','),
        isActive: true,
        isPrimary: true,
      },
      update: {
        accessToken: encryptedAccess,
        refreshToken: encryptedRefresh,
        tokenExpiry,
        scopes: SCOPES.join(','),
        isActive: true,
      },
    });

    // Mark any other email connections as non-primary
    await prisma.userEmailConnection.updateMany({
      where: { userId, NOT: { email, provider: 'gmail' } },
      data: { isPrimary: false },
    });

    return { success: true, email };
  } catch (err) {
    console.error('[Gmail OAuth] Callback error:', err);
    return { success: false, error: (err as Error).message };
  }
}

/**
 * Send an email via the user's connected Gmail account.
 * Automatically refreshes token if expired.
 */
export async function sendViaGmail(
  userId: string,
  params: { to: string; subject: string; html: string; text?: string },
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const connection = await prisma.userEmailConnection.findFirst({
      where: { userId, provider: 'gmail', isActive: true },
    });

    if (!connection) {
      return { success: false, error: 'No Gmail account connected' };
    }

    const refreshToken = decrypt(connection.refreshToken);
    let accessToken = decrypt(connection.accessToken);

    const oauth2Client = getOAuth2Client('');
    oauth2Client.setCredentials({
      access_token: accessToken,
      refresh_token: refreshToken,
    });

    // Check if token is expired and refresh
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
      } catch (refreshErr) {
        console.error('[Gmail] Token refresh failed:', refreshErr);
        // Mark connection as inactive
        await prisma.userEmailConnection.update({
          where: { id: connection.id },
          data: { isActive: false },
        });
        return { success: false, error: 'Gmail token expired. Please reconnect your account.' };
      }
    }

    // Build RFC 2822 email
    const fromEmail = connection.email;
    const emailLines = [
      `From: ${fromEmail}`,
      `To: ${params.to}`,
      `Subject: ${params.subject}`,
      'MIME-Version: 1.0',
      'Content-Type: text/html; charset=UTF-8',
      '',
      params.html,
    ];
    const rawMessage = Buffer.from(emailLines.join('\r\n'))
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
    const result = await gmail.users.messages.send({
      userId: 'me',
      requestBody: { raw: rawMessage },
    });

    return { success: true, messageId: result.data.id || undefined };
  } catch (err) {
    console.error('[Gmail] Send error:', err);
    return { success: false, error: (err as Error).message };
  }
}

/**
 * Revoke Gmail access and remove the connection.
 */
export async function revokeGmailAccess(userId: string): Promise<{ success: boolean }> {
  try {
    const connection = await prisma.userEmailConnection.findFirst({
      where: { userId, provider: 'gmail', isActive: true },
    });

    if (connection) {
      try {
        const accessToken = decrypt(connection.accessToken);
        const oauth2Client = getOAuth2Client('');
        oauth2Client.setCredentials({ access_token: accessToken });
        await oauth2Client.revokeToken(accessToken);
      } catch {
        // Token might already be expired/revoked — that's fine
      }

      await prisma.userEmailConnection.delete({ where: { id: connection.id } });
    }

    return { success: true };
  } catch (err) {
    console.error('[Gmail] Revoke error:', err);
    return { success: false };
  }
}

/**
 * Get Gmail connection status for a user.
 */
export async function getGmailStatus(userId: string): Promise<{
  connected: boolean;
  email?: string;
  isPrimary?: boolean;
}> {
  const connection = await prisma.userEmailConnection.findFirst({
    where: { userId, provider: 'gmail', isActive: true },
    select: { email: true, isPrimary: true },
  });

  return connection
    ? { connected: true, email: connection.email, isPrimary: connection.isPrimary }
    : { connected: false };
}
