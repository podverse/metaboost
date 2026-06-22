'use client';

import { useTranslations } from 'next-intl';

import { AppErrorBoundary } from '@metaboost/ui';

type ErrorPageProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function Error({ error, reset }: ErrorPageProps) {
  const t = useTranslations('errors');

  return (
    <AppErrorBoundary
      error={error}
      reset={reset}
      onReload={() => {
        window.location.reload();
      }}
      onGoHome={() => {
        window.location.href = '/';
      }}
      strings={{
        boundaryTitle: t('boundary_title'),
        boundaryMessage: t('boundary_message'),
        detailsDevelopmentOnly: t('details_development_only'),
        tryAgain: t('try_again'),
        reloadPage: t('reload_page'),
        returnToHomePage: t('return_to_home_page'),
      }}
    />
  );
}
