import { describe, expect, it } from 'vitest';

import { parseAuthEnvelope, parseAuthUser, parseAuthUserHeaderJson } from './auth-user';

function minimalValidUserPayload(): Record<string, unknown> {
  const currentTerms = {
    id: 'terms-row',
    versionKey: 'key1',
    title: 'Terms',
    contentText: 'Body',
    announcementStartsAt: null,
    enforcementStartsAt: '2026-01-01T00:00:00.000Z',
    status: 'current',
  };
  return {
    id: '00000000-0000-4000-8000-000000000001',
    email: 'user@example.invalid',
    username: null,
    termsEnforcementStartsAt: '2026-01-01T00:00:00.000Z',
    hasAcceptedLatestTerms: true,
    currentTermsVersionKey: 'key1',
    termsPolicyPhase: 'enforced',
    acceptedCurrentTerms: true,
    acceptedUpcomingTerms: false,
    needsUpcomingTermsAcceptance: false,
    mustAcceptTermsNow: false,
    upcomingTerms: null,
    acceptedTerms: null,
    currentTerms,
  };
}

describe('parseAuthUser', () => {
  it('returns null for non-objects and missing identity', () => {
    expect(parseAuthUser(null)).toBeNull();
    expect(parseAuthUser(undefined)).toBeNull();
    expect(parseAuthUser('x')).toBeNull();
    expect(parseAuthUser({ id: 'x', email: '', username: '' })).toBeNull();
  });

  it('parses minimal valid envelope-shaped user', () => {
    const parsed = parseAuthUser(minimalValidUserPayload());
    expect(parsed).not.toBeNull();
    expect(parsed?.id).toBe('00000000-0000-4000-8000-000000000001');
    expect(parsed?.email).toBe('user@example.invalid');
    expect(parsed?.currentTerms.versionKey).toBe('key1');
  });

  it('parseAuthEnvelope reads nested user object', () => {
    const parsed = parseAuthEnvelope({
      user: minimalValidUserPayload(),
    });
    expect(parsed?.id).toBe('00000000-0000-4000-8000-000000000001');
  });

  it('parseAuthEnvelope returns null when user missing', () => {
    expect(parseAuthEnvelope({})).toBeNull();
    expect(parseAuthEnvelope({ user: null })).toBeNull();
  });
});

describe('parseAuthUserHeaderJson', () => {
  it('returns null for empty header', () => {
    expect(parseAuthUserHeaderJson(null)).toBeNull();
    expect(parseAuthUserHeaderJson('')).toBeNull();
  });

  it('returns null on invalid JSON', () => {
    expect(parseAuthUserHeaderJson('{not-json')).toBeNull();
  });

  it('parses JSON object through parseAuthUser', () => {
    const json = JSON.stringify(minimalValidUserPayload());
    const parsed = parseAuthUserHeaderJson(json);
    expect(parsed?.shortId).toBe('00000000-0000-4000-8000-000000000001');
  });
});
