import { CRUD_BITS } from '@metaboost/helpers';
import { request } from '@metaboost/helpers-requests';
import type { ApiResponse } from '@metaboost/helpers-requests';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { ServerUser } from './server-auth';
import {
  canCreateBucketRoles,
  canCreateChildBuckets,
  canDeleteBucket,
  canDeleteBucketMessages,
  canEditBucketMessages,
  canEditBucketRoles,
  canViewBucketSettings,
} from './bucket-authz';
import { getCookieHeader, getServerApiBaseUrl } from './server-request';

vi.mock('@metaboost/helpers-requests', () => ({
  request: vi.fn(),
}));

vi.mock('./server-request', () => ({
  getCookieHeader: vi.fn(),
  getServerApiBaseUrl: vi.fn(),
}));

function makeServerUser(input: { id: string; shortId?: string }): ServerUser {
  return {
    id: input.id,
    shortId: input.shortId ?? input.id,
    email: 'user@example.invalid',
    username: 'user_name',
    displayName: 'User',
    preferredCurrency: 'USD',
    termsAcceptedAt: null,
    acceptedTermsEnforcementStartsAt: null,
    termsEnforcementStartsAt: '2026-01-01T00:00:00.000Z',
    hasAcceptedLatestTerms: true,
    currentTermsVersionKey: 'v1',
    termsPolicyPhase: 'enforced',
    acceptedCurrentTerms: true,
    acceptedUpcomingTerms: false,
    needsUpcomingTermsAcceptance: false,
    upcomingTermsAcceptanceBy: null,
    mustAcceptTermsNow: false,
    termsBlockerMessage: null,
    currentTerms: {
      id: 'terms-v1',
      versionKey: 'v1',
      title: 'Terms',
      contentText: 'Terms body',
      announcementStartsAt: null,
      enforcementStartsAt: '2026-01-01T00:00:00.000Z',
      status: 'current',
    },
    upcomingTerms: null,
    acceptedTerms: null,
  };
}

const mockApiNotFound: ApiResponse<unknown> = {
  ok: false,
  status: 404,
  error: { status: 404, message: 'Not found' },
};

describe('bucket authz frontend helpers', () => {
  const requestMock = vi.mocked(request);
  const getCookieHeaderMock = vi.mocked(getCookieHeader);
  const getServerApiBaseUrlMock = vi.mocked(getServerApiBaseUrl);

  beforeEach(() => {
    requestMock.mockReset();
    getCookieHeaderMock.mockReset();
    getServerApiBaseUrlMock.mockReset();
    getCookieHeaderMock.mockResolvedValue('api_session=test');
    getServerApiBaseUrlMock.mockReturnValue('http://api.local');
  });

  it('owner gets full access without admin fetch calls', async () => {
    const owner = makeServerUser({ id: 'owner-user' });
    await expect(canDeleteBucket('bucket-1', 'owner-user', owner)).resolves.toBe(true);
    await expect(canViewBucketSettings('bucket-1', 'owner-user', owner)).resolves.toBe(true);
    await expect(canCreateChildBuckets('bucket-1', 'owner-user', owner)).resolves.toBe(true);
    await expect(canEditBucketRoles('bucket-1', 'owner-user', owner)).resolves.toBe(true);
    expect(requestMock).not.toHaveBeenCalled();
  });

  it('returns false for non-owner when no bucket-admin record is found', async () => {
    const viewer = makeServerUser({ id: 'viewer-user', shortId: 'viewer-short' });
    requestMock.mockResolvedValue(mockApiNotFound);

    await expect(canDeleteBucket('bucket-1', 'owner-user', viewer)).resolves.toBe(false);
    await expect(canCreateBucketRoles('bucket-1', 'owner-user', viewer)).resolves.toBe(false);
    await expect(canEditBucketMessages('bucket-1', 'owner-user', viewer)).resolves.toBe(false);
    await expect(canDeleteBucketMessages('bucket-1', 'owner-user', viewer)).resolves.toBe(false);
    await expect(canEditBucketRoles('bucket-1', 'owner-user', viewer)).resolves.toBe(false);
  });

  it('falls back from shortId lookup to id lookup and honors CRUD bits', async () => {
    const viewer = makeServerUser({ id: 'viewer-user', shortId: 'viewer-short' });

    const adminPayload = {
      admin: {
        bucketCrud: CRUD_BITS.create | CRUD_BITS.update,
        bucketMessagesCrud: CRUD_BITS.read | CRUD_BITS.delete,
      },
    };
    requestMock.mockImplementation((_base: string, path: string) => {
      if (path.endsWith('/admins/viewer-short')) {
        return Promise.resolve(mockApiNotFound);
      }
      if (path.endsWith('/admins/viewer-user')) {
        return Promise.resolve({ ok: true, status: 200, data: adminPayload });
      }
      return Promise.resolve(mockApiNotFound);
    });

    await expect(canCreateChildBuckets('bucket-1', 'owner-user', viewer)).resolves.toBe(true);
    await expect(canViewBucketSettings('bucket-1', 'owner-user', viewer)).resolves.toBe(true);
    await expect(canDeleteBucket('bucket-1', 'owner-user', viewer)).resolves.toBe(false);
    await expect(canDeleteBucketMessages('bucket-1', 'owner-user', viewer)).resolves.toBe(true);
    await expect(canEditBucketMessages('bucket-1', 'owner-user', viewer)).resolves.toBe(false);
    await expect(canEditBucketRoles('bucket-1', 'owner-user', viewer)).resolves.toBe(false);

    expect(requestMock.mock.calls[0]?.[1]).toBe('/buckets/bucket-1/admins/viewer-short');
    expect(requestMock.mock.calls[1]?.[1]).toBe('/buckets/bucket-1/admins/viewer-user');
  });
});
