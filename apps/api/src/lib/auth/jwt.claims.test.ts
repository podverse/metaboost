import type { User, UserWithRelations } from '@metaboost/orm';

import { describe, expect, it } from 'vitest';

import { TEST_JWT_SECRET_API } from '@metaboost/helpers';

import { resolveJwtClaimOptions, signAccessToken, signToken, verifyToken } from './jwt.js';

function jwtTestUser(): UserWithRelations {
  const id = '00000000-0000-4000-8000-000000000099';
  const userStub = { id } as User;
  return {
    id,
    shortId: 'jwttstu1',
    emailVerifiedAt: null,
    createdAt: new Date(0),
    updatedAt: new Date(0),
    credentials: {
      userId: id,
      email: 'jwt-policy-test@invalid',
      username: 'jwt_policy_test',
      passwordHash: 'p'.repeat(60),
      user: userStub,
    },
    bio: null,
  } as unknown as UserWithRelations;
}

describe('API JWT iss/aud claims', () => {
  it('resolveJwtClaimOptions returns undefined when both issuer and audience are unset', () => {
    expect(resolveJwtClaimOptions(undefined, undefined)).toBeUndefined();
    expect(resolveJwtClaimOptions('   ', '')).toBeUndefined();
  });

  it('signs with iss/aud when configured and verifyToken enforces presence', () => {
    const user = jwtTestUser();
    const secret = TEST_JWT_SECRET_API;
    const claimOpts = resolveJwtClaimOptions('https://issuer.invalid', 'metaboost-api-clients');
    const token = signAccessToken(user, secret, 900, claimOpts);
    expect(token.length).toBeGreaterThan(10);
    expect(verifyToken(token, secret, claimOpts)?.sub).toBe(user.id);
    expect(
      verifyToken(token, secret, resolveJwtClaimOptions('https://wrong-issuer.invalid', undefined))
    ).toBeNull();
  });

  it('trims issuer and audience values and excludes empty claims', () => {
    expect(resolveJwtClaimOptions('  https://issuer.invalid  ', '  api-client  ')).toEqual({
      issuer: 'https://issuer.invalid',
      audience: 'api-client',
    });
    expect(resolveJwtClaimOptions('  https://issuer.invalid  ', '   ')).toEqual({
      issuer: 'https://issuer.invalid',
      audience: undefined,
    });
  });

  it('verifies tokens without claim options when claim options are not configured', () => {
    const user = jwtTestUser();
    const secret = TEST_JWT_SECRET_API;
    const token = signToken(user, secret, 900, undefined);
    expect(verifyToken(token, secret, undefined)?.sub).toBe(user.id);
  });

  it('returns null for malformed tokens', () => {
    const secret = TEST_JWT_SECRET_API;
    expect(verifyToken('not-a-token', secret, undefined)).toBeNull();
  });
});
