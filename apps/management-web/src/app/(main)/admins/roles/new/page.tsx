import { getTranslations } from 'next-intl/server';
import { redirect } from 'next/navigation';

import { AdminRoleForm } from '../../../../../components/admins/AdminRoleForm';
import { ResourcePageCard } from '../../../../../components/ResourcePageCard';
import { getCrudFlags } from '../../../../../lib/main-nav';
import { ROUTES } from '../../../../../lib/routes';
import { getServerUser } from '../../../../../lib/server-auth';

export default async function NewAdminRolePage({
  searchParams,
}: {
  searchParams?: Promise<{ returnUrl?: string }>;
}) {
  const user = await getServerUser();
  if (user === null) redirect(ROUTES.LOGIN);

  const crud = getCrudFlags(user.isSuperAdmin === true, user.permissions, 'adminsCrud');
  if (!crud.create) redirect(ROUTES.ADMINS);

  const tCommon = await getTranslations('common');
  const resolvedSearch = searchParams !== undefined ? await searchParams : {};
  const returnUrl = resolvedSearch.returnUrl ?? ROUTES.ADMINS;

  return (
    <ResourcePageCard title={tCommon('addRoleTitle')}>
      <AdminRoleForm returnUrl={returnUrl} cancelUrl={returnUrl} />
    </ResourcePageCard>
  );
}
