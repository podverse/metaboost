import type { ManagementBucket } from '@metaboost/helpers-requests';
import type { CustomBucketRoleItem } from '@metaboost/helpers-requests';

import { getTranslations } from 'next-intl/server';
import { redirect, notFound } from 'next/navigation';

import { request } from '@metaboost/helpers-requests';
import { PageHeader } from '@metaboost/ui';

import { getServerManagementApiBaseUrl } from '../../../../../../../../config/env';
import { hasReadPermission } from '../../../../../../../../lib/main-nav';
import { ROUTES, bucketSettingsRolesRoute } from '../../../../../../../../lib/routes';
import { getServerUser } from '../../../../../../../../lib/server-auth';
import { getCookieHeader } from '../../../../../../../../lib/server-request';
import { BucketRoleFormClient } from '../../BucketRoleFormClient';

async function fetchBucket(id: string): Promise<ManagementBucket | null> {
  const cookieHeader = await getCookieHeader();
  const baseUrl = getServerManagementApiBaseUrl();
  const res = await request(baseUrl, `/buckets/${id}`, {
    headers: { Cookie: cookieHeader },
    cache: 'no-store',
  });
  if (!res.ok || res.data === undefined) return null;
  const data = res.data as { bucket?: ManagementBucket };
  return data.bucket ?? null;
}

async function fetchRole(bucketId: string, roleId: string): Promise<CustomBucketRoleItem | null> {
  const cookieHeader = await getCookieHeader();
  const baseUrl = getServerManagementApiBaseUrl();
  const res = await request(baseUrl, `/buckets/${bucketId}/roles`, {
    headers: { Cookie: cookieHeader },
    cache: 'no-store',
  });
  if (!res.ok || res.data === undefined) return null;
  const data = res.data as {
    roles?: Array<{
      id: string;
      isPredefined?: boolean;
      name?: string;
      bucketCrud: number;
      bucketMessagesCrud: number;
      bucketAdminsCrud: number;
    }>;
  };
  const roles = data.roles ?? [];
  const role = roles.find((r) => r.id === roleId);
  if (
    role === undefined ||
    role.isPredefined === true ||
    typeof role.name !== 'string' ||
    typeof role.bucketCrud !== 'number' ||
    typeof role.bucketMessagesCrud !== 'number' ||
    typeof role.bucketAdminsCrud !== 'number'
  ) {
    return null;
  }
  return {
    id: role.id,
    name: role.name,
    bucketCrud: role.bucketCrud,
    bucketMessagesCrud: role.bucketMessagesCrud,
    bucketAdminsCrud: role.bucketAdminsCrud,
    isPredefined: false,
    createdAt: '',
  };
}

export default async function EditBucketRolePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string; roleId: string }>;
  searchParams?: Promise<{ returnUrl?: string }>;
}) {
  const user = await getServerUser();
  if (user === null) redirect(ROUTES.LOGIN);

  const canUpdateBucketRoles =
    user.isSuperAdmin === true || hasReadPermission(user.permissions, 'bucketAdminsCrud');
  if (!canUpdateBucketRoles) notFound();

  const { id: bucketId, roleId } = await params;
  const bucket = await fetchBucket(bucketId);
  if (bucket === null) notFound();
  if (bucket.parentBucketId !== null) {
    redirect(bucketSettingsRolesRoute(bucket.parentBucketId));
  }

  const role = await fetchRole(bucketId, roleId);
  if (role === null) notFound();

  const resolvedSearch = searchParams !== undefined ? await searchParams : {};
  const returnUrl = resolvedSearch.returnUrl ?? bucketSettingsRolesRoute(bucketId);
  const successHref = returnUrl;
  const cancelHref = returnUrl;

  const t = await getTranslations('buckets');

  const labels = {
    roleName: t('roleName'),
    bucketPermissions: t('bucketPermissions'),
    bucketPermissionsInfo: t('bucketPermissionsInfo'),
    bucketMessagesPermissions: t('bucketMessagesPermissions'),
    adminPermissionsLabel: t('adminPermissionsLabel'),
    crudCreate: t('crudCreate'),
    crudRead: t('crudRead'),
    crudUpdate: t('crudUpdate'),
    crudDelete: t('crudDelete'),
    save: t('save'),
    cancel: t('cancel'),
  };

  async function handleSubmit(payload: {
    name: string;
    bucketCrud: number;
    bucketMessagesCrud: number;
    bucketAdminsCrud: number;
  }) {
    'use server';
    const cookieHeader = await getCookieHeader();
    const baseUrl = getServerManagementApiBaseUrl();
    const res = await request(baseUrl, `/buckets/${bucketId}/roles/${roleId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
      headers: { Cookie: cookieHeader },
    });
    if (!res.ok) {
      throw new Error(
        res.error !== undefined && typeof res.error.message === 'string'
          ? res.error.message
          : 'Failed to update role'
      );
    }
  }

  return (
    <>
      <PageHeader title={t('editRole')} />
      <BucketRoleFormClient
        mode="edit"
        bucketId={bucketId}
        roleId={roleId}
        initialName={role.name}
        initialBucketCrud={role.bucketCrud}
        initialMessageCrud={role.bucketMessagesCrud}
        initialAdminCrud={role.bucketAdminsCrud}
        labels={labels}
        submitRoleAction={handleSubmit}
        successHref={successHref}
        cancelHref={cancelHref}
      />
    </>
  );
}
