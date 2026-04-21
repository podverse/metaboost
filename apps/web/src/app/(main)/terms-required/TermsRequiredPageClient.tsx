'use client';

import { useTranslations } from 'next-intl';
import { useMemo } from 'react';

import { ContentPageLayout } from '@metaboost/ui';

import { TermsAcceptanceFlow } from '../../../components/terms/TermsAcceptanceFlow';
import { useAuth } from '../../../context/AuthContext';

export function TermsRequiredPageClient() {
  const t = useTranslations('termsGate');
  const { user } = useAuth();

  const actionableTerms = useMemo(() => {
    if (user?.upcomingTerms !== null && user?.upcomingTerms !== undefined) {
      return user.upcomingTerms;
    }
    return user?.currentTerms ?? null;
  }, [user?.currentTerms, user?.upcomingTerms]);

  return (
    <ContentPageLayout title={t('title')} contentMaxWidth="readable" constrainMainOnly>
      <TermsAcceptanceFlow terms={actionableTerms} />
    </ContentPageLayout>
  );
}
