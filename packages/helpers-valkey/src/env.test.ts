import { describe, expect, it } from 'vitest';

import { parseValkeyConnectionFromEnv } from './env.js';

describe('parseValkeyConnectionFromEnv', () => {
  it('uses defaults and treats empty password as undefined', () => {
    const env = {
      KEYVALDB_HOST: undefined,
      KEYVALDB_PORT: undefined,
      KEYVALDB_PASSWORD: '',
    } as unknown as NodeJS.ProcessEnv;

    const result = parseValkeyConnectionFromEnv(env);
    expect(result.host).toBe('localhost');
    expect(result.port).toBe(6379);
    expect(result.password).toBeUndefined();
  });

  it('parses host, port, and password when set', () => {
    const env = {
      KEYVALDB_HOST: 'valkey.internal',
      KEYVALDB_PORT: '6380',
      KEYVALDB_PASSWORD: 'secret',
    } as unknown as NodeJS.ProcessEnv;

    expect(parseValkeyConnectionFromEnv(env)).toEqual({
      host: 'valkey.internal',
      port: 6380,
      password: 'secret',
    });
  });
});
