import type { RegistryAppRecord } from './types.js';

import { buildAppRegistryRecordUrl } from '../../config/standardEndpointRegistry.js';

export type LoadAppRecordFailureReason = 'not_found' | 'unavailable';

export type LoadAppRecordResult =
  | { ok: true; record: RegistryAppRecord }
  | { ok: false; reason: LoadAppRecordFailureReason };

type CacheEntry = {
  record: RegistryAppRecord;
  etag: string | undefined;
  loadedAtMs: number;
};

export type ListRegistryAppIdsResult =
  | { ok: true; appIds: string[] }
  | { ok: false; reason: 'unavailable' };

/**
 * Fetches `<base>/<app_id>.app.json` with per-app ETag and in-memory last-known-good cache.
 * On network error with no cache: fail closed (unavailable).
 */
export class AppRegistryService {
  private readonly cache = new Map<string, CacheEntry>();
  private appIdsCache:
    | {
        appIds: string[];
        loadedAtMs: number;
      }
    | undefined;

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
      this.addAppIdToCache(appId, now);
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

  private addAppIdToCache(appId: string, nowMs: number): void {
    if (this.appIdsCache === undefined) {
      this.appIdsCache = { appIds: [appId], loadedAtMs: nowMs };
      return;
    }
    if (!this.appIdsCache.appIds.includes(appId)) {
      this.appIdsCache.appIds.push(appId);
      this.appIdsCache.appIds.sort((a, b) => a.localeCompare(b));
    }
    this.appIdsCache.loadedAtMs = nowMs;
  }

  private resolveGithubContentsUrl(): string | null {
    let parsed: URL;
    try {
      parsed = new URL(this.options.registryBaseUrl);
    } catch {
      return null;
    }
    if (parsed.hostname !== 'raw.githubusercontent.com') {
      return null;
    }
    const parts = parsed.pathname.split('/').filter(Boolean);
    const [owner, repo, ref, ...rest] = parts;
    if (owner === undefined || repo === undefined || ref === undefined || rest.length === 0) {
      return null;
    }
    const encodedPath = rest.map((segment) => encodeURIComponent(segment)).join('/');
    return `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/contents/${encodedPath}?ref=${encodeURIComponent(ref)}`;
  }

  async listRegistryAppIds(): Promise<ListRegistryAppIdsResult> {
    const now = Date.now();
    const existing = this.appIdsCache;
    const stale =
      existing === undefined || now - existing.loadedAtMs >= this.options.pollIntervalMs;
    if (!stale && existing !== undefined) {
      return { ok: true, appIds: [...existing.appIds] };
    }

    const githubContentsUrl = this.resolveGithubContentsUrl();
    if (githubContentsUrl === null) {
      if (existing !== undefined) {
        return { ok: true, appIds: [...existing.appIds] };
      }
      const fromLoadedRecords = [...this.cache.keys()].sort((a, b) => a.localeCompare(b));
      if (fromLoadedRecords.length > 0) {
        this.appIdsCache = { appIds: fromLoadedRecords, loadedAtMs: now };
        return { ok: true, appIds: fromLoadedRecords };
      }
      return { ok: false, reason: 'unavailable' };
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => {
      controller.abort();
    }, this.options.fetchTimeoutMs);

    try {
      const res = await this.fetchImpl(githubContentsUrl, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          'User-Agent': 'metaboost-app-registry-client',
        },
        signal: controller.signal,
      });
      if (!res.ok) {
        if (existing !== undefined) {
          this.appIdsCache = { ...existing, loadedAtMs: now };
          return { ok: true, appIds: [...existing.appIds] };
        }
        return { ok: false, reason: 'unavailable' };
      }
      const parsed = (await res.json()) as unknown;
      if (!Array.isArray(parsed)) {
        if (existing !== undefined) {
          return { ok: true, appIds: [...existing.appIds] };
        }
        return { ok: false, reason: 'unavailable' };
      }
      const appIds = parsed
        .map((entry) => {
          if (typeof entry !== 'object' || entry === null) {
            return null;
          }
          const name = (entry as { name?: unknown }).name;
          if (typeof name !== 'string' || !name.endsWith('.app.json')) {
            return null;
          }
          return name.slice(0, -'.app.json'.length);
        })
        .filter((id): id is string => id !== null && id !== '')
        .sort((a, b) => a.localeCompare(b));
      this.appIdsCache = { appIds, loadedAtMs: now };
      return { ok: true, appIds };
    } catch {
      if (existing !== undefined) {
        return { ok: true, appIds: [...existing.appIds] };
      }
      return { ok: false, reason: 'unavailable' };
    } finally {
      clearTimeout(timeout);
    }
  }

  async listRegistryAppRecords(): Promise<
    | {
        ok: true;
        records: RegistryAppRecord[];
      }
    | {
        ok: false;
        reason: 'unavailable';
      }
  > {
    const listed = await this.listRegistryAppIds();
    if (!listed.ok) {
      return listed;
    }
    const records = (
      await Promise.all(
        listed.appIds.map(async (appId) => {
          const loaded = await this.loadAppRecord(appId);
          return loaded.ok ? loaded.record : null;
        })
      )
    )
      .filter((record): record is RegistryAppRecord => record !== null)
      .sort((a, b) => a.display_name.localeCompare(b.display_name));
    return { ok: true, records };
  }
}
