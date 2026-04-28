import type { ManagementUser } from '@metaboost/management-orm';

import jwt from 'jsonwebtoken';
import { describe, expect, it } from 'vitest';

import {
  resolveManagementJwtClaimOptions,
  signManagementAccessToken,
  signManagementToken,
  verifyManagementToken,
} from './jwt.js';

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

describe('Management JWT iss/aud claims', () => {
  const secret = 'management-jwt-test-secret';

  it('resolveManagementJwtClaimOptions returns undefined when both values are blank', () => {
    expect(resolveManagementJwtClaimOptions(undefined, undefined)).toBeUndefined();
    expect(resolveManagementJwtClaimOptions('   ', '')).toBeUndefined();
  });

  it('trims issuer and audience values', () => {
    expect(
      resolveManagementJwtClaimOptions('  https://management.issuer.invalid  ', '  management-web ')
    ).toEqual({
      issuer: 'https://management.issuer.invalid',
      audience: 'management-web',
    });
  });

  it('signs with optional claims and verifies when claims match', () => {
    const user = managementJwtTestUser();
    const claimOptions = resolveManagementJwtClaimOptions(
      'https://management.issuer.invalid',
      'management-web'
    );
    const token = signManagementToken(user, secret, 900, claimOptions);
    const payload = verifyManagementToken(token, secret, claimOptions);
    expect(payload?.sub).toBe(user.id);
    expect(payload?.id_text).toBe(user.credentials.username);
  });

  it('rejects token verification when issuer is incorrect', () => {
    const user = managementJwtTestUser();
    const claimOptions = resolveManagementJwtClaimOptions(
      'https://management.issuer.invalid',
      'management-web'
    );
    const token = signManagementAccessToken(user, secret, 900, claimOptions);
    expect(
      verifyManagementToken(
        token,
        secret,
        resolveManagementJwtClaimOptions('https://wrong-issuer.invalid', 'management-web')
      )
    ).toBeNull();
  });

  it('returns null for malformed token input', () => {
    expect(verifyManagementToken('bad.token.value', secret, undefined)).toBeNull();
  });

  it('returns null when id_text (username) length is outside 1..USERNAME_MAX_LENGTH', () => {
    const user = managementJwtTestUser();
    const id = user.id;
    const longUser = 'u'.repeat(51);
    const badLong = jwt.sign({ sub: id, id_text: longUser }, secret, { expiresIn: 60 });
    expect(verifyManagementToken(badLong, secret, undefined)).toBeNull();
    const badEmpty = jwt.sign({ sub: id, id_text: '' }, secret, { expiresIn: 60 });
    expect(verifyManagementToken(badEmpty, secret, undefined)).toBeNull();
  });
});
