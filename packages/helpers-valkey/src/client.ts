import { Redis, type RedisOptions } from 'ioredis';

import { parseValkeyConnectionFromEnv } from './env.js';

/** Between reconnect attempts after Valkey drops mid-flight (~1/min; avoids log spam vs aggressive backoff). */
const RECONNECT_DELAY_MS = 60_000;

const DEFAULT_OPTIONS = {
  maxRetriesPerRequest: 2,
  enableReadyCheck: true,
  retryStrategy: (): number => RECONNECT_DELAY_MS,
} as const satisfies Partial<RedisOptions>;

export type CreateValkeyRedisClientOptions = Partial<RedisOptions> & {
  /** Env map to read `KEYVALDB_*` from (default: `process.env`). */
  env?: NodeJS.ProcessEnv;
};

/**
 * Builds an ioredis client using `KEYVALDB_HOST`, `KEYVALDB_PORT`, and `KEYVALDB_PASSWORD`,
 * with defaults suitable for Metaboost services. Additional options override env-derived fields.
 */
export function createValkeyRedisClient(options?: CreateValkeyRedisClientOptions): Redis {
  const env = options?.env ?? process.env;
  const { host, port, password } = parseValkeyConnectionFromEnv(env);
  const { env: _omitEnv, ...overrides } = options ?? {};
  return new Redis({
    ...DEFAULT_OPTIONS,
    host,
    port,
    password,
    ...overrides,
  });
}
