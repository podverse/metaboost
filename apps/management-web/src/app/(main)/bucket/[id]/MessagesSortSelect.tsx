'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';

import {
  getMessagesSortFromCookie,
  SelectMenuDropdown,
  setMessagesSortInCookie,
} from '@metaboost/ui';

function buildMessagesUrl(params: {
  basePath: string;
  sort: string;
  queryParams?: Record<string, string>;
}): string {
  const search = new URLSearchParams();
  if (params.queryParams !== undefined) {
    for (const [k, v] of Object.entries(params.queryParams)) {
      if (v !== undefined && v !== '') search.set(k, v);
    }
  }
  if (params.sort !== 'recent') search.set('sort', params.sort);
  search.set('page', '1');
  const q = search.toString();
  return q !== '' ? `${params.basePath}?${q}` : params.basePath;
}

export type MessagesSortSelectProps = {
  sort: string;
  basePath: string;
  queryParams?: Record<string, string>;
  label: string;
  sortOptionLabels: { recent: string; oldest: string };
  /** When set, messages sort (recent/oldest) is persisted and restored when URL has no sort. */
  sortPrefsCookieName?: string;
};

export function MessagesSortSelect({
  sort,
  basePath,
  queryParams,
  label,
  sortOptionLabels,
  sortPrefsCookieName,
}: MessagesSortSelectProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const value = sort === 'oldest' ? 'oldest' : 'recent';
  const options = [
    { value: 'recent', label: sortOptionLabels.recent },
    { value: 'oldest', label: sortOptionLabels.oldest },
  ];

  useEffect(() => {
    if (
      sortPrefsCookieName === undefined ||
      sortPrefsCookieName.trim() === '' ||
      searchParams.get('sort') !== null
    ) {
      return;
    }
    const saved = getMessagesSortFromCookie(sortPrefsCookieName);
    if (saved === 'oldest') {
      router.replace(buildMessagesUrl({ basePath, sort: 'oldest', queryParams }));
    }
  }, [sortPrefsCookieName, basePath, queryParams, searchParams, router]);

  const handleChange = (newValue: string) => {
    if (sortPrefsCookieName !== undefined && sortPrefsCookieName.trim() !== '') {
      setMessagesSortInCookie(sortPrefsCookieName, newValue === 'oldest' ? 'oldest' : 'recent');
    }
    const url = buildMessagesUrl({
      basePath,
      sort: newValue,
      queryParams,
    });
    router.push(url);
  };

  return (
    <SelectMenuDropdown
      options={options}
      value={value}
      onChange={handleChange}
      aria-label={label}
    />
  );
}
