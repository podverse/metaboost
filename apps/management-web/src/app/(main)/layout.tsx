import { getTranslations } from 'next-intl/server';

import { Main } from '@metaboost/ui';

import { NavBar } from '../../components/NavBar';
import { getRuntimeConfig } from '../../config/runtime-config-store';
import { getVisibleNavItems } from '../../lib/main-nav';
import { ROUTES } from '../../lib/routes';
import { getServerUser } from '../../lib/server-auth';

export default async function MainLayout({ children }: { children: React.ReactNode }) {
  const user = await getServerUser();
  const runtimeConfig = getRuntimeConfig();
  const brandName =
    runtimeConfig.env.NEXT_PUBLIC_MANAGEMENT_WEB_BRAND_NAME ?? 'metaboost-management-web';
  const t = await getTranslations('common');
  const allNavItems = getVisibleNavItems(
    user?.isSuperAdmin === true,
    user?.permissions ?? null,
    (key) => t(key)
  );
  const mainNavItems = allNavItems.filter((item) => item.href !== ROUTES.DASHBOARD);
  return (
    <>
      <NavBar brandName={brandName} mainNavItems={mainNavItems} />
      <Main>{children}</Main>
    </>
  );
}
