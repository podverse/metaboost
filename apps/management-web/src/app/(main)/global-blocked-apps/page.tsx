import type { BreadcrumbItem } from '@metaboost/ui';

import { getTranslations } from 'next-intl/server';
import { redirect } from 'next/navigation';

import { Breadcrumbs, Container, Stack } from '@metaboost/ui';

import { ManagementBreadcrumbLink } from '../../../components/ManagementBreadcrumbLink';
import { hasReadPermission } from '../../../lib/main-nav';
import { withDashboardBreadcrumb } from '../../../lib/management-breadcrumbs';
import { ROUTES } from '../../../lib/routes';
import { getServerUser } from '../../../lib/server-auth';
import { GlobalBlockedAppsClient } from './GlobalBlockedAppsClient';

export default async function GlobalBlockedAppsPage() {
  const user = await getServerUser();
  if (user === null) {
    redirect(ROUTES.LOGIN);
  }
  const canReadAdmins =
    user.isSuperAdmin === true || hasReadPermission(user.permissions, 'adminsCrud');
  if (!canReadAdmins) {
    redirect(ROUTES.DASHBOARD);
  }
  const tCommon = await getTranslations('common');
  const listBreadcrumbs: BreadcrumbItem[] = withDashboardBreadcrumb(tCommon('dashboard'), [
    { label: tCommon('globalBlockedApps'), href: undefined },
  ]);
  return (
    <Container>
      <Stack>
        <Breadcrumbs items={listBreadcrumbs} LinkComponent={ManagementBreadcrumbLink} />
        <GlobalBlockedAppsClient />
      </Stack>
    </Container>
  );
}
