'use client';

import { useTranslations } from 'next-intl';

import { ContentPageLayout } from '@metaboost/ui';

import { TermsAcceptanceFlow } from '../../../components/terms/TermsAcceptanceFlow';
import type { AuthTermsVersionPayload } from '../../../lib/auth-user';

export type TermsPageAcceptanceClientProps = {
  terms: AuthTermsVersionPayload;
};

/** Same acceptance UX as `/terms-required`: upcoming-only body + checkbox + more options. */
export function TermsPageAcceptanceClient({ terms }: TermsPageAcceptanceClientProps) {
  const t = useTranslations('termsGate');

  return (
    <ContentPageLayout title={t('title')} contentMaxWidth="readable" constrainMainOnly>
      <TermsAcceptanceFlow terms={terms} />
    </ContentPageLayout>
  );
}
