import type { BreadcrumbItem } from '@metaboost/ui';

import { getTranslations } from 'next-intl/server';
import { redirect } from 'next/navigation';

import { Breadcrumbs, ContentPageLayout } from '@metaboost/ui';

import { ManagementBreadcrumbLink } from '../../../../components/ManagementBreadcrumbLink';
import { getCrudFlags, hasReadPermission } from '../../../../lib/main-nav';
import { withDashboardBreadcrumb } from '../../../../lib/management-breadcrumbs';
import { ROUTES } from '../../../../lib/routes';
import { getServerUser } from '../../../../lib/server-auth';
import { ProductsMembershipClient } from './ProductsMembershipClient';

export default async function ProductsMembershipPage() {
  const user = await getServerUser();

  if (user === null) {
    redirect(ROUTES.LOGIN);
  }

  const canRead =
    user.isSuperAdmin === true || hasReadPermission(user.permissions, 'billingPricesCrud');
  if (!canRead) {
    redirect(ROUTES.DASHBOARD);
  }

  const crud = getCrudFlags(user.isSuperAdmin === true, user.permissions, 'billingPricesCrud');
  const tCommon = await getTranslations('common');
  const t = await getTranslations('billingGovernance');
  const breadcrumbItems: BreadcrumbItem[] = withDashboardBreadcrumb(tCommon('dashboard'), [
    { label: t('pageTitle'), href: undefined },
  ]);

  return (
    <ContentPageLayout
      breadcrumbs={<Breadcrumbs items={breadcrumbItems} LinkComponent={ManagementBreadcrumbLink} />}
      title={t('pageTitle')}
      contentMaxWidth="readable"
    >
      <ProductsMembershipClient crudFlags={crud} />
    </ContentPageLayout>
  );
}
