import type { BreadcrumbItem } from '@metaboost/ui';

import { getTranslations } from 'next-intl/server';
import { redirect } from 'next/navigation';

import { Breadcrumbs, ContentPageLayout } from '@metaboost/ui';

import { ManagementBreadcrumbLink } from '../../../../components/ManagementBreadcrumbLink';
import { ResourcePageCard } from '../../../../components/ResourcePageCard';
import { UserForm } from '../../../../components/users/UserForm';
import { getCrudFlags } from '../../../../lib/main-nav';
import { withDashboardBreadcrumb } from '../../../../lib/management-breadcrumbs';
import { ROUTES } from '../../../../lib/routes';
import { getServerUser } from '../../../../lib/server-auth';

export default async function NewUserPage() {
  const user = await getServerUser();

  if (user === null) {
    redirect(ROUTES.LOGIN);
  }

  const crud = getCrudFlags(user.isSuperAdmin === true, user.permissions, 'usersCrud');
  if (!crud.create) {
    redirect(ROUTES.USERS);
  }

  const tCommon = await getTranslations('common');
  const breadcrumbItems: BreadcrumbItem[] = withDashboardBreadcrumb(tCommon('dashboard'), [
    { label: tCommon('users'), href: ROUTES.USERS },
    { label: tCommon('addUserTitle'), href: undefined },
  ]);

  return (
    <ContentPageLayout
      breadcrumbs={<Breadcrumbs items={breadcrumbItems} LinkComponent={ManagementBreadcrumbLink} />}
      contentMaxWidth="form"
    >
      <ResourcePageCard title={tCommon('addUserTitle')} skipContainer>
        <UserForm mode="create" />
      </ResourcePageCard>
    </ContentPageLayout>
  );
}
