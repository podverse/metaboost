import type { ManagementUser } from '@metaboost/management-orm';

import jwt from 'jsonwebtoken';
import { describe, expect, it } from 'vitest';

import { signManagementAccessToken, signManagementToken, verifyManagementToken } from './jwt.js';

function managementJwtTestUser(): ManagementUser {
  return {
    id: '00000000-0000-4000-8000-000000000123',
    idText: 'mgmtjwt1',
    createdAt: new Date(0),
    updatedAt: new Date(0),
    credentials: {
      id: '11111111-1111-4111-8111-111111111111',
      userId: '00000000-0000-4000-8000-000000000123',
      username: 'management_jwt_user',
      passwordHash: 'p'.repeat(60),
      createdAt: new Date(0),
      updatedAt: new Date(0),
    },
    displayName: null,
    isSuperAdmin: false,
    emailVerifiedAt: null,
    disabledAt: null,
  } as unknown as ManagementUser;
}

describe('Management JWT core sign/verify', () => {
  const secret = 'management-jwt-test-secret';

  it('signs and verifies management token with core claims', () => {
    const user = managementJwtTestUser();
    const token = signManagementToken(user, secret, 900);
    const payload = verifyManagementToken(token, secret);
    expect(payload?.sub).toBe(user.id);
    expect(payload?.id_text).toBe(user.credentials.username);
  });

  it('signs and verifies short-lived access token', () => {
    const user = managementJwtTestUser();
    const token = signManagementAccessToken(user, secret, 900);
    const payload = verifyManagementToken(token, secret);
    expect(payload?.sub).toBe(user.id);
    expect(payload?.id_text).toBe(user.credentials.username);
  });

  it('returns null for malformed token input', () => {
    expect(verifyManagementToken('bad.token.value', secret)).toBeNull();
  });

  it('returns null when id_text (username) length is outside 1..USERNAME_MAX_LENGTH', () => {
    const user = managementJwtTestUser();
    const id = user.id;
    const longUser = 'u'.repeat(51);
    const badLong = jwt.sign({ sub: id, id_text: longUser }, secret, { expiresIn: 60 });
    expect(verifyManagementToken(badLong, secret)).toBeNull();
    const badEmpty = jwt.sign({ sub: id, id_text: '' }, secret, { expiresIn: 60 });
    expect(verifyManagementToken(badEmpty, secret)).toBeNull();
  });

  it('returns null when token signature does not match provided secret', () => {
    const user = managementJwtTestUser();
    const token = signManagementAccessToken(user, secret, 900);
    expect(verifyManagementToken(token, 'wrong-secret')).toBeNull();
  });
});
