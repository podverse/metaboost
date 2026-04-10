import type { MainAppUser } from '../../../../types/management-api';
import type { BreadcrumbItem } from '@metaboost/ui';

import { getTranslations } from 'next-intl/server';
import { redirect } from 'next/navigation';

import { request } from '@metaboost/helpers-requests';
import { Breadcrumbs, ContentPageLayout, Link } from '@metaboost/ui';

import { BucketForm } from '../../../../components/buckets/BucketForm';
import { ResourcePageCard } from '../../../../components/ResourcePageCard';
import { getServerManagementApiBaseUrl } from '../../../../config/env';
import { getCrudFlags } from '../../../../lib/main-nav';
import { ROUTES } from '../../../../lib/routes';
import { getServerUser } from '../../../../lib/server-auth';
import { getCookieHeader } from '../../../../lib/server-request';

type UsersResponse = { users: MainAppUser[] };

async function fetchUsers(): Promise<{ users: MainAppUser[] }> {
  const cookieHeader = await getCookieHeader();
  const baseUrl = getServerManagementApiBaseUrl();
  try {
    const res = await request(baseUrl, '/users', {
      headers: { Cookie: cookieHeader },
      cache: 'no-store',
    });
    if (!res.ok || res.data === undefined) return { users: [] };
    const data = res.data as UsersResponse;
    if (!Array.isArray(data?.users)) return { users: [] };
    return { users: data.users };
  } catch {
    return { users: [] };
  }
}

export default async function NewBucketPage() {
  const user = await getServerUser();

  if (user === null) {
    redirect(ROUTES.LOGIN);
  }

  const crud = getCrudFlags(user.isSuperAdmin === true, user.permissions, 'bucketsCrud');
  if (!crud.create) {
    redirect(ROUTES.BUCKETS);
  }

  const tCommon = await getTranslations('common');
  const { users } = await fetchUsers();
  const ownerOptions = users.map((u) => ({
    value: u.id,
    label: (u.displayName !== null && u.displayName !== '' ? u.displayName : u.email) ?? u.id,
  }));

  const breadcrumbItems: BreadcrumbItem[] = [
    { label: tCommon('buckets'), href: ROUTES.BUCKETS },
    { label: tCommon('addBucketTitle'), href: undefined },
  ];

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

  return (
    <ContentPageLayout
      breadcrumbs={<Breadcrumbs items={breadcrumbItems} LinkComponent={BreadcrumbLink} />}
      contentMaxWidth="form"
    >
      <ResourcePageCard title={tCommon('addBucketTitle')} skipContainer>
        <BucketForm mode="create" ownerOptions={ownerOptions} />
      </ResourcePageCard>
    </ContentPageLayout>
  );
}
