'use client';

import type { EditBucketAdminFormPayload } from '@boilerplate/ui';
import type { BucketAdminRoleOption } from '@boilerplate/ui';

import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

import {
  managementWebBucketAdmins,
  managementWebBucketRoles,
  type BucketRoleItem,
} from '@boilerplate/helpers-requests';
import { EditBucketAdminForm, Text } from '@boilerplate/ui';

import { getManagementApiBaseUrl } from '../../../../config/env';
import { bucketSettingsRoleNewRoute } from '../../../../lib/routes';

function roleToOption(
  role: BucketRoleItem,
  tRoles: (key: string) => string
): BucketAdminRoleOption {
  const id = role.id;
  const label =
    role.isPredefined && 'nameKey' in role
      ? (() => {
          const key = role.nameKey.split('.').pop();
          return key !== undefined ? tRoles(key) : role.nameKey;
        })()
      : 'name' in role
        ? role.name
        : id;
  return {
    id,
    label,
    description:
      id === 'everything'
        ? tRoles('descriptionEverything')
        : id === 'bucket_full'
          ? tRoles('descriptionBucketFull')
          : id === 'read_everything'
            ? tRoles('descriptionReadEverything')
            : id === 'bucket_read'
              ? tRoles('descriptionBucketRead')
              : tRoles('descriptionCustomRole'),
    bucketCrud: role.bucketCrud,
    bucketMessagesCrud: role.bucketMessagesCrud,
    bucketAdminsCrud: role.bucketAdminsCrud,
  };
}

export function EditBucketAdminFormClient({
  bucketId,
  userId,
  initialBucketCrud,
  initialMessageCrud,
  initialAdminCrud,
  successHref,
  cancelHref,
  readOnly = false,
}: {
  bucketId: string;
  userId: string;
  initialBucketCrud: number;
  initialMessageCrud: number;
  initialAdminCrud: number;
  successHref: string;
  cancelHref: string;
  readOnly?: boolean;
}) {
  const t = useTranslations('buckets');
  const tRoles = useTranslations('roles');
  const tCommon = useTranslations('common');
  const router = useRouter();
  const baseUrl = getManagementApiBaseUrl();
  const [roleOptions, setRoleOptions] = useState<BucketAdminRoleOption[]>([]);
  const [loading, setLoading] = useState(true);

  const loadRoles = useCallback(async () => {
    const res = await managementWebBucketRoles.listBucketRoles(baseUrl, bucketId, null);
    if (res.ok && res.data !== undefined) {
      setRoleOptions(res.data.roles.map((r) => roleToOption(r, tRoles)));
    }
    setLoading(false);
  }, [baseUrl, bucketId, tRoles]);

  useEffect(() => {
    void loadRoles();
  }, [loadRoles]);

  const labels = {
    roleSelectLabel: t('roles'),
    customRoleLabel: t('customRoleLabel'),
    createRoleOptionLabel: t('customRole'),
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

  const handleSubmit = async (payload: EditBucketAdminFormPayload) => {
    const res = await managementWebBucketAdmins.updateBucketAdmin(
      baseUrl,
      bucketId,
      userId,
      payload,
      null
    );
    if (!res.ok) {
      throw new Error(res.error !== undefined ? res.error.message : 'Failed to update admin');
    }
  };

  if (loading) {
    return <Text variant="muted">{tCommon('loading')}</Text>;
  }

  return (
    <EditBucketAdminForm
      initialBucketCrud={initialBucketCrud}
      initialMessageCrud={initialMessageCrud}
      initialAdminCrud={initialAdminCrud}
      roleOptions={roleOptions}
      createNewRoleHref={readOnly ? undefined : bucketSettingsRoleNewRoute(bucketId, successHref)}
      labels={labels}
      onSubmit={handleSubmit}
      successHref={successHref}
      cancelHref={cancelHref}
      onSuccess={() => router.push(successHref)}
      readOnly={readOnly}
    />
  );
}
