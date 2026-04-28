'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useCallback, useEffect, useState } from 'react';

import {
  buildBucketAdminRoleOptions,
  managementWebBucketAdmins,
  managementWebBucketRoles,
  type ManagementBucketAdmin,
  type ManagementBucketAdminInvitation,
} from '@metaboost/helpers-requests';
import {
  BucketAdminsView,
  Text,
  type BucketAdminInvitationRow,
  type BucketAdminRoleOption,
  type BucketAdminRow,
} from '@metaboost/ui';

import { getManagementApiBaseUrl } from '../../../../../config/env';
import { getWebAppUrl } from '../../../../../config/env';
import {
  bucketSettingsAdminEditRoute,
  bucketSettingsAdminsRoute,
  bucketSettingsRoleNewRoute,
} from '../../../../../lib/routes';

function toAdminRow(a: ManagementBucketAdmin): BucketAdminRow {
  return {
    id: a.id,
    bucketId: a.bucketId,
    userId: a.userId,
    bucketCrud: a.bucketCrud,
    bucketMessagesCrud: a.bucketMessagesCrud,
    bucketAdminsCrud: a.bucketAdminsCrud,
    createdAt: a.createdAt,
    user: a.user,
  };
}

function toInvitationRow(inv: ManagementBucketAdminInvitation): BucketAdminInvitationRow {
  return {
    id: inv.id,
    token: inv.token,
    bucketCrud: inv.bucketCrud,
    bucketMessagesCrud: inv.bucketMessagesCrud,
    bucketAdminsCrud: inv.bucketAdminsCrud,
    status: inv.status,
    expiresAt: inv.expiresAt,
  };
}

function getDescriptionForRoleId(roleId: string, tRoles: (key: string) => string): string {
  if (roleId === 'everything') return tRoles('descriptionEverything');
  if (roleId === 'bucket_full') return tRoles('descriptionBucketFull');
  if (roleId === 'read_everything') return tRoles('descriptionReadEverything');
  if (roleId === 'bucket_read') return tRoles('descriptionBucketRead');
  return tRoles('descriptionCustomRole');
}

export function BucketAdminsClient({ bucketId, ownerId }: { bucketId: string; ownerId: string }) {
  const t = useTranslations('buckets');
  const tRoles = useTranslations('roles');
  const tCommon = useTranslations('common');
  const locale = useLocale();
  const baseUrl = getManagementApiBaseUrl();
  const [admins, setAdmins] = useState<BucketAdminRow[]>([]);
  const [pendingInvitations, setPendingInvitations] = useState<BucketAdminInvitationRow[]>([]);
  const [roles, setRoles] = useState<BucketAdminRoleOption[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const [adminsRes, invRes, rolesRes] = await Promise.all([
      managementWebBucketAdmins.listBucketAdmins(baseUrl, bucketId, null),
      managementWebBucketAdmins.listBucketAdminInvitations(baseUrl, bucketId, null),
      managementWebBucketRoles.listBucketRoles(baseUrl, bucketId, null),
    ]);
    if (adminsRes.ok && adminsRes.data !== undefined) {
      const bucketAdmins = adminsRes.data.admins;
      setAdmins(Array.isArray(bucketAdmins) ? bucketAdmins.map(toAdminRow) : []);
    }
    if (invRes.ok && invRes.data !== undefined) {
      setPendingInvitations(invRes.data.invitations.map(toInvitationRow));
    }
    if (rolesRes.ok && rolesRes.data !== undefined) {
      const apiRoles = rolesRes.data.roles;
      setRoles(
        buildBucketAdminRoleOptions(apiRoles, {
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
    }
    setLoading(false);
  }, [baseUrl, bucketId, tRoles]);

  useEffect(() => {
    void load();
  }, [load]);

  const labels = {
    addAdmin: t('addAdmin'),
    addAdminDescription: t('addAdminDescription'),
    bucketPermissions: t('bucketPermissions'),
    bucketPermissionsInfo: t('bucketPermissionsInfo'),
    bucketMessagesPermissions: t('bucketMessagesPermissions'),
    adminPermissionsLabel: t('adminPermissionsLabel'),
    crudCreate: t('crudCreate'),
    crudRead: t('crudRead'),
    crudUpdate: t('crudUpdate'),
    crudDelete: t('crudDelete'),
    noAdminsYet: t('noAdminsYet'),
    edit: t('edit'),
    delete: t('delete'),
    deleteConfirmAdmin: t('delete') + ' this admin?',
    deleteConfirmInvitation: t('delete') + ' this invitation?',
    owner: t('owner'),
    pendingInvitations: t('pendingInvitations'),
    invitationLink: t('invitationLink'),
    expires: t('expires'),
    inviteLinkCopy: t('inviteLinkCopy'),
    copy: t('copy'),
    copied: t('copied'),
    save: t('save'),
    cancel: t('cancel'),
  };

  const handleCreateInvitation = useCallback(
    async (body: {
      bucketCrud: number;
      bucketMessagesCrud: number;
      bucketAdminsCrud: number;
    }): Promise<{ token: string } | { error: string }> => {
      const res = await managementWebBucketAdmins.createBucketAdminInvitation(
        baseUrl,
        bucketId,
        body,
        null
      );
      if (!res.ok) {
        return {
          error: res.error !== undefined ? res.error.message : 'Failed to create invitation',
        };
      }
      if (res.data === undefined) return { error: 'Invalid response' };
      const inv = res.data.invitation;
      setPendingInvitations((prev) => [...prev, toInvitationRow(inv)]);
      return { token: inv.token };
    },
    [baseUrl, bucketId]
  );

  const handleDeleteAdmin = useCallback(
    async (adminUserId: string) => {
      const res = await managementWebBucketAdmins.deleteBucketAdmin(
        baseUrl,
        bucketId,
        adminUserId,
        null
      );
      if (res.ok) {
        setAdmins((prev) => prev.filter((a) => (a.user?.idText ?? a.userId) !== adminUserId));
        return { ok: true as const };
      }
      return {
        ok: false as const,
        error:
          res.error !== undefined && typeof res.error.message === 'string'
            ? res.error.message
            : 'Failed to remove admin',
      };
    },
    [baseUrl, bucketId]
  );

  const handleDeleteInvitation = useCallback(
    async (invitationId: string) => {
      const res = await managementWebBucketAdmins.deleteBucketAdminInvitation(
        baseUrl,
        bucketId,
        invitationId,
        null
      );
      if (res.ok) {
        setPendingInvitations((prev) => prev.filter((i) => i.id !== invitationId));
        return { ok: true as const };
      }
      return {
        ok: false as const,
        error:
          res.error !== undefined && typeof res.error.message === 'string'
            ? res.error.message
            : 'Failed to remove invitation',
      };
    },
    [baseUrl, bucketId]
  );

  const webBase = getWebAppUrl();
  const getInviteLinkUrl = useCallback(
    (token: string) => {
      const base = webBase !== undefined && webBase !== '' ? webBase.replace(/\/$/, '') : '';
      return base !== '' ? `${base}/invite/${token}` : `/invite/${token}`;
    },
    [webBase]
  );

  if (loading) {
    return <Text variant="muted">{tCommon('loading')}</Text>;
  }

  const createNewRoleHref = bucketSettingsRoleNewRoute(
    bucketId,
    bucketSettingsAdminsRoute(bucketId)
  );

  return (
    <BucketAdminsView
      admins={admins}
      pendingInvitations={pendingInvitations}
      ownerId={ownerId}
      labels={labels}
      onCreateInvitation={handleCreateInvitation}
      onDeleteAdmin={handleDeleteAdmin}
      onDeleteInvitation={handleDeleteInvitation}
      getEditHref={(userId) => bucketSettingsAdminEditRoute(bucketId, userId)}
      getInviteLinkUrl={getInviteLinkUrl}
      locale={locale}
      roleOptions={roles}
      createNewRoleHref={createNewRoleHref}
      roleSelectLabel={t('roles')}
      createNewRoleOptionLabel={t('customRole')}
    />
  );
}
