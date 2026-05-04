import { pingValkeyWithDisposableClient } from '@metaboost/helpers-valkey';

/**
 * One-shot Valkey reachability test used by /health/ready and startup readiness checks.
 */
export async function testValkeyConnection(): Promise<boolean> {
  return pingValkeyWithDisposableClient();
}
