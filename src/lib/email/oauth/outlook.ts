/**
 * Microsoft Outlook OAuth2 Integration
 * Allows users to connect their Outlook/Office 365 account so Archer
 * can send job application emails FROM their personal address.
 *
 * Uses Microsoft Graph API with Mail.Send permission.
 */
import { Client } from '@microsoft/microsoft-graph-client';
import { encrypt, decrypt } from './encryption';

const { prisma } = require('@/lib/db/prisma');

const MICROSOFT_CLIENT_ID = process.env.MICROSOFT_CLIENT_ID || '';
const MICROSOFT_CLIENT_SECRET = process.env.MICROSOFT_CLIENT_SECRET || '';
const MICROSOFT_TENANT_ID = process.env.MICROSOFT_TENANT_ID || 'common';
const SCOPES = ['Mail.Send', 'User.Read', 'offline_access'];

const AUTHORITY = `https://login.microsoftonline.com/${MICROSOFT_TENANT_ID}`;
const TOKEN_URL = `${AUTHORITY}/oauth2/v2.0/token`;
const AUTH_URL = `${AUTHORITY}/oauth2/v2.0/authorize`;

/**
 * Generate the Microsoft OAuth2 consent URL for Outlook send access.
 */
export function getOutlookAuthUrl(redirectUri: string, state?: string): string {
  const params = new URLSearchParams({
    client_id: MICROSOFT_CLIENT_ID,
    response_type: 'code',
    redirect_uri: redirectUri,
    response_mode: 'query',
    scope: SCOPES.join(' '),
    state: state || '',
    prompt: 'consent',
  });

  return `${AUTH_URL}?${params.toString()}`;
}

/**
 * Exchange authorization code for tokens and store them encrypted in DB.
 */
export async function handleOutlookCallback(
  code: string,
  userId: string,
  redirectUri: string,
): Promise<{ success: boolean; email?: string; error?: string }> {
  try {
    // Exchange code for tokens
    const tokenRes = await fetch(TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: MICROSOFT_CLIENT_ID,
        client_secret: MICROSOFT_CLIENT_SECRET,
        code,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
        scope: SCOPES.join(' '),
      }),
    });

    if (!tokenRes.ok) {
      const errData = await tokenRes.json().catch(() => ({}));
      return { success: false, error: errData.error_description || 'Token exchange failed' };
    }

    const tokens = await tokenRes.json();

    if (!tokens.access_token || !tokens.refresh_token) {
      return { success: false, error: 'No tokens received. Try again.' };
    }

    // Get user's email via Graph API
    const client = Client.init({
      authProvider: (done) => done(null, tokens.access_token),
    });
    const me = await client.api('/me').select('mail,userPrincipalName').get();
    const email = me.mail || me.userPrincipalName;

    if (!email) {
      return { success: false, error: 'Could not retrieve email address' };
    }

    // Store encrypted tokens
    const encryptedAccess = encrypt(tokens.access_token);
    const encryptedRefresh = encrypt(tokens.refresh_token);
    const tokenExpiry = new Date(Date.now() + (tokens.expires_in || 3600) * 1000);

    await prisma.userEmailConnection.upsert({
      where: {
        userId_provider_email: { userId, provider: 'outlook', email },
      },
      create: {
        userId,
        provider: 'outlook',
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

    // Mark other connections as non-primary
    await prisma.userEmailConnection.updateMany({
      where: { userId, NOT: { email, provider: 'outlook' } },
      data: { isPrimary: false },
    });

    return { success: true, email };
  } catch (err) {
    console.error('[Outlook OAuth] Callback error:', err);
    return { success: false, error: (err as Error).message };
  }
}

/**
 * Refresh Outlook access token using the stored refresh token.
 */
async function refreshOutlookToken(connectionId: string, refreshToken: string): Promise<string | null> {
  try {
    const res = await fetch(TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: MICROSOFT_CLIENT_ID,
        client_secret: MICROSOFT_CLIENT_SECRET,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
        scope: SCOPES.join(' '),
      }),
    });

    if (!res.ok) return null;

    const tokens = await res.json();
    if (!tokens.access_token) return null;

    // Update stored tokens
    await prisma.userEmailConnection.update({
      where: { id: connectionId },
      data: {
        accessToken: encrypt(tokens.access_token),
        refreshToken: tokens.refresh_token ? encrypt(tokens.refresh_token) : undefined,
        tokenExpiry: new Date(Date.now() + (tokens.expires_in || 3600) * 1000),
      },
    });

    return tokens.access_token;
  } catch {
    return null;
  }
}

/**
 * Send an email via the user's connected Outlook account.
 */
export async function sendViaOutlook(
  userId: string,
  params: { to: string; subject: string; html: string; text?: string },
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const connection = await prisma.userEmailConnection.findFirst({
      where: { userId, provider: 'outlook', isActive: true },
    });

    if (!connection) {
      return { success: false, error: 'No Outlook account connected' };
    }

    let accessToken = decrypt(connection.accessToken);
    const refreshToken = decrypt(connection.refreshToken);

    // Refresh if expired
    if (new Date() >= new Date(connection.tokenExpiry)) {
      const newToken = await refreshOutlookToken(connection.id, refreshToken);
      if (!newToken) {
        await prisma.userEmailConnection.update({
          where: { id: connection.id },
          data: { isActive: false },
        });
        return { success: false, error: 'Outlook token expired. Please reconnect your account.' };
      }
      accessToken = newToken;
    }

    // Send via Microsoft Graph
    const client = Client.init({
      authProvider: (done) => done(null, accessToken),
    });

    const message = {
      subject: params.subject,
      body: {
        contentType: 'HTML',
        content: params.html,
      },
      toRecipients: [
        { emailAddress: { address: params.to } },
      ],
    };

    await client.api('/me/sendMail').post({ message, saveToSentItems: true });

    return { success: true };
  } catch (err) {
    console.error('[Outlook] Send error:', err);
    return { success: false, error: (err as Error).message };
  }
}

/**
 * Revoke Outlook access and remove the connection.
 */
export async function revokeOutlookAccess(userId: string): Promise<{ success: boolean }> {
  try {
    const connection = await prisma.userEmailConnection.findFirst({
      where: { userId, provider: 'outlook', isActive: true },
    });

    if (connection) {
      await prisma.userEmailConnection.delete({ where: { id: connection.id } });
    }

    return { success: true };
  } catch (err) {
    console.error('[Outlook] Revoke error:', err);
    return { success: false };
  }
}

/**
 * Get Outlook connection status for a user.
 */
export async function getOutlookStatus(userId: string): Promise<{
  connected: boolean;
  email?: string;
  isPrimary?: boolean;
}> {
  const connection = await prisma.userEmailConnection.findFirst({
    where: { userId, provider: 'outlook', isActive: true },
    select: { email: true, isPrimary: true },
  });

  return connection
    ? { connected: true, email: connection.email, isPrimary: connection.isPrimary }
    : { connected: false };
}
