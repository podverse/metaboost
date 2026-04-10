import { getTranslations } from 'next-intl/server';
import { redirect, notFound } from 'next/navigation';

import { webBuckets } from '@boilerplate/helpers-requests';
import { PageHeader } from '@boilerplate/ui';

import { canCreateBucketRoles } from '../../../../../../../lib/bucket-authz';
import { fetchBucket } from '../../../../../../../lib/buckets';
import { ROUTES, bucketSettingsRolesRoute } from '../../../../../../../lib/routes';
import { getServerUser } from '../../../../../../../lib/server-auth';
import { getCookieHeader, getServerApiBaseUrl } from '../../../../../../../lib/server-request';
import { BucketRoleFormClient } from '../../../BucketRoleFormClient';

async function createRoleAction(
  bucketId: string,
  payload: {
    name: string;
    bucketCrud: number;
    bucketMessagesCrud: number;
    bucketAdminsCrud: number;
  }
): Promise<void> {
  'use server';
  const cookieHeader = await getCookieHeader();
  const baseUrl = getServerApiBaseUrl();
  const res = await webBuckets.reqCreateBucketRole(baseUrl, bucketId, payload, cookieHeader);
  if (!res.ok) {
    const message =
      res.error !== undefined && typeof res.error.message === 'string'
        ? res.error.message
        : 'Failed to create role';
    throw new Error(message);
  }
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

  const { id: bucketId } = await params;
  const { bucket } = await fetchBucket(bucketId);
  if (bucket === null) notFound();
  if (bucket.parentBucketId !== null) {
    redirect(bucketSettingsRolesRoute(bucket.parentBucketId));
  }
  const canCreateRoles = await canCreateBucketRoles(bucket.id, bucket.ownerId, user);
  if (!canCreateRoles) {
    notFound();
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

  return (
    <>
      <PageHeader title={t('createRole')} />
      <BucketRoleFormClient
        mode="create"
        bucketId={bucketId}
        initialName=""
        initialBucketCrud={15}
        initialMessageCrud={15}
        initialAdminCrud={15}
        labels={labels}
        submitRoleAction={createRoleAction.bind(null, bucketId)}
        successHref={successHref}
        cancelHref={cancelHref}
      />
    </>
  );
}
