import { redirect } from 'next/navigation';

import { Container } from '@metaboost/ui';

import { hasReadPermission } from '../../../lib/main-nav';
import { ROUTES } from '../../../lib/routes';
import { getServerUser } from '../../../lib/server-auth';
import { GlobalBlockedAppsClient } from './GlobalBlockedAppsClient';

export default async function GlobalBlockedAppsPage() {
  const user = await getServerUser();
  if (user === null) {
    redirect(ROUTES.LOGIN);
  }
  const canReadAdmins =
    user.isSuperAdmin === true || hasReadPermission(user.permissions, 'adminsCrud');
  if (!canReadAdmins) {
    redirect(ROUTES.DASHBOARD);
  }
  return (
    <Container>
      <GlobalBlockedAppsClient />
    </Container>
  );
}
