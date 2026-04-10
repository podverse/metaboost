import type { UserFormInitialValues } from '../../../../../components/users/UserForm';
import type { MainAppUser } from '../../../../../types/management-api';
import type { BreadcrumbItem } from '@boilerplate/ui';

import { getTranslations } from 'next-intl/server';
import { notFound, redirect } from 'next/navigation';

import { request } from '@boilerplate/helpers-requests';
import { Breadcrumbs, ContentPageLayout, Link } from '@boilerplate/ui';

import { ResourcePageCard } from '../../../../../components/ResourcePageCard';
import { getServerManagementApiBaseUrl } from '../../../../../config/env';
import { getCrudFlags } from '../../../../../lib/main-nav';
import { ROUTES, userViewRoute } from '../../../../../lib/routes';
import { getServerUser } from '../../../../../lib/server-auth';
import { getCookieHeader } from '../../../../../lib/server-request';
import { EditUserPageContent } from './EditUserPageContent';

type EditUserPageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ tab?: string }>;
};

async function fetchUser(id: string): Promise<{ user: MainAppUser } | null> {
  const cookieHeader = await getCookieHeader();
  const baseUrl = getServerManagementApiBaseUrl();
  try {
    const res = await request(baseUrl, `/users/${id}`, {
      headers: { Cookie: cookieHeader },
      cache: 'no-store',
    });
    if (!res.ok || res.data === undefined) return null;
    const data = res.data as { user?: MainAppUser };
    if (data.user === undefined) return null;
    return { user: data.user };
  } catch {
    return null;
  }
}

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

export default async function EditUserPage({ params, searchParams }: EditUserPageProps) {
  const user = await getServerUser();

  if (user === null) {
    redirect(ROUTES.LOGIN);
  }

  const crud = getCrudFlags(user.isSuperAdmin === true, user.permissions, 'usersCrud');
  if (!crud.update) {
    redirect(ROUTES.USERS);
  }

  const { id } = await params;
  const result = await fetchUser(id);
  if (result === null) {
    notFound();
  }

  const resolvedSearch = searchParams !== undefined ? await searchParams : {};
  const tabParam = resolvedSearch.tab;
  const activeTab: 'profile' | 'password' = tabParam === 'password' ? 'password' : 'profile';

  const mainUser = result.user;
  const initialValues: UserFormInitialValues = {
    email: mainUser.email ?? '',
    displayName: mainUser.displayName ?? '',
  };

  const tCommon = await getTranslations('common');

  const displayLabel = mainUser.displayName ?? mainUser.username ?? mainUser.email ?? id;
  const breadcrumbItems: BreadcrumbItem[] = [
    { label: tCommon('users'), href: ROUTES.USERS },
    { label: displayLabel, href: userViewRoute(id) },
    { label: tCommon('edit'), href: undefined },
  ];

  return (
    <ContentPageLayout
      breadcrumbs={<Breadcrumbs items={breadcrumbItems} LinkComponent={BreadcrumbLink} />}
      contentMaxWidth="form"
    >
      <ResourcePageCard
        title={tCommon('editUserTitle', {
          name: displayLabel,
        })}
        skipContainer
      >
        <EditUserPageContent userId={id} initialValues={initialValues} activeTab={activeTab} />
      </ResourcePageCard>
    </ContentPageLayout>
  );
}
