import type { CustomBucketRoleItem } from '@metaboost/helpers-requests';

import { getTranslations } from 'next-intl/server';
import { redirect, notFound } from 'next/navigation';

import { webBuckets } from '@metaboost/helpers-requests';
import { PageHeader } from '@metaboost/ui';

import { canEditBucketRoles } from '../../../../../../../../lib/bucket-authz';
import { fetchBucket, fetchBucketRoles } from '../../../../../../../../lib/buckets';
import { ROUTES, bucketSettingsRolesRoute } from '../../../../../../../../lib/routes';
import { getServerUser } from '../../../../../../../../lib/server-auth';
import { getCookieHeader, getServerApiBaseUrl } from '../../../../../../../../lib/server-request';
import { BucketRoleFormClient } from '../../../../BucketRoleFormClient';

async function updateRoleAction(
  bucketId: string,
  roleId: string,
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
  const res = await webBuckets.reqUpdateBucketRole(
    baseUrl,
    bucketId,
    roleId,
    payload,
    cookieHeader
  );
  if (!res.ok) {
    const message =
      res.error !== undefined && typeof res.error.message === 'string'
        ? res.error.message
        : 'Failed to update role';
    throw new Error(message);
  }
}

export default async function EditBucketRolePage({
  params,
}: {
  params: Promise<{ id: string; roleId: string }>;
}) {
  const user = await getServerUser();
  if (user === null) {
    redirect(ROUTES.LOGIN);
  }

  const { id: bucketId, roleId } = await params;
  const { bucket } = await fetchBucket(bucketId);
  if (bucket === null) notFound();
  if (bucket.parentBucketId !== null) {
    redirect(bucketSettingsRolesRoute(bucket.parentBucketId));
  }
  const canEditRoles = await canEditBucketRoles(bucket.id, bucket.ownerId, user);
  if (!canEditRoles) {
    notFound();
  }

  const roles = await fetchBucketRoles(bucketId);
  const role = roles.find((r) => r.id === roleId && !r.isPredefined);
  if (role === undefined) notFound();
  const customRole = role as CustomBucketRoleItem;

  const successHref = bucketSettingsRolesRoute(bucketId);
  const cancelHref = successHref;

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
      <PageHeader title={t('editRole')} />
      <BucketRoleFormClient
        mode="edit"
        bucketId={bucketId}
        roleId={roleId}
        initialName={customRole.name}
        initialBucketCrud={customRole.bucketCrud}
        initialMessageCrud={customRole.bucketMessagesCrud}
        initialAdminCrud={customRole.bucketAdminsCrud}
        labels={labels}
        submitRoleAction={updateRoleAction.bind(null, bucketId, roleId)}
        successHref={successHref}
        cancelHref={cancelHref}
      />
    </>
  );
}
