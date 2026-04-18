import { getLocale, getTranslations } from 'next-intl/server';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import { DEFAULT_PAGE_LIMIT } from '@metaboost/helpers';
import { formatDateTimeReadable } from '@metaboost/helpers-i18n/client';
import { request } from '@metaboost/helpers-requests';
import {
  Container,
  getSortPrefsFromCookieValue,
  getTableListStateEntryFromCookieValue,
  SectionWithHeading,
  Text,
} from '@metaboost/ui';

import { EventsListClientSection } from '../../../components/EventsListClientSection';
import { getServerManagementApiBaseUrl } from '../../../config/env';
import { TABLE_LIST_STATE_COOKIE_NAME, TABLE_SORT_PREFS_COOKIE_NAME } from '../../../lib/cookies';
import { ROUTES } from '../../../lib/routes';
import { getServerUser } from '../../../lib/server-auth';
import { getCookieHeader } from '../../../lib/server-request';

type EventItem = {
  id: string;
  actorId: string;
  actorType: string;
  actorDisplayName?: string | null;
  action: string;
  targetType: string | null;
  targetId: string | null;
  timestamp: string;
  details: string | null;
};

type EventsResponse = {
  events: EventItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

async function fetchEvents(
  page: number,
  limit: number,
  sort: string,
  search?: string,
  sortBy?: string,
  sortOrder?: string
): Promise<{ data: EventsResponse | null; error: string | null }> {
  const cookieHeader = await getCookieHeader();
  const baseUrl = getServerManagementApiBaseUrl();
  const params = new URLSearchParams();
  if (page > 1) params.set('page', String(page));
  if (limit !== DEFAULT_PAGE_LIMIT) params.set('limit', String(limit));
  if (sort === 'oldest') params.set('sort', 'oldest');
  if (sortBy !== undefined && sortBy.trim() !== '') params.set('sortBy', sortBy.trim());
  if (sortOrder === 'asc' || sortOrder === 'desc') params.set('sortOrder', sortOrder);
  if (search !== undefined && search !== '') params.set('search', search);
  const query = params.toString();
  const path = query ? `${ROUTES.EVENTS}?${query}` : ROUTES.EVENTS;

  try {
    const res = await request(baseUrl, path, {
      headers: { Cookie: cookieHeader },
      cache: 'no-store',
    });

    if (!res.ok) {
      return { data: null, error: 'Failed to load events' };
    }

    const data = res.data as EventsResponse | undefined;
    if (
      data === undefined ||
      !Array.isArray(data.events) ||
      typeof data.total !== 'number' ||
      typeof data.page !== 'number' ||
      typeof data.totalPages !== 'number'
    ) {
      return { data: null, error: null };
    }
    return { data, error: null };
  } catch {
    return { data: null, error: 'Failed to load events' };
  }
}

type PageProps = {
  searchParams?: Promise<{
    page?: string;
    limit?: string;
    sort?: string;
    sortBy?: string;
    sortOrder?: string;
    filterColumns?: string;
    search?: string;
  }>;
};

export default async function EventsPage({ searchParams }: PageProps) {
  const user = await getServerUser();

  if (user === null) {
    redirect(ROUTES.LOGIN);
  }

  const resolved = searchParams !== undefined ? await searchParams : {};
  const cookieStore = await cookies();
  const sortPrefsRaw = cookieStore.get(TABLE_SORT_PREFS_COOKIE_NAME)?.value;
  const listState = getTableListStateEntryFromCookieValue(
    cookieStore.get(TABLE_LIST_STATE_COOKIE_NAME)?.value,
    'events'
  );
  const cookieSort = getSortPrefsFromCookieValue(sortPrefsRaw, 'events');
  const page =
    resolved.page !== undefined && String(resolved.page).trim() !== ''
      ? Math.max(1, Number(resolved.page) || 1)
      : Math.max(1, listState?.page ?? 1);
  const limit = DEFAULT_PAGE_LIMIT;
  const sort =
    resolved.sort !== undefined
      ? resolved.sort === 'oldest'
        ? 'oldest'
        : 'recent'
      : listState?.timelineSort === 'oldest'
        ? 'oldest'
        : 'recent';
  const sortBy =
    resolved.sortBy !== undefined && resolved.sortBy.trim() !== ''
      ? resolved.sortBy.trim()
      : cookieSort?.sortBy;
  const sortOrder =
    resolved.sortOrder === 'asc' || resolved.sortOrder === 'desc'
      ? resolved.sortOrder
      : cookieSort?.sortOrder;
  const filterColumnsRaw =
    (resolved.filterColumns ?? '').trim() !== ''
      ? (resolved.filterColumns ?? '')
      : (listState?.filterColumns ?? '');
  const eventColumnIds = ['actor', 'action', 'target', 'details'];
  const initialFilterColumns =
    filterColumnsRaw.trim() === ''
      ? eventColumnIds
      : filterColumnsRaw
          .split(',')
          .map((s) => s.trim())
          .filter((id) => eventColumnIds.includes(id));
  const effectiveFilterColumns =
    initialFilterColumns.length > 0 ? initialFilterColumns : eventColumnIds;
  const search =
    resolved.search !== undefined && resolved.search !== ''
      ? resolved.search
      : (listState?.search ?? '');

  const locale = await getLocale();
  const tCommon = await getTranslations('common');
  const { data, error } = await fetchEvents(
    page,
    limit,
    sort,
    search === '' ? undefined : search,
    sortBy,
    sortOrder
  );

  const events = data?.events ?? [];
  const totalPages = data?.totalPages ?? 1;
  const currentPage = data?.page ?? 1;

  const tableRows = events.map((e) => {
    const actorName =
      e.actorDisplayName !== undefined && e.actorDisplayName !== null && e.actorDisplayName !== ''
        ? `${e.actorDisplayName} (${e.actorType})`
        : `${e.actorId} (${e.actorType})`;
    return {
      id: e.id,
      cells: {
        timestamp: formatDateTimeReadable(locale, e.timestamp),
        actor: actorName,
        action: e.action,
        target:
          [e.targetType, e.targetId]
            .filter((x) => x !== null && x !== undefined && x !== '')
            .join(' — ') || '—',
        details: e.details !== null && e.details !== '' ? e.details : '—',
      },
    };
  });

  const eventColumns = [
    {
      id: 'timestamp',
      label: tCommon('eventsTable.timestamp'),
      defaultSortOrder: 'desc' as const,
    },
    { id: 'actor', label: tCommon('eventsTable.actor'), defaultSortOrder: 'asc' as const },
    { id: 'action', label: tCommon('eventsTable.action'), defaultSortOrder: 'asc' as const },
    { id: 'target', label: tCommon('eventsTable.target'), defaultSortOrder: 'asc' as const },
    { id: 'details', label: tCommon('eventsTable.details'), defaultSortOrder: 'asc' as const },
  ];

  const currentQueryParams: Record<string, string> = {};
  if (page > 1) currentQueryParams.page = String(page);
  if (sort === 'oldest') currentQueryParams.sort = 'oldest';
  if (sortBy !== undefined && sortBy !== '') currentQueryParams.sortBy = sortBy;
  if (sortOrder !== undefined) currentQueryParams.sortOrder = sortOrder;
  if (filterColumnsRaw.trim() !== '') currentQueryParams.filterColumns = filterColumnsRaw;
  if (search !== '') currentQueryParams.search = search;

  return (
    <Container>
      <SectionWithHeading title={tCommon('events')}>
        {error !== null && (
          <Text variant="error" role="alert">
            {error}
          </Text>
        )}
        {error === null && (
          <EventsListClientSection
            locale={locale}
            tableRows={tableRows}
            emptyMessage={events.length === 0 ? tCommon('noEvents') : undefined}
            columns={eventColumns}
            initialFilterColumns={effectiveFilterColumns}
            initialSearch={search}
            basePath={ROUTES.EVENTS}
            currentQueryParams={currentQueryParams}
            currentPage={currentPage}
            totalPages={totalPages}
            limit={limit}
            defaultLimit={DEFAULT_PAGE_LIMIT}
            sort={sort}
            maxGoToPage={500}
            filterableColumnIds={['actor', 'action', 'target', 'details']}
            sortTimelineLabel={tCommon('eventsSort.label')}
            sortOptionLabels={{
              recent: tCommon('eventsSortOptions.recent'),
              oldest: tCommon('eventsSortOptions.oldest'),
            }}
          />
        )}
      </SectionWithHeading>
    </Container>
  );
}
