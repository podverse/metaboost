/**
 * Reads Metaboost Valkey connection settings from the standard `KEYVALDB_*` env vars.
 * Empty `KEYVALDB_PASSWORD` is treated as no password (matches ioredis expectations).
 */
export function parseValkeyConnectionFromEnv(env: NodeJS.ProcessEnv = process.env): {
  host: string;
  port: number;
  password: string | undefined;
} {
  const host = env.KEYVALDB_HOST ?? 'localhost';
  const port = Number.parseInt(env.KEYVALDB_PORT ?? '6379', 10);
  const raw = env.KEYVALDB_PASSWORD ?? '';
  const password = raw === '' ? undefined : raw;
  return { host, port, password };
}
