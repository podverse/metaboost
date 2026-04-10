'use client';

import type { EditBucketAdminFormPayload } from '@boilerplate/ui';
import type { BucketAdminRoleOption } from '@boilerplate/ui';

import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

import { buildBucketAdminRoleOptions, type BucketRoleItem } from '@boilerplate/helpers-requests';
import { EditBucketAdminForm } from '@boilerplate/ui';

import { getApiBaseUrl } from '../../../../lib/api-client';
import { bucketSettingsAdminsRoute, bucketSettingsRoleNewRoute } from '../../../../lib/routes';

function getDescriptionForRoleId(roleId: string, tRoles: (key: string) => string): string {
  if (roleId === 'everything') return tRoles('descriptionEverything');
  if (roleId === 'bucket_full') return tRoles('descriptionBucketFull');
  if (roleId === 'read_everything') return tRoles('descriptionReadEverything');
  if (roleId === 'bucket_read') return tRoles('descriptionBucketRead');
  return tRoles('descriptionCustomRole');
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
  const router = useRouter();
  const [roleOptions, setRoleOptions] = useState<BucketAdminRoleOption[]>([]);
  const [loading, setLoading] = useState(true);

  const loadRoles = useCallback(async () => {
    setLoading(true);
    const baseUrl = getApiBaseUrl();
    const res = await fetch(`${baseUrl}/buckets/${bucketId}/roles`, {
      credentials: 'include',
      cache: 'no-store',
    });
    if (!res.ok) {
      setLoading(false);
      return;
    }
    const data = await res.json().catch(() => ({}));
    const roleList = Array.isArray(data?.roles) ? (data.roles as BucketRoleItem[]) : [];
    setRoleOptions(
      buildBucketAdminRoleOptions(roleList, {
        getLabel(role) {
          if (role.isPredefined && 'nameKey' in role) {
            const key = role.nameKey.split('.').pop();
            return key !== undefined ? tRoles(key) : role.nameKey;
          }
          return role.name;
        },
        getDescription(roleId) {
          return getDescriptionForRoleId(roleId, tRoles);
        },
      })
    );
    setLoading(false);
  }, [bucketId, tRoles]);

  useEffect(() => {
    void loadRoles();
  }, [loadRoles]);

  const labels = {
    roleSelectLabel: t('roles'),
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
    const baseUrl = getApiBaseUrl();
    const res = await fetch(`${baseUrl}/buckets/${bucketId}/admins/${userId}`, {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(typeof data?.message === 'string' ? data.message : 'Failed to update admin');
    }
  };

  if (loading) return null;

  return (
    <EditBucketAdminForm
      initialBucketCrud={initialBucketCrud}
      initialMessageCrud={initialMessageCrud}
      initialAdminCrud={initialAdminCrud}
      roleOptions={roleOptions}
      createNewRoleHref={bucketSettingsRoleNewRoute(bucketId, bucketSettingsAdminsRoute(bucketId))}
      labels={labels}
      onSubmit={handleSubmit}
      successHref={successHref}
      cancelHref={cancelHref}
      onSuccess={() => router.push(successHref)}
      readOnly={readOnly}
    />
  );
}
