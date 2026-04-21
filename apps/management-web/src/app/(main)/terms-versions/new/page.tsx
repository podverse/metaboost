import type { BreadcrumbItem } from '@metaboost/ui';

import { getTranslations } from 'next-intl/server';
import { redirect } from 'next/navigation';

import { Breadcrumbs, ContentPageLayout, Link } from '@metaboost/ui';

import { ResourcePageCard } from '../../../../components/ResourcePageCard';
import { TermsVersionForm } from '../../../../components/terms-versions/TermsVersionForm';
import { ROUTES } from '../../../../lib/routes';
import { getServerUser } from '../../../../lib/server-auth';

function BreadcrumbLink({
  href,
  children,
  className,
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}

export default async function NewTermsVersionPage() {
  const user = await getServerUser();
  if (user === null) {
    redirect(ROUTES.LOGIN);
  }
  if (user.isSuperAdmin !== true) {
    redirect(ROUTES.DASHBOARD);
  }

  const tCommon = await getTranslations('common');
  const breadcrumbItems: BreadcrumbItem[] = [
    { label: tCommon('termsVersions'), href: ROUTES.TERMS_VERSIONS },
    { label: tCommon('addTermsVersionTitle'), href: undefined },
  ];

  return (
    <ContentPageLayout
      breadcrumbs={<Breadcrumbs items={breadcrumbItems} LinkComponent={BreadcrumbLink} />}
      contentMaxWidth="form"
    >
      <ResourcePageCard title={tCommon('addTermsVersionTitle')} skipContainer>
        <TermsVersionForm mode="create" />
      </ResourcePageCard>
    </ContentPageLayout>
  );
}
