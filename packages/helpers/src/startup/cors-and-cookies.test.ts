import { describe, expect, it } from 'vitest';

import {
  corsAllowlistRequiredForCurrentNodeEnv,
  parseCorsOriginsWithStartupEnforcement,
} from './cors-and-cookies.js';

function snapshotEnv(): Record<string, string | undefined> {
  return { ...process.env };
}

function restoreEnv(saved: Record<string, string | undefined>): void {
  const keys = new Set([...Object.keys(process.env), ...Object.keys(saved)]);
  for (const key of keys) {
    const v = saved[key];
    if (v === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = v;
    }
  }
}

describe('parseCorsOriginsWithStartupEnforcement', () => {
  it('allows missing origins when NODE_ENV is development', () => {
    const saved = snapshotEnv();
    try {
      process.env.NODE_ENV = 'development';
      expect(parseCorsOriginsWithStartupEnforcement(undefined, 'API_CORS_ORIGINS')).toBeUndefined();
    } finally {
      restoreEnv(saved);
    }
  });

  it('allows missing origins when NODE_ENV is test', () => {
    const saved = snapshotEnv();
    try {
      process.env.NODE_ENV = 'test';
      expect(parseCorsOriginsWithStartupEnforcement(undefined, 'API_CORS_ORIGINS')).toBeUndefined();
    } finally {
      restoreEnv(saved);
    }
  });

  it('throws when NODE_ENV is production-like and origins are missing', () => {
    const saved = snapshotEnv();
    try {
      process.env.NODE_ENV = 'staging';
      expect(() =>
        parseCorsOriginsWithStartupEnforcement(undefined, 'MANAGEMENT_API_CORS_ORIGINS')
      ).toThrow(/MANAGEMENT_API_CORS_ORIGINS/);
    } finally {
      restoreEnv(saved);
    }
  });

  it('throws when NODE_ENV is production-like and API_CORS_ORIGINS is missing', () => {
    const saved = snapshotEnv();
    try {
      process.env.NODE_ENV = 'production';
      expect(() => parseCorsOriginsWithStartupEnforcement(undefined, 'API_CORS_ORIGINS')).toThrow(
        /API_CORS_ORIGINS/
      );
    } finally {
      restoreEnv(saved);
    }
  });

  it('throws when NODE_ENV is production-like and comma list is empty', () => {
    const saved = snapshotEnv();
    try {
      process.env.NODE_ENV = 'production';
      expect(() => parseCorsOriginsWithStartupEnforcement(' , ', 'API_CORS_ORIGINS')).toThrow(
        /API_CORS_ORIGINS/
      );
    } finally {
      restoreEnv(saved);
    }
  });

  it('returns parsed list when NODE_ENV is production-like and origins are set', () => {
    const saved = snapshotEnv();
    try {
      process.env.NODE_ENV = 'production';
      expect(
        parseCorsOriginsWithStartupEnforcement('https://a.example', 'API_CORS_ORIGINS')
      ).toEqual(['https://a.example']);
    } finally {
      restoreEnv(saved);
    }
  });
});

describe('corsAllowlistRequiredForCurrentNodeEnv', () => {
  it('is false only for development and test', () => {
    const saved = snapshotEnv();
    try {
      process.env.NODE_ENV = 'development';
      expect(corsAllowlistRequiredForCurrentNodeEnv()).toBe(false);
      process.env.NODE_ENV = 'test';
      expect(corsAllowlistRequiredForCurrentNodeEnv()).toBe(false);
      process.env.NODE_ENV = 'production';
      expect(corsAllowlistRequiredForCurrentNodeEnv()).toBe(true);
      process.env.NODE_ENV = 'staging';
      expect(corsAllowlistRequiredForCurrentNodeEnv()).toBe(true);
      delete process.env.NODE_ENV;
      expect(corsAllowlistRequiredForCurrentNodeEnv()).toBe(true);
    } finally {
      restoreEnv(saved);
    }
  });
});
