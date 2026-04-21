import type { ManagementTermsVersion } from '@metaboost/helpers-requests';
import type { BreadcrumbItem } from '@metaboost/ui';

import { getTranslations } from 'next-intl/server';
import { notFound, redirect } from 'next/navigation';

import { request } from '@metaboost/helpers-requests';
import { Breadcrumbs, ContentPageLayout, Link, Stack } from '@metaboost/ui';

import { ResourcePageCard } from '../../../../../components/ResourcePageCard';
import { TermsVersionActions } from '../../../../../components/terms-versions/TermsVersionActions';
import { TermsVersionForm } from '../../../../../components/terms-versions/TermsVersionForm';
import { getServerManagementApiBaseUrl } from '../../../../../config/env';
import { ROUTES } from '../../../../../lib/routes';
import { getServerUser } from '../../../../../lib/server-auth';
import { getCookieHeader } from '../../../../../lib/server-request';

type EditTermsVersionPageProps = {
  params: Promise<{ id: string }>;
};

async function fetchTermsVersion(id: string): Promise<ManagementTermsVersion | null> {
  const cookieHeader = await getCookieHeader();
  const baseUrl = getServerManagementApiBaseUrl();
  try {
    const res = await request(baseUrl, `/terms-versions/${id}`, {
      headers: { Cookie: cookieHeader },
      cache: 'no-store',
    });
    if (!res.ok || res.data === undefined) {
      return null;
    }
    const data = res.data as { termsVersion?: ManagementTermsVersion };
    return data.termsVersion ?? null;
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

export default async function EditTermsVersionPage({ params }: EditTermsVersionPageProps) {
  const user = await getServerUser();
  if (user === null) {
    redirect(ROUTES.LOGIN);
  }
  if (user.isSuperAdmin !== true) {
    redirect(ROUTES.DASHBOARD);
  }

  const { id } = await params;
  const termsVersion = await fetchTermsVersion(id);
  if (termsVersion === null) {
    notFound();
  }
  const tCommon = await getTranslations('common');
  const itemLabel = `${termsVersion.versionKey} - ${termsVersion.title}`;
  const canEdit = termsVersion.status === 'draft' || termsVersion.status === 'upcoming';
  const breadcrumbItems: BreadcrumbItem[] = [
    { label: tCommon('termsVersions'), href: ROUTES.TERMS_VERSIONS },
    { label: itemLabel, href: undefined },
  ];

  return (
    <ContentPageLayout
      breadcrumbs={<Breadcrumbs items={breadcrumbItems} LinkComponent={BreadcrumbLink} />}
      contentMaxWidth="form"
    >
      <ResourcePageCard title={tCommon('editTermsVersionTitle', { name: itemLabel })} skipContainer>
        <Stack>
          <TermsVersionForm mode="edit" termsVersion={termsVersion} />
          <TermsVersionActions
            termsVersionId={termsVersion.id}
            status={termsVersion.status}
            canEdit={canEdit}
          />
        </Stack>
      </ResourcePageCard>
    </ContentPageLayout>
  );
}
