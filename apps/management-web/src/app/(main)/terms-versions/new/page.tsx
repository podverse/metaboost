import type { BreadcrumbItem } from '@metaboost/ui';

import { getTranslations } from 'next-intl/server';
import { redirect } from 'next/navigation';

import { Breadcrumbs, ContentPageLayout } from '@metaboost/ui';

import { ManagementBreadcrumbLink } from '../../../../components/ManagementBreadcrumbLink';
import { ResourcePageCard } from '../../../../components/ResourcePageCard';
import { TermsVersionForm } from '../../../../components/terms-versions/TermsVersionForm';
import { withDashboardBreadcrumb } from '../../../../lib/management-breadcrumbs';
import { ROUTES } from '../../../../lib/routes';
import { getServerUser } from '../../../../lib/server-auth';

export default async function NewTermsVersionPage() {
  const user = await getServerUser();
  if (user === null) {
    redirect(ROUTES.LOGIN);
  }
  if (user.isSuperAdmin !== true) {
    redirect(ROUTES.DASHBOARD);
  }

  const tCommon = await getTranslations('common');
  const breadcrumbItems: BreadcrumbItem[] = withDashboardBreadcrumb(tCommon('dashboard'), [
    { label: tCommon('termsVersions'), href: ROUTES.TERMS_VERSIONS },
    { label: tCommon('addTermsVersionTitle'), href: undefined },
  ]);

  return (
    <ContentPageLayout
      breadcrumbs={<Breadcrumbs items={breadcrumbItems} LinkComponent={ManagementBreadcrumbLink} />}
      contentMaxWidth="form"
    >
      <ResourcePageCard title={tCommon('addTermsVersionTitle')} skipContainer>
        <TermsVersionForm mode="create" />
      </ResourcePageCard>
    </ContentPageLayout>
  );
}
