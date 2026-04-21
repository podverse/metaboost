'use client';

import { useTranslations } from 'next-intl';

import { mergeTableListStateInCookie, Select, useCookieModeListRefresh } from '@metaboost/ui';

import { TABLE_LIST_STATE_COOKIE_NAME } from '../lib/cookies';

export type EventsSortSelectProps = {
  sort: string;
  label?: string;
  /** Translated labels for options; keys: recent, oldest. */
  sortOptionLabels?: { recent: string; oldest: string };
  /** When set, used instead of router.refresh() after cookie write (async list refresh). */
  onListMetadataChange?: () => Promise<void>;
};

export function EventsSortSelect({
  sort,
  label,
  sortOptionLabels,
  onListMetadataChange,
}: EventsSortSelectProps) {
  const t = useTranslations('common');
  const { afterCookieListMutation } = useCookieModeListRefresh(onListMetadataChange);
  const effectiveLabel = label ?? t('eventsSort.label');
  const effectiveSortOptionLabels = sortOptionLabels ?? {
    recent: t('eventsSortOptions.recent'),
    oldest: t('eventsSortOptions.oldest'),
  };

  const value = sort === 'oldest' ? 'oldest' : 'recent';
  const options = [
    { value: 'recent', label: effectiveSortOptionLabels.recent },
    { value: 'oldest', label: effectiveSortOptionLabels.oldest },
  ];

  const handleChange = (newValue: string) => {
    mergeTableListStateInCookie(TABLE_LIST_STATE_COOKIE_NAME, 'events', {
      timelineSort: newValue === 'oldest' ? 'oldest' : 'recent',
      page: 1,
    });
    void afterCookieListMutation();
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
