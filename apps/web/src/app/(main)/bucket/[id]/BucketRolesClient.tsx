'use client';

import type { BucketRoleItem, CustomBucketRoleItem } from '@metaboost/helpers-requests';

import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useState } from 'react';

import { bitmaskToFlags } from '@metaboost/helpers';
import { ButtonLink, CrudButtons, SectionWithHeading, Stack, Text } from '@metaboost/ui';

import { getApiBaseUrl } from '../../../../lib/api-client';
import { bucketSettingsRoleNewRoute, bucketSettingsRoleEditRoute } from '../../../../lib/routes';

import styles from './BucketRolesClient.module.scss';

function getRoleDisplayName(role: BucketRoleItem, tRoles: (key: string) => string): string {
  if (role.isPredefined && 'nameKey' in role) {
    const key = role.nameKey.split('.').pop();
    return key !== undefined ? tRoles(key) : role.nameKey;
  }
  return (role as CustomBucketRoleItem).name;
}

function formatCrud(mask: number, t: (key: string) => string): string {
  const flags = bitmaskToFlags(mask);
  const parts: string[] = [];
  if (flags.create) parts.push(t('crudCreate'));
  if (flags.read) parts.push(t('crudRead'));
  if (flags.update) parts.push(t('crudUpdate'));
  if (flags.delete) parts.push(t('crudDelete'));
  return parts.length > 0 ? parts.join(', ') : 'None';
}

export function BucketRolesClient({ bucketId }: { bucketId: string }) {
  const t = useTranslations('buckets');
  const tRoles = useTranslations('roles');
  const tCommon = useTranslations('common');
  const [roles, setRoles] = useState<BucketRoleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const baseUrl = getApiBaseUrl();
    const res = await fetch(`${baseUrl}/buckets/${bucketId}/roles`, {
      credentials: 'include',
      cache: 'no-store',
    });
    if (res.ok) {
      const data = await res.json().catch(() => ({}));
      const list = Array.isArray(data?.roles) ? data.roles : [];
      setRoles(list);
    }
    setLoading(false);
  }, [bucketId]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleDelete = useCallback(
    async (roleId: string) => {
      if (!confirm(t('deleteConfirmRole'))) return;
      setDeleteError(null);
      const baseUrl = getApiBaseUrl();
      const res = await fetch(`${baseUrl}/buckets/${bucketId}/roles/${roleId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (res.ok) {
        setRoles((prev) => prev.filter((r) => r.id !== roleId));
      } else {
        const data = await res.json().catch(() => ({}));
        setDeleteError(typeof data?.message === 'string' ? data.message : tCommon('loading'));
      }
    },
    [bucketId, t, tCommon]
  );

  if (loading) {
    return <Text variant="muted">{tCommon('loading')}</Text>;
  }

  const predefined = roles.filter((r) => r.isPredefined);
  const custom = roles.filter((r) => !r.isPredefined);
  const bucketsLabel = 'Buckets';
  const messagesLabel = 'Messages';
  const adminsLabel = 'Admins';

  return (
    <Stack>
      <SectionWithHeading
        title={t('roles')}
        headingAction={
          <ButtonLink href={bucketSettingsRoleNewRoute(bucketId)} variant="primary">
            {t('createRole')}
          </ButtonLink>
        }
      >
        <></>
      </SectionWithHeading>

      {predefined.length > 0 ? (
        <SectionWithHeading title={t('predefinedRoles')}>
          <ul className={styles.roleList}>
            {predefined.map((role) => (
              <li key={role.id} className={styles.roleItem}>
                <span className={styles.roleName}>{getRoleDisplayName(role, tRoles)}</span>
                <div>
                  <Text size="sm">
                    {adminsLabel}: {formatCrud(role.bucketAdminsCrud, t)}
                  </Text>
                  <Text size="sm">
                    {bucketsLabel}: {formatCrud(role.bucketCrud, t)}
                  </Text>
                  <Text size="sm">
                    {messagesLabel}: {formatCrud(role.bucketMessagesCrud, t)}
                  </Text>
                </div>
              </li>
            ))}
          </ul>
        </SectionWithHeading>
      ) : null}

      <SectionWithHeading title={t('customRoles')}>
        {custom.length === 0 ? (
          <Text variant="muted">{t('noCustomRolesYet')}</Text>
        ) : (
          <>
            {deleteError !== null ? (
              <Text variant="error" className={styles.errorMessage}>
                {deleteError}
              </Text>
            ) : null}
            <ul className={styles.roleList}>
              {(custom as CustomBucketRoleItem[]).map((role) => (
                <li key={role.id} className={styles.roleItem}>
                  <span className={styles.roleName}>{role.name}</span>
                  <div>
                    <Text size="sm">
                      {adminsLabel}: {formatCrud(role.bucketAdminsCrud, t)}
                    </Text>
                    <Text size="sm">
                      {bucketsLabel}: {formatCrud(role.bucketCrud, t)}
                    </Text>
                    <Text size="sm">
                      {messagesLabel}: {formatCrud(role.bucketMessagesCrud, t)}
                    </Text>
                  </div>
                  <CrudButtons
                    editHref={bucketSettingsRoleEditRoute(bucketId, role.id)}
                    onDelete={() => void handleDelete(role.id)}
                    editLabel={t('editRole')}
                    deleteLabel={t('deleteRole')}
                  />
                </li>
              ))}
            </ul>
          </>
        )}
      </SectionWithHeading>
    </Stack>
  );
}
