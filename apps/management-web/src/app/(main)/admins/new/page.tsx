import type { BreadcrumbItem } from '@metaboost/ui';

import { getTranslations } from 'next-intl/server';
import { redirect } from 'next/navigation';

import { Breadcrumbs, ContentPageLayout, Link } from '@metaboost/ui';

import { AdminForm } from '../../../../components/admins/AdminForm';
import { ResourcePageCard } from '../../../../components/ResourcePageCard';
import { getCrudFlags } from '../../../../lib/main-nav';
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

export default async function NewAdminPage() {
  const user = await getServerUser();

  if (user === null) {
    redirect(ROUTES.LOGIN);
  }

  const crud = getCrudFlags(user.isSuperAdmin === true, user.permissions, 'adminsCrud');
  if (!crud.create) {
    redirect(ROUTES.ADMINS);
  }

  const canEditPermissions = crud.create || crud.update;

  const tCommon = await getTranslations('common');
  const breadcrumbItems: BreadcrumbItem[] = [
    { label: tCommon('admins'), href: ROUTES.ADMINS },
    { label: tCommon('addAdminTitle'), href: undefined },
  ];

  return (
    <ContentPageLayout
      breadcrumbs={<Breadcrumbs items={breadcrumbItems} LinkComponent={BreadcrumbLink} />}
      contentMaxWidth="form"
    >
      <ResourcePageCard title={tCommon('addAdminTitle')} skipContainer>
        <AdminForm mode="create" canEditPermissions={canEditPermissions} />
      </ResourcePageCard>
    </ContentPageLayout>
  );
}
