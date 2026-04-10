import type { Request, Response } from 'express';

import { AUTH_MESSAGE_INVALID_CREDENTIALS, validatePassword } from '@boilerplate/helpers';
import { getPasswordValidationMessages, resolveLocale } from '@boilerplate/helpers-i18n';
import { ManagementRefreshTokenService, ManagementUserService } from '@boilerplate/management-orm';

import { config } from '../config/index.js';
import { setSessionCookies, clearSessionCookies } from '../lib/auth/cookies.js';
import { comparePassword, hashPassword } from '../lib/auth/hash.js';
import { signManagementAccessToken } from '../lib/auth/jwt.js';
import { generateToken, hashToken } from '../lib/auth/refresh-token.js';
import { managementUserToJson } from '../lib/managementUserToJson.js';

function getCookieOptions() {
  return {
    sessionCookieName: config.sessionCookieName,
    refreshCookieName: config.refreshCookieName,
    cookieSecure: config.cookieSecure,
    cookieSameSite: config.cookieSameSite,
    cookieDomain: config.cookieDomain,
    accessMaxAgeSeconds: config.accessTokenMaxAgeSeconds,
    refreshMaxAgeSeconds: config.refreshTokenMaxAgeSeconds,
  };
}

/**
 * Auth responses use managementUserToJson only. Never return req.managementUser or
 * user.credentials; passwordHash and raw tokens must not appear in any response.
 */
export async function login(req: Request, res: Response): Promise<void> {
  const { username, password } = req.body as { username?: string; password?: string };
  if (username === undefined || password === undefined) {
    res.status(400).json({ message: 'Username and password required' });
    return;
  }

  const user = await ManagementUserService.findByUsername(username);
  if (user === null) {
    res.status(401).json({ message: AUTH_MESSAGE_INVALID_CREDENTIALS });
    return;
  }

  const ok = await comparePassword(password, user.credentials.passwordHash);
  if (!ok) {
    res.status(401).json({ message: AUTH_MESSAGE_INVALID_CREDENTIALS });
    return;
  }

  const jwtSecret = config.jwtSecret;
  const accessToken = signManagementAccessToken(user, jwtSecret, config.accessTokenMaxAgeSeconds);
  const refreshRaw = generateToken();
  const refreshHash = hashToken(refreshRaw);
  const refreshExpiresAt = new Date(Date.now() + config.refreshTokenMaxAgeSeconds * 1000);
  await ManagementRefreshTokenService.createToken(user.id, refreshHash, refreshExpiresAt);

  setSessionCookies(res, accessToken, refreshRaw, getCookieOptions());
  res.status(200).json({ user: managementUserToJson(user) });
}

export function logout(req: Request, res: Response): void {
  const refreshRaw = req.cookies?.[config.refreshCookieName];
  if (typeof refreshRaw === 'string' && refreshRaw !== '') {
    const refreshHash = hashToken(refreshRaw);
    void ManagementRefreshTokenService.revokeByTokenHash(refreshHash);
  }
  clearSessionCookies(res, getCookieOptions());
  res.status(204).send();
}

export async function refresh(req: Request, res: Response): Promise<void> {
  const refreshRaw = req.cookies?.[config.refreshCookieName];
  if (typeof refreshRaw !== 'string' || refreshRaw === '') {
    clearSessionCookies(res, getCookieOptions());
    res.status(401).json({ message: 'Authentication required' });
    return;
  }
  const refreshHash = hashToken(refreshRaw);
  const user = await ManagementRefreshTokenService.consumeToken(refreshHash);
  if (user === null) {
    clearSessionCookies(res, getCookieOptions());
    res.status(401).json({ message: 'Invalid or expired session' });
    return;
  }
  const jwtSecret = config.jwtSecret;
  const accessToken = signManagementAccessToken(user, jwtSecret, config.accessTokenMaxAgeSeconds);
  const newRefreshRaw = generateToken();
  const newRefreshHash = hashToken(newRefreshRaw);
  const refreshExpiresAt = new Date(Date.now() + config.refreshTokenMaxAgeSeconds * 1000);
  await ManagementRefreshTokenService.createToken(user.id, newRefreshHash, refreshExpiresAt);

  setSessionCookies(res, accessToken, newRefreshRaw, getCookieOptions());
  res.status(200).json({ user: managementUserToJson(user) });
}

export async function changePassword(req: Request, res: Response): Promise<void> {
  const user = req.managementUser;
  if (user === undefined) {
    res.status(401).json({ message: 'Authentication required' });
    return;
  }
  const { currentPassword, newPassword } = req.body as {
    currentPassword?: string;
    newPassword?: string;
  };
  if (currentPassword === undefined || newPassword === undefined) {
    res.status(400).json({ message: 'Current password and new password required' });
    return;
  }
  const locale = resolveLocale(req.get('Accept-Language'));
  const passwordCheck = validatePassword(newPassword, getPasswordValidationMessages(locale));
  if (!passwordCheck.valid) {
    res.status(400).json({ message: passwordCheck.message });
    return;
  }
  const ok = await comparePassword(currentPassword, user.credentials.passwordHash);
  if (!ok) {
    res.status(401).json({ message: 'Current password is incorrect' });
    return;
  }
  const hashed = await hashPassword(newPassword);
  await ManagementUserService.updatePassword(user.id, hashed);
  res.status(204).send();
}

export async function updateProfile(req: Request, res: Response): Promise<void> {
  const user = req.managementUser;
  if (user === undefined) {
    res.status(401).json({ message: 'Authentication required' });
    return;
  }
  const { displayName } = req.body as { displayName?: string };
  if (displayName === undefined || typeof displayName !== 'string') {
    res.status(400).json({ message: 'Display name required' });
    return;
  }
  const trimmed = displayName.trim();
  if (trimmed === '') {
    res.status(400).json({ message: 'Display name cannot be empty' });
    return;
  }
  await ManagementUserService.updateDisplayName(user.id, trimmed);
  const updated = await ManagementUserService.findById(user.id);
  if (updated !== null) {
    res.status(200).json({ user: managementUserToJson(updated) });
  } else {
    res.status(500).json({ message: 'Failed to load updated profile' });
  }
}

export function me(req: Request, res: Response): void {
  const user = req.managementUser;
  if (user === undefined) {
    res.status(401).json({ message: 'Authentication required' });
    return;
  }
  res.status(200).json({ user: managementUserToJson(user) });
}
