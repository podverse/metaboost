import type { BreadcrumbItem } from '@metaboost/ui';

import { getTranslations } from 'next-intl/server';
import { redirect } from 'next/navigation';

import { Breadcrumbs, ContentPageLayout, Link } from '@metaboost/ui';

import { getCrudFlags, hasReadPermission } from '../../../../lib/main-nav';
import { ROUTES } from '../../../../lib/routes';
import { getServerUser } from '../../../../lib/server-auth';
import { ProductsMembershipClient } from './ProductsMembershipClient';

function BreadcrumbLink({
  href,
  children,
  className,
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}

export default async function ProductsMembershipPage() {
  const user = await getServerUser();

  if (user === null) {
    redirect(ROUTES.LOGIN);
  }

  const canRead =
    user.isSuperAdmin === true || hasReadPermission(user.permissions, 'billingPricesCrud');
  if (!canRead) {
    redirect(ROUTES.DASHBOARD);
  }

  const crud = getCrudFlags(user.isSuperAdmin === true, user.permissions, 'billingPricesCrud');
  const tCommon = await getTranslations('common');
  const t = await getTranslations('billingGovernance');
  const breadcrumbItems: BreadcrumbItem[] = [
    { label: tCommon('dashboard'), href: ROUTES.DASHBOARD },
    { label: t('pageTitle'), href: undefined },
  ];

  return (
    <ContentPageLayout
      breadcrumbs={<Breadcrumbs items={breadcrumbItems} LinkComponent={BreadcrumbLink} />}
      title={t('pageTitle')}
      contentMaxWidth="readable"
    >
      <ProductsMembershipClient crudFlags={crud} />
    </ContentPageLayout>
  );
}
