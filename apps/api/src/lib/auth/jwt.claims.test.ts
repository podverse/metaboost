import type { User, UserWithRelations } from '@metaboost/orm';

import jwt from 'jsonwebtoken';
import { describe, expect, it } from 'vitest';

import { TEST_JWT_SECRET_API } from '@metaboost/helpers';

import { resolveJwtClaimOptions, signAccessToken, signToken, verifyToken } from './jwt.js';

function jwtTestUser(): UserWithRelations {
  const id = '00000000-0000-4000-8000-000000000099';
  const userStub = { id } as User;
  return {
    id,
    idText: 'jwttestu1x0',
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
    const payload = verifyToken(token, secret, claimOpts);
    expect(payload?.sub).toBe(user.id);
    expect(payload?.id_text).toBe(user.idText);
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
    const payload = verifyToken(token, secret, undefined);
    expect(payload?.sub).toBe(user.id);
    expect(payload?.id_text).toBe(user.idText);
  });

  it('returns null for malformed tokens', () => {
    const secret = TEST_JWT_SECRET_API;
    expect(verifyToken('not-a-token', secret, undefined)).toBeNull();
  });

  it('returns null when id_text length is outside nano_id_v2 bounds (9–15)', () => {
    const user = jwtTestUser();
    const secret = TEST_JWT_SECRET_API;
    const tooShort = jwt.sign(
      { sub: user.id, id_text: '12345678', email: null, username: null },
      secret,
      { expiresIn: 60 }
    );
    const tooLong = jwt.sign(
      { sub: user.id, id_text: '1234567890123456', email: null, username: null },
      secret,
      { expiresIn: 60 }
    );
    expect(verifyToken(tooShort, secret, undefined)).toBeNull();
    expect(verifyToken(tooLong, secret, undefined)).toBeNull();
  });
});
