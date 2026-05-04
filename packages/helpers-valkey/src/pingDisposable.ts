import type { CreateValkeyRedisClientOptions } from './client.js';

import { isEnvLogLevelDebug } from '@metaboost/helpers';

import { createValkeyRedisClient } from './client.js';

const DEFAULT_PING_TIMEOUT_MS = 5000;

/**
 * One-shot Valkey check for readiness probes: new client, PING with timeout, always `quit`.
 * Does not reuse the process singleton used for runtime traffic.
 */
export async function pingValkeyWithDisposableClient(options?: {
  timeoutMs?: number;
  clientOptions?: CreateValkeyRedisClientOptions;
}): Promise<boolean> {
  const timeoutMs = options?.timeoutMs ?? DEFAULT_PING_TIMEOUT_MS;
  const redis = createValkeyRedisClient(options?.clientOptions);
  try {
    await Promise.race([
      redis.ping(),
      new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('ping timeout')), timeoutMs);
      }),
    ]);
    return true;
  } catch (error) {
    if (isEnvLogLevelDebug()) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`Valkey readiness check failed: ${message}`);
    }
    return false;
  } finally {
    await redis.quit().catch(() => {});
  }
}
