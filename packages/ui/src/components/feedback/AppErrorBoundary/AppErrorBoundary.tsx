'use client';

import { Button } from '../../form/Button/Button';
import { CenterInViewport } from '../../layout/CenterInViewport/CenterInViewport';
import { Text } from '../../layout/Text/Text';

import styles from './AppErrorBoundary.module.scss';

export type AppErrorBoundaryStrings = {
  boundaryTitle: string;
  boundaryMessage: string;
  detailsDevelopmentOnly: string;
  tryAgain: string;
  reloadPage: string;
  returnToHomePage: string;
};

export type AppErrorBoundaryProps = {
  error: Error & { digest?: string };
  reset: () => void;
  onReload: () => void;
  onGoHome: () => void;
  strings: AppErrorBoundaryStrings;
};

export function AppErrorBoundary({
  error,
  reset,
  onReload,
  onGoHome,
  strings,
}: AppErrorBoundaryProps) {
  return (
    <CenterInViewport
      title={strings.boundaryTitle}
      contentMaxWidth="readable"
      contentTextAlign="center"
    >
      <div className={styles.root} data-testid="error-page">
        <Text>{strings.boundaryMessage}</Text>
        {process.env.NODE_ENV === 'development' && (
          <details className={styles.devDetails}>
            <summary className={styles.devSummary}>{strings.detailsDevelopmentOnly}</summary>
            <pre className={styles.devPre}>
              {error.toString()}
              {error.stack !== undefined && error.stack !== '' ? `\n\n${error.stack}` : ''}
              {error.digest !== undefined ? `\n\nDigest: ${error.digest}` : ''}
            </pre>
          </details>
        )}
        <div className={styles.actions}>
          <Button onClick={reset} variant="primary">
            {strings.tryAgain}
          </Button>
          <Button onClick={onReload} variant="secondary">
            {strings.reloadPage}
          </Button>
          <Button onClick={onGoHome} variant="link">
            {strings.returnToHomePage}
          </Button>
        </div>
      </div>
    </CenterInViewport>
  );
}
