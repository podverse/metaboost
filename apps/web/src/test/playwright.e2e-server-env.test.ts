import { describe, expect, it } from 'vitest';

import { buildE2eWebApiEnvPrefix } from '../../playwright.e2e-server-env';

describe('playwright.e2e-server-env', () => {
  it('uses test DB/Valkey ports and skips dotenv loading for API webServer', () => {
    const prefix = buildE2eWebApiEnvPrefix('admin_only_username');

    expect(prefix).toContain('API_SKIP_DOTENV=1');
    expect(prefix).toContain('DB_PORT=5632');
    expect(prefix).toContain('KEYVALDB_PORT=6579');
    expect(prefix).toContain('METABOOST_E2E_RSS_ALLOW_LOOPBACK=1');
  });

  it('includes mailer env only for email auth modes', () => {
    const adminOnlyUsernamePrefix = buildE2eWebApiEnvPrefix('admin_only_username');
    const adminOnlyEmailPrefix = buildE2eWebApiEnvPrefix('admin_only_email');

    expect(adminOnlyUsernamePrefix).toContain('MAILER_USER=');
    expect(adminOnlyUsernamePrefix).toContain('MAILER_PASSWORD=');
    expect(adminOnlyEmailPrefix).toContain('MAILER_HOST=localhost');
    expect(adminOnlyEmailPrefix).toContain('MAILER_PORT=1025');
  });
});
