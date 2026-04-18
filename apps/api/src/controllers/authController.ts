import type {
  ChangePasswordBody,
  ForgotPasswordBody,
  LoginBody,
  RequestEmailChangeBody,
  ResetPasswordBody,
  SetPasswordBody,
  SignupBody,
  UpdateProfileBody,
  WithOptionalToken,
} from '@metaboost/helpers-requests';
import type { Request, Response } from 'express';

import { AUTH_MESSAGE_INVALID_CREDENTIALS, validatePassword } from '@metaboost/helpers';
import { getPasswordValidationMessages, resolveLocale } from '@metaboost/helpers-i18n';
import { UserService, VerificationTokenService, RefreshTokenService } from '@metaboost/orm';

import { config } from '../config/index.js';
import { setSessionCookies, clearSessionCookies } from '../lib/auth/cookies.js';
import { hashPassword, comparePassword } from '../lib/auth/hash.js';
import { signAccessToken } from '../lib/auth/jwt.js';
import { verifyToken } from '../lib/auth/jwt.js';
import {
  generateToken,
  hashToken,
  getEmailVerifyExpiry,
  getPasswordResetExpiry,
  getEmailChangeExpiry,
} from '../lib/auth/verification-token.js';
import {
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendEmailChangeVerificationEmail,
} from '../lib/mailer/send.js';
import { userToJson } from '../lib/userToJson.js';

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

export async function login(req: Request, res: Response): Promise<void> {
  const { email: identifier, password } = req.body as LoginBody;

  const user = await UserService.findByEmailOrUsername(identifier);
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
  const accessToken = signAccessToken(user, jwtSecret, config.accessTokenMaxAgeSeconds);
  const refreshRaw = generateToken();
  const refreshHash = hashToken(refreshRaw);
  const refreshExpiresAt = new Date(Date.now() + config.refreshTokenMaxAgeSeconds * 1000);
  await RefreshTokenService.createToken(user.id, refreshHash, refreshExpiresAt);

  setSessionCookies(res, accessToken, refreshRaw, getCookieOptions());
  res.status(200).json({ user: userToJson(user) });
}

export function logout(req: Request, res: Response): void {
  const refreshRaw = req.cookies?.[config.refreshCookieName];
  if (typeof refreshRaw === 'string' && refreshRaw !== '') {
    const refreshHash = hashToken(refreshRaw);
    void RefreshTokenService.revokeByTokenHash(refreshHash);
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
  const user = await RefreshTokenService.consumeToken(refreshHash);
  if (user === null) {
    clearSessionCookies(res, getCookieOptions());
    res.status(401).json({ message: 'Invalid or expired session' });
    return;
  }
  const jwtSecret = config.jwtSecret;
  const accessToken = signAccessToken(user, jwtSecret, config.accessTokenMaxAgeSeconds);
  const newRefreshRaw = generateToken();
  const newRefreshHash = hashToken(newRefreshRaw);
  const refreshExpiresAt = new Date(Date.now() + config.refreshTokenMaxAgeSeconds * 1000);
  await RefreshTokenService.createToken(user.id, newRefreshHash, refreshExpiresAt);

  setSessionCookies(res, accessToken, newRefreshRaw, getCookieOptions());
  res.status(200).json({ user: userToJson(user) });
}

export async function changePassword(req: Request, res: Response): Promise<void> {
  const user = req.user;
  if (user === undefined) {
    res.status(401).json({ message: 'Authentication required' });
    return;
  }

  const { currentPassword, newPassword } = req.body as ChangePasswordBody;

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
  await UserService.updatePassword(user.id, hashed);

  res.status(204).send();
}

export async function signup(req: Request, res: Response): Promise<void> {
  const body = req.body as SignupBody;

  const locale = resolveLocale(req.get('Accept-Language'));
  const passwordCheck = validatePassword(body.password, getPasswordValidationMessages(locale));
  if (!passwordCheck.valid) {
    res.status(400).json({ message: passwordCheck.message });
    return;
  }

  const existingEmail = await UserService.findByEmail(body.email);
  if (existingEmail !== null) {
    res.status(201).json({ message: 'Check your email to verify your account.' });
    return;
  }

  const existingUsername = await UserService.findByUsername(body.username);
  if (existingUsername !== null) {
    res.status(409).json({ message: 'Username already in use' });
    return;
  }

  const hashed = await hashPassword(body.password);
  const user = await UserService.create({
    email: body.email,
    username: body.username,
    password: hashed,
    displayName: body.displayName ?? null,
  });

  try {
    const rawToken = generateToken();
    const tokenHash = hashToken(rawToken);
    await VerificationTokenService.createToken(
      user.id,
      'email_verify',
      tokenHash,
      getEmailVerifyExpiry(),
      null
    );
    const email = user.credentials.email;
    if (email !== null && email !== undefined && email !== '') {
      await sendVerificationEmail(email, rawToken, locale);
    }
  } catch {
    // Continue; user is created, verification email best-effort
  }
  res.status(201).json({ message: 'Check your email to verify your account.' });
}

export async function verifyEmail(req: Request, res: Response): Promise<void> {
  const token = (req.body as WithOptionalToken)?.token ?? (req.query as WithOptionalToken).token;
  if (token === undefined || typeof token !== 'string' || token === '') {
    res.status(400).json({ message: 'Invalid or expired link' });
    return;
  }
  const tokenHash = hashToken(token);
  const consumed = await VerificationTokenService.consumeToken(tokenHash, 'email_verify');
  if (consumed === null) {
    res.status(400).json({ message: 'Invalid or expired link' });
    return;
  }
  await UserService.setEmailVerifiedAt(consumed.user.id);
  res.status(200).json({ message: 'Email verified' });
}

export async function forgotPassword(req: Request, res: Response): Promise<void> {
  const { email } = req.body as ForgotPasswordBody;
  const locale = resolveLocale(req.get('Accept-Language'));
  const user = await UserService.findByEmail(email);
  if (user !== null) {
    try {
      const rawToken = generateToken();
      const tokenHash = hashToken(rawToken);
      await VerificationTokenService.createToken(
        user.id,
        'password_reset',
        tokenHash,
        getPasswordResetExpiry(),
        null
      );
      const email = user.credentials.email;
      if (email !== null && email !== undefined && email !== '') {
        await sendPasswordResetEmail(email, rawToken, locale);
      }
    } catch {
      // No enumeration: still return success
    }
  }
  res.status(200).json({
    message: 'If an account exists with this email, you will receive a reset link.',
  });
}

export async function resetPassword(req: Request, res: Response): Promise<void> {
  const { token, newPassword } = req.body as ResetPasswordBody;
  const tokenHash = hashToken(token);
  const consumed = await VerificationTokenService.consumeToken(tokenHash, 'password_reset');
  if (consumed === null) {
    res.status(400).json({ message: 'Invalid or expired link' });
    return;
  }
  const locale = resolveLocale(req.get('Accept-Language'));
  const passwordCheck = validatePassword(newPassword, getPasswordValidationMessages(locale));
  if (!passwordCheck.valid) {
    res.status(400).json({ message: passwordCheck.message });
    return;
  }
  const hashed = await hashPassword(newPassword);
  await UserService.updatePassword(consumed.user.id, hashed);
  res.status(204).send();
}

export async function setPassword(req: Request, res: Response): Promise<void> {
  const { token, newPassword, username, email } = req.body as SetPasswordBody;
  const tokenHash = hashToken(token);
  const tokenRecord = await VerificationTokenService.findValidToken(tokenHash, 'set_password');
  if (tokenRecord === null) {
    res.status(400).json({ message: 'Invalid or expired link' });
    return;
  }

  const requiresUsername = config.authModeCapabilities.canIssueAdminInviteLink;
  const requiresEmail = config.authModeCapabilities.requiresEmailAtInviteCompletion;
  const normalizedUsername =
    typeof username === 'string' && username.trim() !== '' ? username.trim() : null;
  const normalizedEmail = typeof email === 'string' && email.trim() !== '' ? email.trim() : null;

  if (requiresUsername && normalizedUsername === null) {
    res.status(400).json({ message: 'Username is required' });
    return;
  }
  if (requiresEmail && normalizedEmail === null) {
    res.status(400).json({ message: 'Email is required' });
    return;
  }

  if (normalizedUsername !== null) {
    const existingUsername = await UserService.findByUsername(normalizedUsername);
    if (existingUsername !== null && existingUsername.id !== tokenRecord.user.id) {
      res.status(409).json({ message: 'Username already in use' });
      return;
    }
  }
  if (normalizedEmail !== null) {
    const existingEmail = await UserService.findByEmail(normalizedEmail);
    if (existingEmail !== null && existingEmail.id !== tokenRecord.user.id) {
      res.status(409).json({ message: 'Email already in use' });
      return;
    }
  }

  const locale = resolveLocale(req.get('Accept-Language'));
  const passwordCheck = validatePassword(newPassword, getPasswordValidationMessages(locale));
  if (!passwordCheck.valid) {
    res.status(400).json({ message: passwordCheck.message });
    return;
  }

  const consumed = await VerificationTokenService.consumeTokenById(
    tokenRecord.id,
    tokenHash,
    'set_password'
  );
  if (!consumed) {
    res.status(400).json({ message: 'Invalid or expired link' });
    return;
  }

  const hashed = await hashPassword(newPassword);
  await UserService.updatePassword(tokenRecord.user.id, hashed);
  if (normalizedUsername !== null) {
    await UserService.updateUsername(tokenRecord.user.id, normalizedUsername);
  }
  if (normalizedEmail !== null) {
    await UserService.updateEmail(tokenRecord.user.id, normalizedEmail);
    await UserService.setEmailVerifiedAt(tokenRecord.user.id);
  }
  res.status(204).send();
}

export async function requestEmailChange(req: Request, res: Response): Promise<void> {
  const user = req.user;
  if (user === undefined) {
    res.status(401).json({ message: 'Authentication required' });
    return;
  }
  const { newEmail } = req.body as RequestEmailChangeBody;
  if (newEmail === user.credentials.email) {
    res.status(400).json({ message: 'New email must differ from current' });
    return;
  }
  const existing = await UserService.findByEmail(newEmail);
  if (existing !== null) {
    res.status(409).json({ message: 'Email already in use' });
    return;
  }
  try {
    const rawToken = generateToken();
    const tokenHash = hashToken(rawToken);
    await VerificationTokenService.createToken(
      user.id,
      'email_change',
      tokenHash,
      getEmailChangeExpiry(),
      { pending_email: newEmail }
    );
    const locale = resolveLocale(req.get('Accept-Language'));
    await sendEmailChangeVerificationEmail(newEmail, rawToken, locale);
  } catch {
    res.status(500).json({ message: 'Failed to send verification email' });
    return;
  }
  res.status(200).json({ message: 'Verification email sent' });
}

export async function confirmEmailChange(req: Request, res: Response): Promise<void> {
  const token = (req.body as WithOptionalToken)?.token ?? (req.query as WithOptionalToken).token;
  if (token === undefined || typeof token !== 'string' || token === '') {
    res.status(400).json({ message: 'Invalid or expired link' });
    return;
  }
  const tokenHash = hashToken(token);
  const consumed = await VerificationTokenService.consumeToken(tokenHash, 'email_change');
  if (consumed === null) {
    res.status(400).json({ message: 'Invalid or expired link' });
    return;
  }
  const pending =
    consumed.payload !== null && typeof consumed.payload.pending_email === 'string'
      ? consumed.payload.pending_email
      : null;
  if (pending === null) {
    res.status(400).json({ message: 'Invalid or expired link' });
    return;
  }
  await UserService.updateEmail(consumed.user.id, pending);
  await UserService.setEmailVerifiedAt(consumed.user.id);
  res.status(200).json({ message: 'Email updated' });
}

export async function updateProfile(req: Request, res: Response): Promise<void> {
  const user = req.user;
  if (user === undefined) {
    res.status(401).json({ message: 'Authentication required' });
    return;
  }
  const body = req.body as UpdateProfileBody;
  if (body.username !== undefined) {
    const normalizedUsername =
      body.username === null || body.username === '' ? null : body.username.trim();
    if (normalizedUsername === null) {
      const current = await UserService.findById(user.id);
      if (
        current !== null &&
        (current.credentials.email === null || current.credentials.email === '')
      ) {
        res.status(400).json({ message: 'Must have email or username' });
        return;
      }
    } else {
      const existing = await UserService.findByUsername(normalizedUsername);
      if (existing !== null && existing.id !== user.id) {
        res.status(409).json({ message: 'Username already in use' });
        return;
      }
    }
    await UserService.updateUsername(user.id, normalizedUsername);
  }
  if (body.displayName !== undefined) {
    await UserService.updateDisplayName(user.id, body.displayName ?? null);
  }
  if (body.preferredCurrency !== undefined) {
    const normalizedPreferredCurrency =
      body.preferredCurrency === null || body.preferredCurrency.trim() === ''
        ? null
        : body.preferredCurrency.trim().toUpperCase();
    await UserService.updatePreferredCurrency(user.id, normalizedPreferredCurrency);
  }
  const updated = await UserService.findById(user.id);
  if (updated !== null) {
    res.status(200).json({ user: userToJson(updated) });
  } else {
    res.status(500).json({ message: 'Failed to load updated profile' });
  }
}

export function me(req: Request, res: Response): void {
  const user = req.user;
  if (user === undefined) {
    res.status(401).json({ message: 'Authentication required' });
    return;
  }
  res.status(200).json({ user: userToJson(user) });
}

/**
 * GET /auth/username-available?username=... — check if username is available.
 * If authenticated, current user's own username is considered available.
 */
export async function usernameAvailable(req: Request, res: Response): Promise<void> {
  const raw = typeof req.query.username === 'string' ? req.query.username.trim() : '';
  if (raw === '') {
    res.status(200).json({ available: false });
    return;
  }

  const cookieToken =
    typeof req.cookies?.[config.sessionCookieName] === 'string' &&
    req.cookies[config.sessionCookieName] !== ''
      ? req.cookies[config.sessionCookieName]
      : undefined;
  const authHeader = req.headers.authorization;
  const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : undefined;
  const token =
    cookieToken ?? (bearerToken !== undefined && bearerToken !== '' ? bearerToken : undefined);
  const tokenPayload = token !== undefined ? verifyToken(token, config.jwtSecret) : null;

  const existing = await UserService.findByUsername(raw);
  const currentUserId = req.user?.id ?? tokenPayload?.sub;
  const available =
    existing === null || (currentUserId !== undefined && existing.id === currentUserId);
  res.status(200).json({ available });
}
