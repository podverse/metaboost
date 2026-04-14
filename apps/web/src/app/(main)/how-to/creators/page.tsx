import { getTranslations } from 'next-intl/server';

import { ContentPageLayout, Link, SectionWithHeading, Stack, Text } from '@metaboost/ui';

import { ROUTES } from '../../../../lib/routes';

export default async function HowToCreatorsPage() {
  const t = await getTranslations('howToCreators');

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
            {t('policyMiddle')}{' '}
            <Link href={ROUTES.HOW_TO_DEVELOPERS}>{t('developersLinkLabel')}</Link>
            {t('policyAnd')} <Link href={ROUTES.MB1_API_SPEC}>{t('apiSpecLinkLabel')}</Link>
            {t('policySuffix')}
          </Text>
        </SectionWithHeading>
      </Stack>
    </ContentPageLayout>
  );
}
