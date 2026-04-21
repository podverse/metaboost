import type {
  ManagementTermsVersion,
  TermsVersionLifecycleStatus,
} from '@metaboost/helpers-requests';

import { getTranslations } from 'next-intl/server';
import { redirect } from 'next/navigation';

import { request } from '@metaboost/helpers-requests';
import { FilterTablePageLayout, Stack } from '@metaboost/ui';

import { TermsVersionsTableWithFilter } from '../../../components/TermsVersionsTableWithFilter';
import { getManagementApiBaseUrl, getServerManagementApiBaseUrl } from '../../../config/env';
import { parseFilterColumns } from '../../../lib/parseFilterColumns';
import { ROUTES } from '../../../lib/routes';
import { getServerUser } from '../../../lib/server-auth';
import { getCookieHeader } from '../../../lib/server-request';

type TermsVersionsResponse = {
  termsVersions: ManagementTermsVersion[];
};

type PageProps = {
  searchParams?: Promise<{
    filterColumns?: string;
    search?: string;
    sortBy?: string;
    sortOrder?: string;
  }>;
};

async function fetchTermsVersions(): Promise<{
  data: TermsVersionsResponse | null;
  error: string | null;
}> {
  const cookieHeader = await getCookieHeader();
  const baseUrl = getServerManagementApiBaseUrl();
  try {
    const res = await request(baseUrl, '/terms-versions', {
      headers: { Cookie: cookieHeader },
      cache: 'no-store',
    });
    if (!res.ok) {
      return { data: null, error: 'Failed to load terms versions' };
    }
    const data = res.data as TermsVersionsResponse | undefined;
    if (data === undefined || !Array.isArray(data.termsVersions)) {
      return { data: null, error: null };
    }
    return { data, error: null };
  } catch {
    return { data: null, error: 'Failed to load terms versions' };
  }
}

function statusWeight(status: TermsVersionLifecycleStatus): number {
  if (status === 'current') return 0;
  if (status === 'upcoming') return 1;
  if (status === 'draft') return 2;
  return 3;
}

export default async function TermsVersionsPage({ searchParams }: PageProps) {
  const user = await getServerUser();
  if (user === null) {
    redirect(ROUTES.LOGIN);
  }
  if (user.isSuperAdmin !== true) {
    redirect(ROUTES.DASHBOARD);
  }

  const resolved = searchParams !== undefined ? await searchParams : {};
  const tCommon = await getTranslations('common');
  const { data, error } = await fetchTermsVersions();
  const termsVersions = data?.termsVersions ?? [];

  const validColumns = ['versionKey', 'title', 'status', 'contentHash'];
  const effectiveFilterColumns = parseFilterColumns(
    { filterColumns: resolved.filterColumns },
    validColumns
  );
  const search = resolved.search?.trim() ?? '';

  const normalizedSearch = search.toLowerCase();
  const filtered = termsVersions.filter((termsVersion) => {
    if (normalizedSearch === '') {
      return true;
    }
    const valuesByColumn: Record<string, string> = {
      versionKey: termsVersion.versionKey,
      title: termsVersion.title,
      status: termsVersion.status,
      contentHash: termsVersion.contentHash,
    };
    return effectiveFilterColumns.some((column) =>
      valuesByColumn[column]?.toLowerCase().includes(normalizedSearch)
    );
  });

  const sortBy = (resolved.sortBy ?? 'enforcementStartsAt').trim();
  const sortOrder: 'asc' | 'desc' = resolved.sortOrder === 'asc' ? 'asc' : 'desc';

  const sorted = [...filtered].sort((left, right) => {
    const direction = sortOrder === 'asc' ? 1 : -1;
    if (sortBy === 'versionKey') {
      return left.versionKey.localeCompare(right.versionKey) * direction;
    }
    if (sortBy === 'title') {
      return left.title.localeCompare(right.title) * direction;
    }
    if (sortBy === 'status') {
      return (statusWeight(left.status) - statusWeight(right.status)) * direction;
    }
    if (sortBy === 'announcementStartsAt') {
      const leftValue =
        left.announcementStartsAt === null ? 0 : Date.parse(left.announcementStartsAt);
      const rightValue =
        right.announcementStartsAt === null ? 0 : Date.parse(right.announcementStartsAt);
      return (leftValue - rightValue) * direction;
    }
    if (sortBy === 'enforcementStartsAt') {
      return (
        (Date.parse(left.enforcementStartsAt) - Date.parse(right.enforcementStartsAt)) * direction
      );
    }
    return (
      (Date.parse(left.enforcementStartsAt) - Date.parse(right.enforcementStartsAt)) * direction
    );
  });

  const tableRows = sorted.map((version) => ({
    id: version.id,
    cells: {
      versionKey: version.versionKey,
      title: version.title,
      status: tCommon(`termsVersionStatus.${version.status}`),
      statusRaw: version.status,
      contentHash: version.contentHash,
      announcementStartsAt:
        version.announcementStartsAt === null
          ? '—'
          : new Date(version.announcementStartsAt).toLocaleString(),
      enforcementStartsAt: new Date(version.enforcementStartsAt).toLocaleString(),
    },
  }));

  const columns = [
    {
      id: 'versionKey',
      label: tCommon('termsVersionsTable.versionKey'),
      defaultSortOrder: 'asc' as const,
    },
    { id: 'title', label: tCommon('termsVersionsTable.title'), defaultSortOrder: 'asc' as const },
    { id: 'status', label: tCommon('termsVersionsTable.status'), defaultSortOrder: 'asc' as const },
    {
      id: 'announcementStartsAt',
      label: tCommon('termsVersionsTable.announcementStartsAt'),
      defaultSortOrder: 'desc' as const,
    },
    {
      id: 'enforcementStartsAt',
      label: tCommon('termsVersionsTable.enforcementStartsAt'),
      defaultSortOrder: 'desc' as const,
    },
  ];

  const currentQueryParams: Record<string, string> = {};
  if ((resolved.filterColumns ?? '').trim() !== '') {
    currentQueryParams.filterColumns = resolved.filterColumns ?? '';
  }
  if (search !== '') {
    currentQueryParams.search = search;
  }
  if (sortBy !== '') {
    currentQueryParams.sortBy = sortBy;
  }
  currentQueryParams.sortOrder = sortOrder;

  return (
    <FilterTablePageLayout
      title={tCommon('termsVersions')}
      error={error !== null ? tCommon('failedToLoadTermsVersions') : undefined}
      errorVariant="error"
    >
      {error === null && (
        <Stack>
          <TermsVersionsTableWithFilter
            tableRows={tableRows}
            emptyMessage={tableRows.length === 0 ? tCommon('noTermsVersions') : undefined}
            columns={columns}
            initialFilterColumns={effectiveFilterColumns}
            initialSearch={search}
            basePath={ROUTES.TERMS_VERSIONS}
            currentQueryParams={currentQueryParams}
            canUpdateTermsVersion
            termsApiBaseUrl={getManagementApiBaseUrl()}
            addTermsVersionHref={ROUTES.TERMS_VERSIONS_NEW}
          />
        </Stack>
      )}
    </FilterTablePageLayout>
  );
}
