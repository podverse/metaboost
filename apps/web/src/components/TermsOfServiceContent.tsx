import { useTranslations } from 'next-intl';

import { Link, SectionWithHeading, Stack, Text } from '@metaboost/ui';

import { ROUTES } from '../lib/routes';

type TermsOfServiceContentProps = {
  legalName?: string;
};

export function TermsOfServiceContent({ legalName }: TermsOfServiceContentProps) {
  const t = useTranslations('termsContent');
  const resolvedLegalName =
    legalName !== undefined && legalName.trim() !== '' ? legalName : t('siteOwnerFallback');

  return (
    <Stack>
      <Text>
        {t('authoredBySentence', { legalName: resolvedLegalName })} {t('introGeneric')}
      </Text>

      <SectionWithHeading title={t('servicePurposeTitle')}>
        <Text>{t('servicePurposeBody')}</Text>
      </SectionWithHeading>

      <SectionWithHeading title={t('paymentsTitle')}>
        <Text>
          <strong>{t('bestEffortStrong')}</strong> {t('paymentsBodyAfterStrong')}
        </Text>
      </SectionWithHeading>

      <SectionWithHeading title={t('refundsTitle')}>
        <Text>{t('refundsBody')}</Text>
      </SectionWithHeading>

      <SectionWithHeading title={t('availabilityTitle')}>
        <Text>{t('availabilityBody')}</Text>
      </SectionWithHeading>

      <SectionWithHeading title={t('relatedGuidesTitle')}>
        <Text>
          {t.rich('relatedGuidesBody', {
            creatorsLink: (chunks) => <Link href={ROUTES.HOW_TO_CREATORS}>{chunks}</Link>,
            developersLink: (chunks) => <Link href={ROUTES.HOW_TO_DEVELOPERS}>{chunks}</Link>,
          })}
        </Text>
      </SectionWithHeading>
    </Stack>
  );
}
