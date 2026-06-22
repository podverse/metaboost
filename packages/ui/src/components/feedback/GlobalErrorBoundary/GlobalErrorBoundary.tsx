'use client';

import { useEffect, useState } from 'react';

import { ThemeWrapper } from '../../../contexts/ThemeContext/index';
import { Button } from '../../form/Button/Button';
import { CenterInViewport } from '../../layout/CenterInViewport/CenterInViewport';
import { Text } from '../../layout/Text/Text';

import styles from './GlobalErrorBoundary.module.scss';

export type GlobalErrorBoundaryProps = {
  settingsCookieName: string;
  /** Merged over `defaultStrings` after async load (typically `errors` from locale JSON). */
  loadStrings: () => Promise<Record<string, string>>;
  defaultStrings: Record<string, string>;
  error: Error & { digest?: string };
  reset: () => void;
  onReload?: () => void;
};

export function GlobalErrorBoundary({
  settingsCookieName,
  loadStrings,
  defaultStrings,
  error,
  reset,
  onReload,
}: GlobalErrorBoundaryProps) {
  const [tr, setTr] = useState<Record<string, string>>(defaultStrings);

  useEffect(() => {
    loadStrings()
      .then((next) => setTr({ ...defaultStrings, ...next }))
      .catch(() => {
        setTr(defaultStrings);
      });
  }, [defaultStrings, loadStrings]);

  const t = (key: string): string => {
    return tr[key] ?? key;
  };

  const handleReload = () => {
    if (onReload !== undefined) {
      onReload();
      return;
    }
    window.location.reload();
  };

  return (
    <html lang="en">
      <body>
        <ThemeWrapper settingsCookieName={settingsCookieName}>
          <CenterInViewport
            title={t('global_title')}
            contentMaxWidth="readable"
            contentTextAlign="center"
          >
            <div className={styles.root} data-testid="global-error-page">
              <Text>{t('global_message')}</Text>
              {process.env.NODE_ENV === 'development' && (
                <details className={styles.devDetails}>
                  <summary className={styles.devSummary}>{t('details_development_only')}</summary>
                  <pre className={styles.devPre}>
                    {error.toString()}
                    {error.stack !== undefined && error.stack !== '' ? `\n\n${error.stack}` : ''}
                    {error.digest !== undefined ? `\n\nDigest: ${error.digest}` : ''}
                  </pre>
                </details>
              )}
              <div className={styles.actions}>
                <Button onClick={reset} variant="primary">
                  {t('try_again')}
                </Button>
                <Button onClick={handleReload} variant="secondary">
                  {t('reload_page')}
                </Button>
              </div>
            </div>
          </CenterInViewport>
        </ThemeWrapper>
      </body>
    </html>
  );
}
