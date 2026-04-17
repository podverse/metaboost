import type { RegistryAppRecord } from './types.js';

import { buildAppRegistryRecordUrl } from '../../config/sEndpointRegistry.js';

export type LoadAppRecordFailureReason = 'not_found' | 'unavailable';

export type LoadAppRecordResult =
  | { ok: true; record: RegistryAppRecord }
  | { ok: false; reason: LoadAppRecordFailureReason };

type CacheEntry = {
  record: RegistryAppRecord;
  etag: string | undefined;
  loadedAtMs: number;
};

/**
 * Fetches `<base>/<app_id>.app.json` with per-app ETag and in-memory last-known-good cache.
 * On network error with no cache: fail closed (unavailable).
 */
export class AppRegistryService {
  private readonly cache = new Map<string, CacheEntry>();

  constructor(
    private readonly options: {
      registryBaseUrl: string;
      pollIntervalMs: number;
      fetchTimeoutMs: number;
      fetchFn?: typeof fetch;
    }
  ) {}

  private get fetchImpl(): typeof fetch {
    return this.options.fetchFn ?? globalThis.fetch.bind(globalThis);
  }

  /**
   * Returns cached record if fresh enough; otherwise re-fetches with If-None-Match when possible.
   */
  async loadAppRecord(appId: string): Promise<LoadAppRecordResult> {
    const url = buildAppRegistryRecordUrl(this.options.registryBaseUrl, appId);
    const now = Date.now();
    const existing = this.cache.get(appId);
    const stale =
      existing === undefined || now - existing.loadedAtMs >= this.options.pollIntervalMs;

    if (existing !== undefined && !stale) {
      return { ok: true, record: existing.record };
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => {
      controller.abort();
    }, this.options.fetchTimeoutMs);

    try {
      const headers: Record<string, string> = {
        Accept: 'application/json',
      };
      if (existing?.etag !== undefined) {
        headers['If-None-Match'] = existing.etag;
      }

      const res = await this.fetchImpl(url, {
        method: 'GET',
        headers,
        signal: controller.signal,
      });

      if (res.status === 304 && existing !== undefined) {
        this.cache.set(appId, {
          ...existing,
          loadedAtMs: now,
        });
        return { ok: true, record: existing.record };
      }

      if (res.status === 404) {
        return { ok: false, reason: 'not_found' };
      }

      if (!res.ok) {
        if (existing !== undefined) {
          this.cache.set(appId, { ...existing, loadedAtMs: now });
          return { ok: true, record: existing.record };
        }
        return { ok: false, reason: 'unavailable' };
      }

      const text = await res.text();
      let parsed: unknown;
      try {
        parsed = JSON.parse(text) as unknown;
      } catch {
        if (existing !== undefined) {
          return { ok: true, record: existing.record };
        }
        return { ok: false, reason: 'unavailable' };
      }

      const record = parsed as RegistryAppRecord;
      if (
        typeof record !== 'object' ||
        record === null ||
        typeof record.app_id !== 'string' ||
        record.app_id !== appId ||
        !Array.isArray(record.signing_keys)
      ) {
        if (existing !== undefined) {
          return { ok: true, record: existing.record };
        }
        return { ok: false, reason: 'unavailable' };
      }

      const etag = res.headers.get('etag') ?? undefined;
      this.cache.set(appId, {
        record,
        etag,
        loadedAtMs: now,
      });
      return { ok: true, record };
    } catch {
      if (existing !== undefined) {
        return { ok: true, record: existing.record };
      }
      return { ok: false, reason: 'unavailable' };
    } finally {
      clearTimeout(timeout);
    }
  }
}
