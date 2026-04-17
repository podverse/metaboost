import { describe, expect, it } from 'vitest';

import {
  buildAppRegistryRecordUrl,
  DEFAULT_S_ENDPOINT_REGISTRY_URL,
  normalizeRegistryBaseUrl,
  resolveSEndpointRegistryFromEnv,
} from '../config/sEndpointRegistry.js';

describe('sEndpointRegistry config', () => {
  it('uses default registry URL and timing when env keys are absent', () => {
    const r = resolveSEndpointRegistryFromEnv(() => undefined);
    expect(r.sEndpointRegistryUrl).toBe(DEFAULT_S_ENDPOINT_REGISTRY_URL);
    expect(r.sEndpointRegistryPollSeconds).toBe(300);
    expect(r.sEndpointRegistryTimeoutMs).toBe(10_000);
  });

  it('respects explicit env overrides', () => {
    const env: Record<string, string | undefined> = {
      S_ENDPOINT_REGISTRY_URL: 'https://example.com/registry/base/',
      S_ENDPOINT_REGISTRY_POLL_SECONDS: '60',
      S_ENDPOINT_REGISTRY_TIMEOUT_MS: '5000',
    };
    const r = resolveSEndpointRegistryFromEnv((k) => env[k]);
    expect(r.sEndpointRegistryUrl).toBe('https://example.com/registry/base');
    expect(r.sEndpointRegistryPollSeconds).toBe(60);
    expect(r.sEndpointRegistryTimeoutMs).toBe(5000);
  });

  it('buildAppRegistryRecordUrl appends <app_id>.app.json', () => {
    expect(buildAppRegistryRecordUrl('https://x.test/r/apps', 'podverse')).toBe(
      'https://x.test/r/apps/podverse.app.json'
    );
  });

  it('normalizeRegistryBaseUrl trims and strips trailing slash', () => {
    expect(normalizeRegistryBaseUrl('  https://h/p/  ')).toBe('https://h/p');
  });
});
