import { getTranslations } from 'next-intl/server';

import { ContentPageLayout, Link, SectionWithHeading, Stack, Text } from '@metaboost/ui';

import { getMbV1OpenApiSpecUrl, getMbrssV1OpenApiSpecUrl } from '../../../../config/env';
import { ROUTES } from '../../../../lib/routes';

export default async function HowToDevelopersPage() {
  const t = await getTranslations('howToDevelopers');
  const mbrssV1OpenApiSpecUrl = getMbrssV1OpenApiSpecUrl();
  const mbV1OpenApiSpecUrl = getMbV1OpenApiSpecUrl();

  return (
    <ContentPageLayout title={t('title')} contentMaxWidth="readable">
      <Stack>
        <Text>{t('intro')}</Text>

        <SectionWithHeading title={t('step1Title')}>
          <Text>{t('step1Body')}</Text>
        </SectionWithHeading>

        <SectionWithHeading title={t('step2Title')}>
          <Text>{t('step2Body')}</Text>
        </SectionWithHeading>

        <SectionWithHeading title={t('step3Title')}>
          <Text>{t('step3Body')}</Text>
        </SectionWithHeading>

        <SectionWithHeading title={t('step4Title')}>
          <Text>{t('step4Body')}</Text>
        </SectionWithHeading>

        <SectionWithHeading title={t('step5Title')}>
          <Text>{t('step5Body')}</Text>
        </SectionWithHeading>

        <SectionWithHeading title={t('policyTitle')}>
          <Text>
            {t('policyPrefix')} <Link href={ROUTES.TERMS}>{t('termsLinkLabel')}</Link>{' '}
            {t('policyMiddle')} <Link href={ROUTES.HOW_TO_CREATORS}>{t('creatorsLinkLabel')}</Link>
            {t('policyAnd')} <Link href={mbrssV1OpenApiSpecUrl}>{t('apiSpecLinkLabel')}</Link>{' '}
            {t('policyBetweenSpecs')}{' '}
            <Link href={mbV1OpenApiSpecUrl}>{t('mbV1ApiSpecLinkLabel')}</Link>
            {t('policySuffix')}
          </Text>
        </SectionWithHeading>
      </Stack>
    </ContentPageLayout>
  );
}
