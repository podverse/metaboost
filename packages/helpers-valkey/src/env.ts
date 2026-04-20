/**
 * Reads Metaboost Valkey connection settings from the standard `VALKEY_*` env vars.
 * Empty `VALKEY_PASSWORD` is treated as no password (matches ioredis expectations).
 */
export function parseValkeyConnectionFromEnv(env: NodeJS.ProcessEnv = process.env): {
  host: string;
  port: number;
  password: string | undefined;
} {
  const host = env.VALKEY_HOST ?? 'localhost';
  const port = Number.parseInt(env.VALKEY_PORT ?? '6379', 10);
  const raw = env.VALKEY_PASSWORD ?? '';
  const password = raw === '' ? undefined : raw;
  return { host, port, password };
}
