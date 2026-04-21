import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockSet = vi.fn();

vi.mock('@metaboost/helpers-valkey', () => ({
  createValkeyRedisClient: (): { set: typeof mockSet } => ({
    set: mockSet,
  }),
}));

import { disconnectReplayStoreForTests, tryRegisterAppAssertionNonce } from './replayStore.js';

describe('replayStore tryRegisterAppAssertionNonce', () => {
  beforeEach(async () => {
    mockSet.mockReset();
    await disconnectReplayStoreForTests();
  });

  it('stores iss+jti with NX and TTL; returns true when Redis accepts', async () => {
    mockSet.mockResolvedValue('OK');

    await expect(
      tryRegisterAppAssertionNonce({ iss: 'app-one', jti: 'nonce-abc', ttlSeconds: 120 })
    ).resolves.toBe(true);

    expect(mockSet).toHaveBeenCalledWith(
      'mb:app_assertion:app-one:nonce-abc',
      '1',
      'EX',
      120,
      'NX'
    );
  });

  it('returns false when key already existed (replay)', async () => {
    mockSet.mockResolvedValue(null);

    await expect(
      tryRegisterAppAssertionNonce({ iss: 'app-two', jti: 'replay-jti', ttlSeconds: 60 })
    ).resolves.toBe(false);
  });

  it('uses TTL at least 1 second when ttlSeconds is 0', async () => {
    mockSet.mockResolvedValue('OK');

    await tryRegisterAppAssertionNonce({ iss: 'a', jti: 'b', ttlSeconds: 0 });

    expect(mockSet).toHaveBeenCalledWith('mb:app_assertion:a:b', '1', 'EX', 1, 'NX');
  });
});
