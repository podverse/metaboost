import {
  DEFAULT_TERMS_LOCALIZED_CONTENT,
  DEFAULT_TERMS_TITLE,
  DEFAULT_TERMS_VERSION_KEY,
  TermsVersionService,
} from '@metaboost/orm';

import { config } from '../../config/index.js';

/**
 * Ensures `terms_version` has a current or applicable upcoming row before HTTP listeners start.
 */
export async function validateTermsVersionReady(): Promise<void> {
  await TermsVersionService.assertConfiguredForStartup(new Date(), {
    defaultEnforcementStartsAt: config.latestTermsEnforcementStartsAt,
    defaultVersionKey: DEFAULT_TERMS_VERSION_KEY,
    defaultTitle: DEFAULT_TERMS_TITLE,
    defaultLocalizedContent: DEFAULT_TERMS_LOCALIZED_CONTENT,
  });
}
