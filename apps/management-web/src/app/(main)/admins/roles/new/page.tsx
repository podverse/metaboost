import type { BreadcrumbItem } from '@metaboost/ui';

import { getTranslations } from 'next-intl/server';
import { redirect } from 'next/navigation';

import { resolveReturnUrlFromQuery } from '@metaboost/helpers';
import { Breadcrumbs, ContentPageLayout } from '@metaboost/ui';

import { AdminRoleForm } from '../../../../../components/admins/AdminRoleForm';
import { ManagementBreadcrumbLink } from '../../../../../components/ManagementBreadcrumbLink';
import { ResourcePageCard } from '../../../../../components/ResourcePageCard';
import { getCrudFlags } from '../../../../../lib/main-nav';
import { withDashboardBreadcrumb } from '../../../../../lib/management-breadcrumbs';
import { ROUTES } from '../../../../../lib/routes';
import { getServerUser } from '../../../../../lib/server-auth';

export default async function NewAdminRolePage({
  searchParams,
}: {
  searchParams?: Promise<{ returnUrl?: string }>;
}) {
  const user = await getServerUser();
  if (user === null) redirect(ROUTES.LOGIN);

  const crud = getCrudFlags(user.isSuperAdmin === true, user.permissions, 'adminsCrud');
  if (!crud.create) redirect(ROUTES.ADMINS);

  const tCommon = await getTranslations('common');
  const resolvedSearch = searchParams !== undefined ? await searchParams : {};
  const fallbackNavigationHref = ROUTES.ADMINS;
  const returnUrl = resolveReturnUrlFromQuery(resolvedSearch.returnUrl, fallbackNavigationHref);

  const breadcrumbItems: BreadcrumbItem[] = withDashboardBreadcrumb(tCommon('dashboard'), [
    { label: tCommon('admins'), href: ROUTES.ADMINS },
    { label: tCommon('addRoleTitle'), href: undefined },
  ]);

  return (
    <ContentPageLayout
      breadcrumbs={<Breadcrumbs items={breadcrumbItems} LinkComponent={ManagementBreadcrumbLink} />}
      contentMaxWidth="form"
    >
      <ResourcePageCard title={tCommon('addRoleTitle')} skipContainer>
        <AdminRoleForm
          returnUrl={returnUrl}
          cancelUrl={returnUrl}
          fallbackNavigationHref={fallbackNavigationHref}
        />
      </ResourcePageCard>
    </ContentPageLayout>
  );
}
