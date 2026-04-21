import { describe, expect, it, vi } from 'vitest';

import {
  generateToken,
  getEmailChangeExpiry,
  getEmailVerifyExpiry,
  getPasswordResetExpiry,
  getSetPasswordExpiry,
  hashToken,
} from './verification-token.js';

describe('verification token helpers', () => {
  it('generateToken returns 32-byte random token as 64-char hex', () => {
    const token = generateToken();
    expect(token).toMatch(/^[a-f0-9]{64}$/);
  });

  it('hashToken is deterministic and sha256-sized', () => {
    const hashedA = hashToken('token-value');
    const hashedB = hashToken('token-value');
    const hashedC = hashToken('different-token');
    expect(hashedA).toBe(hashedB);
    expect(hashedA).not.toBe(hashedC);
    expect(hashedA).toMatch(/^[a-f0-9]{64}$/);
  });

  it('email verify expiry is approximately +24 hours', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-21T10:00:00.000Z'));
    const expiry = getEmailVerifyExpiry();
    expect(expiry.toISOString()).toBe('2026-04-22T10:00:00.000Z');
    vi.useRealTimers();
  });

  it('password reset expiry is approximately +1 hour', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-21T10:00:00.000Z'));
    const expiry = getPasswordResetExpiry();
    expect(expiry.toISOString()).toBe('2026-04-21T11:00:00.000Z');
    vi.useRealTimers();
  });

  it('set password expiry is approximately +7 days', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-21T10:00:00.000Z'));
    const expiry = getSetPasswordExpiry();
    expect(expiry.toISOString()).toBe('2026-04-28T10:00:00.000Z');
    vi.useRealTimers();
  });

  it('email change expiry is approximately +24 hours', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-21T10:00:00.000Z'));
    const expiry = getEmailChangeExpiry();
    expect(expiry.toISOString()).toBe('2026-04-22T10:00:00.000Z');
    vi.useRealTimers();
  });
});
