import { TermsVersionService } from '@metaboost/orm';

/**
 * Ensures `terms_version` has an active or applicable scheduled row before HTTP listeners start.
 */
export async function validateTermsVersionReady(): Promise<void> {
  await TermsVersionService.assertConfiguredForStartup();
}
