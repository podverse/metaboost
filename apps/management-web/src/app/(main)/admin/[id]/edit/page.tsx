import type { AdminFormInitialValues } from '../../../../../components/admins/AdminForm';
import type { ManagementUser } from '../../../../../types/management-api';
import type { BreadcrumbItem } from '@metaboost/ui';

import { getTranslations } from 'next-intl/server';
import { notFound, redirect } from 'next/navigation';

import { request } from '@metaboost/helpers-requests';
import { Breadcrumbs, ContentPageLayout, Link } from '@metaboost/ui';

import { AdminForm } from '../../../../../components/admins/AdminForm';
import { ResourcePageCard } from '../../../../../components/ResourcePageCard';
import { getServerManagementApiBaseUrl } from '../../../../../config/env';
import { getCrudFlags } from '../../../../../lib/main-nav';
import { ROUTES, adminViewRoute } from '../../../../../lib/routes';
import { getServerUser } from '../../../../../lib/server-auth';
import { getCookieHeader } from '../../../../../lib/server-request';

type EditAdminPageProps = {
  params: Promise<{ id: string }>;
};

async function fetchAdmin(id: string): Promise<{ admin: ManagementUser } | null> {
  const cookieHeader = await getCookieHeader();
  const baseUrl = getServerManagementApiBaseUrl();
  try {
    const res = await request(baseUrl, `/admins/${id}`, {
      headers: { Cookie: cookieHeader },
      cache: 'no-store',
    });
    if (!res.ok || res.data === undefined) return null;
    const data = res.data as { admin?: ManagementUser };
    if (data.admin === undefined) return null;
    return { admin: data.admin };
  } catch {
    return null;
  }
}

export default async function EditAdminPage({ params }: EditAdminPageProps) {
  const user = await getServerUser();

  if (user === null) {
    redirect(ROUTES.LOGIN);
  }

  const { id } = await params;
  const result = await fetchAdmin(id);
  if (result === null) {
    notFound();
  }

  const admin = result.admin;
  const crud = getCrudFlags(user.isSuperAdmin === true, user.permissions, 'adminsCrud');
  const canAccessEdit = crud.update || (admin.isSuperAdmin === true && user.id === id);
  if (!canAccessEdit) {
    redirect(ROUTES.ADMINS);
  }
  const initialValues: AdminFormInitialValues = {
    displayName: admin.displayName ?? '',
    username: admin.username,
    permissions: admin.permissions ?? null,
  };

  const canEditPermissions = crud.create || crud.update;

  const tCommon = await getTranslations('common');
  const adminLabel = admin.displayName ?? admin.username;
  const breadcrumbItems: BreadcrumbItem[] = [
    { label: tCommon('admins'), href: ROUTES.ADMINS },
    { label: adminLabel, href: adminViewRoute(id) },
    { label: tCommon('edit'), href: undefined },
  ];

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

  return (
    <ContentPageLayout
      breadcrumbs={<Breadcrumbs items={breadcrumbItems} LinkComponent={BreadcrumbLink} />}
      contentMaxWidth="form"
    >
      <ResourcePageCard title={tCommon('editAdminTitle', { name: adminLabel })} skipContainer>
        <AdminForm
          mode="edit"
          adminId={id}
          initialValues={initialValues}
          canEditPermissions={canEditPermissions}
          targetIsSuperAdmin={admin.isSuperAdmin}
        />
      </ResourcePageCard>
    </ContentPageLayout>
  );
}
