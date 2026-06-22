'use client';

import { useCallback } from 'react';

import '@fortawesome/fontawesome-free/css/all.min.css';
import { extractErrorsStringsFromMessagesDefault, GlobalErrorBoundary } from '@metaboost/ui';

import '../styles/globals.scss';

const SETTINGS_COOKIE_NAME = 'management-settings';

const DEFAULT_ERROR_STRINGS: Record<string, string> = {
  global_title: 'Application error',
  global_message: 'A critical error occurred. Please refresh the page.',
  details_development_only: 'Error details (development only)',
  try_again: 'Try again',
  reload_page: 'Reload page',
};

type GlobalErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  const loadStrings = useCallback(async () => {
    try {
      const localeCookie =
        document.cookie
          .split('; ')
          .find((row) => row.startsWith('NEXT_LOCALE='))
          ?.split('=')[1] || 'en-US';

      const messages = await import(`../../i18n/originals/${localeCookie}.json`);
      return extractErrorsStringsFromMessagesDefault(messages.default);
    } catch {
      try {
        const messages = await import('../../i18n/originals/en-US.json');
        return extractErrorsStringsFromMessagesDefault(messages.default);
      } catch {
        return {};
      }
    }
  }, []);

  return (
    <GlobalErrorBoundary
      settingsCookieName={SETTINGS_COOKIE_NAME}
      loadStrings={loadStrings}
      defaultStrings={DEFAULT_ERROR_STRINGS}
      error={error}
      reset={reset}
    />
  );
}
