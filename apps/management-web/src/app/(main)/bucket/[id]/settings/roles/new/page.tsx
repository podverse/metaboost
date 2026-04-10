import type { ManagementBucket } from '@metaboost/helpers-requests';

import { getTranslations } from 'next-intl/server';
import { redirect, notFound } from 'next/navigation';

import { request } from '@metaboost/helpers-requests';
import { PageHeader } from '@metaboost/ui';

import { getServerManagementApiBaseUrl } from '../../../../../../../config/env';
import { hasReadPermission } from '../../../../../../../lib/main-nav';
import { ROUTES, bucketSettingsRolesRoute } from '../../../../../../../lib/routes';
import { getServerUser } from '../../../../../../../lib/server-auth';
import { getCookieHeader } from '../../../../../../../lib/server-request';
import { BucketRoleFormClient } from '../BucketRoleFormClient';

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

export default async function NewBucketRolePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ returnUrl?: string }>;
}) {
  const user = await getServerUser();
  if (user === null) redirect(ROUTES.LOGIN);

  const canCreateBucketRoles =
    user.isSuperAdmin === true || hasReadPermission(user.permissions, 'bucketAdminsCrud');
  if (!canCreateBucketRoles) notFound();

  const { id: bucketId } = await params;
  const bucket = await fetchBucket(bucketId);
  if (bucket === null) notFound();
  if (bucket.parentBucketId !== null) {
    redirect(bucketSettingsRolesRoute(bucket.parentBucketId));
  }

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
    const res = await request(baseUrl, `/buckets/${bucketId}/roles`, {
      method: 'POST',
      body: JSON.stringify(payload),
      headers: { Cookie: cookieHeader },
    });
    if (!res.ok) {
      throw new Error(
        res.error !== undefined && typeof res.error.message === 'string'
          ? res.error.message
          : 'Failed to create role'
      );
    }
  }

  return (
    <>
      <PageHeader title={t('createRole')} />
      <BucketRoleFormClient
        mode="create"
        bucketId={bucketId}
        initialName=""
        initialBucketCrud={2}
        initialMessageCrud={2}
        initialAdminCrud={2}
        labels={labels}
        submitRoleAction={handleSubmit}
        successHref={successHref}
        cancelHref={cancelHref}
      />
    </>
  );
}
