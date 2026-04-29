import type { User, UserWithRelations } from '@metaboost/orm';

import jwt from 'jsonwebtoken';
import { describe, expect, it } from 'vitest';

import { TEST_JWT_SECRET_API } from '@metaboost/helpers';

import { signAccessToken, signToken, verifyToken } from './jwt.js';

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

describe('API JWT core sign/verify', () => {
  it('signs and verifies access token with core claims', () => {
    const user = jwtTestUser();
    const secret = TEST_JWT_SECRET_API;
    const token = signAccessToken(user, secret, 900);
    expect(token.length).toBeGreaterThan(10);
    const payload = verifyToken(token, secret);
    expect(payload?.sub).toBe(user.id);
    expect(payload?.id_text).toBe(user.idText);
  });

  it('signs and verifies generic token payloads', () => {
    const user = jwtTestUser();
    const secret = TEST_JWT_SECRET_API;
    const token = signToken(user, secret, 900);
    const payload = verifyToken(token, secret);
    expect(payload?.sub).toBe(user.id);
    expect(payload?.id_text).toBe(user.idText);
  });

  it('returns null for malformed tokens', () => {
    const secret = TEST_JWT_SECRET_API;
    expect(verifyToken('not-a-token', secret)).toBeNull();
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
    expect(verifyToken(tooShort, secret)).toBeNull();
    expect(verifyToken(tooLong, secret)).toBeNull();
  });

  it('returns null when token signature does not match provided secret', () => {
    const user = jwtTestUser();
    const token = signAccessToken(user, TEST_JWT_SECRET_API, 900);
    expect(verifyToken(token, 'wrong-secret')).toBeNull();
  });
});
