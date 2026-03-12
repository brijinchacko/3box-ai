/**
 * Extension Authentication
 * Manages JWT token storage and validation.
 */

import { validateAuth } from './api-client';

export interface UserInfo {
  id: string;
  name: string;
  email: string;
  plan: string;
  image: string | null;
}

/**
 * Store the auth token received from the 3BOX web app.
 */
export async function setAuthToken(token: string): Promise<UserInfo> {
  await chrome.storage.local.set({ authToken: token });

  // Validate immediately
  const { user } = await validateAuth();
  await chrome.storage.local.set({ userInfo: user });

  return user;
}

/**
 * Get stored user info (without API call).
 */
export async function getUserInfo(): Promise<UserInfo | null> {
  const result = await chrome.storage.local.get('userInfo');
  return (result.userInfo as UserInfo) || null;
}

/**
 * Check if user is authenticated (quick local check).
 */
export async function isAuthenticated(): Promise<boolean> {
  const { authToken } = await chrome.storage.local.get('authToken');
  return !!authToken;
}

/**
 * Validate the stored token with the server.
 */
export async function refreshAuth(): Promise<UserInfo | null> {
  try {
    const { user } = await validateAuth();
    await chrome.storage.local.set({ userInfo: user });
    return user;
  } catch {
    // Token expired or invalid
    await logout();
    return null;
  }
}

/**
 * Clear all auth data.
 */
export async function logout(): Promise<void> {
  await chrome.storage.local.remove(['authToken', 'userInfo', 'resumeData']);
}
