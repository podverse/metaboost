import { afterEach, describe, expect, it, vi } from 'vitest';

const pingMock = vi.fn();
const quitMock = vi.fn().mockResolvedValue(undefined);

vi.mock('./client.js', () => ({
  createValkeyRedisClient: vi.fn(() => ({
    ping: pingMock,
    quit: quitMock,
  })),
}));

import { pingValkeyWithDisposableClient } from './pingDisposable.js';

describe('pingValkeyWithDisposableClient debug logging', () => {
  afterEach(() => {
    delete process.env.LOG_LEVEL;
    pingMock.mockReset();
    quitMock.mockClear();
    vi.restoreAllMocks();
  });

  it('does not log ping error message when LOG_LEVEL is not debug', async () => {
    pingMock.mockRejectedValueOnce(new Error('valkey down'));
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    const ok = await pingValkeyWithDisposableClient();

    expect(ok).toBe(false);
    expect(consoleErrorSpy).not.toHaveBeenCalled();
    expect(quitMock).toHaveBeenCalledTimes(1);
  });

  it('logs ping error message when LOG_LEVEL is debug', async () => {
    process.env.LOG_LEVEL = 'debug';
    pingMock.mockRejectedValueOnce(new Error('valkey timeout'));
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    const ok = await pingValkeyWithDisposableClient();

    expect(ok).toBe(false);
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('Valkey readiness check failed: valkey timeout')
    );
    expect(quitMock).toHaveBeenCalledTimes(1);
  });
});
