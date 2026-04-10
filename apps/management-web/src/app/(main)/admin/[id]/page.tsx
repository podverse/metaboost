import type { ManagementUser } from '../../../../types/management-api';
import type { CrudBit } from '@metaboost/helpers';

import { getTranslations } from 'next-intl/server';
import { notFound, redirect } from 'next/navigation';

import { bitmaskToFlags } from '@metaboost/helpers';
import { request } from '@metaboost/helpers-requests';
import { ButtonLink, FormActions, Stack, Text } from '@metaboost/ui';

import { ResourcePageCard } from '../../../../components/ResourcePageCard';
import { getServerManagementApiBaseUrl } from '../../../../config/env';
import { getCrudFlags, hasReadPermission } from '../../../../lib/main-nav';
import { ROUTES, adminEditRoute } from '../../../../lib/routes';
import { getServerUser } from '../../../../lib/server-auth';
import { getCookieHeader } from '../../../../lib/server-request';

type ViewAdminPageProps = {
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

export default async function ViewAdminPage({ params }: ViewAdminPageProps) {
  const user = await getServerUser();

  if (user === null) {
    redirect(ROUTES.LOGIN);
  }

  const canReadAdmins =
    user.isSuperAdmin === true || hasReadPermission(user.permissions, 'adminsCrud');
  if (!canReadAdmins) {
    redirect(ROUTES.ADMINS);
  }

  const { id } = await params;
  const result = await fetchAdmin(id);
  if (result === null) {
    notFound();
  }

  const admin = result.admin;
  const crud = getCrudFlags(user.isSuperAdmin === true, user.permissions, 'adminsCrud');
  const canEdit = crud.update || (admin.isSuperAdmin === true && user.id === id);

  const tCommon = await getTranslations('common');
  const tForm = await getTranslations('common.adminForm');

  const crudLabels: Record<CrudBit, string> = {
    create: tForm('crudCreate'),
    read: tForm('crudRead'),
    update: tForm('crudUpdate'),
    delete: tForm('crudDelete'),
  };

  function formatCrudFlags(mask: number): string {
    const flags = bitmaskToFlags(mask);
    const set = (Object.entries(flags) as [CrudBit, boolean][])
      .filter(([, v]) => v)
      .map(([k]) => crudLabels[k]);
    return set.length > 0 ? set.join(', ') : '—';
  }

  return (
    <ResourcePageCard
      title={tCommon('viewAdminTitle', { name: admin.displayName ?? admin.username })}
    >
      <Stack>
        <Text>
          <strong>{tCommon('adminsTable.displayName')}:</strong> {admin.displayName ?? '—'}
        </Text>
        <Text>
          <strong>{tCommon('adminsTable.username')}:</strong> {admin.username}
        </Text>
        {admin.isSuperAdmin !== true &&
          admin.permissions !== undefined &&
          admin.permissions !== null && (
            <>
              <Text>
                <strong>{tForm('adminsCrud')}:</strong>{' '}
                {formatCrudFlags(admin.permissions.adminsCrud)}
              </Text>
              <Text>
                <strong>{tForm('usersCrud')}:</strong>{' '}
                {formatCrudFlags(admin.permissions.usersCrud)}
              </Text>
              <Text>
                <strong>{tForm('eventVisibility')}:</strong> {admin.permissions.eventVisibility}
              </Text>
            </>
          )}
        {admin.isSuperAdmin === true && <Text>{tCommon('viewAdminSuperAdminNote')}</Text>}
        <FormActions>
          <ButtonLink href={ROUTES.ADMINS} variant="secondary">
            {tCommon('adminForm.cancel')}
          </ButtonLink>
          {canEdit && (
            <ButtonLink href={adminEditRoute(id)} variant="primary">
              {tCommon('adminsTable.edit')}
            </ButtonLink>
          )}
        </FormActions>
      </Stack>
    </ResourcePageCard>
  );
}
