'use client';

import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';

import { Select } from '@boilerplate/ui';

import { ROUTES } from '../lib/routes';

function buildEventsUrl(params: {
  sort: string;
  limit: number;
  defaultLimit: number;
  page?: number;
}): string {
  const search = new URLSearchParams();
  if (params.sort !== 'recent') search.set('sort', params.sort);
  if (params.limit !== params.defaultLimit) search.set('limit', String(params.limit));
  if (params.page !== undefined && params.page > 1) search.set('page', String(params.page));
  const q = search.toString();
  return q ? `${ROUTES.EVENTS}?${q}` : ROUTES.EVENTS;
}

export type EventsSortSelectProps = {
  sort: string;
  limit: number;
  defaultLimit: number;
  label?: string;
  /** Translated labels for options; keys: recent, oldest. */
  sortOptionLabels?: { recent: string; oldest: string };
};

export function EventsSortSelect({
  sort,
  limit,
  defaultLimit,
  label,
  sortOptionLabels,
}: EventsSortSelectProps) {
  const t = useTranslations('common');
  const effectiveLabel = label ?? t('eventsSort.label');
  const effectiveSortOptionLabels = sortOptionLabels ?? {
    recent: t('eventsSortOptions.recent'),
    oldest: t('eventsSortOptions.oldest'),
  };

  const router = useRouter();
  const value = sort === 'oldest' ? 'oldest' : 'recent';
  const options = [
    { value: 'recent', label: effectiveSortOptionLabels.recent },
    { value: 'oldest', label: effectiveSortOptionLabels.oldest },
  ];

  const handleChange = (newValue: string) => {
    const url = buildEventsUrl({
      sort: newValue,
      limit,
      defaultLimit,
      page: 1,
    });
    router.push(url);
  };

  return (
    <Select
      options={options}
      value={value}
      onChange={handleChange}
      aria-label={effectiveLabel}
      sizeToSelected
    />
  );
}
