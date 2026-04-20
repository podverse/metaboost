import { describe, expect, it } from 'vitest';

import {
  buildAppRegistryRecordUrl,
  DEFAULT_STANDARD_ENDPOINT_REGISTRY_URL,
  normalizeRegistryBaseUrl,
  resolveStandardEndpointRegistryFromEnv,
} from '../config/standardEndpointRegistry.js';

describe('standardEndpointRegistry config', () => {
  it('uses default registry URL and timing when env keys are absent', () => {
    const r = resolveStandardEndpointRegistryFromEnv(() => undefined);
    expect(r.standardEndpointRegistryUrl).toBe(DEFAULT_STANDARD_ENDPOINT_REGISTRY_URL);
    expect(r.standardEndpointRegistryPollSeconds).toBe(300);
    expect(r.standardEndpointRegistryTimeoutMs).toBe(10_000);
  });

  it('respects explicit env overrides', () => {
    const env: Record<string, string | undefined> = {
      STANDARD_ENDPOINT_REGISTRY_URL: 'https://example.com/registry/base/',
      STANDARD_ENDPOINT_REGISTRY_POLL_SECONDS: '60',
      STANDARD_ENDPOINT_REGISTRY_TIMEOUT_MS: '5000',
    };
    const r = resolveStandardEndpointRegistryFromEnv((k) => env[k]);
    expect(r.standardEndpointRegistryUrl).toBe('https://example.com/registry/base');
    expect(r.standardEndpointRegistryPollSeconds).toBe(60);
    expect(r.standardEndpointRegistryTimeoutMs).toBe(5000);
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
