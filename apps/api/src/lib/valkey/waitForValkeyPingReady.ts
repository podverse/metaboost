import { isEnvLogLevelDebug } from '@metaboost/helpers';
import { createValkeyRedisClient } from '@metaboost/helpers-valkey';

const MAX_WAIT_MS = 120_000;
const RETRY_MS = 2000;
const PING_TIMEOUT_MS = 5000;

async function pingOnce(client: ReturnType<typeof createValkeyRedisClient>): Promise<Error | null> {
  try {
    await Promise.race([
      client.ping(),
      new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('ping timeout')), PING_TIMEOUT_MS);
      }),
    ]);
    return null;
  } catch (error) {
    return error instanceof Error ? error : new Error(String(error));
  }
}

/** Blocks until Valkey responds to PING or throws after {@link MAX_WAIT_MS}. */
export async function waitForValkeyPingReadyOrThrow(): Promise<void> {
  const redis = createValkeyRedisClient();
  try {
    const deadline = Date.now() + MAX_WAIT_MS;
    let lastPingError: Error | null = null;
    while (Date.now() < deadline) {
      const pingError = await pingOnce(redis);
      if (pingError === null) {
        return;
      }
      lastPingError = pingError;
      await new Promise<void>((resolve) => setTimeout(resolve, RETRY_MS));
    }
    const finalPingError = await pingOnce(redis);
    if (finalPingError !== null) {
      lastPingError = finalPingError;
    }
    if (lastPingError !== null && isEnvLogLevelDebug()) {
      console.error(`Valkey startup readiness check failed: ${lastPingError.message}`);
    }
    if (lastPingError !== null) {
      throw new Error('FATAL: Valkey is unreachable at startup (KEYVALDB_* configured).');
    }
  } finally {
    await redis.quit().catch(() => {});
  }
}
