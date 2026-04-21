import { createValkeyRedisClient, type Redis } from '@metaboost/helpers-valkey';

let client: Redis | undefined;

function getClient(): Redis {
  if (client === undefined) {
    client = createValkeyRedisClient();
  }
  return client;
}

/**
 * Stores `iss`+`jti` once until TTL; returns false if key already existed (replay).
 */
export async function tryRegisterAppAssertionNonce(options: {
  iss: string;
  jti: string;
  ttlSeconds: number;
}): Promise<boolean> {
  const key = `mb:app_assertion:${options.iss}:${options.jti}`;
  const r = await getClient().set(key, '1', 'EX', Math.max(1, options.ttlSeconds), 'NX');
  return r === 'OK';
}

export async function disconnectReplayStoreForTests(): Promise<void> {
  if (client !== undefined) {
    await client.quit();
    client = undefined;
  }
}
